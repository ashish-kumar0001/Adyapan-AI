"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Download, CheckCircle2, Cpu, Loader2, Plus, History,
  HelpCircle, ChevronRight, Search, Copy, FileDown, Printer, FileText, Check
} from "lucide-react";
import { useSocket } from "@/context/SocketContext";

interface NoteSection {
  title: string;
  content: string;
  bulletPoints: string[];
}

export function NotesGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [notesData, setNotesData] = useState<{
    topic: string;
    sections: NoteSection[];
    wordCount: number;
    studyTime: string;
    difficulty: string;
  } | null>(null);

  const [topic, setTopic] = useState("Database Management Systems");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [noteType, setNoteType] = useState("Detailed Notes");
  const [activeSection, setActiveSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"dashboard" | "help">("dashboard");

  const { socket, isConnected } = useSocket();
  const userIdRef = useRef<string>("");

  const MOCK_NOTES = {
    topic: "Database Management Systems",
    sections: [
      {
        title: "Relational Data Model",
        content: "The relational data model represents data in the form of relations (tables). Each relation consists of rows (tuples) and columns (attributes). It is the most widely used data model in modern database management.",
        bulletPoints: [
          "Relation schema defines the table structure (attributes).",
          "Keys (Primary key, foreign key) enforce integrity bounds.",
          "Relational algebra provides select, project, join operations."
        ]
      },
      {
        title: "Normalization & Normal Forms",
        content: "Normalization is the process of organizing database fields and tables to minimize redundancy and dependency. It divides large tables into smaller ones and defines relationships between them.",
        bulletPoints: [
          "First Normal Form (1NF) ensures atomic values in attributes.",
          "Second Normal Form (2NF) removes partial dependencies.",
          "Third Normal Form (3NF) removes transitive dependencies."
        ]
      },
      {
        title: "Transaction & ACID Properties",
        content: "A transaction is a single logical unit of database processing. To ensure reliability and consistency, databases enforce the ACID rules on every transaction executed.",
        bulletPoints: [
          "Atomicity: Either the whole transaction succeeds, or none of it does.",
          "Consistency: Database transitions from one valid state to another.",
          "Isolation: Concurrent transactions run without interference.",
          "Durability: Committed data is permanently saved in the system."
        ]
      }
    ],
    wordCount: 1850,
    studyTime: "45 mins",
    difficulty: "Intermediate"
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) userIdRef.current = (JSON.parse(raw) as { id?: string })?.id ?? "";
    } catch { /* */ }
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Starting notes generator pipeline...");

    const stages = [
      { msg: "Extracting core syllabus...", prg: 20 },
      { msg: "Analyzing subject requirements...", prg: 40 },
      { msg: "Structuring chapter-wise layout...", prg: 70 },
      { msg: "Generating notes modules...", prg: 90 },
      { msg: "Complete!", prg: 100 }
    ];

    let step = 0;
    const timer = setInterval(() => {
      if (step < stages.length) {
        setStatusMsg(stages[step].msg);
        setProgress(stages[step].prg);
        step++;
      } else {
        clearInterval(timer);
        setGenerating(false);
        setNotesData(MOCK_NOTES);
        if (MOCK_NOTES.sections.length > 0) {
          setActiveSection(MOCK_NOTES.sections[0].title);
        }
      }
    }, 1000);
  };

  const handleScrollToSection = (title: string) => {
    setActiveSection(title);
    const element = document.getElementById(`section-${title.replace(/\s+/g, "-")}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const loadHistoryItem = (topicName: string) => {
    setTopic(topicName);
    setNotesData(MOCK_NOTES);
    if (MOCK_NOTES.sections.length > 0) {
      setActiveSection(MOCK_NOTES.sections[0].title);
    }
  };

  const filteredSections = notesData?.sections.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-4 p-4 antialiased text-white max-w-6xl mx-auto w-full text-xs">
      {/* SECTION 1 — HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            <BookOpen className="text-amber-500" size={20} /> Notes Generator
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-xl">
            Generate comprehensive, topic-wise study notes with AI.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setNotesData(null); setGenerating(false); }}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={16} /> Create New
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("recent-notes-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          >
            <History size={16} /> History
          </button>
          <button
            onClick={() => setActiveView(activeView === "help" ? "dashboard" : "help")}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          >
            <HelpCircle size={16} /> Help
          </button>
        </div>
      </div>

      {activeView === "help" ? (
        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl space-y-2.5">
          <h2 className="text-sm font-bold text-white">Notes Generator Help</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Define any topic or copy-paste core syllabus items. The generator partitions the topic into logical subdivisions, structures core content blocks, lists key terms, and outputs structured bullet points suitable for study revisions.
          </p>
          <button onClick={() => setActiveView("dashboard")} className="h-8 px-3 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all">
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {generating ? (
            <div className="flex flex-col items-center justify-center p-6 border border-white/5 bg-white/[0.01] rounded-xl space-y-4 max-w-xl mx-auto w-full text-center">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                <Cpu size={24} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Generating Notes via Pipeline</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{statusMsg}</p>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5 justify-center">
                <Loader2 className="animate-spin" size={12} /> {progress}% Complete
              </div>
            </div>
          ) : !notesData ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* SECTION 3 — CONFIGURATION WORKSPACE */}
              <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl max-w-2xl mx-auto w-full space-y-4">
                <h3 className="text-xs font-bold text-white">Configure Notes Outline</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Topic or Subject</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Operating Systems, Advanced Data Structures"
                      className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300">Note Type</label>
                      <select
                        value={noteType}
                        onChange={e => setNoteType(e.target.value)}
                        className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none"
                      >
                        <option>Detailed Notes</option>
                        <option>Short Revision</option>
                        <option>Formulas Only</option>
                        <option>Exam Cheat Sheet</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="h-8 flex-1 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-1"
                  >
                    <BookOpen size={16} /> Generate Notes
                  </button>
                  <button
                    onClick={() => setTopic("")}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* SECTION 4 — PRESETS SECTION */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-white">Choose from Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Exam Study Guide", desc: "Structured to highlight essential exam components, sample review formulations, and critical milestones." },
                    { title: "Key Terms & Glossaries", desc: "Filters subject files to isolate definitions, equations, algorithms, and core keywords." },
                    { title: "Interview Prep Notes", desc: "Formulates questions, brief code samples, and conceptual outlines suitable for placement audits." }
                  ].map(tpl => (
                    <div
                      key={tpl.title}
                      onClick={() => setTopic(tpl.title)}
                      className="p-4 border border-white/5 rounded-xl bg-white/[0.01] hover:bg-amber-500/[0.01] hover:border-amber-500/30 transition-all cursor-pointer space-y-1"
                    >
                      <h4 className="text-xs font-bold text-white">{tpl.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{tpl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 12 — HOW IT WORKS */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-white">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "Configure topic", desc: "Input a study module brief or syllabus guidelines, choose details level." },
                    { step: "Draft Outline", desc: "The generator designs structure partitions and details theoretical summaries." },
                    { step: "Review & Export", desc: "Open notes directly, copy sections, or download formatted study materials." }
                  ].map((item, idx) => (
                    <div key={item.step} className="p-4 border border-white/5 rounded-xl bg-white/[0.01] space-y-1">
                      <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Step 0{idx + 1}</div>
                      <h4 className="text-xs font-bold text-white">{item.step}</h4>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
              {/* LEFT SIDEBAR (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <div className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    Chapters Navigation
                  </span>
                  <div className="space-y-0.5">
                    {notesData.sections.map(s => (
                      <button
                        key={s.title}
                        onClick={() => handleScrollToSection(s.title)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          activeSection === s.title
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="truncate text-[12px]">{s.title}</span>
                        <ChevronRight size={12} className={activeSection === s.title ? "text-amber-500" : "text-gray-600"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT PANELS (6 Cols) */}
              <div className="md:col-span-6 space-y-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search notes content..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 pl-8 text-xs text-white h-9"
                    style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.08)" }}
                  />
                </div>

                <div className="space-y-4">
                  {filteredSections.map((s, idx) => (
                    <div
                      key={s.title}
                      id={`section-${s.title.replace(/\s+/g, "-")}`}
                      className="p-4 border rounded-xl bg-white/[0.01] border-white/5 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b pb-2 border-white/5">
                        <h3 className="text-xs font-extrabold text-white">{s.title}</h3>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          Section 0{idx + 1}
                        </span>
                      </div>

                      <p className="text-[12px] leading-relaxed text-gray-300">{s.content}</p>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500">
                          Syllabus Review Points
                        </span>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-[12px] text-gray-300">
                          {s.bulletPoints.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary controls footer bar */}
                <div className="p-2 border border-white/5 bg-white/[0.01] rounded-xl flex flex-wrap gap-1.5 items-center justify-between">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => alert("📋 Notes copied to clipboard.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <button
                      onClick={() => alert("📥 Notes PDF exported successfully.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FileDown size={14} /> Export PDF
                    </button>
                  </div>
                  <button
                    onClick={() => { setNotesData(null); }}
                    className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all"
                  >
                    Generate New Notes
                  </button>
                </div>
              </div>

              {/* RIGHT SIDEBAR (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <div className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    AI Notes Insights
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { label: "Main Topic", value: "DBMS" },
                      { label: "Difficulty", value: notesData.difficulty },
                      { label: "Words", value: notesData.wordCount },
                      { label: "Study Time", value: notesData.studyTime }
                    ].map(insight => (
                      <div key={insight.label} className="p-2 border border-white/5 rounded-lg bg-black/20 text-center space-y-0.5">
                        <span className="text-[10px] text-gray-400 block">{insight.label}</span>
                        <span className="text-[11px] font-bold text-white block truncate">{insight.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11 — RECENT NOTES TABLE */}
          <div id="recent-notes-section" className="space-y-2.5 pt-4 border-t border-white/5">
            <h2 className="text-sm font-bold text-white">Recent Notes</h2>
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Topic</th>
                    <th className="p-2.5">Date Created</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-center">Sections</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: "Database Management Systems", date: "Today", type: "Detailed Notes", sections: 3 },
                    { name: "Data Structures & Algorithms", date: "Yesterday", type: "Short Revision", sections: 5 },
                    { name: "Compiler Design Guide", date: "4 Jul", type: "Exam Cheat Sheet", sections: 4 }
                  ].map(note => (
                    <tr key={note.name} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-2.5 font-semibold text-white flex items-center gap-1.5 truncate max-w-[180px]">
                        <FileText size={14} className="text-amber-500 shrink-0" /> {note.name}
                      </td>
                      <td className="p-2.5 text-gray-400">{note.date}</td>
                      <td className="p-2.5 text-gray-300 font-medium">{note.type}</td>
                      <td className="p-2.5 text-center text-gray-300 font-medium">{note.sections}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => loadHistoryItem(note.name)}
                          className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-black font-extrabold text-[11px] transition-all"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
