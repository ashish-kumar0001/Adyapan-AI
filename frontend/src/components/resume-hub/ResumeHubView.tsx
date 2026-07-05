"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import {
  FileText, LineChart, Layers, FileCheck2, Zap, ArrowRight, Plus, Trash2, Calendar
} from "lucide-react";
import type { ResumeHubViewType } from "@/types/resume";

interface ResumeListItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface AtsReportItem {
  score: number;
}

interface LinkedInReportItem {
  score: number;
}

interface ResumeHubViewProps {
  setView: (v: ResumeHubViewType) => void;
}

export function ResumeHubView({ setView }: ResumeHubViewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResumes: 0,
    avgAtsScore: 0,
    totalLetters: 0,
    avgLinkedInScore: 0,
  });
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [resList, atsList, letterList, linkedinList] = await Promise.all([
          api.get("/resume/list").then(r => r.data.resumes || []),
          api.get("/ats/history").then(r => r.data.reports || []),
          api.get("/cover-letter/history").then(r => r.data.coverLetters || []),
          api.get("/linkedin/history").then(r => r.data.reports || []),
        ]);

        setResumes(resList);

        const totalResumes = resList.length;
        const totalLetters = letterList.length;

        const avgAtsScore = atsList.length
          ? Math.round(atsList.reduce((sum: number, r: AtsReportItem) => sum + r.score, 0) / atsList.length)
          : 0;

        const avgLinkedInScore = linkedinList.length
          ? Math.round(linkedinList.reduce((sum: number, r: LinkedInReportItem) => sum + r.score, 0) / linkedinList.length)
          : 0;

        setStats({
          totalResumes,
          avgAtsScore,
          totalLetters,
          avgLinkedInScore,
        });
      } catch (err) {
        console.error("Failed to load Resume Hub data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDeleteResume = async (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await api.delete(`/resume/delete/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, totalResumes: Math.max(0, prev.totalResumes - 1) }));
    } catch (err) {
      console.error(err);
    }
  };

  const tools = [
    {
      id: "builder",
      title: "Resume Builder",
      description: "Build, edit, and optimize professional drafts in real-time with multiple custom templates.",
      icon: <FileText className="w-6 h-6 text-[#f59e0b]" />,
      actionLabel: "Build Resume",
      target: "resume-builder",
    },
    {
      id: "ats",
      title: "ATS Score Checker",
      description: "Upload your resume in PDF/DOCX format to calculate keyword density, parsing formatting, and readability scores.",
      icon: <FileCheck2 className="w-6 h-6 text-[#10b981]" />,
      actionLabel: "Check Score",
      target: "ats-checker",
    },
    {
      id: "cover-letter",
      title: "Cover Letter Generator",
      description: "Generate highly-tailored cover letters for target roles and companies, customized to different professional tones.",
      icon: <Zap className="w-6 h-6 text-[#8b5cf6]" />,
      actionLabel: "Create Letter",
      target: "cover-letter",
    },
    {
      id: "linkedin",
      title: "LinkedIn Optimizer",
      description: "Audit your LinkedIn headline, bio, and experience bullet points to expand search visibility and recruit appeal.",
      icon: <Layers className="w-6 h-6 text-[#ec4899]" />,
      actionLabel: "Optimize Profile",
      target: "linkedin-optimizer",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 w-32 bg-white/5 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-36 bg-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 bg-white/5 rounded" />
            <div className="h-80 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Resume Hub
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Create resumes, analyze keywords, check ATS scores, and prepare cover letters with AI assistance.
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Resumes", value: stats.totalResumes, icon: <FileText className="w-4 h-4 text-[#f59e0b]" />, bg: "rgba(245,158,11,0.05)" },
          { label: "Avg ATS Score", value: `${stats.avgAtsScore}%`, icon: <FileCheck2 className="w-4 h-4 text-[#10b981]" />, bg: "rgba(16,185,129,0.05)" },
          { label: "Cover Letters", value: stats.totalLetters, icon: <Zap className="w-4 h-4 text-[#8b5cf6]" />, bg: "rgba(139,92,246,0.05)" },
          { label: "Avg LinkedIn score", value: `${stats.avgLinkedInScore}%`, icon: <Layers className="w-4 h-4 text-[#ec4899]" />, bg: "rgba(236,72,153,0.05)" }
        ].map((item, i) => (
          <div
            key={i}
            className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-2xl p-4 flex items-center justify-between transition-all"
          >
            <div>
              <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">{item.label}</span>
              <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{item.value}</div>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: item.bg }}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Tools */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ color: "var(--text-primary)" }}>
            <Layers className="w-5 h-5 text-[#f59e0b]" /> Custom Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setView(tool.target as ResumeHubViewType)}
                className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#f59e0b]/30 rounded-2xl p-5 hover:translate-y-[-2px] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-center mb-4 group-hover:scale-105 transition-all">
                    {tool.icon}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">{tool.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">{tool.description}</p>
                </div>
                <button className="inline-flex items-center gap-1 text-xs font-bold text-[#f59e0b] group-hover:underline">
                  {tool.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Resume Drafts & History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ color: "var(--text-primary)" }}>
              <FileText className="w-5 h-5 text-[#f59e0b]" /> Recent Drafts
            </h2>
            <button
              onClick={() => setView("resume-builder")}
              className="w-7 h-7 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] flex items-center justify-center text-black transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-4 max-h-[430px] overflow-y-auto">
            {resumes.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-semibold">No drafts found. Click + to build one!</span>
              </div>
            ) : (
              resumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => {
                    // Set active resume id in localStorage or state and navigate to builder
                    localStorage.setItem("active-resume-id", resume.id);
                    setView("resume-builder");
                  }}
                  className="p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="min-width-0 flex-1 pr-2">
                    <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#f59e0b] truncate transition-colors">
                      {resume.title}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteResume(resume.id, e)}
                    className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
