import { env } from "../config/env";

const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  python3: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  nodejs: "javascript",
  node: "javascript",
  c: "c",
  cpp: "c++",
  "c++": "c++",
  cplusplus: "c++",
  java: "java",
  typescript: "typescript",
  ts: "typescript",
  go: "go",
  rust: "rust",
  rb: "ruby",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kotlin: "kotlin",
};

const VERSION_MAP: Record<string, string> = {
  python: "3.10.0",
  javascript: "18.15.0",
  c: "10.2.0",
  "c++": "10.2.0",
  java: "15.0.2",
  typescript: "5.0.3",
  go: "1.16.2",
  rust: "1.68.2",
  ruby: "3.0.1",
  php: "8.2.3",
  swift: "5.3.3",
  kotlin: "1.8.20",
};

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  executionTime: number;
  memory: number;
  status: string;
  signal: string | null;
  success: boolean;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionResult: ExecutionResult;
}

export interface SubmissionResult {
  allPassed: boolean;
  testResults: TestCaseResult[];
  totalTests: number;
  passedTests: number;
  executionTime: number;
  memory: number;
}

function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase().trim();
  return LANGUAGE_MAP[lower] || lower;
}

function getVersion(lang: string): string | undefined {
  const normalized = normalizeLanguage(lang);
  return VERSION_MAP[normalized];
}

function getApiBase(): string {
  const url = env.pistonUrl.replace(/\/+$/, "");
  if (url.includes("emkc.org")) {
    return `${url}/api/v2/piston`;
  }
  return `${url}/api/v2`;
}

export async function executeCode(
  language: string,
  code: string,
  stdin: string = "",
  timeout: number = 10000
): Promise<ExecutionResult> {
  const pistonLang = normalizeLanguage(language);
  const version = getVersion(language);
  const apiBase = getApiBase();

  const payload: Record<string, unknown> = {
    language: pistonLang,
    version,
    files: [{ name: "main", content: code }],
  };

  if (stdin) {
    payload.stdin = stdin;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(`${apiBase}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return {
        stdout: "",
        stderr: "",
        compile_output: `Piston API error (${res.status}): ${errorText}`,
        executionTime: 0,
        memory: 0,
        status: "Internal Error",
        signal: null,
        success: false,
      };
    }

    const data = await res.json() as any;
    const run = data.run || {};

    const stdout = run.stdout || "";
    const stderr = run.stderr || "";
    const compileOutput = run.compile_output || "";

    return {
      stdout,
      stderr,
      compile_output: compileOutput,
      executionTime: run.time ? parseFloat(run.time) * 1000 : 0,
      memory: run.memory || 0,
      status: run.code === 0 ? "Accepted" : run.code === null ? "Runtime Error" : `Exit Code ${run.code}`,
      signal: run.signal || null,
      success: run.code === 0 && !compileOutput,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        stdout: "",
        stderr: "",
        compile_output: `Execution timed out after ${timeout}ms`,
        executionTime: timeout,
        memory: 0,
        status: "Time Limit Exceeded",
        signal: null,
        success: false,
      };
    }
    return {
      stdout: "",
      stderr: "",
      compile_output: `Piston connection error: ${err.message}`,
      executionTime: 0,
      memory: 0,
      status: "Internal Error",
      signal: null,
      success: false,
    };
  }
}

export async function runTestCases(
  language: string,
  code: string,
  testCases: Array<{ input: string; expectedOutput: string }>,
  timeout: number = 10000
): Promise<SubmissionResult> {
  const results: TestCaseResult[] = [];
  let totalExecutionTime = 0;
  let maxMemory = 0;

  for (const tc of testCases) {
    const execResult = await executeCode(language, code, tc.input, timeout);

    const actualOutput = (execResult.stdout || "").trim();
    const expectedOutput = tc.expectedOutput.trim();

    const passed = execResult.success && actualOutput === expectedOutput;

    results.push({
      input: tc.input,
      expectedOutput,
      actualOutput,
      passed,
      executionResult: execResult,
    });

    totalExecutionTime += execResult.executionTime;
    maxMemory = Math.max(maxMemory, execResult.memory);
  }

  const passedTests = results.filter(r => r.passed).length;

  return {
    allPassed: passedTests === testCases.length,
    testResults: results,
    totalTests: testCases.length,
    passedTests,
    executionTime: totalExecutionTime,
    memory: maxMemory,
  };
}

export async function checkPistonHealth(): Promise<boolean> {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/runtimes`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
