"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { LearningAnalyticsDashboard } from "@/components/analytics-hub/LearningAnalyticsDashboard";
import { ArrowLeft, GraduationCap, LayoutDashboard, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function StandaloneLearningAnalyticsPage() {
  // 1. Secure client-side route guard
  useRequireAuth("USER");

  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawUser = localStorage.getItem("adyapan-user") || sessionStorage.getItem("adyapan-user");
      if (rawUser) {
        try {
          setUser(JSON.parse(rawUser));
        } catch (e) {
          console.error("Failed to parse user profile details", e);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080710] text-white flex flex-col font-sans">
      {/* Immersive Aurora Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Standalone Nav Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080710]/80 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/user"
              className="p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-white/80 transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="text-amber-500" size={24} />
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                Adyapan AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.01]">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-500">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-white/80">{user.name}</span>
              </div>
            )}
            <Link
              href="/dashboard/user"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all"
            >
              <LayoutDashboard size={13} />
              Back to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10">
        <LearningAnalyticsDashboard theme="dark" />
      </main>

      {/* Footer (Print layout helper) */}
      <footer className="text-center py-6 text-white/30 text-[10px] font-bold tracking-widest border-t border-white/5 print:text-black print:border-black/10">
        &copy; {new Date().getFullYear()} ADYAPAN AI LEARNING ANALYTICS REPORT. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}

