"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Sparkles, Copy, Download, Printer, Share2,
  RefreshCw, Search, CheckCircle2, ChevronRight, BookOpen, AlertCircle,
  FileDown, Layers, HelpCircle, GraduationCap
} from "lucide-react";

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

export function StudyAssistantView() {
  // File states
  const [file, setFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    pages: number;
    language: string;
    time: string;
  } | null>(null);

  // Status & Simulation
  const [status, setStatus] = useState<"empty" | "uploading" | "processing" | "ready">("empty");
  const [currentStage, setCurrentStage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("");

  // AI Summary outputs
  const [summaryData, setSummaryData] = useState<{
    title: string;
    topics: TopicSummary[];
    stats: DocStats;
    insights: AIInsights;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const c = {
    inputBg: "rgba(0,0,0,0.4)",
    border: "rgba(255,255,255,0.08)",
  };

  // MOCK SUMMARY SEED DATA
  const MOCK_SUMMARY = {
    title: "Operating Systems Notes",
    topics: [
      {
        name: "Introduction to OS",
        overview: "An Operating System (OS) is an intermediary between a user of a computer and the computer hardware. The purpose of an OS is to provide an environment in which a user can execute programs in a convenient and efficient manner.",
        keyConcepts: [
          "Convenience & Efficiency",
          "Hardware Abstraction Layer",
          "Resource Allocator",
          "Kernel vs Systems Programs"
        ],
        importantPoints: [
          "The main goal is convenience; the secondary goal is resource efficiency.",
          "Kernel is the one program running at all times on the computer.",
          "Bootstrap program initializes the system at power-on."
        ],
        quickRevision: "The OS manages hardware, handles security access, regulates software executions, and allocates system resources efficiently. Convenience and efficiency are its two main target design goals.",
        keywords: ["Kernel", "Bootstrap", "Resource Allocator", "System Program"]
      },
      {
        name: "Process Management",
        overview: "A program in execution is called a process. A process needs resources like CPU time, memory, files, and I/O devices to accomplish its task. The OS handles creation, scheduling, and synchronization of processes.",
        keyConcepts: [
          "Process Control Block (PCB)",
          "Process States (Ready, Running, Blocked)",
          "Context Switching",
          "Inter-Process Communication (IPC)"
        ],
        importantPoints: [
          "PCB stores CPU registers, state, program counter, and scheduling info.",
          "Context switching is pure overhead during CPU context saves and restores.",
          "Shared memory and message passing are the two primary IPC models."
        ],
        quickRevision: "Process states change from new, ready, running, waiting, to terminated. The scheduler selects ready processes for execution. Context switches save states to PCBs and load new states.",
        keywords: ["PCB", "Context Switch", "IPC", "Process State", "Scheduler"]
      },
      {
        name: "Memory Management",
        overview: "Memory management optimizes CPU utilization by keeping multiple processes in memory. It tracks every byte of memory, allocating it to active processes and reclaiming it when they terminate.",
        keyConcepts: [
          "Paging & Segmentation",
          "Address Translation (Logical vs Physical)",
          "Translation Lookaside Buffer (TLB)",
          "Fragmentation (Internal vs External)"
        ],
        importantPoints: [
          "Paging divides physical memory into fixed-sized frames and logical memory into pages.",
          "TLB is a fast hardware cache that speeds up logical-to-physical address mapping.",
          "External fragmentation is solved by compaction or paging techniques."
        ],
        quickRevision: "Memory is allocated in frames and pages to avoid external fragmentation. TLBs speed up lookup. Page tables manage logical-to-physical maps. Internal fragmentation remains in allocated pages.",
        keywords: ["Paging", "Segmentation", "TLB", "Page Fault", "Virtual Memory"]
      },
      {
        name: "Virtual Memory",
        overview: "Virtual Memory separates logical user memory from physical memory. This allows programs to run even if they are larger than the computer's physical RAM, using disk space as a fallback mapping.",
        keyConcepts: [
          "Demand Paging",
          "Page Replacement Algorithms (FIFO, LRU, Optimal)",
          "Thrashing & Working Set Model",
          "Copy-on-Write"
        ],
        importantPoints: [
          "Demand paging loads pages into memory only when they are referenced.",
          "Page replacement happens when a page fault occurs and RAM is full.",
          "Thrashing happens when a process spends more time paging than executing."
        ],
        quickRevision: "Demand paging loads pages on demand. LRU and Optimal algorithms resolve page replacement. Over-allocating memory leads to thrashing, which is managed via working set limit controls.",
        keywords: ["Demand Paging", "LRU", "Thrashing", "Page Replacement", "Working Set"]
      }
    ],
    stats: {
      pages: 125,
      words: 24500,
      topicsFound: 4,
      readingTime: "82 mins",
      summaryLength: "1,200 words"
    },
    insights: {
      mainSubject: "Computer Science - Operating Systems",
      difficultyLevel: "Intermediate to Advanced",
      estimatedStudyTime: "3.5 Hours",
      importantChapters: ["Process Management", "Memory Management", "Virtual Memory"],
      repeatedTopics: ["Context Switching", "Paging vs Segmentation", "Page Replacement Algorithms"]
    }
  };

  // Simulate file drop & extraction
  const handleFileDrop = (droppedFile: File) => {
    setFile(droppedFile);
    setFileDetails({
      name: droppedFile.name,
      size: (droppedFile.size / (1024 * 1024)).toFixed(1) + " MB",
      pages: Math.floor(Math.random() * 80) + 15,
      language: "English",
      time: "20 seconds"
    });
    setStatus("uploading");
  };

  useEffect(() => {
    if (status !== "uploading") return;

    const stages = [
      "Uploading...",
      "Extracting Text...",
      "Analyzing Topics...",
      "Generating Summary...",
      "Completed"
    ];

    let currentIdx = 0;
    setCurrentStage(stages[0]);

    const timer = setInterval(() => {
      currentIdx += 1;
      if (currentIdx < stages.length) {
        setCurrentStage(stages[currentIdx]);
      } else {
        clearInterval(timer);
        setStatus("ready");
        setSummaryData(MOCK_SUMMARY);
        if (MOCK_SUMMARY.topics.length > 0) {
          setActiveTopic(MOCK_SUMMARY.topics[0].name);
        }
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [status]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileDrop(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileDrop(e.target.files[0]);
    }
  };

  const handleScrollToTopic = (topicName: string) => {
    setActiveTopic(topicName);
    const element = document.getElementById(`topic-${topicName.replace(/\s+/g, "-")}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCopySummary = () => {
    if (!summaryData) return;
    const txt = summaryData.topics
      .map(t => `${t.name}\n\n${t.overview}\n\nKey Concepts:\n${t.keyConcepts.map(c => `- ${c}`).join("\n")}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(txt);
    alert("📋 Summary copied to clipboard successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter topics based on search
  const filteredTopics = summaryData?.topics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] antialiased text-white">
      {/* 1. PAGE HEADER */}
      <div className="mb-6 shrink-0 border-b pb-4 border-white/5">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="text-amber-500" size={20} /> AI Study Assistant
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Upload your study materials and get structured, topic-wise summaries in seconds.
        </p>
      </div>

      {/* 2. BODY CONTENT - CONDITIONAL GRID */}
      {status === "empty" && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 max-w-xl mx-auto w-full">
          {/* Drag & Drop Container */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full border-2 border-dashed border-white/10 hover:border-amber-500/50 rounded-2xl p-10 text-center transition-all bg-white/[0.01] hover:bg-amber-500/[0.01] cursor-pointer group"
            onClick={handleBrowseFiles}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-colors">
              <Upload className="text-gray-400 group-hover:text-amber-500 transition-colors" size={22} />
            </div>
            <p className="text-sm font-semibold text-white">Drag & Drop your files here</p>
            <p className="text-xs text-gray-400 my-1.5">or</p>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              Browse Files
            </button>
          </div>

          {/* Supported Formats */}
          <div className="mt-8 w-full border border-white/5 rounded-xl p-4 bg-white/[0.01] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
              <Layers size={14} className="text-amber-500" /> Supported Formats
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["PDF (.pdf)", "Word (.doc, .docx)", "PowerPoint (.ppt, .pptx)", "Text (.txt)", "Markdown (.md)", "Rich Text (.rtf)"].map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400 font-medium">
                  {f}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1.5 border-t border-white/5">
              <AlertCircle size={10} className="text-amber-500/80" /> Max file size: 25MB · Page extraction limit: 200 pages
            </div>
          </div>
        </div>
      )}

      {status === "uploading" && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 max-w-md mx-auto w-full">
          <div className="w-full border border-white/5 bg-white/[0.01] rounded-2xl p-6 text-center space-y-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="text-amber-500 animate-spin" size={32} />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-white">{currentStage}</p>
              <p className="text-xs text-amber-500 font-bold">Please keep this tab open</p>
            </div>

            {/* Simulated progress indicators */}
            <div className="space-y-2.5 text-left text-xs border-t border-white/5 pt-4">
              {[
                { name: "Uploading", isDone: currentStage !== "Uploading" },
                { name: "Extracting Text", isDone: currentStage !== "Uploading" && currentStage !== "Extracting Text" },
                { name: "Analyzing Topics", isDone: currentStage === "Generating Summary" || currentStage === "Completed" },
                { name: "Generating Summary", isDone: currentStage === "Completed" }
              ].map(stage => (
                <div key={stage.name} className="flex items-center justify-between text-gray-400">
                  <span>{stage.name}</span>
                  {stage.isDone ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {fileDetails && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left space-y-1.5 text-xs text-gray-300">
                <div className="font-semibold text-white truncate">{fileDetails.name}</div>
                <div className="grid grid-cols-2 gap-2 text-gray-400 text-[10px]">
                  <div>Size: {fileDetails.size}</div>
                  <div>Pages: {fileDetails.pages}</div>
                  <div>Lang: {fileDetails.language}</div>
                  <div>Est. Time: {fileDetails.time}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {status === "ready" && summaryData && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          {/* A. LEFT SIDEBAR: TOPIC NAVIGATION */}
          <div className="w-full md:w-56 shrink-0 border border-white/5 rounded-2xl p-4 bg-white/[0.01] flex flex-col max-h-[500px] md:max-h-none overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-3 block">
              Topic Outline
            </div>
            <div className="space-y-1">
              {summaryData.topics.map(t => (
                <button
                  key={t.name}
                  onClick={() => handleScrollToTopic(t.name)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeTopic === t.name
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  <ChevronRight size={10} className={activeTopic === t.name ? "text-amber-500" : "text-gray-600"} />
                </button>
              ))}
            </div>
          </div>

          {/* B. MIDDLE PANE: MAIN SUMMARY WINDOW */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <div
              className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {filteredTopics.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 italic">
                  No matching topics found in current search query.
                </div>
              ) : (
                filteredTopics.map((t, idx) => (
                  <div
                    key={t.name}
                    id={`topic-${t.name.replace(/\s+/g, "-")}`}
                    className="p-6 border rounded-2xl bg-white/[0.01] border-white/5 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-3 border-white/5">
                      <h3 className="text-sm font-extrabold text-white">{t.name}</h3>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        Module 0{idx + 1}
                      </span>
                    </div>

                    {/* 1. Overview */}
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500/95">
                        Overview
                      </span>
                      <p className="text-xs leading-relaxed text-gray-300">{t.overview}</p>
                    </div>

                    {/* Grid split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 2. Key Concepts */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">
                          Key Concepts
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                          {t.keyConcepts.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Important Points */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">
                          Important Points
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                          {t.importantPoints.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 4. Quick Revision */}
                    <div className="p-3 bg-amber-500/[0.03] border border-amber-500/10 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500">
                        Quick Revision
                      </span>
                      <p className="text-xs leading-relaxed text-gray-300 italic">
                        "{t.quickRevision}"
                      </p>
                    </div>

                    {/* 5. Keywords */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">
                        Keywords
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.keywords.map(kw => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-gray-400"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary controls footer bar */}
            <div className="p-3 border border-white/5 bg-white/[0.01] rounded-2xl flex flex-wrap gap-2 items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleCopySummary}
                  className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy size={12} /> Copy Summary
                </button>
                <button
                  onClick={() => alert("📥 Downloaded Summary (PDF) successfully.")}
                  className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileDown size={12} /> Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={12} /> Print
                </button>
              </div>

              <button
                onClick={() => {
                  setStatus("uploading");
                }}
                className="py-1.5 px-3 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors"
              >
                Regenerate Summary
              </button>
            </div>
          </div>

          {/* C. RIGHT SIDEBAR: DOCUMENT STATISTICS & INSIGHTS */}
          <div className="w-full md:w-60 shrink-0 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Search size={12} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search summaries..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 pl-7.5 text-xs text-white"
                style={{ background: c.inputBg, borderColor: c.border }}
              />
            </div>

            {/* Statistics */}
            <div className="p-4 border border-white/5 rounded-2xl bg-white/[0.01] space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                Document Statistics
              </span>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: "Pages Detected", val: summaryData.stats.pages },
                  { label: "Word Count", val: summaryData.stats.words.toLocaleString() },
                  { label: "Topics Found", val: summaryData.stats.topicsFound },
                  { label: "Reading Time", val: summaryData.stats.readingTime },
                  { label: "Summary Length", val: summaryData.stats.summaryLength }
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center py-1 border-b border-white/[0.03]">
                    <span className="text-gray-400 text-[10px]">{stat.label}</span>
                    <span className="font-extrabold text-white">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="p-4 border border-white/5 rounded-2xl bg-white/[0.01] space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                AI Subject Insights
              </span>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold block mb-1">
                    Main Subject
                  </span>
                  <span className="font-extrabold text-white text-[11px] block">{summaryData.insights.mainSubject}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold block mb-1">
                    Difficulty Level
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {summaryData.insights.difficultyLevel}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold block mb-1">
                    Estimated Study Time
                  </span>
                  <span className="font-bold text-white block">{summaryData.insights.estimatedStudyTime}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold block mb-1">
                    Important Chapters
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {summaryData.insights.importantChapters.map(ch => (
                      <span key={ch} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-gray-400 font-semibold">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
