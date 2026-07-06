"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import {
  FileText, ArrowLeft, Save, Sparkles, Download, Plus, Trash2,
  ChevronLeft, ChevronRight, Eye, ZoomIn, ZoomOut, Maximize2,
  Check, MessageCircle, Send, X, Bot, User, Loader2, Zap,
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
const SCREENS = ["Setup", "Information", "Generation", "Editor", "AI Chat", "Review"];
const CHAT_SUGGESTIONS = ["Optimize for Amazon", "Reduce to one page", "Improve summary", "Improve project descriptions", "Add stronger action verbs", "Rewrite achievements"];

const containerVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ResumeBuilderView({ setView, selectedTemplate, theme = "dark" }: ResumeBuilderViewProps) {
  const isDark = theme === "dark";
  const t = {
    bg: isDark ? "#060b0e" : "#f0f4ff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    border: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)",
    borderLight: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
    text: isDark ? "#fff" : "#0f172a",
    textSecondary: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
    textMuted: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
    textDim: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
    inputBg: isDark ? "rgba(0,0,0,0.4)" : "rgba(246,249,252,0.8)",
    cardBg: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)",
    genBg: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.08)",
    genBorder: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.25)",
    mutedBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    stepCircle: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    stepCircleBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
    fullscreenBg: isDark ? "#060b0e" : "#f0f4ff",
    chatBg: isDark ? "#0a0e14" : "#ffffff",
  };
  const [screen, setScreen] = useState(1);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [zoom, setZoom] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Screen 1 — Setup
  const [setup, setSetup] = useState({ company: "Google", profession: "Software Engineer", careerLevel: "Fresher", resumeStyle: selectedTemplate || "ATS Modern" });

  // Screen 3 — Generation tracking
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const genSteps = [
    { label: "Analyzing Profile", done: false },
    { label: `Optimizing for ${setup.company}`, done: false },
    { label: `Optimizing for ${setup.profession}`, done: false },
    { label: "Generating ATS Resume", done: false },
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

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const resumeJSON = { personalInfo, summary, education, experience, projects, skills, certifications, achievements, languages };

  // --- AI functions ---
  const handleAISummary = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post("/resume/generate-summary", { personalInfo, education, experience, skills });
      if (res.data.success && res.data.summary) setSummary(res.data.summary);
    } catch {} finally { setGeneratingAI(false); }
  };

  const handleAIExperience = async (index: number) => {
    setGeneratingAI(true);
    try {
      const item = experience[index];
      const res = await api.post("/resume/enhance-experience", { role: item.role, company: item.company, description: item.description });
      if (res.data.success && res.data.description) {
        const updated = [...experience]; updated[index].description = res.data.description; setExperience(updated);
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

    // Add a streaming placeholder message
    const aiMsgIndex = chatMessages.length + 1; // after user msg
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
              const updated = Object.keys({ summary: data.summary, experience: data.experience, projects: data.projects, skills: data.skills })
                .filter(k => data[k]).join(", ");
              if (updated) {
                accumulatedText += `\n\n✅ Updated: ${updated}`;
                setChatMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "ai", text: accumulatedText };
                  return next;
                });
              }
            } else if (data.type === "error") {
              throw new Error(data.message || "Stream error");
            }
          } catch { /* skip unparseable lines */ }
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

  // --- Generation ---
  const handleGenerate = async () => {
    setGenerating(true);
    setGenStep(0);
    // Snapshot current state to avoid stale closures
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

  // --- Save ---
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = { title: `My ${setup.profession} Resume`, template: setup.resumeStyle, ...resumeJSON, targetCompany: setup.company, careerLevel: setup.careerLevel };
      if (resumeId) await api.put(`/resume/update/${resumeId}`, payload);
      else { const res = await api.post("/resume/create", payload); if (res.data?.success && res.data.resume) setResumeId(res.data.resume.id); }
    } catch {} finally { setSaving(false); }
  };

  // --- Export ---
  const handleExport = async (type: "pdf" | "docx") => {
    if (!resumeId) { await handleSaveDraft(); }
    setExporting(type);
    try {
      const id = resumeId;
      if (!id) return;
      const response = await api.post(`/resume/export-${type}`, { resumeId: id }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: type === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${setup.company}_${setup.profession}_Resume.${type}`; link.click();
    } catch {} finally { setExporting(null); }
  };

  // --- Helpers ---
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

  return (
    <div className="relative h-full flex flex-col">
      {/* Top Progress Bar */}
      <div className="px-6 pt-4 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {SCREENS.map((label, i) => {
            const step = i + 1;
            const active = screen === step;
            const done = screen > step;
            return (
              <div key={label} className="flex items-center gap-0 flex-1">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ scale: active ? 1.15 : 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 800,
                      background: done ? "#f59e0b" : active ? "rgba(245,158,11,0.2)" : t.stepCircle,
                      border: `2px solid ${done ? "#f59e0b" : active ? "rgba(245,158,11,0.5)" : t.stepCircleBorder}`,
                      color: done ? "#000" : active ? "#f59e0b" : t.textDim,
                    }}
                  >
                    {done ? <Check size={14} /> : step}
                  </motion.div>
                  <span style={{
                    fontSize: "0.55rem", fontWeight: active || done ? 700 : 500,
                    color: active ? "#f59e0b" : done ? t.textSecondary : t.textDim,
                    whiteSpace: "nowrap", letterSpacing: "0.02em",
                  }}>{label}</span>
                </div>
                {i < SCREENS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: "0 6px", marginBottom: 16, borderRadius: 1,
                    background: done ? "#f59e0b" : t.stepCircle,
                    transition: "background 0.3s ease",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={screen} variants={containerVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="h-full">

            {/* ========== SCREEN 1 — Welcome / Resume Setup ========== */}
            {screen === 1 && (
              <div className="h-full flex items-center justify-center p-8">
                <div className="w-full max-w-lg space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                      <FileText size={28} className="text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">Resume Builder</h2>
                    <p className="text-sm text-white/50">Create an AI-powered ATS-optimized resume</p>
                  </div>

                  <div className="space-y-4 bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                    {[
                      { label: "Target Company", value: setup.company, onChange: (v: string) => setSetup({ ...setup, company: v }), options: COMPANIES },
                      { label: "Target Profession", value: setup.profession, onChange: (v: string) => setSetup({ ...setup, profession: v }), options: PROFESSIONS },
                      { label: "Career Level", value: setup.careerLevel, onChange: (v: string) => setSetup({ ...setup, careerLevel: v }), options: CAREER_LEVELS },
                      { label: "Resume Style", value: setup.resumeStyle, onChange: (v: string) => setSetup({ ...setup, resumeStyle: v }), options: RESUME_STYLES },
                    ].map((field) => (
                      <div key={field.label} className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{field.label}</label>
                        <select
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                        >
                          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: canContinue(1) ? 1.02 : 1 }} whileTap={{ scale: canContinue(1) ? 0.98 : 1 }}
                    onClick={() => canContinue(1) && setScreen(2)}
                    disabled={!canContinue(1)}
                    className="w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: canContinue(1) ? "linear-gradient(135deg, #f59e0b, #d97706)" : t.stepCircle,
                      color: canContinue(1) ? "#000" : t.textDim,
                      cursor: canContinue(1) ? "pointer" : "not-allowed",
                    }}
                  >Continue <ChevronRight size={16} /></motion.button>
                </div>
              </div>
            )}

            {/* ========== SCREEN 2 — Resume Information ========== */}
            {screen === 2 && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                  {/* Personal Info */}
                  <Section title="Personal Info">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input placeholder="Full Name" value={personalInfo.fullName} onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                      <input placeholder="Email" value={personalInfo.email} onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                      <input placeholder="Phone" value={personalInfo.phone} onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                      <input placeholder="Location" value={personalInfo.location} onChange={e => setPersonalInfo({ ...personalInfo, location: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                      <input placeholder="LinkedIn URL" value={personalInfo.linkedin} onChange={e => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                      <input placeholder="GitHub URL" value={personalInfo.github} onChange={e => setPersonalInfo({ ...personalInfo, github: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                      <input placeholder="Portfolio URL" value={personalInfo.portfolio} onChange={e => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white md:col-span-2" />
                    </div>
                  </Section>

                  {/* Education */}
                  <Section title="Education" onAdd={addEdu}>
                    {education.map((item, idx) => (
                      <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                        <button onClick={() => removeEdu(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                        <input placeholder="Institution" value={item.institution} onChange={e => updateEdu(idx, "institution", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Degree" value={item.degree} onChange={e => updateEdu(idx, "degree", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                          <input placeholder="Field of Study" value={item.fieldOfStudy} onChange={e => updateEdu(idx, "fieldOfStudy", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input placeholder="Start Date" value={item.startDate} onChange={e => updateEdu(idx, "startDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                          <input placeholder="End Date" value={item.endDate} onChange={e => updateEdu(idx, "endDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                          <input placeholder="CGPA/Grade" value={item.grade} onChange={e => updateEdu(idx, "grade", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        </div>
                      </div>
                    ))}
                  </Section>

                  {/* Experience */}
                  <Section title="Experience" onAdd={addExp}>
                    {experience.map((item, idx) => (
                      <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                        <div className="flex justify-between items-center pr-6">
                          <button onClick={() => handleAIExperience(idx)} disabled={generatingAI} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded border border-amber-500/20">
                            <Sparkles size={10} /> AI Improve
                          </button>
                          <button onClick={() => removeExp(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                        </div>
                        <input placeholder="Company" value={item.company} onChange={e => updateExp(idx, "company", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <input placeholder="Role" value={item.role} onChange={e => updateExp(idx, "role", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Start Date" value={item.startDate} onChange={e => updateExp(idx, "startDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                          <input placeholder="End Date" value={item.endDate} onChange={e => updateExp(idx, "endDate", e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        </div>
                        <textarea placeholder="Description (responsibilities, achievements)..." value={item.description} onChange={e => updateExp(idx, "description", e.target.value)} className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white resize-none" />
                      </div>
                    ))}
                  </Section>

                  {/* Projects */}
                  <Section title="Projects" onAdd={addProj}>
                    {projects.map((item, idx) => (
                      <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                        <div className="flex justify-between items-center pr-6">
                          <button onClick={() => handleAIProject(idx)} disabled={generatingAI} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded border border-amber-500/20">
                            <Sparkles size={10} /> AI Improve
                          </button>
                          <button onClick={() => removeProj(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                        </div>
                        <input placeholder="Project Name" value={item.name} onChange={e => updateProj(idx, "name", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <input placeholder="Technologies (comma separated)" value={item.techStack} onChange={e => updateProj(idx, "techStack", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <textarea placeholder="Description..." value={item.description} onChange={e => updateProj(idx, "description", e.target.value)} className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white resize-none" />
                      </div>
                    ))}
                  </Section>

                  {/* Skills */}
                  <Section title="Skills">
                    <div className="flex gap-2">
                      <input placeholder="Add a skill..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white" />
                      <button onClick={addSkill} className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                          {s} <button onClick={() => removeSkill(s)} className="text-red-400 hover:text-red-300 font-bold ml-1">&times;</button>
                        </span>
                      ))}
                    </div>
                  </Section>

                  {/* Certifications */}
                  <Section title="Certifications" onAdd={addCert}>
                    {certifications.map((item, idx) => (
                      <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 relative">
                        <button onClick={() => removeCert(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                        <input placeholder="Certification Name" value={item.name} onChange={e => updateCert(idx, "name", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <input placeholder="Issuer" value={item.issuer} onChange={e => updateCert(idx, "issuer", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                        <input placeholder="Date" value={item.date} onChange={e => updateCert(idx, "date", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white" />
                      </div>
                    ))}
                  </Section>

                  {/* Achievements */}
                  <Section title="Achievements" onAdd={addAchievement}>
                    {achievements.map((ach, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input placeholder="e.g. Secured 1st place in National Hackathon 2025" value={ach} onChange={e => updateAchievement(idx, e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                        <button onClick={() => removeAchievement(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </Section>

                  {/* Languages */}
                  <Section title="Languages" onAdd={addLanguage}>
                    {languages.map((lang, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input placeholder="e.g. English (Fluent), Hindi (Native)" value={lang} onChange={e => updateLanguage(idx, e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white" />
                        <button onClick={() => removeLanguage(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </Section>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                  <button onClick={() => { setView("resume-hub"); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-white/70 text-xs font-bold border border-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <motion.button whileHover={{ scale: canContinue(2) ? 1.02 : 1 }} whileTap={{ scale: canContinue(2) ? 0.98 : 1 }}
                    onClick={() => { if (canContinue(2)) { setScreen(3); handleGenerate(); } }} disabled={!canContinue(2)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all"
                    style={{
                      background: canContinue(2) ? "linear-gradient(135deg, #f59e0b, #d97706)" : t.stepCircle,
                      color: canContinue(2) ? "#000" : t.textDim,
                      cursor: canContinue(2) ? "pointer" : "not-allowed",
                    }}
                  >Continue <Sparkles size={14} /></motion.button>
                </div>
              </div>
            )}

            {/* ========== SCREEN 3 — AI Resume Generation ========== */}
            {screen === 3 && (
              <div className="h-full flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                    {genStep >= 4 ? <Check size={30} className="text-amber-500" /> : <Loader2 size={30} className="text-amber-500 animate-spin" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{genStep >= 4 ? "Resume Ready!" : "Generating Resume..."}</h2>
                    <p className="text-sm text-white/50 mt-1">AI is crafting your optimized resume</p>
                  </div>

                  <div className="space-y-3 text-left">
                    {genSteps.map((step, i) => (
                      <div key={step.label} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: i <= genStep ? t.genBg : t.mutedBg, border: `1px solid ${i <= genStep ? t.genBorder : t.mutedBg}` }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: i < genStep ? "#f59e0b" : i === genStep ? "rgba(245,158,11,0.2)" : t.stepCircle }}>
                          {i < genStep ? <Check size={13} className="text-black" /> : i === genStep ? <Loader2 size={12} className="text-amber-500 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: i <= genStep ? t.text : t.textDim }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== SCREEN 4 — Resume Editor ========== */}
            {screen === 4 && (
              <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Left — Editor */}
                <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto p-4 custom-scrollbar border-r border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Resume Editor</h3>
                    <div className="flex gap-2">
                      <button onClick={handleSaveDraft} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black text-[10px] font-bold rounded-lg hover:bg-amber-400 transition-colors">
                        <Save size={12} /> {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={handleAIOptimizeCompany} disabled={generatingAI} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-amber-500 text-[10px] font-bold rounded-lg border border-amber-500/20 hover:bg-amber-500/10 transition-colors">
                        <Zap size={12} /> {generatingAI ? "Optimizing..." : "Optimize All"}
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-bold text-white">Professional Summary</h4>
                      <button onClick={handleAISummary} disabled={generatingAI} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded border border-amber-500/20">
                        <Sparkles size={10} /> AI Improve
                      </button>
                    </div>
                    <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summarize your professional experience..." className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-amber-500/50 resize-none" />
                  </div>

                  {/* Sectioned Editor Items */}
                  {[
                    { label: "Experience", data: experience, fields: ["company", "role"] as const, key: "exp" as const },
                    { label: "Projects", data: projects, fields: ["name", "techStack"] as const, key: "proj" as const },
                    { label: "Education", data: education, fields: ["degree", "institution"] as const, key: "edu" as const },
                  ].map((section) => (
                    <div key={section.key} className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
                      <h4 className="text-[11px] font-bold text-white">{section.label}</h4>
                      {(section.data as any[]).map((item, idx) => (
                        <div key={idx} className="p-2 bg-black/20 border border-white/5 rounded-lg space-y-1.5">
                          {section.fields.map((f) => (
                            <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={item[f] || ""}
                              onChange={e => { const u = [...section.data as any[]]; (u[idx] as any)[f] = e.target.value; if (section.key === "exp") setExperience(u); else if (section.key === "proj") setProjects(u); else setEducation(u); }}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-[10px] text-white" />
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Skills Chip */}
                  <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
                    <h4 className="text-[11px] font-bold text-white">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-300">{s} <button onClick={() => removeSkill(s)} className="text-red-400">&times;</button></span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — Live Preview */}
                <div className="lg:col-span-7 flex flex-col gap-3 p-4 overflow-hidden relative" style={isFullscreen ? { position: "fixed", inset: 0, zIndex: 999, background: t.fullscreenBg, padding: "2rem" } as any : {}}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5"><Eye size={13} className="text-amber-500" /> Live Preview</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                        <button onClick={() => setZoom(prev => Math.max(50, prev - 10))} className="p-1 text-gray-400 hover:text-white"><ZoomOut size={12} /></button>
                        <span className="text-[10px] font-bold text-gray-300 min-w-[30px] text-center">{zoom}%</span>
                        <button onClick={() => setZoom(prev => Math.min(150, prev + 10))} className="p-1 text-gray-400 hover:text-white"><ZoomIn size={12} /></button>
                      </div>
                      <button onClick={() => setChatOpen(true)} className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 hover:bg-amber-500/20 transition-colors"><MessageCircle size={14} /></button>
                      <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Maximize2 size={13} /></button>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 overflow-auto flex justify-center items-start min-h-[400px]">
                    <div className="bg-white text-black p-8 shadow-2xl transition-all duration-300 w-[595px] min-h-[842px]"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                      <ResumePreviewTemplate personalInfo={personalInfo} summary={summary} education={education} experience={experience} projects={projects} skills={skills} certifications={certifications} achievements={achievements} languages={languages} template={setup.resumeStyle} />
                    </div>
                  </div>

                  {/* Bottom Nav */}
                  <div className="flex items-center justify-between">
                    <button onClick={() => setScreen(2)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-white/70 text-[10px] font-bold border border-white/5 hover:bg-white/10 transition-colors">
                      <ChevronLeft size={13} /> Back
                    </button>
                    <button onClick={() => setScreen(6)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-bold hover:from-amber-400 hover:to-amber-500 transition-all">
                      Review &amp; Export <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========== SCREEN 5 — AI Chat (Slide-in over Screen 4) ========== */}
            {screen === 5 && null}

            {/* ========== SCREEN 6 — Final Review & Export ========== */}
            {screen === 6 && (
              <div className="h-full flex items-center justify-center p-8">
                <div className="w-full max-w-lg space-y-6">
                  <div className="text-center space-y-2">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                      <Check size={28} className="text-amber-500" />
                    </motion.div>
                    <h2 className="text-2xl font-extrabold text-white">Resume Ready</h2>
                    <p className="text-sm text-white/50">Your AI-powered resume is complete</p>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
                    {[
                      { label: "Template", value: setup.resumeStyle },
                      { label: "Target", value: setup.company },
                      { label: "Profession", value: setup.profession },
                      { label: "Career Level", value: setup.careerLevel },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                        <span className="text-[11px] font-semibold text-white/50">{item.label}</span>
                        <span className="text-xs font-bold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Export Options</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleExport("pdf")} disabled={exporting !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all">
                        <FileText size={22} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-white">{exporting === "pdf" ? "..." : "PDF"}</span>
                      </button>
                      <button onClick={() => handleExport("docx")} disabled={exporting !== null} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all">
                        <FileText size={22} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-white">{exporting === "docx" ? "..." : "DOCX"}</span>
                      </button>
                      <button onClick={handleSaveDraft} disabled={saving} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all">
                        <Save size={22} className="text-green-400" />
                        <span className="text-[10px] font-bold text-white">{saving ? "..." : "Save"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setScreen(4)} className="flex-1 py-2 rounded-lg bg-white/5 text-white/70 text-xs font-bold border border-white/5 hover:bg-white/10 transition-colors">
                      Back to Editor
                    </button>
                    <button onClick={() => setView("resume-hub")} className="flex-1 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========== AI CHAT PANEL (Screen 5 overlay) ========== */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex justify-end"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setChatOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md h-full border-l border-white/10 flex flex-col" style={{ background: t.chatBg }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-amber-500" />
                  <span className="text-sm font-bold text-white">Resume AI Assistant</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="text-center space-y-3 mt-8">
                    <Bot size={32} className="text-amber-500 mx-auto" />
                    <p className="text-sm text-white/60">Ask AI to improve your resume</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {CHAT_SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => handleAIChat(s)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/70 hover:bg-white/10 hover:border-amber-500/30 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-1"><Bot size={13} className="text-amber-500" /></div>}
                    <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${msg.role === "user" ? "bg-amber-500/10 border border-amber-500/20 text-white" : "bg-white/5 border border-white/10 text-white/80"}`}>
                      {msg.text}
                    </div>
                    {msg.role === "user" && <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-1"><User size={13} className="text-black" /></div>}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Bot size={13} className="text-amber-500" /></div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3"><Loader2 size={14} className="text-amber-500 animate-spin" /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAIChat()}
                    placeholder="Ask AI to improve your resume..." disabled={chatLoading}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50" />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAIChat()} disabled={chatLoading || !chatInput.trim()}
                    className="p-3 rounded-xl bg-amber-500 text-black disabled:opacity-30 transition-all">
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

// --- Section Wrapper ---
function Section({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
        <div className="flex items-center gap-2">
          {onAdd && <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline"><Plus size={12} /> Add</button>}
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}><ChevronRight size={14} className="text-white/30" /></motion.div>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="p-3 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Preview Template ---
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
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>
        <div className="text-[9px] text-gray-500 flex flex-wrap justify-center gap-2">
          {personalInfo.linkedin && <span>LinkedIn: {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>• GitHub: {personalInfo.github}</span>}
          {personalInfo.portfolio && <span>• Web: {personalInfo.portfolio}</span>}
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
