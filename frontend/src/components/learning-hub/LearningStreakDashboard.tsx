"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import confetti from "canvas-confetti";
import CountUp from "react-countup";
import {
  Flame,
  Trophy,
  Activity,
  Award,
  Download,
  Share2,
  Lock,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Brain,
  Sparkles,
  Info,
  Calendar,
  X,
  FileSpreadsheet,
  Clock,
  Zap
} from "lucide-react";

import { cn } from "@/lib/cn";

// Milestone Achievement Icons
const rarityColors = {
  Common: "from-zinc-500/20 to-zinc-600/30 border-zinc-500/30 text-zinc-300",
  Rare: "from-blue-500/20 to-indigo-600/30 border-blue-500/30 text-blue-300",
  Epic: "from-purple-500/20 to-pink-600/30 border-purple-500/30 text-purple-300",
  Legendary: "from-amber-500/25 to-yellow-600/35 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
};

interface Achievement {
  name: string;
  type: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  days: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface HeatmapDay {
  date: string;
  count: number;
  points: number;
  details: string;
}

interface DashboardData {
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number;
  activeDaysCount: number;
  monthlyActiveCount: number;
  monthlyTotalDays: number;
  previousStreak: number;
  streakRule: string;
  timeRequirement: number;
  streakFreezes: number;
  freezeActive: boolean;
  points: number;
  globalRank: number | null;
  campusRank: number | null;
  weeklyReport: { day: string; active: boolean; date: string }[];
  monthlyReport: {
    activeDays: number;
    missedDays: number;
    averageSessionDuration: number;
    mostActiveDay: string;
    leastActiveDay: string;
  };
  habitAnalytics: {
    preferredStudyTime: string;
    mostActiveDay: string;
    mostProductiveDay: string;
    averageDailyUsage: number;
  };
  recentAchievements: {
    achievementName: string;
    achievementType: string;
    rarity: string;
    unlockedAt: string;
  }[];
  motivationalMessage: string;
}

export function LearningStreakDashboard() {
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [insights, setInsights] = useState<{
    habitAnalysis: string;
    suggestions: string[];
    motivationalMessage: string;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<90 | 180 | 365>(180);
  const [timezone, setTimezone] = useState("UTC");
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadingChecklist = [
    "Analyzing Learning Activity",
    "Calculating Current Streak",
    "Measuring Consistency",
    "Generating Insights",
    "Preparing Achievements",
    "Complete"
  ];

  // 1. Setup client-side timezone query
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(tz || "UTC");
      } catch (e) {
        setTimezone("UTC");
      }
    }
  }, []);

  // 2. Initial data loading sequence
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingChecklist.length - 2) return prev + 1;
        return prev;
      });
    }, 700);

    const fetchData = async () => {
      try {
        const headers = { "x-timezone": timezone };
        
        // Fetch dashboard stats
        const dashRes = await api.get("/streak/dashboard", { headers });
        // Fetch achievements
        const achRes = await api.get("/streak/achievements");
        // Fetch heatmap (max range 365)
        const heatRes = await api.get(`/streak/heatmap?days=365`, { headers });

        if (active) {
          setData(dashRes.data.data);
          setAchievements(achRes.data.achievements);
          setHeatmap(heatRes.data.heatmap);
          
          setLoadingStep(loadingChecklist.length - 1);
          setTimeout(() => {
            setLoading(false);
          }, 400);

          // Confetti celebration if streak is hot!
          if (dashRes.data.data.currentStreak > 0) {
            setTimeout(() => {
              fireConfettiCelebration();
            }, 800);
          }
        }
      } catch (err) {
        console.error("Failed to load learning streak data:", err);
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
      clearInterval(stepInterval);
    };
  }, [timezone]);

  // Fetch AI insights separately on demand or after initial dashboard load
  const loadInsights = async () => {
    if (insightsLoading) return;
    setInsightsLoading(true);
    try {
      const headers = { "x-timezone": timezone };
      const res = await api.get("/streak/insights", { headers });
      setInsights(res.data.insights);
    } catch (error) {
      console.error("Failed to generate AI insights:", error);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && data) {
      loadInsights();
    }
  }, [loading]);

  const fireConfettiCelebration = () => {
    const end = Date.now() + 1.2 * 1000;
    const colors = ["#f59e0b", "#f97316", "#ef4444", "#a78bfa"];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Export functions (self-contained client-side CSV downloads)
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStreakReport = () => {
    if (!data) return;
    let csv = "Metric,Value\n";
    csv += `Current Streak,${data.currentStreak} Days\n`;
    csv += `Longest Streak,${data.longestStreak} Days\n`;
    csv += `Consistency Score,${data.consistencyScore}%\n`;
    csv += `Total Active Days,${data.activeDaysCount}\n`;
    csv += `Learning Points,${data.points}\n`;
    csv += `Rule Configuration,${data.streakRule === "action" ? "1 Action = Active Day" : `Minimum ${data.timeRequirement} mins activity`}\n`;
    downloadCSV(csv, "adyapan_streak_report.csv");
  };

  const handleExportConsistencyReport = () => {
    if (!data) return;
    let csv = "Metric,Count/Performance\n";
    csv += `Active Days (Current Month),${data.monthlyReport.activeDays}\n`;
    csv += `Missed Days (Current Month),${data.monthlyReport.missedDays}\n`;
    csv += `Average Session Duration,${data.monthlyReport.averageSessionDuration} mins\n`;
    csv += `Most Productive Day,${data.monthlyReport.mostActiveDay}\n`;
    csv += `Weekly Activity Score,${data.weeklyReport.filter(d=>d.active).length}/7 active\n`;
    downloadCSV(csv, "adyapan_consistency_report.csv");
  };

  const handleExportHabitReport = () => {
    if (!data) return;
    let csv = "Habit Dimension,Details\n";
    csv += `Preferred Study Time,${data.habitAnalytics.preferredStudyTime}\n`;
    csv += `Most Active Day,${data.habitAnalytics.mostActiveDay}\n`;
    csv += `Most Productive Day,${data.habitAnalytics.mostProductiveDay}\n`;
    csv += `Average Daily Interactions,${data.habitAnalytics.averageDailyUsage}\n`;
    downloadCSV(csv, "adyapan_habit_analytics.csv");
  };

  const handleExportAchievementsSummary = () => {
    let csv = "Achievement Name,Rarity,Status,Unlock Date\n";
    achievements.forEach(ach => {
      csv += `"${ach.name}","${ach.rarity}","${ach.unlocked ? "Unlocked" : "Locked"}","${ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : "-"}"\n`;
    });
    downloadCSV(csv, "adyapan_achievements_summary.csv");
  };

  // HTML5 Canvas dynamic drawing of Share Streak Card
  const generateShareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset size for premium scaling (retina export)
    canvas.width = 600;
    canvas.height = 400;

    // 1. Draw premium background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, "#080710");
    gradient.addColorStop(0.5, "#151329");
    gradient.addColorStop(1, "#0d0b16");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // 2. Draw outer glass border
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeRect(10, 10, 580, 380);

    // 3. Draw aurora orbs
    ctx.beginPath();
    ctx.arc(500, 100, 120, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
    ctx.filter = "blur(60px)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(100, 300, 100, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
    ctx.filter = "blur(50px)";
    ctx.fill();
    ctx.filter = "none"; // Reset filter

    // 4. Logo header
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("ADYAPAN AI", 40, 50);

    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("AI ACCELERATOR ENGINE", 40, 68);

    // 5. Fire flame emblem (SVG Path outline drawn or plain graphic)
    // Draw a burning circle graphic
    ctx.beginPath();
    ctx.arc(160, 220, 65, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(249, 115, 22, 0.08)";
    ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fill();

    // Text for Streak
    ctx.font = "black 80px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(String(data.currentStreak), 160, 235);

    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = "#fb7185";
    ctx.fillText("🔥 DAYS STREAK", 160, 275);

    // 6. Right side details
    ctx.textAlign = "left";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("LONG RECORD", 340, 150);

    ctx.font = "black 32px Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${data.longestStreak} Days`, 340, 185);

    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("CONSISTENCY SCORE", 340, 240);

    ctx.font = "black 32px Inter, sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText(`${data.consistencyScore}%`, 340, 275);

    // 7. Footer quote
    ctx.font = "italic 12px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText('"Learning becomes effective when it becomes a habit."', 340, 335);

    ctx.font = "bold 9px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fillText("GENERATE YOUR OWN AT ADYAPAN.COM", 40, 360);
  };

  useEffect(() => {
    if (sharingModalOpen) {
      setTimeout(() => {
        generateShareCard();
      }, 300);
    }
  }, [sharingModalOpen, data]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `adyapan_streak_${data?.currentStreak}_days.png`;
    link.href = url;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        alert("📋 Copied to clipboard! You can now paste it into Discord, Slack, or Twitter.");
      });
    } catch (e) {
      alert("Browser blocked clipboard write. Please download the image instead!");
    }
  };

  // Filter heatmap based on range
  const filteredHeatmap = () => {
    if (!heatmap.length) return [];
    return heatmap.slice(-timeRange);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center relative">
        <div className="max-w-md w-full p-8 rounded-2xl border border-white/5 bg-[#0e0d1b]/70 backdrop-blur-xl flex flex-col items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-8"
          >
            <Flame size={32} className="fill-orange-500/10" />
          </motion.div>
          
          <h2 className="text-xl font-bold tracking-tight text-white mb-6">Analyzing Activity Logs</h2>
          
          <div className="w-full space-y-3.5">
            {loadingChecklist.slice(0, -1).map((step, idx) => {
              const active = idx === loadingStep;
              const done = idx < loadingStep;
              return (
                <div key={idx} className="flex items-center gap-3.5 text-sm">
                  {done ? (
                    <CheckCircle size={16} className="text-emerald-500" />
                  ) : active ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      className="w-4 h-4 rounded-full border border-t-transparent border-orange-500"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/10" />
                  )}
                  <span className={cn(
                    "font-medium transition-colors",
                    done ? "text-white/60" : active ? "text-orange-400 font-bold" : "text-white/20"
                  )}>
                    {step}...
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6">
          <Info size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Failed to load streak dashboard</h2>
        <p className="text-sm text-white/50 max-w-sm mb-6 leading-relaxed">
          There was an error communicating with the Adyapan AI servers. Please ensure your backend server is running and database is fully active.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-orange-500/20 active:scale-95"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      
      {/* ─── Hero Stats Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Current Streak */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-orange-950/20 to-red-950/20 p-6 flex flex-col justify-between h-[230px]"
        >
          {/* Flame aura backglow */}
          <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[70%] rounded-full bg-radial-gradient from-orange-500/15 via-orange-500/5 to-transparent blur-[40px] pointer-events-none" />
          
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-[10px] text-orange-400 font-extrabold tracking-widest uppercase flex items-center gap-1.5">
                <Zap size={10} className="fill-orange-400" /> Active learning streak
              </span>
              <h3 className="text-sm font-bold text-white/50 mt-1">Current Streak</h3>
            </div>
            
            <motion.div 
              animate={{ 
                scale: [1, 1.08, 1], 
                y: [0, -3, 0],
                filter: ["drop-shadow(0 0 4px rgba(249,115,22,0.2))", "drop-shadow(0 0 16px rgba(249,115,22,0.5))", "drop-shadow(0 0 4px rgba(249,115,22,0.2))"]
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400"
            >
              <Flame size={24} className="fill-orange-400/10" />
            </motion.div>
          </div>

          <div className="z-10 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter text-white">
                <CountUp start={0} end={data.currentStreak} duration={1.5} />
              </span>
              <span className="text-xl font-bold text-orange-400">Days</span>
            </div>
            
            <p className="text-xs text-white/60 font-medium mt-2 leading-relaxed max-w-sm">
              {data.motivationalMessage}
            </p>
          </div>

          <div className="flex gap-4 items-center mt-2 z-10 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-white/40">
              <Clock size={11} /> 
              Rule: <span className="text-white/60">{data.streakRule === "action" ? "1 Action = Active Day" : `>= ${data.timeRequirement} mins`}</span>
            </div>
            {data.streakFreezes > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-400 font-extrabold tracking-wider uppercase">
                ❄️ Streak Freeze Active
              </span>
            )}
          </div>
        </motion.div>

        {/* Longest Streak */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 flex flex-col justify-between h-[230px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-white/40">Longest Streak</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <Trophy size={18} />
            </div>
          </div>
          
          <div>
            <div className="text-4xl font-extrabold tracking-tight text-white">
              <CountUp start={0} end={data.longestStreak} duration={1.5} /> Days
            </div>
            <p className="text-xs text-white/40 mt-1">Your record since registering.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 flex items-center justify-between text-xs text-white/50">
            <span>Previous record:</span>
            <strong className="text-white">{data.previousStreak} Days</strong>
          </div>
        </motion.div>

        {/* Consistency Score Circular Ring */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 flex flex-col justify-between h-[230px] items-center text-center"
        >
          <span className="text-xs font-bold text-white/40 w-full text-left">Consistency Score</span>
          
          <div className="relative w-28 h-28 flex items-center justify-center my-1.5">
            {/* SVG circle logic */}
            <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${data.consistencyScore}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-emerald-500"
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{data.consistencyScore}%</span>
              <span className="text-[9px] font-bold text-emerald-400/80 tracking-widest uppercase">rolling</span>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-400">
            {data.consistencyScore >= 80 ? "Learning Machine" : 
             data.consistencyScore >= 60 ? "Consistent Learner" :
             data.consistencyScore >= 40 ? "Building Habit" : "Getting Started"}
          </div>
        </motion.div>
      </div>

      {/* ─── Contribution Calendar Heatmap ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar size={18} className="text-orange-400" /> Learning Contribution Heatmap
            </h3>
            <p className="text-xs text-white/40 mt-1">Track the volume of daily uploads, generations, planner commits, and chats.</p>
          </div>

          {/* Time range toggle */}
          <div className="flex p-0.5 rounded-xl border border-white/5 bg-white/[0.02] self-start sm:self-center">
            {([90, 180, 365] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  timeRange === r ? "bg-orange-500 text-black" : "text-white/50 hover:text-white"
                )}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Grid Calendar */}
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="min-w-[800px] flex gap-2 pt-2">
            
            {/* Days labels */}
            <div className="grid grid-rows-7 text-[9px] font-bold text-white/30 pr-2 select-none justify-between h-[96px] py-0.5">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Grid wrapping cells */}
            <div 
              className="grid gap-1.5 h-[96px] flex-grow"
              style={{
                gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                gridAutoFlow: "column",
              }}
            >
              {filteredHeatmap().map((day, idx) => {
                // Determine block color intensity
                const intensity = 
                  day.count === 0 ? "bg-white/[0.02] hover:bg-white/[0.08]" :
                  day.count <= 2 ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-900/60" :
                  day.count <= 5 ? "bg-emerald-800/60 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-700" :
                  "bg-emerald-500 text-black border border-emerald-400 hover:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]";

                return (
                  <div
                    key={idx}
                    className={cn(
                      "w-[12px] h-[12px] rounded-[3px] transition-all cursor-pointer relative group",
                      intensity
                    )}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-zinc-950/95 border border-white/10 text-[10px] text-white font-medium shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all z-30 leading-normal">
                      <div className="font-bold text-white/90 border-b border-white/5 pb-1 mb-1">
                        {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div>{day.details || "No activity logged"}</div>
                      {day.count > 0 && (
                        <div className="text-orange-400 font-semibold mt-1">
                          +{day.points} XP · {day.count} action{day.count > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-between items-center text-[10px] text-white/30 select-none pt-2 border-t border-white/5">
          <span>{filteredHeatmap().length > 0 ? new Date(filteredHeatmap()[0].date).toLocaleDateString() : ""}</span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.02]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-950/40 border border-emerald-500/10" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-800/60 border border-emerald-500/20" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500" />
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </motion.div>

      {/* ─── Two-Column Section: Reports & Insights ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Reports */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Consistency Reports */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 space-y-6"
          >
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Activity size={18} className="text-orange-400" /> Weekly & Monthly Activity Reports
              </h3>
              <p className="text-xs text-white/40 mt-1">Your consistency performance evaluated week-over-week.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Weekly Tracker */}
              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                <h4 className="text-xs font-extrabold text-white/70 uppercase tracking-wider">Weekly Streak Status</h4>
                
                <div className="flex justify-between items-center">
                  {data.weeklyReport.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-white/30">{day.day}</span>
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all border",
                        day.active 
                          ? "bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]" 
                          : "bg-white/[0.01] border-white/5 text-white/20"
                      )}>
                        {day.active ? "✓" : "✕"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-white/40 flex justify-between items-center select-none pt-2">
                  <span>Weekly completion score:</span>
                  <strong className="text-orange-400">{Math.round((data.weeklyReport.filter(d=>d.active).length / 7) * 100)}%</strong>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between">
                <h4 className="text-xs font-extrabold text-white/70 uppercase tracking-wider mb-2">Monthly Consistency</h4>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-lg font-bold text-white">{data.monthlyReport.activeDays}</span>
                    <p className="text-[9px] font-semibold text-white/30 uppercase mt-0.5">Active Days</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-lg font-bold text-rose-500">{data.monthlyReport.missedDays}</span>
                    <p className="text-[9px] font-semibold text-white/30 uppercase mt-0.5">Missed</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-lg font-bold text-orange-400">{data.monthlyReport.averageSessionDuration}m</span>
                    <p className="text-[9px] font-semibold text-white/30 uppercase mt-0.5">Avg Time</p>
                  </div>
                </div>

                <div className="text-xs text-white/40 flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                  <span>Active day rule:</span>
                  <span className="text-white/60 font-bold">{data.streakRule === "action" ? "1 Action (Min)" : `>= ${data.timeRequirement}m`}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Habit Analytics */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 space-y-6"
          >
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-400" /> Learning Habit Analytics
              </h3>
              <p className="text-xs text-white/40 mt-1">Detailed breakdown of study timers and source activity.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-1">
                <span className="text-[10px] font-bold text-white/30 uppercase">Preferred Time</span>
                <div className="text-base font-extrabold text-white">{data.habitAnalytics.preferredStudyTime}</div>
                <div className="text-[9px] text-white/30">Peak action hours</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-1">
                <span className="text-[10px] font-bold text-white/30 uppercase">Most Active Day</span>
                <div className="text-base font-extrabold text-white">{data.habitAnalytics.mostActiveDay}</div>
                <div className="text-[9px] text-white/30">Highest volume day</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-1">
                <span className="text-[10px] font-bold text-white/30 uppercase">Productive Day</span>
                <div className="text-base font-extrabold text-white">{data.habitAnalytics.mostProductiveDay}</div>
                <div className="text-[9px] text-white/30">Highest XP/points day</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-1">
                <span className="text-[10px] font-bold text-white/30 uppercase">Avg Usage/Day</span>
                <div className="text-base font-extrabold text-orange-400">{data.habitAnalytics.averageDailyUsage}</div>
                <div className="text-[9px] text-white/30">Generations/Sessions</div>
              </div>

            </div>
          </motion.div>

        </div>

        {/* Column 3: AI Insights & Quick Action Exports */}
        <div className="space-y-6">
          
          {/* AI Insights Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-3xl border border-orange-500/10 bg-gradient-to-br from-violet-950/10 to-orange-950/10 p-6 space-y-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 text-orange-400 opacity-20 pointer-events-none">
              <Brain size={80} />
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/20 text-orange-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">AI Habit Insights</h3>
                <p className="text-[10px] text-white/40">Personalized behavior analytics</p>
              </div>
            </div>

            <div className="space-y-4 z-10 relative">
              {insightsLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-white/40">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-5 h-5 rounded-full border border-t-transparent border-orange-500"
                  />
                  <span className="text-xs font-medium">Drafting advice...</span>
                </div>
              ) : insights ? (
                <>
                  <div className="text-xs text-white/70 leading-relaxed font-medium">
                    {insights.habitAnalysis}
                  </div>
                  
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Recommendations</span>
                    {insights.suggestions.map((sug, i) => (
                      <div key={i} className="flex gap-2 text-xs font-semibold text-orange-400/90 leading-normal">
                        <span className="text-orange-500">•</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-white/30 space-y-3">
                  <p>Insights require study activity logs.</p>
                  <button 
                    onClick={loadInsights}
                    className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    Analyze Logs
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Export & Sharing Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-white">Exports & Reporting</h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => setSharingModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-extrabold cursor-pointer transition-all shadow-lg hover:shadow-orange-500/20"
              >
                <Share2 size={14} /> Share Streak Card
              </button>

              <button 
                onClick={handleExportStreakReport}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] text-xs text-white/70 hover:text-white cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2 font-bold"><FileSpreadsheet size={13} className="text-orange-400" /> Export Streak Report</span>
                <Download size={13} className="opacity-40" />
              </button>

              <button 
                onClick={handleExportConsistencyReport}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] text-xs text-white/70 hover:text-white cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2 font-bold"><Activity size={13} className="text-emerald-400" /> Export Consistency</span>
                <Download size={13} className="opacity-40" />
              </button>

              <button 
                onClick={handleExportHabitReport}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] text-xs text-white/70 hover:text-white cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2 font-bold"><TrendingUp size={13} className="text-blue-400" /> Export Habits</span>
                <Download size={13} className="opacity-40" />
              </button>

              <button 
                onClick={handleExportAchievementsSummary}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] text-xs text-white/70 hover:text-white cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2 font-bold"><Award size={13} className="text-purple-400" /> Export Achievements</span>
                <Download size={13} className="opacity-40" />
              </button>
            </div>
          </motion.div>

        </div>

      </div>

      {/* ─── Achievements Shelf Shelf ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-3xl border border-white/5 bg-[#0e0d1b]/60 p-6 space-y-6"
      >
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Award size={18} className="text-orange-400" /> Gamification Streak Milestones
          </h3>
          <p className="text-xs text-white/40 mt-1">Unlock badges and rare credentials as your daily learning habit matures.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((ach) => {
            return (
              <div 
                key={ach.type}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col justify-between h-[155px] transition-all relative overflow-hidden group",
                  ach.unlocked 
                    ? "bg-gradient-to-br from-white/[0.01] to-white/[0.03] border-white/10 hover:border-orange-500/30 hover:shadow-[0_4px_20px_rgba(249,115,22,0.05)] hover:-translate-y-1" 
                    : "bg-[#0b0a14] border-white/5 opacity-50 select-none"
                )}
              >
                <div className="flex justify-between items-start z-10">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full border text-[9px] font-extrabold tracking-widest uppercase",
                    rarityColors[ach.rarity]
                  )}>
                    {ach.rarity}
                  </span>
                  
                  {ach.unlocked ? (
                    <motion.div 
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      className="text-orange-400 text-lg drop-shadow-[0_0_8px_rgba(249,115,22,0.3)] cursor-help"
                    >
                      🔥
                    </motion.div>
                  ) : (
                    <div className="text-white/20">
                      <Lock size={14} />
                    </div>
                  )}
                </div>

                <div className="z-10 mt-3">
                  <h4 className={cn(
                    "text-sm font-black tracking-tight",
                    ach.unlocked ? "text-white" : "text-white/40"
                  )}>
                    {ach.name}
                  </h4>
                  <p className="text-[10px] text-white/40 leading-snug mt-1 max-w-[170px]">
                    {ach.description}
                  </p>
                </div>

                <div className="text-[9px] text-white/30 font-bold border-t border-white/5 pt-2 mt-2 z-10">
                  {ach.unlocked ? (
                    <span className="text-emerald-400 font-extrabold">Unlocked: {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ""}</span>
                  ) : (
                    <span>Requires: {ach.days} day streak</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Share Streak Modal ─── */}
      <AnimatePresence>
        {sharingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharingModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0c0b16] p-6 z-10 shadow-2xl flex flex-col items-center"
            >
              <button 
                onClick={() => setSharingModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-lg font-black tracking-tight text-white mb-1.5 flex items-center gap-2">
                <Sparkles size={16} className="text-orange-400" /> Share Learning Streak Card
              </h2>
              <p className="text-xs text-white/40 mb-6 text-center">Share your learning consistency with peers on social platforms.</p>

              {/* Canvas Preview */}
              <div className="w-full flex justify-center bg-zinc-950/40 border border-white/5 rounded-2xl p-4 mb-6">
                <canvas 
                  ref={canvasRef} 
                  className="max-w-full rounded-xl border border-white/10 shadow-xl"
                  style={{ width: "450px", height: "300px" }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 w-full justify-end">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer transition-colors flex items-center gap-2"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={handleDownloadPNG}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-black cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Download size={14} /> Download PNG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
