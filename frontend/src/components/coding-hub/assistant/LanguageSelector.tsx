"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Globe } from "lucide-react";

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", icon: "JS", color: "#f7df1e", darkColor: "#000" },
  { id: "python", label: "Python", icon: "PY", color: "#3776ab", darkColor: "#ffd43b" },
  { id: "java", label: "Java", icon: "JV", color: "#ed8b00", darkColor: "#fff" },
  { id: "cpp", label: "C++", icon: "C+", color: "#00599c", darkColor: "#fff" },
  { id: "typescript", label: "TypeScript", icon: "TS", color: "#3178c6", darkColor: "#fff" },
  { id: "go", label: "Go", icon: "GO", color: "#00add8", darkColor: "#fff" },
  { id: "rust", label: "Rust", icon: "RS", color: "#ce422b", darkColor: "#fff" },
  { id: "c", label: "C", icon: "C", color: "#555555", darkColor: "#fff" },
  { id: "ruby", label: "Ruby", icon: "RB", color: "#cc342d", darkColor: "#fff" },
  { id: "php", label: "PHP", icon: "PH", color: "#777bb4", darkColor: "#fff" },
  { id: "swift", label: "Swift", icon: "SW", color: "#fa7343", darkColor: "#fff" },
  { id: "kotlin", label: "Kotlin", icon: "KT", color: "#7f52ff", darkColor: "#fff" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

interface LanguageSelectorProps {
  selected: LanguageId[];
  onChange: (languages: LanguageId[]) => void;
  max?: number;
  isDark?: boolean;
}

const PRESETS: { label: string; langs: LanguageId[] }[] = [
  { label: "Web Dev", langs: ["javascript", "typescript", "python"] },
  { label: "Systems", langs: ["cpp", "rust", "go"] },
  { label: "Enterprise", langs: ["java", "c", "kotlin"] },
  { label: "All Popular", langs: ["javascript", "python", "java", "cpp", "typescript"] },
];

export function LanguageSelector({ selected, onChange, max = 6, isDark = true }: LanguageSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleLang = (langId: LanguageId) => {
    if (selected.includes(langId)) {
      onChange(selected.filter((l) => l !== langId));
    } else if (selected.length < max) {
      onChange([...selected, langId]);
    }
  };

  const applyPreset = (preset: LanguageId[]) => {
    onChange(preset.slice(0, max));
    setDropdownOpen(false);
  };

  const selectedLangs = LANGUAGES.filter((l) => selected.includes(l.id));

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <Globe size={14} className={isDark ? "text-slate-400" : "text-slate-500"} />

        {/* Selected language pills */}
        {selectedLangs.map((lang) => (
          <motion.button
            key={lang.id}
            onClick={() => toggleLang(lang.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer"
            style={{
              background: isDark ? `${lang.color}18` : `${lang.color}12`,
              borderColor: isDark ? `${lang.color}40` : `${lang.color}30`,
              color: isDark ? lang.darkColor : lang.color,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span
              className="w-4 h-4 rounded text-[8px] font-black flex items-center justify-center"
              style={{ background: lang.color, color: lang.darkColor }}
            >
              {lang.icon.charAt(0)}
            </span>
            {lang.label}
            <span className="ml-0.5 opacity-60">&times;</span>
          </motion.button>
        ))}

        {/* Add language dropdown trigger */}
        <motion.button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-dashed transition-all cursor-pointer"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm leading-none">+</span>
          Add
          <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </motion.button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 z-50 w-80 rounded-2xl border p-3 shadow-2xl"
            style={{
              background: isDark ? "rgba(12,10,30,0.98)" : "rgba(255,255,255,0.98)",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Presets */}
            <div className="mb-3">
              <span className="text-[9px] uppercase font-black tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.langs)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer"
                    style={{
                      background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                      borderColor: isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)",
                      color: isDark ? "#f59e0b" : "#d97706",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGES.map((lang) => {
                const isSelected = selected.includes(lang.id);
                const isDisabled = !isSelected && selected.length >= max;
                return (
                  <button
                    key={lang.id}
                    onClick={() => !isDisabled && toggleLang(lang.id)}
                    className="flex items-center gap-2 p-2 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected
                        ? isDark ? `${lang.color}15` : `${lang.color}10`
                        : "transparent",
                      opacity: isDisabled ? 0.35 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black flex-shrink-0"
                      style={{ background: lang.color, color: lang.darkColor }}
                    >
                      {lang.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate" style={{ color: isDark ? "#fff" : "#1a1a2e" }}>
                        {lang.label}
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: lang.color }} />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t flex justify-between items-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
              <span className="text-[9px] font-bold" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}>
                {selected.length}/{max} selected
              </span>
              <button
                onClick={() => setDropdownOpen(false)}
                className="px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                style={{
                  background: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)",
                  color: "#f59e0b",
                }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
