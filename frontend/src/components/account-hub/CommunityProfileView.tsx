"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Award, Users, Globe, Share2, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(t);
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function CommunityProfileView() {
  const theme = useTheme();
  const isDark = theme === "dark";

  const c = {
    text: isDark ? "#ffffff" : "#0f172a",
    textSec: isDark ? "rgba(255,255,255,0.7)" : "#475569",
    textMuted: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    primary: "#f59e0b",
    green: "#10b981",
  };

  const [fullName, setFullName] = useState("Ashish Kumar");
  const [bio, setBio] = useState("SDE Intern & Tech Blogger | Generative AI enthusiast | CSE Grad 2026");

  useEffect(() => {
    const storedName = localStorage.getItem("adyapan-full-name");
    const storedBio = localStorage.getItem("adyapan-bio");
    if (storedName) setFullName(storedName);
    if (storedBio) setBio(storedBio);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto p-1"
      style={{ color: c.text }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <User className="text-amber-500" size={22} /> Community Profile
        </h1>
        <p className="text-xs mt-1" style={{ color: c.textMuted }}>
          View and manage your public rank, statistics, and accomplishments in the Adyapan community.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Profile Summary Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 border rounded-2xl flex flex-col sm:flex-row items-center gap-6" style={{ background: c.cardBg, borderColor: c.border }}>
            <div className="w-20 h-20 rounded-full border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center font-black text-2xl text-amber-500 shrink-0">
              AK
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-extrabold" style={{ color: c.text }}>{fullName}</h2>
              <span className="text-xs font-bold block" style={{ color: c.textMuted }}>@ashishkumar</span>
              <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{bio}</p>
            </div>
          </div>

          {/* Stats widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Profile Completion", val: "92%", icon: <User className="text-amber-500" /> },
              { label: "Reputation Score", val: "1,240", icon: <Award className="text-cyan-500" /> },
              { label: "Followers", val: "880", icon: <Users className="text-emerald-500" /> },
              { label: "Community Rank", val: "#14", icon: <Award className="text-purple-500" /> }
            ].map((card, idx) => (
              <div key={idx} className="p-4 border rounded-xl flex items-center justify-between" style={{ background: c.cardBg, borderColor: c.border }}>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textMuted }}>{card.label}</span>
                  <span className="text-lg font-extrabold block">{card.val}</span>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Published Projects */}
          <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Globe className="text-amber-500" size={16} /> Published Projects
            </h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-xl flex items-center justify-between" style={{ borderColor: c.border }}>
                <div>
                  <span className="font-extrabold block text-sm">Adyapan AI - Education Platform</span>
                  <span className="text-xs" style={{ color: c.textMuted }}>github.com/ashish/adyapan</span>
                </div>
                <Globe size={16} className="text-cyan-500" />
              </div>
              <div className="p-3 border rounded-xl flex items-center justify-between" style={{ borderColor: c.border }}>
                <div>
                  <span className="font-extrabold block text-sm">LLM Query Optimizer</span>
                  <span className="text-xs" style={{ color: c.textMuted }}>github.com/ashish/llm-opt</span>
                </div>
                <Globe size={16} className="text-cyan-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats List */}
          <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
            <h3 className="text-sm font-bold" style={{ color: c.primary }}>Community Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                <span className="text-[10px] block" style={{ color: c.textMuted }}>Profile Views</span>
                <span className="text-base font-black">124</span>
              </div>
              <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                <span className="text-[10px] block" style={{ color: c.textMuted }}>Followers</span>
                <span className="text-base font-black">880</span>
              </div>
              <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                <span className="text-[10px] block" style={{ color: c.textMuted }}>Following</span>
                <span className="text-base font-black">190</span>
              </div>
              <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                <span className="text-[10px] block" style={{ color: c.textMuted }}>Connections</span>
                <span className="text-base font-black">320</span>
              </div>
            </div>
          </div>

          {/* Skills Portfolio */}
          <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
            <h3 className="text-sm font-bold" style={{ color: c.primary }}>Skills Portfolio</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold block mb-2" style={{ color: c.textSec }}>Technical Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Node.js", "Python", "SQL"].map(s => (
                    <span key={s} className="px-2.5 py-1 rounded text-xs font-bold bg-white/5 border" style={{ borderColor: c.border, color: c.textSec }}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-bold block mb-2" style={{ color: c.textSec }}>Verified Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {["DSA Concepts", "Generative APIs"].map(s => (
                    <span key={s} className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 justify-stretch">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 px-4 rounded-xl border hover:bg-white/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={{ borderColor: c.border, background: c.cardBg }}
            >
              <Share2 size={14} /> Share Profile
            </button>
            <button
              onClick={() => toast.info("Messaging is disabled in preview mode.")}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={14} /> Message
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
