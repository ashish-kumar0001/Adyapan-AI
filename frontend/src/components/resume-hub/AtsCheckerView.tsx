"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { api } from "@/services/api";
import type { ResumeHubViewType } from "@/types/resume";
import {
  ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  Star, Sparkles, RefreshCw, MessageCircle, Send, X, ChevronRight,
  Download, Save, Eye, RotateCcw, Target, BarChart3, Search,
  BookOpen, Code2, Briefcase, GraduationCap, Award, Link2,
  Sun, Moon, Zap, FileCheck2, Plus, Lightbulb,
  History, GitCompare, Users, Shield, TrendingUp, TrendingDown,
  AlertCircle, CheckSquare, CircleDot, ChevronDown, ChevronUp,
  PieChart, Activity, Brain, Eye as EyeIcon, FileSearch,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { EmptyState } from "@/components/ui/PremiumComponents";

// ─── Chart.js ──────────────────────────────────────────────────────────────
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Radar, Bar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler,
  ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement
);

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

interface ATSIntelligence {
  recruiterView: {
    firstImpression: string;
    topStrengths: string[];
    redFlags: string[];
    interviewWorthy: boolean;
    hiringDecision: string;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    risks: string[];
    opportunities: string[];
  };
  missingSections: Array<{
    section: string;
    importance: "critical" | "important" | "nice-to-have";
    reason: string;
  }>;
  structureAnalysis: {
    isAtsCompatible: boolean;
    issues: Array<{ issue: string; severity: "high" | "medium" | "low"; fix: string }>;
    overallFormat: string;
  };
  detailedAnalysis: {
    contactInfo: { present: boolean; score: number; notes: string[] };
    summary: { present: boolean; score: number; quality: string; notes: string[] };
    skills: { present: boolean; score: number; count: number; notes: string[] };
    projects: { present: boolean; score: number; count: number; quality: string; notes: string[] };
    experience: { present: boolean; score: number; count: number; notes: string[] };
    education: { present: boolean; score: number; notes: string[] };
    certifications: { present: boolean; score: number; count: number; notes: string[] };
    achievements: { present: boolean; score: number; count: number; notes: string[] };
    links: { present: boolean; score: number; notes: string[] };
  };
  readabilityAnalysis: {
    overallGrade: string;
    sentenceLength: string;
    bulletUsage: string;
    formattingConsistency: string;
    scanningEase: string;
    recruiterFriendliness: string;
  };
  improvementRecommendations: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    impact: string;
  }>;
  jobTargetAnalysis?: {
    role: string;
    matchScore: number;
    alignedSkills: string[];
    gapSkills: string[];
    roleSpecificAdvice: string[];
  };
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

interface ATSReportBrief {
  id: string;
  score: number;
  createdAt: string;
  resume?: { title: string };
}

interface AtsCheckerViewProps {
  setView: (v: ResumeHubViewType) => void;
}

// ─── Theme Colors ──────────────────────────────────────────────────────────────

const mkColors = (theme: string) => {
  const isDark = theme === "dark";
  return {
    isDark,
    text: isDark ? "#e5e7eb" : "#0f172a", textSec: isDark ? "#9ca3af" : "#475569", textMuted: isDark ? "#828fa3" : "#5f6368",
    bg: isDark ? "rgba(255,255,255,0.025)" : "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 40%, #e8edf5 100%)",
    bgHover: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", surfaceHover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", borderHover: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)",
    borderFocus: isDark ? "rgba(245,158,11,0.45)" : "rgba(245,158,11,0.5)", inputBg: isDark ? "rgba(0,0,0,0.35)" : "#f1f5f9",
    cardBg: isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.85)",
    cardShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    amber: "#f59e0b", amberBg: isDark ? "rgba(245,158,11,0.07)" : "rgba(245,158,11,0.08)", amberBorder: isDark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.25)",
    green: "#10b981", greenBg: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
    red: "#ef4444", redBg: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
    blue: "#3b82f6", blueBg: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
    purple: "#8b5cf6", purpleBg: isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.08)",
    chatBg: isDark ? "#0a0e14" : "#f8fafc",
    divider: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    pill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", pillBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };
};

// ─── Animated CountUp ──────────────────────────────────────────────────────────

function CountUp({ end, duration = 1.5, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, end, { duration, ease: "easeOut" });
    const unsub = rounded.on("change", v => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [end, duration, count, rounded]);

  return <>{display}{suffix}</>;
}

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

function ScoreRing({ score, size = 144, strokeWidth = 8, color }: { score: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = color || (score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444");

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-black/5 dark:text-white/5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="transparent"
          stroke={ringColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          <CountUp end={score} duration={1.5} />
        </span>
        <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--text-muted)" }}>ATS Score</span>
      </div>
    </div>
  );
}

const TARGET_ROLES = [
  "Software Engineer", "Full Stack Developer", "Frontend Developer",
  "Backend Developer", "Data Analyst", "Data Scientist", "AI Engineer",
  "DevOps Engineer", "Cloud Engineer", "Product Manager",
];

// ===============================================================================
// MAIN COMPONENT
// ===============================================================================

export function AtsCheckerView({ setView }: AtsCheckerViewProps) {
  const theme = useTheme();
  const c = mkColors(theme);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.4, delay: custom * 0.08, ease: "easeOut" as const },
    }),
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (custom: number = 0) => ({
      opacity: 1, scale: 1,
      transition: { duration: 0.3, delay: custom * 0.08, ease: "easeOut" as const },
    }),
  };

  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };

  const cardHover = { y: -4, scale: 1.01 };
  const buttonHover = { scale: 1.04 };
  const buttonTap = { scale: 0.96 };

  const springIcon = {
    hidden: { scale: 0, rotate: -20 },
    visible: { scale: 1, rotate: 0, transition: { type: "spring" as const, stiffness: 200, damping: 12 } },
  };

  // Screen state
  const [screen, setScreen] = useState<"home" | "jd" | "loading" | "dashboard" | "intelligence" | "suggestions" | "final" | "history" | "compare">("home");
  const [activeTab, setActiveTab] = useState<"overview" | "sections" | "keywords" | "recruiter" | "insights" | "improvements">("overview");
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
  const [analysisRaw, setAnalysisRaw] = useState<ATSDeepAnalysis | null>(null);
  const [intelligence, setIntelligence] = useState<ATSIntelligence | null>(null);
  const [suggestions, setSuggestions] = useState<ATSSuggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [updatedScore, setUpdatedScore] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState<ATSReportBrief[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [compareResult, setCompareResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    "Uploading Resume", "Extracting Text", "Evaluating ATS Structure",
    "Analyzing Keywords", "Checking Sections", "Reviewing Formatting",
    "Generating Insights", "Preparing Recommendations",
  ];

  // Load resumes list
  useEffect(() => {
    api.get("/resume/list").then(res => {
      setResumes(res.data.resumes || []);
    }).catch(() => {});
  }, []);

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

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, loadingSteps.length - 1));
    }, 700);

    try {
      const fd = new FormData();
      if (file) fd.append("resume", file);
      if (selectedResumeId) fd.append("resumeId", selectedResumeId);
      fd.append("targetRole", targetRole);
      if (includeJD === "yes") {
        if (jdFile) fd.append("jobDescription", await jdFile.text());
        else if (jobDescription) fd.append("jobDescription", jobDescription);
      }

      // Run both analyses in parallel
      const [atsRes, intelRes] = await Promise.allSettled([
        api.post("/ats/analyze", fd, { headers: { "Content-Type": "multipart/form-data" } }),
        api.post("/ats/intelligence", fd, { headers: { "Content-Type": "multipart/form-data" } }),
      ]);

      clearInterval(stepInterval);
      setLoadingStep(loadingSteps.length - 1);

      if (atsRes.status === "fulfilled" && atsRes.value.data.analysis) {
        setAnalysis(atsRes.value.data.analysis);
        setAnalysisRaw(atsRes.value.data.analysis);
        setUpdatedScore(atsRes.value.data.analysis.score);
      }
      if (intelRes.status === "fulfilled" && intelRes.value.data.intelligence) {
        setIntelligence(intelRes.value.data.intelligence);
      }

      await new Promise(r => setTimeout(r, 600));
      setScreen("dashboard");

      // Generate suggestions in background
      if (atsRes.status === "fulfilled") {
        generateSuggestions(atsRes.value.data.analysis);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      const msg = err instanceof Error ? err.message : "Please try again.";
      alert(`Failed to analyze resume. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async (analysisData?: ATSDeepAnalysis) => {
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
    } catch (err) { console.error(err); }
  };

  const handleUndoSuggestion = (id: string) => {
    setAppliedSuggestions(prev => { const next = new Set(prev); next.delete(id); return next; });
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
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── History ─────────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/ats/history");
      setHistory(res.data.reports || []);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }, []);

  // ─── Compare ─────────────────────────────────────────────────────────────────

  const runCompare = async () => {
    if (!compareA || !compareB) return;
    setCompareLoading(true);
    try {
      const res = await api.post("/ats/compare", {
        resumeIdA: compareA, resumeIdB: compareB, targetRole,
      });
      setCompareResult(res.data.comparison);
    } catch { /* ignore */ }
    finally { setCompareLoading(false); }
  };

  // ─── Score helpers ──────────────────────────────────────────────────────────

  const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
  const scoreBg = (s: number) => s >= 80 ? "rgba(16,185,129,0.1)" : s >= 60 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
  const scoreLabel = (s: number) => s >= 90 ? "Excellent" : s >= 80 ? "Very Good" : s >= 65 ? "Good" : s >= 50 ? "Fair" : "Poor";

  // ─── Chart Data ─────────────────────────────────────────────────────────────

  const radarData = analysis ? {
    labels: ["Summary", "Skills", "Experience", "Projects", "Education"],
    datasets: [{
      label: "Section Scores",
      data: [
        analysis.sectionScores.summary.score * 10,
        analysis.sectionScores.skills.score * 10,
        analysis.sectionScores.experience.score * 10,
        analysis.sectionScores.projects.score * 10,
        analysis.sectionScores.education.score * 10,
      ],
      backgroundColor: "rgba(245,158,11,0.15)",
      borderColor: "#f59e0b",
      borderWidth: 2,
      pointBackgroundColor: "#f59e0b",
      pointBorderColor: "#f59e0b",
      pointRadius: 4,
    }],
  } : null;

  const barData = analysis ? {
    labels: ["Found", "Missing"],
    datasets: [{
      label: "Keywords",
      data: [analysis.keywordAnalysis.found.length, analysis.keywordAnalysis.missing.length],
      backgroundColor: ["rgba(16,185,129,0.7)", "rgba(239,68,68,0.7)"],
      borderColor: ["#10b981", "#ef4444"],
      borderWidth: 1,
      borderRadius: 6,
    }],
  } : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false, stepSize: 20 },
        grid: { color: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
        pointLabels: {
          color: theme === "dark" ? "#9ca3af" : "#475569",
          font: { size: 11, weight: "600" as const },
        },
        angleLines: { color: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: theme === "dark" ? "#9ca3af" : "#475569", font: { size: 11 } }, grid: { color: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" } },
      x: { ticks: { color: theme === "dark" ? "#9ca3af" : "#475569", font: { size: 11, weight: "600" as const } }, grid: { display: false } },
    },
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex flex-col antialiased min-h-[calc(100vh-120px)]" style={{ color: c.text, background: c.bg, backgroundAttachment: "fixed", "--card-shadow": c.cardShadow } as React.CSSProperties}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-5 pt-3 pb-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
        {screen !== "home" && (
          <motion.button
            whileHover={buttonHover} whileTap={buttonTap}
            onClick={() => {
              if (screen === "intelligence") setScreen("dashboard");
              else if (screen === "history" || screen === "compare") setScreen("home");
              else setScreen("home");
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
          >
            <ArrowLeft size={15} />
          </motion.button>
        )}
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
          <BarChart3 size={18} style={{ color: "#000" }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <motion.h1 key={screen} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            className="text-base font-extrabold leading-tight" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
            {screen === "home" ? "ATS Intelligence Engine" :
             screen === "jd" ? "Job Description" :
             screen === "loading" ? "Analyzing Resume" :
             screen === "dashboard" ? "ATS Dashboard" :
             screen === "intelligence" ? "Deep Intelligence" :
             screen === "suggestions" ? "AI Suggestions" :
             screen === "history" ? "Analysis History" :
             screen === "compare" ? "Resume Comparison" :
             "Resume Improved"}
          </motion.h1>
          <motion.p key={`p-${screen}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-xs leading-tight" style={{ color: c.textMuted }}>
            {screen === "home" ? "Analyze your resume like a real ATS system" :
             screen === "jd" ? "Compare against a job description for targeted analysis" :
             screen === "loading" ? "Running comprehensive ATS intelligence analysis..." :
             screen === "dashboard" ? "Detailed ATS audit with recruiter insights" :
             screen === "intelligence" ? "Recruiter perspective, missing sections, and structure analysis" :
             screen === "suggestions" ? "AI-powered improvements ranked by impact" :
             screen === "history" ? "Your past ATS analysis reports" :
             screen === "compare" ? "Compare two resume versions side by side" :
             "Your resume has been improved"}
          </motion.p>
        </div>
        {screen === "home" && (
          <div className="flex gap-1.5 shrink-0">
            <motion.button
              whileHover={buttonHover} whileTap={buttonTap}
              onClick={() => { setScreen("history"); loadHistory(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}
              title="History"
            >
              <History size={14} />
            </motion.button>
            <motion.button
              whileHover={buttonHover} whileTap={buttonTap}
              onClick={() => setScreen("compare")}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}
              title="Compare Resumes"
            >
              <GitCompare size={14} />
            </motion.button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ paddingRight: 20 }}>
      <AnimatePresence mode="wait">

        {/* ─────── SCREEN: HOME ─────── */}
        {screen === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
            {/* Target Role */}
            <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textSec }}>Target Job Role</label>
              <div className="relative">
                <select
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full p-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                  style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
                >
                  {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.textMuted }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
              {resumes.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>
                    <FileText size={16} className="inline mr-2" style={{ color: c.amber }} />Choose Existing Resume
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {resumes.map(r => (
                      <motion.button key={r.id} whileHover={cardHover} whileTap={{ scale: 0.99 }}
                        onClick={() => { setSelectedResumeId(r.id); setFile(null); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: selectedResumeId === r.id ? "rgba(245,158,11,0.1)" : c.surface,
                          border: `1px solid ${selectedResumeId === r.id ? "rgba(245,158,11,0.3)" : c.border}`,
                          color: c.text,
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
                          <FileText size={14} style={{ color: c.amber }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{r.title}</div>
                          <div className="text-[10px]" style={{ color: c.textMuted }}>{r.template} · {new Date(r.updatedAt).toLocaleDateString()}</div>
                        </div>
                        {selectedResumeId === r.id && <CheckCircle size={16} style={{ color: c.amber }} />}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: c.text }}>
                  <Upload size={16} className="inline mr-2" style={{ color: c.amber }} />Upload Resume
                </h3>
                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{ borderColor: dragging ? c.amber : c.border, background: dragging ? "rgba(245,158,11,0.05)" : c.surface }}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                  {file ? (
                    <div className="space-y-2">
                      <motion.span variants={springIcon} initial="hidden" animate="visible"><FileText size={32} className="mx-auto" style={{ color: c.amber }} /></motion.span>
                      <p className="text-sm font-bold" style={{ color: c.text }}>{file.name}</p>
                      <p className="text-xs" style={{ color: c.textMuted }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <motion.button whileHover={buttonHover} whileTap={buttonTap}
                        onClick={e => { e.stopPropagation(); setFile(null); setSelectedResumeId(""); }}
                        className="text-xs font-bold mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                      ><X size={12} /> Remove</motion.button>
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

            <motion.button
              whileHover={buttonHover} whileTap={buttonTap}
              disabled={!file && !selectedResumeId}
              onClick={() => setScreen("jd")}
              className="w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
              style={{
                background: !file && !selectedResumeId ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
                color: !file && !selectedResumeId ? c.textMuted : "#000",
                border: !file && !selectedResumeId ? `1px solid ${c.border}` : "none",
              }}
            >
              <Zap size={14} /> Continue to Analysis <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {/* ─────── SCREEN: JOB DESCRIPTION ─────── */}
        {screen === "jd" && (
          <motion.div key="jd" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="p-6 rounded-2xl text-center" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
              <motion.span variants={springIcon} initial="hidden" animate="visible"><Target size={40} className="mx-auto mb-4" style={{ color: c.amber }} /></motion.span>
              <h2 className="text-lg font-bold mb-2" style={{ color: c.text }}>Compare with Job Description?</h2>
              <p className="text-sm mb-6" style={{ color: c.textSec }}>Adds targeted keyword matching and role-specific gap analysis.</p>
              <div className="flex gap-3 justify-center">
                <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setIncludeJD("yes")}
                  className="px-6 py-2 rounded-lg font-bold text-xs"
                  style={{ background: includeJD === "yes" ? c.amber : c.surface, color: includeJD === "yes" ? "#000" : c.text, border: `1px solid ${includeJD === "yes" ? c.amber : c.border}` }}
                >Yes, include JD</motion.button>
                <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setIncludeJD("skip")}
                  className="px-6 py-2 rounded-lg font-bold text-xs"
                  style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
                >Skip</motion.button>
              </div>
            </div>

            {includeJD === "yes" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="p-5 rounded-2xl space-y-4" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textSec }}>Paste Job Description</label>
                  <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={6}
                    placeholder="Paste the job description here..."
                    className="w-full p-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
                    onFocus={e => e.currentTarget.style.borderColor = c.amber}
                    onBlur={e => e.currentTarget.style.borderColor = c.border}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: c.border }} />
                  <span className="text-xs font-bold" style={{ color: c.textMuted }}>OR</span>
                  <div className="flex-1 h-px" style={{ background: c.border }} />
                </div>
                <div onClick={() => jdFileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
                  style={{ borderColor: c.border, background: c.surface }}
                >
                  <input ref={jdFileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) setJdFile(e.target.files[0]); }} />
                  {jdFile ? <p className="text-sm font-bold" style={{ color: c.text }}>{jdFile.name}</p> : (
                    <div><Upload size={24} className="mx-auto mb-1" style={{ color: c.textMuted }} /><p className="text-xs" style={{ color: c.textMuted }}>Upload JD file</p></div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("home")}
                className="flex-1 py-2 rounded-lg font-bold text-xs" style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}>Back</motion.button>
              <motion.button whileHover={buttonHover} whileTap={buttonTap} disabled={includeJD === null} onClick={startAnalysis}
                className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{
                  background: includeJD === null ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: includeJD === null ? c.textMuted : "#000",
                  border: includeJD === null ? `1px solid ${c.border}` : "none",
                }}
              ><Zap size={16} /> Analyze Resume</motion.button>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN: LOADING ─────── */}
        {screen === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
            <div className="p-8 rounded-2xl text-center" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ border: `3px solid ${c.border}`, borderTopColor: c.amber }}
              ><BarChart3 size={24} style={{ color: c.amber }} /></motion.div>
              <h2 className="text-lg font-bold mb-6" style={{ color: c.text }}>Analyzing Resume...</h2>
              <div className="space-y-3 text-left">
                {loadingSteps.map((step, i) => (
                  <motion.div key={step} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: i <= loadingStep ? "rgba(245,158,11,0.05)" : "transparent", border: `1px solid ${i <= loadingStep ? "rgba(245,158,11,0.15)" : "transparent"}` }}
                  >
                    {i < loadingStep ? <CheckCircle size={18} style={{ color: c.green }} /> :
                     i === loadingStep ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                       className="w-4 h-4 rounded-full border-2" style={{ borderColor: `${c.amber} transparent ${c.amber} ${c.amber}` }} /> :
                     <div className="w-4 h-4 rounded-full" style={{ background: c.surface, border: `1px solid ${c.border}` }} />}
                    <span className="text-sm" style={{ color: i <= loadingStep ? c.text : c.textMuted, fontWeight: i <= loadingStep ? 600 : 400 }}>{step}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN: DASHBOARD ─────── */}
        {screen === "dashboard" && analysis && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              {[
                { id: "overview", label: "Overview", icon: <BarChart3 size={13} /> },
                { id: "sections", label: "Sections", icon: <FileSearch size={13} /> },
                { id: "keywords", label: "Keywords", icon: <Search size={13} /> },
                { id: "recruiter", label: "Recruiter", icon: <Users size={13} /> },
                { id: "insights", label: "Insights", icon: <Brain size={13} /> },
                { id: "improvements", label: "Fixes", icon: <Lightbulb size={13} /> },
              ].map(tab => (
                <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
                  style={{
                    background: activeTab === tab.id ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                    color: activeTab === tab.id ? "#000" : c.textMuted,
                  }}
                >{tab.icon} {tab.label}</motion.button>
              ))}
            </div>

            {/* ── Tab: Overview ── */}
            {activeTab === "overview" && (
              <motion.div key="tab-overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Score + Charts Row */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Score Gauge */}
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="flex-shrink-0 p-6 rounded-2xl flex flex-col items-center justify-center text-center"
                    style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow, minWidth: 220 }}
                  >
                    <ScoreRing score={analysis.score} />
                    <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2"
                      style={{ background: scoreBg(analysis.score), color: scoreColor(analysis.score) }}
                    >{scoreLabel(analysis.score)}</div>
                    {intelligence?.recruiterView && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: intelligence.recruiterView.interviewWorthy ? c.green : c.red }} />
                        <span className="text-[10px] font-bold" style={{ color: intelligence.recruiterView.interviewWorthy ? c.green : c.red }}>
                          {intelligence.recruiterView.interviewWorthy ? "Interview Worthy" : "Needs Improvement"}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Charts */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
                      className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                    >
                      <h3 className="text-xs font-bold mb-3" style={{ color: c.text }}>Section Scores</h3>
                      <div style={{ height: 200 }}>
                        {radarData && <Radar data={radarData} options={radarOptions} />}
                      </div>
                    </motion.div>
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
                      className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                    >
                      <h3 className="text-xs font-bold mb-3" style={{ color: c.text }}>Keyword Coverage</h3>
                      <div style={{ height: 200 }}>
                        {barData && <Bar data={barData} options={barOptions} />}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <Search size={14} />, label: "Keywords Found", value: String(analysis.keywordsFound.length), color: c.green },
                    { icon: <AlertTriangle size={14} />, label: "Keywords Missing", value: String(analysis.keywordsMissing.length), color: c.red },
                    { icon: <FileCheck2 size={14} />, label: "Readability", value: analysis.readability, color: c.amber },
                    { icon: <BarChart3 size={14} />, label: "Recruiter Score", value: `${analysis.recruiterScore}/10`, color: c.blue },
                  ].map((item, i) => (
                    <motion.div key={item.label} variants={fadeUp} initial="hidden" animate="visible" custom={i} whileHover={cardHover}
                      className="p-3.5 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span style={{ color: item.color }}>{item.icon}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>{item.label}</span>
                      </div>
                      <div className="text-lg font-extrabold" style={{ color: c.text }}>{item.value}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Strength Bars */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-4" style={{ color: c.text }}>Resume Strength</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Summary", value: analysis.strengthBars.summary, color: "#8b5cf6" },
                      { label: "Skills", value: analysis.strengthBars.skills, color: "#3b82f6" },
                      { label: "Experience", value: analysis.strengthBars.experience, color: c.amber },
                      { label: "Projects", value: analysis.strengthBars.projects, color: "#10b981" },
                      { label: "Education", value: analysis.strengthBars.education, color: "#ec4899" },
                    ].map(bar => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-[10px] font-semibold mb-1">
                          <span style={{ color: c.textSec }}>{bar.label}</span>
                          <span style={{ color: bar.color }}>{bar.value}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${bar.value}%` }} transition={{ duration: 1, delay: 0.2 }}
                            className="h-full rounded-full" style={{ background: bar.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Formatting Check */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                    <FileCheck2 size={14} style={{ color: c.amber }} /> ATS Formatting Check
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { label: "One Page", value: analysis.formattingCheck.onePage },
                      { label: "Fonts Consistent", value: analysis.formattingCheck.fontsConsistent },
                      { label: "ATS Friendly", value: analysis.formattingCheck.atsFriendly },
                      { label: "Headings Correct", value: analysis.formattingCheck.headingsCorrect },
                      { label: "Contact Present", value: analysis.formattingCheck.contactPresent },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: c.surface }}>
                        {item.value ? <CheckCircle size={14} style={{ color: c.green }} /> : <XCircle size={14} style={{ color: c.red }} />}
                        <span className="text-[10px] font-semibold" style={{ color: c.text }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("intelligence")}
                    className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))", color: c.purple, border: "1px solid rgba(139,92,246,0.25)" }}
                  ><Brain size={16} /> Deep Intelligence</motion.button>
                  <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("suggestions")}
                    className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
                  ><Sparkles size={16} /> AI Suggestions</motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Tab: Sections ── */}
            {activeTab === "sections" && (
              <motion.div key="tab-sections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "summary", label: "Professional Summary", icon: <BookOpen size={16} />, data: analysis.sectionScores.summary },
                    { key: "skills", label: "Technical Skills", icon: <Code2 size={16} />, data: analysis.sectionScores.skills },
                    { key: "experience", label: "Work Experience", icon: <Briefcase size={16} />, data: analysis.sectionScores.experience },
                    { key: "projects", label: "Projects", icon: <Lightbulb size={16} />, data: analysis.sectionScores.projects },
                    { key: "education", label: "Education", icon: <GraduationCap size={16} />, data: analysis.sectionScores.education },
                  ].map((section, i) => (
                    <motion.div key={section.key} variants={fadeUp} initial="hidden" animate="visible" custom={i} whileHover={cardHover}
                      className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span style={{ color: c.amber }}>{section.icon}</span>
                          <span className="text-xs font-bold" style={{ color: c.text }}>{section.label}</span>
                        </div>
                        <span className="text-sm font-extrabold" style={{ color: scoreColor(section.data.score * 10) }}>{section.data.score}/10</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: c.surface }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${section.data.score * 10}%` }} transition={{ duration: 0.8 }}
                          className="h-full rounded-full" style={{ background: scoreColor(section.data.score * 10) }} />
                      </div>
                      {section.data.suggestions?.map((s, j) => (
                        <div key={j} className="text-[10px] flex items-start gap-1.5 mb-1" style={{ color: c.textSec }}>
                          <span style={{ color: c.amber }}>•</span> {s}
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>

                {/* Detailed Section Analysis from Intelligence */}
                {intelligence?.detailedAnalysis && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
                      <FileSearch size={14} style={{ color: c.amber }} /> Detailed Section Analysis
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(intelligence.detailedAnalysis).map(([key, data]: [string, any]) => (
                        <div key={key} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: c.surface }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: data.present ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}
                          >
                            {data.present ? <CheckCircle size={14} style={{ color: c.green }} /> : <XCircle size={14} style={{ color: c.red }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold capitalize" style={{ color: c.text }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                              <span className="text-[10px] font-bold" style={{ color: scoreColor(data.score * 10) }}>{data.score}/10</span>
                            </div>
                            {data.notes?.slice(0, 2).map((note: string, i: number) => (
                              <div key={i} className="text-[10px] mt-1" style={{ color: c.textSec }}>• {note}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Tab: Keywords ── */}
            {activeTab === "keywords" && (
              <motion.div key="tab-keywords" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* JD Match */}
                {includeJD === "yes" && analysis.keywordAnalysis && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
                      <Target size={16} style={{ color: c.amber }} /> Resume vs Job Description Match
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke={c.border} strokeWidth="6" fill="transparent" />
                          <circle cx="40" cy="40" r="34" stroke={c.amber} strokeWidth="6" fill="transparent"
                            strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - analysis.score / 100)} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-extrabold" style={{ color: c.amber }}>{analysis.score}%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm mb-2" style={{ color: c.text }}>Skill Match</div>
                        <div className="text-[10px] mb-1" style={{ color: c.textSec }}>
                          {analysis.keywordAnalysis.found.length} matched · {analysis.keywordAnalysis.missing.length} missing
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Found Keywords */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                    <CheckCircle size={14} style={{ color: c.green }} /> Found Keywords ({analysis.keywordAnalysis.found.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keywordAnalysis.found.map(kw => (
                      <span key={kw} className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                        style={{ background: "rgba(16,185,129,0.1)", color: c.green, border: "1px solid rgba(16,185,129,0.2)" }}
                      >✓ {kw}</span>
                    ))}
                  </div>
                </motion.div>

                {/* Missing Keywords */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                    <XCircle size={14} style={{ color: c.red }} /> Missing Keywords ({analysis.keywordAnalysis.missing.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keywordAnalysis.missing.map(kw => (
                      <span key={kw} className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                        style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                      >✗ {kw}</span>
                    ))}
                  </div>
                  {analysis.keywordAnalysis.missing.length > 0 && (
                    <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("suggestions")}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                      style={{ background: "rgba(245,158,11,0.1)", color: c.amber, border: "1px solid rgba(245,158,11,0.2)" }}
                    ><Sparkles size={12} /> Add Missing Keywords</motion.button>
                  )}
                </motion.div>

                {/* Job Target Analysis */}
                {intelligence?.jobTargetAnalysis && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <Target size={14} style={{ color: c.amber }} /> {intelligence.jobTargetAnalysis.role} Match
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl font-extrabold" style={{ color: scoreColor(intelligence.jobTargetAnalysis.matchScore) }}>
                        {intelligence.jobTargetAnalysis.matchScore}%
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: c.textSec }}>Role Match Score</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-bold mb-1" style={{ color: c.green }}>Aligned Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {intelligence.jobTargetAnalysis.alignedSkills.map(s => (
                            <span key={s} className="px-1.5 py-0.5 text-[9px] rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: c.green }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold mb-1" style={{ color: c.red }}>Gap Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {intelligence.jobTargetAnalysis.gapSkills.map(s => (
                            <span key={s} className="px-1.5 py-0.5 text-[9px] rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: c.red }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Tab: Recruiter ── */}
            {activeTab === "recruiter" && intelligence?.recruiterView && (
              <motion.div key="tab-recruiter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* First Impression */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                    <EyeIcon size={14} style={{ color: c.amber }} /> First Impression (6-Second Scan)
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{intelligence.recruiterView.firstImpression}</p>
                </motion.div>

                {/* Hiring Decision */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-5 rounded-2xl" style={{
                    background: intelligence.recruiterView.interviewWorthy ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                    border: `1px solid ${intelligence.recruiterView.interviewWorthy ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {intelligence.recruiterView.interviewWorthy ? <CheckSquare size={16} style={{ color: c.green }} /> : <AlertCircle size={16} style={{ color: c.red }} />}
                    <span className="text-xs font-bold" style={{ color: intelligence.recruiterView.interviewWorthy ? c.green : c.red }}>
                      {intelligence.recruiterView.interviewWorthy ? "Interview Worthy" : "Needs Improvement"}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: c.textSec }}>{intelligence.recruiterView.hiringDecision}</p>
                </motion.div>

                {/* Top Strengths */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                    <TrendingUp size={14} style={{ color: c.green }} /> Top Strengths
                  </h3>
                  <div className="space-y-2">
                    {intelligence.recruiterView.topStrengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: c.surface }}>
                        <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: c.green }} />
                        <span className="text-[11px]" style={{ color: c.textSec }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Red Flags */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                  className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                >
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                    <AlertTriangle size={14} style={{ color: c.red }} /> Red Flags
                  </h3>
                  <div className="space-y-2">
                    {intelligence.recruiterView.redFlags.length > 0 ? intelligence.recruiterView.redFlags.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: c.surface }}>
                        <XCircle size={14} className="shrink-0 mt-0.5" style={{ color: c.red }} />
                        <span className="text-[11px]" style={{ color: c.textSec }}>{r}</span>
                      </div>
                    )) : (
                      <div className="text-[11px]" style={{ color: c.green }}>No red flags detected</div>
                    )}
                  </div>
                </motion.div>

                {/* Readability Analysis */}
                {intelligence.readabilityAnalysis && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <Activity size={14} style={{ color: c.amber }} /> Readability Analysis
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(intelligence.readabilityAnalysis).map(([key, val]) => (
                        <div key={key} className="p-2 rounded-lg" style={{ background: c.surface }}>
                          <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: c.textMuted }}>{key.replace(/([A-Z])/g, " $1").trim()}</div>
                          <div className="text-[11px] font-semibold" style={{ color: c.text }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Tab: Insights ── */}
            {activeTab === "insights" && intelligence?.insights && (
              <motion.div key="tab-insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Missing Sections */}
                {intelligence.missingSections.length > 0 && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <AlertCircle size={14} style={{ color: c.red }} /> Missing Sections
                    </h3>
                    <div className="space-y-2">
                      {intelligence.missingSections.map((ms, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: c.surface }}>
                          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                            style={{ background: ms.importance === "critical" ? "rgba(239,68,68,0.1)" : ms.importance === "important" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)" }}
                          >
                            {ms.importance === "critical" ? <XCircle size={12} style={{ color: c.red }} /> :
                             ms.importance === "important" ? <AlertTriangle size={12} style={{ color: c.amber }} /> :
                             <CircleDot size={12} style={{ color: c.blue }} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold" style={{ color: c.text }}>{ms.section}</span>
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded"
                                style={{
                                  background: ms.importance === "critical" ? "rgba(239,68,68,0.1)" : ms.importance === "important" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                                  color: ms.importance === "critical" ? c.red : ms.importance === "important" ? c.amber : c.blue,
                                }}
                              >{ms.importance}</span>
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: c.textSec }}>{ms.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Structure Issues */}
                {intelligence.structureAnalysis && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <Shield size={14} style={{ color: intelligence.structureAnalysis.isAtsCompatible ? c.green : c.red }} /> ATS Structure Analysis
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: intelligence.structureAnalysis.isAtsCompatible ? c.green : c.red }} />
                      <span className="text-[11px] font-bold" style={{ color: intelligence.structureAnalysis.isAtsCompatible ? c.green : c.red }}>
                        {intelligence.structureAnalysis.isAtsCompatible ? "ATS Compatible" : "ATS Incompatible"}
                      </span>
                      <span className="text-[10px]" style={{ color: c.textMuted }}>· Format: {intelligence.structureAnalysis.overallFormat}</span>
                    </div>
                    {intelligence.structureAnalysis.issues.length > 0 && (
                      <div className="space-y-2">
                        {intelligence.structureAnalysis.issues.map((issue, i) => (
                          <div key={i} className="p-3 rounded-lg" style={{ background: c.surface }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded"
                                style={{
                                  background: issue.severity === "high" ? "rgba(239,68,68,0.1)" : issue.severity === "medium" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                                  color: issue.severity === "high" ? c.red : issue.severity === "medium" ? c.amber : c.blue,
                                }}
                              >{issue.severity}</span>
                              <span className="text-[11px] font-bold" style={{ color: c.text }}>{issue.issue}</span>
                            </div>
                            <div className="text-[10px] ml-8" style={{ color: c.textSec }}>Fix: {issue.fix}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Strengths, Weaknesses, Risks, Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Strengths", icon: <TrendingUp size={14} />, color: c.green, data: intelligence.insights.strengths },
                    { title: "Weaknesses", icon: <TrendingDown size={14} />, color: c.red, data: intelligence.insights.weaknesses },
                    { title: "Risks", icon: <AlertTriangle size={14} />, color: c.amber, data: intelligence.insights.risks },
                    { title: "Opportunities", icon: <Lightbulb size={14} />, color: c.blue, data: intelligence.insights.opportunities },
                  ].map((section, i) => (
                    <motion.div key={section.title} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                      className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                    >
                      <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                        <span style={{ color: section.color }}>{section.icon}</span> {section.title}
                      </h3>
                      <div className="space-y-1.5">
                        {section.data.map((item, j) => (
                          <div key={j} className="text-[11px] flex items-start gap-2" style={{ color: c.textSec }}>
                            <span style={{ color: section.color }}>•</span> {item}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Tab: Improvements ── */}
            {activeTab === "improvements" && (
              <motion.div key="tab-improvements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* AI Recommendations */}
                {intelligence?.improvementRecommendations && intelligence.improvementRecommendations.length > 0 && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <Brain size={14} style={{ color: c.purple }} /> AI Improvement Recommendations
                    </h3>
                    <div className="space-y-2">
                      {intelligence.improvementRecommendations.map((rec, i) => {
                        const isExpanded = expandedInsight === `rec-${i}`;
                        return (
                          <div key={i} className="rounded-lg overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                            <button onClick={() => setExpandedInsight(isExpanded ? null : `rec-${i}`)}
                              className="w-full flex items-center gap-2 p-3 text-left"
                            >
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded shrink-0"
                                style={{
                                  background: rec.priority === "high" ? "rgba(239,68,68,0.1)" : rec.priority === "medium" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                                  color: rec.priority === "high" ? c.red : rec.priority === "medium" ? c.amber : c.blue,
                                }}
                              >{rec.priority}</span>
                              <span className="text-[11px] font-bold flex-1" style={{ color: c.text }}>{rec.title}</span>
                              <span className="text-[9px] font-semibold" style={{ color: c.textMuted }}>{rec.category}</span>
                              {isExpanded ? <ChevronUp size={12} style={{ color: c.textMuted }} /> : <ChevronDown size={12} style={{ color: c.textMuted }} />}
                            </button>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                className="px-3 pb-3"
                              >
                                <p className="text-[10px] mb-1" style={{ color: c.textSec }}>{rec.description}</p>
                                <div className="text-[10px] font-semibold" style={{ color: c.amber }}>Impact: {rec.impact}</div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* AI Suggestions */}
                <div className="space-y-3">
                  {suggestions.length > 0 && (
                    <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: c.text }}>
                      <Sparkles size={14} style={{ color: c.amber }} /> AI Suggested Improvements
                    </h3>
                  )}
                  {suggestions.map((sugg, i) => {
                    const applied = appliedSuggestions.has(sugg.id);
                    return (
                      <motion.div key={sugg.id} variants={fadeUp} initial="hidden" animate="visible" custom={i} whileHover={cardHover}
                        className="p-4 rounded-xl" style={{
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
                                  color: sugg.impact === "high" ? c.red : sugg.impact === "medium" ? c.amber : c.blue,
                                }}
                              >{sugg.impact} impact</span>
                            </div>
                            <p className="text-[11px]" style={{ color: c.textSec }}>{sugg.description}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {applied ? (
                              <>
                                <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => handleUndoSuggestion(sugg.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                  style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                                ><RotateCcw size={10} /> Undo</motion.button>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                  style={{ background: "rgba(16,185,129,0.1)", color: c.green, border: "1px solid rgba(16,185,129,0.2)" }}
                                ><CheckCircle size={10} /> Applied</span>
                              </>
                            ) : (
                              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => handleApplySuggestion(sugg)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                style={{ background: c.amber, color: "#000" }}
                              ><Sparkles size={10} /> Apply</motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Strengths & Recommendations from ATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <CheckCircle size={14} style={{ color: c.green }} /> ATS Strengths
                    </h3>
                    <div className="space-y-1.5">
                      {analysis.strengths.map((s, i) => (
                        <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: c.textSec }}>
                          <span style={{ color: c.green }}>✓</span> {s}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                  >
                    <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                      <Star size={14} style={{ color: c.amber }} /> ATS Recommendations
                    </h3>
                    <div className="space-y-1.5">
                      {analysis.recommendations.map((r, i) => (
                        <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: c.textSec }}>
                          <span style={{ color: c.amber }}>✦</span> {r}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setView("resume-hub")}
                    className="flex-1 py-2 rounded-lg font-bold text-xs"
                    style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
                  >Back to Resume Hub</motion.button>
                  <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("final")}
                    className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
                  ><CheckCircle size={16} /> View Final Score</motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─────── SCREEN: INTELLIGENCE ─────── */}
        {screen === "intelligence" && intelligence && (
          <motion.div key="intelligence" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recruiter View Summary */}
              <motion.div variants={scaleIn} initial="hidden" animate="visible"
                className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
              >
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <Users size={14} style={{ color: c.purple }} /> Recruiter First Impression
                </h3>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: c.textSec }}>{intelligence.recruiterView.firstImpression}</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: intelligence.recruiterView.interviewWorthy ? c.green : c.red }} />
                  <span className="text-[10px] font-bold" style={{ color: intelligence.recruiterView.interviewWorthy ? c.green : c.red }}>
                    {intelligence.recruiterView.interviewWorthy ? "Interview Worthy" : "Needs Improvement"}
                  </span>
                </div>
              </motion.div>

              {/* Missing Sections */}
              <motion.div variants={scaleIn} initial="hidden" animate="visible"
                className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
              >
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <AlertCircle size={14} style={{ color: c.red }} /> Missing Sections
                </h3>
                {intelligence.missingSections.length > 0 ? (
                  <div className="space-y-2">
                    {intelligence.missingSections.slice(0, 4).map((ms, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded"
                          style={{
                            background: ms.importance === "critical" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                            color: ms.importance === "critical" ? c.red : c.amber,
                          }}
                        >{ms.importance}</span>
                        <span className="text-[11px] font-semibold" style={{ color: c.text }}>{ms.section}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-[11px]" style={{ color: c.green }}>All sections present</div>}
              </motion.div>
            </div>

            {/* Quick Insights */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
            >
              <h3 className="text-xs font-bold mb-3" style={{ color: c.text }}>Quick Insights</h3>
              <div className="grid grid-cols-2 gap-3">
                {intelligence.insights.strengths.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.05)" }}>
                    <TrendingUp size={12} className="shrink-0 mt-0.5" style={{ color: c.green }} />
                    <span className="text-[10px]" style={{ color: c.textSec }}>{s}</span>
                  </div>
                ))}
                {intelligence.insights.weaknesses.slice(0, 2).map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.05)" }}>
                    <TrendingDown size={12} className="shrink-0 mt-0.5" style={{ color: c.red }} />
                    <span className="text-[10px]" style={{ color: c.textSec }}>{w}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("dashboard")}
              className="w-full py-2 rounded-lg font-bold text-xs"
              style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
            >Back to Dashboard</motion.button>
          </motion.div>
        )}

        {/* ─────── SCREEN: SUGGESTIONS ─────── */}
        {screen === "suggestions" && (
          <motion.div key="suggestions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <motion.div variants={scaleIn} initial="hidden" animate="visible"
              className="p-5 rounded-2xl flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(16,185,129,0.1))", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="27" stroke={c.border} strokeWidth="5" fill="transparent" />
                  <circle cx="32" cy="32" r="27" stroke={scoreColor(updatedScore)} strokeWidth="5" fill="transparent"
                    strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - updatedScore / 100)} strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-extrabold" style={{ color: c.text }}>{updatedScore}</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: c.text }}>AI Suggestions</div>
                <p className="text-xs" style={{ color: c.textSec }}>Apply improvements to boost your ATS score.</p>
              </div>
            </motion.div>

            <div className="space-y-3">
              {suggestions.map((sugg, i) => {
                const applied = appliedSuggestions.has(sugg.id);
                return (
                  <motion.div key={sugg.id} variants={fadeUp} initial="hidden" animate="visible" custom={i} whileHover={cardHover}
                    className="p-4 rounded-xl" style={{
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
                              color: sugg.impact === "high" ? c.red : sugg.impact === "medium" ? c.amber : c.blue,
                            }}
                          >{sugg.impact} impact</span>
                        </div>
                        <p className="text-[11px]" style={{ color: c.textSec }}>{sugg.description}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {applied ? (
                          <>
                            <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => handleUndoSuggestion(sugg.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: "rgba(239,68,68,0.1)", color: c.red, border: "1px solid rgba(239,68,68,0.2)" }}
                            ><RotateCcw size={10} /> Undo</motion.button>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: "rgba(16,185,129,0.1)", color: c.green, border: "1px solid rgba(16,185,129,0.2)" }}
                            ><CheckCircle size={10} /> Applied</span>
                          </>
                        ) : (
                          <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => handleApplySuggestion(sugg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{ background: c.amber, color: "#000" }}
                          ><Sparkles size={10} /> Apply</motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("dashboard")}
                className="flex-1 py-2 rounded-lg font-bold text-xs"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              >Back to Dashboard</motion.button>
              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("final")}
                className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
              ><CheckCircle size={16} /> View Final Score</motion.button>
            </div>
          </motion.div>
        )}

        {/* ─────── SCREEN: HISTORY ─────── */}
        {screen === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 rounded-full border-2" style={{ borderColor: `${c.amber} transparent ${c.amber} ${c.amber}` }} />
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                title="No ATS Reports Yet"
                description="Analyze your first resume to start tracking your ATS performance over time."
                actionLabel="Analyze Resume"
                onAction={() => setScreen("home")}
                illustration={<BarChart3 size={32} />}
              />
            ) : (
              <div className="space-y-3">
                {history.map((report, i) => (
                  <motion.div key={report.id} variants={fadeUp} initial="hidden" animate="visible" custom={i} whileHover={cardHover}
                    className="p-4 rounded-xl flex items-center gap-4 cursor-pointer"
                    style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                    onClick={() => { /* Could load report details */ }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: scoreBg(report.score) }}>
                      <span className="text-lg font-extrabold" style={{ color: scoreColor(report.score) }}>{report.score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: c.text }}>{report.resume?.title || "Resume"}</div>
                      <div className="text-[10px]" style={{ color: c.textMuted }}>
                        {new Date(report.createdAt).toLocaleDateString()} · {new Date(report.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase"
                      style={{ background: scoreBg(report.score), color: scoreColor(report.score) }}
                    >{scoreLabel(report.score)}</div>
                  </motion.div>
                ))}
              </div>
            )}
            <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("home")}
              className="w-full py-2 rounded-lg font-bold text-xs"
              style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
            >Back to Home</motion.button>
          </motion.div>
        )}

        {/* ─────── SCREEN: COMPARE ─────── */}
        {screen === "compare" && (
          <motion.div key="compare" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
                <GitCompare size={16} style={{ color: c.amber }} /> Compare Resume Versions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: c.textSec }}>Version A</label>
                  <select value={compareA} onChange={e => setCompareA(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
                  >
                    <option value="">Select resume...</option>
                    {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: c.textSec }}>Version B</label>
                  <select value={compareB} onChange={e => setCompareB(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm outline-none"
                    style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
                  >
                    <option value="">Select resume...</option>
                    {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
              </div>
              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={runCompare}
                disabled={!compareA || !compareB || compareLoading}
                className="w-full mt-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{
                  background: !compareA || !compareB ? c.surface : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: !compareA || !compareB ? c.textMuted : "#000",
                  border: !compareA || !compareB ? `1px solid ${c.border}` : "none",
                }}
              ><GitCompare size={14} /> {compareLoading ? "Comparing..." : "Compare Resumes"}</motion.button>
            </div>

            {compareResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Version A", data: compareResult.versionA },
                    { label: "Version B", data: compareResult.versionB },
                  ].map(v => (
                    <div key={v.label} className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: c.textMuted }}>{v.label}</div>
                      <div className="text-2xl font-extrabold mb-1" style={{ color: scoreColor(v.data.score) }}>{v.data.score}/100</div>
                      <div className="space-y-1">
                        {v.data.strengths.slice(0, 2).map((s: string, i: number) => (
                          <div key={i} className="text-[10px] flex items-start gap-1" style={{ color: c.green }}>✓ {s}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}>
                  <div className="text-xs font-bold mb-2" style={{ color: c.text }}>Recommendation</div>
                  <p className="text-[11px]" style={{ color: c.textSec }}>{compareResult.recommendation}</p>
                  {compareResult.overallImprovement !== 0 && (
                    <div className="mt-2 text-[11px] font-bold" style={{ color: compareResult.overallImprovement > 0 ? c.green : c.red }}>
                      {compareResult.overallImprovement > 0 ? "+" : ""}{compareResult.overallImprovement} points overall
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={() => setScreen("home")}
              className="w-full py-2 rounded-lg font-bold text-xs"
              style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
            >Back to Home</motion.button>
          </motion.div>
        )}

        {/* ─────── SCREEN: FINAL ─────── */}
        {screen === "final" && (
          <motion.div key="final" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="max-w-lg mx-auto text-center space-y-6"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)", border: "3px solid rgba(16,185,129,0.3)" }}
            ><CheckCircle size={48} style={{ color: c.green }} /></motion.div>
            <div>
              <h2 className="text-xl font-extrabold mb-2" style={{ color: c.text }}>Resume Improved Successfully</h2>
              <p className="text-sm" style={{ color: c.textSec }}>Applied {appliedSuggestions.size} of {suggestions.length} suggestions</p>
            </div>
            <motion.div variants={scaleIn} initial="hidden" animate="visible"
              className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.textMuted }}>Updated ATS Score</div>
              <div className="flex items-center justify-center gap-3">
                <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-extrabold" style={{ color: c.text }}
                ><CountUp end={updatedScore} duration={1.5} /></motion.span>
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ color: c.textMuted }}>/ 100</span>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: scoreBg(updatedScore), color: scoreColor(updatedScore) }}
                  >{scoreLabel(updatedScore)}</div>
                </div>
              </div>
              {updatedScore > (analysis?.score || 0) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 text-sm font-bold flex items-center justify-center gap-1" style={{ color: c.green }}
                >+{updatedScore - (analysis?.score || 0)} points improved</motion.div>
              )}
            </motion.div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
              <motion.button variants={fadeUp} whileHover={buttonHover} whileTap={buttonTap}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              ><Save size={16} /> Save Resume</motion.button>
              <motion.button variants={fadeUp} whileHover={buttonHover} whileTap={buttonTap}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              ><Download size={16} /> Download PDF</motion.button>
              <motion.button variants={fadeUp} whileHover={buttonHover} whileTap={buttonTap}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}
              ><Download size={16} /> Download DOCX</motion.button>
              <motion.button variants={fadeUp} whileHover={buttonHover} whileTap={buttonTap}
                onClick={() => setView("resume-hub")}
                className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: c.amber, color: "#000" }}
              ><FileText size={16} /> Open Resume Builder</motion.button>
            </motion.div>
            <motion.button whileHover={buttonHover} whileTap={buttonTap}
              onClick={() => { setScreen("home"); setAnalysis(null); setIntelligence(null); setFile(null); setSelectedResumeId(""); setSuggestions([]); setAppliedSuggestions(new Set()); }}
              className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: c.amber }}
            ><RefreshCw size={14} /> Analyze Another Resume</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ─── AI CHAT BUTTON ─── */}
      {(screen === "dashboard" || screen === "suggestions") && (
        <>
          <motion.button whileHover={buttonHover} whileTap={buttonTap}
            onClick={() => setChatOpen(!chatOpen)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
          >
            {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.button>
          <AnimatePresence>
            {chatOpen && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.2 }}
                className="fixed bottom-24 right-6 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ background: c.chatBg, border: `1px solid ${c.border}`, maxHeight: "60vh", display: "flex", flexDirection: "column" }}
              >
                <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: c.border }}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: c.amber }} />
                    <span className="text-sm font-bold" style={{ color: c.text }}>AI ATS Assistant</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setChatOpen(false)} className="p-1 rounded-lg" style={{ color: c.textMuted }}
                  ><X size={14} /></motion.button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 200, maxHeight: 350 }}>
                  {chatMessages.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: c.textMuted }}>Ask me anything about your ATS score. Try:</p>
                      {["Improve ATS score", "Optimize for Google", "Rewrite Summary", "Add Missing Keywords", "Reduce Resume Length"].map((suggestion, i) => (
                        <motion.button key={suggestion} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                          whileHover={{ scale: 1.02 }} onClick={() => setChatInput(suggestion)}
                          className="block w-full text-left p-2 rounded-lg text-[11px] font-medium transition-all"
                          style={{ background: "rgba(245,158,11,0.08)", color: c.amber, border: "1px solid rgba(245,158,11,0.15)" }}
                        ><Sparkles size={10} className="inline mr-1.5" />{suggestion}</motion.button>
                      ))}
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                        style={{
                          background: msg.role === "user" ? c.amber : c.surface,
                          color: msg.role === "user" ? "#000" : c.text,
                          border: msg.role === "user" ? "none" : `1px solid ${c.border}`,
                        }}
                      >{msg.content}</div>
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
                <div className="p-3 border-t flex gap-2" style={{ borderColor: c.border }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask about your ATS score..."
                    className="flex-1 p-2.5 rounded-xl text-xs outline-none"
                    style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
                  />
                  <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={handleSendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2.5 rounded-xl flex items-center justify-center"
                    style={{ background: c.amber, color: "#000", opacity: chatLoading || !chatInput.trim() ? 0.5 : 1 }}
                  ><Send size={14} /></motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
