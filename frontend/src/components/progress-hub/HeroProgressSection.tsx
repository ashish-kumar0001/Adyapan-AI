"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Target, Zap, BookOpen, BarChart3, Flame } from "lucide-react";

interface HeroProgressSectionProps {
  overallProgress: number;
  learningLevel: number;
  learningLevelName: string;
  topicsCompleted: number;
  documentsCompleted: number;
  studySessions: number;
  currentStreak: number;
  status: string;
  masteryScore: number;
  masteryGrade: string;
}

function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count}</>;
}

const LEVEL_COLORS: Record<number, { ring: string; badge: string; glow: string }> = {
  1: { ring: "#6b7280", badge: "from-gray-500 to-gray-600", glow: "#6b7280" },
  2: { ring: "#10b981", badge: "from-emerald-500 to-emerald-600", glow: "#10b981" },
  3: { ring: "#3b82f6", badge: "from-blue-500 to-blue-600", glow: "#3b82f6" },
  4: { ring: "#8b5cf6", badge: "from-violet-500 to-violet-600", glow: "#8b5cf6" },
  5: { ring: "#f59e0b", badge: "from-amber-500 to-amber-600", glow: "#f59e0b" },
  6: { ring: "#ef4444", badge: "from-red-500 to-red-600", glow: "#ef4444" },
  7: { ring: "#f97316", badge: "from-orange-400 to-pink-500", glow: "#f97316" },
};

export function HeroProgressSection({
  overallProgress,
  learningLevel,
  learningLevelName,
  topicsCompleted,
  documentsCompleted,
  studySessions,
  currentStreak,
  status,
  masteryScore,
  masteryGrade,
}: HeroProgressSectionProps) {
  const colors = LEVEL_COLORS[learningLevel] || LEVEL_COLORS[1];
  const circumference = 2 * Math.PI * 56;
  const strokeDash = ((100 - overallProgress) / 100) * circumference;

  const stats = [
    { icon: BookOpen, label: "Topics Completed", value: topicsCompleted, color: "text-violet-400" },
    { icon: Target, label: "Documents", value: documentsCompleted, color: "text-blue-400" },
    { icon: BarChart3, label: "Study Sessions", value: studySessions, color: "text-emerald-400" },
    { icon: Flame, label: "Day Streak", value: currentStreak, color: "text-orange-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10 rounded-3xl"
        style={{ background: `radial-gradient(ellipse at 20% 50%, ${colors.glow}55, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
        {/* Circular Progress Ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <div className="relative">
            <svg width="144" height="144" className="rotate-[-90deg]" viewBox="0 0 128 128">
              {/* Background ring */}
              <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              {/* Progress ring */}
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={`url(#progressGrad-${learningLevel})`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDash }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
              <defs>
                <linearGradient id={`progressGrad-${learningLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors.ring} />
                  <stop offset="100%" stopColor="#ffffff80" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">
                <CountUp target={overallProgress} />%
              </span>
              <span className="text-xs text-white/50 font-semibold mt-1">Progress</span>
            </div>
          </div>

          {/* Level Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.8 }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r ${colors.badge} shadow-lg`}
          >
            <Zap size={14} className="text-white" />
            <span className="text-sm font-black text-white">Level {learningLevel} · {learningLevelName}</span>
          </motion.div>
        </div>

        {/* Main Info */}
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
            <TrendingUp size={16} className="text-white/40" />
            <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Learning Progress Overview</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">
            Your Learning Journey
          </h1>
          <p className="text-white/50 text-sm mb-1">
            Mastery Score: <span className="text-white/80 font-bold">{masteryScore}%</span>{" "}
            · Grade: <span className="font-bold" style={{ color: colors.ring }}>{masteryGrade}</span>
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white/70">{status}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center lg:items-start gap-1 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
              >
                <s.icon size={18} className={s.color} />
                <div className={`text-2xl font-black ${s.color}`}>
                  <CountUp target={s.value} duration={1200} />
                  {s.label === "Day Streak" && <span className="text-base">🔥</span>}
                </div>
                <span className="text-[11px] text-white/40 font-semibold leading-tight">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

