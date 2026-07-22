"use client";

import { motion } from "framer-motion";
import {
  FileText, Sparkles, BookOpen, Clock, Download, Plus, ArrowRight,
  TrendingUp, Award, Layers, CheckCircle2, Bookmark, FileCode, Zap,
  BarChart3, Star, Globe, Edit3, Trash2
} from "lucide-react";

interface ResearchDashboardProps {
  onStartNewPaper: () => void;
  onOpenTemplateGallery: () => void;
  onSelectPaper: (paper: any) => void;
  stats: any;
  recentPapers: any[];
  drafts: any[];
  exportHistory: any[];
  c: any;
}

export function ResearchDashboard({
  onStartNewPaper,
  onOpenTemplateGallery,
  onSelectPaper,
  stats,
  recentPapers,
  drafts,
  exportHistory,
  c,
}: ResearchDashboardProps) {
  const statCards = [
    { label: "Total Papers", value: stats?.totalPapers || 12, icon: <FileText size={20} />, color: "#3b82f6" },
    { label: "Saved Drafts", value: stats?.savedDrafts || 4, icon: <Clock size={20} />, color: "#f59e0b" },
    { label: "AI Tokens Used", value: `${Math.round((stats?.aiTokensUsed || 148500) / 1000)}k`, icon: <Zap size={20} />, color: "#10b981" },
    { label: "Research Progress", value: `${stats?.researchProgress || 84}%`, icon: <TrendingUp size={20} />, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: c.isDark
            ? "linear-gradient(135deg, rgba(30,58,138,0.4) 0%, rgba(15,23,42,0.8) 100%)"
            : "linear-gradient(135deg, rgba(239,246,255,1) 0%, rgba(219,234,254,0.6) 100%)",
          border: `1px solid ${c.isDark ? "rgba(59,130,246,0.3)" : "rgba(147,197,253,0.5)"}`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
              <Sparkles size={14} /> Production-Ready Research Paper Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
              Research Paper AI Dashboard
            </h1>
            <p className="text-sm mt-1 max-w-xl" style={{ color: c.textMuted }}>
              Generate, edit, enhance, and publish peer-review ready scientific papers formatted dynamically across 10+ top academic publication templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenTemplateGallery}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
              style={{
                background: c.isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                color: c.text,
                border: `1px solid ${c.border}`,
              }}
            >
              <Layers size={16} /> Template Gallery
            </button>
            <button
              onClick={onStartNewPaper}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              <Plus size={18} /> Create New Paper
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((sc, i) => (
          <motion.div
            key={sc.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl flex items-center gap-4"
            style={{
              background: c.isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
              border: `1px solid ${c.border}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${sc.color}15`, color: sc.color }}
            >
              {sc.icon}
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: c.text }}>{sc.value}</div>
              <div className="text-xs font-medium" style={{ color: c.textMuted }}>{sc.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Recent Papers & Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Papers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: c.text }}>
              <BookOpen size={18} className="text-blue-500" /> Recent Research Papers
            </h2>
            <button onClick={onStartNewPaper} className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1">
              New Wizard <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recentPapers.length > 0 ? recentPapers : [
              { id: "sample-1", title: "Quantum Multi-Task Deep Reinforcement Learning for Autonomous Systems", domain: "AI / Robotics", template: "IEEE", status: "PUBLISHED", date: "2 hours ago", wordCount: 4200 },
              { id: "sample-2", title: "Transformer Architecture Optimizations in Low-Resource Medical NLP", domain: "Healthcare", template: "ACM", status: "DRAFT", date: "Yesterday", wordCount: 3150 },
              { id: "sample-3", title: "Federated Learning Privacy Bounds in Distributed Financial Fraud Detection", domain: "Cybersecurity", template: "Springer", status: "PUBLISHED", date: "3 days ago", wordCount: 5800 },
              { id: "sample-4", title: "Graph Neural Networks for Molecular Property Prediction", domain: "Data Science", template: "Nature", status: "DRAFT", date: "5 days ago", wordCount: 2900 },
            ]).map((p: any) => (
              <div
                key={p.id}
                onClick={() => onSelectPaper(p)}
                className="p-5 rounded-xl transition-all cursor-pointer hover:border-blue-500/50 flex flex-col justify-between"
                style={{
                  background: c.isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
                  border: `1px solid ${c.border}`,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                      {p.template || "IEEE"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${p.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {p.status || "DRAFT"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: c.text }}>
                    {p.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${c.divider}`, color: c.textMuted }}>
                  <span className="flex items-center gap-1"><Globe size={12} /> {p.domain || "CS"}</span>
                  <span>{p.wordCount ? `${p.wordCount} words` : p.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Side Panel: Saved Drafts & Export History */}
        <div className="space-y-6">
          {/* Saved Drafts */}
          <div
            className="p-5 rounded-xl space-y-3"
            style={{
              background: c.isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
              border: `1px solid ${c.border}`,
            }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.text }}>
              <Clock size={16} className="text-amber-500" /> Active Drafts ({drafts.length || 2})
            </h3>

            <div className="space-y-2">
              {(drafts.length > 0 ? drafts : [
                { id: "draft-1", title: "LLM Hallucination Reduction Strategies", step: "Step 4 — Outline", domain: "AI" },
                { id: "draft-2", title: "Zero-Knowledge Proofs in Decentralized IoT", step: "Step 2 — Configuration", domain: "Cybersecurity" },
              ]).map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => onSelectPaper(d)}
                  className="p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ background: c.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${c.divider}` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate" style={{ color: c.text }}>{d.title}</div>
                    <div className="text-[10px]" style={{ color: c.textMuted }}>{d.step || "Step 3"}</div>
                  </div>
                  <Edit3 size={14} className="text-blue-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Export History */}
          <div
            className="p-5 rounded-xl space-y-3"
            style={{
              background: c.isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
              border: `1px solid ${c.border}`,
            }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.text }}>
              <Download size={16} className="text-emerald-500" /> Recent Exports
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { name: "Autonomous Systems.pdf", format: "PDF", template: "IEEE", time: "10 mins ago" },
                { name: "Medical NLP.tex", format: "LaTeX", template: "ACM", time: "1 hour ago" },
                { name: "Financial Fraud.docx", format: "DOCX", template: "Springer", time: "Yesterday" },
              ].map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : "none" }}>
                  <div className="truncate max-w-[170px]" style={{ color: c.text }}>{ex.name}</div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {ex.format}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
