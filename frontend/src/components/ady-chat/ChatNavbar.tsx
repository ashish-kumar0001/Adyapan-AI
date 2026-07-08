"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Sun, Moon, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ChatNavbarProps {
  theme: string;
  onThemeToggle: () => void;
  onSettingsClick: () => void;
}

export function ChatNavbar({ theme, onThemeToggle, onSettingsClick }: ChatNavbarProps) {
  const { user } = useAuth();
  const [hasNotification] = useState(true);

  const isDark = theme === "dark";

  return (
    <motion.nav
      className="flex items-center justify-between px-5 py-3 flex-shrink-0 relative z-20"
      style={{
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        background: isDark
          ? "rgba(6,6,18,0.7)"
          : "rgba(248,250,252,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Left: Logo */}
      <motion.div
        className="flex items-center gap-2.5"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
            border: "1px solid rgba(245,158,11,0.35)",
            boxShadow: "0 0 16px rgba(245,158,11,0.2)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
            <path d="M22 6L28 18H16L22 6Z" fill="rgba(245,158,11,0.9)" />
            <path d="M16 18L10 30H22L16 18Z" fill="rgba(245,158,11,0.6)" />
            <path d="M28 18L22 30H34L28 18Z" fill="rgba(245,158,11,0.75)" />
            <circle cx="22" cy="22" r="3" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span
          className="text-base font-bold tracking-tight"
          style={{
            color: isDark ? "#ffffff" : "#0f172a",
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          Ady Chat
        </span>
      </motion.div>

      {/* Center: empty (Gemini style) */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Notification */}
        <NavButton onClick={() => {}} isDark={isDark} title="Notifications">
          <div className="relative">
            <Bell className="w-4 h-4" />
            {hasNotification && (
              <motion.span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
        </NavButton>

        {/* Theme toggle */}
        <NavButton onClick={onThemeToggle} isDark={isDark} title="Toggle theme">
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </NavButton>

        {/* Settings */}
        <NavButton onClick={onSettingsClick} isDark={isDark} title="Settings">
          <motion.div whileHover={{ rotate: 45 }} transition={{ duration: 0.3 }}>
            <Settings className="w-4 h-4" />
          </motion.div>
        </NavButton>

        {/* Profile avatar */}
        <motion.button
          className="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#000",
            boxShadow: "0 0 12px rgba(245,158,11,0.4)",
          }}
          whileHover={{ scale: 1.08, boxShadow: "0 0 20px rgba(245,158,11,0.6)" }}
          whileTap={{ scale: 0.94 }}
          title={user?.name || "Profile"}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
        </motion.button>

        {/* Model/name badge */}
        {user?.name && (
          <div className="hidden sm:flex items-center gap-1 ml-1 px-2 py-1 rounded-lg text-xs" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>
            <span>{user.name.split(" ")[0]}</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        )}
      </div>
    </motion.nav>
  );
}

// ─── Reusable nav icon button ─────────────────────────────────────────────────

function NavButton({
  children,
  onClick,
  isDark,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isDark: boolean;
  title: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
      style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" }}
      whileHover={{
        scale: 1.08,
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        color: isDark ? "#ffffff" : "#0f172a",
      }}
      whileTap={{ scale: 0.92 }}
      title={title}
    >
      {children}
    </motion.button>
  );
}
