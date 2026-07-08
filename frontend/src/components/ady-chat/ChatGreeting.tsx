"use client";

import { motion } from "framer-motion";
import { SUGGESTION_CARDS } from "./types";

interface ChatGreetingProps {
  userName: string;
  isDark: boolean;
  onSuggestionClick: (prompt: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── SVG icon map for suggestion cards ───────────────────────────────────────

function CardIcon({ iconKey, size = 22 }: { iconKey: string; size?: number }) {
  const s = size;
  switch (iconKey) {
    case "book":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="13" y2="11" />
        </svg>
      );
    case "notes":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case "code":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );
    case "resume":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="10" cy="13" r="2" />
          <path d="M7 18s1-2 3-2 3 2 3 2" />
          <line x1="15" y1="11" x2="17" y2="11" />
          <line x1="15" y1="14" x2="17" y2="14" />
        </svg>
      );
    case "target":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "research":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "clipboard":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      );
    case "slides":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <line x1="6" y1="9" x2="18" y2="9" />
          <line x1="6" y1="12" x2="14" y2="12" />
        </svg>
      );
    case "quiz":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "career":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export function ChatGreeting({ userName, isDark, onSuggestionClick }: ChatGreetingProps) {
  const text = isDark ? "#ffffff" : "#0f172a";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#64748b";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const cardHoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.95)";
  const iconColor = isDark ? "rgba(245,158,11,0.85)" : "rgba(180,100,0,0.85)";

  const firstName = userName.split(" ")[0] || userName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -16 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center flex-1 px-4 py-10 w-full max-w-4xl mx-auto"
    >
      {/* Greeting heading */}
      <motion.div
        className="text-center mb-3"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1
          className="text-4xl sm:text-5xl font-black tracking-tight"
          style={{
            color: text,
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            letterSpacing: "-0.025em",
          }}
        >
          {getGreeting()},{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {firstName}
          </span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-base font-medium mb-10 text-center"
        style={{ color: textSec, fontFamily: "'Outfit', sans-serif" }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
      >
        What would you like to learn today?
      </motion.p>

      {/* Suggestion cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
        {SUGGESTION_CARDS.map((card, i) => (
          <motion.button
            key={card.title}
            onClick={() => onSuggestionClick(card.prompt)}
            className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left group relative overflow-hidden"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.28 + i * 0.05 }}
            whileHover={{
              y: -6,
              scale: 1.02,
              background: cardHoverBg,
              borderColor: "rgba(245,158,11,0.3)",
              boxShadow: isDark
                ? "0 18px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.15)"
                : "0 18px 36px rgba(0,0,0,0.1), 0 0 0 1px rgba(245,158,11,0.2)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 60%)",
              }}
            />

            {/* Icon */}
            <span style={{ color: iconColor }}>
              <CardIcon iconKey={card.iconKey} size={22} />
            </span>

            {/* Title */}
            <span
              className="text-xs font-semibold leading-snug"
              style={{ color: text, fontFamily: "'Outfit', sans-serif" }}
            >
              {card.title}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
