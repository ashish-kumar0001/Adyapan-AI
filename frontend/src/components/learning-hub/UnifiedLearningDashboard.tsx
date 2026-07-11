"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";
import CountUp from "react-countup";
import {
  Clock, BookOpen, Cpu, Award, Zap, TrendingUp, AlertTriangle,
  CheckCircle2, ArrowRight, Sparkles, Calendar, Play, Check,
  Activity, Brain, ChevronRight, RefreshCw, Star, Trophy, BookMarked
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Task {
  id: string;
  topicName: string;
  scheduledDate: string;
  priority: "High" | "Critical" | "Important" | "Medium" | "Low";
  status: "Pending" | "Completed" | "In Progress";
  estimatedTime: number;
}

interface Revision {
  id: string;
  topicName: string;
  revisionDate: string;
  revisionType: string;
  status: "Pending" | "Completed";
}

interface WeakTopic {
  topicName: string;
  strengthScore: number;
  status: string;
  riskLevel: string;
  revisionPriority: string;
}

interface Recommendation {
  action: string;
  type: string;
  priority: string;
  reason: string;
}

interface HeatmapDay {
  date: string;
  count: number;
  points: number;
  details: string;
}

interface DashboardPayload {
  analytics: {
    learningScore: number;
    examReadiness: number;
    studyTimeMinutes: number;
    conceptsLearned: number;
    documentsCount: number;
    currentStreak: number;
    longestStreak: number;
  };
  progress: {
    overallProgress: number;
    learningLevel: number;
    learningLevelName: string;
    masteryScore: number;
    topicsCompleted: number;
    questionsPracticed: number;
    conceptMastery: { conceptName: string; masteryScore: number; status: string }[];
    milestones: { title: string; description: string; icon: string; unlocked: boolean }[];
    knowledgeGrowth: { period: string; conceptsLearned: number; questionsPracticed: number; topicsCompleted: number; documentsStudied: number }[];
  };
  planner: {
    plan: { title: string; completionPercentage: number; studyMode: string } | null;
    tasks: Task[];
    revisions: Revision[];
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    consistencyScore: number;
    points: number;
    habitAnalytics?: { preferredStudyTime: string; averageDailyUsage: number };
  };
  weak_topics: {
    weakTopics: WeakTopic[];
    examRisk: { riskLevel: string; riskScore: number };
  };
  recommendations: Recommendation[];
  dailyBrief: string;
}

// ─── Sub-Component: Typing AI Daily Brief ─────────────────────────────────────

function TypingAIBrief({ brief, isLightTheme }: { brief: string; isLightTheme: boolean }) {
  const lines = brief.split("\n").filter(line => line.trim().length > 0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentTypedText, setCurrentTypedText] = useState("");

  useEffect(() => {
    if (currentLineIndex >= lines.length) return;

    const textToType = lines[currentLineIndex];
    let i = 0;
    setCurrentTypedText("");

    const interval = setInterval(() => {
      if (i < textToType.length) {
        setCurrentTypedText(prev => prev + textToType.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        setDisplayedLines(prev => [...prev, textToType]);
        setCurrentTypedText("");
        setCurrentLineIndex(prev => prev + 1);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [currentLineIndex, lines]);

  return (
    <div className="space-y-3 font-semibold tracking-wide">
      {displayedLines.map((line, idx) => (
        <p
          key={idx}
          className={cn(
            "text-xs sm:text-sm leading-relaxed",
            isLightTheme ? "text-slate-700" : "text-white/80"
          )}
        >
          {line}
        </p>
      ))}
      {currentLineIndex < lines.length && (
        <p
          className={cn(
            "text-xs sm:text-sm leading-relaxed flex items-center",
            isLightTheme ? "text-slate-800" : "text-white"
          )}
        >
          {currentTypedText}
          <span
            className={cn(
              "w-1.5 h-4 inline-block animate-pulse ml-1 shrink-0",
              isLightTheme ? "bg-teal-650" : "bg-amber-500"
            )}
          />
        </p>
      )}
    </div>
  );
}

// ─── Main Unified Learning Dashboard Component ─────────────────────────────────

export function UnifiedLearningDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [theme, setTheme] = useState("dark");
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<90 | 180 | 365>(90);
  const [activeTrendMetric, setActiveTrendMetric] = useState<"studyTime" | "concepts" | "questions">("studyTime");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
      setTheme(savedTheme);

      const observer = new MutationObserver(() => {
        const t = document.documentElement.getAttribute("data-theme") ?? "dark";
        setTheme(t);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
    }
  }, []);

  const isLightTheme = theme === "light";

  // Initial load
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const headers = { "x-timezone": tz };

      const [dashRes, heatRes] = await Promise.all([
        api.get("/dashboard/learning", { headers }),
        api.get("/streak/heatmap?days=365", { headers })
      ]);

      setDashboardData(dashRes.data);
      setHeatmap(heatRes.data.heatmap || []);
    } catch (error) {
      console.error("Failed to load unified dashboard payload:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Complete study task action
  const handleCompleteTask = async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await api.post("/study-planner/task/complete", { taskId, status: "Completed" });
      await loadDashboard();
    } catch (err) {
      console.error("Error completing study task:", err);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const startStudySession = (task: Task) => {
    alert(`Starting focus session for: ${task.topicName} (${task.estimatedTime}m scheduled)`);
  };

  // Filter and display contribution heatmap
  const filteredHeatmap = () => {
    if (!heatmap.length) return [];
    return heatmap.slice(-timeRange);
  };

  const getHeatmapIntensity = (day: HeatmapDay) => {
    if (day.count === 0) {
      return isLightTheme
        ? "bg-slate-200/50 hover:bg-slate-350 border border-slate-350/5"
        : "bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.01]";
    }
    if (day.count <= 2) {
      return isLightTheme
        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
        : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-900/60";
    }
    if (day.count <= 5) {
      return isLightTheme
        ? "bg-emerald-300 text-emerald-900 hover:bg-emerald-400"
        : "bg-emerald-800/60 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-700";
    }
    return isLightTheme
      ? "bg-emerald-500 text-black border border-emerald-600 hover:bg-emerald-600 shadow-sm"
      : "bg-emerald-500 text-black border border-emerald-400 hover:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="animate-spin text-amber-500" size={32} />
        <span className={cn("text-sm font-bold", isLightTheme ? "text-slate-650" : "text-white/60")}>
          Loading your learning command center...
        </span>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { analytics, progress, planner, streak, weak_topics, recommendations, dailyBrief } = dashboardData;

  // Compile growth data for Recharts trends
  const trendData = progress?.knowledgeGrowth?.map(item => ({
    name: item.period,
    studyTime: Math.round((item.documentsStudied * 45 + item.conceptsLearned * 10) / 10) / 10,
    concepts: item.conceptsLearned,
    questions: item.questionsPracticed
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ─── TITLE / SUBTITLE HEADER ────────────────────────────────────────── */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Learning Command Center</span>
          <h2
            className={cn(
              "text-2xl font-black tracking-tight",
              isLightTheme ? "text-slate-900" : "text-white"
            )}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Unified Learning Hub
          </h2>
        </div>
        <button
          onClick={loadDashboard}
          className={cn(
            "p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer",
            isLightTheme
              ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              : "border-white/5 bg-white/[0.02] hover:bg-white/5 text-white/80"
          )}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ─── HERO OVERVIEW STATS (5 KEY METRICS) ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1: Learning Score Progress Ring */}
        <motion.div
          whileHover={{ y: -3 }}
          className={cn(
            "p-4 border rounded-2xl flex flex-col items-center justify-center text-center",
            isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
          )}
        >
          <span className="text-[9px] uppercase tracking-widest font-black text-white/40 mb-2">Learning Score</span>
          <div className="relative w-16 h-16 mb-1">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={isLightTheme ? "#f1f5f9" : "rgba(255,255,255,0.03)"} strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - (analytics?.learningScore || 80) / 100)}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-base font-black", isLightTheme ? "text-slate-900" : "text-white")}>
                <CountUp end={analytics?.learningScore || 84} duration={1.5} />
              </span>
            </div>
          </div>
          <span className="text-[9px] text-white/30 font-bold mt-1">Excellent Level</span>
        </motion.div>

        {/* Metric 2: Progress Percentage Ring */}
        <motion.div
          whileHover={{ y: -3 }}
          className={cn(
            "p-4 border rounded-2xl flex flex-col items-center justify-center text-center",
            isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
          )}
        >
          <span className="text-[9px] uppercase tracking-widest font-black text-white/40 mb-2">Overall Progress</span>
          <div className="relative w-16 h-16 mb-1">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={isLightTheme ? "#f1f5f9" : "rgba(255,255,255,0.03)"} strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - (progress?.overallProgress || 70) / 100)}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-base font-black", isLightTheme ? "text-slate-900" : "text-white")}>
                <CountUp end={progress?.overallProgress || 72} duration={1.5} suffix="%" />
              </span>
            </div>
          </div>
          <span className="text-[9px] text-white/30 font-bold mt-1">
            Level {progress?.learningLevel || 4} - {progress?.learningLevelName || "Achiever"}
          </span>
        </motion.div>

        {/* Metric 3: Exam Readiness Ring */}
        <motion.div
          whileHover={{ y: -3 }}
          className={cn(
            "p-4 border rounded-2xl flex flex-col items-center justify-center text-center",
            isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
          )}
        >
          <span className="text-[9px] uppercase tracking-widest font-black text-white/40 mb-2">Exam Readiness</span>
          <div className="relative w-16 h-16 mb-1">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={isLightTheme ? "#f1f5f9" : "rgba(255,255,255,0.03)"} strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - (analytics?.examReadiness || 75) / 100)}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-base font-black", isLightTheme ? "text-slate-900" : "text-white")}>
                <CountUp end={analytics?.examReadiness || 78} duration={1.5} suffix="%" />
              </span>
            </div>
          </div>
          <span className="text-[9px] text-white/30 font-bold mt-1">Target Score Ready</span>
        </motion.div>

        {/* Metric 4: Streak Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className={cn(
            "p-4 border rounded-2xl flex flex-col justify-between items-center text-center h-[134px]",
            isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
          )}
        >
          <span className="text-[9px] uppercase tracking-widest font-black text-white/40">Current Streak</span>
          <div className="relative flex items-center justify-center flex-1 my-1">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-orange-500 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]"
            >
              <Zap size={38} className="fill-orange-500" />
            </motion.div>
            <span className="absolute text-sm font-black text-white bottom-1">
              {streak?.currentStreak || 17}
            </span>
          </div>
          <span className={cn("text-xs font-black", isLightTheme ? "text-slate-800" : "text-white")}>
            {streak?.currentStreak || 17} Days
          </span>
        </motion.div>

        {/* Metric 5: Study Time Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className={cn(
            "p-4 border rounded-2xl flex flex-col justify-between items-center text-center h-[134px]",
            isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
          )}
        >
          <span className="text-[9px] uppercase tracking-widest font-black text-white/40">Study Time</span>
          <div className="relative flex items-center justify-center flex-1 my-1 text-teal-400">
            <Clock size={36} className="filter drop-shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
          </div>
          <span className={cn("text-xs font-black", isLightTheme ? "text-slate-800" : "text-white")}>
            <CountUp end={Math.round((analytics?.studyTimeMinutes || 2520) / 60)} duration={1.5} /> Hours
          </span>
        </motion.div>
      </div>

      {/* ─── TWO COLUMN DETAILED SECTIONS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main widgets & planner) */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Daily Brief Card */}
          <div className="p-5 border border-amber-500/15 rounded-3xl bg-gradient-to-br from-amber-500/[0.03] to-amber-500/[0.01] backdrop-blur-md relative overflow-hidden">
            <div className="absolute right-[-4%] top-[-4%] w-32 h-32 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-amber-500 animate-pulse" size={16} />
              <h4 className={cn("text-xs font-extrabold uppercase tracking-wider", isLightTheme ? "text-slate-700" : "text-white")}>
                AI Learning Coach Daily Brief
              </h4>
            </div>
            {dailyBrief && <TypingAIBrief brief={dailyBrief} isLightTheme={isLightTheme} />}
          </div>

          {/* Today's Study Plan Widget */}
          <div
            className={cn(
              "p-5 border rounded-3xl backdrop-blur-md",
              isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
            )}
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h4 className={cn("text-sm font-black flex items-center gap-2", isLightTheme ? "text-slate-800" : "text-white")}>
                <BookMarked size={16} className="text-violet-500" /> Today's Study Plan
              </h4>
              {planner?.plan && (
                <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", isLightTheme ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.02] border-white/5 text-white/50")}>
                  {planner.plan.title} ({planner.plan.completionPercentage}% done)
                </span>
              )}
            </div>

            {(!planner?.tasks || planner.tasks.length === 0) && (!planner?.revisions || planner.revisions.length === 0) ? (
              <div className="text-center py-6 text-white/30 text-xs font-bold">
                No tasks scheduled for today. Generate a study plan to start!
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Regular Tasks */}
                {planner?.tasks?.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors",
                      isLightTheme ? "border-slate-100 bg-slate-50/50" : "border-white/5 bg-white/[0.01]"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-black", isLightTheme ? "text-slate-800" : "text-white")}>{task.topicName}</span>
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          task.priority === "Critical" || task.priority === "High"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/30 block mt-1">Duration: {task.estimatedTime} mins</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {task.status !== "Completed" ? (
                        <>
                          <button
                            onClick={() => startStudySession(task)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-[10px] font-bold text-white/80 transition-colors cursor-pointer"
                          >
                            <Play size={10} className="text-teal-500" /> Start Focus
                          </button>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTaskId === task.id}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-black text-[10px] font-black cursor-pointer shadow-[0_0_12px_rgba(20,184,166,0.2)]"
                          >
                            {completingTaskId === task.id ? (
                              <RefreshCw size={10} className="animate-spin" />
                            ) : (
                              <Check size={10} />
                            )}
                            Done
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-500 flex items-center gap-1.5 text-xs font-bold pr-2">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Spaced Repetition Revisions */}
                {planner?.revisions?.map((rev) => (
                  <div
                    key={rev.id}
                    className={cn(
                      "p-3 rounded-2xl border border-dashed flex justify-between items-center",
                      isLightTheme ? "border-slate-200 bg-teal-50/20" : "border-teal-500/15 bg-teal-950/5"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-400">Spaced Revision: {rev.topicName}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300">
                          {rev.revisionType}
                        </span>
                      </div>
                    </div>
                    {rev.status === "Pending" ? (
                      <button
                        onClick={() => alert(`Review revision items for: ${rev.topicName}`)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 text-[10px] font-bold text-teal-300 cursor-pointer"
                      >
                        Start Revision
                      </button>
                    ) : (
                      <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learning Activity Heatmap (GitHub-style calendar calendar) */}
          <div
            className={cn(
              "rounded-3xl border p-5 space-y-5 transition-colors",
              isLightTheme ? "border-slate-200 bg-white/70" : "border-white/5 bg-[#0e0d1b]/60"
            )}
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
              <div>
                <h3 className={cn("text-sm font-black flex items-center gap-2", isLightTheme ? "text-slate-800" : "text-white")}>
                  <Calendar size={16} className="text-orange-500" /> Learning Contribution Heatmap
                </h3>
                <p className={cn("text-[10px] mt-0.5", isLightTheme ? "text-slate-400" : "text-white/40")}>
                  Daily activity logs (uploads, planner ticks, quiz reviews, notes).
                </p>
              </div>

              <div className={cn(
                "flex p-0.5 rounded-xl border transition-colors self-start sm:self-center",
                isLightTheme ? "border-slate-200 bg-slate-100" : "border-white/5 bg-white/[0.02]"
              )}>
                {([90, 180, 365] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                      timeRange === r
                        ? "bg-orange-500 text-black shadow-sm"
                        : (isLightTheme ? "text-slate-500 hover:text-slate-900" : "text-white/50 hover:text-white")
                    )}
                  >
                    {r} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Container */}
            <div className="overflow-x-auto pb-1 custom-scrollbar">
              <div className="min-w-[700px] flex gap-2 pt-1">
                <div className={cn("grid grid-rows-7 text-[8px] font-bold pr-1 select-none justify-between h-[84px] py-0.5", isLightTheme ? "text-slate-400" : "text-white/30")}>
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                  <span>Sun</span>
                </div>
                <div
                  className="grid gap-1.5 h-[84px] flex-grow"
                  style={{
                    gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                    gridAutoFlow: "column",
                  }}
                >
                  {filteredHeatmap().map((day, idx) => {
                    const colorClass = getHeatmapIntensity(day);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "w-[10px] h-[10px] rounded-[2px] transition-all cursor-pointer relative group",
                          colorClass
                        )}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 rounded-lg bg-zinc-950/95 border border-white/10 text-[9px] text-white font-medium shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all z-30 leading-normal">
                          <div className="font-bold text-white/90 border-b border-white/5 pb-1 mb-1">
                            {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div>{day.details || "No activity logged"}</div>
                          {day.count > 0 && (
                            <div className="text-orange-400 font-semibold mt-1">
                              +{day.points} XP · {day.count} actions
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Heatmap Footer Legend */}
            <div className={cn("flex justify-between items-center text-[9px] select-none pt-2 border-t border-white/5", isLightTheme ? "text-slate-400" : "text-white/30")}>
              <span>{filteredHeatmap().length > 0 ? new Date(filteredHeatmap()[0].date).toLocaleDateString() : ""}</span>
              <div className="flex items-center gap-1">
                <span>Less</span>
                <div className={cn("w-[8px] h-[8px] rounded-[1px]", isLightTheme ? "bg-slate-200" : "bg-white/[0.02]")} />
                <div className="w-[8px] h-[8px] rounded-[1px] bg-emerald-900/20 border border-emerald-500/10" />
                <div className="w-[8px] h-[8px] rounded-[1px] bg-emerald-800/60 border border-emerald-500/20" />
                <div className="w-[8px] h-[8px] rounded-[1px] bg-emerald-555" />
                <span>More</span>
              </div>
              <span>Today</span>
            </div>
          </div>

          {/* Learning Trends SVG Charts */}
          <div
            className={cn(
              "p-5 border rounded-3xl backdrop-blur-md",
              isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
            )}
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h4 className={cn("text-sm font-black flex items-center gap-2", isLightTheme ? "text-slate-800" : "text-white")}>
                <Activity size={16} className="text-teal-500" /> Learning Trends
              </h4>
              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 p-0.5 rounded-lg text-[9px] font-black text-white/60">
                {([
                  { key: "studyTime", label: "Study Time" },
                  { key: "concepts", label: "Concepts" },
                  { key: "questions", label: "Questions" }
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTrendMetric(tab.key)}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all cursor-pointer",
                      activeTrendMetric === tab.key
                        ? "bg-amber-500 text-slate-900 font-extrabold"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {trendData.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-xs font-bold">
                Study more topics to visualize weekly learning trend lines.
              </div>
            ) : (
              <div className="w-full h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isLightTheme ? "#0d9488" : "#f59e0b"} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={isLightTheme ? "#0d9488" : "#f59e0b"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#f1f5f9" : "rgba(255,255,255,0.03)"} />
                    <XAxis
                      dataKey="name"
                      stroke={isLightTheme ? "#94a3b8" : "rgba(255,255,255,0.3)"}
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isLightTheme ? "#94a3b8" : "rgba(255,255,255,0.3)"}
                      fontSize={9}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isLightTheme ? "#fff" : "#0f0e1c",
                        borderColor: isLightTheme ? "#e2e8f0" : "rgba(255,255,255,0.08)",
                        color: isLightTheme ? "#334155" : "#fff",
                        fontSize: 10,
                        borderRadius: 12
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeTrendMetric}
                      stroke={isLightTheme ? "#0d9488" : "#f59e0b"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Weak topics, risk score & recommendations checklist) */}
        <div className="space-y-6">
          {/* Exam Readiness Factors widget */}
          <div
            className={cn(
              "p-5 border rounded-3xl backdrop-blur-md",
              isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
            )}
          >
            <h4 className={cn("text-sm font-black flex items-center gap-2 mb-3 pb-2 border-b border-white/5", isLightTheme ? "text-slate-800" : "text-white")}>
              <Trophy size={16} className="text-emerald-500" /> Readiness Risk Factors
            </h4>
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-white/50 text-[10px] mb-1">
                  <span>Topic Coverage</span>
                  <span className={cn(isLightTheme ? "text-slate-800" : "text-white")}>85%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-white/50 text-[10px] mb-1">
                  <span>Spaced Revision Rate</span>
                  <span className={cn(isLightTheme ? "text-slate-800" : "text-white")}>70%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: "70%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-white/50 text-[10px] mb-1">
                  <span>Practice Questions Completed</span>
                  <span className={cn(isLightTheme ? "text-slate-800" : "text-white")}>60%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "60%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-white/50 text-[10px] mb-1">
                  <span>Weak Topic Control</span>
                  <span className={cn(isLightTheme ? "text-slate-800" : "text-white")}>80%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Weak Topics Widget */}
          <div
            className={cn(
              "p-5 border rounded-3xl backdrop-blur-md",
              isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
            )}
          >
            <h4 className={cn("text-sm font-black flex items-center gap-2 mb-3 pb-2 border-b border-white/5", isLightTheme ? "text-slate-800" : "text-white")}>
              <Brain size={16} className="text-rose-500" /> Weak Topics Engine
            </h4>

            {!weak_topics?.weakTopics || weak_topics.weakTopics.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-xs font-bold">
                No weak topics detected. Great job maintaining mastery!
              </div>
            ) : (
              <div className="space-y-3">
                {weak_topics.weakTopics.slice(0, 3).map((wt) => (
                  <div
                    key={wt.topicName}
                    className={cn(
                      "p-3 rounded-2xl border flex items-center justify-between gap-3",
                      isLightTheme ? "border-slate-100 bg-slate-50/50" : "border-white/5 bg-white/[0.01]"
                    )}
                  >
                    <div>
                      <span className={cn("text-xs font-black block", isLightTheme ? "text-slate-800" : "text-white")}>
                        {wt.topicName}
                      </span>
                      <span className="text-[10px] text-white/30 block mt-0.5">Strength Score: {wt.strengthScore}%</span>
                    </div>

                    <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      wt.revisionPriority === "Immediate" || wt.revisionPriority === "Critical"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                      {wt.revisionPriority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendations Checklist */}
          <div
            className={cn(
              "p-5 border rounded-3xl backdrop-blur-md relative overflow-hidden",
              isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
            )}
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-full blur-[50px] pointer-events-none" />
            <h4 className={cn("text-sm font-black flex items-center gap-2 mb-3 pb-2 border-b border-white/5", isLightTheme ? "text-slate-800" : "text-white")}>
              <Sparkles size={16} className="text-amber-500 animate-pulse" /> Action Recommendations
            </h4>

            {recommendations.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-xs font-bold">
                All studied topics are fresh and up to date. Excellent!
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-2xl border",
                      isLightTheme ? "border-slate-100 bg-slate-50/50" : "border-white/5 bg-white/[0.01]"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={13} />
                      <div>
                        <span className={cn("text-xs font-black leading-tight block", isLightTheme ? "text-slate-800" : "text-white")}>
                          {rec.action}
                        </span>
                        <span className="text-[10px] text-white/30 leading-snug block mt-1">Reason: {rec.reason}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Log */}
          <div
            className={cn(
              "p-5 border rounded-3xl backdrop-blur-md",
              isLightTheme ? "bg-white border-slate-200" : "bg-white/[0.01] border-white/5"
            )}
          >
            <h4 className={cn("text-sm font-black flex items-center gap-2 mb-3 pb-2 border-b border-white/5", isLightTheme ? "text-slate-800" : "text-white")}>
              <Activity size={16} className="text-sky-500" /> Recent Hub Activity
            </h4>
            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className={cn("font-bold block", isLightTheme ? "text-slate-700" : "text-white/80")}>Generated Revision Notes</span>
                  <span className="text-[10px] text-white/30">2 Hours Ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className={cn("font-bold block", isLightTheme ? "text-slate-700" : "text-white/80")}>Completed Study Plan Task</span>
                  <span className="text-[10px] text-white/30">Yesterday</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className={cn("font-bold block", isLightTheme ? "text-slate-700" : "text-white/80")}>Practiced DSA Problems</span>
                  <span className="text-[10px] text-white/30">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
