"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

import { ResearchDashboard } from "./ResearchDashboard";
import { ResearchWizard } from "./ResearchWizard";
import { PaperEditorWorkspace } from "./PaperEditorWorkspace";
import { TemplateGalleryModal } from "./TemplateGalleryModal";
import { PlagiarismCheckerView } from "./PlagiarismCheckerView";

interface ResearchHubViewProps {
  setView: (v: string) => void;
  activeModule?: string;
  theme?: string;
}

type ViewState = "dashboard" | "wizard" | "workspace" | "plagiarism";

export function ResearchHubView({ setView, activeModule, theme: propTheme }: ResearchHubViewProps) {
  const currentTheme = useTheme();
  const isDark = currentTheme === "dark";

  const c = {
    isDark,
    text: isDark ? "#e5e7eb" : "#0f172a",
    textSec: isDark ? "#9ca3af" : "#475569",
    textMuted: isDark ? "#828fa3" : "#64748b",
    bg: isDark ? "#0b0f19" : "#ffffff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    divider: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    inputBg: isDark ? "rgba(0,0,0,0.35)" : "#f1f5f9",
    amber: "#f59e0b",
    amberGlow: "rgba(245,158,11,0.2)",
    amberGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  };

  const [viewState, setViewState] = useState<ViewState>("dashboard");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("IEEE");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/research/dashboard");
      if (res.data?.success) {
        setDashboardStats(res.data.stats);
        setRecentPapers(res.data.recentPapers || []);
        setDrafts(res.data.drafts || []);
      }
    } catch {
      setDashboardStats({
        totalPapers: 0,
        savedDrafts: 0,
        publishedPapers: 0,
        aiTokensUsed: 0,
        researchProgress: 100,
      });
    }
  };

  const handleSelectPaper = (paper: any) => {
    setSelectedPaper(paper);
    setViewState("workspace");
  };

  const handleWizardFinish = (paper: any) => {
    setSelectedPaper(paper);
    setViewState("workspace");
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 transition-colors" style={{ background: c.bg, color: c.text }}>
      {/* Top Header Switcher */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewState("dashboard")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              viewState === "dashboard"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewState("wizard")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              viewState === "wizard"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            9-Step Paper Wizard
          </button>
          <button
            onClick={() => setViewState("plagiarism")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              viewState === "plagiarism"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Plagiarism Checker
          </button>
        </div>

        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5"
        >
          Template: <span className="text-amber-300 font-extrabold">{selectedTemplate}</span>
        </button>
      </div>

      {/* Main View Transitioning Body */}
      <AnimatePresence mode="wait">
        {viewState === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ResearchDashboard
              onStartNewPaper={() => setViewState("wizard")}
              onOpenTemplateGallery={() => setIsTemplateModalOpen(true)}
              onSelectPaper={handleSelectPaper}
              stats={dashboardStats}
              recentPapers={recentPapers}
              drafts={drafts}
              exportHistory={exportHistory}
              c={c}
            />
          </motion.div>
        )}

        {viewState === "wizard" && (
          <motion.div key="wizard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ResearchWizard
              onCancel={() => setViewState("dashboard")}
              onFinish={handleWizardFinish}
              c={c}
            />
          </motion.div>
        )}

        {viewState === "workspace" && (
          <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <PaperEditorWorkspace
              paper={selectedPaper || {
                title: "Quantum Multi-Task Deep Reinforcement Learning for Autonomous Systems",
                abstract: "This paper presents a novel quantum multi-task deep reinforcement learning framework...",
                sections: [
                  { id: "abstract", title: "Abstract", content: "Concise summary of research contributions..." },
                  { id: "intro", title: "1. Introduction", content: "Autonomous multi-agent robotics require fast decision loops..." },
                ],
                metadata: { template: selectedTemplate, wordCount: 3800 }
              }}
              onBack={() => setViewState("dashboard")}
              onOpenTemplates={() => setIsTemplateModalOpen(true)}
              c={c}
            />
          </motion.div>
        )}

        {viewState === "plagiarism" && (
          <motion.div key="plagiarism" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <PlagiarismCheckerView setView={setView} activeModule={activeModule} theme={propTheme} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Academic Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={(tId) => setSelectedTemplate(tId)}
        c={c}
      />
    </div>
  );
}
