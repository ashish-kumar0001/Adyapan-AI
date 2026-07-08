"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pin, Archive, Edit3,
  MessageSquare, ChevronDown, User, Zap,
  HardDrive, Clock, Star
} from "lucide-react";
import type { ChatSession } from "./types";

interface ChatSidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  isDark: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  userName?: string;
}

function groupSessionsByDate(sessions: ChatSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const lastWeek = today - 7 * 86400000;

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Last 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    const t = new Date(s.updatedAt).getTime();
    if (t >= today) groups[0].items.push(s);
    else if (t >= yesterday) groups[1].items.push(s);
    else if (t >= lastWeek) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter(g => g.items.length > 0);
}

export function ChatSidebar({
  isOpen,
  sessions,
  activeSessionId,
  isDark,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  userName,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = sessions.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupSessionsByDate(filtered);

  const bg = isDark ? "rgba(8,6,20,0.92)" : "rgba(248,250,252,0.95)";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const text = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";
  const textSec = isDark ? "rgba(255,255,255,0.65)" : "#475569";
  const surfaceHover = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const activeItem = isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            background: bg,
            borderRight: `1px solid ${border}`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Top: New Chat + Search */}
          <div className="p-3 space-y-2 flex-shrink-0">
            {/* New Chat button */}
            <motion.button
              onClick={onNewChat}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 6px 28px rgba(245,158,11,0.45)" }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </motion.button>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${border}`,
              }}
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textMuted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent border-none outline-none text-xs"
                style={{ color: text }}
              />
            </div>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sessions.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-16 px-4 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: textMuted }} />
                </div>
                <div className="text-xs font-semibold mb-1" style={{ color: text }}>No chats yet</div>
                <div className="text-xs" style={{ color: textMuted }}>Start a conversation to see it here</div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.label}>
                    <div
                      className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: textMuted, letterSpacing: "0.1em" }}
                    >
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((session, i) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={activeSessionId === session.id}
                          isHovered={hoveredId === session.id}
                          isDark={isDark}
                          index={i}
                          text={text}
                          textSec={textSec}
                          textMuted={textMuted}
                          surfaceHover={surfaceHover}
                          activeItem={activeItem}
                          onSelect={() => onSelectSession(session.id)}
                          onDelete={(e) => onDeleteSession(session.id, e)}
                          onHover={setHoveredId}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: User profile */}
          <div
            className="p-3 flex-shrink-0"
            style={{ borderTop: `1px solid ${border}` }}
          >
            {/* Storage usage */}
            <div className="mb-3 px-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] flex items-center gap-1" style={{ color: textMuted }}>
                  <HardDrive className="w-3 h-3" /> Storage
                </span>
                <span className="text-[10px]" style={{ color: textMuted }}>2.1 GB / 5 GB</span>
              </div>
              <div
                className="w-full h-1 rounded-full overflow-hidden"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #f59e0b, #d97706)" }}
                  initial={{ width: 0 }}
                  animate={{ width: "42%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            {/* User card */}
            <motion.div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
              style={{ background: surfaceHover }}
              whileHover={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#000",
                  boxShadow: "0 0 12px rgba(245,158,11,0.3)",
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: text }}>
                  {userName || "Ashish"}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-2.5 h-2.5" style={{ color: "#f59e0b" }} />
                  <span className="text-[10px] font-medium" style={{ color: "#f59e0b" }}>Premium</span>
                </div>
              </div>
              <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
            </motion.div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Individual session item ──────────────────────────────────────────────────

function SessionItem({
  session,
  isActive,
  isHovered,
  isDark,
  index,
  text,
  textSec,
  textMuted,
  surfaceHover,
  activeItem,
  onSelect,
  onDelete,
  onHover,
}: {
  session: ChatSession;
  isActive: boolean;
  isHovered: boolean;
  isDark: boolean;
  index: number;
  text: string;
  textSec: string;
  textMuted: string;
  surfaceHover: string;
  activeItem: string;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <motion.div
      onClick={onSelect}
      onMouseEnter={() => onHover(session.id)}
      onMouseLeave={() => onHover(null)}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer group relative"
      style={{
        background: isActive ? activeItem : "transparent",
        borderLeft: isActive ? "2px solid rgba(245,158,11,0.6)" : "2px solid transparent",
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      whileHover={{
        background: isActive ? activeItem : surfaceHover,
        x: 2,
      }}
    >
      <MessageSquare
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: isActive ? "#f59e0b" : textMuted }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium truncate"
          style={{ color: isActive ? "#f59e0b" : textSec }}
        >
          {session.title}
        </div>
        <div className="text-[10px] flex items-center gap-1" style={{ color: textMuted }}>
          <Clock className="w-2.5 h-2.5" />
          {new Date(session.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </div>
      </div>

      {/* Actions on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <motion.button
              onClick={onDelete}
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.12)" }}
              whileHover={{ background: "rgba(239,68,68,0.2)", scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-2.5 h-2.5 text-red-400" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
