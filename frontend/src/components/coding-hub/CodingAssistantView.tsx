import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Bug,
  Lightbulb,
  FolderKanban,
  Send,
  Code,
  Loader2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

type Mode = "generate" | "debug" | "explain" | "project";

interface GenerateResult { folderStructure: string; setupGuide: string; code: string; }
interface DebugResult { issue: string; rootCause: string; fixedCode: string; }
interface ExplainResult { complexity: string; explanation: string; }
interface ProjectResult { architecture: string; techStack: string[]; features: string[]; roadmap: Array<{ phase: string; tasks: string[] }>; }
type CodingResult = GenerateResult | DebugResult | ExplainResult | ProjectResult;

export function CodingAssistantView() {
  const [mode, setMode] = useState<Mode>("generate");
  const [input, setInput] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const canSubmit = input.trim().length > 0 && (mode !== "debug" || secondaryInput.trim().length > 0);

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setGenerating(true);
    setResult(null);

    try {
      const payload: Record<string, string> = {};
      if (mode === "generate") payload.prompt = input;
      else if (mode === "project") payload.projectName = input;
      else if (mode === "explain") payload.codeSnippet = input;
      else if (mode === "debug") {
        payload.errorMsg = secondaryInput;
        payload.codeSnippet = input;
      }

      const res = await api.post("/coding/assist", { mode, ...payload });
      const data = res.data?.result ?? res.data;
      if (data) {
        setResult(data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message || e?.message || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const tabs = [
    { id: "generate", label: "Generate Code", icon: Code, description: "Build features quickly" },
    { id: "debug", label: "Debug Code", icon: Bug, description: "Resolve runtime issues" },
    { id: "explain", label: "Explain Code", icon: Lightbulb, description: "Understand logic clearly" },
    { id: "project", label: "Plan Project", icon: FolderKanban, description: "Shape architecture" },
  ];

  const sideTips = {
    generate: ["Clean component structure", "Production-ready patterns", "Scalable conventions"],
    debug: ["Root cause analysis", "Safer fixes", "Regression-aware suggestions"],
    explain: ["Step-by-step reasoning", "Complexity insights", "Readable walkthroughs"],
    project: ["Architecture direction", "Tech stack recommendations", "Delivery roadmap"],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_32%),linear-gradient(135deg,_rgba(10,14,28,0.98),_rgba(16,24,40,0.96))] text-slate-100 shadow-2xl shadow-black/30"
    >
      <div className="border-b border-white/10 bg-slate-950/70 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <Sparkles size={14} /> Developer Copilot
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Professional coding assistance
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Generate reliable code, troubleshoot issues, explain logic, and plan projects with a focused, polished workflow.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <ShieldCheck size={16} className="text-emerald-400" /> Structured guidance
              </div>
              <p className="mt-1 text-xs text-slate-400">Clear prompts with actionable next steps.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Code size={16} className="text-sky-400" /> Workspace-ready output
              </div>
              <p className="mt-1 text-xs text-slate-400">Organized code, architecture, and roadmap suggestions.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 p-4 sm:p-6">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          return (
            <motion.button
              key={tab.id}
              custom={index}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => {
                setMode(tab.id as Mode);
                setResult(null);
                setInput("");
                setSecondaryInput("");
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-lg shadow-cyan-500/10"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <Icon size={16} />
                {tab.label}
              </div>
              <p className="mt-1 text-xs opacity-75">{tab.description}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/20 sm:p-5"
          >
            <div className="mb-4 flex items-center gap-2 text-cyan-300">
              <Terminal size={18} />
              <h3 className="text-sm font-semibold">
                {mode === "generate"
                  ? "What do you want to build?"
                  : mode === "debug"
                    ? "Share the issue and the code"
                    : mode === "explain"
                      ? "Paste code to explain"
                      : "Describe the project direction"}
              </h3>
            </div>

            <AnimatePresence>
              {mode === "debug" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <textarea
                    value={secondaryInput}
                    onChange={(e) => setSecondaryInput(e.target.value)}
                    placeholder="Paste the error message here..."
                    className="mb-3 h-20 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm font-mono text-slate-200 outline-none transition focus:border-cyan-400/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "generate" || mode === "project" ? "Describe your requirements in detail..." : "Paste your code snippet here..."}
              className="h-36 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm font-mono text-slate-200 outline-none transition focus:border-cyan-400/50"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Tip: include the stack, constraints, and desired output for more precise results.</p>
              <motion.button
                onClick={handleGenerate}
                disabled={!canSubmit || generating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {generating ? "Processing..." : "Run AI Assist"}
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Sparkles size={16} className="text-amber-300" /> Suggested focus areas
            </div>
            <div className="mt-4 space-y-3">
              {sideTips[mode].map((tip) => (
                <div key={tip} className="flex items-start gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                  <ArrowRight size={14} className="mt-0.5 text-cyan-300" />
                  <span className="text-sm text-slate-300">{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              key={`result-${mode}`}
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, type: "spring", stiffness: 220, damping: 20 }}
              className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/20 sm:p-6"
            >
              {mode === "generate" && (() => {
                const r = result as GenerateResult;
                return (
                <div className="space-y-6">
                  <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Folder Structure</h4>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-slate-300 font-mono">{r.folderStructure}</pre>
                  </motion.div>
                  <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Setup Guide</h4>
                    <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-slate-300">{r.setupGuide}</div>
                  </motion.div>
                  <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Source Code</h4>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-emerald-300 font-mono">{r.code}</pre>
                  </motion.div>
                </div>
                );
              })()}

              {mode === "debug" && (() => {
                const r = result as DebugResult;
                return (
                <div className="space-y-6">
                  <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-300">Identified Issue</h4>
                    <p className="text-sm text-red-100">{r.issue}</p>
                  </motion.div>
                  <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Root Cause</h4>
                    <p className="rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-slate-300">{r.rootCause}</p>
                  </motion.div>
                  <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Fixed Code</h4>
                    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-emerald-300 font-mono">{r.fixedCode}</pre>
                  </motion.div>
                </div>
                );
              })()}

              {mode === "explain" && (() => {
                const r = result as ExplainResult;
                return (
                <div className="space-y-6">
                  <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">Complexity</h4>
                    <p className="inline-block rounded-xl border border-sky-500/20 bg-black/50 p-3 font-mono text-sm text-slate-300">{r.complexity}</p>
                  </motion.div>
                  <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Line-by-Line Breakdown</h4>
                    <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{r.explanation}</div>
                  </motion.div>
                </div>
                );
              })()}

              {mode === "project" && (() => {
                const r = result as ProjectResult;
                return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.08 }}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="md:col-span-2">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Architecture Overview</h4>
                    <p className="rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-slate-300">{r.architecture}</p>
                  </motion.div>
                  <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {r.techStack.map((tool: string, index: number) => (
                        <span key={index} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Core Features</h4>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                      {r.features.map((feature: string, index: number) => <li key={index}>{feature}</li>)}
                    </ul>
                  </motion.div>
                  <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="md:col-span-2">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Development Roadmap</h4>
                    <div className="space-y-3">
                      {r.roadmap.map((step: { phase: string; tasks: string[] }, index: number) => (
                        <motion.div
                          key={index}
                          custom={index}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ y: -2, scale: 1.01 }}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                            {index + 1}
                          </div>
                          <span className="text-sm text-slate-300">{step.phase}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
                );
              })()}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

