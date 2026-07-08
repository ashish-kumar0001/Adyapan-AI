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

export function ChatGreeting({ userName, isDark, onSuggestionClick }: ChatGreetingProps) {
  const text = isDark ? "#ffffff" : "#0f172a";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#64748b";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const cardHoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.95)";

  const firstName = userName.split(" ")[0] || userName;

  return (
    <motion.div
      key="greeting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -16 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center flex-1 px-4 py-12 w-full max-w-4xl mx-auto"
    >
      {/* Greeting heading */}
      <motion.div
        className="text-center mb-3"
        initial={{ opacity: 0, y: 30 }}
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
        className="text-lg font-medium mb-12 text-center"
        style={{ color: textSec, fontFamily: "'Outfit', sans-serif" }}
        initial={{ opacity: 0, y: 20 }}
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
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.28 + i * 0.05 }}
            whileHover={{
              y: -6,
              scale: 1.02,
              background: cardHoverBg,
              borderColor: "rgba(245,158,11,0.3)",
              boxShadow: isDark
                ? "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.15)"
                : "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(245,158,11,0.2)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)",
              }}
            />

            {/* Icon */}
            <span
              className="text-2xl leading-none"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
            >
              {card.icon}
            </span>

            {/* Title */}
            <span
              className="text-xs font-semibold leading-snug"
              style={{
                color: text,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {card.title}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
