"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Copy,
  Check,
  Download,
  Play,
  ChevronDown,
  Terminal,
  Clock,
  Cpu,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react";
import { renderMarkdown } from "@/utils/renderMarkdown";
import { LANGUAGES } from "./LanguageSelector";
import { api } from "@/services/api";
import { toast } from "sonner";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface LanguageResult {
  code: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
}

interface CodeResultBlockProps {
  results: Record<string, LanguageResult>;
  languages: string[];
  summary?: string;
  isDark?: boolean;
  defaultLang?: string;
}

export function CodeResultBlock({ results, languages, summary, isDark = true, defaultLang }: CodeResultBlockProps) {
  const [activeTab, setActiveTab] = useState(defaultLang || languages[0] || "javascript");
  const [showEditor, setShowEditor] = useState(false);
  const [editorCode, setEditorCode] = useState("");
  const [executionResult, setExecutionResult] = useState<{ success: boolean; output?: string; error?: string; executionTime?: number; memory?: number; status?: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const activeResult = results[activeTab];
  const langMeta = LANGUAGES.find((l) => l.id === activeTab);

  const handleCopy = () => {
    if (!activeResult?.code) return;
    navigator.clipboard.writeText(activeResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeResult?.code) return;
    const ext: Record<string, string> = {
      javascript: ".js", python: ".py", java: ".java", cpp: ".cpp",
      typescript: ".ts", go: ".go", rust: ".rs", c: ".c",
      ruby: ".rb", php: ".php", swift: ".swift", kotlin: ".kt",
    };
    const blob = new Blob([activeResult.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solution${ext[activeTab] || ".txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenInEditor = () => {
    setEditorCode(activeResult?.code || "");
    setExecutionResult(null);
    setShowEditor(true);
  };

  const handleRunCode = async () => {
    if (!editorCode.trim()) return;
    setRunning(true);
    setExecutionResult(null);
    try {
      const res = await api.post("/coding/run", {
        code: editorCode,
        language: activeTab,
        stdin: "",
      });
      setExecutionResult(res.data);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(e?.response?.data?.error || "Execution failed");
      setExecutionResult({
        success: false,
        error: e?.response?.data?.error || "Execution failed",
      });
    } finally {
      setRunning(false);
    }
  };

  if (!activeResult) return null;

  return (
    <>
      <div
        className="rounded-2xl border overflow-hidden shadow-xl"
        style={{
          background: isDark ? "rgba(8,6,25,0.6)" : "rgba(255,255,255,0.9)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        }}
      >
        {/* Summary */}
        {summary && (
          <div
            className="px-4 py-3 border-b text-xs leading-relaxed"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
            }}
          >
            {summary}
          </div>
        )}

        {/* Language tabs */}
        <div
          className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
        >
          {languages.map((langId) => {
            const meta = LANGUAGES.find((l) => l.id === langId);
            const result = results[langId];
            const isActive = activeTab === langId;
            const hasResult = !!result?.code && !result.code.includes("generation failed");

            return (
              <button
                key={langId}
                onClick={() => setActiveTab(langId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer"
                style={{
                  background: isActive
                    ? isDark ? `${meta?.color || "#888"}18` : `${meta?.color || "#888"}12`
                    : "transparent",
                  color: isActive
                    ? isDark ? "#fff" : "#1a1a2e"
                    : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                  borderBottom: isActive ? `2px solid ${meta?.color || "#f59e0b"}` : "2px solid transparent",
                }}
              >
                {meta && (
                  <span
                    className="w-4 h-4 rounded text-[7px] font-black flex items-center justify-center"
                    style={{ background: meta.color, color: meta.darkColor }}
                  >
                    {meta.icon.charAt(0)}
                  </span>
                )}
                {meta?.label || langId}
                {!hasResult && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                )}
              </button>
            );
          })}

          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <motion.button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer"
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </motion.button>

            <motion.button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer"
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={12} />
            </motion.button>

            <motion.button
              onClick={handleOpenInEditor}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "#10b981",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={11} fill="currentColor" />
              Run
            </motion.button>
          </div>
        </div>

        {/* Code display */}
        <div className="relative">
          <div
            className="overflow-x-auto text-[11px] font-mono leading-relaxed p-4 max-h-[400px] overflow-y-auto"
            style={{
              background: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.02)",
              color: isDark ? "#e2e8f0" : "#1a1a2e",
            }}
          >
            {renderMarkdown(
              activeResult.code.startsWith("```")
                ? activeResult.code
                : `\`\`\`${activeTab === "cpp" ? "cpp" : activeTab}\n${activeResult.code}\n\`\`\``,
              isDark
            )}
          </div>
        </div>

        {/* Explanation + Complexity */}
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 w-full text-left cursor-pointer"
          >
            <span
              className="text-[10px] uppercase font-black tracking-widest"
              style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}
            >
              Explanation & Complexity
            </span>
            <ChevronDown
              size={12}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }}
            />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  <div className="text-xs leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)" }}>
                    {activeResult.explanation}
                  </div>

                  <div className="flex gap-3">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{
                        background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                        border: `1px solid ${isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"}`,
                      }}
                    >
                      <Clock size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-500">Time:</span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        {activeResult.timeComplexity}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{
                        background: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)",
                        border: `1px solid ${isDark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.15)"}`,
                      }}
                    >
                      <Cpu size={12} className="text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-400">Space:</span>
                      <span className="text-[11px] font-mono font-bold text-purple-300">
                        {activeResult.spaceComplexity}
                      </span>
                    </div>
                  </div>

                  {activeResult.explanation && (
                    <div
                      className="text-xs leading-relaxed p-3 rounded-lg"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                      }}
                    >
                      {renderMarkdown(activeResult.explanation, isDark)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl overflow-hidden border"
              style={{
                background: isDark ? "#0a0a18" : "#fff",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Editor header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{
                  background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {langMeta && (
                      <span
                        className="w-5 h-5 rounded text-[8px] font-black flex items-center justify-center"
                        style={{ background: langMeta.color, color: langMeta.darkColor }}
                      >
                        {langMeta.icon.charAt(0)}
                      </span>
                    )}
                    <span className="text-sm font-bold" style={{ color: isDark ? "#fff" : "#1a1a2e" }}>
                      {langMeta?.label || activeTab}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                    Edit & Run
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => { setEditorCode(activeResult?.code || ""); setExecutionResult(null); }}
                    className="p-1.5 rounded-lg cursor-pointer"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Reset to original"
                  >
                    <RotateCcw size={14} style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }} />
                  </motion.button>
                  <motion.button
                    onClick={handleRunCode}
                    disabled={running}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    style={{
                      background: running ? "rgba(16,185,129,0.3)" : "#10b981",
                      color: "#000",
                      opacity: running ? 0.7 : 1,
                    }}
                    whileHover={!running ? { scale: 1.03 } : {}}
                    whileTap={!running ? { scale: 0.97 } : {}}
                  >
                    {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                    {running ? "Running..." : "Run Code"}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowEditor(false)}
                    className="p-1.5 rounded-lg cursor-pointer"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={14} style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }} />
                  </motion.button>
                </div>
              </div>

              {/* Editor body */}
              <div className="flex-1 min-h-0 flex">
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language={activeTab === "cpp" ? "cpp" : activeTab}
                    value={editorCode}
                    onChange={(val) => setEditorCode(val || "")}
                    theme={isDark ? "vs-dark" : "light"}
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      padding: { top: 12 },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              {/* Output panel */}
              {executionResult && (
                <div
                  className="border-t max-h-[200px] overflow-y-auto"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                    <Terminal size={13} style={{ color: executionResult.success ? "#10b981" : "#ef4444" }} />
                    <span className="text-[11px] font-bold" style={{ color: executionResult.success ? "#10b981" : "#ef4444" }}>
                      {executionResult.status || (executionResult.success ? "Accepted" : "Error")}
                    </span>
                    {executionResult.executionTime > 0 && (
                      <span className="text-[10px] font-mono" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                        {executionResult.executionTime}ms
                      </span>
                    )}
                    {executionResult.memory > 0 && (
                      <span className="text-[10px] font-mono" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                        {executionResult.memory}KB
                      </span>
                    )}
                  </div>
                  <pre
                    className="px-4 py-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap"
                    style={{
                      color: executionResult.success
                        ? isDark ? "#e2e8f0" : "#1a1a2e"
                        : "#ef4444",
                      background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.01)",
                    }}
                  >
                    {executionResult.output || executionResult.error || "No output"}
                  </pre>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
