"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import {
  ArrowLeft, FileText, Upload, Sparkles, RefreshCw, Check, Copy, Download,
  Send, Trash2, Calendar, ChevronRight, ChevronLeft,
  Zap, Eye, Edit3, Briefcase, Building2
} from "lucide-react";
import type { ResumeHubViewType } from "@/types/resume";
import { useConfirm } from "@/components/ui/ConfirmModal";

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
    text: isDark ? "#e5e7eb" : "#0f172a", textSec: isDark ? "#9ca3af" : "#475569", textMuted: isDark ? "#6b7280" : "#94a3b8",
    bg: isDark ? "rgba(255,255,255,0.025)" : "#ffffff", bgHover: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", surfaceHover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", borderHover: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)",
    borderFocus: isDark ? "rgba(245,158,11,0.45)" : "rgba(245,158,11,0.5)", inputBg: isDark ? "rgba(0,0,0,0.35)" : "#f1f5f9",
    cardBg: isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
    amber: "#f59e0b", amberBg: isDark ? "rgba(245,158,11,0.07)" : "rgba(245,158,11,0.08)", amberBorder: isDark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.25)",
    green: "#10b981", greenBg: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
    red: "#ef4444",
    divider: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    pill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", pillBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };
};

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) };
const scaleIn = { hidden: { opacity: 0, scale: 0.92 }, visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }) };

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Startup", "Other"];
const ROLES = ["Machine Learning Engineer", "Software Engineer", "Data Scientist", "Frontend Developer"];
const LETTER_TYPES = ["Internship", "Full-Time", "Referral", "Career Switch", "General Application"];
const TONES = ["Professional", "Friendly", "Formal", "Confident", "Creative"];

const GENERATING_STEPS = ["Reading Resume", "Analyzing Job Description", "Understanding Company", "Writing Personalized Letter"];

interface CoverLetterViewProps {
  setView: (v: ResumeHubViewType) => void;
}

export function CoverLetterView({ setView }: CoverLetterViewProps) {
  const theme = useTheme();
  const c = mkColors(theme);

  const [confirm, confirmModal] = useConfirm();

  const [screen, setScreen] = useState<"select" | "job" | "generating" | "editor">("select");
  const [resumes, setResumes] = useState<ResumeBrief[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyCustom, setCompanyCustom] = useState("");
  const [role, setRole] = useState("");
  const [roleCustom, setRoleCustom] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [letterType, setLetterType] = useState("Full-Time");
  const [tone, setTone] = useState("Professional");
  const [coverLetter, setCoverLetter] = useState<CoverLetterItem | null>(null);
  const [greeting, setGreeting] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [body, setBody] = useState("");
  const [closing, setClosing] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState<CoverLetterItem[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const loadResumes = async () => {
    try {
      const res = await api.get("/resume/list");
      setResumes(res.data.resumes || []);
    } catch (err) { console.error(err); }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/cover-letter/history");
      setHistory(res.data.coverLetters || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadResumes(); loadHistory(); }, []);

  const startGeneration = async () => {
    setLoading(true);
    setLoadingStep(0);
    setScreen("generating");
    const stepInterval = setInterval(() => setLoadingStep(prev => Math.min(prev + 1, GENERATING_STEPS.length - 1)), 1200);
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
    } finally { setLoading(false); }
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim() || !coverLetter) return;
    setChatLoading(true);
    try {
      const res = await api.post("/cover-letter/chat", { coverLetterId: coverLetter.id, message: chatMessage });
      if (res.data.success && res.data.coverLetter) {
        const cl = res.data.coverLetter;
        setCoverLetter(cl);
        setGreeting(cl.greeting || "");
        setIntroduction(cl.introduction || "");
        setBody(cl.body || "");
        setClosing(cl.closing || "");
      }
    } catch (err) { console.error(err); alert("Failed to refine letter."); }
    finally { setChatLoading(false); setChatMessage(""); }
  };

  const handleSave = async () => {
    if (!coverLetter) return;
    try {
      const res = await api.post("/cover-letter/save", { coverLetterId: coverLetter.id, greeting, introduction, body, closing });
      if (res.data.success) { setCoverLetter(res.data.coverLetter); alert("Cover letter saved!"); }
    } catch (err) { console.error(err); alert("Failed to save."); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirm("Delete this cover letter?", { danger: true, confirmLabel: "Delete" }))) return;
    try { await api.delete(`/cover-letter/${id}`); setHistory(prev => prev.filter(item => item.id !== id)); }
    catch (err) { console.error(err); }
  };

  const handleCopy = () => {
    const text = [greeting, introduction, body, closing].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleGenerateAgain = () => { setCoverLetter(null); setScreen("job"); };

  const handleRegenerateSection = async (field: string) => {
    if (!coverLetter) return;
    setChatLoading(true);
    const messages: Record<string, string> = {
      greeting: "Improve the greeting to be more engaging",
      introduction: "Improve the introduction to be more compelling",
      body: "Improve the body to highlight more achievements",
      closing: "Improve the closing to be more impactful",
    };
    try {
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
    } catch (err) { console.error(err); }
    finally { setChatLoading(false); }
  };

  const fullLetterText = [greeting, introduction, body, closing].filter(Boolean).join("\n\n");

  const renderSelectResume = () => (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-xl mx-auto space-y-6">
      <h2 className="text-lg font-extrabold text-center" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
        Select Resume
      </h2>
      <p className="text-xs text-center" style={{ color: c.textSec }}>
        Choose a saved resume or upload a new one.
      </p>
      {resumes.length > 0 && (
        <div className="space-y-2">
          {resumes.map((r, i) => (
            <motion.button
              variants={fadeUp} custom={i} whileHover={{ y: -4, scale: 1.01 }}
              key={r.id}
              onClick={() => { setSelectedResumeId(r.id); setUploadFile(null); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{
                background: selectedResumeId === r.id ? c.amberBg : c.surface,
                border: `1px solid ${selectedResumeId === r.id ? c.amber : c.border}`,
                color: c.text,
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.amberBg }}>
                <FileText size={16} style={{ color: c.amber }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{r.title}</div>
                <div className="text-[10px]" style={{ color: c.textMuted }}>{r.template} template</div>
              </div>
              {selectedResumeId === r.id && <Check size={16} style={{ color: c.amber }} />}
            </motion.button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: c.divider }} />
        <span className="text-xs font-semibold" style={{ color: c.textMuted }}>OR</span>
        <div className="flex-1 h-px" style={{ background: c.divider }} />
      </div>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        onClick={() => fileInputRef.current?.click()}
        className="p-6 rounded-xl text-center cursor-pointer transition-all"
        style={{ background: uploadFile ? c.amberBg : c.surface, border: `1px dashed ${uploadFile ? c.amber : c.border}` }}
      >
        <Upload size={32} className="mx-auto mb-2" style={{ color: uploadFile ? c.amber : c.textMuted }} />
        <p className="text-xs font-bold" style={{ color: uploadFile ? c.amber : c.textSec }}>
          {uploadFile ? uploadFile.name : "Upload PDF / DOCX"}
        </p>
      </motion.div>
      <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadFile(f); setSelectedResumeId(null); } }}
      />
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        disabled={!selectedResumeId && !uploadFile}
        onClick={() => setScreen("job")}
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          background: !selectedResumeId && !uploadFile ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: !selectedResumeId && !uploadFile ? c.textMuted : "#000",
        }}
      >
        Continue <ChevronRight size={16} />
      </motion.button>
    </motion.div>
  );

  const renderJobDetails = () => (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-xl mx-auto space-y-5">
      <h2 className="text-lg font-extrabold text-center" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
        Job Information
      </h2>
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Company</label>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIES.map((cn, i) => (
            <motion.button
              variants={fadeUp} custom={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              key={cn} type="button"
              onClick={() => { setCompanyName(cn); if (cn !== "Other") setCompanyCustom(""); }}
              className="py-2 text-xs font-bold rounded-lg border transition-all"
              style={{
                background: companyName === cn ? c.amberBg : c.surface,
                borderColor: companyName === cn ? c.amber : c.border,
                color: companyName === cn ? c.amber : c.textSec,
              }}
            >
              {cn}
            </motion.button>
          ))}
        </div>
        {companyName === "Other" && (
          <input type="text" value={companyCustom} onChange={e => setCompanyCustom(e.target.value)}
            placeholder="Enter company name" className="w-full mt-2 border rounded-lg p-2.5 text-xs focus:outline-none"
            style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
          />
        )}
      </div>
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Job Role</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r, i) => (
            <motion.button
              variants={fadeUp} custom={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              key={r} type="button"
              onClick={() => { setRole(r); setRoleCustom(""); }}
              className="py-2 text-xs font-bold rounded-lg border transition-all"
              style={{
                background: role === r ? c.amberBg : c.surface,
                borderColor: role === r ? c.amber : c.border,
                color: role === r ? c.amber : c.textSec,
              }}
            >
              {r}
            </motion.button>
          ))}
        </div>
        <input type="text" value={roleCustom} onChange={e => { setRoleCustom(e.target.value); setRole(""); }}
          placeholder="Or type a custom role..." className="w-full mt-2 border rounded-lg p-2.5 text-xs focus:outline-none"
          style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>
          Job Description <span className="font-normal lowercase" style={{ color: c.textMuted }}>(optional)</span>
        </label>
        <textarea rows={3} value={jobDescription} onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste job description..." className="w-full border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
          style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
        />
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => jdFileInputRef.current?.click()}
          className="mt-1.5 text-[10px] font-semibold flex items-center gap-1.5"
          style={{ color: c.amber }}
        >
          <Upload size={12} /> Upload PDF instead
        </motion.button>
        <input ref={jdFileInputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setJdFile(f); }}
        />
        {jdFile && (
          <div className="mt-1 text-[10px] font-semibold" style={{ color: c.green }}>
            <Check size={12} className="inline mr-1" /> {jdFile.name}
          </div>
        )}
      </div>
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Cover Letter Type</label>
        <div className="grid grid-cols-3 gap-2">
          {LETTER_TYPES.map((lt, i) => (
            <motion.button
              variants={fadeUp} custom={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              key={lt} type="button" onClick={() => setLetterType(lt)}
              className="py-2 text-xs font-bold rounded-lg border transition-all"
              style={{
                background: letterType === lt ? c.amberBg : c.surface,
                borderColor: letterType === lt ? c.amber : c.border,
                color: letterType === lt ? c.amber : c.textSec,
              }}
            >
              {lt}
            </motion.button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase font-semibold mb-2" style={{ color: c.textSec }}>Tone</label>
        <div className="grid grid-cols-5 gap-2">
          {TONES.map((t, i) => (
            <motion.button
              variants={fadeUp} custom={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              key={t} type="button" onClick={() => setTone(t)}
              className="py-2 text-xs font-bold rounded-lg border transition-all"
              style={{
                background: tone === t ? c.amberBg : c.surface,
                borderColor: tone === t ? c.amber : c.border,
                color: tone === t ? c.amber : c.textSec,
              }}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setScreen("select")}
          className="flex-1 py-3 rounded-xl font-bold text-sm"
          style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
        >
          <ChevronLeft size={16} className="inline mr-1" /> Back
        </motion.button>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          disabled={!companyName && !companyCustom} onClick={startGeneration}
          className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{
            background: !companyName && !companyCustom ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: !companyName && !companyCustom ? c.textMuted : "#000",
          }}
        >
          <Sparkles size={16} /> Generate
        </motion.button>
      </div>
    </motion.div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-md">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: c.amberBg }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Sparkles size={32} style={{ color: c.amber }} />
          </motion.div>
        </div>
        <h2 className="text-xl font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
          Generating Cover Letter
        </h2>
        <div className="space-y-3">
          {GENERATING_STEPS.map((step, i) => (
            <motion.div
              key={step}
              className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ background: loadingStep >= i ? c.amberBg : "transparent", color: loadingStep >= i ? c.amber : c.textMuted }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: loadingStep > i ? c.green : loadingStep === i ? c.amberBg : c.surface,
                  color: loadingStep > i ? "#fff" : loadingStep === i ? c.amber : c.textMuted,
                }}
              >
                {loadingStep > i ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-sm font-bold">{step}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setScreen("select")}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
          >
            <ArrowLeft size={16} />
          </motion.button>
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
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setChatOpen(!chatOpen)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
            style={{
              background: chatOpen ? c.amberBg : c.surface,
              color: chatOpen ? c.amber : c.text,
              border: `1px solid ${chatOpen ? c.amber : c.border}`,
            }}
          >
            <Edit3 size={12} /> AI Chat
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
            style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
          >
            <Check size={12} /> Save
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
            style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
          >
            {copied ? <Check size={12} style={{ color: c.green }} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Greeting</label>
            <div className="flex gap-2">
              <input value={greeting} onChange={e => setGreeting(e.target.value)}
                className="flex-1 border rounded-lg p-2.5 text-xs focus:outline-none"
                style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
              />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleRegenerateSection("greeting")}
                className="px-2 rounded-lg text-[10px] font-bold"
                style={{ background: c.surface, color: c.amber, border: `1px solid ${c.border}` }}
              >
                <RefreshCw size={12} className={chatLoading ? "animate-spin" : ""} />
              </motion.button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Introduction</label>
            <div className="flex gap-2">
              <textarea rows={3} value={introduction} onChange={e => setIntroduction(e.target.value)}
                className="flex-1 border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
                style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
              />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleRegenerateSection("introduction")}
                className="px-2 rounded-lg text-[10px] font-bold self-start"
                style={{ background: c.surface, color: c.amber, border: `1px solid ${c.border}` }}
              >
                <RefreshCw size={12} className={chatLoading ? "animate-spin" : ""} />
              </motion.button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Body</label>
            <div className="flex gap-2">
              <textarea rows={5} value={body} onChange={e => setBody(e.target.value)}
                className="flex-1 border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
                style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
              />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleRegenerateSection("body")}
                className="px-2 rounded-lg text-[10px] font-bold self-start"
                style={{ background: c.surface, color: c.amber, border: `1px solid ${c.border}` }}
              >
                <RefreshCw size={12} className={chatLoading ? "animate-spin" : ""} />
              </motion.button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: c.textSec }}>Closing</label>
            <div className="flex gap-2">
              <textarea rows={2} value={closing} onChange={e => setClosing(e.target.value)}
                className="flex-1 border rounded-lg p-2.5 text-xs resize-none focus:outline-none"
                style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
              />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleRegenerateSection("closing")}
                className="px-2 rounded-lg text-[10px] font-bold self-start"
                style={{ background: c.surface, color: c.amber, border: `1px solid ${c.border}` }}
              >
                <RefreshCw size={12} className={chatLoading ? "animate-spin" : ""} />
              </motion.button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {["Make it shorter", "More professional", "Optimize for Company", "Highlight projects", "Rewrite introduction", "Improve closing"].map((action, i) => (
              <motion.button
                key={action} variants={fadeUp} custom={i}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                disabled={chatLoading}
                onClick={async () => {
                  if (!coverLetter) return;
                  setChatLoading(true);
                  try {
                    const res = await api.post("/cover-letter/chat", { coverLetterId: coverLetter.id, message: action });
                    if (res.data.success && res.data.coverLetter) {
                      const cl = res.data.coverLetter;
                      setCoverLetter(cl); setGreeting(cl.greeting || ""); setIntroduction(cl.introduction || "");
                      setBody(cl.body || ""); setClosing(cl.closing || "");
                    }
                  } catch (err) { console.error(err); }
                  finally { setChatLoading(false); }
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                style={{ background: c.surface, color: c.textSec, border: `1px solid ${c.border}` }}
              >
                {action}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleGenerateAgain}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
            >
              <RefreshCw size={12} /> Generate Again
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setScreen("select")}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
            >
              <Download size={12} /> Export
            </motion.button>
          </div>
        </div>

        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} style={{ color: c.amber }} />
            <span className="text-xs font-bold uppercase" style={{ color: c.textSec }}>Live Preview</span>
          </div>
          <motion.div
            variants={scaleIn}
            className="rounded-xl p-5 min-h-[400px] whitespace-pre-wrap text-sm leading-relaxed"
            style={{
              background: theme === "dark" ? "#0a0e14" : "#ffffff",
              border: `1px solid ${c.border}`,
              color: c.text,
              fontFamily: "'Georgia', serif",
            }}
          >
            {fullLetterText || "Your cover letter will appear here..."}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl p-4" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <div className="flex gap-2">
                <input value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChatSend()}
                  placeholder="Ask AI to refine your letter..."
                  className="flex-1 border rounded-lg p-2.5 text-xs focus:outline-none"
                  style={{ background: c.inputBg, borderColor: c.border, color: c.text }}
                />
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleChatSend} disabled={chatLoading || !chatMessage.trim()}
                  className="px-4 rounded-lg font-bold text-xs flex items-center gap-1.5"
                  style={{
                    background: chatLoading || !chatMessage.trim() ? c.surface : c.amber,
                    color: chatLoading || !chatMessage.trim() ? c.textMuted : "#000",
                  }}
                >
                  <Send size={12} /> Send
                </motion.button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Make it shorter", "More professional", "Optimize for Google", "Highlight projects", "Mention leadership", "Rewrite introduction"].map((hint, i) => (
                  <motion.button
                    key={hint} variants={fadeUp} custom={i}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setChatMessage(hint)}
                    className="px-2 py-1 rounded text-[10px] font-semibold"
                    style={{ background: c.surface, color: c.textMuted, border: `1px solid ${c.border}` }}
                  >
                    {hint}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
        <Zap size={16} style={{ color: c.amber }} /> History
      </h2>
      <div className="rounded-2xl p-4 space-y-3 max-h-[500px] overflow-y-auto" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        {history.length === 0 ? (
          <div className="text-center py-12" style={{ color: c.textMuted }}>
            <FileText size={40} className="mx-auto mb-2" style={{ opacity: 0.5 }} />
            <span className="text-xs font-semibold">No letters yet.</span>
          </div>
        ) : (
          history.map((h, i) => (
            <motion.div
              key={h.id} variants={fadeUp} custom={i}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => openHistoryItem(h)}
              className="p-3 rounded-xl flex items-center justify-between cursor-pointer group"
              style={{
                background: coverLetter?.id === h.id ? c.amberBg : "transparent",
                border: `1px solid ${coverLetter?.id === h.id ? c.amber : "transparent"}`,
              }}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-bold truncate" style={{ color: c.text }}>
                  {h.role} @ {h.companyName}
                </div>
                <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: c.textMuted }}>
                  <Calendar size={10} /> {new Date(h.createdAt).toLocaleDateString()}
                  <span className="mx-1">·</span> {h.tone}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={(e) => handleDelete(h.id, e)}
                className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ color: c.textMuted }}
              >
                <Trash2 size={14} className="hover:text-red-500" />
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex flex-col antialiased h-full" style={{ color: c.text }}>
      <div className="flex-shrink-0 flex items-center gap-2.5 pb-3 mb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <motion.button onClick={() => setView("resume-hub")} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}>
          <ArrowLeft size={15} />
        </motion.button>
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
          <FileText size={18} style={{ color: "#000" }} />
        </motion.div>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            className="text-base font-extrabold leading-tight" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
            Cover Letter Generator
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-xs leading-tight" style={{ color: c.textMuted }}>
            Personalized, ATS-friendly cover letters from your resume.
          </motion.p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="rounded-2xl p-6" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              {screen === "select" && renderSelectResume()}
              {screen === "job" && renderJobDetails()}
              {screen === "generating" && renderGenerating()}
              {screen === "editor" && renderEditor()}
            </motion.div>
          </div>
          <div className="lg:col-span-5">
            {renderHistory()}
          </div>
        </div>
      </div>
      {confirmModal}
    </motion.div>
  );
}
