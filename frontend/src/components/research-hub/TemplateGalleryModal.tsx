"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Eye, Layers, Search, Sparkles, BookOpen } from "lucide-react";

export interface AcademicTemplate {
  id: string;
  name: string;
  category: "Conference" | "Journal" | "Institutional" | "Specialized";
  columns: 1 | 2;
  fontFamily: string;
  fontSize: string;
  description: string;
}

export const ACADEMIC_TEMPLATES_LIST: AcademicTemplate[] = [
  { id: "IEEE", name: "IEEE Conference", category: "Conference", columns: 2, fontFamily: "Times New Roman", fontSize: "10pt", description: "Standard IEEE two-column layout for international conference proceedings." },
  { id: "IEEE-Journal", name: "IEEE Transactions Journal", category: "Journal", columns: 2, fontFamily: "Times New Roman", fontSize: "9.5pt", description: "Formal IEEE Transactions layout with author affiliations and running headers." },
  { id: "ACM", name: "ACM Primary Article", category: "Conference", columns: 2, fontFamily: "Helvetica / Arial", fontSize: "9pt", description: "Official Association for Computing Machinery publication template." },
  { id: "Springer-LNCS", name: "Springer LNCS", category: "Conference", columns: 1, fontFamily: "Computer Modern", fontSize: "10pt", description: "Lecture Notes in Computer Science single-column format." },
  { id: "Elsevier", name: "Elsevier ScienceDirect", category: "Journal", columns: 2, fontFamily: "Times New Roman", fontSize: "10pt", description: "Two-column article style formatted for Elsevier journals." },
  { id: "Nature", name: "Nature Science Style", category: "Journal", columns: 1, fontFamily: "Georgia / Serif", fontSize: "10.5pt", description: "High-impact single-column journal format with summary lead paragraph." },
  { id: "Thesis", name: "University Academic Thesis", category: "Institutional", columns: 1, fontFamily: "Times New Roman", fontSize: "12pt", description: "Formatted for Master & PhD dissertation chapter submissions." },
  { id: "TechReport", name: "Technical Report", category: "Institutional", columns: 1, fontFamily: "Inter / Sans", fontSize: "10.5pt", description: "Corporate and institutional R&D technical paper format." },
  { id: "Survey", name: "Comprehensive Survey Paper", category: "Specialized", columns: 2, fontFamily: "Times New Roman", fontSize: "10pt", description: "Multi-taxonomy survey paper with comparison tables and classification matrices." },
  { id: "Review", name: "State-of-the-Art Review", category: "Specialized", columns: 1, fontFamily: "Georgia", fontSize: "11pt", description: "Systematic literature review paper layout." },
];

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  c: any;
}

export function TemplateGalleryModal({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
  c,
}: TemplateGalleryModalProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [previewTemplate, setPreviewTemplate] = useState<AcademicTemplate | null>(null);

  if (!isOpen) return null;

  const categories = ["ALL", "Conference", "Journal", "Institutional", "Specialized"];

  const filteredTemplates = ACADEMIC_TEMPLATES_LIST.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          style={{ background: c.isDark ? "#0f172a" : "#ffffff", border: `1px solid ${c.border}` }}
        >
          {/* Modal Header */}
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: c.text }}>Academic Publication Template Gallery</h2>
                <p className="text-xs" style={{ color: c.textMuted }}>Select a publication format. Content renders dynamically without duplication.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: c.inputBg, color: c.text, border: `1px solid ${c.border}` }}
              />
            </div>
          </div>

          {/* Modal Content Grid */}
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(t => {
              const isSelected = selectedTemplate.toLowerCase() === t.id.toLowerCase();
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl flex flex-col justify-between transition-all border ${
                    isSelected ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {t.columns === 2 ? "2 Columns" : "Single Column"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold mb-1" style={{ color: c.text }}>{t.name}</h3>
                    <p className="text-xs line-clamp-2 mb-4" style={{ color: c.textMuted }}>{t.description}</p>
                  </div>

                  <div className="pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${c.divider}` }}>
                    <button
                      onClick={() => setPreviewTemplate(t)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10"
                      style={{ color: c.text }}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      onClick={() => {
                        onSelectTemplate(t.id);
                        onClose();
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      }`}
                    >
                      {isSelected ? <><Check size={14} /> Active</> : "Use Template"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-4 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${c.divider}`, color: c.textMuted }}>
            <span>Showing {filteredTemplates.length} publication templates</span>
            <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white/10 font-semibold text-white">Close</button>
          </div>
        </motion.div>
      </div>

      {/* Mini Preview Drawer Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{previewTemplate.name} Layout Spec</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 font-serif text-xs leading-relaxed space-y-2 border border-slate-800">
              <div className="text-center font-bold text-base">{previewTemplate.name} Preview Document</div>
              <div className="text-center text-slate-400 text-[10px]">Author Name(s) • Institution Department</div>
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] italic">
                Abstract— Demonstrating instant visual re-layout using ${previewTemplate.name} template guidelines (${previewTemplate.columns} column format, ${previewTemplate.fontSize} font size).
              </div>
              <div className={previewTemplate.columns === 2 ? "grid grid-cols-2 gap-4 pt-2" : "space-y-2 pt-2"}>
                <div>
                  <div className="font-bold text-slate-200">1. INTRODUCTION</div>
                  <p className="text-[10px] text-slate-400">Scientific literature formatting automatically renders figures, math equations, and references.</p>
                </div>
                <div>
                  <div className="font-bold text-slate-200">2. METHODOLOGY</div>
                  <p className="text-[10px] text-slate-400">Section details and citations are formatted in standard peer-reviewed citation style.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectTemplate(previewTemplate.id);
                setPreviewTemplate(null);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white"
            >
              Apply {previewTemplate.name} Template
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
