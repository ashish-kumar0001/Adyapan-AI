"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, Download, Copy, Loader2, RefreshCw, CheckCircle2,
  Plus, History, HelpCircle, ChevronRight, Search, FileText, Cpu, FileDown, Printer
} from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";

interface AssignmentContent {
  introduction: string;
  body: string;
  conclusion: string;
  references: string[];
}

export function AssignmentGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [topic, setTopic] = useState("Quantum Computing & Cryptography");
  const [level, setLevel] = useState("Undergraduate");
  const [wordCount, setWordCount] = useState("1000 words");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeView, setActiveView] = useState<"dashboard" | "help">("dashboard");
  const [activeSection, setActiveSection] = useState("Introduction");

  const { socket, isConnected } = useSocket();
  const userIdRef = useRef<string>("");

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

  const MOCK_ASSIGNMENT = {
    introduction: "Quantum computing introduces a paradigm shift in processing power, leveraging superposition and entanglement to execute operations far beyond classical limitations. However, this advancement poses a direct threat to existing cryptographic standards, specifically public-key infrastructures such as RSA.",
    body: "Shor's algorithm, executable on a sufficiently large quantum computer, can solve prime factorization in polynomial time. Consequently, this compromises standard encryption techniques that rely on the computational difficulty of factoring large integers. Research into post-quantum cryptography (PQC) focuses on lattice-based cryptography, multivariate equations, and code-based cryptosystems to withstand quantum-level audits.",
    conclusion: "In conclusion, the advent of quantum processing necessitates a rapid transition to quantum-safe standards. Developing and implementing new protocols will protect critical infrastructures against future quantum adversaries.",
    references: [
      "Shor, P. W. (1994). Algorithms for quantum computation: discrete logarithms and factoring.",
      "NIST. (2022). Post-Quantum Cryptography Standardization Report."
    ]
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) userIdRef.current = (JSON.parse(raw) as { id?: string })?.id ?? "";
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleProgress = ({ progress: p, statusMessage }: { progress: number; statusMessage: string }) => {
      setProgress(p);
      setStatusMsg(statusMessage);
    };

    const handleComplete = ({ assignment }: { assignment: AssignmentContent }) => {
      setGenerating(false);
      const text = `# ${topic}\n\n## Introduction\n${assignment.introduction}\n\n## Main Body\n${assignment.body}\n\n## Conclusion\n${assignment.conclusion}\n\n## References\n${assignment.references.map(r => `- ${r}`).join("\n")}`;
      setResult(text);
      setActiveSection("Introduction");
    };

    const handleError = ({ error }: { error: string }) => {
      setGenerating(false);
      toast.error(`Generation error: ${error}`);
    };

    socket.on("generate:progress", handleProgress);
    socket.on("generate:complete", handleComplete);
    socket.on("generate:error", handleError);

    return () => {
      socket.off("generate:progress", handleProgress);
      socket.off("generate:complete", handleComplete);
      socket.off("generate:error", handleError);
    };
  }, [socket, topic, level, wordCount]);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Initializing Assignment Generator...");

    if (socket && isConnected) {
      socket.emit("generate:start", {
        moduleName: "assignment",
        payload: {
          topic,
          level,
          wordCount: wordCount.split(" ")[0],
          userId: userIdRef.current
        }
      });
    } else {
      const stages = [
        { msg: "Researching topic sources...", prg: 25 },
        { msg: "Drafting introduction module...", prg: 50 },
        { msg: "Validating reference materials...", prg: 75 },
        { msg: "Compiling draft document (Offline Demo)...", prg: 100 }
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
          const text = `# ${topic}\n\n## Introduction\n${MOCK_ASSIGNMENT.introduction}\n\n## Main Body\n${MOCK_ASSIGNMENT.body}\n\n## Conclusion\n${MOCK_ASSIGNMENT.conclusion}\n\n## References\n${MOCK_ASSIGNMENT.references.map(r => `- ${r}`).join("\n")}`;
          setResult(text);
          setActiveSection("Introduction");
        }
      }, 600);
    }
  };

  const handleScrollToSection = (name: string) => {
    setActiveSection(name);
    const element = document.getElementById(`assign-${name.replace(/\s+/g, "-")}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const loadHistoryItem = (topicName: string) => {
    setTopic(topicName);
    const text = `# ${topicName}\n\n## Introduction\n${MOCK_ASSIGNMENT.introduction}\n\n## Main Body\n${MOCK_ASSIGNMENT.body}\n\n## Conclusion\n${MOCK_ASSIGNMENT.conclusion}\n\n## References\n${MOCK_ASSIGNMENT.references.map(r => `- ${r}`).join("\n")}`;
    setResult(text);
    setActiveSection("Introduction");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 p-1 antialiased text-white w-full text-xs"
    >
      {/* SECTION 1 — HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            <PenTool className="text-amber-500" size={20} /> Assignment Generator
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }} className="text-[11px] text-gray-400 mt-0.5 max-w-xl">
            Create structured academic drafts and essay outlines with references.
          </motion.p>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setResult(null); setGenerating(false); }}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={16} /> Create New
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              const el = document.getElementById("recent-assignments-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          >
            <History size={16} /> History
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveView(activeView === "help" ? "dashboard" : "help")}
            className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all text-white"
          >
            <HelpCircle size={16} /> Help
          </motion.button>
        </div>
      </div>

      {activeView === "help" ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border border-white/5 bg-white/[0.01] rounded-xl space-y-2.5">
          <h2 className="text-sm font-bold text-white">Assignment Generator Help</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Specify a research assignment topic and word count constraints. The generator outlines the conceptual introduction, details body paragraphs, states logical conclusions, and adds reference citations.
          </p>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveView("dashboard")} className="h-8 px-3 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all">
            Back to Dashboard
          </motion.button>
        </motion.div>
      ) : (
        <>
          {generating ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center p-6 border border-white/5 bg-white/[0.01] rounded-xl space-y-4 max-w-xl mx-auto w-full text-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500"
              >
                <Cpu size={24} />
              </motion.div>
              <div>
                <h3 className="text-xs font-bold text-white">Writing Assignment via AI Pipeline</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{statusMsg}</p>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
                  className="bg-amber-500 h-full"
                />
              </div>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5 justify-center">
                <Loader2 className="animate-spin" size={12} /> {progress}% Complete
              </div>
            </motion.div>
          ) : !result ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
              {/* SECTION 3 — CONFIGURATION WORKSPACE */}
              <motion.div variants={itemVariants} className="p-4 border border-white/5 bg-white/[0.01] rounded-xl max-w-2xl mx-auto w-full space-y-4">
                <h3 className="text-xs font-bold text-white">Configure Assignment Draft</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Assignment Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. The impact of quantum computing on cryptography"
                      className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300">Academic Level</label>
                      <select
                        value={level}
                        onChange={e => setLevel(e.target.value)}
                        className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none"
                      >
                        <option>High School</option>
                        <option>Undergraduate</option>
                        <option>Master's</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300">Word Count</label>
                      <select
                        value={wordCount}
                        onChange={e => setWordCount(e.target.value)}
                        className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none"
                      >
                        <option>500 words</option>
                        <option>1000 words</option>
                        <option>2000 words</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={handleGenerate}
                    className="h-8 flex-1 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-1"
                  >
                    <PenTool size={16} /> Generate Assignment
                  </motion.button>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setTopic("")}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold transition-all"
                  >
                    Clear
                  </motion.button>
                </div>
              </motion.div>

              {/* SECTION 4 — PRESETS SECTION */}
              <motion.div variants={itemVariants} className="space-y-2">
                <h2 className="text-sm font-bold text-white">Choose Preset Templates</h2>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Scientific Report Outlines", desc: "Formats assignment briefs into introduction, experimental body paragraphs, and conclusion blocks." },
                    { title: "Literature Review Drafts", desc: "Synthesizes existing papers, highlights critical differences, and references source databases." },
                    { title: "Analytical Essays Reviews", desc: "Constructs essays focused on comparing conceptual parameters, detailing arguments, and citing sources." }
                  ].map(tpl => (
                    <motion.div
                      key={tpl.title}
                      variants={itemVariants}
                      whileHover={{ y: -3, scale: 1.01 }}
                      onClick={() => setTopic(tpl.title)}
                      className="p-4 border border-white/5 rounded-xl bg-white/[0.01] hover:bg-amber-500/[0.01] hover:border-amber-500/30 transition-all cursor-pointer space-y-1"
                    >
                      <h4 className="text-xs font-bold text-white">{tpl.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{tpl.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* SECTION 12 — HOW IT WORKS */}
              <motion.div variants={itemVariants} className="space-y-2">
                <h2 className="text-sm font-bold text-white">How It Works</h2>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "Outline Topic", desc: "State the research assignment questions and specify academic degree level." },
                    { step: "Process Context", desc: "AI references publications, writes cohesive paragraphs, and matches styles." },
                    { step: "Export Outputs", desc: "Review the full essay draft in the editor, copy sections, or download files." }
                  ].map((item, idx) => (
                    <motion.div key={item.step} variants={itemVariants} whileHover={{ y: -3, scale: 1.01 }} className="p-4 border border-white/5 rounded-xl bg-white/[0.01] space-y-1">
                      <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Step 0{idx + 1}</div>
                      <h4 className="text-xs font-bold text-white">{item.step}</h4>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
            >
              {/* LEFT SIDEBAR (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2"
                >
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    Document Sections
                  </span>
                  <div className="space-y-0.5">
                    {["Introduction", "Main Body", "Conclusion", "References"].map((sect, i) => (
                      <motion.button
                        key={sect}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
                        onClick={() => handleScrollToSection(sect)}
                        whileHover={{ x: 3 }}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          activeSection === sect
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="text-[12px]">{sect}</span>
                        <ChevronRight size={12} className={activeSection === sect ? "text-amber-500" : "text-gray-600"} />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* MAIN CONTENT EDITOR (6 Cols) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-6 space-y-4"
              >
                <motion.div variants={scaleInVariants} className="p-4 border border-white/5 rounded-xl bg-white/[0.01] space-y-4">
                  <h3 className="text-xs font-bold text-white border-b border-white/5 pb-2">
                    Assignment Preview & Draft
                  </h3>

                  <div className="space-y-4 font-serif text-[12px] leading-relaxed text-gray-200">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} id="assign-Introduction" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">1. Introduction</h4>
                      <p>{MOCK_ASSIGNMENT.introduction}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} id="assign-Main-Body" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">2. Main Body</h4>
                      <p>{MOCK_ASSIGNMENT.body}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} id="assign-Conclusion" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">3. Conclusion</h4>
                      <p>{MOCK_ASSIGNMENT.conclusion}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} id="assign-References" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">4. References</h4>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {MOCK_ASSIGNMENT.references.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Footer Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-2 border border-white/5 bg-white/[0.01] rounded-xl flex flex-wrap gap-1.5 justify-between items-center"
                >
                  <div className="flex gap-1.5">
                    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { navigator.clipboard.writeText(result || ""); toast.success("Copied assignment draft."); }}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Copy size={14} /> Copy
                    </motion.button>
                    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                      onClick={() => toast.success("Exported assignment formatted DOCX.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FileDown size={14} /> Export DOCX
                    </motion.button>
                  </div>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setResult(null)}
                    className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all"
                  >
                    Start New Draft
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* RIGHT SIDEBAR STATS (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2"
                >
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    Document Metadata
                  </span>
                  <div className="space-y-1 text-xs">
                    {[
                      { label: "Topic Category", val: "Science / Security" },
                      { label: "Level Target", val: level },
                      { label: "Word Limit", val: wordCount },
                      { label: "Citations Added", val: "2 Sources" }
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="flex justify-between items-center py-0.5 border-b border-white/[0.03]"
                      >
                        <span className="text-gray-400 text-[11px]">{stat.label}</span>
                        <span className="font-extrabold text-white text-[12px]">{stat.val}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* SECTION 11 — RECENT ASSIGNMENTS TABLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            id="recent-assignments-section"
            className="space-y-2.5 pt-4 border-t border-white/5"
          >
            <h2 className="text-sm font-bold text-white">Recent Outlines</h2>
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Topic</th>
                    <th className="p-2.5">Date Completed</th>
                    <th className="p-2.5">Academic Level</th>
                    <th className="p-2.5 text-center">Word Count</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: "Impact of Quantum Computing on Cryptography", date: "Today", level: "Undergraduate", words: "1000 words" },
                    { name: "Evaluating Neural Network Security", date: "Yesterday", level: "Master's", words: "2000 words" },
                    { name: "A Study on Clean Water Access Models", date: "3 Jul", level: "High School", words: "500 words" }
                  ].map((doc, i) => (
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
                      <td className="p-2.5 text-gray-300 font-medium">{doc.level}</td>
                      <td className="p-2.5 text-center text-gray-300 font-medium">{doc.words}</td>
                      <td className="p-2.5 text-right">
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                          onClick={() => loadHistoryItem(doc.name)}
                          className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-black font-extrabold text-[11px] transition-all"
                        >
                          Open
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}