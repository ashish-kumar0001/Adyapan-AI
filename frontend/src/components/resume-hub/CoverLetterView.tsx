"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import {
  ArrowLeft, FileText, Upload, Briefcase, Building2,
  Sparkles, RefreshCw, Check, Copy, Download,
  Send, Trash2, Calendar, ChevronRight, ChevronLeft,
  Zap, Eye, Edit3
} from "lucide-react";
import type { ResumeHubViewType } from "@/types/resume";

// ─── Types ──────────────────────────────────────────────────────────────

interface ResumeBrief {
  id: string;
  title: string;
  template: string;
  updatedAt: string;
}

interface CoverLetterItem {
  id: string;
  companyName: string;
  role: string;
  tone: string;
  letterType: string;
  greeting?: string;
  introduction?: string;
  body?: string;
  closing?: string;
  content: string;
  createdAt: string;
}

// ─── Theme Hook ──────────────────────────────────────────────────────────

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

const colors = (theme: string) => ({
  bg: theme === "dark" ? "#080710" : "#f0f4ff",
  surface: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
  surfaceHover: theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
  border: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
  borderHover: theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)",
  text: theme === "dark" ? "#ffffff" : "#0f172a",
  textSec: theme === "dark" ? "rgba(255,255,255,0.7)" : "#475569",
  textMuted: theme === "dark" ? "rgba(255,255,255,0.4)" : "#94a3b8",
  primary: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  cardBg: theme === "dark" ? "rgba(255,255,255,0.03)" : "#ffffff",
});

// ─── Constants ──────────────────────────────────────────────────────────

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Startup", "Other"];
const ROLES = ["Machine Learning Engineer", "Software Engineer", "Data Scientist", "Frontend Developer"];
const LETTER_TYPES = ["Internship", "Full-Time", "Referral", "Career Switch", "General Application"];
const TONES = ["Professional", "Friendly", "Formal", "Confident", "Creative"];

const GENERATING_STEPS = [
  "Reading Resume",
  "Analyzing Job Description",
  "Understanding Company",
  "Writing Personalized Letter",
];

// ─── Props ──────────────────────────────────────────────────────────────

interface CoverLetterViewProps {
  setView: (v: ResumeHubViewType) => void;
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export function CoverLetterView({ setView }: CoverLetterViewProps) {
  const theme = useTheme();
  const c = colors(theme);

  // Screen
  const [screen, setScreen] = useState<
    "select" | "job" | "generating" | "editor" | "export"
  >("select");

  // Screen 1: Resume selection
  const [resumes, setResumes] = useState<ResumeBrief[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Screen 2: Job details
  const [companyName, setCompanyName] = useState("");
  const [companyCustom, setCompanyCustom] = useState("");
  const [role, setRole] = useState("");
  const [roleCustom, setRoleCustom] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [letterType, setLetterType] = useState("Full-Time");
  const [tone, setTone] = useState("Professional");

  // Screens 3-4: Generation & Editor
  const [coverLetter, setCoverLetter] = useState<CoverLetterItem | null>(null);
  const [greeting, setGreeting] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [body, setBody] = useState("");
  const [closing, setClosing] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // History
  const [history, setHistory] = useState<CoverLetterItem[]>([]);

  // Copy
  const [copied, setCopied] = useState(false);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load Data ──────────────────────────────────────────────────────

  const loadResumes = async () => {
    try {
      const res = await api.get("/resume/list");
      setResumes(res.data.resumes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/cover-letter/history");
      setHistory(res.data.coverLetters || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadResumes();
    loadHistory();
  }, []);

  // ─── Generate ───────────────────────────────────────────────────────

  const startGeneration = async () => {
    setLoading(true);
    setLoadingStep(0);
    setScreen("generating");

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, GENERATING_STEPS.length - 1));
    }, 1200);

    try {
      const effectiveCompany = companyName === "Other" ? companyCustom : companyName;
      const effectiveRole = roleCustom || role;

      const res = await api.post("/cover-letter/generate", {
        resumeId: selectedResumeId || undefined,
        companyName: effectiveCompany,
        role: effectiveRole,
        jobDescription: jdFile ? await jdFile.text() : jobDescription,
        tone,
        letterType,
      });

      clearInterval(stepInterval);

      if (res.data.success && res.data.coverLetter) {
        const cl = res.data.coverLetter;
        setCoverLetter(cl);
        setGreeting(cl.greeting || "");
        setIntroduction(cl.introduction || "");
        setBody(cl.body || "");
        setClosing(cl.closing || "");
        setScreen("editor");
        loadHistory();
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Please try again.";
      alert(`Failed to generate cover letter. ${msg}`);
      setScreen("job");
    } finally {
      setLoading(false);
    }
  };

  // ─── AI Chat ────────────────────────────────────────────────────────

  const handleChatSend = async () => {
    if (!chatMessage.trim() || !coverLetter) return;
    setChatLoading(true);
    try {
      const res = await api.post("/cover-letter/chat", {
        coverLetterId: coverLetter.id,
        message: chatMessage,
      });
      if (res.data.success && res.data.coverLetter) {
        const cl = res.data.coverLetter;
        setCoverLetter(cl);
        setGreeting(cl.greeting || "");
        setIntroduction(cl.introduction || "");
        setBody(cl.body || "");
        setClosing(cl.closing || "");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to refine letter.");
    } finally {
      setChatLoading(false);
      setChatMessage("");
    }
  };

  // ─── Save ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!coverLetter) return;
    try {
      const res = await api.post("/cover-letter/save", {
        coverLetterId: coverLetter.id,
        greeting,
        introduction,
        body,
        closing,
      });
      if (res.data.success) {
        setCoverLetter(res.data.coverLetter);
        alert("Cover letter saved!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this cover letter?")) return;
    try {
      await api.delete(`/cover-letter/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Copy ───────────────────────────────────────────────────────────

  const handleCopy = () => {
    const text = [greeting, introduction, body, closing].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── View History Item ──────────────────────────────────────────────

  const openHistoryItem = (item: CoverLetterItem) => {
    setCoverLetter(item);
    setGreeting(item.greeting || "");
    setIntroduction(item.introduction || "");
    setBody(item.body || "");
    setClosing(item.closing || "");
    setCompanyName(item.companyName);
    setRole(item.role);
    setTone(item.tone);
    setLetterType(item.letterType);
    setScreen("editor");
  };

  // ─── Generate Again ─────────────────────────────────────────────────

  const handleGenerateAgain = () => {
    setCoverLetter(null);
    setScreen("job");
  };

  const handleRegenerateSection = async (field: string) => {
    if (!coverLetter) return;
    setChatLoading(true);
    try {
      const messages: Record<string, string> = {
        greeting: "Improve the greeting to be more engaging",
        introduction: "Improve the introduction to be more compelling",
        body: "Improve the body to highlight more achievements",
        closing: "Improve the closing to be more impactful",
      };
      const res = await api.post("/cover-letter/chat", {
        coverLetterId: coverLetter.id,
        message: messages[field] || `Improve the ${field} section`,
      });
      if (res.data.success && res.data.coverLetter) {
        const cl = res.data.coverLetter;
        setCoverLetter(cl);
        setGreeting(cl.greeting || "");
        setIntroduction(cl.introduction || "");
        setBody(cl.body || "");
        setClosing(cl.closing || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── Full letter text (for preview) ─────────────────────────────────

  const fullLetterText = [greeting, introduction, body, closing].filter(Boolean).join("\n\n");

  // =========================================================================
  // RENDER: SELECT RESUME SCREEN
  // =========================================================================

  const renderSelectResume = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <h2 className="text-lg font-extrabold text-[var(--text-primary)] text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Select Resume
      </h2>
      <p className="text-xs text-[var(--text-secondary)] text-center">
        Choose a saved resume or upload a new one.
      </p>

      {/* Saved Resumes */}
      {resumes.length > 0 && (
        <div className="space-y-2">
          {resumes.map(r => (
            <button
              key={r.id}
              onClick={() => { setSelectedResumeId(r.id); setUploadFile(null); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{
                background: selectedResumeId === r.id ? "rgba(245,158,11,0.1)" : c.surface,
                border: `1px solid ${selectedResumeId === r.id ? c.primary : c.border}`,
                color: c.text,
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                <FileText className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{r.title}</div>
                <div className="text-[10px]" style={{ color: c.textMuted }}>{r.template} template</div>
              </div>
              {selectedResumeId === r.id && <Check className="w-4 h-4 text-[#f59e0b]" />}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: c.border }} />
        <span className="text-xs font-semibold" style={{ color: c.textMuted }}>OR</span>
        <div className="flex-1 h-px" style={{ background: c.border }} />
      </div>

      {/* Upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-6 rounded-xl text-center cursor-pointer transition-all"
        style={{
          background: uploadFile ? "rgba(245,158,11,0.1)" : c.surface,
          border: `1px dashed ${uploadFile ? c.primary : c.border}`,
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: uploadFile ? c.primary : c.textMuted }} />
        <p className="text-xs font-bold" style={{ color: uploadFile ? c.primary : c.textSec }}>
          {uploadFile ? uploadFile.name : "Upload PDF / DOCX"}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setUploadFile(f); setSelectedResumeId(null); }
        }}
      />

      {/* Continue */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={!selectedResumeId && !uploadFile}
        onClick={() => setScreen("job")}
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          background: !selectedResumeId && !uploadFile ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: !selectedResumeId && !uploadFile ? c.textMuted : "#000",
        }}
      >
        Continue <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );

  // =========================================================================
  // RENDER: JOB DETAILS SCREEN
  // =========================================================================

  const renderJobDetails = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-5"
    >
      <h2 className="text-lg font-extrabold text-[var(--text-primary)] text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Job Information
      </h2>

      {/* Company */}
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Company</label>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIES.map(cn => (
            <button
              key={cn}
              type="button"
              onClick={() => { setCompanyName(cn); if (cn !== "Other") setCompanyCustom(""); }}
              className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                companyName === cn
                  ? "bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]"
                  : "text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              }`}
              style={{
                background: companyName === cn ? undefined : c.surface,
                borderColor: companyName === cn ? undefined : c.border,
              }}
            >
              {cn}
            </button>
          ))}
        </div>
        {companyName === "Other" && (
          <input
            type="text"
            value={companyCustom}
            onChange={e => setCompanyCustom(e.target.value)}
            placeholder="Enter company name"
            className="w-full mt-2 bg-transparent border rounded-lg p-2.5 text-xs focus:outline-none"
            style={{ borderColor: c.border, color: c.text }}
          />
        )}
      </div>

      {/* Role */}
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Job Role</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setRoleCustom(""); }}
              className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                role === r
                  ? "bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]"
                  : "text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              }`}
              style={{
                background: role === r ? undefined : c.surface,
                borderColor: role === r ? undefined : c.border,
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={roleCustom}
          onChange={e => { setRoleCustom(e.target.value); setRole(""); }}
          placeholder="Or type a custom role..."
          className="w-full mt-2 bg-transparent border rounded-lg p-2.5 text-xs focus:outline-none"
          style={{ borderColor: c.border, color: c.text }}
        />
      </div>

      {/* Job Description */}
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>
          Job Description <span className="font-normal lowercase" style={{ color: c.textMuted }}>(optional)</span>
        </label>
        <textarea
          rows={3}
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste job description..."
          className="w-full bg-transparent border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
          style={{ borderColor: c.border, color: c.text }}
        />
        <button
          onClick={() => jdFileInputRef.current?.click()}
          className="mt-1.5 text-[10px] font-semibold flex items-center gap-1.5"
          style={{ color: c.primary }}
        >
          <Upload className="w-3 h-3" /> Upload PDF instead
        </button>
        <input
          ref={jdFileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) setJdFile(f);
          }}
        />
        {jdFile && (
          <div className="mt-1 text-[10px] font-semibold" style={{ color: c.green }}>
            <Check className="w-3 h-3 inline mr-1" /> {jdFile.name}
          </div>
        )}
      </div>

      {/* Letter Type */}
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Cover Letter Type</label>
        <div className="grid grid-cols-3 gap-2">
          {LETTER_TYPES.map(lt => (
            <button
              key={lt}
              type="button"
              onClick={() => setLetterType(lt)}
              className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                letterType === lt
                  ? "bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]"
                  : "text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              }`}
              style={{
                background: letterType === lt ? undefined : c.surface,
                borderColor: letterType === lt ? undefined : c.border,
              }}
            >
              {lt}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Tone</label>
        <div className="grid grid-cols-5 gap-2">
          {TONES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                tone === t
                  ? "bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]"
                  : "text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              }`}
              style={{
                background: tone === t ? undefined : c.surface,
                borderColor: tone === t ? undefined : c.border,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setScreen("select")}
          className="flex-1 py-3 rounded-xl font-bold text-sm"
          style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!companyName && !companyCustom}
          onClick={startGeneration}
          className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: !companyName && !companyCustom ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: !companyName && !companyCustom ? c.textMuted : "#000",
          }}
        >
          <Sparkles className="w-4 h-4" /> Generate
        </motion.button>
      </div>
    </motion.div>
  );

  // =========================================================================
  // RENDER: GENERATING SCREEN
  // =========================================================================

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 max-w-md"
      >
        <div className="w-16 h-16 rounded-full bg-[#f59e0b]/10 flex items-center justify-center mx-auto">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-[#f59e0b]" />
          </motion.div>
        </div>

        <h2 className="text-xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif", color: c.text }}>
          Generating Cover Letter
        </h2>

        <div className="space-y-3">
          {GENERATING_STEPS.map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background: loadingStep >= i ? "rgba(245,158,11,0.08)" : "transparent",
                color: loadingStep >= i ? c.primary : c.textMuted,
              }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: loadingStep > i ? c.green : loadingStep === i ? "rgba(245,158,11,0.2)" : c.surface,
                  color: loadingStep > i ? "#fff" : loadingStep === i ? c.primary : c.textMuted,
                }}
              >
                {loadingStep > i ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="text-sm font-bold">{step}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // =========================================================================
  // RENDER: EDITOR SCREEN
  // =========================================================================

  const renderEditor = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen("select")}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-sm font-extrabold" style={{ color: c.text }}>
              {coverLetter?.companyName} — {coverLetter?.role}
            </h3>
            <span className="text-[10px]" style={{ color: c.textMuted }}>
              {coverLetter?.tone} · {coverLetter?.letterType}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors"
            style={{
              background: chatOpen ? "rgba(245,158,11,0.15)" : c.surface,
              color: chatOpen ? c.primary : c.text,
              border: `1px solid ${chatOpen ? c.primary : c.border}`,
            }}
          >
            <Edit3 className="w-3 h-3" /> AI Chat
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors"
            style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
          >
            <Check className="w-3 h-3" /> Save
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors"
            style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Split Screen: Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Editor */}
        <div className="space-y-3">
          {/* Greeting */}
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Greeting</label>
            <div className="flex gap-2">
              <input
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                className="flex-1 bg-transparent border rounded-lg p-2.5 text-xs focus:outline-none"
                style={{ borderColor: c.border, color: c.text }}
              />
              <button
                onClick={() => handleRegenerateSection("greeting")}
                className="px-2 rounded-lg text-[10px] font-bold"
                style={{ background: c.surface, color: c.primary, border: `1px solid ${c.border}` }}
              >
                <RefreshCw className={`w-3 h-3 ${chatLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Introduction */}
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Introduction</label>
            <div className="flex gap-2">
              <textarea
                rows={3}
                value={introduction}
                onChange={e => setIntroduction(e.target.value)}
                className="flex-1 bg-transparent border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
                style={{ borderColor: c.border, color: c.text }}
              />
              <button
                onClick={() => handleRegenerateSection("introduction")}
                className="px-2 rounded-lg text-[10px] font-bold self-start"
                style={{ background: c.surface, color: c.primary, border: `1px solid ${c.border}` }}
              >
                <RefreshCw className={`w-3 h-3 ${chatLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Body</label>
            <div className="flex gap-2">
              <textarea
                rows={5}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="flex-1 bg-transparent border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
                style={{ borderColor: c.border, color: c.text }}
              />
              <button
                onClick={() => handleRegenerateSection("body")}
                className="px-2 rounded-lg text-[10px] font-bold self-start"
                style={{ background: c.surface, color: c.primary, border: `1px solid ${c.border}` }}
              >
                <RefreshCw className={`w-3 h-3 ${chatLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Closing */}
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Closing</label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={closing}
                onChange={e => setClosing(e.target.value)}
                className="flex-1 bg-transparent border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
                style={{ borderColor: c.border, color: c.text }}
              />
              <button
                onClick={() => handleRegenerateSection("closing")}
                className="px-2 rounded-lg text-[10px] font-bold self-start"
                style={{ background: c.surface, color: c.primary, border: `1px solid ${c.border}` }}
              >
                <RefreshCw className={`w-3 h-3 ${chatLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Make it shorter", "More professional", "Optimize for Company", "Highlight projects", "Rewrite introduction", "Improve closing"].map(action => (
              <button
                key={action}
                onClick={async () => {
                  if (!coverLetter) return;
                  setChatLoading(true);
                  try {
                    const res = await api.post("/cover-letter/chat", {
                      coverLetterId: coverLetter.id,
                      message: action,
                    });
                    if (res.data.success && res.data.coverLetter) {
                      const cl = res.data.coverLetter;
                      setCoverLetter(cl);
                      setGreeting(cl.greeting || "");
                      setIntroduction(cl.introduction || "");
                      setBody(cl.body || "");
                      setClosing(cl.closing || "");
                    }
                  } catch (err) { console.error(err); }
                  finally { setChatLoading(false); }
                }}
                disabled={chatLoading}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                style={{ background: c.surface, color: c.textSec, border: `1px solid ${c.border}` }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateAgain}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
            >
              <RefreshCw className="w-3 h-3" /> Generate Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen("select")}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
            >
              <Download className="w-3 h-3" /> Export
            </motion.button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4" style={{ color: c.primary }} />
            <span className="text-xs font-bold uppercase" style={{ color: c.textSec }}>Live Preview</span>
          </div>
          <div
            className="rounded-xl p-5 min-h-[400px] whitespace-pre-wrap text-sm leading-relaxed"
            style={{
              background: theme === "dark" ? "#0a0e14" : "#ffffff",
              border: `1px solid ${c.border}`,
              color: c.text,
              fontFamily: "'Georgia', serif",
            }}
          >
            {fullLetterText || "Your cover letter will appear here..."}
          </div>
        </div>
      </div>

      {/* AI Chat Panel (collapsible) */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl p-4" style={{ background: theme === "dark" ? "#0a0e14" : "#f8fafc", border: `1px solid ${c.border}` }}>
              <div className="flex gap-2">
                <input
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChatSend()}
                  placeholder="Ask AI to refine your letter..."
                  className="flex-1 bg-transparent border rounded-lg p-2.5 text-xs focus:outline-none"
                  style={{ borderColor: c.border, color: c.text }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="px-4 rounded-lg font-bold text-xs flex items-center gap-1.5"
                  style={{
                    background: chatLoading || !chatMessage.trim() ? c.surface : c.primary,
                    color: chatLoading || !chatMessage.trim() ? c.textMuted : "#000",
                  }}
                >
                  <Send className="w-3 h-3" /> Send
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Make it shorter", "More professional", "Optimize for Google", "Highlight projects", "Mention leadership", "Rewrite introduction"].map(hint => (
                  <button
                    key={hint}
                    onClick={() => { setChatMessage(hint); }}
                    className="px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                    style={{ background: c.surface, color: c.textMuted, border: `1px solid ${c.border}` }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // =========================================================================
  // RENDER: HISTORY SIDEBAR
  // =========================================================================

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-base font-bold flex items-center gap-2" style={{ color: c.text }}>
        <Zap className="w-5 h-5 text-[#f59e0b]" /> History
      </h2>
      <div className="rounded-2xl p-4 space-y-3 max-h-[500px] overflow-y-auto" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        {history.length === 0 ? (
          <div className="text-center py-12" style={{ color: c.textMuted }}>
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <span className="text-xs font-semibold">No letters yet.</span>
          </div>
        ) : (
          history.map(h => (
            <div
              key={h.id}
              onClick={() => openHistoryItem(h)}
              className="p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
              style={{
                background: coverLetter?.id === h.id ? "rgba(245,158,11,0.08)" : "transparent",
                border: `1px solid ${coverLetter?.id === h.id ? c.primary : "transparent"}`,
              }}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-bold truncate transition-colors" style={{ color: c.text }}>
                  {h.role} @ {h.companyName}
                </div>
                <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: c.textMuted }}>
                  <Calendar className="w-3 h-3" />
                  {new Date(h.createdAt).toLocaleDateString()}
                  <span className="mx-1">·</span>
                  {h.tone}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(h.id, e)}
                className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ color: c.textMuted }}
              >
                <Trash2 className="w-4 h-4 hover:text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("resume-hub")}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif", color: c.text }}>
            Cover Letter Generator
          </h1>
          <p className="text-xs" style={{ color: c.textSec }}>
            Personalized, ATS-friendly cover letters from your resume.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl p-6" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            {screen === "select" && renderSelectResume()}
            {screen === "job" && renderJobDetails()}
            {screen === "generating" && renderGenerating()}
            {screen === "editor" && renderEditor()}
          </div>
        </div>

        {/* Right: History */}
        <div className="lg:col-span-5">
          {renderHistory()}
        </div>
      </div>
    </div>
  );
}
