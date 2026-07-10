"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import {
  FileText, ArrowLeft, Save, Sparkles, Download, Plus, Trash2,
  ChevronLeft, ChevronRight, Eye, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Check, MessageCircle, Send, X, Bot, User, Loader2, Zap,
  Globe, Link2, BookOpen, Award, Languages,
  GraduationCap, Briefcase, Code2, UserCircle, Settings,
  Monitor, Smartphone, Tablet, Trophy,
} from "lucide-react";
import type { ResumeHubViewType } from "@/types/resume";

interface ResumeBuilderViewProps {
  setView: (v: ResumeHubViewType) => void;
  selectedTemplate: string;
  theme?: string;
}

const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber", "Tesla", "Spotify", "Adobe", "Stripe", "LinkedIn", "Nvidia", "Salesforce", "Oracle", "IBM", "Cisco", "Morgan Stanley", "Goldman Sachs", "Deloitte", "Accenture", "TCS", "Infosys", "Wipro", "Other"];
const PROFESSIONS = ["Software Engineer", "ML Engineer", "Data Scientist", "Full Stack Developer", "Frontend Developer", "Backend Developer", "DevOps Engineer", "Cloud Engineer", "AI Engineer", "Product Manager", "UI/UX Designer", "Data Analyst", "SDE", "SRE", "Systems Engineer", "Research Scientist", "Other"];
const CAREER_LEVELS = ["Fresher", "Junior (1-2 yrs)", "Mid-Level (3-5 yrs)", "Senior (6-8 yrs)", "Lead (8+ yrs)"];
const RESUME_STYLES = ["ATS Modern", "ATS Professional", "ATS Minimal", "ATS Developer", "ATS Student"];
const SCREENS = ["Setup", "Information", "Generation", "Editor", "Review"];
const CHAT_SUGGESTIONS = ["Optimize for Amazon", "Reduce to one page", "Improve summary", "Improve project descriptions", "Add stronger action verbs", "Rewrite achievements"];

const pageTransition = {
  duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

export function ResumeBuilderView({ setView, selectedTemplate, theme = "dark" }: ResumeBuilderViewProps) {
  const isDark = theme === "dark";
  const t = {
    bg: isDark ? "#060b0e" : "#f8fafc",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    borderLight: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    text: isDark ? "#fff" : "#0f172a",
    textSecondary: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
    textMuted: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
    textDim: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
    inputBg: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.9)",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)",
    genBg: isDark ? "rgba(245,158,11,0.07)" : "rgba(245,158,11,0.08)",
    genBorder: isDark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.25)",
    successBg: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.1)",
    successBorder: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.3)",
    chatBg: isDark ? "#0a0e16" : "#ffffff",
  };

  // Screen state
  const [screen, setScreen] = useState(1);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [zoom, setZoom] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showSidebar, setShowSidebar] = useState(true);

  // Screen 1 — Setup
  const [setup, setSetup] = useState({ company: "Google", profession: "Software Engineer", careerLevel: "Fresher", resumeStyle: selectedTemplate || "ATS Modern" });

  // Screen 3 — Generation tracking
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const genSteps = [
    { label: "Analyzing Profile", icon: <UserCircle size={14} /> },
    { label: `Optimizing for ${setup.company}`, icon: <Briefcase size={14} /> },
    { label: `Optimizing for ${setup.profession}`, icon: <Code2 size={14} /> },
    { label: "Generating ATS Resume", icon: <FileText size={14} /> },
  ];

  // Form Fields
  const [personalInfo, setPersonalInfo] = useState({ fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" });
  const [summary, setSummary] = useState("");
  const [education, setEducation] = useState<Array<{ institution: string; degree: string; fieldOfStudy: string; startDate: string; endDate: string; grade: string }>>([{ institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" }]);
  const [experience, setExperience] = useState<Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>>([{ company: "", role: "", startDate: "", endDate: "", description: "" }]);
  const [projects, setProjects] = useState<Array<{ name: string; techStack: string; description: string }>>([{ name: "", techStack: "", description: "" }]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certifications, setCertifications] = useState<Array<{ name: string; issuer: string; date: string }>>([{ name: "", issuer: "", date: "" }]);
  const [achievements, setAchievements] = useState<string[]>([""]);
  const [languages, setLanguages] = useState<string[]>([""]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const resumeJSON = { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages };

  // AI functions
  const handleAISummary = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post("/resume/generate-summary", { personalInfo, education, experience, skills });
      if (res.data.success && res.data.summary) setSummary(res.data.summary);
    } catch { showToast("AI summary generation failed"); } finally { setGeneratingAI(false); }
  };

  const handleAIExperience = async (index: number) => {
    setGeneratingAI(true);
    try {
      const item = experience[index];
      const res = await api.post("/resume/enhance-experience", { role: item.role, company: item.company, description: item.description });
      if (res.data.success && res.data.description) {
        const updated = [...experience]; updated[index].description = res.data.description; setExperience(updated);
        showToast("Experience enhanced!");
      }
    } catch {} finally { setGeneratingAI(false); }
  };

  const handleAIProject = async (index: number) => {
    setGeneratingAI(true);
    try {
      const item = projects[index];
      const res = await api.post("/resume/enhance-project", { name: item.name, techStack: item.techStack, description: item.description });
      if (res.data.success && res.data.description) {
        const updated = [...projects]; updated[index].description = res.data.description; setProjects(updated);
        showToast("Project enhanced!");
      }
    } catch {} finally { setGeneratingAI(false); }
  };

  const handleAIOptimizeCompany = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post("/resume/optimize-resume", { resumeJson: resumeJSON, targetCompany: setup.company });
      if (res.data.success && res.data.resume) {
        const r = res.data.resume;
        if (r.personalInfo) setPersonalInfo(r.personalInfo);
        if (r.summary) setSummary(r.summary);
        if (r.education) setEducation(r.education);
        if (r.experience) setExperience(r.experience);
        if (r.projects) setProjects(r.projects);
        if (r.skills) setSkills(r.skills);
        if (r.certifications) setCertifications(r.certifications);
        if (r.achievements) setAchievements(r.achievements);
        if (r.languages) setLanguages(r.languages);
        showToast("Resume optimized for " + setup.company);
      }
    } catch {} finally { setGeneratingAI(false); }
  };

  const handleAIChat = async (msg?: string) => {
    const message = msg || chatInput;
    if (!message.trim() || chatLoading) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    setChatLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("adyapan-token") : null;

    setChatMessages((prev) => [...prev, { role: "ai", text: "" }]);

    try {
      const res = await fetch(`${api.defaults.baseURL}/resume/ai-chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resumeData: resumeJSON, message }),
      });

      if (!res.ok) throw new Error("Stream request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === "chunk") {
              accumulatedText += data.text;
              setChatMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", text: accumulatedText };
                return next;
              });
            } else if (data.type === "result") {
              if (data.summary) setSummary(data.summary);
              if (data.experience) setExperience(data.experience);
              if (data.projects) setProjects(data.projects);
              if (data.skills) setSkills(data.skills);
              const updated = Object.keys({ summary: data.summary, experience: data.experience, projects: data.projects, skills: data.skills }).filter(k => data[k]).join(", ");
              if (updated) {
                accumulatedText += `\n\nUpdated: ${updated}`;
                setChatMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "ai", text: accumulatedText };
                  return next;
                });
              }
            } else if (data.type === "error") {
              throw new Error(data.message || "Stream error");
            }
          } catch {}
        }
      }
    } catch {
      setChatMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", text: "Sorry, something went wrong. Try again." };
        return next;
      });
    } finally { setChatLoading(false); }
  };

  // Generation
  const handleGenerate = async () => {
    setGenerating(true);
    setGenStep(0);
    const snap = {
      personalInfo, summary, education, experience, projects, skills,
      certifications: [...certifications], achievements: [...achievements], languages: [...languages],
      company: setup.company, profession: setup.profession, resumeStyle: setup.resumeStyle,
    };
    const snapJSON = { personalInfo: snap.personalInfo, summary: snap.summary, education: snap.education, experience: snap.experience, projects: snap.projects, skills: snap.skills, certifications: snap.certifications, achievements: snap.achievements, languages: snap.languages };

    try {
      const summaryRes = await api.post("/resume/generate-summary", { personalInfo: snap.personalInfo, education: snap.education, experience: snap.experience, skills: snap.skills });
      if (summaryRes.data.success && summaryRes.data.summary) setSummary(summaryRes.data.summary);
    } catch {}
    setGenStep(1);
    try {
      const optRes = await api.post("/resume/optimize-resume", { resumeJson: snapJSON, targetCompany: snap.company });
      if (optRes.data.success && optRes.data.resume) {
        const r = optRes.data.resume;
        if (r.summary) setSummary(r.summary);
        if (r.experience) setExperience(r.experience || snap.experience);
        if (r.projects) setProjects(r.projects || snap.projects);
        if (r.skills) setSkills(r.skills || snap.skills);
      }
    } catch {}
    setGenStep(3);
    try {
      const res = await api.post("/resume/create", { title: `My ${snap.profession} Resume`, template: snap.resumeStyle, ...snapJSON, targetCompany: snap.company });
      if (res.data.success && res.data.resume) setResumeId(res.data.resume.id);
    } catch {}
    setGenStep(4);
    setGenerating(false);
    setScreen(4);
  };

  // Save
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = { title: `My ${setup.profession} Resume`, template: setup.resumeStyle, ...resumeJSON, targetCompany: setup.company, careerLevel: setup.careerLevel };
      if (resumeId) await api.put(`/resume/update/${resumeId}`, payload);
      else { const res = await api.post("/resume/create", payload); if (res.data?.success && res.data.resume) setResumeId(res.data.resume.id); }
      showToast("Draft saved!");
    } catch { showToast("Failed to save"); } finally { setSaving(false); }
  };

  // Export
  const handleExport = async (type: "pdf" | "docx") => {
    if (!resumeId) { await handleSaveDraft(); }
    setExporting(type);
    try {
      const id = resumeId;
      if (!id) return;
      const response = await api.post(`/resume/export-${type}`, { resumeId: id }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: type === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${setup.company}_${setup.profession}_Resume.${type}`; link.click();
      showToast(`Resume exported as ${type.toUpperCase()}`);
    } catch { showToast("Export failed"); } finally { setExporting(null); }
  };

  // Helpers
  const addEdu = () => setEducation([...education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" }]);
  const removeEdu = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
  const updateEdu = (i: number, k: string, v: string) => { const u = [...education]; (u[i] as any)[k] = v; setEducation(u); };
  const addExp = () => setExperience([...experience, { company: "", role: "", startDate: "", endDate: "", description: "" }]);
  const removeExp = (i: number) => setExperience(experience.filter((_, idx) => idx !== i));
  const updateExp = (i: number, k: string, v: string) => { const u = [...experience]; (u[i] as any)[k] = v; setExperience(u); };
  const addProj = () => setProjects([...projects, { name: "", techStack: "", description: "" }]);
  const removeProj = (i: number) => setProjects(projects.filter((_, idx) => idx !== i));
  const updateProj = (i: number, k: string, v: string) => { const u = [...projects]; (u[i] as any)[k] = v; setProjects(u); };
  const addCert = () => setCertifications([...certifications, { name: "", issuer: "", date: "" }]);
  const removeCert = (i: number) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const updateCert = (i: number, k: string, v: string) => { const u = [...certifications]; (u[i] as any)[k] = v; setCertifications(u); };
  const addAchievement = () => setAchievements([...achievements, ""]);
  const removeAchievement = (i: number) => setAchievements(achievements.filter((_, idx) => idx !== i));
  const updateAchievement = (i: number, v: string) => { const u = [...achievements]; u[i] = v; setAchievements(u); };
  const addLanguage = () => setLanguages([...languages, ""]);
  const removeLanguage = (i: number) => setLanguages(languages.filter((_, idx) => idx !== i));
  const updateLanguage = (i: number, v: string) => { const u = [...languages]; u[i] = v; setLanguages(u); };
  const addSkill = () => { if (skillInput.trim() && !skills.includes(skillInput.trim())) { setSkills([...skills, skillInput.trim()]); setSkillInput(""); } };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const canContinue = (screenNum: number) => {
    if (screenNum === 1) return setup.company && setup.profession && setup.careerLevel;
    if (screenNum === 2) return personalInfo.fullName && personalInfo.email;
    return true;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const previewWidth = previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "600px" : "360px";

  // Nav button style
  const navBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "0.45rem 1rem", borderRadius: 10, fontWeight: 600,
    fontSize: "0.78rem", cursor: "pointer", transition: "all 0.2s ease",
  };

  // Input style
  const inputStyle: React.CSSProperties = {
    width: "100%", background: t.inputBg, border: `1px solid ${t.border}`,
    borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: "0.82rem",
    color: t.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const inputFocusStyle = { borderColor: "rgba(245,158,11,0.5)", boxShadow: "0 0 0 3px rgba(245,158,11,0.1)" };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: "pointer", appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2rem",
  };

  const iconColor = "#f59e0b";

  return (
    <div className="h-full w-full flex flex-col" style={{ background: t.bg }}>
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed", top: 84, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
              background: isDark ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${t.genBorder}`, borderRadius: 14,
              padding: "0.6rem 1.2rem", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: "0.82rem", fontWeight: 600, color: t.text,
            }}
          >
            <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <Sparkles size={16} style={{ color: iconColor }} />
            </motion.div>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div style={{ padding: "0.75rem 1.25rem 0.5rem", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", maxWidth: 800, margin: "0 auto" }}>
          {SCREENS.map((label, i) => {
            const step = i + 1;
            const active = screen === step;
            const done = screen > step;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <motion.button
                  onClick={() => step <= screen && setScreen(step)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: step <= screen ? "pointer" : "default", padding: 0,
                  }}
                  whileHover={step <= screen ? { scale: 1.05 } : {}}
                  whileTap={step <= screen ? { scale: 0.95 } : {}}
                >
                  <motion.div
                    animate={{ scale: active ? 1.12 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 800,
                      background: done ? "#f59e0b" : active ? "rgba(245,158,11,0.15)" : t.surface,
                      border: `2px solid ${done ? "#f59e0b" : active ? "rgba(245,158,11,0.5)" : t.borderLight}`,
                      color: done ? "#000" : active ? "#f59e0b" : t.textDim,
                    }}
                  >
                    {done ? <Check size={13} /> : step}
                  </motion.div>
                  <motion.span
                    animate={{ color: active ? "#f59e0b" : done ? t.textSecondary : t.textDim }}
                    style={{ fontSize: "0.52rem", fontWeight: active || done ? 700 : 500, whiteSpace: "nowrap", letterSpacing: "0.03em" }}
                  >
                    {label}
                  </motion.span>
                </motion.button>
                {i < SCREENS.length - 1 && (
                  <motion.div
                    animate={{ background: done ? "#f59e0b" : t.surface }}
                    style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 16, borderRadius: 2 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden" style={{ position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={pageTransition}
            className="h-full"
          >

            {/* ========== SCREEN 1 — Setup ========== */}
            {screen === 1 && (
              <div className="h-full flex items-center justify-center" style={{ padding: "1.5rem" }}>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-lg"
                >
                  <motion.div variants={fadeUp} className="text-center" style={{ marginBottom: "1.5rem" }}>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem",
                      }}
                    >
                      <FileText size={28} style={{ color: iconColor }} />
                    </motion.div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: t.text, margin: 0 }}>Resume Builder</h2>
                    <p style={{ fontSize: "0.85rem", color: t.textMuted, margin: "0.3rem 0 0" }}>AI-powered ATS-optimized resume in minutes</p>
                  </motion.div>

                  <motion.div
                    variants={fadeUp}
                    style={{
                      background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 20,
                      padding: "1.25rem", marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {[
                        { label: "Target Company", value: setup.company, onChange: (v: string) => setSetup({ ...setup, company: v }), options: COMPANIES },
                        { label: "Target Profession", value: setup.profession, onChange: (v: string) => setSetup({ ...setup, profession: v }), options: PROFESSIONS },
                        { label: "Career Level", value: setup.careerLevel, onChange: (v: string) => setSetup({ ...setup, careerLevel: v }), options: CAREER_LEVELS },
                        { label: "Resume Style", value: setup.resumeStyle, onChange: (v: string) => setSetup({ ...setup, resumeStyle: v }), options: RESUME_STYLES },
                      ].map((field, i) => (
                        <motion.div key={field.label} variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                          <div style={{ position: "relative" }}>
                            <select
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              style={selectStyle}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            >
                              {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.button
                    variants={fadeUp}
                    whileHover={canContinue(1) ? { scale: 1.02, boxShadow: "0 8px 25px rgba(245,158,11,0.3)" } : {}}
                    whileTap={canContinue(1) ? { scale: 0.98 } : {}}
                    onClick={() => canContinue(1) && setScreen(2)}
                    disabled={!canContinue(1)}
                    style={{
                      ...navBtn, width: "100%", justifyContent: "center", padding: "0.65rem",
                      background: canContinue(1) ? "linear-gradient(135deg, #f59e0b, #d97706)" : t.surface,
                      color: canContinue(1) ? "#000" : t.textDim,
                      cursor: canContinue(1) ? "pointer" : "not-allowed", border: "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    {canContinue(1) ? (
                      <>Get Started <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ChevronRight size={16} /></motion.span></>
                    ) : "Fill all fields to continue"}
                  </motion.button>
                </motion.div>
              </div>
            )}

            {/* ========== SCREEN 2 — Information ========== */}
            {screen === 2 && (
              <div className="h-full flex flex-col">
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem" }}>
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    style={{ maxWidth: 860, margin: "0 auto" }}
                  >
                    {/* Personal Info */}
                    <motion.div variants={fadeUp} style={{
                      background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16,
                      padding: "1.1rem", marginBottom: "0.85rem",
                    }}>
                      <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: t.text, margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <UserCircle size={14} style={{ color: iconColor }} /> Personal Info
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                        {[
                          { placeholder: "Full Name *", value: personalInfo.fullName, onChange: (v: string) => setPersonalInfo({ ...personalInfo, fullName: v }) },
                          { placeholder: "Email *", value: personalInfo.email, onChange: (v: string) => setPersonalInfo({ ...personalInfo, email: v }) },
                          { placeholder: "Phone", value: personalInfo.phone, onChange: (v: string) => setPersonalInfo({ ...personalInfo, phone: v }) },
                          { placeholder: "Location", value: personalInfo.location, onChange: (v: string) => setPersonalInfo({ ...personalInfo, location: v }) },
                        ].map((f, i) => (
                          <input key={i} placeholder={f.placeholder} value={f.value}
                            onChange={e => f.onChange(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem", marginTop: "0.65rem" }}>
                        {[
                          { icon: <Globe size={13} />, placeholder: "LinkedIn URL", value: personalInfo.linkedin, onChange: (v: string) => setPersonalInfo({ ...personalInfo, linkedin: v }) },
                          { icon: <Globe size={13} />, placeholder: "GitHub URL", value: personalInfo.github, onChange: (v: string) => setPersonalInfo({ ...personalInfo, github: v }) },
                          { icon: <Globe size={13} />, placeholder: "Portfolio URL", value: personalInfo.portfolio, onChange: (v: string) => setPersonalInfo({ ...personalInfo, portfolio: v }) },
                        ].map((f, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.textMuted, display: "flex" }}>{f.icon}</span>
                            <input placeholder={f.placeholder} value={f.value}
                              onChange={e => f.onChange(e.target.value)}
                              style={{ ...inputStyle, paddingLeft: "2rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Summary */}
                    <motion.div variants={fadeUp} style={{
                      background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16,
                      padding: "1.1rem", marginBottom: "0.85rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: t.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <BookOpen size={14} style={{ color: iconColor }} /> Professional Summary
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={handleAISummary}
                          disabled={generatingAI}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4, padding: "0.3rem 0.65rem",
                            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                            borderRadius: 8, color: iconColor, fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          <Sparkles size={11} /> {generatingAI ? "..." : "AI Generate"}
                        </motion.button>
                      </div>
                      <textarea
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        placeholder="Summarize your professional experience, key skills, and career objectives..."
                        style={{ ...inputStyle, height: 80, resize: "vertical", fontSize: "0.8rem" }}
                        onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                      />
                    </motion.div>

                    {/* Education */}
                    <Section title="Education" icon={<GraduationCap size={14} />} onAdd={addEdu} color={iconColor} t={t}>
                      {education.map((item, idx) => (
                        <motion.div key={idx} variants={fadeUp} style={{
                          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "0.85rem",
                          position: "relative", marginBottom: "0.5rem",
                        }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <input placeholder="Institution" value={item.institution} onChange={e => updateEdu(idx, "institution", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="Degree" value={item.degree} onChange={e => updateEdu(idx, "degree", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="Field of Study" value={item.fieldOfStudy} onChange={e => updateEdu(idx, "fieldOfStudy", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="CGPA/Grade" value={item.grade} onChange={e => updateEdu(idx, "grade", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <input placeholder="Start Date" value={item.startDate} onChange={e => updateEdu(idx, "startDate", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="End Date" value={item.endDate} onChange={e => updateEdu(idx, "endDate", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => removeEdu(idx)}
                            style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#ef4444", display: "flex" }}
                          >
                            <Trash2 size={12} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </Section>

                    {/* Experience */}
                    <Section title="Experience" icon={<Briefcase size={14} />} onAdd={addExp} color={iconColor} t={t}>
                      {experience.map((item, idx) => (
                        <motion.div key={idx} variants={fadeUp} style={{
                          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "0.85rem",
                          position: "relative", marginBottom: "0.5rem",
                        }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: "0.5rem" }}>
                            <motion.button
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => handleAIExperience(idx)} disabled={generatingAI}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 3, padding: "0.2rem 0.55rem",
                                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                                borderRadius: 6, color: iconColor, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              <Sparkles size={9} /> AI
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => removeExp(idx)}
                              style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#ef4444", display: "flex" }}
                            >
                              <Trash2 size={12} />
                            </motion.button>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <input placeholder="Company" value={item.company} onChange={e => updateExp(idx, "company", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="Role" value={item.role} onChange={e => updateExp(idx, "role", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <input placeholder="Start Date" value={item.startDate} onChange={e => updateExp(idx, "startDate", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="End Date" value={item.endDate} onChange={e => updateExp(idx, "endDate", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                          <textarea
                            placeholder="Description (responsibilities, achievements)..."
                            value={item.description} onChange={e => updateExp(idx, "description", e.target.value)}
                            style={{ ...inputStyle, height: 60, resize: "vertical", fontSize: "0.78rem", padding: "0.5rem 0.7rem", marginTop: "0.5rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                        </motion.div>
                      ))}
                    </Section>

                    {/* Projects */}
                    <Section title="Projects" icon={<Code2 size={14} />} onAdd={addProj} color={iconColor} t={t}>
                      {projects.map((item, idx) => (
                        <motion.div key={idx} variants={fadeUp} style={{
                          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "0.85rem",
                          position: "relative", marginBottom: "0.5rem",
                        }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: "0.5rem" }}>
                            <motion.button
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => handleAIProject(idx)} disabled={generatingAI}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 3, padding: "0.2rem 0.55rem",
                                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                                borderRadius: 6, color: iconColor, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              <Sparkles size={9} /> AI
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => removeProj(idx)}
                              style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#ef4444", display: "flex" }}
                            >
                              <Trash2 size={12} />
                            </motion.button>
                          </div>
                          <input placeholder="Project Name" value={item.name} onChange={e => updateProj(idx, "name", e.target.value)}
                            style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                          <input placeholder="Technologies (comma separated)" value={item.techStack} onChange={e => updateProj(idx, "techStack", e.target.value)}
                            style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem", marginTop: "0.5rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                          <textarea
                            placeholder="Description..."
                            value={item.description} onChange={e => updateProj(idx, "description", e.target.value)}
                            style={{ ...inputStyle, height: 60, resize: "vertical", fontSize: "0.78rem", padding: "0.5rem 0.7rem", marginTop: "0.5rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                        </motion.div>
                      ))}
                    </Section>

                    {/* Skills */}
                    <motion.div variants={fadeUp} style={{
                      background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16,
                      padding: "1.1rem", marginBottom: "0.85rem",
                    }}>
                      <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: t.text, margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <Zap size={14} style={{ color: iconColor }} /> Skills
                      </h3>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input placeholder="Add a skill..." value={skillInput} onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addSkill()}
                          style={{ ...inputStyle, flex: 1, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                          onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                        />
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={addSkill}
                          style={{
                            padding: "0.5rem 1rem", background: "linear-gradient(135deg, #f59e0b, #d97706)",
                            border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                          }}
                        >Add</motion.button>
                      </div>
                      <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "0.65rem" }}>
                        {skills.map((s) => (
                          <motion.span key={s} variants={scaleIn} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "0.3rem 0.65rem", background: "rgba(245,158,11,0.08)",
                            border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20,
                            fontSize: "0.72rem", color: t.textSecondary, fontWeight: 600,
                          }}>
                            {s}
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                              onClick={() => removeSkill(s)}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, fontSize: "0.8rem", lineHeight: 1 }}
                            >&times;</motion.button>
                          </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>

                    {/* Certifications */}
                    <Section title="Certifications" icon={<Award size={14} />} onAdd={addCert} color={iconColor} t={t}>
                      {certifications.map((item, idx) => (
                        <motion.div key={idx} variants={fadeUp} style={{
                          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
                          padding: "0.85rem", position: "relative", marginBottom: "0.5rem",
                        }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <input placeholder="Certification Name" value={item.name} onChange={e => updateCert(idx, "name", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <input placeholder="Issuer" value={item.issuer} onChange={e => updateCert(idx, "issuer", e.target.value)}
                              style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                              onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                            />
                          </div>
                          <input placeholder="Date" value={item.date} onChange={e => updateCert(idx, "date", e.target.value)}
                            style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.5rem 0.7rem", marginTop: "0.5rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => removeCert(idx)}
                            style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#ef4444", display: "flex" }}
                          >
                            <Trash2 size={12} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </Section>

                    {/* Achievements */}
                    <Section title="Achievements" icon={<Trophy size={14} />} onAdd={addAchievement} color={iconColor} t={t}>
                      {achievements.map((ach, idx) => (
                        <motion.div key={idx} variants={fadeUp} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: "0.4rem" }}>
                          <input placeholder="e.g. Secured 1st place in National Hackathon" value={ach} onChange={e => updateAchievement(idx, e.target.value)}
                            style={{ ...inputStyle, flex: 1, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => removeAchievement(idx)}
                            style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", color: "#ef4444", display: "flex" }}
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </Section>

                    {/* Languages */}
                    <Section title="Languages" icon={<Languages size={14} />} onAdd={addLanguage} color={iconColor} t={t}>
                      {languages.map((lang, idx) => (
                        <motion.div key={idx} variants={fadeUp} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: "0.4rem" }}>
                          <input placeholder="e.g. English (Fluent), Hindi (Native)" value={lang} onChange={e => updateLanguage(idx, e.target.value)}
                            style={{ ...inputStyle, flex: 1, fontSize: "0.78rem", padding: "0.5rem 0.7rem" }}
                            onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                          />
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => removeLanguage(idx)}
                            style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", color: "#ef4444", display: "flex" }}
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </Section>
                  </motion.div>
                </div>

                {/* Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.75rem 1.25rem", borderTop: `1px solid ${t.border}`,
                    flexShrink: 0,
                  }}
                >
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setScreen(1)}
                    style={{ ...navBtn, background: t.surface, border: `1px solid ${t.border}`, color: t.textSecondary }}
                  >
                    <ChevronLeft size={14} /> Back
                  </motion.button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleSaveDraft} disabled={saving}
                      style={{ ...navBtn, background: "transparent", border: `1px solid ${t.borderLight}`, color: t.textSecondary }}
                    >
                      <Save size={13} /> {saving ? "Saving..." : "Save Draft"}
                    </motion.button>
                    <motion.button
                      whileHover={canContinue(2) ? { scale: 1.02, boxShadow: "0 8px 25px rgba(245,158,11,0.3)" } : {}}
                      whileTap={canContinue(2) ? { scale: 0.98 } : {}}
                      onClick={() => { if (canContinue(2)) { setScreen(3); handleGenerate(); } }}
                      disabled={!canContinue(2)}
                      style={{
                        ...navBtn, padding: "0.45rem 1.2rem",
                        background: canContinue(2) ? "linear-gradient(135deg, #f59e0b, #d97706)" : t.surface,
                        color: canContinue(2) ? "#000" : t.textDim,
                        border: "none", cursor: canContinue(2) ? "pointer" : "not-allowed",
                      }}
                    >
                      Generate Resume <Sparkles size={13} />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ========== SCREEN 3 — AI Generation ========== */}
            {screen === 3 && (
              <div className="h-full flex items-center justify-center" style={{ padding: "1.5rem" }}>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-sm"
                  style={{ textAlign: "center" }}
                >
                  <motion.div
                    animate={{ rotate: genStep >= 4 ? 0 : 360 }}
                    transition={{ repeat: genStep >= 4 ? 0 : Infinity, duration: 1.5, ease: "linear" }}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: genStep >= 4 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      border: `2px solid ${genStep >= 4 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
                    }}
                  >
                    {genStep >= 4
                      ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}><Check size={30} style={{ color: "#10b981" }} /></motion.div>
                      : <Loader2 size={30} style={{ color: iconColor }} />
                    }
                  </motion.div>
                  <motion.h2 variants={fadeUp} style={{ fontSize: "1.25rem", fontWeight: 800, color: t.text, margin: 0 }}>
                    {genStep >= 4 ? "Resume Ready!" : "Generating Resume..."}
                  </motion.h2>
                  <motion.p variants={fadeUp} style={{ fontSize: "0.82rem", color: t.textMuted, margin: "0.3rem 0 1.25rem" }}>
                    AI is crafting your optimized ATS resume
                  </motion.p>

                  <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {genSteps.map((step, i) => (
                      <motion.div
                        key={step.label}
                        variants={fadeUp}
                        animate={{
                          background: i <= genStep ? t.genBg : t.surface,
                          borderColor: i <= genStep ? "rgba(245,158,11,0.2)" : t.border,
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "0.75rem 1rem", borderRadius: 12,
                          border: "1px solid", transition: "all 0.3s ease",
                        }}
                      >
                        <motion.div
                          animate={{
                            background: i < genStep ? "#f59e0b" : i === genStep ? "rgba(245,158,11,0.2)" : t.surface,
                            scale: i === genStep ? [1, 1.15, 1] : 1,
                          }}
                          transition={{ repeat: i === genStep ? Infinity : 0, duration: 1 }}
                          style={{
                            width: 28, height: 28, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}
                        >
                          {i < genStep
                            ? <Check size={13} style={{ color: "#000" }} />
                            : i === genStep
                            ? <Loader2 size={11} style={{ color: iconColor }} className="animate-spin" />
                            : <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.textDim }} />
                          }
                        </motion.div>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 8,
                          fontSize: "0.8rem", fontWeight: 600,
                          color: i <= genStep ? t.text : t.textDim,
                        }}>
                          {i <= genStep && <span style={{ color: iconColor }}>{step.icon}</span>}
                          {step.label}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            )}

            {/* ========== SCREEN 4 — Editor ========== */}
            {screen === 4 && (
              <div className="h-full flex" style={{ flexDirection: showSidebar ? "row" : "column" }}>
                {/* Left Editor Panel */}
                {showSidebar && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "40%", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{
                      borderRight: `1px solid ${t.border}`, overflowY: "auto",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h3 style={{ fontSize: "0.72rem", fontWeight: 700, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <Settings size={12} style={{ color: iconColor }} /> Editor
                        </h3>
                        <div style={{ display: "flex", gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={handleSaveDraft} disabled={saving}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "0.35rem 0.7rem", background: "rgba(245,158,11,0.12)",
                              border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8,
                              color: iconColor, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                            }}
                          >
                            <Save size={11} /> {saving ? "..." : "Save"}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={handleAIOptimizeCompany} disabled={generatingAI}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "0.35rem 0.7rem", background: t.surface,
                              border: `1px solid ${t.borderLight}`, borderRadius: 8,
                              color: t.textSecondary, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                            }}
                          >
                            <Zap size={11} /> {generatingAI ? "..." : "Optimize"}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
                      {/* Summary */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: t.textSecondary, margin: 0 }}>Professional Summary</h4>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={handleAISummary} disabled={generatingAI}
                            style={{ background: "none", border: "none", color: iconColor, fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                          >
                            <Sparkles size={9} /> AI
                          </motion.button>
                        </div>
                        <textarea value={summary} onChange={e => setSummary(e.target.value)}
                          placeholder="Write a professional summary..."
                          style={{ ...inputStyle, height: 70, resize: "vertical", fontSize: "0.75rem", padding: "0.5rem 0.7rem" }}
                        />
                      </div>

                      {/* Quick edit sections */}
                      {[
                        { label: "Experience", data: experience, setData: setExperience, fields: ["company", "role"] },
                        { label: "Projects", data: projects, setData: setProjects, fields: ["name", "techStack"] },
                        { label: "Education", data: education, setData: setEducation, fields: ["degree", "institution"] },
                      ].map((section) => (
                        <div key={section.label} style={{ marginBottom: "0.75rem" }}>
                          <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: t.textSecondary, margin: "0 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>{section.label}</h4>
                          {(section.data as any[]).map((item, idx) => (
                            <div key={idx} style={{
                              background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
                              padding: "0.5rem", marginBottom: "0.35rem",
                            }}>
                              {section.fields.map((f) => (
                                <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                                  value={item[f] || ""}
                                  onChange={e => {
                                    const u = [...section.data as any[]];
                                    (u[idx] as any)[f] = e.target.value;
                                    (section.setData as any)(u);
                                  }}
                                  style={{ ...inputStyle, fontSize: "0.7rem", padding: "0.35rem 0.55rem", marginBottom: "0.25rem" }}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Skills */}
                      <div>
                        <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: t.textSecondary, margin: "0 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>Skills</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {skills.map((s) => (
                            <span key={s} style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              padding: "0.2rem 0.5rem", background: "rgba(245,158,11,0.08)",
                              border: "1px solid rgba(245,158,11,0.15)", borderRadius: 14,
                              fontSize: "0.65rem", color: t.textSecondary, fontWeight: 600,
                            }}>
                              {s}
                              <button onClick={() => removeSkill(s)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, fontSize: "0.8rem" }}>&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Right Preview Panel */}
                <div
                  className="flex flex-col"
                  style={{
                    flex: 1, overflow: "hidden",
                    ...(isFullscreen ? { position: "fixed", inset: 0, zIndex: 999, background: t.bg } as any : {}),
                  }}
                >
                  {/* Toolbar */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.6rem 1rem", borderBottom: `1px solid ${t.border}`, flexShrink: 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setShowSidebar(!showSidebar)}
                        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: t.textSecondary, display: "flex" }}
                      >
                        <Settings size={13} />
                      </motion.button>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: t.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                        <Eye size={13} style={{ color: iconColor }} /> Preview
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* Device switcher */}
                      <div style={{ display: "flex", gap: 2, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 2 }}>
                        {(["desktop", "tablet", "mobile"] as const).map((d) => (
                          <motion.button key={d} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setPreviewDevice(d)}
                            style={{
                              padding: "0.3rem 0.5rem", borderRadius: 6, border: "none", cursor: "pointer",
                              background: previewDevice === d ? "rgba(245,158,11,0.15)" : "transparent",
                              color: previewDevice === d ? iconColor : t.textMuted, display: "flex",
                            }}
                          >
                            {d === "desktop" ? <Monitor size={12} /> : d === "tablet" ? <Tablet size={12} /> : <Smartphone size={12} />}
                          </motion.button>
                        ))}
                      </div>
                      {/* Zoom */}
                      <div style={{ display: "flex", alignItems: "center", gap: 2, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "2px 4px" }}>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setZoom(prev => Math.max(40, prev - 10))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: 4, display: "flex" }}
                        >
                          <ZoomOut size={12} />
                        </motion.button>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: t.textMuted, minWidth: 28, textAlign: "center" }}>{zoom}%</span>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setZoom(prev => Math.min(160, prev + 10))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: 4, display: "flex" }}
                        >
                          <ZoomIn size={12} />
                        </motion.button>
                      </div>
                      {/* Chat button */}
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setChatOpen(true)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "0.35rem 0.7rem", background: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8,
                          color: iconColor, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        <MessageCircle size={12} /> AI Chat
                      </motion.button>
                      {/* Fullscreen */}
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={toggleFullscreen}
                        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: t.textSecondary, display: "flex" }}
                      >
                        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                      </motion.button>
                    </div>
                  </div>

                  {/* Preview content */}
                  <div className="flex-1" style={{ overflow: "auto", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                    <motion.div
                      layout
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      style={{
                        background: "#ffffff", color: "#1e293b", borderRadius: previewDevice === "mobile" ? 20 : 12,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
                        width: previewWidth, minHeight: 842,
                        transform: `scale(${zoom / 100})`, transformOrigin: "top center",
                        overflow: "hidden", transition: "width 0.3s ease, border-radius 0.3s ease",
                        margin: "0 auto",
                      }}
                    >
                      <div style={{ padding: 40 }}>
                        <ResumePreviewTemplate personalInfo={personalInfo} summary={summary} education={education} experience={experience} projects={projects} skills={skills} certifications={certifications} achievements={achievements} languages={languages} template={setup.resumeStyle} />
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom nav */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.6rem 1rem", borderTop: `1px solid ${t.border}`, flexShrink: 0,
                    }}
                  >
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setScreen(2)}
                      style={{ ...navBtn, background: t.surface, border: `1px solid ${t.border}`, color: t.textSecondary }}
                    >
                      <ChevronLeft size={14} /> Edit Info
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(245,158,11,0.3)" }} whileTap={{ scale: 0.98 }}
                      onClick={() => setScreen(5)}
                      style={{ ...navBtn, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none" }}
                    >
                      Review & Export <ChevronRight size={14} />
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            )}

            {/* ========== SCREEN 5 — Review & Export ========== */}
            {screen === 5 && (
              <div className="h-full flex items-center justify-center" style={{ padding: "1.5rem", overflowY: "auto" }}>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-lg"
                >
                  <motion.div variants={fadeUp} className="text-center" style={{ marginBottom: "1.5rem" }}>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem",
                      }}
                    >
                      <Check size={28} style={{ color: "#10b981" }} />
                    </motion.div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: t.text, margin: 0 }}>Resume Complete</h2>
                    <p style={{ fontSize: "0.82rem", color: t.textMuted, margin: "0.25rem 0 0" }}>Your AI-powered resume is ready to export</p>
                  </motion.div>

                  <motion.div variants={fadeUp} style={{
                    background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16,
                    padding: "1.1rem", marginBottom: "1rem",
                  }}>
                    <h3 style={{ fontSize: "0.72rem", fontWeight: 700, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Resume Details</h3>
                    {[
                      { label: "Template", value: setup.resumeStyle },
                      { label: "Target Company", value: setup.company },
                      { label: "Target Profession", value: setup.profession },
                      { label: "Career Level", value: setup.careerLevel },
                      { label: "Sections", value: `${[personalInfo.fullName && "Personal", summary && "Summary", experience.some(e => e.company) && "Experience", projects.some(p => p.name) && "Projects", education.some(e => e.institution) && "Education", skills.length && "Skills"].filter(Boolean).join(", ")}` },
                    ].map((item) => (
                      <div key={item.label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.4rem 0", borderBottom: `1px solid ${t.border}`,
                      }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: t.textMuted }}>{item.label}</span>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: t.text }}>{item.value}</span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div variants={fadeUp} style={{
                    background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16,
                    padding: "1.1rem", marginBottom: "1rem",
                  }}>
                    <h3 style={{ fontSize: "0.72rem", fontWeight: 700, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <Download size={13} style={{ color: iconColor }} /> Export Options
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { type: "pdf" as const, label: "PDF", color: iconColor, bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
                        { type: "docx" as const, label: "DOCX", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
                        { type: "txt" as const, label: "Save", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", action: "save" },
                      ].map((opt) => (
                        <motion.button
                          key={opt.label}
                          whileHover={{ scale: 1.04, y: -3 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            if (opt.action === "save") handleSaveDraft();
                            else if (opt.type === "pdf" || opt.type === "docx") handleExport(opt.type);
                          }}
                          disabled={exporting !== null || saving}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                            padding: "1rem", borderRadius: 12, cursor: "pointer",
                            background: opt.bg, border: `1px solid ${opt.border}`,
                            transition: "all 0.2s ease",
                          }}
                        >
                          {opt.type === "pdf" || opt.type === "docx"
                            ? <FileText size={24} style={{ color: opt.color }} />
                            : <Save size={24} style={{ color: opt.color }} />
                          }
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: t.text }}>
                            {exporting === opt.type || saving ? "..." : opt.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUp} style={{ display: "flex", gap: 10 }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setScreen(4)}
                      style={{
                        flex: 1, ...navBtn, justifyContent: "center", padding: "0.6rem",
                        background: t.surface, border: `1px solid ${t.border}`, color: t.textSecondary,
                      }}
                    >
                      Back to Editor
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(245,158,11,0.3)" }} whileTap={{ scale: 0.98 }}
                      onClick={() => setView("resume-hub")}
                      style={{
                        flex: 1, ...navBtn, justifyContent: "center", padding: "0.6rem",
                        background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none",
                      }}
                    >
                      Done
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", justifyContent: "flex-end" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex flex-col"
              style={{
                width: "100%", maxWidth: 420, height: "100%",
                background: t.chatBg, borderLeft: `1px solid ${t.borderLight}`,
                position: "relative", zIndex: 1,
              }}
            >
              {/* Chat Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1rem 1.1rem", borderBottom: `1px solid ${t.borderLight}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Bot size={16} style={{ color: iconColor }} />
                  </motion.div>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text }}>AI Assistant</span>
                    <span style={{ fontSize: "0.65rem", color: t.textMuted, display: "block", marginTop: -1 }}>Resume Optimization</span>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setChatOpen(false)}
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 6, cursor: "pointer", color: t.textMuted, display: "flex" }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto" style={{ padding: "0.75rem" }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Bot size={40} style={{ color: iconColor, margin: "0 auto 0.75rem", opacity: 0.6 }} />
                    </motion.div>
                    <p style={{ fontSize: "0.82rem", color: t.textMuted, marginBottom: "1rem" }}>Ask AI to improve your resume</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                      {CHAT_SUGGESTIONS.map((s) => (
                        <motion.button key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => handleAIChat(s)}
                          style={{
                            padding: "0.4rem 0.75rem", background: t.surface, border: `1px solid ${t.border}`,
                            borderRadius: 20, fontSize: "0.68rem", color: t.textSecondary, cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: "flex", gap: 8,
                          justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        {msg.role === "ai" && (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4,
                          }}>
                            <Bot size={12} style={{ color: iconColor }} />
                          </div>
                        )}
                        <div style={{
                          maxWidth: "80%", padding: "0.65rem 0.85rem", borderRadius: 14,
                          fontSize: "0.78rem", lineHeight: 1.5,
                          background: msg.role === "user" ? "rgba(245,158,11,0.12)" : t.surface,
                          border: `1px solid ${msg.role === "user" ? "rgba(245,158,11,0.2)" : t.border}`,
                          color: t.text,
                          whiteSpace: "pre-wrap",
                        }}>
                          {msg.text || <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>Thinking...</motion.span>}
                        </div>
                        {msg.role === "user" && (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "rgba(245,158,11,0.2)", border: "2px solid rgba(245,158,11,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4,
                          }}>
                            <User size={12} style={{ color: iconColor }} />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {chatLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: "flex", gap: 8, alignItems: "center" }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Bot size={12} style={{ color: iconColor }} />
                        </div>
                        <div style={{ padding: "0.65rem 0.85rem", borderRadius: 14, background: t.surface, border: `1px solid ${t.border}` }}>
                          <Loader2 size={14} className="animate-spin" style={{ color: iconColor }} />
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${t.borderLight}` }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAIChat()}
                    placeholder="Ask AI to improve..."
                    disabled={chatLoading}
                    style={{
                      flex: 1, ...inputStyle, fontSize: "0.78rem", padding: "0.55rem 0.75rem",
                    }}
                    onFocus={(e) => { Object.assign(e.currentTarget.style, inputFocusStyle); }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={() => handleAIChat()}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      padding: "0.55rem 0.75rem", borderRadius: 10,
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      border: "none", color: "#000", cursor: "pointer",
                      opacity: chatLoading || !chatInput.trim() ? 0.4 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Send size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Section Wrapper
function Section({ title, icon, children, onAdd, t, color }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  onAdd?: () => void; t: any; color: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: t.cardBg, border: `1px solid ${t.border}`,
        borderRadius: 16, overflow: "hidden", marginBottom: "0.85rem",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.7rem 1rem", cursor: "pointer", userSelect: "none",
        }}
      >
        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: t.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color }}>{icon}</span>
          {title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onAdd && (
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "0.25rem 0.6rem", background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.15)", borderRadius: 6,
                color: color, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={11} /> Add
            </motion.button>
          )}
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={13} style={{ color: t.textMuted }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 1rem 1rem" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Preview Template
interface PreviewProps {
  personalInfo: any; summary: string; education: any[]; experience: any[]; projects: any[];
  skills: string[]; certifications: any[]; achievements: string[]; languages: string[]; template: string;
}

function ResumePreviewTemplate({ personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages, template }: PreviewProps) {
  return (
    <div className="text-[10px] text-gray-800 leading-relaxed space-y-4">
      <div className={`text-center space-y-1 ${template.includes("Minimal") ? "text-left border-b border-gray-300 pb-3" : ""}`}>
        <h4 className={`text-lg font-extrabold text-black tracking-wide ${template.includes("Developer") ? "text-amber-600" : ""}`}>{personalInfo.fullName || "Candidate Name"}</h4>
        <div className="text-[9px] text-gray-500 flex flex-wrap justify-center gap-2">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span> &bull; {personalInfo.phone}</span>}
          {personalInfo.location && <span> &bull; {personalInfo.location}</span>}
        </div>
        <div className="text-[9px] text-gray-500 flex flex-wrap justify-center gap-2">
          {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
          {personalInfo.github && <span> &bull; GitHub: {personalInfo.github}</span>}
          {personalInfo.portfolio && <span> &bull; Web: {personalInfo.portfolio}</span>}
        </div>
      </div>

      {summary && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Professional Summary</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <p className="text-[9px] text-gray-700 text-justify">{summary}</p>
        </div>
      )}

      {experience.some((e: any) => e.role || e.company) && (
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Work Experience</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          {experience.map((item: any, idx: number) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between font-bold text-black text-[9.5px]">
                <span>{item.role || "Role"} @ {item.company || "Company"}</span>
                <span className="text-[8.5px] text-gray-400">{item.startDate} - {item.endDate}</span>
              </div>
              {item.description && <p className="text-[8.5px] text-gray-600 pl-2 border-l border-gray-200 whitespace-pre-line">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      {projects.some((p: any) => p.name || p.techStack) && (
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Projects</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          {projects.map((item: any, idx: number) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold text-black text-[9.5px]">{item.name || "Project Title"}</div>
              {item.techStack && <div className="text-[8px] text-amber-700 italic">Tech Stack: {item.techStack}</div>}
              {item.description && <p className="text-[8.5px] text-gray-600 pl-2 border-l border-gray-200 whitespace-pre-line">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      {education.some((e: any) => e.institution || e.degree) && (
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Education</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          {education.map((item: any, idx: number) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between font-bold text-black">
                <span>{item.degree || "Degree"} in {item.fieldOfStudy || "Specialization"}</span>
                <span className="text-[8.5px] text-gray-400">{item.startDate} - {item.endDate}</span>
              </div>
              <div className="text-[8.5px] text-gray-600">{item.institution}</div>
              {item.grade && <div className="text-[8px] text-gray-400">Grade / GPA: {item.grade}</div>}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Technical Skills</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <p className="text-[9.5px] text-gray-700">{skills.join(", ")}</p>
        </div>
      )}

      {certifications.some((c: any) => c.name || c.issuer) && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Certifications</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <ul className="list-disc pl-3 text-[9px] text-gray-700 space-y-0.5">
            {certifications.map((c: any, idx: number) => <li key={idx}>{c.name}{c.issuer && ` by ${c.issuer}`}{c.date && ` (${c.date})`}</li>)}
          </ul>
        </div>
      )}

      {achievements.some((a: string) => a) && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Key Achievements</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <ul className="list-disc pl-3 text-[9px] text-gray-700 space-y-0.5">{achievements.filter(Boolean).map((ach: string, idx: number) => <li key={idx}>{ach}</li>)}</ul>
        </div>
      )}

      {languages.some((l: string) => l) && (
        <div className="space-y-1">
          <div className="text-[9px] font-bold text-gray-900 uppercase tracking-wider">Languages</div>
          <div className="h-px bg-gray-200 w-full mb-1" />
          <p className="text-[9.5px] text-gray-700">{languages.filter(Boolean).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
