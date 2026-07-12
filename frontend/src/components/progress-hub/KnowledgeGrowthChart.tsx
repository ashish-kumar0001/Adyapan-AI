"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp } from "lucide-react";

export interface GrowthDataPoint {
  period: string;
  conceptsLearned: number;
  questionsPracticed: number;
  topicsCompleted: number;
  documentsStudied: number;
}

interface KnowledgeGrowthChartProps {
  data: GrowthDataPoint[];
}

const METRICS = [
  { key: "conceptsLearned", label: "Concepts", color: "#8b5cf6" },
  { key: "questionsPracticed", label: "Questions", color: "#10b981" },
  { key: "topicsCompleted", label: "Topics", color: "#f59e0b" },
  { key: "documentsStudied", label: "Documents", color: "#3b82f6" },
];

function BarChart({ data, metrics }: { data: GrowthDataPoint[]; metrics: typeof METRICS }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: GrowthDataPoint } | null>(null);

  // Find max value across selected metrics
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) =>
      metrics.map((m) => d[m.key as keyof GrowthDataPoint] as number)
    )
  );

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="flex">
        <div className="w-8 flex flex-col justify-between text-right pr-2">
          {[maxVal, Math.round(maxVal * 0.5), 0].map((v) => (
            <span key={v} className="text-[10px] text-white/25 font-semibold">{v}</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-full h-px bg-white/[0.04]" />
            ))}
          </div>

          {/* Bars */}
          <div className="flex items-end gap-2 h-52 px-1">
            {data.map((item, di) => (
              <div
                key={item.period}
                className="flex-1 flex items-end gap-0.5 relative group cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ x: rect.left + rect.width / 2, y: rect.top, item });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {metrics.map((m, mi) => {
                  const val = item[m.key as keyof GrowthDataPoint] as number;
                  const h = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <motion.div
                      key={m.key}
                      className="flex-1 rounded-t-sm min-w-0 relative"
                      style={{ backgroundColor: `${m.color}60` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(h, 2)}%` }}
                      transition={{ duration: 0.8, delay: di * 0.05 + mi * 0.02, ease: "easeOut" }}
                      whileHover={{ backgroundColor: m.color }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 px-1 mt-1">
            {data.map((item) => (
              <div key={item.period} className="flex-1 text-center">
                <span className="text-[9px] text-white/25 font-semibold truncate block">{item.period}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed z-50 bg-[#111120] border border-white/10 rounded-xl p-3 shadow-2xl text-xs pointer-events-none"
          style={{ left: tooltip.x - 70, top: tooltip.y - 120 }}
        >
          <p className="text-white/60 font-bold mb-2">{tooltip.item.period}</p>
          {metrics.map((m) => (
            <div key={m.key} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
              <span className="text-white/60">{m.label}:</span>
              <span className="text-white font-bold">{tooltip.item[m.key as keyof GrowthDataPoint]}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function KnowledgeGrowthChart({ data }: KnowledgeGrowthChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(["conceptsLearned", "questionsPracticed"])
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp size={48} className="text-white/20 mb-4" />
        <p className="text-white/40 font-semibold">No growth data yet</p>
        <p className="text-white/25 text-sm mt-1">Keep studying to see your knowledge growth over time</p>
      </div>
    );
  }

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedMetrics = METRICS.filter((m) => activeMetrics.has(m.key));

  return (
    <div className="space-y-4">
      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <motion.button
            key={m.key}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleMetric(m.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
              activeMetrics.has(m.key)
                ? "border-white/20 text-white"
                : "border-white/[0.06] text-white/30 hover:text-white/50"
            }`}
            style={activeMetrics.has(m.key) ? { backgroundColor: `${m.color}15`, borderColor: `${m.color}40` } : {}}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: activeMetrics.has(m.key) ? m.color : "rgba(255,255,255,0.2)" }} />
            {m.label}
          </motion.button>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        key={[...activeMetrics].join(",")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <BarChart data={data} metrics={selectedMetrics} />
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        {METRICS.map((m) => {
          const total = data.reduce((s, d) => s + (d[m.key as keyof GrowthDataPoint] as number), 0);
          const isActive = activeMetrics.has(m.key);
          return (
            <div
              key={m.key}
              className={`text-center p-3 rounded-xl border transition-all ${
                isActive ? "border-white/10 bg-white/[0.03]" : "border-white/[0.04] opacity-40"
              }`}
            >
              <div className="text-xl font-black" style={{ color: isActive ? m.color : "rgba(255,255,255,0.3)" }}>
                {total}
              </div>
              <div className="text-[10px] text-white/35 font-semibold mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

