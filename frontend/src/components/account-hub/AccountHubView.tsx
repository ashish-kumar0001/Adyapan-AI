"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Settings, CreditCard, TrendingUp, Sparkles, Send, CheckCircle2,
  XCircle, Info, Heart, ArrowRight, Share2, Trash2, Plus, Clock,
  MessageSquare, Award, ArrowLeft, ArrowRightLeft, ChevronRight,
  AlertCircle, FileText, UserCheck, Play, PlusCircle, Check, RefreshCw,
  Globe, Shield, Key, Bell, ShieldCheck, Mail, Lock, Gift, HelpCircle,
  Users, GraduationCap, Calendar, Download
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  type: string;
  dateCreated: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AccountHubViewProps {
  setView: (v: any) => void;
  activeModule?: string;
  theme?: string;
}

export function AccountHubView({ setView, activeModule = "profile", theme = "dark" }: AccountHubViewProps) {
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#080710" : "#f0f4ff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    surfaceHover: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.06)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    text: isDark ? "#ffffff" : "#0f172a",
    textSec: isDark ? "rgba(255,255,255,0.7)" : "#475569",
    textMuted: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
    primary: "#f59e0b",
    primaryDark: "#d97706",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    inputBg: isDark ? "rgba(0,0,0,0.4)" : "#ffffff",
    green: "#10b981",
    red: "#ef4444",
  };

  // Tab State: "profile" | "settings" | "learning" | "billing"
  const [tab, setTab] = useState<"profile" | "settings" | "learning" | "billing">("profile");

  // Sync tab with activeModule from props
  useEffect(() => {
    if (activeModule === "profile") setTab("profile");
    else if (activeModule === "settings") setTab("settings");
    else if (activeModule === "profile-learning") setTab("learning");
    else if (activeModule === "billing") setTab("billing");
  }, [activeModule]);

  // Form states (Manage Account)
  const [fullName, setFullName] = useState("Ashish Kumar");
  const [email, setEmail] = useState("ashish@adyapan.ai");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [bio, setBio] = useState("SDE Intern & Tech Blogger | Generative AI enthusiast | CSE Grad 2026");
  const [privacyProfile, setPrivacyProfile] = useState(true);
  const [privacyResume, setPrivacyResume] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [billingOfferMsg, setBillingOfferMsg] = useState("");

  // AI Assistant panel state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am your Adyapan AI Account Assistant. Ask me to update your settings, check billing information, or recommend learning paths!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAssistantSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const promptText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: promptText }]);
    setChatLoading(true);

    try {
      await new Promise(r => setTimeout(r, 1500));
      let responseText = "I parsed your query but didn't find any direct triggers. Try prompts like:\n- *'Show my learning progress'* \n- *'How many credits do I have left?'*";

      if (promptText.toLowerCase().includes("learning") || promptText.toLowerCase().includes("progress")) {
        setTab("learning");
        responseText = "📈 **AI Learning Coach**: You have completed **5 courses** and **24 topics** with a daily learning streak of **7 days**. I suggest continuing with Data Structures practice next.";
      } else if (promptText.toLowerCase().includes("credit") || promptText.toLowerCase().includes("billing")) {
        setTab("billing");
        responseText = "💳 **AI Billing Checker**: You have **36 AI Credits** remaining on your Premium Plan. Your next renewal is scheduled for August 1, 2026.";
      } else if (promptText.toLowerCase().includes("profile") || promptText.toLowerCase().includes("bio")) {
        setTab("profile");
        responseText = "👤 **AI Profile Auditor**: Your community rank is **#14** and you have **880 followers**. I suggest adding a live project link to maximize connection opportunities.";
      } else if (promptText.toLowerCase().includes("settings") || promptText.toLowerCase().includes("security")) {
        setTab("settings");
        responseText = "⚙️ **AI Security Guide**: You can toggle Two-Factor Authentication or manage your profile visibility directly from the **Manage Account** tab.";
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: responseText }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "ADYAPAN20") {
      setBillingOfferMsg("🎉 Coupon Applied! You get 20% discount on your next renewal.");
    } else {
      setBillingOfferMsg("❌ Invalid coupon code.");
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-[calc(100vh-120px)]" style={{ color: c.text }}>
      <div className="flex-1 flex flex-col gap-6">

        {/* ==================== 1. CONTEXT-SPECIFIC DASHBOARD CARDS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          {tab === "profile" && [
            { label: "Profile Completion", val: "92%", icon: <User className="text-amber-500" /> },
            { label: "Reputation Score", val: "1,240", icon: <Award className="text-cyan-500" /> },
            { label: "Followers", val: "880", icon: <Users className="text-emerald-500" /> },
            { label: "Community Rank", val: "#14", icon: <Award className="text-purple-500" /> }
          ].map((card, idx) => (
            <div key={idx} className="p-4 border rounded-xl flex items-center justify-between animate-in fade-in" style={{ background: c.cardBg, borderColor: c.border }}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>{card.label}</span>
                <span className="text-xl font-extrabold block" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.val}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                {card.icon}
              </div>
            </div>
          ))}

          {tab === "settings" && [
            { label: "Profile Status", val: "Verified", icon: <ShieldCheck className="text-emerald-500" /> },
            { label: "Connected Accounts", val: "3 Active", icon: <Globe className="text-cyan-500" /> },
            { label: "Security Status", val: "Strong", icon: <Lock className="text-amber-500" /> },
            { label: "Active Devices", val: "2 Devices", icon: <Clock className="text-purple-500" /> }
          ].map((card, idx) => (
            <div key={idx} className="p-4 border rounded-xl flex items-center justify-between animate-in fade-in" style={{ background: c.cardBg, borderColor: c.border }}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>{card.label}</span>
                <span className="text-xl font-extrabold block" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.val}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                {card.icon}
              </div>
            </div>
          ))}

          {tab === "learning" && [
            { label: "Learning Hours", val: "42 hrs", icon: <Clock className="text-amber-500" /> },
            { label: "Courses Completed", val: "5", icon: <GraduationCap className="text-emerald-500" /> },
            { label: "Weekly Progress", val: "84%", icon: <TrendingUp className="text-cyan-500" /> },
            { label: "Current Streak", val: "7 Days", icon: <Award className="text-purple-500" /> }
          ].map((card, idx) => (
            <div key={idx} className="p-4 border rounded-xl flex items-center justify-between animate-in fade-in" style={{ background: c.cardBg, borderColor: c.border }}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>{card.label}</span>
                <span className="text-xl font-extrabold block" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.val}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                {card.icon}
              </div>
            </div>
          ))}

          {tab === "billing" && [
            { label: "Current Plan", val: "Premium", icon: <Sparkles className="text-amber-500 animate-pulse" /> },
            { label: "Next Renewal", val: "Aug 1, 2026", icon: <Calendar className="text-cyan-500" /> },
            { label: "AI Credits Left", val: "36 / 100", icon: <Award className="text-emerald-500" /> },
            { label: "Recent Invoice", val: "#INV-928", icon: <FileText className="text-purple-500" /> }
          ].map((card, idx) => (
            <div key={idx} className="p-4 border rounded-xl flex items-center justify-between animate-in fade-in" style={{ background: c.cardBg, borderColor: c.border }}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>{card.label}</span>
                <span className="text-xl font-extrabold block" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.val}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ==================== 2. HEADER TITLE & AI ASSISTANT ==================== */}
        <div className="flex justify-between items-center border-b pb-2.5 shrink-0" style={{ borderColor: c.border }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Account Workspace</p>
            <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {tab === "profile" && "View Community Profile"}
              {tab === "settings" && "Manage Account"}
              {tab === "learning" && "Learning Progress"}
              {tab === "billing" && "Billing & Plans"}
            </h2>
          </div>
          <button
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
          >
            <Sparkles size={12} className="animate-pulse" /> AI Assistant
          </button>
        </div>

        {/* ==================== 3. CONTENT AREA ==================== */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {/* TAB A: VIEW COMMUNITY PROFILE */}
            {tab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Profile Overview */}
                <div className="p-6 border rounded-2xl flex flex-col sm:flex-row items-center gap-6" style={{ background: c.cardBg, borderColor: c.border }}>
                  <div className="w-20 h-20 rounded-full border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center font-black text-2xl text-amber-500 shrink-0">
                    AK
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h2 className="text-base font-extrabold" style={{ color: c.text }}>{fullName}</h2>
                    <span className="text-xs font-bold block" style={{ color: c.textSec }}>@ashishkumar</span>
                    <p className="text-xs leading-relaxed max-w-xl" style={{ color: c.textMuted }}>{bio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats list */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Community Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="text-[10px] block" style={{ color: c.textMuted }}>Profile Views</span>
                        <span className="text-sm font-black">{124}</span>
                      </div>
                      <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="text-[10px] block" style={{ color: c.textMuted }}>Followers</span>
                        <span className="text-sm font-black">{880}</span>
                      </div>
                      <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="text-[10px] block" style={{ color: c.textMuted }}>Following</span>
                        <span className="text-sm font-black">{190}</span>
                      </div>
                      <div className="p-3 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="text-[10px] block" style={{ color: c.textMuted }}>Connections</span>
                        <span className="text-sm font-black">{320}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Skills Portfolio</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold block mb-1.5" style={{ color: c.textSec }}>Technical Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["React", "TypeScript", "Node.js", "Python", "SQL"].map(s => (
                            <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10" style={{ borderColor: c.border, color: c.textSec }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold block mb-1.5" style={{ color: c.textSec }}>Verified Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["DSA Concepts", "Generative APIs"].map(s => (
                            <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Published Projects</h4>
                    <div className="space-y-3 text-xs">
                      <div className="p-2 border rounded-xl flex items-center justify-between" style={{ borderColor: c.border }}>
                        <div>
                          <span className="font-extrabold block">Adyapan AI - Education Platform</span>
                          <span className="text-[9px]" style={{ color: c.textMuted }}>github.com/ashish/adyapan</span>
                        </div>
                        <Globe size={14} className="text-cyan-500" />
                      </div>
                      <div className="p-2 border rounded-xl flex items-center justify-between" style={{ borderColor: c.border }}>
                        <div>
                          <span className="font-extrabold block">LLM Query Optimizer</span>
                          <span className="text-[9px]" style={{ color: c.textMuted }}>github.com/ashish/llm-opt</span>
                        </div>
                        <Globe size={14} className="text-cyan-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => alert("📤 Copied profile link to clipboard.")}
                    className="py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-colors"
                    style={{ borderColor: c.border }}
                  >
                    Share Profile
                  </button>
                  <button
                    onClick={() => alert("💬 Direct messaging is simulated.")}
                    className="py-2 px-4 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB B: MANAGE ACCOUNT */}
            {tab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal details */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Personal Information</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Full Name</label>
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs"
                          style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Email Address</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs"
                          style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Phone Number</label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs"
                          style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Connected Accounts & Security */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Connected Accounts</h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center p-2 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="font-semibold">Google Account</span>
                        <span className="text-emerald-500 font-bold">Connected</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="font-semibold">GitHub OAuth</span>
                        <span className="text-emerald-500 font-bold">Connected</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded-xl" style={{ borderColor: c.border }}>
                        <span className="font-semibold">LinkedIn Profile</span>
                        <span className="text-gray-400 hover:text-white cursor-pointer font-bold">Connect</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 pt-2">Security</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="text-xs">
                          <span className="font-semibold block">Two-Factor Authentication</span>
                          <span className="text-[10px] text-gray-400">Secure account logins with SMS/Email checks.</span>
                        </div>
                        <button
                          onClick={() => setTwoFactor(!twoFactor)}
                          className={`w-10 h-6 rounded-full relative transition-colors ${twoFactor ? "bg-amber-500" : "bg-white/10"}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${twoFactor ? "right-1" : "left-1"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy settings */}
                <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Privacy Visibility</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs">
                        <span className="font-semibold block">Public Community Profile</span>
                        <span className="text-[10px] text-gray-400">Allow followers to view achievements and feeds.</span>
                      </div>
                      <button
                        onClick={() => setPrivacyProfile(!privacyProfile)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${privacyProfile ? "bg-amber-500" : "bg-white/10"}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${privacyProfile ? "right-1" : "left-1"}`} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs">
                        <span className="font-semibold block">Resume Visibility</span>
                        <span className="text-[10px] text-gray-400">Share resume documents with partner recruiters.</span>
                      </div>
                      <button
                        onClick={() => setPrivacyResume(!privacyResume)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${privacyResume ? "bg-amber-500" : "bg-white/10"}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${privacyResume ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => alert("✅ Account preferences updated successfully.")}
                    className="py-2 px-4 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB C: LEARNING PROGRESS */}
            {tab === "learning" && (
              <motion.div
                key="learning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Stats overview */}
                <div className="p-6 border rounded-2xl flex flex-col md:flex-row items-center gap-8 justify-around bg-white/[0.01]" style={{ borderColor: c.border }}>
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="46" stroke="var(--border-color)" strokeWidth="8" fill="transparent" style={{ stroke: c.border }} />
                      <circle
                        cx="56" cy="56" r="46"
                        stroke={c.primary}
                        strokeWidth="8" fill="transparent"
                        strokeDasharray={2 * Math.PI * 46}
                        strokeDashoffset={2 * Math.PI * 46 * (1 - 0.78)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-extrabold" style={{ color: c.text }}>78%</span>
                      <span className="block text-[8px] uppercase tracking-wider" style={{ color: c.textMuted }}>Overall Completion</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center md:text-left">
                    <h4 className="text-sm font-extrabold">Learning Dashboard</h4>
                    <p className="text-xs leading-relaxed max-w-md" style={{ color: c.textSec }}>
                      You spent **42 hours** studying core programming structures and solved **15 coding challenges** this month. Follow your study roadmap.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Topic completeness */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Subject Mastery</h4>
                    {[
                      { label: "Data Structures", val: 80 },
                      { label: "Database Management", val: 75 },
                      { label: "System Design basics", val: 50 }
                    ].map(subj => (
                      <div key={subj.label} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold" style={{ color: c.textSec }}>
                          <span>{subj.label}</span>
                          <span>{subj.val}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 border overflow-hidden" style={{ borderColor: c.border }}>
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${subj.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Achievements */}
                  <div className="p-5 border rounded-2xl space-y-3" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Active Achievements</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 border rounded-xl flex items-center gap-2" style={{ borderColor: c.border }}>
                        <Award size={16} className="text-amber-500 shrink-0" />
                        <div>
                          <span className="font-bold block">7 Days Streak</span>
                          <span className="text-[9px] text-gray-400">Daily learning</span>
                        </div>
                      </div>
                      <div className="p-2.5 border rounded-xl flex items-center gap-2" style={{ borderColor: c.border }}>
                        <Award size={16} className="text-cyan-500 shrink-0" />
                        <div>
                          <span className="font-bold block">DSA Conqueror</span>
                          <span className="text-[9px] text-gray-400">15 problems solved</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB D: BILLING */}
            {tab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Billing options grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current plan */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Plan details</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-2" style={{ borderColor: c.border }}>
                        <span style={{ color: c.textSec }}>Active Subscription</span>
                        <span className="font-bold text-amber-500">Premium Tier</span>
                      </div>
                      <div className="flex justify-between border-b pb-2" style={{ borderColor: c.border }}>
                        <span style={{ color: c.textSec }}>Billing Interval</span>
                        <span className="font-bold">Monthly</span>
                      </div>
                      <div className="flex justify-between border-b pb-2" style={{ borderColor: c.border }}>
                        <span style={{ color: c.textSec }}>Next Renewal Date</span>
                        <span className="font-bold">August 1, 2026</span>
                      </div>
                      <div className="flex justify-between" style={{ color: c.textSec }}>
                        <span>Benefits Included</span>
                        <span className="font-bold text-emerald-500">Unlimited AI Generations</span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon & Payment */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Apply Offers / Coupons</h4>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="e.g. ADYAPAN20"
                        className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                        style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                      />
                      <button
                        type="submit"
                        className="py-1.5 px-3 rounded bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                    {billingOfferMsg && <p className="text-[10px] font-semibold" style={{ color: billingOfferMsg.startsWith("❌") ? c.red : c.green }}>{billingOfferMsg}</p>}

                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 pt-2">Saved Payment Method</h4>
                    <div className="p-2 border rounded-xl flex items-center justify-between text-xs" style={{ borderColor: c.border }}>
                      <span className="font-semibold">Visa Ending in •••• 4242</span>
                      <span className="text-[10px] text-gray-400">Default card</span>
                    </div>
                  </div>
                </div>

                {/* Billing Invoice history */}
                <div className="p-5 border rounded-2xl space-y-3" style={{ background: c.cardBg, borderColor: c.border }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Invoice History</h4>
                  <div className="space-y-2 text-xs leading-relaxed">
                    {[
                      { id: "INV-928", date: "July 1, 2026", amt: "$15.00", status: "Paid" },
                      { id: "INV-815", date: "June 1, 2026", amt: "$15.00", status: "Paid" }
                    ].map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-2 border rounded-xl" style={{ borderColor: c.border }}>
                        <div>
                          <span className="font-bold block">{inv.id} · {inv.date}</span>
                          <span className="text-[9px] text-emerald-500">{inv.status}</span>
                        </div>
                        <button
                          onClick={() => alert(`📥 Downloading PDF Invoice ${inv.id}`)}
                          className="py-1 px-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-bold flex items-center gap-1 transition-colors"
                          style={{ borderColor: c.border, color: c.textSec }}
                        >
                          <Download size={10} /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ==================== 4. FLOATING CHAT SIDEBAR PANEL ==================== */}
      <AnimatePresence>
        {assistantOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-[70px] right-0 bottom-0 z-[190] w-80 border-l flex flex-col shadow-2xl"
            style={{ background: isDark ? "#0d1117" : "#ffffff", borderColor: c.border }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.text }}>AI Account Assistant</span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle size={14} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, idx) => {
                const isAI = msg.role === "assistant";
                return (
                  <div key={idx} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                        isAI
                          ? "bg-white/5 border border-white/10 rounded-tl-sm"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-tr-sm"
                      }`}
                      style={{ borderColor: c.border }}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-sm p-3 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500 animate-spin" />
                    <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Drafting response...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            <div className="p-3 border-t bg-white/[0.01] flex flex-col gap-1.5" style={{ borderColor: c.border }}>
              <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: c.textMuted }}>Suggestions</span>
              {[
                "Show my learning progress",
                "How many credits do I have left?",
                "Suggest weak profile topics"
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setChatInput(s); }}
                  className="w-full text-left p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[10px] font-semibold truncate transition-colors"
                  style={{ borderColor: c.border, color: c.textSec }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input form */}
            <div className="p-3 border-t flex gap-1.5" style={{ borderColor: c.border }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask account assistant..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAssistantSend();
                }}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
              />
              <button
                onClick={handleAssistantSend}
                disabled={!chatInput.trim() || chatLoading}
                className="w-8 h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
              >
                <Send size={12} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
