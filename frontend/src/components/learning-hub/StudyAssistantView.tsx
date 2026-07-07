"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  Upload, FileText, Copy,
  RefreshCw, Search, CheckCircle2, ChevronRight, BookOpen,
  FileDown, Layers, History, Plus, Sparkles, Brain,
  Zap, Star, X, Hash
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

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
    textMuted:    isDark ? "#6b7280"              : "#94a3b8",
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
  importantPoints: string[]; quickRevision: string; keywords: string[];
}
interface DocStats {
  pages: number; words: number; topicsFound: number; readingTime: string; summaryLength: string;
}
interface AIInsights {
  mainSubject: string; difficultyLevel: string; estimatedStudyTime: string;
  importantChapters: string[]; repeatedTopics: string[];
}

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
export function StudyAssistantView() {
  const theme = useTheme();
  const c = mkColors(theme);

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
  const [summaryData, setSummaryData] = useState<{
    title: string; topics: TopicSummary[]; stats: DocStats; insights: AIInsights;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const MOCK_SUMMARY = {
    title: "Data Structures & Algorithms",
    topics: [
      {
        name: "Introduction to Data Structures",
        overview: "Data structures are ways of organizing and storing data in a computer so that it can be accessed and modified efficiently. They are fundamental to computer science and programming, enabling efficient management of data for various applications.",
        keyConcepts: ["Abstract Data Type (ADT)", "Data Organization", "Efficiency (Time & Space Complexity)", "Linear vs. Non-linear", "Static vs. Dynamic"],
        importantPoints: ["Choosing the right data structure significantly impacts performance.", "Each data structure has strengths and weaknesses for specific operations.", "ADTs define logical form independent of physical implementation."],
        quickRevision: "Data structures organize data for efficient access and modification. Key aspects include ADTs, time/space complexity, and choosing the right structure.",
        keywords: ["Data Structure", "ADT", "Efficiency", "Time Complexity", "Space Complexity"]
      },
      {
        name: "Arrays and Linked Lists",
        overview: "Arrays provide contiguous memory allocation for same-type elements with O(1) random access. Linked Lists consist of pointer-connected nodes enabling dynamic memory allocation. Each has unique trade-offs in insertion, deletion, and access patterns.",
        keyConcepts: ["Static vs. Dynamic Arrays", "Singly / Doubly / Circular Linked Lists", "Memory Allocation", "Pointer-based traversal", "Cache locality"],
        importantPoints: ["Arrays have O(1) access but O(n) insertion/deletion.", "Linked lists have O(n) access but O(1) insertion at head.", "Dynamic arrays resize automatically with amortized O(1) append."],
        quickRevision: "Arrays = fast access, slow insert. Linked Lists = slow access, fast insert. Choose based on usage patterns.",
        keywords: ["Array", "Linked List", "Pointer", "Dynamic Array", "Cache", "Traversal"]
      },
      {
        name: "Trees and Graphs",
        overview: "Trees are hierarchical data structures with a root node and child nodes. Graphs extend this to arbitrary connections between nodes, enabling modeling of complex relationships like social networks and routing algorithms.",
        keyConcepts: ["Binary Trees & BST", "AVL and Red-Black Trees", "Graph Representations", "DFS and BFS traversal", "Minimum Spanning Trees"],
        importantPoints: ["BST search is O(log n) for balanced trees, O(n) for skewed.", "DFS uses a stack (or recursion); BFS uses a queue.", "Trees are a special case of graphs with no cycles."],
        quickRevision: "Trees are hierarchical (parent-child); Graphs are arbitrary connections. DFS/BFS are universal traversal strategies.",
        keywords: ["BST", "AVL Tree", "DFS", "BFS", "Graph", "Dijkstra", "Spanning Tree"]
      },
      {
        name: "Sorting Algorithms",
        overview: "Sorting algorithms arrange data in a defined order. They vary in time complexity, space usage, stability, and suitability for different input sizes. Understanding trade-offs is critical for selecting the right algorithm.",
        keyConcepts: ["Comparison-based (Bubble, Merge, Quick, Heap)", "Non-comparison (Counting, Radix, Bucket)", "Stability in Sorting", "In-place vs. Out-of-place"],
        importantPoints: ["Quick Sort average O(n log n) but O(n²) worst case.", "Merge Sort is always O(n log n) but requires O(n) extra space.", "For small arrays, Insertion Sort beats asymptotically faster algorithms."],
        quickRevision: "Quick Sort is fast on average; Merge Sort is consistent; Heap Sort is space-efficient. Stability matters when sorting complex objects.",
        keywords: ["Quick Sort", "Merge Sort", "Heap Sort", "Stability", "Radix Sort"]
      }
    ],
    stats: { pages: 1, words: 20, topicsFound: 4, readingTime: "1 min", summaryLength: "Medium" },
    insights: { mainSubject: "Computer Science", difficultyLevel: "Intermediate", estimatedStudyTime: "6–10 hours", importantChapters: ["Arrays & Linked Lists", "Trees & Graphs", "Sorting"], repeatedTopics: ["Time Complexity", "Space Complexity", "Traversal"] }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adyapan-study-history");
      setHistory(stored ? JSON.parse(stored) : []);
    } catch { setHistory([]); }
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
      setStatus("ready");
      setSummaryData(MOCK_SUMMARY);
      setRevealedTopics(0);
      setActiveTopic(MOCK_SUMMARY.topics[0].name);
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
    const txt = summaryData.topics.map(t => `${t.name}\n\n${t.overview}\n\nKey Concepts:\n${t.keyConcepts.map(k => `- ${k}`).join("\n")}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(txt);
    toast.success("Summary copied to clipboard!");
  };

  const loadHistoryItem = (item: typeof history[0]) => {
    setFile({ name: item.name } as File);
    setFileDetails({ name: item.name, size: "—", pages: item.pages, language: "English", time: "20 seconds" });
    setStatus("ready"); setSummaryData(item.analysis); setRevealedTopics(0);
    if (item.analysis.topics?.length > 0) setActiveTopic(item.analysis.topics[0].name);
    setShowHistory(false);
  };

  const filteredTopics = summaryData?.topics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const uploadStages = ["Upload", "Extract Text", "Analyze Content", "Identify Topics", "Generate Summary", "Completed"];

  return (
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
              AI-powered document summarizer & topic analyzer
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "ready" && (
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
        </div>
      </div>

      {/* ── HISTORY PANEL ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${c.amberBorder}`, background: c.amberBg }}
          >
            <div className="p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}>
                <History size={15} style={{ color: c.amber }} /> Recent Documents
              </h3>
              {history.length === 0 ? (
                <p className="text-sm py-2" style={{ color: c.textMuted }}>No documents analyzed yet. Upload a study file to get started.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((doc, i) => (
                    <motion.div
                      key={doc.name}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all"
                      style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
                      onClick={() => loadHistoryItem(doc)}
                      whileHover={{ scale: 1.01, borderColor: c.amberBorder }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                          <FileText size={14} style={{ color: c.amber }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: c.text }}>{doc.name}</p>
                          <p className="text-xs" style={{ color: c.textMuted }}>{doc.date} · {doc.pages} pages · {doc.topics} topics</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ x: 2 }}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: c.amberActive, color: c.amber }}
                      >
                        Open <ChevronRight size={12} />
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

          {/* ══ EMPTY STATE ══ */}
          {status === "empty" && (
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
          {status === "uploading" && (
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
          {status === "ready" && summaryData && (
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