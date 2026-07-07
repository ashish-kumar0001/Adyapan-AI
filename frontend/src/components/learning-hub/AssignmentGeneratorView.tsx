"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, Download, Copy, Loader2, RefreshCw, CheckCircle2,
  Plus, History, HelpCircle, ChevronRight, Search, FileText, Cpu, FileDown, Printer
} from "lucide-react";
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

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Initializing Assignment Generator...");

    const stages = [
      { msg: "Researching topic sources...", prg: 25 },
      { msg: "Drafting introduction module...", prg: 50 },
      { msg: "Validating reference materials...", prg: 75 },
      { msg: "Compiling draft document...", prg: 100 }
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
    }, 1000);
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
    <div className="flex flex-col gap-3 p-1 antialiased text-white w-full text-xs">
      {/* SECTION 1 — HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            <PenTool className="text-amber-500" size={20} /> Assignment Generator
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-xl">
            Create structured academic drafts and essay outlines with references.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setResult(null); setGenerating(false); }}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={16} /> Create New
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("recent-assignments-section");
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
          <h2 className="text-sm font-bold text-white">Assignment Generator Help</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Specify a research assignment topic and word count constraints. The generator outlines the conceptual introduction, details body paragraphs, states logical conclusions, and adds reference citations.
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
                <h3 className="text-xs font-bold text-white">Writing Assignment via AI Pipeline</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{statusMsg}</p>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5 justify-center">
                <Loader2 className="animate-spin" size={12} /> {progress}% Complete
              </div>
            </div>
          ) : !result ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* SECTION 3 — CONFIGURATION WORKSPACE */}
              <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl max-w-2xl mx-auto w-full space-y-4">
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
                  <button
                    onClick={handleGenerate}
                    className="h-8 flex-1 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-1"
                  >
                    <PenTool size={16} /> Generate Assignment
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
                <h2 className="text-sm font-bold text-white">Choose Preset Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Scientific Report Outlines", desc: "Formats assignment briefs into introduction, experimental body paragraphs, and conclusion blocks." },
                    { title: "Literature Review Drafts", desc: "Synthesizes existing papers, highlights critical differences, and references source databases." },
                    { title: "Analytical Essays Reviews", desc: "Constructs essays focused on comparing conceptual parameters, detailing arguments, and citing sources." }
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
                    { step: "Outline Topic", desc: "State the research assignment questions and specify academic degree level." },
                    { step: "Process Context", desc: "AI references publications, writes cohesive paragraphs, and matches styles." },
                    { step: "Export Outputs", desc: "Review the full essay draft in the editor, copy sections, or download files." }
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
                    Document Sections
                  </span>
                  <div className="space-y-0.5">
                    {["Introduction", "Main Body", "Conclusion", "References"].map(sect => (
                      <button
                        key={sect}
                        onClick={() => handleScrollToSection(sect)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          activeSection === sect
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="text-[12px]">{sect}</span>
                        <ChevronRight size={12} className={activeSection === sect ? "text-amber-500" : "text-gray-600"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT EDITOR (6 Cols) */}
              <div className="md:col-span-6 space-y-4">
                <div className="p-4 border border-white/5 rounded-xl bg-white/[0.01] space-y-4">
                  <h3 className="text-xs font-bold text-white border-b border-white/5 pb-2">
                    Assignment Preview & Draft
                  </h3>

                  <div className="space-y-4 font-serif text-[12px] leading-relaxed text-gray-200">
                    <div id="assign-Introduction" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">1. Introduction</h4>
                      <p>{MOCK_ASSIGNMENT.introduction}</p>
                    </div>

                    <div id="assign-Main-Body" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">2. Main Body</h4>
                      <p>{MOCK_ASSIGNMENT.body}</p>
                    </div>

                    <div id="assign-Conclusion" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">3. Conclusion</h4>
                      <p>{MOCK_ASSIGNMENT.conclusion}</p>
                    </div>

                    <div id="assign-References" className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500">4. References</h4>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {MOCK_ASSIGNMENT.references.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-2 border border-white/5 bg-white/[0.01] rounded-xl flex flex-wrap gap-1.5 justify-between items-center">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { navigator.clipboard.writeText(result || ""); alert("📋 Copied assignment draft."); }}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <button
                      onClick={() => alert("📥 Exported assignment formatted DOCX.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FileDown size={14} /> Export DOCX
                    </button>
                  </div>
                  <button
                    onClick={() => setResult(null)}
                    className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all"
                  >
                    Start New Draft
                  </button>
                </div>
              </div>

              {/* RIGHT SIDEBAR STATS (3 Cols) */}
              <div className="md:col-span-3 space-y-3">
                <div className="p-3 border border-white/5 rounded-xl bg-white/[0.01] space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                    Document Metadata
                  </span>
                  <div className="space-y-1 text-xs">
                    {[
                      { label: "Topic Category", val: "Science / Security" },
                      { label: "Level Target", val: level },
                      { label: "Word Limit", val: wordCount },
                      { label: "Citations Added", val: "2 Sources" }
                    ].map(stat => (
                      <div key={stat.label} className="flex justify-between items-center py-0.5 border-b border-white/[0.03]">
                        <span className="text-gray-400 text-[11px]">{stat.label}</span>
                        <span className="font-extrabold text-white text-[12px]">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11 — RECENT ASSIGNMENTS TABLE */}
          <div id="recent-assignments-section" className="space-y-2.5 pt-4 border-t border-white/5">
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
                  ].map(doc => (
                    <tr key={doc.name} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-2.5 font-semibold text-white flex items-center gap-1.5 truncate max-w-[180px]">
                        <FileText size={14} className="text-amber-500 shrink-0" /> {doc.name}
                      </td>
                      <td className="p-2.5 text-gray-400">{doc.date}</td>
                      <td className="p-2.5 text-gray-300 font-medium">{doc.level}</td>
                      <td className="p-2.5 text-center text-gray-300 font-medium">{doc.words}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => loadHistoryItem(doc.name)}
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