"use client";

import { motion } from "framer-motion";
import {
  BookOpen, Lightbulb, Sparkles, Layers, CheckCircle, AlertTriangle,
  Plus, BookOpenCheck, CheckCircle2,
} from "lucide-react";
import { mkColors } from "@/utils/themeColors";
import { parseMarkdown } from "@/utils/parseMarkdown";
import type { UnifiedLesson } from "../StudyAssistantView";

type Props = {
  c: ReturnType<typeof mkColors>;
  data: UnifiedLesson;
  isScratchpadOpen: boolean;
  onImportTakeaway: (takeaway: string) => void;
  onImportConcept: (concept: { title: string; content: string }) => void;
  quizAnswers: Record<number, string>;
  quizSubmitted: Record<number, boolean>;
  onQuizSelect: (questionIdx: number, option: string) => void;
  onQuizSubmit: (questionIdx: number) => void;
};

export function BeginnerLesson({ c, data, isScratchpadOpen, onImportTakeaway, onImportConcept, quizAnswers, quizSubmitted, onQuizSelect, onQuizSubmit }: Props) {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.amberBorder}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <BookOpen size={14} /> Simple Overview
            </div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.overview, c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <Lightbulb size={14} /> Why This Matters
            </div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.why_matters || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <Sparkles size={14} /> Simple Explanation
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: c.textSec }}>{parseMarkdown(data.simple_explanation || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBgAlt, border: `1px solid ${c.amberBorder}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <Layers size={14} /> Real-Life Analogy
            </div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.real_life_analogy || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>A Simple Example</div>
            <div className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{parseMarkdown(data.example || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider" style={{ color: c.textMuted }}>{data.key_takeaways.length} Key Takeaways</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.key_takeaways.map((takeaway, idx) => (
              <motion.div key={idx} whileHover={{ y: -3, scale: 1.01 }}
                className="p-5 rounded-xl relative overflow-hidden flex flex-col justify-between"
                style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} style={{ color: c.amber }} />
                    <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>RULE {idx + 1}</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: c.textSec }}>{takeaway}</p>
                </div>
                {isScratchpadOpen && (
                  <div className="pt-3 mt-3 border-t flex justify-end" style={{ borderColor: c.divider }}>
                    <button onClick={() => onImportTakeaway(takeaway)}
                      className="px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.amber }}>
                      <Plus size={8} /> Copy to Notes
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {data.mini_quiz && data.mini_quiz.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
            <BookOpenCheck size={13} style={{ color: c.amber }} /> Comprehension Checkpoint Quiz
          </h3>
          <div className="space-y-6">
            {data.mini_quiz.map((quiz, qIdx) => {
              const userAns = quizAnswers[qIdx];
              const isSubmitted = quizSubmitted[qIdx];
              return (
                <div key={qIdx} className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.amberBorder}` }}>
                  <div className="space-y-5">
                    <div className="pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>QUESTION {qIdx + 1} OF {data.mini_quiz!.length}</span>
                      <h4 className="text-sm font-bold mt-1" style={{ color: c.text }}>{quiz.question}</h4>
                    </div>
                    <div className="space-y-2">
                      {quiz.options.map((opt) => {
                        const isSelected = userAns === opt;
                        const isCorrect = opt === quiz.answer;
                        let optionStyle: React.CSSProperties = { background: c.inputBg, borderColor: c.border };
                        if (isSelected && !isSubmitted) {
                          optionStyle = { background: c.amberBg, borderColor: c.amber, color: c.amber };
                        } else if (isSubmitted) {
                          if (isCorrect) {
                            optionStyle = { background: "rgba(16,185,129,0.15)", borderColor: c.amber, color: c.amber };
                          } else if (isSelected) {
                            optionStyle = { background: "rgba(244,63,94,0.15)", borderColor: c.rose, color: c.rose };
                          } else {
                            optionStyle = { background: c.surface, borderColor: c.border, opacity: 0.55 };
                          }
                        }
                        return (
                          <button key={opt} disabled={isSubmitted} onClick={() => onQuizSelect(qIdx, opt)}
                            className="w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex justify-between items-center"
                            style={optionStyle}>
                            <span>{opt}</span>
                            {isSubmitted && isCorrect && <CheckCircle size={15} style={{ color: c.amber }} />}
                            {isSubmitted && isSelected && !isCorrect && <AlertTriangle size={15} style={{ color: c.rose }} />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1 flex flex-col gap-3">
                      {!isSubmitted ? (
                        <button disabled={!userAns} onClick={() => onQuizSubmit(qIdx)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none" }}>
                          Submit Answer
                        </button>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 rounded-xl space-y-1.5 text-xs"
                          style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}>
                          <div className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                            {userAns === quiz.answer
                              ? <span style={{ color: c.amber }}>✔ Correct Answer</span>
                              : <span style={{ color: c.rose }}>✘ Incorrect</span>}
                          </div>
                          <p className="leading-relaxed" style={{ color: c.textMuted }}>{quiz.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
