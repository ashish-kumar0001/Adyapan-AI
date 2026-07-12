"use client";

import { motion } from "framer-motion";
import {
  Upload, Brain, Sparkles, Zap, Star, CheckCircle2,
} from "lucide-react";
import { mkColors } from "@/utils/themeColors";
import { fadeUp, scaleIn } from "@/utils/animations";

type Props = {
  c: ReturnType<typeof mkColors>;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBrowseClick: () => void;
};

export function DocumentUploadZone({ c, isDragging, onDragOver, onDragLeave, onDrop, fileInputRef, onFileInputChange, onBrowseClick }: Props) {
  return (
    <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="space-y-6">
      <motion.div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowseClick}
        animate={{
          borderColor: isDragging ? "rgba(245,158,11,0.6)" : c.border,
          background: isDragging ? c.amberBg : c.surface,
          scale: isDragging ? 1.01 : 1
        }}
        transition={{ duration: 0.2 }}
        className="cursor-pointer rounded-3xl p-10 text-center relative overflow-hidden"
        style={{ border: `2px dashed ${c.border}` }}
        whileHover={{ borderColor: c.amberBorder, background: c.amberBg }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-8 w-24 h-24 rounded-full" style={{ opacity: c.isDark ? 0.05 : 0.08, background: "radial-gradient(circle, #f59e0b, transparent)" }} />
          <div className="absolute bottom-4 left-8 w-16 h-16 rounded-full" style={{ opacity: c.isDark ? 0.04 : 0.06, background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf" className="hidden" onChange={onFileInputChange} />

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}
        >
          <Upload style={{ color: c.amber }} size={28} />
        </motion.div>

        <h3 className="text-xl font-extrabold mb-2" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
          {isDragging ? "Drop your file here!" : "Upload Your Study Material"}
        </h3>
        <p className="text-sm mb-1" style={{ color: c.textSec }}>
          Drag & Drop or <span style={{ color: c.amber }} className="font-semibold">Browse Files</span>
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {["PDF", "DOCX", "PPTX", "TXT", "Markdown"].map((fmt, i) => (
            <motion.span
              key={fmt}
              custom={i}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.amber }}
            >
              {fmt}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <div>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
          <Zap size={15} style={{ color: c.amber }} /> How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Upload", desc: "Drop any study material — lecture notes, textbooks, or presentation slides.", icon: <Upload size={18} style={{ color: c.amber }} /> },
            { step: "02", title: "Analyze", desc: "AI engine extracts text context and maps complex syllabus structures automatically.", icon: <Brain size={18} style={{ color: "#a78bfa" }} /> },
            { step: "03", title: "Generate", desc: "Instantly get core concept lists, exam prep summaries, keywords, and quick revision.", icon: <Sparkles size={18} style={{ color: "#22d3ee" }} /> }
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-5 rounded-2xl relative overflow-hidden group transition-all"
              style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                  {item.icon}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Step {item.step}</span>
                  <h4 className="text-sm font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>{item.title}</h4>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        variants={fadeUp} custom={3} initial="hidden" animate="visible"
        className="p-5 rounded-2xl"
        style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
      >
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
          <Star size={14} style={{ color: c.amber }} /> Features
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {["Topic Detection", "AI Summary", "Key Points", "Quick Revision", "Smart Search", "Multi-format Support", "Copy Summary", "Export PDF", "Export DOCX"].map((feat, i) => (
            <motion.div key={feat} custom={i} variants={scaleIn} initial="hidden" animate="visible" className="flex items-center gap-2 text-sm" style={{ color: c.textSec }}>
              <CheckCircle2 size={14} style={{ color: c.amber }} className="shrink-0" />
              <span>{feat}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
