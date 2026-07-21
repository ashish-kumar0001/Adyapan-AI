"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { cn } from "@/lib/cn";

type ScoreColor = "amber" | "green" | "red" | "purple" | "cyan" | "blue" | "auto" | string;

const colorMap: Record<string, { stroke: string; bg: string; border: string }> = {
  amber:   { stroke: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)" },
  green:   { stroke: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)" },
  red:     { stroke: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)" },
  purple:  { stroke: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.3)" },
  cyan:    { stroke: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.3)" },
  blue:    { stroke: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)" },
};

function autoColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "red";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

interface ScoreRingProps {
  score: number;
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: ScoreColor;
  delay?: number;
  showLabel?: boolean;
  showCountUp?: boolean;
  className?: string;
}

export function ScoreRing({
  score,
  label,
  sublabel,
  size = 100,
  strokeWidth = 8,
  color = "auto",
  delay = 0.3,
  showLabel = true,
  showCountUp = true,
  className,
}: ScoreRingProps) {
  const resolvedColor = color === "auto" ? autoColor(score) : color;
  const palette = colorMap[resolvedColor] || { stroke: resolvedColor, bg: `${resolvedColor}18`, border: `${resolvedColor}30` };
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ filter: `drop-shadow(0 0 8px ${palette.stroke}33)` }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-neutral-800"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={palette.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            className="font-extrabold text-slate-800 dark:text-gray-100"
            style={{ fontSize: size * 0.22 }}
          >
            {showCountUp ? <CountUp end={score} duration={1.5} /> : score}
            <span style={{ fontSize: size * 0.14 }}>%</span>
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          {label && (
            <div
              className="font-bold text-slate-800 dark:text-gray-200"
              style={{ fontSize: Math.max(10, size * 0.12) }}
            >
              {label}
            </div>
          )}
          <div
            className="font-semibold"
            style={{ fontSize: Math.max(9, size * 0.1), color: palette.stroke }}
          >
            {sublabel || scoreLabel(score)}
          </div>
        </div>
      )}
    </div>
  );
}

interface MiniScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: ScoreColor;
}

export function MiniScoreRing({
  score,
  size = 44,
  strokeWidth = 4,
  color = "auto",
}: MiniScoreRingProps) {
  const resolvedColor = color === "auto" ? autoColor(score) : color;
  const palette = colorMap[resolvedColor] || colorMap.amber;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-neutral-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-extrabold text-slate-800 dark:text-gray-100"
          style={{ fontSize: size * 0.28 }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
