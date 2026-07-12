"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Trophy, Lock } from "lucide-react";

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface MilestoneSystemProps {
  milestones: MilestoneItem[];
}

// Lightweight confetti burst using CSS animation
function ConfettiBurst({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 12 });
  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f97316"];

  return (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 80,
              y: Math.sin((angle * Math.PI) / 180) * 80,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export function MilestoneSystem({ milestones }: MilestoneSystemProps) {
  const [confetti, setConfetti] = useState<{ x: number; y: number; key: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleUnlockedClick = useCallback((e: React.MouseEvent, id: string, unlocked: boolean) => {
    if (!unlocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, key: Date.now() });
    setTimeout(() => setConfetti(null), 900);
  }, []);

  if (milestones.length === 0) return null;

  const unlockedCount = milestones.filter((m) => m.unlocked).length;
  const nextMilestone = milestones.find((m) => !m.unlocked);

  return (
    <div className="space-y-4">
      {/* Next Milestone Widget */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.06] to-fuchsia-500/[0.04] backdrop-blur-sm flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-violet-500/10 flex items-center justify-center">
              {nextMilestone.icon || "🎯"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Next Milestone</span>
                <span className="text-[10px] font-bold text-white/50">Locked</span>
              </div>
              <h4 className="text-sm font-extrabold text-white mt-1">{nextMilestone.title}</h4>
              <p className="text-xs text-white/60 mt-0.5">{nextMilestone.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-medium">Goal Focus: Increase concept coverage & practice</span>
          </div>
        </motion.div>
      )}

      {/* Header stats */}
      <div className="flex items-center gap-3 mb-2">
        <Trophy size={18} className="text-amber-400" />
        <span className="text-sm font-bold text-white/60">
          <span className="text-amber-400 font-black">{unlockedCount}</span> / {milestones.length} Achievements Unlocked
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / milestones.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {milestones.map((milestone, i) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
            whileHover={milestone.unlocked ? { scale: 1.06, y: -4 } : { scale: 1.02 }}
            onClick={(e) => handleUnlockedClick(e, milestone.id, milestone.unlocked)}
            onHoverStart={() => setHoveredId(milestone.id)}
            onHoverEnd={() => setHoveredId(null)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center cursor-pointer select-none transition-all duration-200 ${
              milestone.unlocked
                ? "border-amber-400/30 bg-amber-400/[0.06] hover:border-amber-400/50"
                : "border-white/[0.05] bg-white/[0.01] opacity-50 cursor-default"
            }`}
          >
            {/* Lock overlay */}
            {!milestone.unlocked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 z-10">
                <Lock size={20} className="text-white/30" />
              </div>
            )}

            {/* Unlock glow */}
            {milestone.unlocked && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Icon */}
            <motion.div
              animate={milestone.unlocked && hoveredId === milestone.id ? {
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0],
              } : {}}
              transition={{ duration: 0.4 }}
              className="text-3xl"
            >
              {milestone.icon}
            </motion.div>

            {/* Content */}
            <div>
              <p className={`text-xs font-bold leading-tight ${milestone.unlocked ? "text-white" : "text-white/30"}`}>
                {milestone.title}
              </p>
              <p className={`text-[10px] mt-0.5 leading-tight ${milestone.unlocked ? "text-white/50" : "text-white/20"}`}>
                {milestone.description}
              </p>
            </div>

            {/* Unlocked badge */}
            {milestone.unlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, delay: 0.1 + i * 0.06 }}
                className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] font-black text-amber-400"
              >
                UNLOCKED ✓
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {confetti && <ConfettiBurst key={confetti.key} x={confetti.x} y={confetti.y} />}
      </AnimatePresence>
    </div>
  );
}

