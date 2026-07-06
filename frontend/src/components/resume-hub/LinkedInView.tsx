"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import {
  Layers, ArrowLeft, Sparkles, RefreshCw, Calendar,
  Copy, Check, Info, Award
} from "lucide-react";

import type { ResumeHubViewType } from "@/types/resume";

interface LinkedInReport {
  id: string;
  score: number;
  headline: string;
  aboutSection: string;
  recommendations: string[];
  skills: string[];
  createdAt: string;
}

interface LinkedInViewProps {
  setView: (v: ResumeHubViewType) => void;
}

export function LinkedInView({ setView }: LinkedInViewProps) {
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Result state
  const [report, setReport] = useState<LinkedInReport | null>(null);
  const [history, setHistory] = useState<LinkedInReport[]>([]);

  const loadHistory = async () => {
    try {
      const res = await api.get("/linkedin/history");
      setHistory(res.data.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAudit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/linkedin/analyze", {
        headline,
        about,
        experience,
        skills,
        targetRole,
      });
      if (res.data.success && res.data.report) {
        setReport(res.data.report);
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to analyze profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHeadline = async () => {
    setLoading(true);
    try {
      const res = await api.post("/linkedin/generate-headline", { targetRole, skills });
      if (res.data.success && res.data.headline) {
        setHeadline(res.data.headline);
        if (report) {
          setReport({ ...report, headline: res.data.headline });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAbout = async () => {
    setLoading(true);
    try {
      const res = await api.post("/linkedin/generate-about", { targetRole, experience, skills });
      if (res.data.success && res.data.about) {
        setAbout(res.data.about);
        if (report) {
          setReport({ ...report, aboutSection: res.data.about });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "rgba(16,185,129,0.1)";
    if (score >= 60) return "rgba(245,158,11,0.1)";
    return "rgba(239,68,68,0.1)";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("resume-hub")}
          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] transition-colors border border-[var(--border-color)]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            LinkedIn Optimizer
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">Optimize your LinkedIn profile for recruiters & hiring search systems.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Form Input or Audit Results */}
        <div className="lg:col-span-7 space-y-6">
          {!report ? (
            <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. SDE-1 / Data Analyst"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">Core Skills (separated by commas)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. React, Node, SQL"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold">LinkedIn Headline</label>
                  <button
                    type="button"
                    onClick={handleGenerateHeadline}
                    disabled={loading || !targetRole}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f59e0b] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> AI Generate Headline
                  </button>
                </div>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="Enter current headline, or generate with AI..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold">About / Summary Section</label>
                  <button
                    type="button"
                    onClick={handleGenerateAbout}
                    disabled={loading || !targetRole}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f59e0b] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> AI Generate Summary
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  placeholder="Enter current summary, or generate with AI..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">Experience Highlights</label>
                <textarea
                  rows={3}
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="Summarize your work experience context..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)] resize-none"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleAudit}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run Profile Optimizer
                  </>
                )}
              </button>
            </div>
          ) : (
            // Audit Results Display
            <div className="space-y-6">
              {/* Profile score */}
              <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="var(--border-color)" strokeWidth="10" fill="transparent" />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke={getScoreColor(report.score)}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - report.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">{report.score}%</span>
                    <span className="block text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Score</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">LinkedIn Audit Report</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Review AI-optimized headlines, summaries, and profile score suggestions below.
                  </p>
                  <button
                    onClick={() => { setReport(null); }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f59e0b] hover:underline bg-transparent border-none cursor-pointer mt-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-audit Profile
                  </button>
                </div>
              </div>

              {/* Optimized Content Cards */}
              <div className="space-y-4">
                {/* Optimized Headline */}
                <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#f59e0b]" /> Optimized Headline
                    </h4>
                    <button
                      onClick={() => handleCopy(report.headline, "hl")}
                      className="p-1.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
                    >
                      {copiedKey === "hl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-primary)] font-mono select-all bg-[var(--bg-dark)] p-3 rounded-lg border border-[var(--border-color)] leading-relaxed">
                    {report.headline}
                  </p>
                </div>

                {/* Optimized About */}
                <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-cyan-400" /> Optimized About Summary
                    </h4>
                    <button
                      onClick={() => handleCopy(report.aboutSection, "ab")}
                      className="p-1.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
                    >
                      {copiedKey === "ab" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-primary)] select-all bg-[var(--bg-dark)] p-3 rounded-lg border border-[var(--border-color)] whitespace-pre-line leading-relaxed font-mono">
                    {report.aboutSection}
                  </p>
                </div>

                {/* Recommendations & Recommended Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-[#f59e0b] border-b border-[var(--border-color)] pb-2">Suggestions</h4>
                    <ul className="space-y-1.5 text-[10px] text-[var(--text-secondary)] pl-2">
                      {((report.recommendations || []) as string[]).map((rec, i) => (
                        <li key={i} className="list-disc leading-relaxed">{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-[#f59e0b] border-b border-[var(--border-color)] pb-2">Skills to Add</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {((report.skills || []) as string[]).map((sk) => (
                        <span key={sk} className="px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/10 text-[10px] font-semibold rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Historical Reports */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#f59e0b]" /> Audit History
          </h2>
          <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 max-h-[480px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-semibold">No audit reports found.</span>
              </div>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setReport(h);
                  }}
                  className="p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="min-width-0 flex-1 pr-2">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {h.headline}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(h.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-[10px]"
                    style={{ background: getScoreBg(h.score), color: getScoreColor(h.score) }}
                  >
                    {h.score}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
