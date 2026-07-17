"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import {
  Upload, FileText, X, Check, AlertCircle, Sparkles, Zap,
  ChevronRight, Eye, Trash2, Star, Target, Award, BookOpen,
  Briefcase, Code2, UserCircle, Globe, Languages, Trophy,
  ArrowRight, RefreshCw, Download, Loader2, Clock, Shield,
  TrendingUp, AlertTriangle, CheckCircle2, CircleDot, BarChart3,
  Lightbulb, ExternalLink, GitBranch, Settings,
} from "lucide-react";
import type { ResumeHubViewType } from "@/types/resume";

interface ResumeUploadViewProps {
  setView: (v: ResumeHubViewType) => void;
}

const mkColors = (theme: string) => {
  const d = theme === "dark";
  return {
    d,
    text: d ? "#e5e7eb" : "#0f172a",
    textSec: d ? "#9ca3af" : "#475569",
    textMuted: d ? "#828fa3" : "#5f6368",
    bg: d ? "rgba(255,255,255,0.025)" : "#ffffff",
    surface: d ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    border: d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    borderHover: d ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)",
    divider: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    cardBg: d ? "rgba(255,255,255,0.025)" : "#ffffff",
    inputBg: d ? "rgba(0,0,0,0.35)" : "#f1f5f9",
    amber: "#f59e0b",
    amberBg: d ? "rgba(245,158,11,0.07)" : "rgba(245,158,11,0.08)",
    amberBorder: d ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.25)",
    green: "#10b981",
    greenBg: d ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
    greenBorder: d ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.3)",
    red: "#ef4444",
    redBg: d ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
    redBorder: d ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.3)",
    purple: "#a78bfa",
    purpleBg: d ? "rgba(167,139,250,0.1)" : "rgba(167,139,250,0.08)",
    purpleBorder: d ? "rgba(167,139,250,0.2)" : "rgba(167,139,250,0.3)",
    cyan: "#22d3ee",
    cyanBg: d ? "rgba(34,211,238,0.1)" : "rgba(34,211,238,0.08)",
    pill: d ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    pillBorder: d ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };
};

const col = "#f59e0b";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.3 } }),
};

const PARSING_STEPS = [
  { label: "Uploading Resume", desc: "Securely transferring file to cloud storage", icon: <Upload size={14} /> },
  { label: "Extracting Content", desc: "Reading and parsing document text", icon: <FileText size={14} /> },
  { label: "Analyzing Structure", desc: "Identifying sections and formatting", icon: <BarChart3 size={14} /> },
  { label: "AI Profile Extraction", desc: "Extracting structured career data", icon: <Sparkles size={14} /> },
  { label: "Building Candidate Profile", desc: "Organizing extracted information", icon: <UserCircle size={14} /> },
  { label: "Calculating Scores", desc: "Generating completeness and strength metrics", icon: <Target size={14} /> },
  { label: "Profile Ready", desc: "Your career intelligence is ready", icon: <Check size={14} /> },
];

type UploadedResume = {
  id: string;
  cloudinaryUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  versionNumber: number;
  isActive: boolean;
  createdAt: string;
  candidateProfile?: CandidateProfile | null;
};

type CandidateProfile = {
  id: string;
  resumeId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: any[];
  experience: any[];
  projects: any[];
  skills: string[];
  certifications: any[];
  achievements: string[];
  languages: string[];
  links: any;
  completenessScore: number;
  strengthScore: number;
  missingSections: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
};

type Screen = "dashboard" | "upload" | "parsing" | "profile";

export function ResumeUploadView({ setView }: ResumeUploadViewProps) {
  const theme = useTheme();
  const c = mkColors(theme);

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [resumes, setResumes] = useState<UploadedResume[]>([]);
  const [activeResume, setActiveResume] = useState<UploadedResume | null>(null);
  const [selectedResume, setSelectedResume] = useState<UploadedResume | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsingStep, setParsingStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchResumes(); }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  async function fetchResumes() {
    setLoadingResumes(true);
    try {
      const res = await api.get("/resume-upload/list");
      if (res.data.success) {
        setResumes(res.data.resumes);
        const active = res.data.resumes.find((r: UploadedResume) => r.isActive);
        if (active) setActiveResume(active);
      }
    } catch {
    } finally {
      setLoadingResumes(false);
    }
  }

  async function handleFileUpload(file: File) {
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Please upload a PDF or DOCX file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be under 5MB");
      return;
    }
    if (file.size === 0) {
      showToast("File is empty. Please select a valid resume.");
      return;
    }

    setScreen("parsing");
    setParsingStep(0);

    // Animate through parsing steps
    const stepTimers: NodeJS.Timeout[] = [];
    for (let i = 1; i < PARSING_STEPS.length; i++) {
      stepTimers.push(setTimeout(() => setParsingStep(i), i * 1400));
    }

    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await api.post("/resume-upload/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        stepTimers.forEach(clearTimeout);
        setParsingStep(PARSING_STEPS.length - 1);
        await new Promise(r => setTimeout(r, 600));

        const newResume = { ...res.data.resume, candidateProfile: res.data.profile };
        setResumes(prev => [newResume, ...prev]);
        setSelectedResume(newResume);
        setActiveResume(newResume);
        setScreen("profile");
        showToast("Resume parsed successfully!");
      }
    } catch (err: any) {
      stepTimers.forEach(clearTimeout);
      showToast(err?.response?.data?.message || "Upload failed. Please try again.");
      setScreen("dashboard");
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() { setIsDragging(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSetActive(id: string) {
    try {
      await api.post(`/resume-upload/set-active/${id}`);
      setResumes(prev => prev.map(r => ({ ...r, isActive: r.id === id })));
      const target = resumes.find(r => r.id === id);
      if (target) setActiveResume(target);
      showToast("Active resume updated");
    } catch { showToast("Failed to update"); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/resume-upload/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      if (activeResume?.id === id) {
        const next = resumes.find(r => r.id !== id);
        setActiveResume(next || null);
      }
      if (selectedResume?.id === id) {
        setSelectedResume(null);
        setScreen("dashboard");
      }
      setDeleteConfirm(null);
      showToast("Resume deleted");
    } catch { showToast("Delete failed"); }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function scoreColor(score: number) {
    if (score >= 80) return c.green;
    if (score >= 60) return c.amber;
    return c.red;
  }

  function scoreLabel(score: number) {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
      style={{ color: c.text, background: c.bg, minHeight: "calc(100vh - 120px)" }}
      className="flex flex-col antialiased"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.95 }}
            style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: c.d ? "#1a1a2e" : "#fff", border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 12, padding: "0.55rem 1.1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 600, color: c.text }}>
            <Sparkles size={14} style={{ color: col }} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-3 pb-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex items-center gap-2.5">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <FileText size={18} style={{ color: "#000" }} />
          </motion.div>
          <div>
            <motion.h1 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              className="text-base font-extrabold leading-tight" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
              Resume Upload & Intelligence
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-xs leading-tight" style={{ color: c.textMuted }}>
              Upload your resume to unlock AI-powered career analysis
            </motion.p>
          </div>
        </div>
        {screen === "profile" && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setSelectedResume(null); setScreen("dashboard"); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.4rem 0.9rem", borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", color: c.textSec, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
            <BarChart3 size={14} /> Dashboard
          </motion.button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "1rem 1.25rem" }}>
        <AnimatePresence mode="wait">
          {/* ─── PARSING SCREEN ─── */}
          {screen === "parsing" && (
            <motion.div key="parsing" variants={fadeUp} initial="hidden" animate="visible" exit="hidden" style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 0" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <motion.div animate={{ rotate: parsingStep >= PARSING_STEPS.length - 1 ? 0 : 360 }}
                  transition={{ repeat: parsingStep >= PARSING_STEPS.length - 1 ? 0 : Infinity, duration: 1.5, ease: "linear" }}
                  style={{ width: 64, height: 64, borderRadius: "50%", background: parsingStep >= PARSING_STEPS.length - 1 ? c.greenBg : c.amberBg, border: `2px solid ${parsingStep >= PARSING_STEPS.length - 1 ? c.greenBorder : c.amberBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  {parsingStep >= PARSING_STEPS.length - 1
                    ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={28} style={{ color: c.green }} /></motion.div>
                    : <Loader2 size={28} style={{ color: col }} />}
                </motion.div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: c.text, margin: 0 }}>
                  {parsingStep >= PARSING_STEPS.length - 1 ? "Profile Ready!" : "Analyzing Your Resume"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: c.textMuted, margin: "0.25rem 0 0" }}>
                  {parsingStep >= PARSING_STEPS.length - 1 ? "Your career intelligence profile has been created" : "AI is extracting and structuring your career data"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PARSING_STEPS.map((step, i) => (
                  <motion.div key={step.label}
                    animate={{ background: i < parsingStep ? c.amberBg : i === parsingStep ? c.amberBg : "transparent", borderColor: i <= parsingStep ? c.amberBorder : c.border }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.65rem 1rem", borderRadius: 10, border: "1px solid", transition: "all 0.3s" }}>
                    <motion.div animate={{ background: i < parsingStep ? col : i === parsingStep ? "rgba(245,158,11,0.2)" : c.surface, scale: i === parsingStep ? [1, 1.15, 1] : 1 }}
                      transition={{ repeat: i === parsingStep ? Infinity : 0, duration: 1 }}
                      style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {i < parsingStep ? <Check size={12} style={{ color: "#000" }} /> : i === parsingStep ? <Loader2 size={11} style={{ color: col }} className="animate-spin" /> : <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.textMuted, opacity: 0.4 }} />}
                    </motion.div>
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: i <= parsingStep ? c.text : c.textMuted }}>{step.label}</div>
                      <div style={{ fontSize: "0.68rem", color: c.textMuted }}>{step.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── DASHBOARD / UPLOAD SCREEN ─── */}
          {screen === "dashboard" && (
            <motion.div key="dashboard" variants={fadeUp} initial="hidden" animate="visible" exit="hidden">
              {/* Empty state or Resume list */}
              {loadingResumes ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: "0.75rem" }}>
                  <RefreshCw className="animate-spin" size={24} style={{ color: col }} />
                  <span style={{ fontSize: "0.85rem", color: c.textMuted, fontWeight: 600 }}>Loading resumes...</span>
                </div>
              ) : resumes.length === 0 ? (
                /* ─── Empty State ─── */
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                  {/* Upload Zone */}
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ position: "relative", border: `2px dashed ${isDragging ? col : c.border}`, borderRadius: 18, padding: "3rem 2rem", textAlign: "center", cursor: "pointer", background: isDragging ? c.amberBg : "transparent", transition: "all 0.3s", overflow: "hidden" }}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileInput} onClick={(e) => e.stopPropagation()} />

                    {/* Decorative bg */}
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                      <div style={{ position: "absolute", top: 16, right: 32, width: 120, height: 120, borderRadius: "50%", opacity: 0.06, background: "radial-gradient(circle, #f59e0b, transparent 70%)" }} />
                      <div style={{ position: "absolute", bottom: 16, left: 32, width: 100, height: 100, borderRadius: "50%", opacity: 0.06, background: "radial-gradient(circle, #a78bfa, transparent 70%)" }} />
                    </div>

                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: 72, height: 72, borderRadius: 20, background: c.amberBg, border: `1.5px solid ${c.amberBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                      <Upload size={30} style={{ color: col }} />
                    </motion.div>

                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: c.text, margin: "0 0 0.4rem" }}>
                      {isDragging ? "Drop your resume here!" : "Upload Your Resume"}
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: c.textSec, marginBottom: "1rem", maxWidth: 440, marginInline: "auto" }}>
                      Drag & drop or <span style={{ color: col, fontWeight: 700 }}>browse files</span> to unlock AI-powered career analysis, ATS scoring, and improvement suggestions.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                      {["PDF", "DOCX"].map((fmt) => (
                        <span key={fmt} style={{ padding: "0.25rem 0.7rem", borderRadius: 16, fontSize: "0.68rem", fontWeight: 700, background: c.pill, border: `1px solid ${c.pillBorder}`, color: c.textSec }}>{fmt}</span>
                      ))}
                      <span style={{ padding: "0.25rem 0.7rem", borderRadius: 16, fontSize: "0.68rem", fontWeight: 700, background: c.pill, border: `1px solid ${c.pillBorder}`, color: c.textMuted }}>Max 5MB</span>
                    </div>
                  </motion.div>

                  {/* How it works */}
                  <div style={{ marginTop: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.68rem", fontWeight: 700, color: c.textSec, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <Zap size={12} style={{ color: col }} /> How It Works
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      {[
                        { step: "01", title: "Upload Resume", desc: "Drop your PDF or DOCX resume file", icon: <Upload size={16} style={{ color: col }} /> },
                        { step: "02", title: "AI Extraction", desc: "AI parses and extracts structured career data", icon: <Sparkles size={16} style={{ color: c.purple }} /> },
                        { step: "03", title: "Career Profile", desc: "Get scores, insights, and improvement tips", icon: <Target size={16} style={{ color: c.cyan }} /> },
                      ].map((item, i) => (
                        <motion.div key={item.step} variants={fadeUp} custom={i} initial="hidden" animate="visible"
                          style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.5rem" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.surface, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {item.icon}
                            </div>
                            <div>
                              <span style={{ fontSize: "0.6rem", fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step {item.step}</span>
                              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: c.text }}>{item.title}</div>
                            </div>
                          </div>
                          <p style={{ fontSize: "0.72rem", color: c.textMuted, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── Resume List ─── */
                <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                  {/* Upload new button */}
                  <motion.div variants={fadeUp} initial="hidden" animate="visible"
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${isDragging ? col : c.border}`, borderRadius: 14, padding: "1.25rem", textAlign: "center", cursor: "pointer", background: isDragging ? c.amberBg : "transparent", transition: "all 0.3s", marginBottom: "1.25rem" }}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileInput} onClick={(e) => e.stopPropagation()} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        <Upload size={20} style={{ color: col }} />
                      </motion.div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: c.text }}>
                        {isDragging ? "Drop to upload new resume" : "Upload New Resume"}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: c.textMuted }}>(PDF, DOCX, Max 5MB)</span>
                    </div>
                  </motion.div>

                  {/* Section header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <h3 style={{ fontSize: "0.68rem", fontWeight: 700, color: c.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Your Resumes ({resumes.length})
                    </h3>
                    {activeResume && (
                      <span style={{ fontSize: "0.68rem", color: c.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={12} /> Active: v{activeResume.versionNumber}
                      </span>
                    )}
                  </div>

                  {/* Resume cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {resumes.map((resume, i) => {
                      const profile = resume.candidateProfile;
                      const isActive = resume.isActive;
                      return (
                        <motion.div key={resume.id} variants={fadeUp} custom={i} initial="hidden" animate="visible"
                          whileHover={{ borderColor: c.borderHover }}
                          style={{ background: c.cardBg, border: `1px solid ${isActive ? c.amberBorder : c.border}`, borderRadius: 14, padding: "1rem 1.25rem", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
                          onClick={() => { setSelectedResume(resume); setScreen("profile"); }}>
                          {isActive && (
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: isActive ? c.amberBg : c.surface, border: `1px solid ${isActive ? c.amberBorder : c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <FileText size={20} style={{ color: isActive ? col : c.textMuted }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{resume.fileName}</span>
                                <span style={{ padding: "0.1rem 0.5rem", borderRadius: 8, fontSize: "0.6rem", fontWeight: 700, background: c.pill, border: `1px solid ${c.pillBorder}`, color: c.textMuted }}>v{resume.versionNumber}</span>
                                {isActive && (
                                  <span style={{ padding: "0.1rem 0.5rem", borderRadius: 8, fontSize: "0.6rem", fontWeight: 700, background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: col }}>Active</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                                <span style={{ fontSize: "0.68rem", color: c.textMuted }}>{formatSize(resume.fileSize)}</span>
                                <span style={{ fontSize: "0.68rem", color: c.textMuted }}>{resume.fileType.includes("pdf") ? "PDF" : "DOCX"}</span>
                                <span style={{ fontSize: "0.68rem", color: c.textMuted }}>{new Date(resume.createdAt).toLocaleDateString()}</span>
                                {profile && (
                                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: scoreColor(profile.completenessScore) }}>
                                    {profile.completenessScore}% complete
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              {!isActive && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleSetActive(resume.id); }}
                                  style={{ padding: "0.3rem 0.7rem", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.textSec, fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>
                                  Set Active
                                </motion.button>
                              )}
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setSelectedResume(resume); setScreen("profile"); }}
                                style={{ padding: "0.3rem 0.7rem", borderRadius: 8, border: `1px solid ${c.amberBorder}`, background: c.amberBg, color: col, fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                <Eye size={11} /> View
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(resume.id); }}
                                style={{ padding: "0.3rem 0.5rem", borderRadius: 8, border: `1px solid ${c.redBorder}`, background: c.redBg, color: c.red, cursor: "pointer", display: "flex", alignItems: "center" }}>
                                <Trash2 size={11} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── PROFILE SCREEN ─── */}
          {screen === "profile" && selectedResume && selectedResume.candidateProfile && (
            <ProfileScreen
              resume={selectedResume}
              profile={selectedResume.candidateProfile}
              c={c}
              onBack={() => setScreen("dashboard")}
              onCheckATS={() => setView("ats-checker")}
              onImproveResume={() => setView("resume-builder")}
              onCoverLetter={() => setView("cover-letter")}
              onLinkedIn={() => setView("linkedin-optimizer")}
              showToast={showToast}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: c.d ? "#1a1a2e" : "#fff", border: `1px solid ${c.border}`, borderRadius: 16, padding: "1.5rem", maxWidth: 380, width: "90%" }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.redBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={18} style={{ color: c.red }} />
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: c.text, margin: 0 }}>Delete Resume</h3>
              </div>
              <p style={{ fontSize: "0.8rem", color: c.textSec, margin: "0 0 1rem", lineHeight: 1.5 }}>
                This will permanently delete this resume and its associated candidate profile. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteConfirm(null)}
                  style={{ padding: "0.45rem 1rem", borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", color: c.textSec, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{ padding: "0.45rem 1rem", borderRadius: 10, border: "none", background: c.red, color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .ru-score-grid { grid-template-columns: 1fr !important; }
          .ru-profile-grid { grid-template-columns: 1fr !important; }
          .ru-actions-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 1024px) {
          .ru-score-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
}

// ─── Profile Sub-Component ────────────────────────────────────────────────────

function ProfileScreen({ resume, profile, c, onBack, onCheckATS, onImproveResume, onCoverLetter, onLinkedIn, showToast }: {
  resume: UploadedResume;
  profile: CandidateProfile;
  c: ReturnType<typeof mkColors>;
  onBack: () => void;
  onCheckATS: () => void;
  onImproveResume: () => void;
  onCoverLetter: () => void;
  onLinkedIn: () => void;
  showToast: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "health">("overview");

  const scoreColor = (s: number) => s >= 80 ? c.green : s >= 60 ? c.amber : c.red;
  const scoreLabel = (s: number) => s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Profile Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1rem" }}>
        <motion.div variants={scaleIn} initial="hidden" animate="visible"
          style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <UserCircle size={28} style={{ color: "#000" }} />
        </motion.div>
        <div style={{ flex: 1 }}>
          <motion.h2 variants={fadeUp} initial="hidden" animate="visible" custom={0}
            style={{ fontSize: "1.15rem", fontWeight: 800, color: c.text, margin: 0 }}>
            {profile.name || resume.fileName}
          </motion.h2>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
            style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
            {profile.email && <span style={{ fontSize: "0.72rem", color: c.textSec }}>{profile.email}</span>}
            {profile.phone && <span style={{ fontSize: "0.72rem", color: c.textMuted }}>{profile.phone}</span>}
            {profile.location && <span style={{ fontSize: "0.72rem", color: c.textMuted }}>{profile.location}</span>}
          </motion.div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCheckATS}
            style={{ padding: "0.4rem 0.8rem", borderRadius: 10, border: `1px solid ${c.amberBorder}`, background: c.amberBg, color: col, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Target size={12} /> ATS Score
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onImproveResume}
            style={{ padding: "0.4rem 0.8rem", borderRadius: 10, border: `1px solid ${c.purpleBorder}`, background: c.purpleBg, color: c.purple, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} /> Improve
          </motion.button>
        </div>
      </div>

      {/* Score Cards Row */}
      <div className="ru-score-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1rem" }}>
        <motion.div variants={scaleIn} initial="hidden" animate="visible" custom={0}
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
          <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 0.5rem" }}>
            <svg viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke={c.border} strokeWidth="5" />
              <motion.circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor(profile.completenessScore)} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 30}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - profile.completenessScore / 100) }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ fontSize: "1.1rem", fontWeight: 800, color: scoreColor(profile.completenessScore) }}>
                {profile.completenessScore}%
              </motion.span>
            </div>
          </div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: c.text }}>Completeness</div>
          <div style={{ fontSize: "0.62rem", color: scoreColor(profile.completenessScore), fontWeight: 600 }}>{scoreLabel(profile.completenessScore)}</div>
        </motion.div>

        <motion.div variants={scaleIn} initial="hidden" animate="visible" custom={1}
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
          <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 0.5rem" }}>
            <svg viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke={c.border} strokeWidth="5" />
              <motion.circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor(profile.strengthScore)} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 30}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - profile.strengthScore / 100) }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                style={{ fontSize: "1.1rem", fontWeight: 800, color: scoreColor(profile.strengthScore) }}>
                {profile.strengthScore}%
              </motion.span>
            </div>
          </div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: c.text }}>Profile Strength</div>
          <div style={{ fontSize: "0.62rem", color: scoreColor(profile.strengthScore), fontWeight: 600 }}>{scoreLabel(profile.strengthScore)}</div>
        </motion.div>

        <motion.div variants={scaleIn} initial="hidden" animate="visible" custom={2}
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, margin: "0 auto 0.5rem", borderRadius: "50%", background: c.greenBg, border: `3px solid ${c.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: "spring" }}
              style={{ fontSize: "1.1rem", fontWeight: 800, color: c.green }}>
              {(profile.skills || []).length}
            </motion.span>
          </div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: c.text }}>Skills Found</div>
          <div style={{ fontSize: "0.62rem", color: c.textMuted }}>Extracted</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", background: c.surface, borderRadius: 10, padding: 3 }}>
        {(["overview", "details", "health"] as const).map((tab) => (
          <motion.button key={tab} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "0.45rem", borderRadius: 8, border: "none", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
              background: activeTab === tab ? (c.d ? "rgba(255,255,255,0.08)" : "#fff") : "transparent",
              color: activeTab === tab ? c.text : c.textMuted,
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}>
            {tab === "overview" ? "Overview" : tab === "details" ? "Details" : "Health Check"}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

            {/* Skills */}
            {(profile.skills || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={13} style={{ color: col }} /> Skills ({(profile.skills || []).length})
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(profile.skills || []).map((skill, i) => (
                    <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      style={{ padding: "0.2rem 0.55rem", borderRadius: 14, fontSize: "0.68rem", fontWeight: 600, background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: col }}>
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {(profile.education || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={13} style={{ color: c.purple }} /> Education
                </h4>
                {(profile.education || []).map((edu, i) => (
                  <div key={i} style={{ padding: "0.5rem", background: c.surface, borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: c.text }}>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}</div>
                    <div style={{ fontSize: "0.68rem", color: c.textSec }}>{edu.institution}</div>
                    <div style={{ fontSize: "0.62rem", color: c.textMuted }}>{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {(profile.experience || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Briefcase size={13} style={{ color: c.cyan }} /> Experience ({(profile.experience || []).length})
                </h4>
                {(profile.experience || []).map((exp, i) => (
                  <div key={i} style={{ padding: "0.5rem", background: c.surface, borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: c.text }}>{exp.role}</div>
                    <div style={{ fontSize: "0.68rem", color: c.textSec }}>{exp.company}</div>
                    <div style={{ fontSize: "0.62rem", color: c.textMuted }}>{exp.startDate} - {exp.endDate}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {(profile.projects || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Code2 size={13} style={{ color: c.green }} /> Projects ({(profile.projects || []).length})
                </h4>
                {(profile.projects || []).map((proj, i) => (
                  <div key={i} style={{ padding: "0.5rem", background: c.surface, borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: c.text }}>{proj.name}</div>
                    {proj.techStack && <div style={{ fontSize: "0.62rem", color: col }}>{proj.techStack}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {(profile.certifications || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Award size={13} style={{ color: col }} /> Certifications ({(profile.certifications || []).length})
                </h4>
                {(profile.certifications || []).map((cert, i) => (
                  <div key={i} style={{ padding: "0.4rem 0.5rem", background: c.surface, borderRadius: 8, marginBottom: 3, fontSize: "0.72rem" }}>
                    <span style={{ fontWeight: 700, color: c.text }}>{cert.name}</span>
                    {cert.issuer && <span style={{ color: c.textSec }}> - {cert.issuer}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Achievements */}
            {(profile.achievements || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Trophy size={13} style={{ color: c.amber }} /> Achievements ({(profile.achievements || []).length})
                </h4>
                {(profile.achievements || []).map((ach, i) => (
                  <div key={i} style={{ padding: "0.35rem 0.5rem", fontSize: "0.72rem", color: c.textSec, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <CheckCircle2 size={11} style={{ color: c.green, marginTop: 2, flexShrink: 0 }} /> {ach}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "details" && (
          <motion.div key="details" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

            {/* Summary */}
            {profile.summary && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem", gridColumn: "1 / -1" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={13} style={{ color: col }} /> Professional Summary
                </h4>
                <p style={{ fontSize: "0.78rem", color: c.textSec, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{profile.summary}</p>
              </div>
            )}

            {/* Experience Details */}
            {(profile.experience || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Briefcase size={13} style={{ color: c.cyan }} /> Experience Details
                </h4>
                {(profile.experience || []).map((exp, i) => (
                  <div key={i} style={{ padding: "0.6rem", background: c.surface, borderRadius: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: c.text }}>{exp.role} @ {exp.company}</div>
                    <div style={{ fontSize: "0.62rem", color: c.textMuted, marginBottom: 4 }}>{exp.startDate} - {exp.endDate}</div>
                    {exp.description && <div style={{ fontSize: "0.72rem", color: c.textSec, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{exp.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Project Details */}
            {(profile.projects || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Code2 size={13} style={{ color: c.green }} /> Project Details
                </h4>
                {(profile.projects || []).map((proj, i) => (
                  <div key={i} style={{ padding: "0.6rem", background: c.surface, borderRadius: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: c.text }}>{proj.name}</div>
                    {proj.techStack && <div style={{ fontSize: "0.65rem", color: col, fontWeight: 600 }}>{proj.techStack}</div>}
                    {proj.description && <div style={{ fontSize: "0.72rem", color: c.textSec, lineHeight: 1.5, whiteSpace: "pre-wrap", marginTop: 4 }}>{proj.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Languages */}
            {(profile.languages || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Languages size={13} style={{ color: c.purple }} /> Languages
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(profile.languages || []).map((lang, i) => (
                    <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: 14, fontSize: "0.68rem", fontWeight: 600, background: c.purpleBg, border: `1px solid ${c.purpleBorder}`, color: c.purple }}>{lang}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {profile.links && Object.keys(profile.links).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe size={13} style={{ color: c.cyan }} /> Links
                </h4>
                {Object.entries(profile.links).filter(([_, v]) => v).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.3rem 0", fontSize: "0.72rem" }}>
                    <ExternalLink size={11} style={{ color: col, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: c.textSec, textTransform: "capitalize" }}>{key}:</span>
                    <span style={{ color: col, wordBreak: "break-all" }}>{val as string}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "health" && (
          <motion.div key="health" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"
            style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Missing Sections */}
            {(profile.missingSections || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={13} style={{ color: c.amber }} /> Missing Information
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(profile.missingSections || []).map((section, i) => (
                    <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: "0.3rem 0.7rem", borderRadius: 10, fontSize: "0.72rem", fontWeight: 600, background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: col, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={11} /> {section}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {(profile.strengths || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Shield size={13} style={{ color: c.green }} /> Strengths
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(profile.strengths || []).map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.4rem 0.6rem", background: c.greenBg, borderRadius: 8, fontSize: "0.72rem", color: c.green, fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> {s}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {(profile.weaknesses || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={13} style={{ color: c.amber }} /> Areas for Improvement
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(profile.weaknesses || []).map((w, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.4rem 0.6rem", background: c.amberBg, borderRadius: 8, fontSize: "0.72rem", color: c.amber, fontWeight: 600 }}>
                      <AlertTriangle size={12} /> {w}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(profile.recommendations || []).length > 0 && (
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
                <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Lightbulb size={13} style={{ color: c.cyan }} /> Recommendations
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(profile.recommendations || []).map((rec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0.5rem 0.6rem", background: c.cyanBg, borderRadius: 8, fontSize: "0.72rem", color: c.cyan, fontWeight: 500, lineHeight: 1.4 }}>
                      <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} /> {rec}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "1rem" }}>
              <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: c.text, margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={13} style={{ color: col }} /> Quick Actions
              </h4>
              <div className="ru-actions-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Check ATS Score", icon: <Target size={16} />, color: col, bg: c.amberBg, border: c.amberBorder, onClick: onCheckATS },
                  { label: "Improve Resume", icon: <Sparkles size={16} />, color: c.purple, bg: c.purpleBg, border: c.purpleBorder, onClick: onImproveResume },
                  { label: "Cover Letter", icon: <FileText size={16} />, color: c.cyan, bg: c.cyanBg, border: "rgba(34,211,238,0.2)", onClick: onCoverLetter },
                  { label: "LinkedIn Optimize", icon: <Globe size={16} />, color: c.green, bg: c.greenBg, border: c.greenBorder, onClick: onLinkedIn },
                ].map((action) => (
                  <motion.button key={action.label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={action.onClick}
                    style={{ padding: "0.75rem 0.5rem", borderRadius: 12, border: `1px solid ${action.border}`, background: action.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                    <div style={{ color: action.color }}>{action.icon}</div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: action.color }}>{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
