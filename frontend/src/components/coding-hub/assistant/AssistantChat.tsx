"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Bug,
  Lightbulb,
  FolderKanban,
  Loader2,
  AlertTriangle,
  FileCode,
  ChevronDown,
} from "lucide-react";
import { renderMarkdown } from "@/utils/renderMarkdown";
import { CodeResultBlock } from "./CodeResultBlock";
import type { Mode } from "./AssistantSidebar";

interface LanguageResultData {
  code: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
}

interface AssistantResults {
  languages?: Record<string, LanguageResultData>;
  summary?: string;
  issue?: string;
  rootCause?: string;
  fixedCode?: string;
  explanation?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  architecture?: string;
  techStack?: string[];
  folderStructure?: string;
  features?: string[];
  roadmap?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string;
  results?: AssistantResults;
  codeSnippet?: string;
  errorMsg?: string;
  languages?: string[];
}

interface AssistantChatProps {
  messages: ChatMessage[];
  generating: boolean;
  mode: Mode;
  isDark?: boolean;
}

const MODE_ICONS: Record<Mode, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  generate: Code2,
  debug: Bug,
  explain: Lightbulb,
  project: FolderKanban,
};

const MODE_COLORS: Record<Mode, string> = {
  generate: "#10b981",
  debug: "#f43f5e",
  explain: "#f59e0b",
  project: "#0ea5e9",
};

export function AssistantChat({ messages, generating, mode, isDark = true }: AssistantChatProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const ModeIcon = MODE_ICONS[mode] || Code2;
  const modeColor = MODE_COLORS[mode] || "#f59e0b";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  if (messages.length === 0 && !generating) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
            style={{
              background:
                msg.role === "user"
                  ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
                  : `linear-gradient(135deg, ${modeColor}25, ${modeColor}05)`,
              borderColor:
                msg.role === "user"
                  ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                  : `${modeColor}40`,
            }}
          >
            {msg.role === "user" ? (
              <span className="text-[9px] font-bold uppercase" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>
                You
              </span>
            ) : (
              <ModeIcon size={15} style={{ color: modeColor }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {msg.role === "user" ? (
              <div className="space-y-2">
                <p
                  className="text-sm font-medium leading-relaxed"
                  style={{ color: isDark ? "#fff" : "#1a1a2e" }}
                >
                  {msg.errorMsg ? `Debug: ${msg.content.split("\n")[0]}` : msg.content}
                </p>

                {msg.codeSnippet && (
                  <UserCodeSnippet code={msg.codeSnippet} isDark={isDark} />
                )}
                {msg.errorMsg && (
                  <div
                    className="p-3 border rounded-xl flex gap-2 items-start max-w-2xl"
                    style={{
                      borderColor: "rgba(239,68,68,0.2)",
                      background: "rgba(239,68,68,0.05)",
                    }}
                  >
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[11px] font-mono text-red-300 leading-normal">{msg.errorMsg}</div>
                  </div>
                )}
              </div>
            ) : msg.results ? (
              <div className="space-y-4">
                {/* Structured result with multi-language code */}
                {msg.results.languages && (
                  <CodeResultBlock
                    results={msg.results.languages}
                    languages={msg.languages || Object.keys(msg.results.languages)}
                    summary={msg.results.summary}
                    isDark={isDark}
                  />
                )}

                {/* Debug results */}
                {msg.mode === "debug" && msg.results.issue && (
                  <DebugResult results={msg.results} isDark={isDark} />
                )}

                {/* Explain results */}
                {msg.mode === "explain" && msg.results.explanation && (
                  <ExplainResult results={msg.results} isDark={isDark} />
                )}

                {/* Project results */}
                {msg.mode === "project" && msg.results.architecture && (
                  <ProjectResult results={msg.results} isDark={isDark} />
                )}

                {/* Fallback: plain markdown */}
                {!msg.results.languages && !msg.results.issue && !msg.results.explanation && !msg.results.architecture && (
                  <div className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)" }}>
                    {renderMarkdown(msg.content, isDark)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)" }}>
                {renderMarkdown(msg.content, isDark)}
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Generating indicator */}
      {generating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{
              background: `${modeColor}15`,
              borderColor: `${modeColor}30`,
            }}
          >
            <Loader2 size={15} className="animate-spin" style={{ color: modeColor }} />
          </div>
          <div className="py-1">
            <span className="text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
              Generating {mode} response...
            </span>
            <div className="flex gap-1 mt-2">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    background: modeColor,
                    animationDelay: `${delay}ms`,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UserCodeSnippet({ code, isDark }: { code: string; isDark: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const lines = code.split("\n").length;

  return (
    <div
      className="border rounded-xl overflow-hidden max-w-3xl"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)",
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}
      >
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-cyan-400" />
          <span className="text-[11px] font-mono" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
            Code ({lines} lines)
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }}
        />
      </div>
      {isOpen && (
        <pre
          className="p-3 overflow-x-auto text-[11px] font-mono leading-normal max-h-48 overflow-y-auto border-t"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            color: isDark ? "#93c5fd" : "#1e40af",
          }}
        >
          {code}
        </pre>
      )}
    </div>
  );
}

function DebugResult({ results, isDark }: { results: AssistantResults; isDark: boolean }) {
  return (
    <div className="space-y-3">
      {results.issue && (
        <div className="p-3 rounded-xl border" style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block mb-1">Issue</span>
          <p className="text-xs" style={{ color: isDark ? "#fca5a5" : "#991b1b" }}>{results.issue}</p>
        </div>
      )}
      {results.rootCause && (
        <div className="p-3 rounded-xl border" style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)" }}>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block mb-1">Root Cause</span>
          <div className="text-xs leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)" }}>
            {renderMarkdown(results.rootCause, isDark)}
          </div>
        </div>
      )}
      {results.fixedCode && (
        <CodeResultBlock
          results={{ fixed: { code: results.fixedCode, explanation: results.explanation || "", timeComplexity: results.timeComplexity || "N/A", spaceComplexity: results.spaceComplexity || "N/A" } }}
          languages={["fixed"]}
          isDark={isDark}
        />
      )}
    </div>
  );
}

function ExplainResult({ results, isDark }: { results: AssistantResults; isDark: boolean }) {
  return (
    <div className="space-y-3">
      <div
        className="p-4 rounded-xl border"
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }}
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block mb-2">Explanation</span>
        <div className="text-xs leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)" }}>
          {renderMarkdown(results.explanation, isDark)}
        </div>
      </div>
      {(results.timeComplexity || results.spaceComplexity) && (
        <div className="flex gap-3">
          {results.timeComplexity && (
            <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-[10px] font-bold text-amber-500">Time: </span>
              <span className="text-[11px] font-mono font-bold text-amber-400">{results.timeComplexity}</span>
            </div>
          )}
          {results.spaceComplexity && (
            <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <span className="text-[10px] font-bold text-purple-400">Space: </span>
              <span className="text-[11px] font-mono font-bold text-purple-300">{results.spaceComplexity}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectResult({ results, isDark }: { results: AssistantResults; isDark: boolean }) {
  return (
    <div className="space-y-3">
      {results.architecture && (
        <div className="p-4 rounded-xl border" style={{ borderColor: "rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.05)" }}>
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 block mb-2">Architecture</span>
          <div className="text-xs leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)" }}>
            {renderMarkdown(results.architecture, isDark)}
          </div>
        </div>
      )}
      {results.techStack && results.techStack.length > 0 && (
        <div className="p-3 rounded-xl border" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
          <span className="text-[10px] font-black uppercase tracking-wider mb-2 block" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>Tech Stack</span>
          <div className="flex flex-wrap gap-1.5">
            {results.techStack.map((t: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      {results.roadmap && results.roadmap.length > 0 && (
        <div className="p-3 rounded-xl border" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
          <span className="text-[10px] font-black uppercase tracking-wider mb-2 block" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>Roadmap</span>
          <div className="space-y-1.5">
            {results.roadmap.map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>
                <span className="text-sky-500 font-bold mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
