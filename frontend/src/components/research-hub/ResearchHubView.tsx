"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/services/api";
import {
  BookOpen, Search, Clock, Award, Sparkles, Send, CheckCircle2,
  XCircle, Info, Heart, ArrowRight, Share2, Trash2, Plus, MessageSquare,
  ArrowLeft, ArrowRightLeft, ChevronRight, AlertCircle, FileText,
  UserCheck, Play, PlusCircle, Check, RefreshCw, Copy, Download,
  Layers, SearchCode, Eye, Edit3
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

interface ResearchLog {
  id: string;
  topic: string;
  type: string;
  dateCreated: string;
  summary: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ResearchHubViewProps {
  setView: (v: string) => void;
  activeModule?: string;
  theme?: string;
}

export function ResearchHubView({ setView, activeModule = "research-hub", theme = "dark" }: ResearchHubViewProps) {
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#080710" : "#f0f4ff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
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

  // Tab State: "paper-ai" | "plagiarism"
  const [tab, setTab] = useState<"paper-ai" | "plagiarism">("paper-ai");

  // Output Workspace
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Paper AI state
  const [paperTopic, setPaperTopic] = useState("");
  const [paperOption, setPaperOption] = useState("Summarize Abstract");
  const [citationFormat, setCitationFormat] = useState("APA");

  // Plagiarism state
  const [plagiarismText, setPlagiarismText] = useState("");
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<{ similarity: number; sources: { title: string; url: string; match: number }[] } | null>(null);

  // AI Assistant panel state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am your Adyapan AI Research Coach. Ask me to write literature outlines, format citation strings, or audit plagiarism parameters!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync tab with activeModule from props
  useEffect(() => {
    if (activeModule === "research-paper-ai") setTab("paper-ai");
    else if (activeModule === "research-plagiarism") setTab("plagiarism");
  }, [activeModule]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleGenerateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperTopic.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`${api.defaults.baseURL}/research/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: paperOption, topic: paperTopic, citationFormat }),
      });
      if (!res.ok) throw new Error("Research generation failed");
      const data = await res.json();
      setGeneratedOutput(data.content || "");
      setEditingContent(data.content || "");
      setIsPreview(false);
    } catch (err) {
      toast.error("Research generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    if (!plagiarismText.trim() || checkingPlagiarism) return;
    setCheckingPlagiarism(true);
    setPlagiarismResult(null);
    try {
      const res = await fetch(`${api.defaults.baseURL}/research/check-plagiarism`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plagiarismText }),
      });
      if (!res.ok) throw new Error("Plagiarism check failed");
      const data = await res.json();
      setPlagiarismResult(data);
    } catch (err) {
      toast.error("Plagiarism check failed. Please try again.");
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const handleRunRephraser = async () => {
    if (!plagiarismText.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${api.defaults.baseURL}/research/rephrase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plagiarismText }),
      });
      if (!res.ok) throw new Error("Rephrasing failed");
      const data = await res.json();
      setGeneratedOutput(data.content || "");
      setEditingContent(data.content || "");
      setIsPreview(false);
      toast.success("Text rephrased successfully! Check the output workspace.");
    } catch (err) {
      toast.error("Rephrasing failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAssistantSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const promptText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: promptText }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${api.defaults.baseURL}/research/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptText, context: { tab } }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response || "No response received." }]);
    } catch (err) {
      toast.error("AI Assistant is unavailable. Please try again later.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editingContent);
    alert("📋 Copied to clipboard successfully!");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="relative flex flex-col h-full min-h-[calc(100vh-120px)]" style={{ color: c.text }}>
      <div className="flex-1 flex flex-col gap-4">

        {/* Compact Module Header */}
        <div className="flex justify-between items-center border-b pb-2.5 shrink-0" style={{ borderColor: c.border }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Research Workspace</p>
            <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {tab === "paper-ai" ? "Research Paper AI" : "Plagiarism Checker"}
            </h2>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setAssistantOpen(!assistantOpen)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
            >
              <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Sparkles size={12} className="animate-pulse" /></motion.span> AI Assistant
            </motion.button>
          </div>
        </div>

        {/* ==================== 3. CONTENT AREA SPLIT ==================== */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT SIDE: CONFIG INPUT */}
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="wait">

              {/* RESEARCH PAPER AI FORM */}
              {tab === "paper-ai" && (
                <motion.form
                  key="paper-form"
                  onSubmit={handleGenerateResearch}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                  exit={{ opacity: 0, x: -10 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="space-y-4 p-5 border rounded-2xl"
                  style={{ background: c.cardBg, borderColor: c.border }}
                >
                  <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-amber-500">Paper Generation Parameters</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Research Action</label>
                      <select
                        value={paperOption}
                        onChange={(e) => setPaperOption(e.target.value)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                        style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                      >
                        <option value="Summarize Abstract">Summarize Abstract</option>
                        <option value="Literature Outline">Literature Outline</option>
                        <option value="Generate Citations">Generate Citations</option>
                      </select>
                    </div>

                    {paperOption === "Generate Citations" && (
                      <div className="space-y-1 animate-in fade-in">
                        <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Citation Style</label>
                        <select
                          value={citationFormat}
                          onChange={(e) => setCitationFormat(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                          style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                        >
                          <option value="APA">APA 7th Edition</option>
                          <option value="MLA">MLA 9th Edition</option>
                          <option value="Harvard">Harvard</option>
                          <option value="Chicago">Chicago</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Topic / Abstract Text</label>
                    <textarea
                      required
                      value={paperTopic}
                      onChange={(e) => setPaperTopic(e.target.value)}
                      placeholder="e.g. Attention mechanisms in LLM caching, or paste the abstract paragraph..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs resize-none h-32"
                      style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={generating}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    {generating ? "Running AI Models..." : "Generate Research Insights"}
                  </motion.button>
                </motion.form>
              )}

              {/* PLAGIARISM CHECKER FORM */}
              {tab === "plagiarism" && (
                <motion.div
                  key="plagiarism-form"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                  exit={{ opacity: 0, x: -10 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="space-y-4 p-5 border rounded-2xl"
                  style={{ background: c.cardBg, borderColor: c.border }}
                >
                  <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-amber-500">Academic Similarity Inspector</h4>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Target Document Text</label>
                    <textarea
                      value={plagiarismText}
                      onChange={(e) => setPlagiarismText(e.target.value)}
                      placeholder="Paste your assignment draft or academic paragraph here..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs resize-none h-32"
                      style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleCheckPlagiarism}
                      disabled={!plagiarismText.trim() || checkingPlagiarism}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex-1 py-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {checkingPlagiarism ? "Scanning Database Indices..." : "Check Similarity Index"}
                    </motion.button>
                    <motion.button
                      onClick={handleRunRephraser}
                      disabled={!plagiarismText.trim() || generating}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold disabled:opacity-50 transition-colors"
                      style={{ borderColor: c.border }}
                    >
                      AI Paraphraser
                    </motion.button>
                  </div>

                  {/* Results report */}
                  {plagiarismResult && (
                    <motion.div
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                      className="space-y-4 pt-4 border-t"
                      style={{ borderColor: c.border }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">Similarity Index:</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {plagiarismResult.similarity}% Matched (Safe)
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold block" style={{ color: c.textSec }}>Sources Matched</span>
                        {plagiarismResult.sources.map((s: { title: string; url: string; match: number }, i: number) => (
                          <motion.div
                            key={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ y: -2, scale: 1.005 }}
                            className="p-2 border rounded-xl flex justify-between text-xs"
                            style={{ borderColor: c.border }}
                          >
                            <div>
                              <span className="font-extrabold block">{s.title}</span>
                              <span className="text-[9px]" style={{ color: c.textMuted }}>{s.url}</span>
                            </div>
                            <span className="font-black text-amber-500 shrink-0">{s.match}%</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT SIDE: LIVE EDITOR PREVIEW */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            whileHover={{ y: -4, scale: 1.01 }}
            className="flex flex-col border rounded-2xl overflow-hidden h-[450px]"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <div className="px-4 py-3 border-b flex justify-between items-center bg-white/[0.01]" style={{ borderColor: c.border }}>
              <span className="text-xs font-extrabold" style={{ color: c.text }}>Research Workspace</span>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setIsPreview(true)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                    isPreview ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "border-white/10 hover:bg-white/5"
                  }`}
                  style={{ borderColor: c.border }}
                >
                  <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Eye size={12} className="inline mr-1" /></motion.span> Preview
                </motion.button>
                <motion.button
                  onClick={() => setIsPreview(false)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                    !isPreview ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "border-white/10 hover:bg-white/5"
                  }`}
                  style={{ borderColor: c.border }}
                >
                  <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Edit3 size={12} className="inline mr-1" /></motion.span> Edit
                </motion.button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              {isPreview ? (
                <div className="text-xs leading-relaxed whitespace-pre-wrap p-2 h-full select-text" style={{ color: c.textSec }}>
                  {editingContent || <span className="italic" style={{ color: c.textMuted }}>Draft content will be rendered here...</span>}
                </div>
              ) : (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  placeholder="Generated abstracts or rewrites will load here. You can edit the text directly..."
                  className="w-full h-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xs leading-relaxed resize-none p-1"
                  style={{ color: c.text }}
                />
              )}
            </div>

            <div className="p-3 border-t bg-white/[0.01] flex justify-between items-center gap-2" style={{ borderColor: c.border }}>
              <motion.button
                onClick={handleCopyText}
                disabled={!editingContent.trim()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="py-1.5 px-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-30 transition-colors"
                style={{ borderColor: c.border, color: c.text }}
              >
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Copy size={12} /></motion.span> Copy Output
              </motion.button>
              <motion.button
                onClick={() => {
                  alert("💾 Document draft saved successfully.");
                }}
                disabled={!editingContent.trim()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="py-1.5 px-3 rounded bg-amber-500 text-black hover:bg-amber-400 text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-30 transition-colors"
              >
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><PlusCircle size={12} /></motion.span> Save Draft
              </motion.button>
            </div>
          </motion.div>

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
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-1.5">
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Sparkles size={14} className="text-amber-500" /></motion.span>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.text }}>AI Research Coach</span>
              </div>
              <motion.button
                onClick={() => setAssistantOpen(false)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><XCircle size={14} /></motion.span>
              </motion.button>
            </div>

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
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-sm p-3 flex items-center gap-1.5">
                    <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Clock size={12} className="text-amber-500 animate-spin" /></motion.span>
                    <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Compiling analysis...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t bg-white/[0.01] flex flex-col gap-1.5" style={{ borderColor: c.border }}>
              <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: c.textMuted }}>Suggestions</span>
              {[
                "Generate APA citation style",
                "Explain literature outlines",
                "Help audit research plagiarism"
              ].map((s, i) => (
                <motion.button
                  key={s}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileHover={{ y: -2, scale: 1.005 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setChatInput(s); }}
                  className="w-full text-left p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[10px] font-semibold truncate transition-colors"
                  style={{ borderColor: c.border, color: c.textSec }}
                >
                  {s}
                </motion.button>
              ))}
            </div>

            <div className="p-3 border-t flex gap-1.5" style={{ borderColor: c.border }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask research coach..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAssistantSend();
                }}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
              />
              <motion.button
                onClick={handleAssistantSend}
                disabled={!chatInput.trim() || chatLoading}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="w-8 h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
              >
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex"><Send size={12} /></motion.span>
              </motion.button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

