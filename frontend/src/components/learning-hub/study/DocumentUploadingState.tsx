"use client";

import { motion } from "framer-motion";
import { Brain, CheckCircle2 } from "lucide-react";
import { mkColors } from "@/utils/themeColors";

const uploadStages = ["Upload", "Extract Text", "Analyze Content", "Identify Topics", "Generate Summary", "Completed"];

type Props = {
  c: ReturnType<typeof mkColors>;
  currentStage: string;
};

export function DocumentUploadingState({ c, currentStage }: Props) {
  const stageIdx = uploadStages.indexOf(currentStage);

  return (
    <motion.div
      key="uploading"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-8"
    >
      <div className="relative w-24 h-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full"
          style={{ border: `3px solid transparent`, borderTopColor: c.amber, borderRightColor: c.amberBg }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 rounded-full"
          style={{ border: `2px solid transparent`, borderTopColor: "rgba(139,92,246,0.6)", borderLeftColor: "rgba(139,92,246,0.2)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain size={28} style={{ color: c.amber }} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-lg font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>Analyzing Document...</h3>
        <p className="text-sm" style={{ color: c.textMuted }}>{currentStage} in progress</p>
      </div>
      <div className="w-full max-w-lg grid grid-cols-3 gap-3">
        {uploadStages.map((step, idx) => {
          const isActive = idx <= stageIdx;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-xl text-center space-y-1.5 transition-all duration-500"
              style={{ background: isActive ? c.amberBg : c.surface, border: `1px solid ${isActive ? c.amberBorder : c.border}` }}
            >
              <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Stage {idx + 1}</span>
              <span className="text-xs font-semibold block" style={{ color: c.text }}>{step}</span>
              {isActive && idx === stageIdx && (
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 rounded-full mx-auto" style={{ background: c.amber }} />
              )}
              {isActive && idx < stageIdx && <CheckCircle2 size={12} style={{ color: c.green }} className="mx-auto" />}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
