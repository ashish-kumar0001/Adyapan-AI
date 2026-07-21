"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import type { ResumeHubViewType } from "@/types/resume";
import { useTheme } from "@/hooks/useTheme";
import { EmptyState } from "@/components/ui/PremiumComponents";
import {
  Chart as ChartJS,
  RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip as CT, Legend as CL, CategoryScale, LinearScale, BarElement, ArcElement,
} from "chart.js";
import { Radar, Bar, Doughnut } from "react-chartjs-2";
import {
  Compass, Sparkles, RefreshCw, Check, Award, Target,
  TrendingUp, Users, FileText, Briefcase, Code2, GraduationCap,
  Link2, Zap, Eye, ChevronDown, ChevronRight, History,
  Lightbulb, Star, ArrowRight, BarChart3,
  Trash2, BookOpen, Calendar, Circle, CheckCircle, AlertTriangle, X,
  Rocket, Brain, Globe, Shield, Map, Route, Clock, Flag,
  ArrowLeft, Download, Play, Pause, RotateCcw, Trophy,
  Layers, GitBranch, BookOpenCheck, PenTool, Layers3,
  CircleDot, ListTodo, Presentation, Award as AwardIcon,
  LayoutDashboard,
} from "lucide-react";

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler, CT, CL,
  CategoryScale, LinearScale, BarElement, ArcElement
);

const TARGET_ROLES = [
  "Software Engineer", "Backend Developer", "Frontend Developer",
  "Full Stack Developer", "AI Engineer", "Machine Learning Engineer",
  "Data Scientist", "Data Analyst", "Cloud Engineer",
  "DevOps Engineer", "QA Engineer", "Cybersecurity Engineer", "Custom Goal",
];

const TIMELINES = ["30 Days", "60 Days", "90 Days", "6 Months", "12 Months", "Custom"];

const LOADING_STEPS = [
  "Analyzing Resume Quality",
  "Reading Coding Progress",
  "Reviewing Learning Analytics",
  "Calculating Career Readiness",
  "Generating Personalized Roadmap",
  "Planning Weekly Tasks",
  "Preparing Market Insights",
  "Ready",
];

const mkC = (t: string) => {
  const d = t === "dark";
  return {
    d,
    tx: d ? "#e5e7eb" : "#0f172a",
    tx2: d ? "#9ca3af" : "#475569",
    txM: d ? "#6b7280" : "#94a3b8",
    bg: d
      ? "linear-gradient(135deg, #0a0e1a 0%, #0d1520 30%, #111827 60%, #0a0e1a 100%)"
      : "linear-gradient(160deg,#f8fafc 0%,#f1f5f9 40%,#e8edf5 100%)",
    sf: d ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
    sfH: d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    bd: d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    bdH: d ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)",
    cb: d
      ? "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)"
      : "rgba(255,255,255,0.85)",
    cs: d
      ? "0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    am: "#f59e0b", amBg: d ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.06)",
    gn: "#10b981", gnBg: d ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.06)",
    rd: "#ef4444", rdBg: d ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
    bl: "#3b82f6", blBg: d ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)",
    pp: "#8b5cf6", ppBg: d ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.06)",
    cy: "#06b6d4", cyBg: d ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.06)",
    dv: d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    glass: d ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
    glassBd: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    inputBg: d ? "rgba(0,0,0,0.35)" : "#f1f5f9",
  };
};

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) };
const scaleIn = { hidden: { opacity: 0, scale: 0.92 }, visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }) };

function ScoreRing({ score, size = 120, stroke = 10, color, label, c }: {
  score: number; size?: number; stroke?: number; color: string; label: string; c: ReturnType<typeof mkC>;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke={c.bd} strokeWidth={stroke} fill="transparent" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="transparent"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            className="font-extrabold" style={{ fontSize: size * 0.22, color }}>
            {score}
          </motion.span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.txM }}>/100</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: c.tx2 }}>{label}</span>
    </div>
  );
}

function StepLoader({ steps, currentStep, c }: { steps: string[]; currentStep: number; c: ReturnType<typeof mkC> }) {
  return (
    <div className="w-full max-w-lg mx-auto my-12 space-y-4">
      <div className="text-center mb-6">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-t-transparent" style={{ borderColor: `${c.am} transparent transparent transparent`, borderWidth: 3 }} />
        <h3 className="text-lg font-bold" style={{ color: c.tx }}>Generating Your Career Roadmap</h3>
        <p className="text-xs mt-1" style={{ color: c.txM }}>AI is analyzing your complete profile</p>
      </div>
      {steps.map((step, i) => (
        <motion.div key={step} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{
            background: i < currentStep ? c.gnBg : i === currentStep ? c.amBg : c.sf,
            border: `1px solid ${i < currentStep ? `${c.gn}30` : i === currentStep ? `${c.am}30` : c.bd}`,
          }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
            background: i < currentStep ? c.gn : i === currentStep ? c.am : c.dv,
            color: i <= currentStep ? "#fff" : c.txM,
          }}>
            {i < currentStep ? <Check size={12} /> : i + 1}
          </div>
          <span className="text-xs font-semibold" style={{ color: i <= currentStep ? c.tx : c.txM }}>{step}</span>
          {i === currentStep && (
            <motion.div className="ml-auto w-2 h-2 rounded-full" style={{ background: c.am }}
              animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

interface RoadmapPhase {
  title: string; description: string; duration: string; objectives: string[];
  expectedOutcomes: string[]; completionPercentage: number; dependencies: string[];
}
interface WeeklyTask {
  title: string; description: string; category: string; priority: string;
  estimatedHours: number; impactScore: number; status: string;
}
interface GapSkill { skill: string; importance: string; priority: number; reason: string; }
interface SkillMapItem { name: string; currentLevel: number; targetLevel: number; status: string; dependencies: string[]; category: string; }
interface ProjectRec { title: string; description: string; skillsGained: string[]; resumeImpact: string; interviewValue: string; estimatedTime: string; difficulty: string; whyItMatters: string; }
interface CertRec { name: string; issuer: string; why: string; difficulty: string; roi: string; studyTime: string; }
interface Milestone { title: string; description: string; targetDate: string; category: string; status: string; }

interface RoadmapResponse {
  readinessScores: { overall: number; technical: number; resume: number; interview: number; placement: number; recruiter: number };
  roadmap: { phases: RoadmapPhase[]; totalDuration: string };
  weeklyPlan: { tasks: WeeklyTask[]; dailyMicroTasks: string[]; totalEstimatedHours: number };
  gapAnalysis: { missingSkills: GapSkill[]; missingProjects: { project: string; impact: string; effort: string }[]; missingCertifications: CertRec[]; missingExperience: { area: string; suggestion: string }[]; missingSoftSkills: { skill: string; importance: string }[] };
  skillMap: { skills: SkillMapItem[] };
  projectRecommendations: ProjectRec[];
  certRecommendations: CertRec[];
  marketInsights: { currentDemand: string; averageSalary: string; topSkillCombinations: string[]; resumeExpectations: string[]; portfolioExpectations: string[]; interviewTrends: string[]; topHiringCompanies: string[]; growthOutlook: string };
  coachFeedback: { weeklyFeedback: string; progressSummary: string; motivationalGuidance: string; focusAreas: string[]; risks: string[]; nextBestAction: string };
  milestones: Milestone[];
}

interface RoadmapRecord {
  id: string; targetRole: string; timeline: string; readinessScore: number; createdAt: string; versionNumber: number;
}
interface TaskRecord {
  id: string; title: string; description: string; category: string; priority: string; status: string;
  estimatedHours: number; impactScore: number;
}

interface Props { setView: (v: ResumeHubViewType) => void; }

export function CareerNavigationEngine({ setView }: Props) {
  const theme = useTheme();
  const c = mkC(theme);

  const [tab, setTab] = useState<"setup" | "overview" | "roadmap" | "weekly" | "skills" | "gaps" | "projects" | "insights" | "coach" | "history">("setup");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState("");

  const [targetRole, setTargetRole] = useState("");
  const [timeline, setTimeline] = useState("90 Days");
  const [customRole, setCustomRole] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [roadmapRecord, setRoadmapRecord] = useState<RoadmapRecord | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [history, setHistory] = useState<RoadmapRecord[]>([]);

  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [activeTaskFilter, setActiveTaskFilter] = useState("all");

  useEffect(() => { loadLatest(); loadHistory(); }, []);

  const loadLatest = async () => {
    try {
      const res = await api.get("/career/latest");
      if (res.data.success && res.data.roadmap) {
        setRoadmapRecord(res.data.roadmap);
        setRoadmapData(res.data.roadmapData);
        setTasks(res.data.tasks || []);
        setTab("overview");
      }
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/career/history");
      if (res.data.success) setHistory(res.data.roadmaps || []);
    } catch {}
  };

  const generateRoadmap = async () => {
    const role = targetRole === "Custom Goal" ? customRole : targetRole;
    if (!role) { setError("Please select or enter a target role"); return; }
    setError(""); setLoading(true); setLoadStep(0);
    const stepTimer = setInterval(() => { setLoadStep(p => Math.min(p + 1, LOADING_STEPS.length - 1)); }, 1200);
    try {
      const res = await api.post("/career/generate", { targetRole: role, timeline });
      if (res.data.success) {
        setRoadmapRecord(res.data.roadmap);
        setRoadmapData(res.data.roadmapData);
        setTasks(res.data.roadmapData?.weeklyPlan?.tasks?.map((t: any, i: number) => ({
          id: `task-${i}`, ...t,
        })) || []);
        setTab("overview");
        loadHistory();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to generate roadmap. Please try again.");
    } finally {
      clearInterval(stepTimer); setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await api.post("/career/update-task", { taskId, status });
      if (res.data.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      }
    } catch {}
  };

  const deleteRoadmapAction = async (id: string) => {
    try { await api.delete(`/career/${id}`); loadHistory(); } catch {}
  };

  const loadFromHistory = async (id: string) => {
    try {
      const res = await api.get(`/career/${id}`);
      if (res.data.success) {
        setRoadmapRecord(res.data.roadmap);
        setRoadmapData(res.data.roadmapData);
        setTasks(res.data.tasks || []);
        setTab("overview");
      }
    } catch {}
  };

  const filteredTasks = tasks.filter(t => activeTaskFilter === "all" || t.category === activeTaskFilter || t.status === activeTaskFilter);

  if (loading) {
    return (
      <div style={{ background: c.bg, minHeight: "100vh", padding: "2rem" }}>
        <StepLoader steps={LOADING_STEPS} currentStep={loadStep} c={c} />
      </div>
    );
  }

  if (tab === "setup") {
    return (
      <div style={{ background: c.bg, minHeight: "100vh", padding: "1.5rem" }}>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.amBg }}>
              <Compass size={20} style={{ color: c.am }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.am }}>CAREER NAVIGATION ENGINE</p>
              <h1 className="text-xl font-extrabold" style={{ color: c.tx }}>AI Career Roadmap</h1>
            </div>
          </div>
          <p className="text-xs mb-8" style={{ color: c.txM }}>
            Get a personalized career strategy built from your learning progress, coding performance, resume quality, and target role.
          </p>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-xs font-semibold"
              style={{ background: c.rdBg, color: c.rd, border: `1px solid ${c.rd}30` }}>
              <AlertTriangle size={14} /> {error}
            </motion.div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: c.txM }}>Target Role</label>
              <div className="relative">
                <button onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold"
                  style={{ background: c.sf, border: `1px solid ${c.bd}`, color: targetRole ? c.tx : c.txM }}>
                  {targetRole || "Select your target role..."} <ChevronDown size={14} style={{ color: c.txM }} />
                </button>
                {showRoleDropdown && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl z-50 max-h-64 overflow-y-auto"
                    style={{ background: c.d ? "#111827" : "#fff", border: `1px solid ${c.bd}`, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                    {TARGET_ROLES.map(role => (
                      <button key={role} onClick={() => { setTargetRole(role); setShowRoleDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors"
                        style={{ color: targetRole === role ? c.am : c.tx2, background: targetRole === role ? c.amBg : "transparent" }}
                        onMouseEnter={e => (e.currentTarget.style.background = c.sfH)}
                        onMouseLeave={e => (e.currentTarget.style.background = targetRole === role ? c.amBg : "transparent")}>
                        {role}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
              {targetRole === "Custom Goal" && (
                <input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Enter your custom career goal..."
                  className="w-full mt-2 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                  style={{ background: c.sf, border: `1px solid ${c.bd}`, color: c.tx }} />
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: c.txM }}>Timeline</label>
              <div className="flex flex-wrap gap-2">
                {TIMELINES.map(t => (
                  <button key={t} onClick={() => setTimeline(t)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: timeline === t ? c.amBg : c.sf,
                      border: `1px solid ${timeline === t ? `${c.am}50` : c.bd}`,
                      color: timeline === t ? c.am : c.tx2,
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={generateRoadmap} disabled={!targetRole || (targetRole === "Custom Goal" && !customRole)}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: targetRole ? `linear-gradient(135deg, ${c.am}, #f97316)` : c.dv,
                color: targetRole ? "#fff" : c.txM,
                cursor: targetRole ? "pointer" : "not-allowed",
                boxShadow: targetRole ? `0 4px 20px ${c.am}40` : "none",
              }}>
              <Sparkles size={16} /> Generate AI Career Roadmap
            </motion.button>
          </div>

          {history.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txM }}>Previous Roadmaps</h3>
              <div className="space-y-2">
                {history.map(h => (
                  <motion.button key={h.id} whileHover={{ scale: 1.01 }} onClick={() => loadFromHistory(h.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
                    style={{ background: c.sf, border: `1px solid ${c.bd}` }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: c.tx }}>{h.targetRole}</p>
                      <p className="text-[10px]" style={{ color: c.txM }}>{h.timeline} &middot; Score: {h.readinessScore}% &middot; {new Date(h.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.amBg, color: c.am }}>v{h.versionNumber}</span>
                      <button onClick={e => { e.stopPropagation(); deleteRoadmapAction(h.id); }}
                        className="p-1 rounded-lg hover:bg-red-500/10" style={{ color: c.rd }}><Trash2 size={12} /></button>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const scores = roadmapData?.readinessScores || { overall: 0, technical: 0, resume: 0, interview: 0, placement: 0, recruiter: 0 };
  const phases = roadmapData?.roadmap?.phases || [];
  const gapSkills = roadmapData?.gapAnalysis?.missingSkills || [];
  const skillItems = roadmapData?.skillMap?.skills || [];
  const projRecs = roadmapData?.projectRecommendations || [];
  const certRecs = roadmapData?.certRecommendations || [];
  const marketInsights = roadmapData?.marketInsights;
  const coach = roadmapData?.coachFeedback;
  const milestones = roadmapData?.milestones || [];

  const tabItems = [
    { id: "overview" as const, label: "Overview", icon: <LayoutDashboard size={14} /> },
    { id: "roadmap" as const, label: "Roadmap", icon: <Route size={14} /> },
    { id: "weekly" as const, label: "Weekly Plan", icon: <Calendar size={14} /> },
    { id: "skills" as const, label: "Skills", icon: <Code2 size={14} /> },
    { id: "gaps" as const, label: "Gap Analysis", icon: <Target size={14} /> },
    { id: "projects" as const, label: "Projects", icon: <Rocket size={14} /> },
    { id: "insights" as const, label: "Market", icon: <Globe size={14} /> },
    { id: "coach" as const, label: "AI Coach", icon: <Brain size={14} /> },
    { id: "history" as const, label: "History", icon: <History size={14} /> },
  ];

  return (
    <div style={{ background: c.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ borderBottom: `1px solid ${c.bd}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.amBg }}>
            <Compass size={18} style={{ color: c.am }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.am }}>CAREER ROADMAP</p>
            <h2 className="text-sm font-extrabold" style={{ color: c.tx }}>{roadmapRecord?.targetRole || targetRole}</h2>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.amBg, color: c.am }}>
            {roadmapRecord?.timeline || timeline}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setTab("setup"); setRoadmapData(null); setRoadmapRecord(null); setTasks([]); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ background: c.sf, border: `1px solid ${c.bd}`, color: c.tx2 }}>
            <RotateCcw size={12} /> New Roadmap
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 py-2 flex gap-1 overflow-x-auto" style={{ borderBottom: `1px solid ${c.bd}` }}>
        {tabItems.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
            style={{
              background: tab === t.id ? c.amBg : "transparent",
              color: tab === t.id ? c.am : c.txM,
              border: `1px solid ${tab === t.id ? `${c.am}30` : "transparent"}`,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div key="overview" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-6">
              {/* Overall Readiness */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {([
                  { label: "Overall", score: scores.overall, color: c.am },
                  { label: "Technical", score: scores.technical, color: c.bl },
                  { label: "Resume", score: scores.resume, color: c.gn },
                  { label: "Interview", score: scores.interview, color: c.pp },
                  { label: "Placement", score: scores.placement, color: c.cy },
                  { label: "Recruiter", score: scores.recruiter, color: "#f97316" },
                ]).map((item, i) => (
                  <motion.div key={item.label} variants={scaleIn} custom={i}
                    className="flex flex-col items-center p-4 rounded-2xl"
                    style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                    <ScoreRing score={item.score} size={90} stroke={7} color={item.color} label={item.label} c={c} />
                  </motion.div>
                ))}
              </div>

              {/* Radar Chart */}
              <motion.div variants={fadeUp} custom={6} className="p-5 rounded-2xl"
                style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: c.txM }}>Readiness Breakdown</h3>
                <div className="max-w-md mx-auto">
                  <Radar data={{
                    labels: ["Technical", "Resume", "Interview", "Placement", "Recruiter"],
                    datasets: [{
                      label: "Your Score",
                      data: [scores.technical, scores.resume, scores.interview, scores.placement, scores.recruiter],
                      backgroundColor: `${c.am}25`,
                      borderColor: c.am,
                      borderWidth: 2,
                      pointBackgroundColor: c.am,
                      pointRadius: 4,
                    }]
                  }} options={{
                    responsive: true,
                    scales: { r: { beginAtZero: true, max: 100, ticks: { display: false, stepSize: 20 }, grid: { color: c.bd }, pointLabels: { color: c.tx2, font: { size: 11, weight: "bold" } } } },
                    plugins: { legend: { display: false } },
                  }} />
                </div>
              </motion.div>

              {/* Coach Summary + Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coach && (
                  <motion.div variants={fadeUp} custom={7} className="p-5 rounded-2xl"
                    style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.txM }}>
                      <Brain size={14} style={{ color: c.am }} /> AI Career Coach
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: c.am }}>Next Best Action</p>
                        <p className="text-xs font-medium" style={{ color: c.tx }}>{coach.nextBestAction}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: c.gn }}>Focus Areas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(coach.focusAreas || []).slice(0, 4).map((f, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.amBg, color: c.am }}>{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div variants={fadeUp} custom={8} className="p-5 rounded-2xl"
                  style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.txM }}>
                    <Flag size={14} style={{ color: c.am }} /> Milestones
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {milestones.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: c.sf }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                          style={{ background: m.status === "completed" ? c.gn : c.dv }}>
                          {m.status === "completed" ? <Check size={10} style={{ color: "#fff" }} /> : <Circle size={8} style={{ color: c.txM }} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: c.tx }}>{m.title}</p>
                          <p className="text-[9px]" style={{ color: c.txM }}>{m.targetDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {tab === "roadmap" && (
            <motion.div key="roadmap" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: c.txM }}>
                  Career Roadmap &middot; {roadmapData?.roadmap?.totalDuration}
                </h3>
              </div>
              {phases.map((phase, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} className="rounded-2xl overflow-hidden"
                  style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <button onClick={() => setExpandedPhase(expandedPhase === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold"
                        style={{ background: phase.completionPercentage >= 100 ? c.gnBg : c.amBg, color: phase.completionPercentage >= 100 ? c.gn : c.am }}>
                        {phase.completionPercentage >= 100 ? <Check size={14} /> : i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: c.tx }}>{phase.title}</p>
                        <p className="text-[10px]" style={{ color: c.txM }}>{phase.duration} &middot; {phase.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold" style={{ color: c.am }}>{phase.completionPercentage}%</span>
                      <ChevronDown size={14} style={{ color: c.txM, transform: expandedPhase === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedPhase === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-3 overflow-hidden">
                        <div className="w-full h-1.5 rounded-full" style={{ background: c.dv }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${phase.completionPercentage}%` }}
                            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${c.am}, #f97316)` }} />
                        </div>
                        {phase.objectives.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.txM }}>Objectives</p>
                            <div className="space-y-1">
                              {phase.objectives.map((obj, j) => (
                                <div key={j} className="flex items-center gap-2 text-[11px]" style={{ color: c.tx2 }}>
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.am }} /> {obj}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {phase.expectedOutcomes.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: c.txM }}>Expected Outcomes</p>
                            <div className="space-y-1">
                              {phase.expectedOutcomes.map((out, j) => (
                                <div key={j} className="flex items-center gap-2 text-[11px]" style={{ color: c.gn }}>
                                  <CheckCircle size={10} /> {out}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === "weekly" && (
            <motion.div key="weekly" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-5">
              {/* Daily Micro Tasks */}
              {roadmapData?.weeklyPlan?.dailyMicroTasks && roadmapData.weeklyPlan.dailyMicroTasks.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.am }}>
                    <Zap size={14} /> Daily Micro Tasks
                  </h3>
                  <div className="space-y-2">
                    {roadmapData.weeklyPlan.dailyMicroTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium" style={{ background: c.sf, color: c.tx2 }}>
                        <CircleDot size={12} style={{ color: c.am }} /> {task}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Filters */}
              <div className="flex flex-wrap gap-1.5">
                {["all", "learning", "coding", "resume", "interview", "project", "not_started", "in_progress", "completed"].map(f => (
                  <button key={f} onClick={() => setActiveTaskFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize"
                    style={{
                      background: activeTaskFilter === f ? c.amBg : c.sf,
                      border: `1px solid ${activeTaskFilter === f ? `${c.am}30` : c.bd}`,
                      color: activeTaskFilter === f ? c.am : c.txM,
                    }}>
                    {f.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {filteredTasks.map((task, i) => (
                  <motion.div key={task.id || i} variants={fadeUp} custom={i}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button onClick={() => {
                        const next = task.status === "not_started" ? "in_progress" : task.status === "in_progress" ? "completed" : "not_started";
                        updateTaskStatus(task.id, next);
                      }}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: task.status === "completed" ? c.gn : task.status === "in_progress" ? c.am : "transparent",
                          border: `2px solid ${task.status === "completed" ? c.gn : task.status === "in_progress" ? c.am : c.bd}`,
                        }}>
                        {task.status === "completed" && <Check size={12} style={{ color: "#fff" }} />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate" style={{
                          color: c.tx,
                          textDecoration: task.status === "completed" ? "line-through" : "none",
                          opacity: task.status === "completed" ? 0.6 : 1,
                        }}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                            style={{ background: c.sf, color: c.txM }}>{task.category}</span>
                          <span className="text-[9px] font-bold" style={{ color: c.txM }}>{task.estimatedHours}h</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: task.priority === "High" ? c.rdBg : task.priority === "Medium" ? c.amBg : c.gnBg,
                          color: task.priority === "High" ? c.rd : task.priority === "Medium" ? c.am : c.gn,
                        }}>{task.priority}</span>
                    </div>
                  </motion.div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-8" style={{ color: c.txM }}>
                    <ListTodo size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No tasks match this filter</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "skills" && (
            <motion.div key="skills" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-5">
              {/* Skill Radar */}
              {skillItems.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: c.txM }}>Skill Progression Map</h3>
                  <div className="max-w-md mx-auto">
                    <Radar data={{
                      labels: skillItems.slice(0, 8).map(s => s.name),
                      datasets: [
                        { label: "Current", data: skillItems.slice(0, 8).map(s => s.currentLevel), backgroundColor: `${c.bl}20`, borderColor: c.bl, borderWidth: 2, pointBackgroundColor: c.bl },
                        { label: "Target", data: skillItems.slice(0, 8).map(s => s.targetLevel), backgroundColor: `${c.am}15`, borderColor: c.am, borderWidth: 2, borderDash: [5, 5], pointBackgroundColor: c.am },
                      ]
                    }} options={{
                      responsive: true,
                      scales: { r: { beginAtZero: true, max: 100, ticks: { display: false }, grid: { color: c.bd }, pointLabels: { color: c.tx2, font: { size: 10, weight: "bold" } } } },
                      plugins: { legend: { labels: { color: c.tx2, font: { size: 10, weight: "bold" } } } },
                    }} />
                  </div>
                </div>
              )}

              {/* Skill Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skillItems.map((skill, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i} className="p-4 rounded-2xl"
                    style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold" style={{ color: c.tx }}>{skill.name}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize" style={{
                        background: skill.status === "completed" ? c.gnBg : skill.status === "in_progress" ? c.amBg : c.dv,
                        color: skill.status === "completed" ? c.gn : skill.status === "in_progress" ? c.am : c.txM,
                      }}>{skill.status.replace("_", " ")}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-medium" style={{ color: c.txM }}>
                        <span>Current: {skill.currentLevel}%</span><span>Target: {skill.targetLevel}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: c.dv }}>
                        <div className="h-full rounded-full" style={{ width: `${skill.currentLevel}%`, background: `linear-gradient(90deg, ${c.bl}, ${c.am})`, transition: "width 1s ease" }} />
                      </div>
                    </div>
                    {skill.dependencies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {skill.dependencies.map((dep, j) => (
                          <span key={j} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: c.sf, color: c.txM }}>
                            requires: {dep}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "gaps" && (
            <motion.div key="gaps" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-5">
              {/* Missing Skills */}
              {gapSkills.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.txM }}>
                    <Target size={14} style={{ color: c.rd }} /> Missing Technical Skills
                  </h3>
                  <div className="space-y-2">
                    {gapSkills.sort((a, b) => a.priority - b.priority).map((skill, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: c.sf }}>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: c.tx }}>{skill.skill}</p>
                          <p className="text-[10px]" style={{ color: c.txM }}>{skill.reason}</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                          background: skill.importance === "Critical" ? c.rdBg : skill.importance === "High" ? c.amBg : c.blBg,
                          color: skill.importance === "Critical" ? c.rd : skill.importance === "High" ? c.am : c.bl,
                        }}>{skill.importance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Projects */}
              {roadmapData?.gapAnalysis?.missingProjects && roadmapData.gapAnalysis.missingProjects.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.txM }}>
                    <Rocket size={14} style={{ color: c.pp }} /> Missing Projects
                  </h3>
                  <div className="space-y-2">
                    {roadmapData.gapAnalysis.missingProjects.map((p, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: c.sf }}>
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-bold" style={{ color: c.tx }}>{p.project}</p>
                          <div className="flex gap-1.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.amBg, color: c.am }}>{p.impact} Impact</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.blBg, color: c.bl }}>{p.effort} Effort</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Soft Skills */}
              {roadmapData?.gapAnalysis?.missingSoftSkills && roadmapData.gapAnalysis.missingSoftSkills.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.txM }}>
                    <Users size={14} style={{ color: c.cy }} /> Missing Soft Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {roadmapData.gapAnalysis.missingSoftSkills.map((s, i) => (
                      <span key={i} className="text-[11px] font-bold px-3 py-1.5 rounded-xl" style={{ background: c.cyBg, color: c.cy }}>
                        {s.skill} <span className="opacity-60">({s.importance})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "projects" && (
            <motion.div key="projects" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.txM }}>Recommended Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projRecs.map((proj, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i} className="p-5 rounded-2xl"
                    style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.ppBg }}>
                        <Rocket size={16} style={{ color: c.pp }} />
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.amBg, color: c.am }}>{proj.difficulty}</span>
                    </div>
                    <h4 className="text-xs font-bold mb-1" style={{ color: c.tx }}>{proj.title}</h4>
                    <p className="text-[10px] mb-3" style={{ color: c.txM }}>{proj.description}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: c.txM }}>Why It Matters</p>
                        <p className="text-[10px]" style={{ color: c.tx2 }}>{proj.whyItMatters}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.skillsGained.map((s, j) => (
                          <span key={j} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: c.blBg, color: c.bl }}>{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-[9px] font-bold" style={{ color: c.txM }}>
                        <span>Resume: {proj.resumeImpact}</span>
                        <span>Time: {proj.estimatedTime}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Certifications */}
              {certRecs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txM }}>Certification Recommendations</h3>
                  <div className="space-y-2">
                    {certRecs.map((cert, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: c.cb, border: `1px solid ${c.bd}` }}>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: c.tx }}>{cert.name}</p>
                          <p className="text-[10px]" style={{ color: c.txM }}>{cert.why} &middot; {cert.issuer}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.gnBg, color: c.gn }}>ROI: {cert.roi}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.blBg, color: c.bl }}>{cert.difficulty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "insights" && marketInsights && (
            <motion.div key="insights" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Market Demand", value: marketInsights.currentDemand, color: c.gn },
                  { label: "Salary Range", value: marketInsights.averageSalary, color: c.am },
                  { label: "Growth Outlook", value: marketInsights.growthOutlook, color: c.bl },
                  { label: "Top Companies", value: `${marketInsights.topHiringCompanies?.length || 0}+`, color: c.pp },
                ].map((item, i) => (
                  <motion.div key={i} variants={scaleIn} custom={i} className="p-4 rounded-2xl text-center"
                    style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: c.txM }}>{item.label}</p>
                    <p className="text-sm font-extrabold" style={{ color: item.color }}>{item.value}</p>
                  </motion.div>
                ))}
              </div>

              {marketInsights.topSkillCombinations?.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txM }}>Top Skill Combinations</h3>
                  <div className="flex flex-wrap gap-2">
                    {marketInsights.topSkillCombinations.map((s, i) => (
                      <span key={i} className="text-[11px] font-bold px-3 py-1.5 rounded-xl" style={{ background: c.amBg, color: c.am }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {marketInsights.interviewTrends?.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.txM }}>Interview Trends</h3>
                  <div className="space-y-1.5">
                    {marketInsights.interviewTrends.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: c.tx2 }}>
                        <TrendingUp size={12} style={{ color: c.gn }} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "coach" && coach && (
            <motion.div key="coach" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-5">
              <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.am }}>
                  <Brain size={14} /> AI Career Coach Feedback
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase mb-1.5" style={{ color: c.txM }}>Weekly Feedback</p>
                    <p className="text-xs leading-relaxed" style={{ color: c.tx }}>{coach.weeklyFeedback}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase mb-1.5" style={{ color: c.txM }}>Progress Summary</p>
                    <p className="text-xs leading-relaxed" style={{ color: c.tx }}>{coach.progressSummary}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase mb-1.5" style={{ color: c.gn }}>Motivation</p>
                    <p className="text-xs leading-relaxed italic" style={{ color: c.tx2 }}>&ldquo;{coach.motivationalGuidance}&rdquo;</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.gn }}>
                    <Target size={14} /> Focus Areas
                  </h3>
                  <div className="space-y-2">
                    {(coach.focusAreas || []).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium" style={{ background: c.gnBg, color: c.gn }}>
                        <CheckCircle size={12} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl" style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: c.rd }}>
                    <AlertTriangle size={14} /> Risks to Watch
                  </h3>
                  <div className="space-y-2">
                    {(coach.risks || []).map((r, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium" style={{ background: c.rdBg, color: c.rd }}>
                        <AlertTriangle size={12} /> {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl" style={{ background: `linear-gradient(135deg, ${c.am}10, ${c.pp}10)`, border: `1px solid ${c.am}30` }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: c.am }}>
                  <Zap size={14} /> Next Best Action
                </h3>
                <p className="text-sm font-bold" style={{ color: c.tx }}>{coach.nextBestAction}</p>
              </div>
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div key="history" initial="hidden" animate="visible" exit="hidden" variants={fadeUp} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.txM }}>Roadmap History</h3>
              {history.length === 0 ? (
                <EmptyState illustration={<History size={48} />} title="No roadmaps yet" description="Generate your first AI career roadmap to get started." />
              ) : (
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <motion.div key={h.id} variants={fadeUp} custom={i}
                      className="flex items-center justify-between p-4 rounded-2xl"
                      style={{ background: c.cb, border: `1px solid ${c.bd}`, boxShadow: c.cs }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.amBg }}>
                          <Compass size={18} style={{ color: c.am }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: c.tx }}>{h.targetRole}</p>
                          <p className="text-[10px]" style={{ color: c.txM }}>
                            {h.timeline} &middot; Score: {h.readinessScore}% &middot; {new Date(h.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.amBg, color: c.am }}>v{h.versionNumber}</span>
                        <button onClick={() => loadFromHistory(h.id)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: c.amBg, color: c.am }}>
                          View
                        </button>
                        <button onClick={() => deleteRoadmapAction(h.id)}
                          className="p-1.5 rounded-lg" style={{ color: c.rd }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
