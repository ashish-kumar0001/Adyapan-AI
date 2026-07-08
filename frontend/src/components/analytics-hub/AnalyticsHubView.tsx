"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Search, Calendar, DollarSign, Send, Sparkles, CheckCircle2,
  XCircle, Info, Heart, ArrowRight, Share2, Trash2, Plus, Clock,
  MessageSquare, Award, ArrowLeft, ArrowRightLeft, ChevronRight,
  AlertCircle, FileText, UserCheck, Play, PlusCircle, Check, RefreshCw,
  TrendingUp, Award as BadgeIcon, BookOpen, GraduationCap, Users, Layout, LineChart as ChartIcon
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

import { LearningAnalyticsDashboard } from "./LearningAnalyticsDashboard";
import { api } from "@/services/api";

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

interface PerformanceLog {
  id: string;
  role: string;
  type: string;
  date: string;
  score: number;
  feedback: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnalyticsHubViewProps {
  setView: (v: any) => void;
  activeModule?: string;
  theme?: string;
}

const EMPTY_INTERVIEW_LOGS: PerformanceLog[] = [];

export function AnalyticsHubView({ setView, activeModule = "analytics-hub", theme = "dark" }: AnalyticsHubViewProps) {
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#080710" : "#f0f4ff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    surfaceHover: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
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

  // Tab State: "learning" | "interview" | "resume" | "skills"
  const [tab, setTab] = useState<"learning" | "interview" | "resume" | "skills">("learning");

  // Selected Item logs
  const [selectedLog, setSelectedLog] = useState<PerformanceLog | null>(null);

  // AI Assistant panel state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am your Adyapan AI Performance Coach. Ask me to parse your learning logs, audit interview feedback, or recommend skill paths!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync tab with activeModule from props
  useEffect(() => {
    if (activeModule === "analytics-learning") setTab("learning");
    else if (activeModule === "analytics-interview") setTab("interview");
    else if (activeModule === "analytics-resume") setTab("resume");
    else if (activeModule === "analytics-skills") setTab("skills");
  }, [activeModule]);

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
      const res = await api.post("/analytics/chat", { query: promptText, tab });
      const data = res.data;
      const responseText = data?.response || "I couldn't process that request. Please try again.";
      setChatMessages(prev => [...prev, { role: "assistant", content: responseText }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col h-full min-h-[calc(100vh-120px)]"
      style={{ color: c.text }}
    >
      <div className="flex-1 flex flex-col gap-4">

        {/* Compact Module Header */}
        <div className="flex justify-between items-center border-b pb-2.5 shrink-0" style={{ borderColor: c.border }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Analytics Workspace</p>
            <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {tab === "learning" && "Learning Progress"}
              {tab === "interview" && "Interview Progress"}
              {tab === "resume" && "Resume Score"}
              {tab === "skills" && "Skill Growth"}
            </h2>
          </div>
          <motion.button
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
            >
              <Sparkles size={12} className="animate-pulse" />
            </motion.div> AI Assistant
          </motion.button>
        </div>

        {/* ==================== 3. CONTENT AREA ==================== */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {/* TAB A: LEARNING PROGRESS */}
            {tab === "learning" && (
              <LearningAnalyticsDashboard setView={setView} theme={theme} />
            )}

            {/* TAB B: INTERVIEW PROGRESS */}
            {tab === "interview" && (
              <motion.div
                key="interview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Scoring cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Mocks Completed", val: "6" },
                    { label: "Avg Interview Score", val: "82%" },
                    { label: "Communication Flow", val: "88%" },
                    { label: "Technical Core", val: "80%" }
                  ].map((s, idx) => (
                    <motion.div
                      key={idx}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={idx}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="p-4 border rounded-xl text-center space-y-1 bg-white/[0.01]"
                      style={{ borderColor: c.border }}
                    >
                      <span className="text-[9px] uppercase tracking-wider font-bold block" style={{ color: c.textMuted }}>{s.label}</span>
                      <span className="text-base font-black" style={{ color: c.text }}>{s.val}</span>
                    </motion.div>
                  ))}
                </div>

                {/* History Table */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="p-5 border rounded-2xl space-y-4 bg-white/[0.01]" style={{ borderColor: c.border }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Interview Log History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: c.border, color: c.textSec }}>
                          <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Session Name</th>
                          <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Category</th>
                          <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Date</th>
                          <th className="pb-2 font-bold uppercase tracking-wider text-[10px]">Score</th>
                          <th className="pb-2 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: c.border }}>
                        {EMPTY_INTERVIEW_LOGS.map((log, i) => (
                          <motion.tr
                            key={log.id}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-2.5 font-bold">{log.role}</td>
                            <td className="py-2.5" style={{ color: c.textSec }}>{log.type}</td>
                            <td className="py-2.5" style={{ color: c.textSec }}>{log.date}</td>
                            <td className="py-2.5 font-black text-amber-500">{log.score}%</td>
                            <td className="py-2.5 text-right">
                              <motion.button
                                onClick={() => setSelectedLog(log)}
                                className="py-1 px-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold transition-all"
                                style={{ borderColor: c.border }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                              >
                                View Feedback
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {EMPTY_INTERVIEW_LOGS.length === 0 && (
                      <div className="py-8 text-center text-sm" style={{ color: c.textMuted }}>
                        No interview logs yet. Complete a mock interview to see your performance history.
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* TAB C: RESUME SCORE */}
            {tab === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Scoring metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Detailed Scores */}
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="p-5 border rounded-2xl space-y-4 bg-white/[0.01]"
                    style={{ borderColor: c.border }}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider">Resume Quality Metrics</h4>
                    {[
                      { label: "Professional Summary Quality", score: 95, color: "#10b981" },
                      { label: "Project Descriptions Weight", score: 85, color: "#06b6d4" },
                      { label: "Core Skills Coverage", score: 90, color: "#8b5cf6" },
                      { label: "Education & Details alignment", score: 95, color: "#ec4899" }
                    ].map((m, i) => (
                      <motion.div
                        key={m.label}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className="space-y-1.5"
                      >
                        <div className="flex justify-between text-[11px] font-bold" style={{ color: c.textSec }}>
                          <span>{m.label}</span>
                          <span>{m.score}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 border overflow-hidden" style={{ borderColor: c.border }}>
                          <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: m.color }} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Highlights & missing blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="p-5 border rounded-2xl space-y-3 bg-white/[0.01]"
                      style={{ borderColor: c.border }}
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 280, damping: 18 }}
                        >
                          <CheckCircle2 size={14} />
                        </motion.div> Section Completions
                      </h4>
                      <ul className="space-y-1.5 text-xs font-semibold" style={{ color: c.textSec }}>
                        <li>✓ Summary Statement</li>
                        <li>✓ Projects Section</li>
                        <li>✓ Education Details</li>
                        <li>✓ Contact Details</li>
                      </ul>
                    </motion.div>

                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={1}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="p-5 border rounded-2xl space-y-3 bg-white/[0.01]"
                      style={{ borderColor: c.border }}
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 280, damping: 18 }}
                        >
                          <Info size={14} />
                        </motion.div> Missing Areas
                      </h4>
                      <ul className="space-y-1.5 text-xs font-semibold" style={{ color: c.textSec }}>
                        <li>• Custom Hobbies</li>
                        <li>• Certifications</li>
                        <li>• LinkedIn Outreach URL</li>
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB D: SKILL GROWTH */}
            {tab === "skills" && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Growth stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category level */}
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="p-5 border rounded-2xl space-y-4 bg-white/[0.01]"
                    style={{ borderColor: c.border }}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider">Skill Mastery Levels</h4>
                    {[
                      { label: "Programming Languages (Python, Java)", val: 90, color: "#10b981" },
                      { label: "Web Development (React, Next)", val: 85, color: "#06b6d4" },
                      { label: "Database Management (SQL, Postgres)", val: 80, color: "#8b5cf6" },
                      { label: "Machine Learning Concepts", val: 70, color: "#f59e0b" },
                      { label: "Cloud Computing (AWS, GCP)", val: 60, color: "#ec4899" }
                    ].map((skill, i) => (
                      <motion.div
                        key={skill.label}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className="space-y-1.5"
                      >
                        <div className="flex justify-between text-[11px] font-bold" style={{ color: c.textSec }}>
                          <span>{skill.label}</span>
                          <span>{skill.val}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 border overflow-hidden" style={{ borderColor: c.border }}>
                          <div className="h-full rounded-full" style={{ width: `${skill.val}%`, background: skill.color }} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Growth log timeline */}
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="p-5 border rounded-2xl space-y-4 bg-white/[0.01]"
                    style={{ borderColor: c.border }}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider">Growth Log Timeline</h4>
                    <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                      {[
                        { title: "Next.js & Router architectures", date: "June 2026", desc: "Added to project stack, master metrics achieved." },
                        { title: "TypeScript & Data Schemas", date: "May 2026", desc: "Integrated types into global database schemas." },
                        { title: "Generative AI API integration", date: "April 2026", desc: "Completed Gemini model pipeline completions." }
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          custom={idx}
                          className="pl-6 relative space-y-1"
                        >
                          <div className="absolute left-[5px] top-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <div className="flex justify-between text-[10px] font-bold">
                            <span style={{ color: c.text }}>{item.title}</span>
                            <span style={{ color: c.textMuted }}>{item.date}</span>
                          </div>
                          <p className="text-[10px]" style={{ color: c.textSec }}>{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ==================== 4. CENTRAL AI PERFORMANCE INSIGHTS ==================== */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          whileHover={{ y: -4, scale: 1.01 }}
          className="p-5 border rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/10 space-y-2 shrink-0"
        >
          <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-amber-500" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
            >
              <Sparkles size={14} />
            </motion.div> AI Performance Insights
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <motion.li
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="flex items-start gap-2"
              style={{ color: c.textSec }}
            >
              <span className="text-amber-500 font-bold">•</span>
              <span>Your interview scores improved by **18%** this month. Keep practicing!</span>
            </motion.li>
            <motion.li
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="flex items-start gap-2"
              style={{ color: c.textSec }}
            >
              <span className="text-amber-500 font-bold">•</span>
              <span>Continue practicing **Data Structures** to improve placement readiness.</span>
            </motion.li>
            <motion.li
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="flex items-start gap-2"
              style={{ color: c.textSec }}
            >
              <span className="text-amber-500 font-bold">•</span>
              <span>Completing 2 more mock tests can unlock top tier recruiter readiness levels.</span>
            </motion.li>
            <motion.li
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex items-start gap-2"
              style={{ color: c.textSec }}
            >
              <span className="text-amber-500 font-bold">•</span>
              <span>Focus on **Machine Learning projects** to strengthen your resume match rate.</span>
            </motion.li>
          </ul>
        </motion.div>

      </div>

      {/* ==================== 5. DETAIL DIALOG FEEDBACK MODAL ==================== */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl relative"
              style={{ background: isDark ? "#0d1117" : "#ffffff", borderColor: c.border }}
            >
              <h3 className="font-extrabold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Interview Session Feedback</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] block" style={{ color: c.textMuted }}>Session Name / Category</span>
                  <span className="font-bold">{selectedLog.role} ({selectedLog.type})</span>
                </div>
                <div>
                  <span className="text-[10px] block" style={{ color: c.textMuted }}>Overall Grade Score</span>
                  <span className="font-black text-amber-500 text-sm">{selectedLog.score}%</span>
                </div>
                <div>
                  <span className="text-[10px] block" style={{ color: c.textMuted }}>Detailed Feedback Commentary</span>
                  <p className="leading-relaxed" style={{ color: c.textSec }}>{selectedLog.feedback}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <motion.button
                  onClick={() => setSelectedLog(null)}
                  className="py-1.5 px-3 rounded bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-colors"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Close Feedback
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 6. FLOATING CHAT SIDEBAR PANEL ==================== */}
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
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                >
                  <Sparkles size={14} className="text-amber-500" />
                </motion.div>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.text }}>AI Performance Coach</span>
              </div>
              <motion.button
                onClick={() => setAssistantOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <XCircle size={14} />
              </motion.button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, idx) => {
                const isAI = msg.role === "assistant";
                return (
                  <motion.div
                    key={idx}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={idx}
                    className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                  >
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
                  </motion.div>
                );
              })}
              <AnimatePresence>
                {chatLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-sm p-3 flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-500 animate-spin" />
                      <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Drafting response...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            <div className="p-3 border-t bg-white/[0.01] flex flex-col gap-1.5" style={{ borderColor: c.border }}>
              <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: c.textMuted }}>Suggestions</span>
              {[
                "Show learning hours",
                "Recommend missing skills",
                "Audit my interview performance"
              ].map((s, i) => (
                <motion.button
                  key={s}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  onClick={() => { setChatInput(s); }}
                  className="w-full text-left p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[10px] font-semibold truncate transition-colors"
                  style={{ borderColor: c.border, color: c.textSec }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>

            {/* Input form */}
            <div className="p-3 border-t flex gap-1.5" style={{ borderColor: c.border }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask performance coach..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAssistantSend();
                }}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
              />
              <motion.button
                onClick={handleAssistantSend}
                disabled={!chatInput.trim() || chatLoading}
                className="w-8 h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Send size={12} />
              </motion.button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
