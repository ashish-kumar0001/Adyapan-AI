"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "./types";

interface UserMessageProps {
  message: ChatMessage;
  index: number;
}

export function UserMessage({ message, index }: UserMessageProps) {
  return (
    <motion.div
      className="flex justify-end mb-6"
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="flex items-end gap-3 max-w-[75%]">
        {/* Message bubble */}
        <motion.div
          className="relative px-5 py-3.5 text-sm leading-relaxed"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "24px 24px 6px 24px",
            color: "#ffffff",
            boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.65,
            wordBreak: "break-word",
          }}
          whileHover={{
            boxShadow: "0 12px 40px rgba(59,130,246,0.4)",
            y: -1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Subtle inner glow */}
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
            }}
          />
          <span className="relative">{message.content}</span>

          {/* Timestamp */}
          <div
            className="text-[10px] mt-1.5 text-right opacity-60"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </motion.div>

        {/* Avatar */}
        <motion.div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-1"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#000",
            boxShadow: "0 0 10px rgba(245,158,11,0.3)",
          }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
        >
          A
        </motion.div>
      </div>
    </motion.div>
  );
}
