"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { UnifiedLearningDashboard } from "@/components/learning-hub/UnifiedLearningDashboard";
import { ArrowLeft, GraduationCap, LayoutDashboard, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export default function StandaloneLearningDashboardPage() {
  // 1. Secure client-side route guard
  useRequireAuth("USER");

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawUser =
        localStorage.getItem("adyapan-user") ||
        sessionStorage.getItem("adyapan-user");
      if (rawUser) {
        try {
          setUser(JSON.parse(rawUser));
        } catch {
          /* ignore */
        }
      }

      // Track active theme
      const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
      setTheme(savedTheme);

      const observer = new MutationObserver(() => {
        const t = document.documentElement.getAttribute("data-theme") ?? "dark";
        setTheme(t);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
    }
  }, []);

  const isLightTheme = theme === "light";

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-hidden",
        isLightTheme ? "bg-[#f8faf9] text-slate-800" : "bg-[#080710] text-white"
      )}
    >
      {/* Immersive Aurora Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute top-[-8%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[130px]"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-8%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[130px]"
          style={{
            background: isLightTheme
              ? "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Standalone Nav Header */}
      <header
        className={cn(
          "sticky top-0 z-45 border-b backdrop-blur-xl transition-colors",
          isLightTheme ? "border-slate-200/60 bg-white/80" : "border-white/5 bg-[#080710]/80"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/user"
              className={cn(
                "p-2 rounded-xl border transition-all cursor-pointer",
                isLightTheme
                  ? "border-slate-200 bg-white hover:bg-slate-100 text-slate-650"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/60 hover:text-white"
              )}
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg",
                  isLightTheme
                    ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                    : "bg-gradient-to-br from-orange-500 to-red-600"
                )}
              >
                <GraduationCap size={16} className="text-white" />
              </div>
              <div>
                <span
                  className={cn(
                    "font-black text-base tracking-tight",
                    isLightTheme
                      ? "bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
                  )}
                >
                  Learning Hub
                </span>
                <span
                  className={cn(
                    "hidden sm:block text-[9px] font-black tracking-widest uppercase",
                    isLightTheme ? "text-slate-400" : "text-white/30"
                  )}
                >
                  AI Personal Command Center
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div
                className={cn(
                  "hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border",
                  isLightTheme ? "border-slate-200 bg-slate-50" : "border-white/5 bg-white/[0.01]"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                    isLightTheme
                      ? "bg-teal-100 border border-teal-200 text-teal-700"
                      : "bg-orange-500/20 border border-orange-500/30 text-orange-400"
                  )}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className={cn("text-xs font-bold", isLightTheme ? "text-slate-700" : "text-white/70")}>
                  {user.name}
                </span>
              </div>
            )}
            <Link
              href="/dashboard/user"
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                isLightTheme
                  ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-800"
                  : "bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.07]"
              )}
            >
              <LayoutDashboard size={13} />
              <span className="hidden sm:inline">Workspace</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Title Banner */}
      <div
        className={cn(
          "relative z-10 border-b transition-colors",
          isLightTheme ? "border-slate-200/60 bg-white/20" : "border-white/[0.04] bg-white/[0.01]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-2",
              isLightTheme ? "text-slate-500" : "text-white/30"
            )}
          >
            <Sparkles size={14} className={isLightTheme ? "text-teal-650" : "text-orange-400"} />
            Learning intelligence · Adyapan AI
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "text-2xl sm:text-3xl font-black",
              isLightTheme ? "text-slate-900" : "text-white"
            )}
          >
            Unified Learning Command Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn("text-xs sm:text-sm mt-1.5", isLightTheme ? "text-slate-500" : "text-white/40")}
          >
            Consolidate your learning progress, streak habit details, personalized study planning schedule, weak areas, and coach recommendations.
          </motion.p>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow w-full relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <UnifiedLearningDashboard />
      </main>

      {/* Footer */}
      <footer
        className={cn(
          "relative z-10 text-center py-6 text-[10px] font-bold tracking-widest border-t transition-colors",
          isLightTheme ? "text-slate-400 border-slate-200" : "text-white/20 border-white/[0.04]"
        )}
      >
        © {new Date().getFullYear()} ADYAPAN AI · UNIFIED LEARNING COMMAND CENTER
      </footer>
    </div>
  );
}
