"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  Upload, FileText, Copy,
  RefreshCw, Search, CheckCircle2, ChevronRight, BookOpen,
  FileDown, Layers, History, Plus, Sparkles, Brain,
  Zap, Star, X, Hash, GraduationCap, Clock, Edit3,
  Terminal, Lightbulb, AlertTriangle, Award, Check, RotateCcw,
  Play, BookOpenCheck, Cpu, ChevronDown, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useSocket } from "@/context/SocketContext";

// ─── Theme Hook ──────────────────────────────────────────────────────────────
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

// ─── Color Palette ───────────────────────────────────────────────────────────
const mkColors = (theme: string) => {
  const isDark = theme === "dark";
  return {
    isDark,
    text:         isDark ? "#e5e7eb"              : "#0f172a",
    textSec:      isDark ? "#9ca3af"              : "#475569",
    textMuted:    isDark ? "#828fa3"              : "#5f6368",
    textOnAmber:  isDark ? "#000000"              : "#000000",
    bg:           isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
    bgHover:      isDark ? "rgba(255,255,255,0.04)"  : "#f8fafc",
    surface:      isDark ? "rgba(255,255,255,0.03)"  : "rgba(0,0,0,0.02)",
    surfaceHover: isDark ? "rgba(255,255,255,0.06)"  : "rgba(0,0,0,0.04)",
    border:       isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.08)",
    borderHover:  isDark ? "rgba(255,255,255,0.15)"  : "rgba(0,0,0,0.18)",
    borderFocus:  isDark ? "rgba(245,158,11,0.45)"   : "rgba(245,158,11,0.5)",
    inputBg:      isDark ? "rgba(0,0,0,0.35)"        : "#f1f5f9",
    cardBg:       isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
    cardBgAlt:    isDark ? "rgba(0,0,0,0.25)"        : "#f8fafc",
    stickyBg:     isDark ? "rgba(10,10,20,0.88)"     : "rgba(248,250,252,0.92)",
    amber:        "#f59e0b",
    amberBg:      isDark ? "rgba(245,158,11,0.07)"   : "rgba(245,158,11,0.08)",
    amberBorder:  isDark ? "rgba(245,158,11,0.18)"   : "rgba(245,158,11,0.25)",
    amberActive:  isDark ? "rgba(245,158,11,0.12)"   : "rgba(245,158,11,0.1)",
    rose:         "#f43f5e",
    roseBg:       isDark ? "rgba(244,63,94,0.07)"    : "rgba(244,63,94,0.06)",
    roseBorder:   isDark ? "rgba(244,63,94,0.18)"    : "rgba(244,63,94,0.2)",
    purpleBg:     isDark ? "rgba(139,92,246,0.06)"   : "rgba(139,92,246,0.05)",
    purpleBorder: isDark ? "rgba(139,92,246,0.14)"   : "rgba(139,92,246,0.15)",
    cyanBg:       isDark ? "rgba(6,182,212,0.06)"    : "rgba(6,182,212,0.05)",
    cyanBorder:   isDark ? "rgba(6,182,212,0.14)"    : "rgba(6,182,212,0.15)",
    green:        "#10b981",
    greenBg:      isDark ? "rgba(16,185,129,0.1)"    : "rgba(16,185,129,0.08)",
    divider:      isDark ? "rgba(255,255,255,0.06)"  : "rgba(0,0,0,0.07)",
    pill:         isDark ? "rgba(255,255,255,0.05)"  : "rgba(0,0,0,0.05)",
    pillBorder:   isDark ? "rgba(255,255,255,0.1)"   : "rgba(0,0,0,0.1)",
  };
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface TopicSummary {
  name: string; overview: string; keyConcepts: string[];
  importantPoints: string[]; questions?: string[]; quickRevision: string; keywords: string[];
}
interface DocStats {
  pages: number; words: number; topicsFound: number; readingTime: string; summaryLength: string;
}
interface AIInsights {
  mainSubject: string; difficultyLevel: string; estimatedStudyTime: string;
  importantChapters: string[]; repeatedTopics: string[];
}

// ─── Learn Module Interfaces ───────────────────────────────────────────────────
interface UnifiedConcept { title: string; content: string; sub_concepts?: string[]; tips?: string[]; }
interface UnifiedExample { title: string; scenario: string; code_or_data?: string; explanation?: string; }
interface UnifiedPractice { question: string; guidance?: string; expected_answer?: string; red_flag?: string; }
interface UnifiedQuizQuestion { question: string; options: string[]; answer: string; explanation: string; }
interface UnifiedLesson {
  learning_goal?: string; estimated_completion_time?: string; lesson_structure?: string[];
  overview: string; why_matters?: string; simple_explanation?: string; real_life_analogy?: string;
  example?: string; key_takeaways?: string[]; mini_quiz?: UnifiedQuizQuestion[];
  key_concepts: UnifiedConcept[]; examples?: UnifiedExample[]; practice_questions?: UnifiedPractice[];
  quiz?: UnifiedQuizQuestion[]; summary?: string;
}

const loadingSteps = [
  "Analyzing Topic Semantics",
  "Building Custom Learning Path",
  "Creating Real-World Analogies",
  "Generating Comprehension Checkpoint Quiz",
  "Finalizing Visual Revision Sheet"
];

const modeConfig = {
  beginner: { borderColor: "border-amber-500/15", textColor: "text-amber-400", accentBg: "bg-amber-500/10", glowColor: "from-amber-500/20 to-yellow-500/20", icon: BookOpen },
  intermediate: { borderColor: "border-amber-500/15", textColor: "text-amber-400", accentBg: "bg-amber-500/10", glowColor: "from-amber-500/20 to-yellow-500/20", icon: Cpu },
  interview: { borderColor: "border-amber-500/15", textColor: "text-amber-400", accentBg: "bg-amber-500/10", glowColor: "from-amber-500/20 to-yellow-500/20", icon: Award },
  revision: { borderColor: "border-amber-500/15", textColor: "text-amber-400", accentBg: "bg-amber-500/10", glowColor: "from-amber-500/20 to-red-500/20", icon: Zap }
};

function parseMarkdown(text: string, isDark: boolean): React.ReactNode {
  if (!text) return null;
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {blocks.map((block, blockIdx) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const match = block.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const codeContent = match ? match[2].trim() : block.slice(3, -3).trim();
          return (
            <div key={blockIdx} className="my-3 rounded-lg border overflow-hidden font-mono text-[11px] leading-relaxed" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"}`, background: isDark ? "rgba(0,0,0,0.45)" : "#f1f5f9" }}>
              {lang && <div className="flex justify-between items-center px-4 py-1.5 border-b text-[9px] uppercase" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", background: isDark ? "rgba(0,0,0,0.3)" : "#e2e8f0", color: isDark ? "rgba(255,255,255,0.3)" : "#64748b" }}><span>{lang}</span></div>}
              <pre className="p-3 overflow-x-auto" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#334155" }}><code>{codeContent}</code></pre>
            </div>
          );
        }
        const inlineParts = block.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\n)/g);
        return (
          <span key={blockIdx}>
            {inlineParts.map((part, inlineIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) return <strong key={inlineIdx} className="font-extrabold" style={{ color: isDark ? "rgba(255,255,255,0.95)" : "#0f172a" }}>{part.slice(2, -2)}</strong>;
              if (part.startsWith("*") && part.endsWith("*")) return <em key={inlineIdx} className="italic" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#475569" }}>{part.slice(1, -1)}</em>;
              if (part.startsWith("`") && part.endsWith("`")) return <code key={inlineIdx} className="font-mono text-xs px-1.5 py-0.5 rounded border" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>{part.slice(1, -1)}</code>;
              if (part === "\n") return <br key={inlineIdx} />;
              return <span key={inlineIdx}>{part}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}

const examples = [
  "Explain Gradient Descent",
  "Teach me SQL Joins",
  "Explain Neural Networks",
  "Explain React Server Components"
];

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } })
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } })
};
const slideRight = {
  hidden: { opacity: 0, x: -24 },
  visible: (i = 0) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.4 } })
};

// ─── Component ────────────────────────────────────────────────────────────────
export function StudyAssistantView({ onViewLesson, lessonToView }: {
  onViewLesson?: (data: { topic: string; lesson: UnifiedLesson; duration: string; level: string }) => void
  lessonToView?: { topic: string; lesson: UnifiedLesson; duration: string; level: string }
}) {
  const theme = useTheme();
  const c = mkColors(theme);
  const { socket } = useSocket();

  const [file, setFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string; size: string; pages: number; language: string; time: string;
  } | null>(null);
  const [status, setStatus] = useState<"empty" | "uploading" | "processing" | "ready">("empty");
  const [currentStage, setCurrentStage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [revealedTopics, setRevealedTopics] = useState<number>(0);
  const [history, setHistory] = useState<Array<{ name: string; date: string; pages: number; topics: number; analysis: any }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [topicHistory, setTopicHistory] = useState<Array<{ topic: string; date: string; duration: string; level: string; lesson: UnifiedLesson }>>([]);
  const [showTopicHistory, setShowTopicHistory] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    title: string; topics: TopicSummary[]; stats: DocStats; insights: AIInsights;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Learn Module State ──
  const [mode, setMode] = useState<"document" | "topic">("document");
  const [inputTopic, setInputTopic] = useState("");
  const [duration, setDuration] = useState<"5m" | "10m" | "20m" | "30m">("10m");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "interview" | "revision">("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [lessonData, setLessonData] = useState<UnifiedLesson | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [expandedConceptIdx, setExpandedConceptIdx] = useState<number | null>(null);
  const [practiceRevealed, setPracticeRevealed] = useState<Record<number, boolean>>({});
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadTab, setScratchpadTab] = useState<"notes" | "takeaways" | "playground">("notes");
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adyapan-study-history");
      setHistory(stored ? JSON.parse(stored) : []);
    } catch { setHistory([]); }
    try {
      const topicStored = localStorage.getItem("adyapan-topic-history");
      setTopicHistory(topicStored ? JSON.parse(topicStored) : []);
    } catch { setTopicHistory([]); }
  }, []);

  useEffect(() => {
    if (status !== "uploading") return;
    const stages = ["Upload", "Extract Text", "Analyze Content", "Identify Topics", "Generate Summary"];
    let idx = 0;
    setCurrentStage(stages[0]);
    const timer = setInterval(() => {
      idx += 1;
      if (idx < stages.length) setCurrentStage(stages[idx]);
      else clearInterval(timer);
    }, 600);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "ready" || !summaryData) return;
    const timers = summaryData.topics.map((_, i) =>
      setTimeout(() => setRevealedTopics(prev => Math.max(prev, i + 1)), i * 180)
    );
    return () => timers.forEach(clearTimeout);
  }, [status, summaryData]);

  const handleFileDrop = async (droppedFile: File) => {
    setFile(droppedFile);
    setFileDetails({ name: droppedFile.name, size: (droppedFile.size / (1024 * 1024)).toFixed(1) + " MB", pages: Math.floor(Math.random() * 80) + 15, language: "English", time: "20 seconds" });
    setStatus("uploading");
    try {
      const isBinary = /\.(pdf|docx|doc|pptx|ppt)$/i.test(droppedFile.name);
      let res;
      if (isBinary) {
        const formData = new FormData();
        formData.append("file", droppedFile);
        res = await api.post("/study/analyze", formData);
      } else {
        const reader = new FileReader();
        const fileText = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.readAsText(droppedFile);
        });
        res = await api.post("/study/analyze", { documentText: fileText });
      }
      if (res.data?.success && res.data?.analysis) {
        const a = res.data.analysis;
        setSummaryData(a);
        setStatus("ready");
        setRevealedTopics(0);
        if (a.topics?.length > 0) setActiveTopic(a.topics[0].name);
        const newItem = { name: droppedFile.name, date: "Just now", pages: a.stats?.pages || 1, topics: a.topics?.length || 0, analysis: a };
        const updated = [newItem, ...history.filter(h => h.name !== droppedFile.name)].slice(0, 10);
        setHistory(updated);
        localStorage.setItem("adyapan-study-history", JSON.stringify(updated));
      } else throw new Error("Invalid response");
    } catch {
      setStatus("empty");
      toast.error("Failed to analyze document. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]); };
  const handleBrowseFiles = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); };

  const handleScrollToTopic = (topicName: string) => {
    // Toggle: if already open, close it; otherwise open the new one
    setActiveTopic(prev => (prev === topicName ? "" : topicName));
  };

  const handleCopySummary = () => {
    if (!summaryData) return;
    const txt = summaryData.topics.map(t =>
      `${t.name}\n\n${t.overview}\n\nKey Concepts:\n${t.keyConcepts.map(k => `- ${k}`).join("\n")}\n\nImportant Points:\n${t.importantPoints.map(p => `- ${p}`).join("\n")}${t.questions && t.questions.length > 0 ? `\n\nPractice Questions:\n${t.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : ""}\n\nQuick Revision:\n${t.quickRevision}`
    ).join("\n\n---\n\n");
    navigator.clipboard.writeText(txt);
    toast.success("Summary copied to clipboard!");
  };

  const loadHistoryItem = (item: typeof history[0]) => {
    setFile({ name: item.name } as File);
    setFileDetails({ name: item.name, size: "—", pages: item.pages, language: "English", time: "20 seconds" });
    setStatus("ready"); setSummaryData(item.analysis); setRevealedTopics(0);
    if (item.analysis.topics?.length > 0) setActiveTopic(item.analysis.topics[0].name);
    setShowHistory(false);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
  };

  // ── Learn Module Handlers ──
  useEffect(() => {
    if (lessonData && currentTopic) {
      const saved = localStorage.getItem(`adyapan-learn-notes-${currentTopic}`);
      if (saved) setNotesText(saved);
    }
  }, [lessonData, currentTopic]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleNotesChange = (val: string) => {
    setNotesText(val);
    if (lessonData && currentTopic) {
      setIsSavingNotes(true);
      localStorage.setItem(`adyapan-learn-notes-${currentTopic}`, val);
      setTimeout(() => setIsSavingNotes(false), 500);
    }
  };

  const handleImportConcept = (concept: UnifiedConcept) => {
    const divider = notesText ? "\n\n" : "";
    const formatted = `### ${concept.title}\n${concept.content}`;
    handleNotesChange(notesText + divider + formatted);
  };

  const handleImportTakeaway = (takeaway: string) => {
    const divider = notesText ? "\n\n" : "";
    handleNotesChange(notesText + divider + `* ${takeaway}`);
  };

  const handleRunPlayground = () => {
    if (isRunningPlayground) return;
    setIsRunningPlayground(true);
    setPlaygroundOutput("[Compiling and executing simulation...]");
    setTimeout(() => {
      const t = currentTopic.toLowerCase();
      if (t.includes("gradient")) {
        setPlaygroundOutput(`[Running script.py...]\nOld weight: 10.0\nLearning Rate: 0.01\nGradient: 2.5\nNew weight = weight - (learning_rate * gradient)\nNew weight: 9.975\n\nProcess completed successfully.`);
      } else if (t.includes("sql") || t.includes("join")) {
        setPlaygroundOutput(`[Running script.py...]\nExecuting database query...\nINNER JOIN matching rows: 3 returned\n- Order 101 | User A | $250.00\n- Order 102 | User B | $120.50\n- Order 103 | User C | $45.00\n\nProcess completed successfully.`);
      } else {
        setPlaygroundOutput(`[Running script.py...]\nInputs: [0.5, -0.2]\nWeights: [0.8, 0.4]\nBias: -0.1\nWeighted Sum (z): 0.22\nActivation ReLU(z): 0.22\n\nProcess completed successfully.`);
      }
      setIsRunningPlayground(false);
    }, 1000);
  };

  const handleGenerateLesson = (targetTopic: string) => {
    if (!targetTopic.trim() || !socket) return;
    setLessonData(null);
    setTopicError(null);
    setIsGenerating(true);
    setLoadingStep(0);
    setQuizAnswers({});
    setQuizSubmitted({});
    setExpandedConceptIdx(null);
    setPracticeRevealed({});

    const onProgress = (payload: { step: number; status: string }) => {
      setLoadingStep(payload.step);
    };
    const onComplete = (payload: { data: UnifiedLesson }) => {
      socket.off("lesson:progress", onProgress);
      socket.off("lesson:complete", onComplete);
      socket.off("lesson:error", onError);
      setIsGenerating(false);
      // Save to topic history
      const newEntry = { topic: targetTopic, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), duration, level, lesson: payload.data };
      setTopicHistory(prev => {
        const updated = [newEntry, ...prev.filter(h => h.topic !== targetTopic)].slice(0, 20);
        localStorage.setItem("adyapan-topic-history", JSON.stringify(updated));
        return updated;
      });
      if (onViewLesson) {
        onViewLesson({ topic: targetTopic, lesson: payload.data, duration, level });
      } else {
        setLessonData(payload.data);
        setCurrentTopic(targetTopic);
      }
    };
    const onError = (payload: { error: string }) => {
      socket.off("lesson:progress", onProgress);
      socket.off("lesson:complete", onComplete);
      socket.off("lesson:error", onError);
      setTopicError(payload.error);
      setIsGenerating(false);
    };

    socket.on("lesson:progress", onProgress);
    socket.on("lesson:complete", onComplete);
    socket.on("lesson:error", onError);
    socket.emit("lesson:generate", { topic: targetTopic, duration, level });
  };

  const handleQuizSelect = (questionIdx: number, option: string) => {
    if (quizSubmitted[questionIdx]) return;
    setQuizAnswers(prev => ({ ...prev, [questionIdx]: option }));
  };

  const handleQuizSubmit = (questionIdx: number) => {
    if (!quizAnswers[questionIdx]) return;
    setQuizSubmitted(prev => ({ ...prev, [questionIdx]: true }));
  };

  const renderBeginner = (data: UnifiedLesson) => (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.amberBorder}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <BookOpen size={14} /> Simple Overview
            </div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.overview, c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <Lightbulb size={14} /> Why This Matters
            </div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.why_matters || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <Sparkles size={14} /> Simple Explanation
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: c.textSec }}>{parseMarkdown(data.simple_explanation || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBgAlt, border: `1px solid ${c.amberBorder}` }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>
              <Layers size={14} /> Real-Life Analogy
            </div>
            <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.real_life_analogy || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider" style={{ color: c.amber }}>A Simple Example</div>
            <div className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{parseMarkdown(data.example || "", c.isDark)}</div>
          </div>
        </div>
      </motion.div>
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider" style={{ color: c.textMuted }}>{data.key_takeaways.length} Key Takeaways</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.key_takeaways.map((takeaway, idx) => (
              <motion.div key={idx} whileHover={{ y: -3, scale: 1.01 }}
                className="p-5 rounded-xl relative overflow-hidden flex flex-col justify-between"
                style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} style={{ color: c.amber }} />
                    <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>RULE {idx + 1}</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: c.textSec }}>{takeaway}</p>
                </div>
                {isScratchpadOpen && (
                  <div className="pt-3 mt-3 border-t flex justify-end" style={{ borderColor: c.divider }}>
                    <button onClick={() => handleImportTakeaway(takeaway)}
                      className="px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.amber }}>
                      <Plus size={8} /> Copy to Notes
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {data.mini_quiz && data.mini_quiz.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
            <BookOpenCheck size={13} style={{ color: c.amber }} /> Comprehension Checkpoint Quiz
          </h3>
          <div className="space-y-6">
            {data.mini_quiz.map((quiz, qIdx) => {
              const userAns = quizAnswers[qIdx];
              const isSubmitted = quizSubmitted[qIdx];
              return (
                <div key={qIdx} className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.amberBorder}` }}>
                  <div className="space-y-5">
                    <div className="pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>QUESTION {qIdx + 1} OF {data.mini_quiz!.length}</span>
                      <h4 className="text-sm font-bold mt-1" style={{ color: c.text }}>{quiz.question}</h4>
                    </div>
                    <div className="space-y-2">
                      {quiz.options.map((opt) => {
                        const isSelected = userAns === opt;
                        const isCorrect = opt === quiz.answer;
                        let optionStyle: React.CSSProperties = { background: c.inputBg, borderColor: c.border };
                        if (isSelected && !isSubmitted) {
                          optionStyle = { background: c.amberBg, borderColor: c.amber, color: c.amber };
                        } else if (isSubmitted) {
                          if (isCorrect) {
                            optionStyle = { background: "rgba(16,185,129,0.15)", borderColor: c.amber, color: c.amber };
                          } else if (isSelected) {
                            optionStyle = { background: "rgba(244,63,94,0.15)", borderColor: c.rose, color: c.rose };
                          } else {
                            optionStyle = { background: c.surface, borderColor: c.border, opacity: 0.55 };
                          }
                        }
                        return (
                          <button key={opt} disabled={isSubmitted} onClick={() => handleQuizSelect(qIdx, opt)}
                            className="w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex justify-between items-center"
                            style={optionStyle}>
                            <span>{opt}</span>
                            {isSubmitted && isCorrect && <CheckCircle size={15} style={{ color: c.amber }} />}
                            {isSubmitted && isSelected && !isCorrect && <AlertTriangle size={15} style={{ color: c.rose }} />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1 flex flex-col gap-3">
                      {!isSubmitted ? (
                        <button disabled={!userAns} onClick={() => handleQuizSubmit(qIdx)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none" }}>
                          Submit Answer
                        </button>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 rounded-xl space-y-1.5 text-xs"
                          style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}>
                          <div className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                            {userAns === quiz.answer
                              ? <span style={{ color: c.amber }}>✔ Correct Answer</span>
                              : <span style={{ color: c.rose }}>✘ Incorrect</span>}
                          </div>
                          <p className="leading-relaxed" style={{ color: c.textMuted }}>{quiz.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderIntermediate = (data: UnifiedLesson) => {
    const mode = modeConfig[level] || modeConfig.intermediate;
    const ModeIcon = mode.icon;
    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.text }}>
                <ModeIcon size={14} /> Comprehension Overview
              </div>
              <div className="text-sm leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(data.overview, c.isDark)}</div>
            </div>
          </div>
        </motion.div>
        {data.key_concepts && data.key_concepts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider" style={{ color: c.textMuted }}>Core Syllabus Concepts</h3>
            <div className="space-y-4">
              {data.key_concepts.map((concept, idx) => {
                const isExpanded = expandedConceptIdx === idx;
                return (
                  <div key={idx} onClick={() => setExpandedConceptIdx(isExpanded ? null : idx)}
                    className="p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden"
                    style={{
                      background: isExpanded ? c.cardBg : c.cardBgAlt,
                      borderColor: isExpanded ? c.borderHover : c.border
                    }}>
                    <div className="flex justify-between items-start w-full">
                      <h4 className="text-xs font-black uppercase tracking-wider transition-colors" style={{ color: c.text }}>
                        {concept.title}
                      </h4>
                      {isExpanded
                        ? <ChevronDown size={14} style={{ color: c.text }} />
                        : <ChevronRight size={14} style={{ color: c.textMuted }} />}
                    </div>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}
                        className="mt-3.5 space-y-4 pt-3 border-t" style={{ borderColor: c.divider }}>
                        <div className="text-xs leading-relaxed" style={{ color: c.textSec }}>{parseMarkdown(concept.content, c.isDark)}</div>
                        {concept.sub_concepts && concept.sub_concepts.length > 0 && (
                          <div className="space-y-2 pl-2" style={{ borderLeft: `2px solid ${c.borderHover}` }}>
                            <span className="text-[9px] uppercase tracking-widest font-extrabold block" style={{ color: c.textMuted }}>Sub-Concepts</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {concept.sub_concepts.map((sub, sIdx) => (
                                <div key={sIdx} className="p-2.5 rounded-lg text-xs font-medium" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}`, color: c.textMuted }}>
                                  {sub}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {concept.tips && concept.tips.length > 0 && (
                          <div className="p-4 rounded-xl space-y-2" style={{ background: c.amberBg, border: `1px solid ${c.border}` }}>
                            <span className="text-[9px] uppercase tracking-widest font-extrabold flex items-center gap-1.5" style={{ color: c.amber }}>
                              <AlertTriangle size={11} /> Important Rule / Tip
                            </span>
                            <ul className="list-disc pl-4 text-xs space-y-1 leading-relaxed" style={{ color: c.textSec }}>
                              {concept.tips.map((tip, tIdx) => <li key={tIdx}>{tip}</li>)}
                            </ul>
                          </div>
                        )}
                        {isScratchpadOpen && (
                          <div className="flex justify-end pt-2">
                            <button onClick={(e) => { e.stopPropagation(); handleImportConcept(concept); }}
                              className="px-2.5 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.amber }}>
                              <Plus size={8} /> Copy to Scratchpad
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.examples && data.examples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider" style={{ color: c.textMuted }}>Explanatory Walkthroughs & Code</h3>
            <div className="space-y-4">
              {data.examples.map((ex, idx) => (
                <div key={idx} className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: c.textMuted }}>
                      <Terminal size={14} /> {ex.title}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: c.textSec }}>{parseMarkdown(ex.scenario, c.isDark)}</div>
                    {ex.code_or_data && (
                      <div className="rounded-xl border font-mono text-xs leading-relaxed whitespace-pre-wrap select-text p-4" style={{ borderColor: c.border, background: c.isDark ? "rgba(0,0,0,0.4)" : "#f1f5f9", color: c.textSec }}>
                        <code>{ex.code_or_data}</code>
                      </div>
                    )}
                    {ex.explanation && (
                      <p className="text-xs italic pl-2 leading-relaxed" style={{ color: c.textMuted, borderLeft: `2px solid ${c.borderHover}` }}>{ex.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.practice_questions && data.practice_questions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider" style={{ color: c.textMuted }}>Interactive Challenges & Scenarios</h3>
            <div className="space-y-4">
              {data.practice_questions.map((pr, idx) => {
                const isAnswerRevealed = practiceRevealed[idx];
                return (
                  <div key={idx} className="p-5 rounded-2xl space-y-4" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase font-mono" style={{ color: c.textMuted }}>CHALLENGE {idx + 1}</span>
                        <h4 className="text-sm font-bold leading-relaxed" style={{ color: c.text }}>{pr.question}</h4>
                      </div>
                    </div>
                    {pr.guidance && (
                      <div className="text-xs p-3 rounded-lg leading-relaxed font-medium" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}`, color: c.textMuted }}>
                        <strong>Guidance/Hint:</strong> {pr.guidance}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => setPracticeRevealed(prev => ({ ...prev, [idx]: !isAnswerRevealed }))}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold h-8 border transition-all cursor-pointer"
                        style={{
                          background: isAnswerRevealed ? c.surfaceHover : c.amberBg,
                          borderColor: c.borderHover,
                          color: isAnswerRevealed ? c.text : c.amber
                        }}>
                        {isAnswerRevealed ? "Hide Solution" : "Reveal Model Answer"}
                      </button>
                    </div>
                    <AnimatePresence>
                      {isAnswerRevealed && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-3 border-t overflow-hidden" style={{ borderColor: c.divider }}>
                          {pr.expected_answer && (
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-widest font-extrabold block" style={{ color: c.amber }}>Ideal Model Answer</span>
                              <div className="text-xs leading-relaxed p-3.5 rounded-xl" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.textSec }}>
                                {parseMarkdown(pr.expected_answer, c.isDark)}
                              </div>
                            </div>
                          )}
                          {pr.red_flag && (
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-widest font-extrabold block" style={{ color: c.rose }}>Critical Trap / Common Mistake</span>
                              <div className="text-xs leading-relaxed p-3.5 rounded-xl" style={{ background: c.roseBg, border: `1px solid ${c.roseBorder}`, color: c.textSec }}>
                                {parseMarkdown(pr.red_flag, c.isDark)}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.quiz && data.quiz.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
              <BookOpenCheck size={13} /> Comprehension Checkpoint Quiz
            </h3>
            <div className="space-y-6">
              {data.quiz.map((q, qIdx) => {
                const userAns = quizAnswers[qIdx];
                const isSubmitted = quizSubmitted[qIdx];
                return (
                  <div key={qIdx} className="p-6 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div className="space-y-5">
                      <div className="pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                        <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>QUESTION {qIdx + 1} OF {data.quiz!.length}</span>
                        <h4 className="text-sm font-bold mt-1" style={{ color: c.text }}>{q.question}</h4>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = userAns === opt;
                          const isCorrect = opt === q.answer;
                          let optionStyle: React.CSSProperties = { background: c.inputBg, borderColor: c.border };
                          if (isSelected && !isSubmitted) {
                            optionStyle = { background: c.cardBgAlt, borderColor: c.borderHover, color: c.text };
                          } else if (isSubmitted) {
                            if (isCorrect) {
                              optionStyle = { background: "rgba(16,185,129,0.15)", borderColor: c.amber, color: c.amber };
                            } else if (isSelected) {
                              optionStyle = { background: "rgba(244,63,94,0.15)", borderColor: c.rose, color: c.rose };
                            } else {
                              optionStyle = { background: c.surface, borderColor: c.border, opacity: 0.55 };
                            }
                          }
                          return (
                            <button key={opt} disabled={isSubmitted} onClick={() => handleQuizSelect(qIdx, opt)}
                              className="w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex justify-between items-center"
                              style={optionStyle}>
                              <span>{opt}</span>
                              {isSubmitted && isCorrect && <CheckCircle size={15} style={{ color: c.amber }} />}
                              {isSubmitted && isSelected && !isCorrect && <AlertTriangle size={15} style={{ color: c.rose }} />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-1 flex flex-col gap-3">
                        {!isSubmitted ? (
                          <button disabled={!userAns} onClick={() => handleQuizSubmit(qIdx)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none" }}>
                            Submit Answer
                          </button>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl text-xs leading-relaxed" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}`, color: c.textSec }}>
                            <strong style={{ color: c.amber }}>Explanation:</strong> {q.explanation}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.summary && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
              <Terminal size={13} /> Study Recap & Summary
            </h3>
            <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <div className="relative space-y-4 select-text">
                <div className="flex justify-between items-center pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <span className="text-xs font-black tracking-widest uppercase" style={{ color: c.text }}>REVISION CHEAT SHEET</span>
                  <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>ACCELERATED DIGEST</span>
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: c.textSec }}>{parseMarkdown(data.summary, c.isDark)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdaptiveLesson = (data: UnifiedLesson) => {
    if (level === "beginner") return renderBeginner(data);
    return renderIntermediate(data);
  };

  const renderTopicLearning = () => (
    <motion.div key="topic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* TOPICS INPUT */}
      {!isGenerating && (
        <div className="space-y-6" style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: "16px", padding: "24px" }}>
          <div className="space-y-2.5">
            <label className="text-[10px] uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
              <Search size={12} style={{ color: c.amber }} /> Learning Objective
            </label>
            <div className="relative">
              <input type="text" value={inputTopic} onChange={e => setInputTopic(e.target.value)}
                placeholder="What would you like to learn today?"
                onKeyDown={e => { if (e.key === "Enter") handleGenerateLesson(inputTopic); }}
                className="w-full pl-5 pr-12 py-4 rounded-xl text-sm font-medium outline-none transition-all"
                style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
              <button onClick={() => handleGenerateLesson(inputTopic)} disabled={isGenerating || !inputTopic.trim()}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                <Sparkles size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {examples.map(ex => (
                <button key={ex} onClick={() => { setInputTopic(ex); handleGenerateLesson(ex); }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
                  style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
                <Clock size={12} style={{ color: c.amber }} /> Learning Timeframe
              </label>
              <div className="flex p-1 rounded-xl max-w-md" style={{ background: c.inputBg, border: `1px solid ${c.border}` }}>
                {[
                  { id: "5m" as const, label: "5 Min" },
                  { id: "10m" as const, label: "10 Min" },
                  { id: "20m" as const, label: "20 Min" },
                  { id: "30m" as const, label: "30 Min" }
                ].map(t => {
                  const isActive = duration === t.id;
                  return (
                    <button key={t.id} onClick={() => setDuration(t.id)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold text-center select-none cursor-pointer relative z-10 transition-colors">
                      <span style={{ color: isActive ? c.text : c.textMuted }}>{t.label}</span>
                      {isActive && (
                        <motion.div layoutId="activeDuration"
                          className="absolute inset-0 rounded-lg -z-10"
                          style={{ background: c.surfaceHover, border: `1px solid ${c.borderHover}` }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-extrabold tracking-wider flex items-center gap-1.5" style={{ color: c.textMuted }}>
                <GraduationCap size={13} style={{ color: c.amber }} /> Learning Mode Selector
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "beginner" as const, label: "Beginner", icon: BookOpen, desc: "Understand from scratch with simple terms & analogies", color: "amber" },
                  { id: "intermediate" as const, label: "Intermediate", icon: Layers, desc: "Dive into practical details, mechanics, and design", color: "amber" },
                  { id: "interview" as const, label: "Interview", icon: Award, desc: "Prepare for placements, trade-offs, and traps", color: "amber" },
                  { id: "revision" as const, label: "Quick Revision", icon: Zap, desc: "Refresh knowledge with condensed sheets", color: "amber" }
                ].map(m => {
                  const isActive = level === m.id;
                  const Icon = m.icon;
                  const colorKey = m.color as keyof typeof c;
                  const borderColor = `${m.color}Border` as keyof typeof c;
                  const bgColor = `${m.color}Bg` as keyof typeof c;
                  return (
                    <motion.button key={m.id} type="button" onClick={() => setLevel(m.id)}
                      whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="relative p-5 rounded-2xl border text-left flex flex-col justify-between h-[170px] cursor-pointer transition-all duration-300 group overflow-hidden"
                      style={{
                        background: (isActive ? c[bgColor] : c.cardBg) as string,
                        borderColor: (isActive ? c[borderColor] : c.border) as string
                      }}>
                      <div className="flex justify-between items-center w-full relative z-10">
                        <div className="p-2 rounded-xl" style={{
                          background: (isActive ? c[bgColor] : c.surface) as string,
                          color: (isActive ? c[colorKey] : c.textMuted) as string
                        }}>
                          <Icon size={18} />
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ background: c[bgColor] as string, color: c[colorKey] as string, border: `1px solid ${c[borderColor] as string}` }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 relative z-10">
                        <h4 className="text-sm font-black leading-none tracking-tight" style={{ color: c.text }}>{m.label}</h4>
                        <p className="text-[11px] leading-normal line-clamp-2" style={{ color: c.textMuted }}>{m.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
          <button onClick={() => handleGenerateLesson(inputTopic)} disabled={isGenerating || !inputTopic.trim()}
            className="w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none" }}>
            <Sparkles size={16} /> Generate Accelerated Lesson
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="p-10 rounded-2xl space-y-8 relative overflow-hidden mb-6 flex flex-col items-center justify-center min-h-[400px]"
            style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
            <div className="space-y-4 max-w-xl mx-auto text-center">
              <h3 className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: c.text }}>
                <Sparkles size={18} style={{ color: c.amber }} /> Generating Personalized Lesson...
              </h3>
              <p className="text-xs font-mono" style={{ color: c.textMuted }}>Synthesizing topic boundaries via AI model</p>
            </div>
            <div className="relative max-w-md mx-auto py-4">
              <div className="absolute left-[15px] top-6 bottom-6 w-[2px]" style={{ background: c.border }} />
              <div className="space-y-6 relative">
                {loadingSteps.map((step, idx) => {
                  const isDone = loadingStep > idx;
                  const isActive = loadingStep === idx;
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-4 pl-1">
                      <div className="relative z-10 flex items-center justify-center">
                        {isDone ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: c.greenBg, border: `1px solid ${c.amber}`, color: c.amber }}>
                            <Check size={14} />
                          </div>
                        ) : isActive ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
                            style={{ background: c.amberBg, border: `1px solid ${c.amber}`, color: c.amber }}>
                            <RotateCcw className="animate-spin" size={12} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono"
                            style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.textMuted }}>
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono" style={{
                          color: isDone ? c.amber : isActive ? c.amber : c.textMuted,
                          fontWeight: isActive ? 700 : 400
                        }}>{step}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR STATE */}
      {topicError && (
        <div className="p-4 rounded-xl flex items-start gap-3 mb-6" style={{ background: c.roseBg, border: `1px solid ${c.roseBorder}` }}>
          <AlertTriangle size={18} style={{ color: c.rose }} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold" style={{ color: c.text }}>Generation Failed</h4>
            <p className="text-xs leading-normal" style={{ color: c.textMuted }}>{topicError}</p>
          </div>
        </div>
      )}

      {/* LESSON CONTENT — only render inline if no onViewLesson (backward compat) */}
      {!onViewLesson && (
      <AnimatePresence>
        {lessonData && !isGenerating && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
            {/* LESSON HEADER */}
            <div className="p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="space-y-1">
                <div className="inline-flex gap-1.5 items-center text-[10px] uppercase font-extrabold tracking-wider" style={{ color: c.amber }}>
                  <Sparkles size={10} /> Adaptive Lesson Generated ({duration} &bull; {level})
                </div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: c.text }}>{currentTopic}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: isScratchpadOpen ? c.amberBg : c.surface,
                    border: `1px solid ${isScratchpadOpen ? c.amberBorder : c.border}`,
                    color: isScratchpadOpen ? c.amber : c.text
                  }}>
                  <Edit3 size={13} className="inline mr-1.5" />
                  {isScratchpadOpen ? "Hide Study Companion" : "Open Study Companion"}
                </button>
                <div className="text-xs px-3 py-1 rounded-lg flex items-center gap-1.5" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}`, color: c.textMuted }}>
                  <Clock size={12} style={{ color: c.amber }} /> Digest: {duration}
                </div>
              </div>
            </div>

            {/* SPLIT SCREEN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className={isScratchpadOpen ? "lg:col-span-7 space-y-8" : "lg:col-span-12 space-y-8"}>
                {renderAdaptiveLesson(lessonData)}
              </div>

              {/* SCRATCHPAD */}
              {isScratchpadOpen && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-5 rounded-2xl p-5 sticky top-6 space-y-5"
                  style={{ background: c.stickyBg, border: `1px solid ${c.amberBorder}`, backdropFilter: "blur(12px)" }}>
                  <div className="flex justify-between items-center pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: c.text }}>
                        <Edit3 size={14} style={{ color: c.amber }} /> Active Scratchpad
                      </h3>
                      <p className="text-[10px]" style={{ color: c.textMuted }}>Study notes companion</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: c.textMuted }}>
                      {isSavingNotes ? (
                        <><span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ background: c.amber }} /><span>Saving...</span></>
                      ) : (
                        <><Check size={11} style={{ color: c.amber }} /><span style={{ color: c.amber }}>Auto-saved</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 p-1 rounded-lg" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                    {[
                      { id: "notes" as const, label: "My Notes" },
                      { id: "takeaways" as const, label: "Takeaways" },
                      { id: "playground" as const, label: "Playground" }
                    ].map(t => {
                      const isActive = scratchpadTab === t.id;
                      return (
                        <button key={t.id} onClick={() => setScratchpadTab(t.id)}
                          className="flex-1 py-1.5 rounded-md text-[10px] font-semibold text-center select-none cursor-pointer relative z-10 transition-colors">
                          <span style={{ color: isActive ? c.text : c.textMuted }}>{t.label}</span>
                          {isActive && (
                            <motion.div layoutId="activeScratchTab"
                              className="absolute inset-0 rounded-md -z-10"
                              style={{ background: c.surfaceHover, border: `1px solid ${c.borderHover}` }}
                              transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="min-h-[300px] flex flex-col">
                    {scratchpadTab === "notes" && (
                      <div className="flex-1 flex flex-col space-y-3">
                        <textarea value={notesText} onChange={e => handleNotesChange(e.target.value)}
                          placeholder="Write notes here or copy concepts from 'Takeaways' tab..."
                          className="flex-1 w-full min-h-[320px] p-3 rounded-lg text-sm leading-relaxed resize-y outline-none"
                          style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.textSec }} />
                        <div className="text-[10px] flex justify-between" style={{ color: c.textMuted }}>
                          <span>Markdown supported</span>
                          <span>{notesText.length} chars</span>
                        </div>
                      </div>
                    )}
                    {scratchpadTab === "takeaways" && (
                      <div className="space-y-4">
                        <div className="text-[11px] leading-normal p-3 rounded-lg flex items-start gap-2" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                          <Sparkles size={12} style={{ color: c.amber }} className="shrink-0 mt-0.5" />
                          <span>Copy concepts directly into your active Scratchpad notes.</span>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {lessonData.key_concepts.map((concept, idx) => (
                            <div key={idx} className="p-3 rounded-xl transition-colors space-y-2" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: c.text }}>{concept.title}</h4>
                                <button onClick={() => handleImportConcept(concept)}
                                  className="px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.amber }}>
                                  <Plus size={8} /> Copy to Notes
                                </button>
                              </div>
                              <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: c.textMuted }}>{concept.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {scratchpadTab === "playground" && (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-3 flex-1 flex flex-col">
                          <div className="flex justify-between items-center text-[10px] font-mono pl-1" style={{ color: c.textMuted }}>
                            <span className="flex items-center gap-1"><Terminal size={11} style={{ color: c.amber }} /> simulator_script.py</span>
                          </div>
                          <div className="rounded-xl border font-mono text-[11px] leading-relaxed p-4 flex-1 min-h-[160px] whitespace-pre-wrap select-text"
                            style={{ borderColor: c.border, background: c.isDark ? "rgba(0,0,0,0.4)" : "#f1f5f9", color: c.textSec }}>
                            <code>
                              {currentTopic.toLowerCase().includes("gradient")
                                ? `# Gradient Descent optimization simulator\nimport numpy as np\n\nweights = 10.0\nlearning_rate = 0.01\ngradient = 2.5\n\nprint("Updating weights...")\nweights = weights - (learning_rate * gradient)\nprint(f"Final weights: {weights}")`
                                : currentTopic.toLowerCase().includes("sql") || currentTopic.toLowerCase().includes("join")
                                  ? `# SQL Join execution simulation\nimport sqlite3\n\nconn = sqlite3.connect(':memory:')\n# Executing query:\n# SELECT o.id, c.name FROM orders o INNER JOIN customers c ON o.cust_id = c.id`
                                  : `# Activation Function execution\nimport numpy as np\n\ninputs = np.array([0.5, -0.2])\nweights = np.array([0.8, 0.4])\nbias = -0.1\n\nz = np.dot(inputs, weights) + bias\nactivation = max(0, z)\nprint(f"ReLU activation: {activation}")`}
                            </code>
                          </div>
                          <button onClick={handleRunPlayground} disabled={isRunningPlayground}
                            className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none" }}>
                            {isRunningPlayground ? "Running script..." : "Execute Python Script"} <Play size={10} fill="currentColor" />
                          </button>
                        </div>
                        {playgroundOutput && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap"
                            style={{ borderColor: c.border, background: c.isDark ? "rgba(0,0,0,0.4)" : "#f1f5f9", color: c.amber }}>
                            {playgroundOutput}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </motion.div>
  );

  const filteredTopics = summaryData?.topics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const uploadStages = ["Upload", "Extract Text", "Analyze Content", "Identify Topics", "Generate Summary", "Completed"];

  return lessonToView ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col antialiased"
      style={{ color: c.text }}
    >
      <style>{`
        .sa-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .sa-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      {/* Viewer mode — back button + lesson content */}
      <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <button onClick={() => onViewLesson?.(null as any)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
          style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}>
          <ChevronRight size={14} className="rotate-180" /> Back to Study Assistant
        </button>
        <div className="inline-flex gap-1.5 items-center text-[10px] uppercase font-extrabold tracking-wider" style={{ color: c.amber }}>
          <Sparkles size={10} /> Adaptive Lesson Generated ({lessonToView.duration} &bull; {lessonToView.level})
        </div>
      </div>

      {/* LESSON HEADER */}
      <div className="p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight" style={{ color: c.text }}>{lessonToView.topic}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs px-3 py-1 rounded-lg flex items-center gap-1.5" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}`, color: c.textMuted }}>
            <Clock size={12} style={{ color: c.amber }} /> Digest: {lessonToView.duration}
          </div>
        </div>
      </div>

      {/* LESSON CONTENT */}
      <div className="space-y-8">
        {lessonToView.level === "beginner" ? renderBeginner(lessonToView.lesson) : renderIntermediate(lessonToView.lesson)}
      </div>
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col antialiased"
      style={{ color: c.text }}
    >
      {/* Hidden scrollbar style */}
      <style>{`
        .sa-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .sa-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex items-center gap-2.5">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            <BookOpen size={18} style={{ color: "#000" }} />
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-base font-extrabold leading-tight"
              style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}
            >
              Study Assistant
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-xs leading-tight"
              style={{ color: c.textMuted }}
            >
              {mode === "document" ? "AI-powered document summarizer & topic analyzer" : "AI-powered accelerated learning plans"}
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex p-0.5 rounded-lg" style={{ background: c.inputBg, border: `1px solid ${c.border}` }}>
            <button onClick={() => { setMode("document"); setStatus("empty"); setFile(null); setSummaryData(null); setIsGenerating(false); setTopicError(null); setShowTopicHistory(false); }}
              className="relative px-3 py-1.5 rounded-md text-[10px] font-bold select-none cursor-pointer z-10 transition-colors">
              <span style={{ color: mode === "document" ? c.text : c.textMuted }}><FileText size={12} className="inline mr-1" />Document</span>
              {mode === "document" && (
                <motion.div layoutId="modePill"
                  className="absolute inset-0 rounded-md -z-10"
                  style={{ background: c.surfaceHover, border: `1px solid ${c.borderHover}` }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
            </button>
            <button onClick={() => { setMode("topic"); setShowHistory(false); }}
              className="relative px-3 py-1.5 rounded-md text-[10px] font-bold select-none cursor-pointer z-10 transition-colors">
              <span style={{ color: mode === "topic" ? c.text : c.textMuted }}><GraduationCap size={12} className="inline mr-1" />Topic</span>
              {mode === "topic" && (
                <motion.div layoutId="modePill"
                  className="absolute inset-0 rounded-md -z-10"
                  style={{ background: c.surfaceHover, border: `1px solid ${c.borderHover}` }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
            </button>
          </div>
          {mode === "document" && status === "ready" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setStatus("empty"); setFile(null); setSummaryData(null); setSearchQuery(""); }}
              className="h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}
            >
              <Plus size={14} /> New Upload
            </motion.button>
          )}
          {mode === "document" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowHistory(!showHistory)}
              className="h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              style={{
                background: showHistory ? c.amberActive : c.surface,
                border: `1px solid ${showHistory ? c.amberBorder : c.border}`,
                color: showHistory ? c.amber : c.text
              }}
            >
              <History size={14} /> History
              {history.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black" style={{ background: c.amberBg, color: c.amber }}>
                  {history.length}
                </span>
              )}
            </motion.button>
          )}
          {mode === "topic" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowTopicHistory(!showTopicHistory)}
              className="h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              style={{
                background: showTopicHistory ? c.amberActive : c.surface,
                border: `1px solid ${showTopicHistory ? c.amberBorder : c.border}`,
                color: showTopicHistory ? c.amber : c.text
              }}
            >
              <History size={14} /> History
              {topicHistory.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black" style={{ background: c.amberBg, color: c.amber }}>
                  {topicHistory.length}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── HISTORY SIDEBAR ── */}
      <AnimatePresence>
        {mode === "document" && showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowHistory(false)}
              style={{
                position: "fixed", top: "70px", left: 0, right: 0, bottom: 0, zIndex: 98,
                background: "rgba(0,0,0,0.4)",
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              style={{
                position: "fixed", top: "70px", right: 0, bottom: 0, zIndex: 99,
                width: "min(420px, 90vw)",
                background: c.isDark ? "rgba(18, 17, 26, 0.95)" : "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(20px)",
                borderLeft: `1px solid ${c.border}`,
                display: "flex", flexDirection: "column",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderBottom: `1px solid ${c.divider}`,
                background: c.surface,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <History size={16} style={{ color: c.amber }} />
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: c.text }}>Recent Documents</span>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 600, color: c.amber,
                    background: c.amberBg, padding: "1px 7px", borderRadius: 999,
                  }}>
                    {history.length}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowHistory(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: c.textMuted, padding: 4 }}
                >
                  <X size={18} />
                </motion.button>
              </div>
              <div style={{ padding: "0.75rem 1.25rem" }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: c.textMuted }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search history..."
                    style={{
                      width: "100%", padding: "0.55rem 0.75rem 0.55rem 2rem",
                      borderRadius: 10, fontSize: "0.8rem", outline: "none",
                      background: c.pill, border: `1px solid ${c.border}`,
                      color: c.text, boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 0.75rem 1rem" }}>
                {history.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", gap: 8 }}>
                    <FileText size={32} style={{ color: c.textMuted, opacity: 0.3 }} />
                    <p style={{ fontSize: "0.82rem", color: c.textMuted, textAlign: "center" }}>No documents analyzed yet. Upload a study file to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {history.map((doc, i) => (
                      <motion.div
                        key={doc.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => loadHistoryItem(doc)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "0.65rem 0.75rem", borderRadius: 12, cursor: "pointer",
                          background: c.cardBg, border: `1px solid ${c.border}`,
                        }}
                        whileHover={{ borderColor: c.amberBorder, background: c.amberBg }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                            <FileText size={13} style={{ color: c.amber }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: c.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {doc.name}
                            </p>
                            <p style={{ fontSize: "0.7rem", color: c.textMuted, margin: 0 }}>
                              {doc.date} · {doc.pages} pages · {doc.topics} topics
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: c.textMuted, flexShrink: 0 }} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
        {mode === "topic" && showTopicHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${c.amberBorder}`, background: c.isDark ? "rgba(18, 17, 26, 0.95)" : "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(12px)" }}
          >
            <div className="p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                <History size={15} style={{ color: c.amber }} /> Topic Learning History
              </h3>
              {topicHistory.length === 0 ? (
                <p className="text-sm py-2" style={{ color: c.textMuted }}>No topics studied yet. Generate a lesson to get started.</p>
              ) : (
                <div className="space-y-2">
                  {topicHistory.map((item, i) => (
                    <motion.div
                      key={`${item.topic}-${i}`}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all"
                      style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
                      onClick={() => {
                        if (onViewLesson) {
                          onViewLesson({ topic: item.topic, lesson: item.lesson, duration: item.duration, level: item.level });
                        } else {
                          setLessonData(item.lesson);
                          setCurrentTopic(item.topic);
                          setInputTopic(item.topic);
                          setDuration(item.duration as typeof duration);
                          setLevel(item.level as typeof level);
                          setQuizAnswers({});
                          setQuizSubmitted({});
                          setExpandedConceptIdx(null);
                          setPracticeRevealed({});
                        }
                        setShowTopicHistory(false);
                      }}
                      whileHover={{ scale: 1.01, borderColor: c.amberBorder }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                          <GraduationCap size={14} style={{ color: c.amber }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: c.text }}>{item.topic}</p>
                          <p className="text-xs" style={{ color: c.textMuted }}>{item.date} · {item.duration} · {item.level}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ x: 2 }}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: c.amberActive, color: c.amber }}
                      >
                        Reload <ChevronRight size={12} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1">
        <AnimatePresence mode="wait">

          {/* ══ TOPIC LEARNING MODE ══ */}
          {mode === "topic" && renderTopicLearning()}

          {/* ══ DOCUMENT ANALYSIS MODE ══ */}
          {mode === "document" && status === "empty" && (
            <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="space-y-6">

              {/* Upload Zone */}
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                animate={{
                  borderColor: isDragging ? "rgba(245,158,11,0.6)" : c.border,
                  background: isDragging ? c.amberBg : c.surface,
                  scale: isDragging ? 1.01 : 1
                }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer rounded-3xl p-10 text-center relative overflow-hidden"
                style={{ border: `2px dashed ${c.border}` }}
                whileHover={{ borderColor: c.amberBorder, background: c.amberBg }}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 right-8 w-24 h-24 rounded-full" style={{ opacity: c.isDark ? 0.05 : 0.08, background: "radial-gradient(circle, #f59e0b, transparent)" }} />
                  <div className="absolute bottom-4 left-8 w-16 h-16 rounded-full" style={{ opacity: c.isDark ? 0.04 : 0.06, background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf" className="hidden" onChange={handleFileInputChange} />

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}
                >
                  <Upload style={{ color: c.amber }} size={28} />
                </motion.div>

                <h3 className="text-xl font-extrabold mb-2" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
                  {isDragging ? "Drop your file here!" : "Upload Your Study Material"}
                </h3>
                <p className="text-sm mb-1" style={{ color: c.textSec }}>
                  Drag & Drop or <span style={{ color: c.amber }} className="font-semibold">Browse Files</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {["PDF", "DOCX", "PPTX", "TXT", "Markdown"].map((fmt, i) => (
                    <motion.span
                      key={fmt}
                      custom={i}
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}`, color: c.amber }}
                    >
                      {fmt}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* How It Works */}
              <div>
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <Zap size={15} style={{ color: c.amber }} /> How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "01", title: "Upload", desc: "Drop any study material — lecture notes, textbooks, or presentation slides.", icon: <Upload size={18} style={{ color: c.amber }} /> },
                    { step: "02", title: "Analyze", desc: "AI engine extracts text context and maps complex syllabus structures automatically.", icon: <Brain size={18} style={{ color: "#a78bfa" }} /> },
                    { step: "03", title: "Generate", desc: "Instantly get core concept lists, exam prep summaries, keywords, and quick revision.", icon: <Sparkles size={18} style={{ color: "#22d3ee" }} /> }
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="p-5 rounded-2xl relative overflow-hidden group transition-all"
                      style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                          {item.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Step {item.step}</span>
                          <h4 className="text-sm font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>{item.title}</h4>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <motion.div
                variants={fadeUp} custom={3} initial="hidden" animate="visible"
                className="p-5 rounded-2xl"
                style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
              >
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                  <Star size={14} style={{ color: c.amber }} /> Features
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {["Topic Detection", "AI Summary", "Key Points", "Quick Revision", "Smart Search", "Multi-format Support", "Copy Summary", "Export PDF", "Export DOCX"].map((feat, i) => (
                    <motion.div key={feat} custom={i} variants={scaleIn} initial="hidden" animate="visible" className="flex items-center gap-2 text-sm" style={{ color: c.textSec }}>
                      <CheckCircle2 size={14} style={{ color: c.amber }} className="shrink-0" />
                      <span>{feat}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ══ UPLOADING STATE ══ */}
          {mode === "document" && status === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-8"
            >
              <div className="relative w-24 h-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{ border: `3px solid transparent`, borderTopColor: c.amber, borderRightColor: c.amberBg }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-3 rounded-full"
                  style={{ border: `2px solid transparent`, borderTopColor: "rgba(139,92,246,0.6)", borderLeftColor: "rgba(139,92,246,0.2)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={28} style={{ color: c.amber }} />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>Analyzing Document...</h3>
                <p className="text-sm" style={{ color: c.textMuted }}>{currentStage} in progress</p>
              </div>
              <div className="w-full max-w-lg grid grid-cols-3 gap-3">
                {uploadStages.slice(0, 6).map((step, idx) => {
                  const stageIdx = uploadStages.indexOf(currentStage);
                  const isActive = idx <= stageIdx;
                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-xl text-center space-y-1.5 transition-all duration-500"
                      style={{ background: isActive ? c.amberBg : c.surface, border: `1px solid ${isActive ? c.amberBorder : c.border}` }}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Stage {idx + 1}</span>
                      <span className="text-xs font-semibold block" style={{ color: c.text }}>{step}</span>
                      {isActive && idx === stageIdx && (
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 rounded-full mx-auto" style={{ background: c.amber }} />
                      )}
                      {isActive && idx < stageIdx && <CheckCircle2 size={12} style={{ color: c.green }} className="mx-auto" />}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══ READY STATE: 30/70 SPLIT LAYOUT ══ */}
          {mode === "document" && status === "ready" && summaryData && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-0"
              style={{ minHeight: "600px" }}
            >
              {/* ── LEFT PANEL 30% ── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="sa-scroll flex flex-col gap-3 overflow-y-auto pr-3"
                style={{ width: "30%", minWidth: "200px", maxHeight: "80vh", position: "sticky", top: 0 }}
              >
                {/* File info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-2xl shrink-0" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                      <FileText size={14} style={{ color: c.amber }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: c.text }}>{fileDetails?.name || "Document"}</p>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ background: c.greenBg, color: c.green }}>Analyzed</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Pages", value: summaryData.stats.pages },
                      { label: "Topics", value: summaryData.stats.topicsFound },
                      { label: "Words", value: summaryData.stats.words.toLocaleString() },
                      { label: "Read Time", value: summaryData.stats.readingTime }
                    ].map(stat => (
                      <div key={stat.label} className="p-2 rounded-lg text-center" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}>
                        <span className="text-[10px] block" style={{ color: c.textMuted }}>{stat.label}</span>
                        <span className="text-xs font-extrabold" style={{ color: c.text }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Detected Topics Nav */}
                <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <div className="p-3 border-b sticky top-0 z-10" style={{ borderColor: c.divider, background: c.stickyBg, backdropFilter: "blur(12px)" }}>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: c.amber }}>Detected Topics</span>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search topics..."
                        className="w-full rounded-lg pl-7 pr-2 py-1.5 text-xs focus:outline-none transition-colors"
                        style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}
                      />
                    </div>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {summaryData.topics.map((t, i) => (
                      <motion.button
                        key={t.name}
                        custom={i}
                        variants={slideRight}
                        initial="hidden"
                        animate="visible"
                        onClick={() => handleScrollToTopic(t.name)}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all duration-200"
                        style={{
                          background: activeTopic === t.name ? c.amberActive : "transparent",
                          border: activeTopic === t.name ? `1px solid ${c.amberBorder}` : "1px solid transparent",
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors" style={{ background: activeTopic === t.name ? c.amber : c.border }} />
                          <span className="text-sm font-semibold truncate" style={{ color: activeTopic === t.name ? c.amber : c.textSec }}>{t.name}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: activeTopic === t.name ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight size={12} style={{ color: activeTopic === t.name ? c.amber : c.textMuted }} />
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="p-3 rounded-2xl shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-2.5 flex items-center gap-1.5" style={{ color: c.amber }}>
                    <Sparkles size={11} /> AI Subject Insights
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Main Subject", value: summaryData.insights.mainSubject },
                      { label: "Difficulty", value: summaryData.insights.difficultyLevel },
                      { label: "Study Time", value: summaryData.insights.estimatedStudyTime },
                      { label: "Exam Priority", value: "High" }
                    ].map((insight, i) => (
                      <motion.div
                        key={insight.label}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="p-2 rounded-xl text-center"
                        style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}
                      >
                        <span className="text-[10px] block leading-tight" style={{ color: c.textMuted }}>{insight.label}</span>
                        <span className="text-xs font-extrabold block truncate mt-0.5" style={{ color: c.text }}>{insight.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="p-3 rounded-2xl shrink-0 space-y-2" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: c.textMuted }}>Actions</span>
                  {[
                    { icon: <Copy size={13} />, label: "Copy Summary", fn: handleCopySummary },
                    { icon: <FileDown size={13} />, label: "Download PDF", fn: () => {} },
                  ].map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={action.fn}
                      className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all text-left"
                      style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textSec }}
                    >
                      <span style={{ color: c.amber }} className="shrink-0">{action.icon}</span>
                      {action.label}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setStatus("empty"); setFile(null); setSummaryData(null); }}
                    className="w-full py-2 rounded-lg text-sm font-extrabold transition-all flex items-center justify-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}
                  >
                    <RefreshCw size={13} /> New Upload
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* ── RIGHT PANEL 70% ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                ref={contentRef}
                className="flex-1 flex flex-col min-w-0 pl-4"
              >
                {/* Search Bar */}
                <div className="pb-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search summaries, keywords, topics..."
                      className="w-full rounded-xl pl-10 pr-10 py-3 text-sm transition-all focus:outline-none"
                      style={{
                        background: c.inputBg,
                        border: `1px solid ${searchQuery ? c.amber : c.border}`,
                        color: c.text,
                        boxShadow: searchQuery ? `0 0 0 2px ${c.amberBg}` : "none"
                      }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: c.textMuted }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-xs mt-1.5 ml-1" style={{ color: c.textMuted }}>
                      {filteredTopics.length} topic{filteredTopics.length !== 1 ? "s" : ""} found for &ldquo;{searchQuery}&rdquo;
                    </p>
                  )}
                </div>

                {/* Accordion Topic Cards */}
                <div className="space-y-3 pb-4">
                  {(searchQuery ? filteredTopics : filteredTopics.slice(0, revealedTopics)).map((t, idx) => {
                    const isOpen = activeTopic === t.name;
                    return (
                      <motion.div
                        key={t.name}
                        id={`topic-${t.name.replace(/\s+/g, "-")}`}
                        custom={idx}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        className="rounded-2xl overflow-hidden"
                        style={{ background: c.cardBg, border: `1px solid ${isOpen ? c.amberBorder : c.border}` }}
                      >
                        {/* Accordion Header — clickable */}
                        <motion.button
                          onClick={() => handleScrollToTopic(t.name)}
                          whileHover={{ background: isOpen ? c.amberBg : c.bgHover }}
                          whileTap={{ scale: 0.995 }}
                          className="w-full flex items-center justify-between px-5 py-4 text-left transition-all"
                          style={{
                            background: isOpen ? c.amberBg : c.surface,
                            borderBottom: isOpen ? `1px solid ${c.divider}` : "none",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: isOpen ? "rgba(245,158,11,0.2)" : c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                              <BookOpen size={14} style={{ color: c.amber }} />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>{t.name}</h3>
                              {!isOpen && (
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: c.textMuted }}>{t.overview.slice(0, 80)}…</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full hidden sm:block" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted }}>
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 90 : 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <ChevronRight size={16} style={{ color: isOpen ? c.amber : c.textMuted }} />
                            </motion.div>
                          </div>
                        </motion.button>

                        {/* Accordion Body — animated open/close */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="body"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              style={{ overflow: "hidden" }}
                            >
                              <div className="p-5 space-y-5">
                                {/* Overview */}
                                <div>
                                  <span className="text-[10px] uppercase tracking-widest font-black block mb-2" style={{ color: c.amber }}>Overview</span>
                                  <p className="text-[15px] leading-[1.75]" style={{ color: c.textSec }}>{t.overview}</p>
                                </div>

                                {/* Key Concepts + Important Points */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 rounded-xl" style={{ background: c.purpleBg, border: `1px solid ${c.purpleBorder}` }}>
                                    <span className="text-[10px] uppercase tracking-widest font-black block mb-3" style={{ color: "#a78bfa" }}>
                                      ✦ Key Concepts
                                    </span>
                                    <ul className="space-y-1.5">
                                      {t.keyConcepts.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[14px] leading-snug" style={{ color: c.textSec }}>
                                          <span style={{ color: "#a78bfa" }} className="mt-1 shrink-0">▸</span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-4 rounded-xl" style={{ background: c.cyanBg, border: `1px solid ${c.cyanBorder}` }}>
                                    <span className="text-[10px] uppercase tracking-widest font-black block mb-3" style={{ color: "#22d3ee" }}>
                                      ★ Important Points
                                    </span>
                                    <ul className="space-y-1.5">
                                      {t.importantPoints.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[14px] leading-snug" style={{ color: c.textSec }}>
                                          <span style={{ color: "#22d3ee" }} className="mt-1 shrink-0">▸</span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Questions */}
                                {t.questions && t.questions.length > 0 && (
                                  <div className="p-4 rounded-xl" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                                    <span className="text-[10px] uppercase tracking-widest font-black block mb-3 flex items-center gap-1.5" style={{ color: c.amber }}>
                                      <Brain size={12} /> Practice Questions
                                    </span>
                                    <ul className="space-y-3">
                                      {t.questions.map((q, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[14px] leading-snug" style={{ color: c.textSec }}>
                                          <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold" style={{ background: c.amberBg, color: c.amber }}>{i + 1}</span>
                                          <span>{q}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Quick Revision */}
                                <div className="p-4 rounded-xl relative overflow-hidden" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ opacity: 0.04, background: "radial-gradient(circle, #f59e0b, transparent)", transform: "translate(30%, -30%)" }} />
                                  <span className="text-[10px] uppercase tracking-widest font-black block mb-2" style={{ color: c.amber }}>⚡ Quick Revision</span>
                                  <p className="text-[15px] leading-[1.75] italic" style={{ color: c.textSec }}>&ldquo;{t.quickRevision}&rdquo;</p>
                                </div>

                                {/* Keywords */}
                                <div>
                                  <span className="text-[10px] uppercase tracking-widest font-black block mb-2.5" style={{ color: c.textMuted }}># Keywords</span>
                                  <div className="flex flex-wrap gap-2">
                                    {t.keywords.map(kw => (
                                      <motion.span
                                        key={kw}
                                        whileHover={{ scale: 1.06, y: -1 }}
                                        className="px-3 py-1 rounded-full text-sm font-semibold cursor-default"
                                        style={{ background: c.pill, border: `1px solid ${c.pillBorder}`, color: c.textSec }}
                                      >
                                        {kw}
                                      </motion.span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Loading indicator */}
                  {!searchQuery && summaryData && revealedTopics < summaryData.topics.length && (
                    <div className="flex justify-center py-4">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: c.amber }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}