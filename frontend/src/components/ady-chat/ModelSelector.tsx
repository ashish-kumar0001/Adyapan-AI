"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ADY_MODELS, type ChatModel } from "./types";

interface ModelSelectorProps {
  selectedModel: string;
  isDark: boolean;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, isDark, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = ADY_MODELS.find(m => m.id === selectedModel) || ADY_MODELS[0];

  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)";
  const dropdownBg = isDark ? "rgba(12,10,28,0.95)" : "rgba(255,255,255,0.98)";
  const text = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#94a3b8";
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <div className="relative flex justify-center mb-3">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{
          background: bg,
          border: `1px solid ${border}`,
          backdropFilter: "blur(12px)",
          color: text,
        }}
        whileHover={{
          scale: 1.02,
          borderColor: "rgba(245,158,11,0.3)",
          boxShadow: "0 0 12px rgba(245,158,11,0.15)",
        }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-sm leading-none">{current.icon}</span>
        <span style={{ fontFamily: "'Outfit', sans-serif" }}>{current.displayName}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3" style={{ color: textMuted }} />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute bottom-full mb-2 w-64 rounded-2xl overflow-hidden z-50"
              style={{
                background: dropdownBg,
                border: `1px solid ${border}`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
                  : "0 20px 60px rgba(0,0,0,0.12)",
              }}
            >
              <div className="p-2">
                <div
                  className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: textMuted, letterSpacing: "0.12em" }}
                >
                  Select Model
                </div>

                {ADY_MODELS.map((model, i) => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    isDark={isDark}
                    text={text}
                    textMuted={textMuted}
                    hoverBg={hoverBg}
                    index={i}
                    onClick={() => {
                      onModelChange(model.id);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModelOption({
  model,
  isSelected,
  isDark,
  text,
  textMuted,
  hoverBg,
  index,
  onClick,
}: {
  model: ChatModel;
  isSelected: boolean;
  isDark: boolean;
  text: string;
  textMuted: string;
  hoverBg: string;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
      style={{
        background: isSelected ? "rgba(245,158,11,0.1)" : "transparent",
        borderLeft: isSelected ? "2px solid rgba(245,158,11,0.6)" : "2px solid transparent",
      }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      whileHover={{ background: isSelected ? "rgba(245,158,11,0.14)" : hoverBg, x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-xl leading-none">{model.icon}</span>
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-semibold"
          style={{
            color: isSelected ? "#f59e0b" : text,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {model.displayName}
        </div>
        <div className="text-[10px]" style={{ color: textMuted }}>
          {model.description} · {model.fast ? "Fast" : "Premium"}
        </div>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 rounded-full bg-amber-500"
        />
      )}
    </motion.button>
  );
}
