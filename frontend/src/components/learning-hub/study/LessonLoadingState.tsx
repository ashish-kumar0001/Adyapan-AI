"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { mkColors } from "@/utils/themeColors";

const loadingSteps = [
  "Analyzing Topic Semantics",
  "Building Custom Learning Path",
  "Creating Real-World Analogies",
  "Generating Comprehension Checkpoint Quiz",
  "Finalizing Visual Revision Sheet"
];

type Props = {
  c: ReturnType<typeof mkColors>;
  loadingStep: number;
  topicError: string | null;
  isGenerating: boolean;
};

export function LessonLoadingState({ c, loadingStep, topicError, isGenerating }: Props) {
  return (
    <>
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="p-10 rounded-2xl space-y-8 relative overflow-hidden mb-6 flex flex-col items-center justify-center min-h-[400px]"
            style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
            <div className="space-y-4 max-w-xl mx-auto text-center">
              <h3 className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: c.text }}>
                <Sparkles size={18} style={{ color: c.amber }} /> Generating Personalized Lesson...
              </h3>
              <p className="text-xs font-mono" style={{ color: c.textMuted }}>Synthesizing topic boundaries via AI model</p>
            </div>
            <div className="relative max-w-md mx-auto py-4">
              <div className="absolute left-[15px] top-6 bottom-6 w-[2px]" style={{ background: c.border }} />
              <div className="space-y-6 relative">
                {loadingSteps.map((step, idx) => {
                  const isDone = loadingStep > idx;
                  const isActive = loadingStep === idx;
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4 pl-1">
                      <div className="relative z-10 flex items-center justify-center">
                        {isDone ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: c.greenBg, border: `1px solid ${c.amber}`, color: c.amber }}>
                            <Check size={14} />
                          </div>
                        ) : isActive ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
                            style={{ background: c.amberBg, border: `1px solid ${c.amber}`, color: c.amber }}>
                            <RotateCcw className="animate-spin" size={12} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono"
                            style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.textMuted }}>
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono" style={{
                          color: isDone ? c.amber : isActive ? c.amber : c.textMuted,
                          fontWeight: isActive ? 700 : 400
                        }}>{step}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {topicError && (
        <div className="p-4 rounded-xl flex items-start gap-3 mb-6" style={{ background: c.roseBg, border: `1px solid ${c.roseBorder}` }}>
          <AlertTriangle size={18} style={{ color: c.rose }} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold" style={{ color: c.text }}>Generation Failed</h4>
            <p className="text-xs leading-normal" style={{ color: c.textMuted }}>{topicError}</p>
          </div>
        </div>
      )}
    </>
  );
}
