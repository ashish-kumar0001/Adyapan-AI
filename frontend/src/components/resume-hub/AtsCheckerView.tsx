"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import type { ResumeHubViewType } from "@/types/resume";
import {
  ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  Star, Sparkles, RefreshCw, MessageCircle, Send, X, ChevronRight,
  Download, Save, Eye, RotateCcw, Target, BarChart3, Search,
  BookOpen, Code2, Briefcase, GraduationCap,
  Sun, Moon, Zap, FileCheck2, Plus, Lightbulb,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ATSSectionScore {
  score: number;
  suggestions: string[];
}

interface ATSDeepAnalysis {
  score: number;
  scoreLabel: string;
  keywordsFound: string[];
  keywordsMissing: string[];
  readability: string;
  length: string;
  formatting: string;
  recruiterScore: number;
  sectionScores: {
    summary: ATSSectionScore;
    skills: ATSSectionScore;
    experience: ATSSectionScore;
    projects: ATSSectionScore;
    education: ATSSectionScore;
  };
  keywordAnalysis: { found: string[]; missing: string[] };
  formattingCheck: {
    onePage: boolean; fontsConsistent: boolean; atsFriendly: boolean;
    headingsCorrect: boolean; contactPresent: boolean;
  };
  strengthBars: {
    summary: number; projects: number; skills: number;
    experience: number; education: number;
  };
  recommendations: string[];
  formattingIssues: string[];
  strengths: string[];
}

interface ATSSuggestion {
  id: string;
  section: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  original: string;
  improved: string;
}

interface ResumeBrief {
  id: string;
  title: string;
  template: string;
  updatedAt: string;
}

interface AtsCheckerViewProps {
  setView: (v: ResumeHubViewType) => void;
}

// ─── Theme Colors ──────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(t);
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

const t = (theme: string) => ({
  bg: theme === "dark" ? "#080710" : "#f0f4ff",
  surface: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
  surfaceHover: theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
  border: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
  text: theme === "dark" ? "#ffffff" : "#0f172a",
  textSec: theme === "dark" ? "rgba(255,255,255,0.7)" : "#475569",
  textMuted: theme === "dark" ? "rgba(255,255,255,0.4)" : "#94a3b8",
  primary: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  chatBg: theme === "dark" ? "#0a0e14" : "#f8fafc",
  cardBg: theme === "dark" ? "rgba(255,255,255,0.03)" : "#ffffff",
});

// ─── Screen Components ─────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

// ===============================================================================
// MAIN COMPONENT
// ===============================================================================

export function AtsCheckerView({ setView }: AtsCheckerViewProps) {
  const theme = useTheme();
  const c = t(theme);

  // ─── Animation Variants ──────────────────────────────────────────────────────

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: custom * 0.08, ease: "easeOut" as const },
    }),
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (custom: number = 0) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, delay: custom * 0.08, ease: "easeOut" as const },
    }),
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };

  const cardHover = { y: -4, scale: 1.01 };

  const buttonHover = { scale: 1.04 };

  const buttonTap = { scale: 0.96 };

  const springIcon = {
    hidden: { scale: 0, rotate: -20 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring" as const, stiffness: 200, damping: 12 },
    },
  };

  // Screen state: "home" | "jd" | "loading" | "dashboard" | "suggestions" | "final"
  const [screen, setScreen] = useState("home");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resumes, setResumes] = useState<ResumeBrief[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [includeJD, setIncludeJD] = useState<"yes" | "skip" | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<ATSDeepAnalysis | null>(null);
  const [analysisRaw, setAnalysisRaw] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<ATSSuggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [updatedScore, setUpdatedScore] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    "Parsing Resume",
    "Extracting Skills",
    "Checking ATS Format",
    "Comparing Keywords",
    "Resume Analysis",
    "Generating Suggestions",
  ];

  // Load resumes list
  useEffect(() => {
    api.get("/resume/list").then(res => {
      setResumes(res.data.resumes || []);
    }).catch(() => {});
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── File handlers ───────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.endsWith(".docx") || f.name.endsWith(".doc"))) {
      setFile(f);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  // ─── Analyze ────────────────────────────────────────────────────────────────

  const startAnalysis = async () => {
    setLoading(true);
    setLoadingStep(0);

    // Animate through loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, loadingSteps.length - 1));
    }, 800);

    try {
      const fd = new FormData();
      if (file) fd.append("resume", file);
      if (selectedResumeId) fd.append("resumeId", selectedResumeId);
      fd.append("targetRole", targetRole);
      if (includeJD === "yes") {
        if (jdFile) {
          fd.append("jobDescription", await jdFile.text());
        } else if (jobDescription) {
          fd.append("jobDescription", jobDescription);
        }
      }

      const res = await api.post("/ats/analyze", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(stepInterval);
      setLoadingStep(loadingSteps.length - 1);

      if (res.data.analysis) {
        setAnalysis(res.data.analysis);
        setAnalysisRaw(res.data.analysis);
        setUpdatedScore(res.data.analysis.score);
      }

      // Small delay to show last step
      await new Promise(r => setTimeout(r, 600));
      setScreen("dashboard");

      // Generate suggestions in background
      generateSuggestions(res.data.analysis);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Please try again.";
      alert(`Failed to analyze resume. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async (analysisData?: any) => {
    try {
      const res = await api.post("/ats/suggestions", {
        targetRole,
        analysis: analysisData || analysis,
        resumeId: selectedResumeId || undefined,
      });
      if (res.data.suggestions) setSuggestions(res.data.suggestions);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Apply suggestion ───────────────────────────────────────────────────────

  const handleApplySuggestion = async (sugg: ATSSuggestion) => {
    try {
      const res = await api.post("/ats/apply-improvement", {
        section: sugg.section,
        originalContent: sugg.original,
        suggestionText: sugg.description,
      });
      if (res.data.improved) {
        setAppliedSuggestions(prev => new Set(prev).add(sugg.id));
        setUpdatedScore(prev => Math.min(100, prev + Math.round(Math.random() * 3 + 1)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndoSuggestion = (id: string) => {
    setAppliedSuggestions(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setUpdatedScore(prev => Math.max(0, prev - Math.round(Math.random() * 2 + 1)));
  };

  // ─── AI Chat ─────────────────────────────────────────────────────────────────

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/ats/chat", {
        message: msg,
        resumeId: selectedResumeId || undefined,
        analysis: analysisRaw,
      });
      if (res.data.reply) {
        setChatMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
        if (res.data.updatedSections) {
          // Could update analysis with new sections
        }
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── Score color helpers ────────────────────────────────────────────────────

  const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
  const scoreBg = (s: number) => s >= 80 ? "rgba(16,185,129,0.1)" : s >= 60 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
  const scoreLabel = (s: number) => s >= 90 ? "Excellent" : s >= 80 ? "Very Good" : s >= 65 ? "Good" : s >= 50 ? "Fair" : "Poor";

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-full flex flex-col" style={{ padding: "1.25rem" }}>
      {/* Top Navigation */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <motion.button
          whileHover={buttonHover} whileTap={buttonTap}
          onClick={() => screen === "home" ? setView("resume-hub") : setScreen("home")}
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
        >
          <ArrowLeft size={16} />
        </motion.button>
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: c.text }}>
            {screen === "home" ? "ATS Score Checker" :
             screen === "jd" ? "Job Description" :
             screen === "loading" ? "Analyzing Resume" :
             screen === "dashboard" ? "ATS Dashboard" :
             screen === "suggestions" ? "AI Suggestions" : "Resume Improved"}
          </h1>
          <p className="text-xs" style={{ color: c.textSec }}>
            {screen === "home" ? "Upload or choose a resume to check its ATS score" :
             screen === "jd" ? "Compare your resume against a job description" :
             screen === "loading" ? "Running comprehensive ATS analysis..." :
             screen === "dashboard" ? "Detailed ATS audit results" :
             screen === "suggestions" ? "AI-powered improvements for your resume" :
             "Your resume has been improved"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingRight: 4 }}>
      <AnimatePresence mode="wait">
        {/* ─────── SCREEN 1: HOME ─────── */}
        {screen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Target Role */}
            <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textSec }}>
                Target Job Role
              </label>
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                className="w-full p-3 rounded-xl text-sm outline-none"
                style={{
                  background: c.surface, border: `1px solid ${c.border}`,
                  color: c.text,
                }}
                onFocus={e => e.currentTarget.style.borderColor = c.primary}
                onBlur={e => e.currentTarget.style.borderColor = c.border}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
              {/* Option 1: Choose Existing Resume */}
              {resumes.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>
                    <FileText size={16} className="inline mr-2" style={{ color: c.primary }} />
                    Choose Existing Resume
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {resumes.map(r => (
                      <motion.button
                        key={r.id}
                        whileHover={cardHover} whileTap={{ scale: 0.99 }}
                        onClick={() => { setSelectedResumeId(r.id); setFile(null); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: selectedResumeId === r.id ? "rgba(245,158,11,0.1)" : c.surface,
                          border: `1px solid ${selectedResumeId === r.id ? "rgba(245,158,11,0.3)" : c.border}`,
                          color: c.text,
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
                          <FileText size={14} style={{ color: c.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{r.title}</div>
                          <div className="text-[10px]" style={{ color: c.textMuted }}>
                            {r.template} · {new Date(r.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {selectedResumeId === r.id && <CheckCircle size={16} style={{ color: c.primary }} />}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Option 2: Upload Resume */}
              <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>
                  <Upload size={16} className="inline mr-2" style={{ color: c.primary }} />
                  Upload Resume
                </h3>
                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: dragging ? c.primary : c.border,
                    background: dragging ? "rgba(245,158,11,0.05)" : c.surface,
                  }}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                  {file ? (
                    <div className="space-y-2">
                      <motion.span variants={springIcon} initial="hidden" animate="visible"><FileText size={32} className="mx-auto" style={{ color: c.primary }} /></motion.span>
                      <p className="text-sm font-bold" style={{ color: c.text }}>{file.name}</p>
                      <p className="text-xs" style={{ color: c.textMuted }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <motion.button
                        whileHover={buttonHover} whileTap={buttonTap}
                        onClick={e => { e.stopPropagation(); setFile(null); setSelectedResumeId(""); }}
                        className="text-xs font-bold mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        <X size={12} /> Remove
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <motion.span variants={springIcon} initial="hidden" animate="visible"><Upload size={40} className="mx-auto" style={{ color: c.textMuted }} /></motion.span>
                      <p className="text-sm font-bold" style={{ color: c.text }}>Drag & drop your resume here</p>
                      <p className="text-xs" style={{ color: c.textMuted }}>Supports PDF, DOCX up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Proceed */}
            <motion.button
              whileHover={buttonHover} whileTap={buttonTap}
              disabled={!file && !selectedResumeId}
              onClick={() => setScreen("jd")}
              className="w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
              style={{
                background: !file && !selectedResumeId ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
                color: !file && !selectedResumeId ? c.textMuted : "#000",
                border: !file && !selectedResumeId ? `1px solid ${c.border}` : "none",
              }}
            >
              Continue <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {/* ─────── SCREEN 2: JOB DESCRIPTION ─────── */}
        {screen === "jd" && (
          <motion.div
            key="jd"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl text-center" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <motion.span variants={springIcon} initial="hidden" animate="visible"><Target size={40} className="mx-auto mb-4" style={{ color: c.primary }} /></motion.span>
              <h2 className="text-lg font-bold mb-2" style={{ color: c.text }}>Compare with Job Description?</h2>
              <p className="text-sm mb-6" style={{ color: c.textSec }}>
                Comparing with a job description gives you a targeted match score and identifies missing keywords.
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={buttonHover} whileTap={buttonTap}
                  onClick={() => { setIncludeJD("yes"); }}
                  className="px-6 py-2 rounded-lg font-bold text-xs"
                  style={{
                    background: includeJD === "yes" ? c.primary : c.surface,
                    color: includeJD === "yes" ? "#000" : c.text,
                    border: `1px solid ${includeJD === "yes" ? c.primary : c.border}`,
                  }}
                >
                  Yes
                </motion.button>
                <motion.button
                  whileHover={buttonHover} whileTap={buttonTap}
                  onClick={() => { setIncludeJD("skip"); }}
                  className="px-6 py-2 rounded-lg font-bold text-xs"
                  style={{
                    background: includeJD === "skip" ? c.surface : c.surface,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                    opacity: includeJD === "skip" ? 0.6 : 1,
                  }}
                >
                  Skip
                </motion.button>
              </div>
            </div>

            {includeJD === "yes" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 rounded-2xl space-y-4"
                style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textSec }}>
                    Paste Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    rows={6}
                    placeholder="Paste the job description here..."
                    className="w-full p-3 rounded-xl text-sm outline-none resize-none"
                    style={{
                      background: c.surface, border: `1px solid ${c.border}`,
                      color: c.text,
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = c.primary}
                    onBlur={e => e.currentTarget.style.borderColor = c.border}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: c.border }} />
                  <span className="text-xs font-bold" style={{ color: c.textMuted }}>OR</span>
                  <div className="flex-1 h-px" style={{ background: c.border }} />
                </div>

                <div
                  onClick={() => jdFileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
                  style={{ borderColor: c.border, background: c.surface }}
                >
                  <input ref={jdFileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) setJdFile(e.target.files[0]); }}
                  />
                  {jdFile ? (
                    <p className="text-sm font-bold" style={{ color: c.text }}>{jdFile.name}</p>
                  ) : (
                    <div>
                      <Upload size={24} className="mx-auto mb-1" style={{ color: c.textMuted }} />
                      <p className="text-xs" style={{ color: c.textMuted }}>Upload JD file</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setScreen("home")}
                className="flex-1 py-2 rounded-lg font-bold text-xs"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >
                Back
              </motion.button>
              <motion.button
                whileHover={buttonHover} whileTap={buttonTap}
                disabled={includeJD === null}
                onClick={startAnalysis}
                className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{
                  background: includeJD === null ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: includeJD === null ? c.textMuted : "#000",
                  border: includeJD === null ? `1px solid ${c.border}` : "none",
                }}
              >
                <motion.span variants={springIcon} initial="hidden" animate="visible"><Zap size={16} /></motion.span> Analyze Resume
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN 3: LOADING ─────── */}
        {screen === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="max-w-lg mx-auto"
          >
            <div className="p-8 rounded-2xl text-center" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ border: `3px solid ${c.border}`, borderTopColor: c.primary }}
              >
                <BarChart3 size={24} style={{ color: c.primary }} />
              </motion.div>

              <h2 className="text-lg font-bold mb-6" style={{ color: c.text }}>Analyzing Resume...</h2>

              <div className="space-y-3 text-left">
                {loadingSteps.map((step, i) => (
                  <motion.div
                    key={step}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{
                      background: i <= loadingStep ? "rgba(245,158,11,0.05)" : "transparent",
                      border: `1px solid ${i <= loadingStep ? "rgba(245,158,11,0.15)" : "transparent"}`,
                    }}
                  >
                    {i < loadingStep ? (
                      <CheckCircle size={18} style={{ color: c.green }} />
                    ) : i === loadingStep ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 rounded-full border-2"
                        style={{ borderColor: `${c.primary} transparent ${c.primary} ${c.primary}` }}
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full" style={{ background: c.surface, border: `1px solid ${c.border}` }} />
                    )}
                    <span className="text-sm" style={{
                      color: i <= loadingStep ? c.text : c.textMuted,
                      fontWeight: i <= loadingStep ? 600 : 400,
                    }}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN 4: DASHBOARD ─────── */}
        {screen === "dashboard" && analysis && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Overall Score + Actions */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Score Gauge */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="flex-shrink-0 p-6 rounded-2xl flex flex-col items-center justify-center text-center"
                style={{ background: c.cardBg, border: `1px solid ${c.border}`, minWidth: 220 }}
              >
                <div className="relative w-36 h-36 flex items-center justify-center mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="62" stroke={c.border} strokeWidth="8" fill="transparent" />
                    <circle
                      cx="72" cy="72" r="62"
                      stroke={scoreColor(analysis.score)}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 62}
                      strokeDashoffset={2 * Math.PI * 62 * (1 - analysis.score / 100)}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1.5s ease" }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold" style={{ color: c.text }}>{analysis.score}</span>
                    <span className="block text-[9px] uppercase tracking-wider font-bold" style={{ color: c.textMuted }}>ATS Score</span>
                  </div>
                </div>
                <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: scoreBg(analysis.score), color: scoreColor(analysis.score) }}
                >
                  {scoreLabel(analysis.score)}
                </div>
              </motion.div>

              {/* Insights Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: <Search size={14} />, label: "Keywords Found", value: String(analysis.keywordsFound.length), color: c.green },
                  { icon: <AlertTriangle size={14} />, label: "Keywords Missing", value: String(analysis.keywordsMissing.length), color: c.red },
                  { icon: <FileText size={14} />, label: "Readability", value: analysis.readability, color: c.primary },
                  { icon: <FileCheck2 size={14} />, label: "Length", value: analysis.length, color: "#3b82f6" },
                  { icon: <Star size={14} />, label: "Formatting", value: analysis.formatting, color: "#8b5cf6" },
                  { icon: <BarChart3 size={14} />, label: "Recruiter Score", value: `${analysis.recruiterScore}/10`, color: c.primary },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    whileHover={cardHover}
                    className="p-3.5 rounded-xl"
                    style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <motion.span variants={springIcon} initial="hidden" animate="visible" style={{ color: item.color }}>{item.icon}</motion.span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>
                        {item.label}
                      </span>
                    </div>
                    <div className="text-lg font-extrabold" style={{ color: c.text }}>{item.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Resume vs JD Match */}
            {includeJD === "yes" && analysis.keywordAnalysis && (
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="p-5 rounded-2xl"
                style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
              >
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
                  <Target size={16} style={{ color: c.primary }} /> Resume vs Job Description
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke={c.border} strokeWidth="6" fill="transparent" />
                      <circle cx="40" cy="40" r="34" stroke={c.primary} strokeWidth="6" fill="transparent"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - analysis.score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-extrabold" style={{ color: c.primary }}>{analysis.score}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-2" style={{ color: c.text }}>Skill Match</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {analysis.keywordAnalysis.found.slice(0, 5).map(kw => (
                        <span key={kw} className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                          style={{ background: "rgba(16,185,129,0.1)", color: c.green, border: "1px solid rgba(16,185,129,0.2)" }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywordAnalysis.missing.slice(0, 5).map(kw => (
                        <span key={kw} className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                          style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Section Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "summary", label: "Professional Summary", icon: <BookOpen size={16} />, data: analysis.sectionScores.summary },
                { key: "skills", label: "Skills", icon: <Code2 size={16} />, data: analysis.sectionScores.skills },
                { key: "experience", label: "Experience", icon: <Briefcase size={16} />, data: analysis.sectionScores.experience },
                { key: "projects", label: "Projects", icon: <Lightbulb size={16} />, data: analysis.sectionScores.projects },
              ].map((section, i) => (
                <motion.div
                  key={section.key}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileHover={cardHover}
                  className="p-4 rounded-xl"
                  style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <motion.span variants={springIcon} initial="hidden" animate="visible" style={{ color: c.primary }}>{section.icon}</motion.span>
                      <span className="text-xs font-bold" style={{ color: c.text }}>{section.label}</span>
                    </div>
                    <span className="text-sm font-extrabold" style={{ color: scoreColor(section.data.score * 10) }}>
                      {section.data.score}/10
                    </span>
                  </div>
                  {section.data.suggestions?.slice(0, 2).map((s, j) => (
                    <div key={j} className="text-[10px] flex items-start gap-1.5 mb-1" style={{ color: c.textSec }}>
                      <span style={{ color: c.primary }}>•</span>
                      {s}
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>

            {/* Keyword Analysis */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <motion.div variants={scaleIn} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <CheckCircle size={14} style={{ color: c.green }} /> Found Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywordAnalysis.found.map(kw => (
                    <span key={kw} className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{ background: "rgba(16,185,129,0.1)", color: c.green, border: "1px solid rgba(16,185,129,0.2)" }}
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </motion.div>
              <motion.div variants={scaleIn} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <XCircle size={14} style={{ color: c.red }} /> Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywordAnalysis.missing.map(kw => (
                    <span key={kw} className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      ✗ {kw}
                    </span>
                  ))}
                </div>
                {analysis.keywordAnalysis.missing.length > 0 && (
                  <motion.button
                    whileHover={buttonHover} whileTap={buttonTap}
                    onClick={() => setScreen("suggestions")}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                    style={{ background: "rgba(245,158,11,0.1)", color: c.primary, border: "1px solid rgba(245,158,11,0.2)" }}
                  >
                    <Sparkles size={12} /> Add Missing Keywords
                  </motion.button>
                )}
              </motion.div>
            </motion.div>

            {/* Formatting Check */}
            <motion.div variants={scaleIn} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                <FileCheck2 size={14} style={{ color: c.primary }} /> Resume Formatting
              </h3>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-5 gap-2"
              >
                {[
                  { label: "One Page", value: analysis.formattingCheck.onePage },
                  { label: "Fonts Consistent", value: analysis.formattingCheck.fontsConsistent },
                  { label: "ATS Friendly", value: analysis.formattingCheck.atsFriendly },
                  { label: "Headings Correct", value: analysis.formattingCheck.headingsCorrect },
                  { label: "Contact Present", value: analysis.formattingCheck.contactPresent },
                ].map(item => (
                  <motion.div key={item.label} variants={fadeUp} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: c.surface }}>
                    {item.value ? (
                      <CheckCircle size={14} style={{ color: c.green }} />
                    ) : (
                      <XCircle size={14} style={{ color: c.red }} />
                    )}
                    <span className="text-[10px] font-semibold" style={{ color: c.text }}>{item.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Strength Bars */}
            <motion.div variants={scaleIn} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <h3 className="text-xs font-bold mb-4" style={{ color: c.text }}>Resume Strength</h3>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {[
                  { label: "Summary", value: analysis.strengthBars.summary, color: "#8b5cf6" },
                  { label: "Skills", value: analysis.strengthBars.skills, color: "#3b82f6" },
                  { label: "Experience", value: analysis.strengthBars.experience, color: c.primary },
                  { label: "Projects", value: analysis.strengthBars.projects, color: "#10b981" },
                  { label: "Education", value: analysis.strengthBars.education, color: "#ec4899" },
                ].map(bar => (
                  <motion.div key={bar.label} variants={fadeUp}>
                    <div className="flex justify-between text-[10px] font-semibold mb-1">
                      <span style={{ color: c.textSec }}>{bar.label}</span>
                      <span style={{ color: bar.color }}>{bar.value}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: bar.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Strengths & Recommendations */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <motion.div variants={scaleIn} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <CheckCircle size={14} style={{ color: c.green }} /> Strengths
                </h3>
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-1.5"
                >
                  {analysis.strengths.map((s, i) => (
                    <motion.li key={i} variants={fadeUp} className="text-[11px] flex items-start gap-2" style={{ color: c.textSec }}>
                      <span style={{ color: c.green }}>✓</span> {s}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              <motion.div variants={scaleIn} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <Star size={14} style={{ color: c.primary }} /> Recommendations
                </h3>
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-1.5"
                >
                  {analysis.recommendations.map((r, i) => (
                    <motion.li key={i} variants={fadeUp} className="text-[11px] flex items-start gap-2" style={{ color: c.textSec }}>
                      <span style={{ color: c.primary }}>✦</span> {r}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </motion.div>

            {/* Navigation */}
            <div className="flex gap-3">
              <motion.button
                whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setView("resume-hub")}
                className="flex-1 py-2 rounded-lg font-bold text-xs"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >
                Back to Resume Hub
              </motion.button>
              <motion.button
                whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setScreen("suggestions")}
                className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
              >
                <Sparkles size={16} /> AI Suggestions
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN 5: SUGGESTIONS ─────── */}
        {screen === "suggestions" && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Score Update Banner */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="p-5 rounded-2xl flex items-center gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(16,185,129,0.1))",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="27" stroke={c.border} strokeWidth="5" fill="transparent" />
                  <circle cx="32" cy="32" r="27" stroke={scoreColor(updatedScore)} strokeWidth="5" fill="transparent"
                    strokeDasharray={2 * Math.PI * 27}
                    strokeDashoffset={2 * Math.PI * 27 * (1 - updatedScore / 100)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-extrabold" style={{ color: c.text }}>{updatedScore}</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: c.text }}>AI Suggestions</div>
                <p className="text-xs" style={{ color: c.textSec }}>
                  Apply improvements to boost your ATS score.
                </p>
              </div>
            </motion.div>

            {/* Suggestion Cards */}
            <div className="space-y-3">
              {suggestions.map((sugg, i) => {
                const applied = appliedSuggestions.has(sugg.id);
                return (
                  <motion.div
                    key={sugg.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    whileHover={cardHover}
                    className="p-4 rounded-xl"
                    style={{
                      background: applied ? "rgba(16,185,129,0.05)" : c.cardBg,
                      border: `1px solid ${applied ? "rgba(16,185,129,0.2)" : c.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: c.text }}>{sugg.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                            style={{
                              background: sugg.impact === "high" ? "rgba(239,68,68,0.1)" : sugg.impact === "medium" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                              color: sugg.impact === "high" ? c.red : sugg.impact === "medium" ? c.primary : "#3b82f6",
                            }}
                          >
                            {sugg.impact} impact
                          </span>
                        </div>
                        <p className="text-[11px]" style={{ color: c.textSec }}>{sugg.description}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {applied ? (
                          <>
                            <motion.button
                              whileHover={buttonHover} whileTap={buttonTap}
                              onClick={() => handleUndoSuggestion(sugg.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                            >
                              <RotateCcw size={10} /> Undo
                            </motion.button>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: "rgba(16,185,129,0.1)", color: c.green, border: "1px solid rgba(16,185,129,0.2)" }}
                            >
                              <CheckCircle size={10} /> Applied
                            </span>
                          </>
                        ) : (
                          <>
                            <motion.button
                              whileHover={buttonHover} whileTap={buttonTap}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: c.surface, color: c.textSec, border: `1px solid ${c.border}` }}
                            >
                              <Eye size={10} /> Preview
                            </motion.button>
                            <motion.button
                              whileHover={buttonHover} whileTap={buttonTap}
                              onClick={() => handleApplySuggestion(sugg)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: c.primary, color: "#000" }}
                            >
                              <Sparkles size={10} /> Apply
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <motion.button
                whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setScreen("dashboard")}
                className="flex-1 py-2 rounded-lg font-bold text-xs"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >
                Back to Dashboard
              </motion.button>
              <motion.button
                whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setScreen("final")}
                className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
              >
                <CheckCircle size={16} /> View Final Score
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN 6: FINAL ─────── */}
        {screen === "final" && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="max-w-lg mx-auto text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)", border: "3px solid rgba(16,185,129,0.3)" }}
            >
              <CheckCircle size={48} style={{ color: c.green }} />
            </motion.div>

            <div>
              <h2 className="text-xl font-extrabold mb-2" style={{ color: c.text }}>Resume Improved Successfully</h2>
              <p className="text-sm" style={{ color: c.textSec }}>
                Applied {appliedSuggestions.size} of {suggestions.length} suggestions
              </p>
            </div>

            {/* Updated Score */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="p-6 rounded-2xl"
              style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textMuted }}>Updated ATS Score</div>
              <div className="flex items-center justify-center gap-3">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-extrabold" style={{ color: c.text }}
                >
                  {updatedScore}
                </motion.span>
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ color: c.textMuted }}>/ 100</span>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: scoreBg(updatedScore), color: scoreColor(updatedScore) }}
                  >
                    {scoreLabel(updatedScore)}
                  </div>
                </div>
              </div>
              {updatedScore > (analysis?.score || 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm font-bold flex items-center justify-center gap-1"
                  style={{ color: c.green }}
                >
                  +{updatedScore - (analysis?.score || 0)} points improved
                </motion.div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              <motion.button
                variants={fadeUp}
                whileHover={buttonHover} whileTap={buttonTap}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >
                <Save size={16} /> Save Resume
              </motion.button>
              <motion.button
                variants={fadeUp}
                whileHover={buttonHover} whileTap={buttonTap}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >
                <Download size={16} /> Download PDF
              </motion.button>
              <motion.button
                variants={fadeUp}
                whileHover={buttonHover} whileTap={buttonTap}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >
                <Download size={16} /> Download DOCX
              </motion.button>
              <motion.button
                variants={fadeUp}
                whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setView("resume-hub")}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.primary, color: "#000" }}
              >
                <FileText size={16} /> Open Resume Builder
              </motion.button>
            </motion.div>

            <motion.button
              whileHover={buttonHover} whileTap={buttonTap}
              onClick={() => { setScreen("home"); setAnalysis(null); setFile(null); setSelectedResumeId(""); setSuggestions([]); setAppliedSuggestions(new Set()); }}
              className="inline-flex items-center gap-2 text-sm font-bold"
              style={{ color: c.primary }}
            >
              <RefreshCw size={14} /> Analyze Another Resume
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ─── AI CHAT BUTTON ─── */}
      {(screen === "dashboard" || screen === "suggestions") && (
        <>
          <motion.button
            whileHover={buttonHover} whileTap={buttonTap}
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#000",
              boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}
          >
            {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.button>

          {/* AI Chat Panel */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-24 right-6 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{
                  background: c.chatBg,
                  border: `1px solid ${c.border}`,
                  maxHeight: "60vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: c.border }}>
                  <div className="flex items-center gap-2">
                    <motion.span variants={springIcon} initial="hidden" animate="visible"><Sparkles size={14} style={{ color: c.primary }} /></motion.span>
                    <span className="text-sm font-bold" style={{ color: c.text }}>AI ATS Assistant</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded-lg"
                    style={{ color: c.textMuted }}
                  >
                    <X size={14} />
                  </motion.button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 200, maxHeight: 350 }}>
                  {chatMessages.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: c.textMuted }}>Ask me anything about your ATS score. Try:</p>
                      {["Improve ATS score", "Optimize for Google", "Rewrite Summary", "Add Missing Keywords", "Reduce Resume Length"].map((suggestion, i) => (
                        <motion.button
                          key={suggestion}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => { setChatInput(suggestion); }}
                          className="block w-full text-left p-2 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            background: "rgba(245,158,11,0.08)",
                            color: c.primary,
                            border: "1px solid rgba(245,158,11,0.15)",
                          }}
                        >
                          <motion.span variants={springIcon} initial="hidden" animate="visible"><Sparkles size={10} className="inline mr-1.5" /></motion.span>
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                          msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                        }`}
                        style={{
                          background: msg.role === "user" ? c.primary : c.surface,
                          color: msg.role === "user" ? "#000" : c.text,
                          border: msg.role === "user" ? "none" : `1px solid ${c.border}`,
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="p-2.5 rounded-xl rounded-bl-sm text-xs" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                        <LoadingDots />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t flex gap-2" style={{ borderColor: c.border }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask about your ATS score..."
                    className="flex-1 p-2.5 rounded-xl text-xs outline-none"
                    style={{
                      background: c.surface, border: `1px solid ${c.border}`,
                      color: c.text,
                    }}
                  />
                  <motion.button
                    whileHover={buttonHover} whileTap={buttonTap}
                    onClick={handleSendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2.5 rounded-xl flex items-center justify-center"
                    style={{
                      background: c.primary,
                      color: "#000",
                      opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                    }}
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
