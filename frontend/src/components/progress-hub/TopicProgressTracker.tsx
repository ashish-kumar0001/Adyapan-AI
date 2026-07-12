"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, TrendingUp, Brain } from "lucide-react";

export interface TopicProgressItem {
  topicName: string;
  progressPercentage: number;
  masteryScore: number;
  revisionStatus: boolean;
  questionsPracticed: number;
  conceptsCovered: number;
  totalConcepts: number;
  lastActivity: string;
  status: string;
}

interface TopicProgressTrackerProps {
  topics: TopicProgressItem[];
}

const STATUS_CONFIG = {
  "Excellent": { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: CheckCircle, barColor: "from-emerald-400 to-teal-400" },
  "Strong": { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", icon: TrendingUp, barColor: "from-blue-400 to-indigo-400" },
  "In Progress": { color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30", icon: TrendingUp, barColor: "from-violet-400 to-purple-400" },
  "Needs Attention": { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", icon: AlertCircle, barColor: "from-amber-400 to-orange-400" },
  "Just Started": { color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/30", icon: Clock, barColor: "from-gray-400 to-gray-500" },
};

function daysSince(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

export function TopicProgressTracker({ topics }: TopicProgressTrackerProps) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Brain size={48} className="text-white/20 mb-4" />
        <p className="text-white/40 font-semibold">No topics tracked yet</p>
        <p className="text-white/25 text-sm mt-1">Upload a document and use AI tools to start tracking topics</p>
      </div>
    );
  }

  const sorted = [...topics].sort((a, b) => b.progressPercentage - a.progressPercentage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sorted.map((topic, i) => {
        const cfg = STATUS_CONFIG[topic.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG["Just Started"];
        const StatusIcon = cfg.icon;

        return (
          <motion.div
            key={topic.topicName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="group relative p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 cursor-default"
          >
            {/* Hover glow */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${cfg.barColor} blur-xl`} style={{ opacity: 0.03 }} />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-white transition-colors">{topic.topicName}</h3>
                  <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {daysSince(topic.lastActivity)}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  <StatusIcon size={11} />
                  {topic.status}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white/50">Progress</span>
                  <span className={`text-sm font-black ${cfg.color}`}>{topic.progressPercentage}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.progressPercentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + i * 0.05 }}
                    className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor} relative`}
                  >
                    <div className="absolute inset-0 animate-pulse opacity-50 rounded-full bg-white/30" />
                  </motion.div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-bold text-white/70">{topic.conceptsCovered}/{topic.totalConcepts}</span>
                  <span className="text-white/35">Concepts</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-bold text-white/70">{topic.questionsPracticed}</span>
                  <span className="text-white/35">Questions</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-bold text-white/70">{topic.masteryScore}%</span>
                  <span className="text-white/35">Mastery</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`font-bold ${topic.revisionStatus ? "text-emerald-400" : "text-amber-400"}`}>
                    {topic.revisionStatus ? "✓ Done" : "Pending"}
                  </span>
                  <span className="text-white/35">Revision</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

