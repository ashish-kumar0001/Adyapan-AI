"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import {
  Mic, Send, RefreshCw, Sparkles, ChevronRight, History, User, Code,
  Award, ShieldAlert, Volume2, Briefcase, Loader2, Calendar, ChevronLeft,
  Trash2, CheckCircle2, XCircle, Info, GraduationCap, Flame, ArrowLeft
} from "lucide-react";

interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  areasForImprovement: string[];
  suggestedAnswers: string[];
  recommendedResources: string[];
}

interface InterviewSession {
  id: string;
  role: string;
  company: string | null;
  type: string; // "technical" | "behavioral" | "general"
  difficulty: string; // "easy" | "medium" | "hard"
  status: string; // "in_progress" | "completed"
  feedback: InterviewFeedback | null;
  createdAt: string;
  messages?: InterviewMessage[];
}

interface InterviewMessage {
  id: string;
  sessionId: string;
  role: "interviewer" | "user" | "feedback";
  content: string;
  createdAt: string;
}

interface InterviewHubViewProps {
  setView: (v: any) => void;
  activeModule?: string;
  theme?: string;
}

export function InterviewHubView({ setView, activeModule = "interview-hub", theme = "dark" }: InterviewHubViewProps) {
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

  // View state: "dashboard" | "active" | "feedback"
  const [screen, setScreen] = useState<"dashboard" | "active" | "feedback">("dashboard");
  
  // Forms & Session config
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Google");
  const [type, setType] = useState<"technical" | "behavioral" | "general">("technical");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // History & Active session data
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  // Loading states
  const [starting, setStarting] = useState(false);
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [ending, setEnding] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState<InterviewSession | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll chat to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Pre-configure type based on activeModule route from sidebar
  useEffect(() => {
    if (activeModule === "interview-hr") {
      setType("behavioral");
    } else if (activeModule === "interview-technical") {
      setType("technical");
    } else {
      setType("general");
    }
  }, [activeModule]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/interview/history");
      if (res.data.success) {
        setHistory(res.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load interview history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStart = async (customType?: "technical" | "behavioral" | "general") => {
    setStarting(true);
    const selectedType = customType || type;
    try {
      const res = await api.post("/interview/start", {
        role,
        company: company.trim() ? company : null,
        type: selectedType,
        difficulty
      });
      if (res.data.success) {
        setActiveSession(res.data.session);
        setMessages(res.data.messages || []);
        setScreen("active");
        setViewingFeedback(null);
      }
    } catch (err) {
      console.error("Error starting interview:", err);
      alert("❌ Failed to initialize interview session. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleSendAnswer = async () => {
    if (!chatInput.trim() || !activeSession || sendingAnswer) return;
    const answer = chatInput.trim();
    setChatInput("");
    setSendingAnswer(true);

    // Optimistically add user message
    const tempUserMsg: InterviewMessage = {
      id: "temp-user",
      sessionId: activeSession.id,
      role: "user",
      content: answer,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/interview/${activeSession.id}/answer`, { answer });
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to send answer:", err);
    } finally {
      setSendingAnswer(false);
    }
  };

  const handleEndInterview = async () => {
    if (!activeSession || ending) return;
    if (!confirm("Are you sure you want to end this interview? This will submit your answers and generate AI feedback.")) return;

    setEnding(true);
    try {
      const res = await api.post(`/interview/${activeSession.id}/end`);
      if (res.data.success) {
        const completedSession = res.data.session;
        setViewingFeedback(completedSession);
        setScreen("feedback");
        loadHistory();
      }
    } catch (err) {
      console.error("Error ending interview:", err);
      alert("❌ Failed to generate feedback report. Try again.");
    } finally {
      setEnding(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return c.green;
    if (score >= 60) return c.primary;
    return c.red;
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "rgba(16,185,129,0.1)";
    if (score >= 60) return "rgba(245,158,11,0.1)";
    return "rgba(239,68,68,0.1)";
  };

  return (
    <div className="relative h-full flex flex-col min-h-[calc(100vh-120px)]" style={{ color: c.text }}>
      <AnimatePresence mode="wait">
        
        {/* ==================== SCREEN 1: DASHBOARD / SETUP ==================== */}
        {screen === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 space-y-8"
          >
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent border border-amber-500/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full uppercase tracking-wider">
                  <Flame size={12} className="animate-pulse" /> AI Interview Coach
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>AI Interview Simulator</h2>
                <p className="text-sm" style={{ color: c.textSec }}>
                  Test your readiness with conversational simulations. Practice HR/behavioral questions or face code/architectural challenges to pass real technical panels.
                </p>
              </div>
              <div className="flex items-center gap-2 p-3.5 rounded-2xl shrink-0" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <Mic size={28} className="text-amber-500" />
                <div>
                  <div className="text-lg font-black text-amber-500">Live AI</div>
                  <div className="text-[10px]" style={{ color: c.textMuted }}>Speech & Behavioral Checks</div>
                </div>
              </div>
            </div>

            {/* Quick Cards Setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "AI HR / Behavioral",
                  desc: "Leadership traits, STAR methodology validation, team culture, and behavioral queries.",
                  icon: <User size={24} className="text-amber-500" />,
                  type: "behavioral" as const,
                  label: "HR behavioral assessment"
                },
                {
                  title: "AI Technical panel",
                  desc: "Coding tasks, software designs, stack concepts, and optimization discussions.",
                  icon: <Code size={24} className="text-cyan-500" />,
                  type: "technical" as const,
                  label: "Tech stack assessment"
                },
                {
                  title: "Mock Interview Setup",
                  desc: "Fully customizable session allowing specific target roles, difficulty tiers, and target companies.",
                  icon: <Briefcase size={24} className="text-emerald-500" />,
                  type: "general" as const,
                  label: "Custom simulation"
                }
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl p-5 border flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer group"
                  style={{ background: c.cardBg, borderColor: c.border }}
                  onClick={() => {
                    setType(card.type);
                    if (card.type !== "general") {
                      handleStart(card.type);
                    } else {
                      // Custom Mock needs input variables, scroll to setup
                      document.getElementById("custom-setup-section")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:border-amber-500/20 group-hover:bg-amber-500/5 transition-all">
                      {card.icon}
                    </div>
                    <h3 className="font-extrabold text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: c.textSec }}>{card.desc}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-[11px] font-bold text-amber-500 group-hover:text-amber-400">
                    <span>{card.type === "general" ? "Configure mock" : "Start session now"}</span>
                    <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Configuration Section */}
            <div id="custom-setup-section" className="p-6 rounded-2xl border" style={{ background: c.cardBg, borderColor: c.border }}>
              <h3 className="text-base font-extrabold mb-4 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Sparkles size={16} className="text-amber-500" /> Customize Interview Session
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSec }}>Target Role</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. SDE-1 / Data Analyst"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                    style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSec }}>Target Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google / Microsoft"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                    style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSec }}>Session Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                    style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                  >
                    <option value="technical">Technical / System Design</option>
                    <option value="behavioral">HR / Behavioral</option>
                    <option value="general">General Fit / Mixed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSec }}>Difficulty Tier</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                    style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                  >
                    <option value="easy">Beginner / Easy</option>
                    <option value="medium">Standard / Medium</option>
                    <option value="hard">Expert / Hard</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleStart()}
                disabled={starting}
                className="inline-flex items-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-xs py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Preparing Panel...
                  </>
                ) : (
                  <>
                    Launch Session <ChevronRight size={12} />
                  </>
                )}
              </button>
            </div>

            {/* Audit / Practice History */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <History size={16} className="text-amber-500" /> Audit History
              </h3>
              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 size={24} className="text-amber-500 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl" style={{ borderColor: c.border }}>
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50 text-gray-400" />
                  <span className="text-xs font-semibold" style={{ color: c.textMuted }}>No interview reports found. Complete a session to see audit results here!</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {history.map((h) => {
                    const hasFeedback = h.feedback !== null;
                    const score = h.feedback?.overallScore || 0;
                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          if (hasFeedback) {
                            setViewingFeedback(h);
                            setScreen("feedback");
                          } else {
                            setActiveSession(h);
                            setMessages(h.messages || []);
                            setScreen("active");
                          }
                        }}
                        className="p-4 border rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                        style={{ background: c.cardBg, borderColor: c.border }}
                      >
                        <div className="min-w-0 flex-1 pr-2 space-y-1">
                          <div className="text-xs font-bold truncate" style={{ color: c.text }}>
                            {h.role} {h.company && `@ ${h.company}`}
                          </div>
                          <div className="text-[10px] capitalize flex items-center gap-1.5" style={{ color: c.textSec }}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: h.type === "technical" ? "#06b6d4" : h.type === "behavioral" ? "#f59e0b" : "#10b981" }} />
                            {h.type} · {h.difficulty} · <Calendar size={10} /> {new Date(h.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {hasFeedback ? (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[11px] shrink-0"
                            style={{ background: scoreBg(score), color: scoreColor(score) }}
                          >
                            {score}%
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Resume
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* ==================== SCREEN 2: ACTIVE SESSION ==================== */}
        {screen === "active" && activeSession && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col h-[calc(100vh-130px)] rounded-2xl border"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b shrink-0" style={{ borderColor: c.border }}>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-amber-500">Live Simulation</div>
                <h3 className="text-sm font-extrabold truncate" style={{ color: c.text }}>
                  {activeSession.role} {activeSession.company && `at ${activeSession.company}`}
                </h3>
              </div>
              <button
                onClick={handleEndInterview}
                disabled={ending}
                className="py-1.5 px-3 rounded-lg bg-red-500/15 border border-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-500/25 transition-colors disabled:opacity-50"
              >
                {ending ? "Evaluating..." : "Submit & End Session"}
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((m, idx) => {
                const isInterviewer = m.role === "interviewer";
                return (
                  <div
                    key={idx}
                    className={`flex ${isInterviewer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isInterviewer
                          ? "bg-white/5 border border-white/10 rounded-tl-sm text-left"
                          : "bg-amber-500/15 border border-amber-500/25 rounded-tr-sm text-right text-amber-500"
                      }`}
                      style={isInterviewer ? { color: c.text } : {}}
                    >
                      <div className="text-[9px] uppercase tracking-wider font-bold mb-1 opacity-60">
                        {isInterviewer ? "AI Panelist" : "Candidate Response"}
                      </div>
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                );
              })}

              {sendingAnswer && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5">
                    <Loader2 size={12} className="text-amber-500 animate-spin" />
                    <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Interviewer is evaluating response...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Visual voice waveform overlay */}
            <div className="px-6 py-2 border-t flex justify-center gap-1 items-center shrink-0 bg-white/[0.01]" style={{ borderColor: c.border }}>
              <Volume2 size={12} style={{ color: c.textMuted }} />
              <div className="flex gap-[3px] items-center h-4">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((bar, i) => (
                  <motion.div
                    key={i}
                    className="w-[2px] bg-amber-500/50 rounded-full"
                    animate={{ height: sendingAnswer ? [4, 16, 4] : [4, 8, 4] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-semibold tracking-wide uppercase ml-1" style={{ color: c.textMuted }}>
                {sendingAnswer ? "Analyzing tone & context" : "Microphone active"}
              </span>
            </div>

            {/* Input Form */}
            <div className="p-4 border-t shrink-0 flex gap-2" style={{ borderColor: c.border }}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your structured answer here (Try STAR format: Situation, Task, Action, Result)..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAnswer();
                  }
                }}
                disabled={sendingAnswer}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors resize-none h-16 max-h-24"
                style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
              />
              <button
                onClick={handleSendAnswer}
                disabled={sendingAnswer || !chatInput.trim()}
                className="px-4 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors flex items-center justify-center shrink-0 disabled:opacity-30 h-16 w-16"
              >
                <Send size={16} />
              </button>
            </div>

          </motion.div>
        )}

        {/* ==================== SCREEN 3: FEEDBACK / REPORT ==================== */}
        {screen === "feedback" && viewingFeedback && viewingFeedback.feedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setScreen("dashboard");
                  setViewingFeedback(null);
                  loadHistory();
                }}
                className="w-8 h-8 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] transition-colors border border-[var(--border-color)]"
                style={{ background: c.cardBg, borderColor: c.border, color: c.text }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Audit Report</h1>
                <p className="text-xs" style={{ color: c.textSec }}>
                  {viewingFeedback.role} {viewingFeedback.company && `at ${viewingFeedback.company}`} · Completed
                </p>
              </div>
            </div>

            {/* Score Ring Summary */}
            <div className="p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-8 justify-around" style={{ background: c.cardBg, borderColor: c.border }}>
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="var(--border-color)" strokeWidth="10" fill="transparent" style={{ stroke: c.border }} />
                  <circle
                    cx="64" cy="64" r="54"
                    stroke={scoreColor(viewingFeedback.feedback.overallScore)}
                    strokeWidth="10" fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - viewingFeedback.feedback.overallScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold" style={{ color: c.text }}>{viewingFeedback.feedback.overallScore}%</span>
                  <span className="block text-[8px] uppercase tracking-wider" style={{ color: c.textMuted }}>Overall score</span>
                </div>
              </div>

              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: scoreBg(viewingFeedback.feedback.overallScore), color: scoreColor(viewingFeedback.feedback.overallScore) }}
                >
                  {viewingFeedback.feedback.overallScore >= 80 ? "Hire Ready" : viewingFeedback.feedback.overallScore >= 60 ? "Proficient" : "Needs Practice"}
                </div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>AI Performance Evaluation</h2>
                <p className="text-xs leading-relaxed max-w-md" style={{ color: c.textSec }}>
                  Your behavioral flow and tech definitions were analyzed. The core feedback details highlight strengths, areas of friction, and suggested strong answers.
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="p-5 rounded-2xl border" style={{ background: c.cardBg, borderColor: c.border }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <CheckCircle2 size={16} className="text-emerald-500" /> Specific Strengths
                </h3>
                <ul className="space-y-2">
                  {viewingFeedback.feedback.strengths.map((str, idx) => (
                    <li key={idx} className="text-xs leading-relaxed flex items-start gap-2" style={{ color: c.textSec }}>
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses / Improvements */}
              <div className="p-5 rounded-2xl border" style={{ background: c.cardBg, borderColor: c.border }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <XCircle size={16} className="text-red-500" /> Focus Areas / Improvements
                </h3>
                <ul className="space-y-2">
                  {viewingFeedback.feedback.areasForImprovement.map((area, idx) => (
                    <li key={idx} className="text-xs leading-relaxed flex items-start gap-2" style={{ color: c.textSec }}>
                      <span className="text-red-500 font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested answers & recommended resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Suggested Strong Answers */}
              <div className="p-5 rounded-2xl border" style={{ background: c.cardBg, borderColor: c.border }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <Info size={16} className="text-amber-500" /> Recommended Answer Templates
                </h3>
                <div className="space-y-3">
                  {viewingFeedback.feedback.suggestedAnswers.map((ans, idx) => (
                    <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs leading-relaxed" style={{ borderColor: c.border }}>
                      <p style={{ color: c.textSec }}>{ans}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Resources */}
              <div className="p-5 rounded-2xl border" style={{ background: c.cardBg, borderColor: c.border }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <GraduationCap size={16} className="text-amber-500" /> Recommended Resources
                </h3>
                <div className="space-y-2">
                  {viewingFeedback.feedback.recommendedResources.map((res, idx) => (
                    <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3" style={{ borderColor: c.border }}>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <GraduationCap size={14} className="text-amber-500" />
                      </div>
                      <div className="text-xs font-bold truncate" style={{ color: c.textSec }}>{res}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transcript Accordion */}
            <div className="p-5 rounded-2xl border space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: c.text }}>
                <History size={16} className="text-amber-500" /> Interview Transcript
              </h3>
              <div className="space-y-4 divide-y divide-white/5" style={{ borderColor: c.border }}>
                {viewingFeedback.messages && viewingFeedback.messages.filter((m: InterviewMessage) => m.role !== "feedback").map((m: InterviewMessage, idx: number) => {
                  const isInterviewer = m.role === "interviewer";
                  return (
                    <div key={m.id} className={`pt-4 first:pt-0 flex flex-col gap-1.5`}>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold" style={{ color: isInterviewer ? c.primary : c.textSec }}>
                        {isInterviewer ? "Interviewer Question" : "Your Answer"}
                      </span>
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: isInterviewer ? c.text : c.textSec }}>
                        {m.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setScreen("dashboard");
                  setViewingFeedback(null);
                  loadHistory();
                }}
                className="py-2.5 px-6 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
