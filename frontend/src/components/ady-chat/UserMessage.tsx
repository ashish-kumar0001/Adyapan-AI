"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "./types";

interface UserMessageProps {
  message: ChatMessage;
  index: number;
  isDark: boolean;
}

export function UserMessage({ message, index, isDark }: UserMessageProps) {
  // ChatGPT-style gray bubble
  const bg = isDark ? "#2f2f2f" : "#f4f4f4";
  const text = isDark ? "#ececf1" : "#0f172a";
  const border = isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.02)";
  const shadow = isDark ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.04)";

  return (
    <motion.div
      className="flex justify-end mb-5"
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.03,
        ease: "easeOut",
      }}
    >
      <div className="flex items-end gap-2.5 max-w-[75%]">
        {/* Message bubble */}
        <motion.div
          className="relative px-4 py-2.5 text-sm leading-relaxed"
          style={{
            background: bg,
            border: border,
            borderRadius: "20px 20px 4px 20px",
            color: text,
            boxShadow: shadow,
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
          whileHover={{ y: -0.5 }}
        >
          <span className="relative">{message.content}</span>

          {/* Timestamp */}
          <div
            className="text-[9px] mt-1 text-right opacity-50 font-medium"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </motion.div>

        {/* User initials bubble (gray gradient) */}
        <motion.div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-0.5"
          style={{
            background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            color: isDark ? "#e2e8f0" : "#475569",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.04)",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
        >
          U
        </motion.div>
      </div>
    </motion.div>
  );
}
