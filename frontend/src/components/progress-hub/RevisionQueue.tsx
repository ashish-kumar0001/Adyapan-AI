"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, ChevronRight, RotateCcw } from "lucide-react";

export interface RevisionQueueItem {
  topicName: string;
  lastRevised: string;
  daysSince: number;
  priority: "High" | "Medium" | "Low";
  masteryScore: number;
}

interface RevisionQueueProps {
  queue: RevisionQueueItem[];
}

const PRIORITY_CONFIG = {
  High: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/25",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    glow: "#ef4444",
    bar: "from-red-400 to-rose-500",
  },
  Medium: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    glow: "#f59e0b",
    bar: "from-amber-400 to-orange-400",
  },
  Low: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/25",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    glow: "#3b82f6",
    bar: "from-blue-400 to-indigo-400",
  },
};

export function RevisionQueue({ queue }: RevisionQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <RotateCcw size={48} className="text-emerald-400/40 mb-4" />
        <p className="text-white/40 font-semibold">You are all caught up!</p>
        <p className="text-white/25 text-sm mt-1">No topics need revision right now. Keep studying!</p>
      </div>
    );
  }

  const highCount = queue.filter((q) => q.priority === "High").length;
  const medCount = queue.filter((q) => q.priority === "Medium").length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {highCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-400/10 border border-red-400/25 text-xs font-bold text-red-400">
            <AlertTriangle size={11} /> {highCount} High Priority
          </span>
        )}
        {medCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-xs font-bold text-amber-400">
            <Clock size={11} /> {medCount} Medium Priority
          </span>
        )}
        <span className="text-xs text-white/30">{queue.length} topics need revision</span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {queue.map((item, i) => {
          const cfg = PRIORITY_CONFIG[item.priority];
          return (
            <motion.div
              key={item.topicName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ x: 4, scale: 1.01 }}
              className={`group flex items-center gap-4 p-4 rounded-2xl border ${cfg.border} ${cfg.bg} transition-all duration-200 cursor-default`}
            >
              {/* Priority indicator */}
              <div className="flex-shrink-0 w-1.5 h-12 rounded-full bg-gradient-to-b" style={{ background: `linear-gradient(to bottom, ${cfg.glow}, ${cfg.glow}40)` }} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">{item.topicName}</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                    {item.priority} Priority
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    Last revised {item.daysSince} days ago
                  </span>
                  <span>·</span>
                  <span>Mastery: <span className="font-bold text-white/60">{item.masteryScore}%</span></span>
                </div>
              </div>

              {/* Days since badge */}
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                <span className={`text-2xl font-black ${cfg.color}`}>{item.daysSince}</span>
                <span className="text-[9px] text-white/30 font-semibold">DAYS</span>
              </div>

              {/* Arrow */}
              <ChevronRight size={16} className={`flex-shrink-0 ${cfg.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

