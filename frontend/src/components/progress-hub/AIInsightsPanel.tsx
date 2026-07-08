"use client";

import { motion } from "framer-motion";
import { Sparkles, BookOpen, RotateCcw, Brain, Target, ArrowRight, Lightbulb } from "lucide-react";

interface RecommendationItem {
  type: "study" | "revise" | "practice" | "improve";
  title: string;
  recommendation: string;
  reason: string;
  action: string;
  priority: "High" | "Medium" | "Low";
}

interface AIInsightsPanelProps {
  insights: string[];
  recommendations: RecommendationItem[];
}

const REC_CONFIG = {
  study: { icon: BookOpen, color: "text-blue-400", bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", glow: "#3b82f6" },
  revise: { icon: RotateCcw, color: "text-amber-400", bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", glow: "#f59e0b" },
  practice: { icon: Brain, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", glow: "#10b981" },
  improve: { icon: Target, color: "text-violet-400", bg: "from-violet-500/10 to-violet-600/5", border: "border-violet-500/20", glow: "#8b5cf6" },
};

const PRIORITY_BADGE = {
  High: "bg-red-500/15 text-red-400 border-red-500/25",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Low: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

export function AIInsightsPanel({ insights, recommendations }: AIInsightsPanelProps) {
  return (
    <div className="space-y-8">
      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-400/10">
              <Lightbulb size={16} className="text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white/70">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-amber-400" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-violet-400/10">
              <Brain size={16} className="text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-white/70">Next Learning Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => {
              const cfg = REC_CONFIG[rec.type] || REC_CONFIG.study;
              const IconComponent = cfg.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`group relative p-5 rounded-2xl border bg-gradient-to-br ${cfg.bg} ${cfg.border} cursor-default transition-all duration-300`}
                  style={{ boxShadow: `0 4px 20px ${cfg.glow}10` }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${cfg.glow}15, transparent 60%)` }}
                  />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-white/5`}>
                          <IconComponent size={14} className={cfg.color} />
                        </div>
                        <span className={`text-xs font-black ${cfg.color} uppercase tracking-wider`}>{rec.title}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[rec.priority]}`}>
                        {rec.priority}
                      </span>
                    </div>

                    {/* Recommendation */}
                    <p className="text-sm font-bold text-white mb-1.5">{rec.recommendation}</p>
                    <p className="text-xs text-white/50 mb-3 leading-relaxed">{rec.reason}</p>

                    {/* Action */}
                    <div className={`flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]`}>
                      <ArrowRight size={12} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                      <p className="text-[11px] text-white/60 leading-relaxed">{rec.action}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
