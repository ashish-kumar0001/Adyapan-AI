const logplease = require('logplease');
const { v4: uuidv4 } = require('uuid');
const cp = require('child_process');
const path = require('path');
const config = require('./config');
const fs = require('fs/promises');
const globals = require('./globals');

const job_states = {
    READY: Symbol('Ready to be primed'),
    PRIMED: Symbol('Primed and ready for execution'),
    EXECUTED: Symbol('Executed and ready for cleanup'),
};

let box_id = 0;
const get_next_box_id = () => ++box_id;

let remaining_job_spaces = config.max_concurrent_jobs;
let job_queue = [];

class Job {
    #dirty_boxes;
    constructor({
        runtime,
        files,
        args,
        stdin,
        timeouts,
        cpu_times,
        memory_limits,
    }) {
        this.uuid = uuidv4();
        this.logger = logplease.create(`job/${this.uuid}`);
        this.runtime = runtime;
        this.files = files.map((file, i) => ({
            name: file.name || `file${i}.code`,
            content: file.content,
            encoding: ['base64', 'hex', 'utf8'].includes(file.encoding)
                ? file.encoding
                : 'utf8',
        }));
        this.args = args;
        this.stdin = stdin;
        if (this.stdin.slice(-1) !== '\n') {
            this.stdin += '\n';
        }
        this.timeouts = timeouts;
        this.cpu_times = cpu_times;
        this.memory_limits = memory_limits;
        this.state = job_states.READY;
        this.#dirty_boxes = [];
    }

    async #create_box() {
        const id = get_next_box_id();
        const dir = `/piston/boxes/box-${id}`;
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
        await fs.mkdir(dir, { recursive: true });
        const box = { id, dir };
        this.#dirty_boxes.push(box);
        return box;
    }

    async prime() {
        if (remaining_job_spaces < 1) {
            this.logger.info(`Awaiting job slot`);
            await new Promise(resolve => {
                job_queue.push(resolve);
            });
        }
        this.logger.info(`Priming job`);
        remaining_job_spaces--;

        const box = await this.#create_box();

        this.logger.debug(`Creating submission files`);
        const submission_dir = path.join(box.dir, 'submission');
        await fs.mkdir(submission_dir);
        for (const file of this.files) {
            const file_path = path.join(submission_dir, file.name);
            const rel = path.relative(submission_dir, file_path);
            if (rel.startsWith('..'))
                throw Error(`File path "${file.name}" tries to escape parent directory: ${rel}`);
            const file_content = Buffer.from(file.content, file.encoding);
            await fs.mkdir(path.dirname(file_path), { recursive: true, mode: 0o700 });
            await fs.writeFile(file_path, file_content);
        }

        this.state = job_states.PRIMED;
        this.logger.debug('Primed job');
        return box;
    }

    async safe_call(
        box,
        file,
        args,
        timeout,
        cpu_time,
        memory_limit,
        event_bus = null
    ) {
        let stdout = '';
        let stderr = '';
        let output = '';
        let memory = null;
        let code = null;
        let signal = null;
        let message = null;
        let status = null;
        let cpu_time_stat = null;
        let wall_time_stat = null;

        const pkg_bin = path.join(this.runtime.pkgdir, 'bin');
        const existing_path = process.env.PATH || '/usr/local/bin:/usr/bin:/bin';
        const env = {
            ...process.env,
            HOME: '/tmp',
            PISTON_LANGUAGE: this.runtime.language,
            PATH: `${pkg_bin}:${existing_path}`,
        };

        const run_args = [...args];

        const cmd = `/bin/bash`;
        const cmd_args = [path.join(this.runtime.pkgdir, file), ...run_args];

        this.logger.debug(`Executing: ${cmd} ${cmd_args.join(' ')}`);

        const start_time = Date.now();
        const proc = cp.spawn(cmd, cmd_args, {
            stdio: 'pipe',
            cwd: path.join(box.dir, 'submission'),
            env,
            timeout: timeout,
            detached: false,
        });

        if (event_bus === null) {
            proc.stdin.write(this.stdin);
            proc.stdin.end();
            proc.stdin.destroy();
        } else {
            event_bus.on('stdin', data => {
                proc.stdin.write(data);
            });
            event_bus.on('kill', signal => {
                proc.kill(signal);
            });
        }

        proc.stderr.on('data', async data => {
            if (event_bus !== null) {
                event_bus.emit('stderr', data);
            } else if (stderr.length + data.length > this.runtime.output_max_size) {
                message = 'stderr length exceeded';
                status = 'EL';
                this.logger.info(message);
                try { process.kill(proc.pid, 'SIGABRT'); } catch (e) {}
            } else {
                stderr += data;
                output += data;
            }
        });

        proc.stdout.on('data', async data => {
            if (event_bus !== null) {
                event_bus.emit('stdout', data);
            } else if (stdout.length + data.length > this.runtime.output_max_size) {
                message = 'stdout length exceeded';
                status = 'OL';
                this.logger.info(message);
                try { process.kill(proc.pid, 'SIGABRT'); } catch (e) {}
            } else {
                stdout += data;
                output += data;
            }
        });

        const data = await new Promise((res, rej) => {
            proc.on('exit', (_, signal) => {
                res({ signal });
            });
            proc.on('error', err => {
                rej({ error: err });
            });
        });

        const end_time = Date.now();
        wall_time_stat = end_time - start_time;
        cpu_time_stat = wall_time_stat;

        try {
            code = proc.exitCode;
        } catch (e) {}

        if (status === null && data.signal) {
            signal = data.signal;
            status = 'RE';
        }

        return {
            ...data,
            stdout,
            stderr,
            code,
            signal,
            output,
            memory,
            message,
            status,
            cpu_time: cpu_time_stat,
            wall_time: wall_time_stat,
        };
    }

    async execute(box, event_bus = null) {
        if (this.state !== job_states.PRIMED) {
            throw new Error('Job must be in primed state, current state: ' + this.state.toString());
        }

        this.logger.info(`Executing job runtime=${this.runtime.toString()}`);

        const code_files =
            (this.runtime.language === 'file' && this.files) ||
            this.files.filter(file => file.encoding == 'utf8');

        const { emit_event_bus_result, emit_event_bus_stage } =
            event_bus === null
                ? { emit_event_bus_result: () => {}, emit_event_bus_stage: () => {} }
                : {
                    emit_event_bus_result: (stage, result) => {
                        const { error, code, signal } = result;
                        event_bus.emit('exit', stage, { error, code, signal });
                    },
                    emit_event_bus_stage: stage => {
                        event_bus.emit('stage', stage);
                    },
                };

        let compile;
        let compile_errored = false;

        if (this.runtime.compiled) {
            this.logger.debug('Compiling');
            emit_event_bus_stage('compile');
            compile = await this.safe_call(
                box, 'compile',
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.cpu_times.compile,
                this.memory_limits.compile,
                event_bus
            );
            emit_event_bus_result('compile', compile);
            compile_errored = compile.code !== 0;
            if (!compile_errored) {
                const old_box_dir = box.dir;
                box = await this.#create_box();
                await fs.rename(
                    path.join(old_box_dir, 'submission'),
                    path.join(box.dir, 'submission')
                );
                try {
                    await fs.chmod(path.join(box.dir, 'submission', 'a.out'), 0o755);
                } catch (e) {}
            }
        }

        let run;
        if (!compile_errored) {
            this.logger.debug('Running');
            emit_event_bus_stage('run');
            run = await this.safe_call(
                box, 'run',
                [code_files[0].name, ...this.args],
                this.timeouts.run,
                this.cpu_times.run,
                this.memory_limits.run,
                event_bus
            );
            emit_event_bus_result('run', run);
        }

        this.state = job_states.EXECUTED;

        return {
            compile,
            run,
            language: this.runtime.language,
            version: this.runtime.version.raw,
        };
    }

    async cleanup() {
        this.logger.info(`Cleaning up job`);
        remaining_job_spaces++;
        if (job_queue.length > 0) {
            job_queue.shift()();
        }
        await Promise.all(
            this.#dirty_boxes.map(async box => {
                try {
                    await fs.rm(box.dir, { recursive: true, force: true });
                } catch (e) {
                    this.logger.error(`Failed to remove box #${box.id}: ${e.message}`);
                }
            })
        );
    }
}

module.exports = { Job };
