"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Clock,
  Code2,
  Bug,
  Lightbulb,
  FolderKanban,
} from "lucide-react";

export type Mode = "generate" | "debug" | "explain" | "project";

export interface AssistantSession {
  id: string;
  title: string;
  mode: Mode;
  languages: string[];
  createdAt: string;
  updatedAt: string;
}

interface AssistantSidebarProps {
  sessions: AssistantSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: (mode: Mode) => void;
  onDelete: (id: string) => void;
  isDark?: boolean;
}

const MODE_CONFIG: Record<Mode, { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; label: string }> = {
  generate: { icon: Code2, color: "#10b981", label: "Generate" },
  debug: { icon: Bug, color: "#f43f5e", label: "Debug" },
  explain: { icon: Lightbulb, color: "#f59e0b", label: "Explain" },
  project: { icon: FolderKanban, color: "#0ea5e9", label: "Project" },
};

export function AssistantSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  isDark = true,
}: AssistantSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: isDark ? "rgba(8,6,20,0.95)" : "rgba(255,255,255,0.96)",
        borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
      }}
    >
      {/* New session buttons */}
      <div className="p-3 space-y-2 flex-shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(MODE_CONFIG) as Mode[]).map((mode) => {
            const cfg = MODE_CONFIG[mode];
            const Icon = cfg.icon;
            return (
              <motion.button
                key={mode}
                onClick={() => onNew(mode)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                }}
                whileHover={{
                  scale: 1.02,
                  borderColor: cfg.color + "40",
                  background: isDark ? `${cfg.color}10` : `${cfg.color}08`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={12} style={{ color: cfg.color }} />
                {cfg.label}
              </motion.button>
            );
          })}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border"
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          }}
        >
          <Search size={12} style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="flex-1 bg-transparent border-none outline-none text-[11px]"
            style={{ color: isDark ? "#fff" : "#1a1a2e" }}
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Code2 size={24} style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
            <div className="text-[11px] font-semibold mt-2" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
              {searchQuery ? "No matching sessions" : "No sessions yet"}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((session, i) => {
              const cfg = MODE_CONFIG[session.mode] || MODE_CONFIG.generate;
              const Icon = cfg.icon;
              const isActive = activeSessionId === session.id;
              const isHovered = hoveredId === session.id;

              return (
                <motion.div
                  key={session.id}
                  onClick={() => onSelect(session.id)}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer group relative border transition-all"
                  style={{
                    background: isActive ? `${cfg.color}12` : "transparent",
                    borderColor: isActive ? `${cfg.color}30` : "transparent",
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ x: 2 }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[11px] font-semibold truncate"
                      style={{ color: isActive ? cfg.color : isDark ? "#fff" : "#1a1a2e" }}
                    >
                      {session.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] flex items-center gap-0.5" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}>
                        <Clock size={9} />
                        {new Date(session.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                      {session.languages.length > 0 && (
                        <span className="text-[8px] font-bold uppercase" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }}>
                          {session.languages.length} lang
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(session.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{ background: "rgba(239,68,68,0.15)" }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
