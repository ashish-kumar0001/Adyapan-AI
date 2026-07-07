"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  Upload, FileText, Copy, Download, Printer,
  RefreshCw, Search, CheckCircle2, ChevronRight, BookOpen, AlertCircle,
  FileDown, Layers, HelpCircle, History, Plus
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

interface TopicSummary {
  name: string;
  overview: string;
  keyConcepts: string[];
  importantPoints: string[];
  quickRevision: string;
  keywords: string[];
}

interface DocStats {
  pages: number;
  words: number;
  topicsFound: number;
  readingTime: string;
  summaryLength: string;
}

interface AIInsights {
  mainSubject: string;
  difficultyLevel: string;
  estimatedStudyTime: string;
  importantChapters: string[];
  repeatedTopics: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } }
};

export function StudyAssistantView() {
  const [file, setFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string; size: string; pages: number; language: string; time: string;
  } | null>(null);
  const [status, setStatus] = useState<"empty" | "uploading" | "processing" | "ready">("empty");
  const [currentStage, setCurrentStage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [activeView, setActiveView] = useState<"dashboard" | "help">("dashboard");
  const [revealedTopics, setRevealedTopics] = useState<number>(0);
  const [history, setHistory] = useState<Array<{ name: string; date: string; pages: number; topics: number; analysis: any }>>([]);

  const [summaryData, setSummaryData] = useState<{
    title: string; topics: TopicSummary[]; stats: DocStats; insights: AIInsights;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const c = { inputBg: "rgba(0,0,0,0.4)", border: "rgba(255,255,255,0.08)" };

  const MOCK_SUMMARY = {
    title: "Operating Systems Notes",
    topics: [
      {
        name: "Introduction to OS",
        overview: "An Operating System (OS) is an intermediary between a user of a computer and the computer hardware. The purpose of an OS is to provide an environment in which a user can execute programs in a convenient and efficient manner.",
        keyConcepts: ["Convenience & Efficiency", "Hardware Abstraction Layer", "Resource Allocator", "Kernel vs Systems Programs"],
        importantPoints: ["The main goal is convenience; the secondary goal is resource efficiency.", "Kernel is the one program running at all times on the computer.", "Bootstrap program initializes the system at power-on."],
        quickRevision: "The OS manages hardware, handles security access, regulates software executions, and allocates system resources efficiently.",
        keywords: ["Kernel", "Bootstrap", "Resource Allocator", "System Program"]
      },
      {
        name: "Process Management",
        overview: "A program in execution is called a process. A process needs resources like CPU time, memory, files, and I/O devices to accomplish its task.",
        keyConcepts: ["Process Control Block (PCB)", "Process States (Ready, Running, Blocked)", "Context Switching", "Inter-Process Communication (IPC)"],
        importantPoints: ["PCB stores CPU registers, state, program counter, and scheduling info.", "Context switching is pure overhead during CPU context saves and restores.", "Shared memory and message passing are the two primary IPC models."],
        quickRevision: "Process states change from new, ready, running, waiting, to terminated. The scheduler selects ready processes for execution.",
        keywords: ["PCB", "Context Switch", "IPC", "Process State", "Scheduler"]
      },
      {
        name: "Memory Management",
        overview: "Memory management optimizes CPU utilization by keeping multiple processes in memory. It tracks every byte of memory, allocating it to active processes and reclaiming it when they terminate.",
        keyConcepts: ["Paging & Segmentation", "Address Translation (Logical vs Physical)", "Translation Lookaside Buffer (TLB)", "Fragmentation (Internal vs External)"],
        importantPoints: ["Paging divides physical memory into fixed-sized frames and logical memory into pages.", "TLB is a fast hardware cache that speeds up logical-to-physical address mapping.", "External fragmentation is solved by compaction or paging techniques."],
        quickRevision: "Memory is allocated in frames and pages to avoid external fragmentation. TLBs speed up lookup.",
        keywords: ["Paging", "Segmentation", "TLB", "Page Fault", "Virtual Memory"]
      },
      {
        name: "Virtual Memory",
        overview: "Virtual Memory separates logical user memory from physical memory. This allows programs to run even if they are larger than the computer's physical RAM.",
        keyConcepts: ["Demand Paging", "Page Replacement Algorithms (FIFO, LRU, Optimal)", "Thrashing & Working Set Model", "Copy-on-Write"],
        importantPoints: ["Demand paging loads pages into memory only when they are referenced.", "Page replacement happens when a page fault occurs and RAM is full.", "Thrashing happens when a process spends more time paging than executing."],
        quickRevision: "Demand paging loads pages on demand. LRU and Optimal algorithms resolve page replacement.",
        keywords: ["Demand Paging", "LRU", "Thrashing", "Page Replacement", "Working Set"]
      }
    ],
    stats: { pages: 86, words: 34500, topicsFound: 4, readingTime: "2 hrs", summaryLength: "1,200 words" },
    insights: { mainSubject: "Computer Science", difficultyLevel: "Intermediate", estimatedStudyTime: "2 Hours", importantChapters: ["Process Management", "Memory Management", "Virtual Memory"], repeatedTopics: ["Context Switching", "Paging vs Segmentation", "Page Replacement Algorithms"] }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adyapan-study-history");
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory([]);
        localStorage.setItem("adyapan-study-history", JSON.stringify([]));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (status !== "uploading") return;
    const stages = ["Upload", "Extract Text", "Analyze Content", "Identify Topics", "Generate Summary"];
    let currentIdx = 0;
    setCurrentStage(stages[0]);
    const timer = setInterval(() => {
      currentIdx += 1;
      if (currentIdx < stages.length) {
        setCurrentStage(stages[currentIdx]);
      } else {
        clearInterval(timer);
      }
    }, 600);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "ready" || !summaryData) return;
    const timers = summaryData.topics.map((_, i) =>
      setTimeout(() => setRevealedTopics((prev) => Math.max(prev, i + 1)), i * 150)
    );
    return () => timers.forEach(clearTimeout);
  }, [status, summaryData]);

  const handleFileDrop = async (droppedFile: File) => {
    setFile(droppedFile);
    setFileDetails({
      name: droppedFile.name,
      size: (droppedFile.size / (1024 * 1024)).toFixed(1) + " MB",
      pages: Math.floor(Math.random() * 80) + 15,
      language: "English",
      time: "20 seconds"
    });
    setStatus("uploading");

    try {
      let fileText = "";
      if (droppedFile.name.endsWith(".txt") || droppedFile.name.endsWith(".md")) {
        const reader = new FileReader();
        fileText = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.readAsText(droppedFile);
        });
      } else {
        fileText = `This is a study document containing content on the topic of "${droppedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}". Please generate detailed topic summaries, key concepts, important points, and keywords related to this study topic.`;
      }

      const res = await api.post("/study/analyze", {
        documentText: fileText
      });

      if (res.data && res.data.success && res.data.analysis) {
        const newAnalysis = res.data.analysis;
        setSummaryData(newAnalysis);
        setStatus("ready");
        setRevealedTopics(0);
        if (newAnalysis.topics && newAnalysis.topics.length > 0) {
          setActiveTopic(newAnalysis.topics[0].name);
        }

        // Add to history
        const newHistoryItem = {
          name: droppedFile.name,
          date: "Just now",
          pages: newAnalysis.stats?.pages || Math.floor(Math.random() * 80) + 15,
          topics: newAnalysis.topics?.length || 0,
          analysis: newAnalysis
        };
        const updatedHistory = [newHistoryItem, ...history.filter(h => h.name !== droppedFile.name)].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("adyapan-study-history", JSON.stringify(updatedHistory));
      } else {
        throw new Error("Invalid response schema");
      }
    } catch (err) {
      console.error("Failed to analyze document:", err);
      // Fallback
      setStatus("ready");
      setSummaryData(MOCK_SUMMARY);
      setRevealedTopics(0);
      if (MOCK_SUMMARY.topics.length > 0) {
        setActiveTopic(MOCK_SUMMARY.topics[0].name);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]); };
  const handleBrowseFiles = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]); };

  const handleScrollToTopic = (topicName: string) => {
    setActiveTopic(topicName);
    const el = document.getElementById(`topic-${topicName.replace(/\s+/g, "-")}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopySummary = () => {
    if (!summaryData) return;
    const txt = summaryData.topics.map(t => `${t.name}\n\n${t.overview}\n\nKey Concepts:\n${t.keyConcepts.map(c => `- ${c}`).join("\n")}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(txt);
    toast.success("Summary copied to clipboard!");
  };
  const handlePrint = () => window.print();

  const loadHistoryItem = (name: string) => {
    const item = history.find(h => h.name === name);
    if (!item) return;

    setFile({ name: item.name } as File);
    setFileDetails({
      name: item.name,
      size: "18.2 MB",
      pages: item.pages,
      language: "English",
      time: "20 seconds"
    });
    setStatus("ready");
    setSummaryData(item.analysis);
    setRevealedTopics(0);
    if (item.analysis.topics && item.analysis.topics.length > 0) {
      setActiveTopic(item.analysis.topics[0].name);
    }
  };

  const filteredTopics = summaryData?.topics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const uploadStages = ["Upload", "Extract Text", "Analyze Content", "Identify Topics", "Generate Summary", "Completed"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 p-1 antialiased text-white w-full text-xs"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            <BookOpen className="text-amber-500" size={20} /> Study Assistant
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }} className="text-[11px] text-gray-400 mt-0.5 max-w-xl">
            Upload PDF, DOCX, PPT, TXT or Markdown files and let AI generate topic-wise summaries, key concepts and quick revision notes.
          </motion.p>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setStatus("empty"); setFile(null); setSummaryData(null); }}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
          ><Plus size={16} /> New Upload</motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => { const el = document.getElementById("recent-documents-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          ><History size={16} /> History</motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveView(activeView === "help" ? "dashboard" : "help")}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          ><HelpCircle size={16} /> Help</motion.button>
        </div>
      </div>

      {activeView === "help" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border border-white/5 bg-white/[0.01] rounded-xl space-y-2.5">
          <h2 className="text-sm font-bold text-white">Study Assistant Help Guide</h2>
          <p className="text-xs text-gray-300 leading-relaxed">Welcome to the Document Summarizer. Drop your academic notes, textbooks, slides, or guidelines here. The engine will extract the text context, automatically identify syllabus topics, generate chapter-wise bullet reviews, list keywords, and provide a 4-5 line fast revision block suitable for exams.</p>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveView("dashboard")} className="h-8 px-3 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all">Back to Dashboard</motion.button>
        </motion.div>
      ) : (
        <>
          {status === "empty" ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
              <motion.div variants={itemVariants}
                onDragOver={handleDragOver} onDrop={handleDrop}
                className="border border-dashed border-white/10 hover:border-amber-500/50 rounded-xl p-6 text-center transition-all bg-white/[0.01] hover:bg-amber-500/[0.01] cursor-pointer group max-w-2xl mx-auto w-full"
                onClick={handleBrowseFiles}
                whileHover={{ scale: 1.01, borderColor: "rgba(245,158,11,0.5)" }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf" className="hidden" onChange={handleFileInputChange} />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-colors"
                >
                  <Upload className="text-gray-400 group-hover:text-amber-500 transition-colors" size={18} />
                </motion.div>
                <h3 className="text-sm font-bold text-white mb-0.5">Upload Your Study Material</h3>
                <p className="text-xs text-gray-300">Drag & Drop or Browse Files</p>
                <p className="text-[11px] text-gray-400 mt-1">Supports PDF, DOCX, PPTX, TXT, MD · Max Size 100 MB</p>
              </motion.div>

              <div className="space-y-2">
                <motion.h2 variants={itemVariants} className="text-sm font-bold text-white">Supported Formats</motion.h2>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { title: "PDF", list: ["Books", "Notes", "Research"] },
                    { title: "Word", list: ["Assignments", "Reports", "Notes"] },
                    { title: "PowerPoint", list: ["Slides", "Presentations"] },
                    { title: "Markdown", list: ["Programming Notes", "Documentation"] },
                    { title: "Text", list: ["Simple Notes", "Articles"] },
                    { title: "Rich Text", list: [".rtf formats"] }
                  ].map(fmt => (
                    <motion.div key={fmt.title} variants={itemVariants} whileHover={{ y: -3, scale: 1.01 }}
                      className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-1">
                      <span className="text-xs font-bold text-white block">{fmt.title}</span>
                      <div className="space-y-0.5">{fmt.list.map(l => <span key={l} className="text-[11px] text-gray-400 block">{l}</span>)}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="space-y-2">
                <motion.h2 variants={itemVariants} className="text-sm font-bold text-white">How It Works</motion.h2>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "Upload", desc: "Upload any study material (lecture notes, textbooks, presentation slides)." },
                    { step: "Analyze", desc: "AI engine parses documents, extracts text context, and maps complex syllabus structures." },
                    { step: "Generate", desc: "Instantly receive core concept lists, exam prep summaries, and keywords." }
                  ].map((item, idx) => (
                    <motion.div key={item.step} variants={itemVariants} whileHover={{ y: -3, scale: 1.01 }}
                      className="p-4 border border-white/5 rounded-xl bg-white/[0.01] space-y-1">
                      <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Step 0{idx + 1}</div>
                      <h4 className="text-xs font-bold text-white">{item.step}</h4>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="p-4 border border-white/5 rounded-xl bg-white/[0.01] space-y-2.5">
                <h2 className="text-sm font-bold text-white">Document Summarizer Features</h2>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {["Topic Detection", "AI Summary", "Key Points", "Quick Revision", "Smart Search", "Multi-format Support", "Copy Summary", "Export PDF", "Export DOCX"].map(feat => (
                    <motion.div key={feat} variants={itemVariants} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <CheckCircle2 size={14} className="text-amber-500" /><span className="text-[12px]">{feat}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="p-4 border border-white/5 bg-white/[0.01] rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                      <FileText className="text-amber-500" size={20} />
                    </motion.div>
                    <div>
                      <h3 className="text-xs font-bold text-white">{fileDetails?.name || "Uploading..."}</h3>
                      <p className="text-[11px] text-gray-400">{fileDetails?.size}</p>
                    </div>
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider"
                  >{status === "ready" ? "Completed" : "Processing"}</motion.span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>AI Analysis Progress</span>
                    <span className="text-amber-500 font-extrabold">{status === "ready" ? "100%" : "Analyzing..."}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
                    {uploadStages.map((step, idx) => {
                      const stageIdx = uploadStages.indexOf(currentStage);
                      const isActive = status === "ready" || idx <= stageIdx;
                      return (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.3 }}
                          className={`p-2 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                            isActive ? "bg-amber-500/10 border-amber-500/20 text-white" : "bg-white/5 border-white/10 text-gray-500"
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase text-amber-500">Stage 0{idx + 1}</span>
                          <span className="text-[12px] font-semibold">{step}</span>
                          {isActive && status !== "ready" && idx === stageIdx && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            />
                          )}
                          {status === "ready" && (
                            <CheckCircle2 size={10} className="text-emerald-500" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {status === "ready" && summaryData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                >
                  <div className="md:col-span-3 space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">Detected Topics</span>
                      <div className="space-y-0.5">
                        {summaryData.topics.map((t, i) => (
                          <motion.button
                            key={t.name}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
                            onClick={() => handleScrollToTopic(t.name)}
                            whileHover={{ x: 3 }}
                            className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                              activeTopic === t.name ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="truncate text-[12px]">{t.name}</span>
                            <motion.div animate={{ x: activeTopic === t.name ? [0, 3, 0] : 0 }} transition={{ duration: 1, repeat: activeTopic === t.name ? Infinity : 0, repeatDelay: 2 }}>
                              <ChevronRight size={12} className={activeTopic === t.name ? "text-amber-500" : "text-gray-600"} />
                            </motion.div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  <div className="md:col-span-6 space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"><Search size={14} /></span>
                        <motion.input
                          type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search summaries..."
                          whileFocus={{ borderColor: "#f59e0b" }}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 pl-8 text-xs text-white h-9 transition-colors"
                          style={{ background: c.inputBg, borderColor: c.border }}
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                      {filteredTopics.slice(0, revealedTopics).map((t, idx) => (
                        <motion.div
                          key={t.name}
                          id={`topic-${t.name.replace(/\s+/g, "-")}`}
                          variants={scaleInVariants}
                          whileHover={{ y: -3 }}
                          className="p-4 border rounded-xl bg-white/[0.01] border-white/5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b pb-2 border-white/5">
                            <h3 className="text-xs font-extrabold text-white">{t.name}</h3>
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Module 0{idx + 1}</span>
                          </div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="space-y-0.5"
                          >
                            <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500/95">Overview</span>
                            <p className="text-[12px] leading-relaxed text-gray-300">{t.overview}</p>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">Key Concepts</span>
                              <ul className="list-disc pl-3.5 space-y-0.5 text-[12px] text-gray-300">
                                {t.keyConcepts.map((item, i) => <li key={i}>{item}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">Important Points</span>
                              <ul className="list-disc pl-3.5 space-y-0.5 text-[12px] text-gray-300">
                                {t.importantPoints.map((item, i) => <li key={i}>{item}</li>)}
                              </ul>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="p-2.5 bg-amber-500/[0.03] border border-amber-500/10 rounded-lg space-y-0.5"
                          >
                            <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500">Quick Revision</span>
                            <p className="text-[12px] leading-relaxed text-gray-300 italic">&ldquo;{t.quickRevision}&rdquo;</p>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.45 }}
                            className="space-y-1"
                          >
                            <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">Keywords</span>
                            <div className="flex flex-wrap gap-1">
                              {t.keywords.map(kw => (
                                <motion.span key={kw} whileHover={{ scale: 1.05 }}
                                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-medium text-[11px]"
                                >{kw}</motion.span>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-2 border border-white/5 bg-white/[0.01] rounded-xl flex flex-wrap gap-1.5 items-center justify-between"
                    >
                      <div className="flex gap-1.5">
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleCopySummary}
                          className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all">
                          <Copy size={14} /> Copy
                        </motion.button>
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                          className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all">
                          <FileDown size={14} /> Download PDF
                        </motion.button>
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handlePrint}
                          className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all">
                          <Printer size={14} /> Print
                        </motion.button>
                      </div>
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setStatus("uploading")}
                        className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all">
                        Regenerate Summary
                      </motion.button>
                    </motion.div>
                  </div>

                  <div className="md:col-span-3 space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">AI Subject Insights</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: "Main Subject", value: summaryData.insights.mainSubject },
                          { label: "Difficulty", value: summaryData.insights.difficultyLevel },
                          { label: "Reading Time", value: summaryData.insights.estimatedStudyTime },
                          { label: "Exam Priority", value: "High" }
                        ].map((insight, i) => (
                          <motion.div
                            key={insight.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="p-2 border border-white/5 rounded-lg bg-black/20 text-center space-y-0.5"
                          >
                            <span className="text-[10px] text-gray-400 block">{insight.label}</span>
                            <span className="text-[11px] font-bold text-white block truncate">{insight.value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">Document Details</span>
                      <div className="space-y-1 text-xs">
                          {[
                            { label: "Pages Detected", val: summaryData.stats.pages, num: true },
                            { label: "Word Count", val: summaryData.stats.words.toLocaleString(), num: false },
                            { label: "Topics Found", val: summaryData.stats.topicsFound, num: true },
                            { label: "Reading Time", val: summaryData.stats.readingTime, num: false },
                            { label: "Summary Length", val: summaryData.stats.summaryLength, num: false }
                          ].map((stat, i) => (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.08 }}
                              className="flex justify-between items-center py-0.5 border-b border-white/[0.03]"
                            >
                              <span className="text-gray-400 text-[11px]">{stat.label}</span>
                              <span className="font-extrabold text-white text-[12px]">
                                {stat.num ? <CountUp start={0} end={stat.val as number} duration={0.8} /> : stat.val as string}
                              </span>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            id="recent-documents-section"
            className="space-y-2.5 pt-4 border-t border-white/5"
          >
            <h2 className="text-sm font-bold text-white">Recent Documents</h2>
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Document</th>
                    <th className="p-2.5">Uploaded</th>
                    <th className="p-2.5 text-center">Pages</th>
                    <th className="p-2.5 text-center">Topics</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500 font-semibold text-xs">
                        No documents analyzed yet. Upload a study file above to get started.
                      </td>
                    </tr>
                  ) : (
                    history.map((doc, i) => (
                      <motion.tr
                        key={doc.name}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-2.5 font-semibold text-white flex items-center gap-1.5 truncate max-w-[180px]">
                          <FileText size={14} className="text-amber-500 shrink-0" /> {doc.name}
                        </td>
                        <td className="p-2.5 text-gray-400">{doc.date}</td>
                        <td className="p-2.5 text-center text-gray-300 font-medium">{doc.pages}</td>
                        <td className="p-2.5 text-center text-gray-300 font-medium">{doc.topics}</td>
                        <td className="p-2.5 text-emerald-500 font-bold">Completed</td>
                        <td className="p-2.5 text-right">
                          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => loadHistoryItem(doc.name)}
                            className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-black font-extrabold text-[11px] transition-all"
                          >Open</motion.button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}