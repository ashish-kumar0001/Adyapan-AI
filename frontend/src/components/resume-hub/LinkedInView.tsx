"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import {
  Layers, Sparkles, RefreshCw, Calendar,
  Copy, Check, Info, Award
} from "lucide-react";

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(t);
    const obs = new MutationObserver(() => setTheme(document.documentElement.getAttribute("data-theme") || "dark"));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

const mkColors = (theme: string) => {
  const isDark = theme === "dark";
  return {
    isDark,
    text: isDark ? "#e5e7eb" : "#0f172a", textSec: isDark ? "#9ca3af" : "#475569", textMuted: isDark ? "#828fa3" : "#5f6368",
    bg: isDark ? "rgba(255,255,255,0.025)" : "#ffffff", bgHover: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", surfaceHover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", borderHover: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)",
    borderFocus: isDark ? "rgba(245,158,11,0.45)" : "rgba(245,158,11,0.5)", inputBg: isDark ? "rgba(0,0,0,0.35)" : "#f1f5f9",
    cardBg: isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
    amber: "#f59e0b", amberBg: isDark ? "rgba(245,158,11,0.07)" : "rgba(245,158,11,0.08)", amberBorder: isDark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.25)",
    green: "#10b981", greenBg: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
    divider: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    pill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", pillBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };
};

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) };
const scaleIn = { hidden: { opacity: 0, scale: 0.92 }, visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }) };

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
  const theme = useTheme();
  const c = mkColors(theme);

  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
        headline, about, experience, skills, targetRole,
      });
      if (res.data.success && res.data.report) {
        setReport(res.data.report);
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to analyze profile.");
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
        if (report) setReport({ ...report, headline: res.data.headline });
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
        if (report) setReport({ ...report, aboutSection: res.data.about });
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

  const getScoreColor = (score: number) => score >= 80 ? c.green : score >= 60 ? c.amber : "#ef4444";
  const getScoreBg = (score: number) => score >= 80 ? c.greenBg : score >= 60 ? c.amberBg : "rgba(239,68,68,0.1)";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex flex-col antialiased h-full" style={{ color: c.text }}>
      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center gap-2.5 pb-3 mb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
          <Layers size={18} style={{ color: "#000" }} />
        </motion.div>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="text-base font-extrabold leading-tight" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>LinkedIn Optimizer</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-xs leading-tight" style={{ color: c.textMuted }}>Optimize your LinkedIn profile for recruiters</motion.p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <AnimatePresence mode="wait">
              {!report ? (
                <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold" style={{ color: c.textSec }}>Target Role</label>
                      <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. SDE-1 / Data Analyst" className="w-full rounded-xl px-3 py-2 text-xs transition-all focus:outline-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold" style={{ color: c.textSec }}>Core Skills (comma separated)</label>
                      <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Node, SQL" className="w-full rounded-xl px-3 py-2 text-xs transition-all focus:outline-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold" style={{ color: c.textSec }}>LinkedIn Headline</label>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleGenerateHeadline} disabled={loading || !targetRole} style={{ background: "none", border: "none", color: c.amber, cursor: "pointer", fontSize: "0.6rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Sparkles size={9} /> AI Generate
                      </motion.button>
                    </div>
                    <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Enter current headline, or generate with AI..." className="w-full rounded-xl px-3 py-2 text-xs transition-all focus:outline-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold" style={{ color: c.textSec }}>About / Summary</label>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleGenerateAbout} disabled={loading || !targetRole} style={{ background: "none", border: "none", color: c.amber, cursor: "pointer", fontSize: "0.6rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Sparkles size={9} /> AI Generate
                      </motion.button>
                    </div>
                    <textarea rows={3} value={about} onChange={e => setAbout(e.target.value)} placeholder="Enter current summary, or generate with AI..." className="w-full rounded-xl px-3 py-2 text-xs transition-all focus:outline-none resize-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
                  </div>
                  <div className="mt-3 space-y-1">
                    <label className="text-[10px] font-semibold" style={{ color: c.textSec }}>Experience Highlights</label>
                    <textarea rows={2} value={experience} onChange={e => setExperience(e.target.value)} placeholder="Summarize your work experience context..." className="w-full rounded-xl px-3 py-2 text-xs transition-all focus:outline-none resize-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} onClick={handleAudit}
                    className="w-full mt-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", opacity: loading ? 0.6 : 1 }}>
                    {loading ? <><RefreshCw className="animate-spin" size={14} /> Analyzing...</> : <><Sparkles size={14} /> Run Profile Optimizer</>}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Score */}
                  <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="46" stroke={c.border} strokeWidth="8" fill="transparent" />
                        <circle cx="56" cy="56" r="46" stroke={getScoreColor(report.score)} strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 46} strokeDashoffset={2 * Math.PI * 46 * (1 - report.score / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-extrabold" style={{ color: c.text }}>{report.score}%</span>
                        <span className="block text-[7px] uppercase tracking-wider font-bold" style={{ color: c.textMuted }}>Score</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <h3 className="text-sm font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>LinkedIn Audit Report</h3>
                      <p className="text-xs" style={{ color: c.textMuted }}>AI-optimized headlines, summaries, and profile score suggestions below.</p>
                      <motion.button onClick={() => setReport(null)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ background: "none", border: "none", color: c.amber, cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <RefreshCw size={11} /> Re-audit Profile
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Optimized Headline */}
                  <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div className="flex justify-between items-center mb-2 pb-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: c.text }}><Award size={13} style={{ color: c.amber }} /> Optimized Headline</h4>
                      <motion.button onClick={() => handleCopy(report.headline, "hl")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1.5 rounded" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                        {copiedKey === "hl" ? <Check size={12} style={{ color: c.green }} /> : <Copy size={12} />}
                      </motion.button>
                    </div>
                    <p className="text-xs select-all p-3 rounded-lg leading-relaxed" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}>{report.headline}</p>
                  </motion.div>

                  {/* Optimized About */}
                  <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div className="flex justify-between items-center mb-2 pb-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: c.text }}><Info size={13} style={{ color: "#22d3ee" }} /> Optimized About Summary</h4>
                      <motion.button onClick={() => handleCopy(report.aboutSection, "ab")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1.5 rounded" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                        {copiedKey === "ab" ? <Check size={12} style={{ color: c.green }} /> : <Copy size={12} />}
                      </motion.button>
                    </div>
                    <p className="text-xs select-all p-3 rounded-lg whitespace-pre-line leading-relaxed" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}>{report.aboutSection}</p>
                  </motion.div>

                  {/* Suggestions & Skills */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                      <h4 className="text-xs font-bold mb-3" style={{ color: c.amber }}>Suggestions</h4>
                      <ul className="space-y-1">
                        {(report.recommendations || []).map((rec, j) => (
                          <motion.li key={j} custom={j} variants={scaleIn} initial="hidden" animate="visible" className="text-[11px] flex items-start gap-1.5" style={{ color: c.textSec }}>
                            <span style={{ color: c.amber }}>•</span> {rec}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                      <h4 className="text-xs font-bold mb-3" style={{ color: c.amber }}>Skills to Add</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(report.skills || []).map((sk, j) => (
                          <motion.span key={sk} custom={j} variants={scaleIn} initial="hidden" animate="visible" className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ background: c.amberBg, color: c.amber, border: `1px solid ${c.amberBorder}` }}>{sk}</motion.span>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: History */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-5 space-y-4">
            <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }}>
                <Layers size={16} style={{ color: c.amber }} />
              </motion.div>
              Audit History
            </h2>
            <div className="p-4 rounded-2xl space-y-2 max-h-[480px] overflow-y-auto" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              {history.length === 0 ? (
                <div className="text-center py-8" style={{ color: c.textMuted }}>
                  <Layers size={32} className="mx-auto mb-2" style={{ opacity: 0.5 }} />
                  <span className="text-xs font-semibold">No audit reports found.</span>
                </div>
              ) : (
                history.map((h, i) => (
                  <motion.div key={h.id} custom={i} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -2, scale: 1.01 }}
                    onClick={() => setReport(h)} className="p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs font-bold truncate" style={{ color: c.text }}>{h.headline}</div>
                      <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: c.textMuted }}><Calendar size={10} /> {new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-[10px]" style={{ background: getScoreBg(h.score), color: getScoreColor(h.score) }}>{h.score}</div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

