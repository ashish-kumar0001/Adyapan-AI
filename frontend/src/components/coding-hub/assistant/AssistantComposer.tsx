"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  Upload,
  Code2,
  Bug,
  Lightbulb,
  FolderKanban,
} from "lucide-react";
import { LanguageSelector, type LanguageId } from "./LanguageSelector";
import type { Mode } from "./AssistantSidebar";

interface AssistantComposerProps {
  mode: Mode;
  languages: LanguageId[];
  onLanguagesChange: (langs: LanguageId[]) => void;
  input: string;
  onInputChange: (val: string) => void;
  secondaryInput: string;
  onSecondaryInputChange: (val: string) => void;
  canSubmit: boolean;
  generating: boolean;
  onSubmit: () => void;
  onFileUpload: (text: string) => void;
  isDark?: boolean;
}

const MODE_TABS: { id: Mode; label: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string }[] = [
  { id: "generate", label: "Generate", icon: Code2, color: "#10b981" },
  { id: "debug", label: "Debug", icon: Bug, color: "#f43f5e" },
  { id: "explain", label: "Explain", icon: Lightbulb, color: "#f59e0b" },
  { id: "project", label: "Project", icon: FolderKanban, color: "#0ea5e9" },
];

const PLACEHOLDERS: Record<Mode, string> = {
  generate: "Describe what you want to build... (e.g., 'Binary search with error handling')",
  debug: "Paste the code that has the bug...",
  explain: "Paste the code you want explained...",
  project: "Describe your project... (e.g., 'Real-time chat app with React and Node')",
};

export function AssistantComposer({
  mode,
  languages,
  onLanguagesChange,
  input,
  onInputChange,
  secondaryInput,
  onSecondaryInputChange,
  canSubmit,
  generating,
  onSubmit,
  onFileUpload,
  isDark = true,
}: AssistantComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const currentTab = MODE_TABS.find((t) => t.id === mode) || MODE_TABS[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onFileUpload(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="p-4 flex-shrink-0 z-10">
      <div className="max-w-4xl mx-auto">
        {/* Mode tabs */}
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
            {MODE_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = mode === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  style={{
                    background: isActive ? `${tab.color}18` : "transparent",
                    color: isActive ? tab.color : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TabIcon size={13} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {/* Language selector (only for generate mode) */}
          {mode === "generate" && (
            <LanguageSelector
              selected={languages}
              onChange={onLanguagesChange}
              isDark={isDark}
            />
          )}
        </div>

        {/* Input box */}
        <div
          className="rounded-2xl border p-2 flex flex-col transition-all"
          style={{
            background: isDark ? "rgba(8,6,25,0.6)" : "rgba(255,255,255,0.8)",
            borderColor: `${currentTab.color}25`,
            boxShadow: `0 4px 20px ${currentTab.color}05`,
          }}
        >
          {/* Debug mode: error input */}
          {mode === "debug" && (
            <input
              value={secondaryInput}
              onChange={(e) => onSecondaryInputChange(e.target.value)}
              placeholder="Enter the error message or crash log..."
              className="w-full bg-transparent outline-none border-b py-2 px-3 text-[11px] font-mono mb-2"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                color: isDark ? "#fff" : "#1a1a2e",
              }}
            />
          )}

          {/* Main text area */}
          <textarea
            ref={textRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={PLACEHOLDERS[mode]}
            className="w-full bg-transparent outline-none py-2 px-3 text-sm min-h-[48px] max-h-[200px] resize-none"
            style={{ color: isDark ? "#fff" : "#1a1a2e" }}
            rows={2}
            onKeyDown={handleKeyDown}
          />

          {/* Action row */}
          <div className="flex items-center justify-between border-t pt-2 mt-1" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.json,.py,.java,.cpp,.h,.cs,.html,.css,.md,.go,.rs,.rb,.php,.swift,.kt"
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer"
                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Upload code file"
              >
                <Upload size={14} style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }} />
              </motion.button>

              <div
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: `${currentTab.color}12`, color: currentTab.color }}
              >
                {currentTab.label}
              </div>
            </div>

            <motion.button
              onClick={onSubmit}
              disabled={!canSubmit || generating}
              className="flex items-center justify-center rounded-xl font-bold text-xs w-9 h-9 cursor-pointer"
              style={{
                background: currentTab.color,
                color: "#000",
                boxShadow: `0 4px 12px ${currentTab.color}35`,
                cursor: !canSubmit || generating ? "not-allowed" : "pointer",
                opacity: !canSubmit || generating ? 0.5 : 1,
              }}
              whileHover={canSubmit && !generating ? { scale: 1.05 } : {}}
              whileTap={canSubmit && !generating ? { scale: 0.95 } : {}}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
            </motion.button>
          </div>
        </div>

        <p className="text-[10px] text-center mt-2" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }}>
          Press Enter to send. Shift+Enter for newline. Upload code files for analysis.
        </p>
      </div>
    </div>
  );
}
