"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, Clock, Award, Sparkles, Send, CheckCircle2,
  XCircle, Info, Heart, ArrowRight, Share2, Trash2, Plus, MessageSquare,
  ArrowLeft, ArrowRightLeft, ChevronRight, AlertCircle, FileText,
  UserCheck, Play, PlusCircle, Check, RefreshCw, Copy, Download,
  Layers, SearchCode, Eye, Edit3
} from "lucide-react";

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
  setView: (v: any) => void;
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
  const [plagiarismResult, setPlagiarismResult] = useState<any | null>(null);

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
      await new Promise(r => setTimeout(r, 1800));
      let draft = "";
      if (paperOption === "Summarize Abstract") {
        draft = `RESEARCH SUMMARY: ${paperTopic.toUpperCase()}\n\nAbstract:\nThis audit details generative language structures and token distribution patterns. By mapping local database layers to API endpoints, developers can mitigate latency spikes.\n\nKey Insights:\n1. Attention mechanisms optimize response alignment.\n2. In-memory data transfers reduce query latency by 24%.\n\nConclusion:\nIntegrating modular model weights results in robust runtime performance.`;
      } else if (paperOption === "Literature Outline") {
        draft = `LITERATURE REVIEW OUTLINE: ${paperTopic.toUpperCase()}\n\n1. Introduction & Background\n   - Evolution of transformers and token weights.\n   - Problem Statement: Network call latencies in API-driven dashboards.\n2. Current Methodologies\n   - Pre-trained foundation models vs fine-tuned layers.\n   - Limitations: High resource footprints and model drift.\n3. Proposed Architectural Framework\n   - Edge compilation and database-side inference routines.`;
      } else {
        draft = `CITATION FORMAT (${citationFormat}):\n\nKumar, A. (2026). Optimizing Generative AI Workflows inside Campus Placement Dashboards. Journal of Academic Software Systems, 14(2), 120-135.`;
      }
      setGeneratedOutput(draft);
      setEditingContent(draft);
      setIsPreview(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    if (!plagiarismText.trim() || checkingPlagiarism) return;
    setCheckingPlagiarism(true);
    setPlagiarismResult(null);
    try {
      await new Promise(r => setTimeout(r, 2000));
      setPlagiarismResult({
        similarity: 12,
        sources: [
          { title: "Academic LLM Structures", url: "https://arxiv.org/abs/2304.0928", match: 8 },
          { title: "Database Edge Inferences", url: "https://ieee.org/document/8291", match: 4 }
        ],
        highlightedText: plagiarismText
      });
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const handleRunRephraser = async () => {
    if (!plagiarismText.trim()) return;
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const rephrased = `Originality Audit Rephrase:\n\nOur structural design implements local compiler optimizations for AI models. By hosting key weights inside client-side caches and utilizing edge routing loops, users experience faster query evaluations and lower connection overhead.`;
      setGeneratedOutput(rephrased);
      setEditingContent(rephrased);
      setIsPreview(false);
      alert("✨ Text rephrased by AI successfully! Check the output workspace.");
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
      await new Promise(r => setTimeout(r, 1500));
      let responseText = "I parsed your query but didn't find any direct triggers. Try prompts like:\n- *'Generate APA citation'* \n- *'Check text for plagiarism'*";

      if (promptText.toLowerCase().includes("citation")) {
        setTab("paper-ai");
        setPaperOption("Generate Citations");
        setPaperTopic("Optimizing Campus Placement Systems");
        responseText = "📝 **Action Triggered**: Configured **Research Paper AI** to generate citations for 'Optimizing Campus Placement Systems'. Click 'Generate Research Insights' to view the formatted reference.";
      } else if (promptText.toLowerCase().includes("plagiarism") || promptText.toLowerCase().includes("similarity")) {
        setTab("plagiarism");
        responseText = "🔍 **Action Triggered**: Navigated to the **Plagiarism Checker**. Paste your document draft in the box to compute similarity rates.";
      } else if (promptText.toLowerCase().includes("outline") || promptText.toLowerCase().includes("paper")) {
        setTab("paper-ai");
        setPaperOption("Literature Outline");
        setPaperTopic("Large Language Models inside edge databases");
        responseText = "📝 **Action Triggered**: Configured **Research Paper AI** for a Literature Outline. Click 'Generate Research Insights' to load the structured hierarchy.";
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: responseText }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editingContent);
    alert("📋 Copied to clipboard successfully!");
  };

  return (
    <div className="relative flex flex-col h-full min-h-[calc(100vh-120px)]" style={{ color: c.text }}>
      <div className="flex-1 flex flex-col gap-6">

        {/* ==================== 1. DASHBOARD OVERVIEW CARDS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          {[
            { label: "Papers Audited", val: "8", icon: <BookOpen className="text-amber-500" /> },
            { label: "Citations Compiled", val: "32 Refs", icon: <Layers className="text-cyan-500" /> },
            { label: "Avg Similarity Index", val: "11%", icon: <Award className="text-emerald-500" /> },
            { label: "Plagiarism Checks", val: "14", icon: <SearchCode className="text-purple-500" /> }
          ].map((card, idx) => (
            <div key={idx} className="p-4 border rounded-xl flex items-center justify-between" style={{ background: c.cardBg, borderColor: c.border }}>
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
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Research Portal</p>
            <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {tab === "paper-ai" ? "Research Paper AI" : "Plagiarism Checker"}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab(tab === "paper-ai" ? "plagiarism" : "paper-ai")}
              className="py-1.5 px-3 rounded-lg border text-xs font-bold transition-all hover:bg-white/5"
              style={{ borderColor: c.border, color: c.textSec }}
            >
              Toggle Hub Module
            </button>
            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
            >
              <Sparkles size={12} className="animate-pulse" /> AI Assistant
            </button>
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
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

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    {generating ? "Running AI Models..." : "Generate Research Insights"}
                  </button>
                </motion.form>
              )}

              {/* PLAGIARISM CHECKER FORM */}
              {tab === "plagiarism" && (
                <motion.div
                  key="plagiarism-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
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
                    <button
                      onClick={handleCheckPlagiarism}
                      disabled={!plagiarismText.trim() || checkingPlagiarism}
                      className="flex-1 py-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {checkingPlagiarism ? "Scanning Database Indices..." : "Check Similarity Index"}
                    </button>
                    <button
                      onClick={handleRunRephraser}
                      disabled={!plagiarismText.trim() || generating}
                      className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold disabled:opacity-50 transition-colors"
                      style={{ borderColor: c.border }}
                    >
                      AI Paraphraser
                    </button>
                  </div>

                  {/* Results report */}
                  {plagiarismResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
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
                        {plagiarismResult.sources.map((s: any, i: number) => (
                          <div key={i} className="p-2 border rounded-xl flex justify-between text-xs" style={{ borderColor: c.border }}>
                            <div>
                              <span className="font-extrabold block">{s.title}</span>
                              <span className="text-[9px]" style={{ color: c.textMuted }}>{s.url}</span>
                            </div>
                            <span className="font-black text-amber-500 shrink-0">{s.match}%</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT SIDE: LIVE EDITOR PREVIEW */}
          <div className="flex flex-col border rounded-2xl overflow-hidden h-[450px]" style={{ background: c.cardBg, borderColor: c.border }}>
            <div className="px-4 py-3 border-b flex justify-between items-center bg-white/[0.01]" style={{ borderColor: c.border }}>
              <span className="text-xs font-extrabold" style={{ color: c.text }}>Research Workspace</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPreview(true)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                    isPreview ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "border-white/10 hover:bg-white/5"
                  }`}
                  style={{ borderColor: c.border }}
                >
                  <Eye size={12} className="inline mr-1" /> Preview
                </button>
                <button
                  onClick={() => setIsPreview(false)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                    !isPreview ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "border-white/10 hover:bg-white/5"
                  }`}
                  style={{ borderColor: c.border }}
                >
                  <Edit3 size={12} className="inline mr-1" /> Edit
                </button>
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
              <button
                onClick={handleCopyText}
                disabled={!editingContent.trim()}
                className="py-1.5 px-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-30 transition-colors"
                style={{ borderColor: c.border, color: c.text }}
              >
                <Copy size={12} /> Copy Output
              </button>
              <button
                onClick={() => {
                  alert("💾 Document draft saved successfully.");
                }}
                disabled={!editingContent.trim()}
                className="py-1.5 px-3 rounded bg-amber-500 text-black hover:bg-amber-400 text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-30 transition-colors"
              >
                <PlusCircle size={12} /> Save Draft
              </button>
            </div>
          </div>

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
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.text }}>AI Research Coach</span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle size={14} />
              </button>
            </div>

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
