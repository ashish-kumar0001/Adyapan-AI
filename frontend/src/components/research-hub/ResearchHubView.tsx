"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/services/api";
import {
  BookOpen, Search, Sparkles, Send, CheckCircle2, XCircle,
  ArrowRight, Plus, ArrowLeft, AlertCircle, FileText,
  Check, RefreshCw, Copy, Download, Eye, Edit3,
  Clock, BarChart3, ChevronDown, ChevronRight, X,
  Globe, Zap, Brain, Settings, BookMarked, Layers,
  Target, Lightbulb, TrendingUp, Hash, MessageSquare,
  FileDown, FileCode, FileJson,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PaperSection {
  id: string;
  title: string;
  content: string;
  type: string;
}

interface ScholarSource {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  doi?: string;
  url: string;
  source: string;
  citationCount?: number;
  journal?: string;
}

interface GeneratedPaper {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  sections: PaperSection[];
  references: ScholarSource[];
  metadata: {
    template: string;
    citationStyle: string;
    wordCount: number;
    pageCount: number;
    sourceCount: number;
  };
}

interface ResearchConfig {
  topic: string;
  field: string;
  researchType: string;
  template: string;
  paperLength: string;
  citationStyle: string;
  options: {
    includeTables: boolean;
    includeEquations: boolean;
    generateGraphs: boolean;
    addFutureWork: boolean;
    addLimitations: boolean;
    generateAbstractLast: boolean;
  };
}

interface ResearchHubViewProps {
  setView: (v: string) => void;
  activeModule?: string;
  theme?: string;
}

type WizardStep = "topic" | "config" | "progress" | "workspace";
type TabMode = "paper-ai" | "plagiarism";

const FIELDS = ["Computer Science", "AI / Machine Learning", "Healthcare", "Cybersecurity", "Finance", "IoT", "Data Science", "Natural Language Processing"];
const RESEARCH_TYPES = ["Survey Paper", "Review Paper", "Experimental", "Comparative", "Case Study"];
const TEMPLATES = ["IEEE", "ACM", "Springer", "Elsevier", "APA"];
const LENGTHS = ["Short (4-6 pages)", "Medium (8-12 pages)", "Long (15-25 pages)"];
const CITATION_STYLES = ["IEEE", "APA", "MLA", "Chicago"];

function ExportDropdown({ onExport, generating, c }: { onExport: (f: "pdf" | "docx" | "latex" | "bibtex") => void; generating: boolean; c: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { format: "pdf" as const, label: "Download PDF", icon: <FileDown size={11} />, desc: "Formatted research paper" },
    { format: "docx" as const, label: "Download DOCX", icon: <FileDown size={11} />, desc: "Word document" },
    { format: "latex" as const, label: "Download LaTeX", icon: <FileCode size={11} />, desc: "LaTeX source (.tex)" },
    { format: "bibtex" as const, label: "Copy BibTeX", icon: <FileJson size={11} />, desc: "Bibliography (.bib)" },
  ];

  return (
    <div ref={ref} className="relative">
      <motion.button onClick={() => setOpen(!open)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition-all"
        style={{ borderColor: c.border, color: c.textSec }}
      >
        <Download size={11} /> Export <ChevronDown size={10} />
      </motion.button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-full right-0 mt-1 w-52 border rounded-xl overflow-hidden z-50 shadow-xl"
          style={{ background: c.cardBg, borderColor: c.border }}
        >
          {items.map(item => (
            <motion.button key={item.format} whileTap={{ scale: 0.98 }}
              onClick={() => { onExport(item.format); setOpen(false); }}
              disabled={generating}
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              <span className="text-amber-500">{item.icon}</span>
              <div>
                <div className="text-[10px] font-bold" style={{ color: c.text }}>{item.label}</div>
                <div className="text-[8px]" style={{ color: c.textMuted }}>{item.desc}</div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
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

  // Tab mode
  const [tab, setTab] = useState<TabMode>("paper-ai");

  // Wizard state
  const [step, setStep] = useState<WizardStep>("topic");

  // Topic input
  const [topic, setTopic] = useState("");
  const [suggestedTopics, setSuggestedTopics] = useState<{ trending: string[]; recent: string[]; recommended: string[] } | null>(null);

  // Config
  const [config, setConfig] = useState<ResearchConfig>({
    topic: "",
    field: "Computer Science",
    researchType: "Experimental",
    template: "IEEE",
    paperLength: "Medium (8-12 pages)",
    citationStyle: "IEEE",
    options: {
      includeTables: true,
      includeEquations: false,
      generateGraphs: false,
      addFutureWork: true,
      addLimitations: true,
      generateAbstractLast: false,
    },
  });

  // Progress
  const [progress, setProgress] = useState({ step: "", message: "", percent: 0, sourcesFound: 0 });
  const [progressLog, setProgressLog] = useState<string[]>([]);

  // Generated paper
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [activeSection, setActiveSection] = useState<string>("abstract");
  const [editingContent, setEditingContent] = useState("");
  const [isPreview, setIsPreview] = useState(true);
  const [sources, setSources] = useState<ScholarSource[]>([]);

  // AI Assistant
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am your AI Research Assistant. I can help you rewrite sections, expand content, add citations, improve methodology, and more. What would you like to do?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Loading states
  const [generating, setGenerating] = useState(false);
  const [fetchingTopics, setFetchingTopics] = useState(false);

  // Plagiarism state
  const [plagiarismText, setPlagiarismText] = useState("");
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<{ similarity: number; sources: { title: string; url: string; match: number }[] } | null>(null);

  // Sync tab with activeModule
  useEffect(() => {
    if (activeModule === "research-paper-ai") setTab("paper-ai");
    else if (activeModule === "research-plagiarism") setTab("plagiarism");
  }, [activeModule]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Fetch suggested topics
  useEffect(() => {
    if (tab === "paper-ai" && step === "topic" && !suggestedTopics) {
      setFetchingTopics(true);
      api.post("/research/suggest-topics")
        .then(res => setSuggestedTopics(res.data.topics))
        .catch(() => {})
        .finally(() => setFetchingTopics(false));
    }
  }, [tab, step, suggestedTopics]);

  // Update active section content when paper changes
  useEffect(() => {
    if (paper) {
      const sec = paper.sections.find(s => s.id === activeSection);
      setEditingContent(sec?.content || "");
    }
  }, [paper, activeSection]);

  // ── HANDLERS ────────────────────────────────────────────────────────────

  const handleStartGeneration = () => {
    if (!topic.trim()) return;
    setConfig(prev => ({ ...prev, topic: topic.trim() }));
    setStep("config");
  };

  const handleGeneratePaper = async () => {
    setGenerating(true);
    setStep("progress");
    setProgressLog([]);

    const addLog = (msg: string) => setProgressLog(prev => [...prev, msg]);

    addLog("Starting research paper generation...");
    setProgress({ step: "init", message: "Initializing AI research engine...", percent: 5, sourcesFound: 0 });

    try {
      const res = await fetch(`${api.defaults.baseURL}/research/generate-paper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") || sessionStorage.getItem("token") || "" : ""}`,
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Generation request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "progress") {
              setProgress({ step: event.step, message: event.message, percent: event.percent, sourcesFound: event.sourcesFound });
              addLog(event.message);
            } else if (event.type === "complete") {
              const generatedPaper: GeneratedPaper = event.paper;
              setPaper(generatedPaper);
              setSources(generatedPaper.references || []);
              setProgress({ step: "complete", message: "Paper generated successfully!", percent: 100, sourcesFound: generatedPaper.references?.length || 0 });
              addLog(`Paper generated: "${generatedPaper.title}"`);
              addLog(`Word count: ${generatedPaper.metadata.wordCount.toLocaleString()}`);
              addLog(`Sources cited: ${generatedPaper.metadata.sourceCount}`);
              toast.success("Research paper generated successfully!");
              setTimeout(() => setStep("workspace"), 1500);
            } else if (event.type === "error") {
              addLog(`Error: ${event.message}`);
              toast.error("Generation failed: " + event.message);
              setStep("config");
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.startsWith("data: ")) {
        try {
          const event = JSON.parse(buffer.slice(6));
          if (event.type === "complete") {
            const generatedPaper: GeneratedPaper = event.paper;
            setPaper(generatedPaper);
            setSources(generatedPaper.references || []);
            setProgress({ step: "complete", message: "Paper generated successfully!", percent: 100, sourcesFound: generatedPaper.references?.length || 0 });
            addLog(`Paper generated: "${generatedPaper.title}"`);
            addLog(`Word count: ${generatedPaper.metadata.wordCount.toLocaleString()}`);
            addLog(`Sources cited: ${generatedPaper.metadata.sourceCount}`);
            toast.success("Research paper generated successfully!");
            setTimeout(() => setStep("workspace"), 1500);
          } else if (event.type === "error") {
            addLog(`Error: ${event.message}`);
            toast.error("Generation failed: " + event.message);
            setStep("config");
          }
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      addLog(`Error: ${err.message || "Generation failed"}`);
      toast.error("Failed to generate research paper. Please try again.");
      setStep("config");
    } finally {
      setGenerating(false);
    }
  };

  const handleSectionRegenerate = async (sectionId: string) => {
    if (!paper) return;
    const sec = paper.sections.find(s => s.id === sectionId);
    if (!sec) return;

    setGenerating(true);
    try {
      const res = await api.post("/research/generate-section", {
        sectionId: sec.id,
        sectionTitle: sec.title,
        subsections: [],
        config,
        sources,
        previousSections: "",
        title: paper.title,
      });

      const newContent = res.data.content;
      setPaper(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(s => s.id === sectionId ? { ...s, content: newContent } : s),
        };
      });
      setEditingContent(newContent);
      toast.success(`${sec.title} regenerated successfully!`);
    } catch {
      toast.error("Failed to regenerate section");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSection = () => {
    if (!paper) return;
    setPaper(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === activeSection ? { ...s, content: editingContent } : s),
      };
    });
    toast.success("Section saved!");
  };

  const handleAssistantSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const promptText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: promptText }]);
    setChatLoading(true);

    try {
      const res = await api.post("/research/chat", {
        message: promptText,
        context: {
          paperContent: paper?.sections.map(s => `### ${s.title}\n${s.content}`).join("\n\n") || "",
          sources: sources.slice(0, 20),
        },
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: res.data.response || "No response received." }]);
    } catch {
      toast.error("AI Assistant unavailable. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!paper) return;
    const text = paper.sections.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Paper copied to clipboard!");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editingContent);
    toast.success("Section copied!");
  };

  const handleCheckPlagiarism = async () => {
    if (!plagiarismText.trim()) return;
    setCheckingPlagiarism(true);
    try {
      const res = await api.post("/research/check-plagiarism", { text: plagiarismText });
      setPlagiarismResult(res.data);
    } catch {
      toast.error("Plagiarism check failed.");
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const handleRephrase = async () => {
    if (!plagiarismText.trim()) return;
    setGenerating(true);
    try {
      const res = await api.post("/research/rephrase", { text: plagiarismText });
      setGeneratedOutput(res.data.content || "");
      toast.success("Text rephrased!");
    } catch {
      toast.error("Rephrasing failed.");
    } finally {
      setGenerating(false);
    }
  };

  const [generatedOutput, setGeneratedOutput] = useState("");

  // ── EXPORT HANDLERS ──────────────────────────────────────────────────────

  const handleExport = async (format: "pdf" | "docx" | "latex" | "bibtex") => {
    if (!paper) return;
    setGenerating(true);
    try {
      const res = await fetch(`${api.defaults.baseURL}/research/export/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") || sessionStorage.getItem("token") || "" : ""}`,
        },
        body: JSON.stringify({ paper }),
      });

      if (!res.ok) throw new Error("Export failed");

      if (format === "bibtex") {
        // Copy BibTeX to clipboard
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        toast.success("BibTeX copied to clipboard!");
      } else {
        // Download binary file
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const filename = `${(paper.title || "research-paper").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}.${format}`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Paper exported as ${format.toUpperCase()}!`);
      }
    } catch {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── RENDER: PLAGIARISM TAB ──────────────────────────────────────────────

  const renderPlagiarismTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="overflow-y-auto pr-2 space-y-4">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          whileHover={{ y: -4, scale: 1.01 }}
          className="space-y-4 p-5 border rounded-2xl"
          style={{ background: c.cardBg, borderColor: c.border }}
        >
          <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-amber-500">Academic Similarity Inspector</h4>
          <textarea
            value={plagiarismText}
            onChange={(e) => setPlagiarismText(e.target.value)}
            placeholder="Paste your assignment draft or academic paragraph here..."
            className="w-full border focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs resize-none h-32"
            style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
          />
          <div className="flex gap-2">
            <motion.button onClick={handleCheckPlagiarism} disabled={!plagiarismText.trim() || checkingPlagiarism}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {checkingPlagiarism ? "Scanning..." : "Check Similarity"}
            </motion.button>
            <motion.button onClick={handleRephrase} disabled={!plagiarismText.trim() || generating}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="py-2.5 px-4 rounded-lg border hover:bg-white/10 text-xs font-bold disabled:opacity-50 transition-colors"
              style={{ borderColor: c.border }}
            >
              AI Paraphraser
            </motion.button>
          </div>
          {plagiarismResult && (
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="space-y-4 pt-4 border-t" style={{ borderColor: c.border }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">Similarity Index:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {plagiarismResult.similarity}% Matched
                </span>
              </div>
              {plagiarismResult.sources.map((s, i) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                  whileHover={{ y: -2, scale: 1.005 }}
                  className="p-2 border rounded-xl flex justify-between text-xs" style={{ borderColor: c.border }}
                >
                  <div>
                    <span className="font-extrabold block">{s.title}</span>
                    <span className="text-[9px]" style={{ color: c.textMuted }}>{s.url}</span>
                  </div>
                  <span className="font-black text-amber-500 shrink-0">{s.match}%</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Output */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
        whileHover={{ y: -4, scale: 1.01 }}
        className="flex flex-col border rounded-2xl overflow-hidden h-[450px]"
        style={{ background: c.cardBg, borderColor: c.border }}
      >
        <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
          <span className="text-xs font-extrabold" style={{ color: c.text }}>Rephrased Output</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: c.textSec }}>
            {generatedOutput || <span className="italic" style={{ color: c.textMuted }}>Rephrased content will appear here...</span>}
          </div>
        </div>
        <div className="p-3 border-t flex gap-2" style={{ borderColor: c.border }}>
          <motion.button onClick={() => { navigator.clipboard.writeText(generatedOutput); toast.success("Copied!"); }}
            disabled={!generatedOutput} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="py-1.5 px-3 rounded border hover:bg-white/10 text-[10px] font-bold disabled:opacity-30 transition-colors flex items-center gap-1"
            style={{ borderColor: c.border }}
          >
            <Copy size={12} /> Copy
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // ── RENDER: TOPIC STEP ──────────────────────────────────────────────────

  const renderTopicStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto w-full space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
        >
          <BookOpen size={28} className="text-amber-500" />
        </motion.div>
        <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Outfit', sans-serif", color: c.text }}>
          AI Research Paper Builder
        </h1>
        <p className="text-sm" style={{ color: c.textSec }}>
          Enter your research topic and AI will generate a complete, citation-based research paper
        </p>
      </div>

      {/* Topic Input */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="p-6 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}
      >
        <label className="text-[10px] font-black uppercase tracking-wider block text-amber-500">Research Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., AI-based Crop Disease Detection using Deep Learning"
          className="w-full border focus:border-[#f59e0b] focus:outline-none rounded-xl p-4 text-base font-medium"
          style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
          onKeyDown={(e) => { if (e.key === "Enter") handleStartGeneration(); }}
        />
        <motion.button onClick={handleStartGeneration} disabled={!topic.trim()}
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Configure Research Paper <ArrowRight size={16} />
        </motion.button>
      </motion.div>

      {/* Suggested Topics */}
      {suggestedTopics && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="space-y-4">
          {[
            { label: "Trending Topics", icon: <TrendingUp size={14} />, items: suggestedTopics.trending },
            { label: "Recent Research", icon: <Clock size={14} />, items: suggestedTopics.recent },
            { label: "Recommended Topics", icon: <Lightbulb size={14} />, items: suggestedTopics.recommended },
          ].map(group => group.items && group.items.length > 0 && (
            <div key={group.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-amber-500">{group.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.textMuted }}>{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((t, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.03, borderColor: "rgba(245,158,11,0.5)" }} whileTap={{ scale: 0.97 }}
                    onClick={() => setTopic(t)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                    style={{ background: c.cardBg, borderColor: c.border, color: c.textSec }}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );

  // ── RENDER: CONFIG STEP ─────────────────────────────────────────────────

  const renderConfigStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-3">
        <motion.button onClick={() => setStep("topic")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg border hover:bg-white/10" style={{ borderColor: c.border }}
        >
          <ArrowLeft size={16} />
        </motion.button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Step 2 of 4</p>
          <h2 className="text-lg font-extrabold" style={{ color: c.text }}>Research Configuration</h2>
        </div>
      </div>

      <div className="p-4 rounded-xl border" style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.15)" }}>
        <span className="text-xs font-bold" style={{ color: c.textSec }}>Topic: </span>
        <span className="text-xs font-extrabold text-amber-500">{topic}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Research Field */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="p-4 border rounded-xl space-y-2" style={{ background: c.cardBg, borderColor: c.border }}
        >
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-amber-500" />
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-500">Research Field</label>
          </div>
          <select value={config.field} onChange={(e) => setConfig(p => ({ ...p, field: e.target.value }))}
            className="w-full border focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs font-medium"
            style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
          >
            {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </motion.div>

        {/* Research Type */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="p-4 border rounded-xl space-y-2" style={{ background: c.cardBg, borderColor: c.border }}
        >
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-amber-500" />
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-500">Research Type</label>
          </div>
          <select value={config.researchType} onChange={(e) => setConfig(p => ({ ...p, researchType: e.target.value }))}
            className="w-full border focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs font-medium"
            style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
          >
            {RESEARCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </motion.div>

        {/* Template */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="p-4 border rounded-xl space-y-2" style={{ background: c.cardBg, borderColor: c.border }}
        >
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-amber-500" />
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-500">Template</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <motion.button key={t} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setConfig(p => ({ ...p, template: t }))}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                  config.template === t
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "hover:bg-white/5"
                }`}
                style={{ borderColor: config.template === t ? "rgba(245,158,11,0.3)" : c.border }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Paper Length */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="p-4 border rounded-xl space-y-2" style={{ background: c.cardBg, borderColor: c.border }}
        >
          <div className="flex items-center gap-1.5">
            <BarChart3 size={13} className="text-amber-500" />
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-500">Paper Length</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map(l => (
              <motion.button key={l} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setConfig(p => ({ ...p, paperLength: l }))}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                  config.paperLength === l
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "hover:bg-white/5"
                }`}
                style={{ borderColor: config.paperLength === l ? "rgba(245,158,11,0.3)" : c.border }}
              >
                {l}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Citation Style */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="p-4 border rounded-xl space-y-2" style={{ background: c.cardBg, borderColor: c.border }}
        >
          <div className="flex items-center gap-1.5">
            <Hash size={13} className="text-amber-500" />
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-500">Citation Style</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {CITATION_STYLES.map(s => (
              <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setConfig(p => ({ ...p, citationStyle: s }))}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                  config.citationStyle === s
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "hover:bg-white/5"
                }`}
                style={{ borderColor: config.citationStyle === s ? "rgba(245,158,11,0.3)" : c.border }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* AI Options */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
          className="p-4 border rounded-xl space-y-3" style={{ background: c.cardBg, borderColor: c.border }}
        >
          <div className="flex items-center gap-1.5">
            <Settings size={13} className="text-amber-500" />
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-500">AI Options</label>
          </div>
          {[
            { key: "includeTables" as const, label: "Include tables" },
            { key: "includeEquations" as const, label: "Include equations" },
            { key: "generateGraphs" as const, label: "Generate graphs" },
            { key: "addFutureWork" as const, label: "Add future work" },
            { key: "addLimitations" as const, label: "Add limitations" },
            { key: "generateAbstractLast" as const, label: "Generate abstract last" },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setConfig(p => ({
                  ...p,
                  options: { ...p.options, [opt.key]: !p.options[opt.key] }
                }))}
                className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${
                  config.options[opt.key] ? "bg-amber-500" : "bg-white/10"
                }`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                  config.options[opt.key] ? "left-4" : "left-0.5"
                }`} />
              </div>
              <span className="text-xs font-medium" style={{ color: c.textSec }}>{opt.label}</span>
            </label>
          ))}
        </motion.div>
      </div>

      {/* Generate Button */}
      <motion.button onClick={handleGeneratePaper} disabled={generating}
        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(245,158,11,0.3)" }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        <Zap size={18} /> Generate Research Paper
      </motion.button>
    </motion.div>
  );

  // ── RENDER: PROGRESS STEP ───────────────────────────────────────────────

  const renderProgressStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full space-y-6">
      <div className="text-center space-y-2">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
        >
          <Brain size={24} className="text-amber-500" />
        </motion.div>
        <h2 className="text-lg font-extrabold" style={{ color: c.text }}>AI Research & Data Collection</h2>
        <p className="text-xs" style={{ color: c.textSec }}>{progress.message}</p>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl border" style={{ background: c.cardBg, borderColor: c.border }}>
        <div className="flex justify-between mb-2">
          <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Progress</span>
          <span className="text-[10px] font-bold text-amber-500">{progress.percent}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Progress Log */}
      <div className="p-4 rounded-xl border space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar"
        style={{ background: c.cardBg, borderColor: c.border }}
      >
        {progressLog.map((log, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            className="flex items-start gap-2 text-xs"
          >
            {log.startsWith("Error") ? (
              <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={12} className="text-amber-500 mt-0.5 shrink-0" />
            )}
            <span style={{ color: log.startsWith("Error") ? c.red : c.textSec }}>{log}</span>
          </motion.div>
        ))}
      </div>

      {/* Source count */}
      {progress.sourcesFound > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: c.textMuted }}>
          <BookMarked size={12} className="text-amber-500" />
          <span>{progress.sourcesFound} scholarly sources found</span>
        </div>
      )}
    </motion.div>
  );

  // ── RENDER: WORKSPACE STEP ──────────────────────────────────────────────

  const renderWorkspaceStep = () => {
    if (!paper) return null;
    const currentSection = paper.sections.find(s => s.id === activeSection);

    return (
      <div className="flex flex-col h-full gap-0" style={{ height: "calc(100vh - 140px)" }}>
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <motion.button onClick={() => setStep("config")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg border hover:bg-white/10" style={{ borderColor: c.border }}
            >
              <ArrowLeft size={14} />
            </motion.button>
            <div>
              <h3 className="text-xs font-extrabold truncate max-w-[300px]" style={{ color: c.text }}>{paper.title}</h3>
              <div className="flex items-center gap-3 text-[9px]" style={{ color: c.textMuted }}>
                <span>{paper.metadata.wordCount.toLocaleString()} words</span>
                <span>{paper.metadata.sourceCount} sources</span>
                <span>{paper.metadata.template} template</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button onClick={() => setAssistantOpen(!assistantOpen)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                assistantOpen ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : ""
              }`}
              style={{ borderColor: assistantOpen ? "rgba(245,158,11,0.3)" : c.border }}
            >
              <Sparkles size={11} className="animate-pulse" /> AI Assistant
            </motion.button>
            <motion.button onClick={handleCopyAll} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
              style={{ borderColor: c.border }}
            >
              <Copy size={11} /> Copy All
            </motion.button>
            <span className="w-px h-4" style={{ background: c.border }} />
            <ExportDropdown onExport={handleExport} generating={generating} c={c} />
          </div>
        </div>

        {/* Three-Panel Layout */}
        <div className="flex-1 flex min-h-0">

          {/* LEFT SIDEBAR: Sections */}
          <div className="w-56 shrink-0 border-r overflow-y-auto custom-scrollbar p-2 space-y-1"
            style={{ borderColor: c.border, background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.01)" }}
          >
            <p className="text-[9px] font-black uppercase tracking-wider px-2 py-1" style={{ color: c.textMuted }}>Paper Sections</p>
            {paper.sections.map((sec, i) => (
              <motion.button key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                whileHover={{ x: 2 }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium flex items-center gap-2 transition-all ${
                  activeSection === sec.id
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "hover:bg-white/5"
                }`}
                style={{ borderColor: activeSection === sec.id ? "rgba(245,158,11,0.2)" : "transparent" }}
              >
                <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold shrink-0"
                  style={{
                    background: activeSection === sec.id ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
                    color: activeSection === sec.id ? c.primary : c.textMuted,
                  }}
                >
                  {i + 1}
                </span>
                <span className="truncate">{sec.title}</span>
              </motion.button>
            ))}

            {/* Sources count */}
            <div className="mt-3 px-2 pt-2 border-t space-y-1.5" style={{ borderColor: c.border }}>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: c.textMuted }}>Sources ({paper.references.length})</p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {paper.references.slice(0, 15).map((src, i) => (
                  <div key={i} className="text-[9px] px-1.5 py-1 rounded hover:bg-white/5 cursor-pointer" style={{ color: c.textMuted }}
                    title={`${src.title} (${src.year})`}
                  >
                    <span className="font-bold text-amber-500">[{i + 1}]</span> {src.title.slice(0, 40)}...
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER: Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Section Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold" style={{ color: c.text }}>{currentSection?.title}</h4>
              </div>
              <div className="flex items-center gap-1">
                <motion.button onClick={() => setIsPreview(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className={`py-1 px-2.5 rounded text-[9px] font-bold border transition-all ${
                    isPreview ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : ""
                  }`}
                  style={{ borderColor: isPreview ? "rgba(245,158,11,0.2)" : c.border }}
                >
                  <Eye size={10} className="inline mr-1" /> Preview
                </motion.button>
                <motion.button onClick={() => setIsPreview(false)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className={`py-1 px-2.5 rounded text-[9px] font-bold border transition-all ${
                    !isPreview ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : ""
                  }`}
                  style={{ borderColor: !isPreview ? "rgba(245,158,11,0.2)" : c.border }}
                >
                  <Edit3 size={10} className="inline mr-1" /> Edit
                </motion.button>
                <span className="w-px h-4 mx-1" style={{ background: c.border }} />
                <motion.button onClick={() => handleSectionRegenerate(activeSection)} disabled={generating}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="py-1 px-2.5 rounded text-[9px] font-bold border hover:bg-white/5 flex items-center gap-1 disabled:opacity-40"
                  style={{ borderColor: c.border }}
                >
                  <RefreshCw size={10} className={generating ? "animate-spin" : ""} /> Regenerate
                </motion.button>
                <motion.button onClick={handleSaveSection} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="py-1 px-2.5 rounded bg-amber-500 text-black text-[9px] font-bold flex items-center gap-1"
                >
                  <Check size={10} /> Save
                </motion.button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {isPreview ? (
                <div className="prose prose-sm max-w-none text-xs leading-relaxed whitespace-pre-wrap select-text"
                  style={{ color: c.textSec }}
                >
                  {editingContent || (
                    <span className="italic" style={{ color: c.textMuted }}>No content for this section yet...</span>
                  )}
                </div>
              ) : (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full h-full bg-transparent border-0 focus:outline-none text-xs leading-relaxed resize-none"
                  style={{ color: c.text, minHeight: "400px" }}
                />
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: AI Assistant */}
          <AnimatePresence>
            {assistantOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l flex flex-col overflow-hidden shrink-0"
                style={{ borderColor: c.border, background: isDark ? "#0d1117" : "#ffffff" }}
              >
                <div className="px-3 py-2 border-b flex justify-between items-center shrink-0" style={{ borderColor: c.border }}>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.text }}>AI Research Assistant</span>
                  </div>
                  <motion.button onClick={() => setAssistantOpen(false)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="p-1 rounded hover:bg-white/10" style={{ color: c.textMuted }}
                  >
                    <X size={14} />
                  </motion.button>
                </div>

                {/* Quick Actions */}
                <div className="px-3 py-2 border-b flex flex-wrap gap-1 shrink-0" style={{ borderColor: c.border }}>
                  {["Rewrite this", "Expand section", "Add citations", "Improve grammar", "Generate equations"].map(action => (
                    <motion.button key={action} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setChatInput(action)}
                      className="px-2 py-1 rounded text-[8px] font-bold border hover:bg-white/5"
                      style={{ borderColor: c.border, color: c.textMuted }}
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {chatMessages.map((msg, idx) => {
                    const isAI = msg.role === "assistant";
                    return (
                      <div key={idx} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] p-2.5 rounded-xl text-[11px] leading-relaxed ${
                          isAI
                            ? "bg-white/5 border border-white/10 rounded-tl-sm"
                            : "bg-amber-500/10 border border-amber-500/20 rounded-tr-sm"
                        }`}>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-sm p-2.5 flex items-center gap-1.5">
                        <Clock size={11} className="text-amber-500 animate-spin" />
                        <span className="text-[9px] font-bold" style={{ color: c.textMuted }}>Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-2 border-t flex gap-1.5 shrink-0" style={{ borderColor: c.border }}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI assistant..."
                    onKeyDown={(e) => { if (e.key === "Enter") handleAssistantSend(); }}
                    className="flex-1 border focus:border-[#f59e0b] focus:outline-none rounded-lg px-2.5 py-1.5 text-[11px]"
                    style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                  />
                  <motion.button onClick={handleAssistantSend} disabled={!chatInput.trim() || chatLoading}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="w-8 h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-30"
                  >
                    <Send size={12} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ─────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="relative flex flex-col h-full min-h-[calc(100vh-120px)]"
      style={{ color: c.text }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2.5 shrink-0" style={{ borderColor: c.border }}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Research Workspace</p>
          <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {tab === "paper-ai" ? "AI Research Paper Builder" : "Plagiarism Checker"}
          </h2>
        </div>
        <div className="flex gap-2">
          {/* Tab Switcher */}
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: c.border }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { setTab("paper-ai"); setStep(paper ? "workspace" : "topic"); }}
              className={`px-3 py-1.5 text-[10px] font-bold transition-all ${
                tab === "paper-ai" ? "bg-amber-500/10 text-amber-500" : ""
              }`}
              style={{ color: tab !== "paper-ai" ? c.textMuted : undefined }}
            >
              <BookOpen size={11} className="inline mr-1" /> Paper AI
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { setTab("plagiarism"); setStep("topic"); }}
              className={`px-3 py-1.5 text-[10px] font-bold transition-all ${
                tab === "plagiarism" ? "bg-amber-500/10 text-amber-500" : ""
              }`}
              style={{ color: tab !== "plagiarism" ? c.textMuted : undefined }}
            >
              <Search size={11} className="inline mr-1" /> Plagiarism
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 pt-4">
        {tab === "plagiarism" ? (
          renderPlagiarismTab()
        ) : (
          <AnimatePresence mode="wait">
            {step === "topic" && <div key="topic">{renderTopicStep()}</div>}
            {step === "config" && <div key="config">{renderConfigStep()}</div>}
            {step === "progress" && <div key="progress">{renderProgressStep()}</div>}
            {step === "workspace" && <div key="workspace" className="h-full">{renderWorkspaceStep()}</div>}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
