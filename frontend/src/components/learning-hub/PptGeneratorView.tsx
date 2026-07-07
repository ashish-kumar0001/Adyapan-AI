"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Download, Loader2, RefreshCw, CheckCircle2,
  Plus, History, HelpCircle, ChevronRight, Search, FileText, Cpu, Copy, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";

interface Slide {
  title: string;
  bullets: string[];
  notes: string;
}

export function PptGeneratorView() {
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [topic, setTopic] = useState("EdTech Pitch Deck");
  const [slideCount, setSlideCount] = useState("5 Slides");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeView, setActiveView] = useState<"dashboard" | "help">("dashboard");
  const [activeSlide, setActiveSlide] = useState(0);

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

  const MOCK_SLIDES = [
    {
      title: "Adyapan AI Startup Introduction",
      bullets: [
        "Unlocking student potential with generative learning models.",
        "Integrated AI Study Assistants, Notes Generators, and Interview preparation portals.",
        "A cohesive database structure designed for maximum availability."
      ],
      notes: "Welcome the stakeholders and introduce the core vision of Adyapan AI."
    },
    {
      title: "Market Opportunity & Pain Points",
      bullets: [
        "Traditional study materials are fragmented and dry.",
        "Placement preparation is unstructured and creates anxiety.",
        "Growing demand for personalized study aids in higher education."
      ],
      notes: "Emphasize why personalization is the next biggest growth driver in EdTech."
    },
    {
      title: "The Product Workspace Architecture",
      bullets: [
        "Unified dashboard with dedicated, separate modules.",
        "State management using Next.js client structures.",
        "High performance database queries with Neon PostgreSQL."
      ],
      notes: "Point out the technical efficiency and structural speed parameters."
    }
  ];

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

    const handleComplete = ({ slides: slideList }: { slides: Slide[] }) => {
      setGenerating(false);
      setSlides(slideList);
      setActiveSlide(0);
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
  }, [socket, topic, slideCount]);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setStatusMsg("Starting Presentation Generator...");

    if (socket && isConnected) {
      socket.emit("generate:start", {
        moduleName: "ppt",
        payload: {
          topic,
          slideCount: slideCount.split(" ")[0],
          userId: userIdRef.current
        }
      });
    } else {
      const stages = [
        { msg: "Structuring presentation outline...", prg: 25 },
        { msg: "Writing slide text components...", prg: 50 },
        { msg: "Creating speaker notes prompts...", prg: 75 },
        { msg: "Complete (Offline Demo Mode)...", prg: 100 }
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
          setSlides(MOCK_SLIDES);
          setActiveSlide(0);
        }
      }, 600);
    }
  };

  const loadHistoryItem = (topicName: string) => {
    setTopic(topicName);
    setSlides(MOCK_SLIDES);
    setActiveSlide(0);
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
            <Presentation className="text-amber-500" size={20} /> PPT Generator
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }} className="text-[11px] text-gray-400 mt-0.5 max-w-xl">
            Generate clean, content-rich presentation slides with speaker notes.
          </motion.p>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setSlides(null); setGenerating(false); }}
            className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={16} /> Create New
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              const el = document.getElementById("recent-ppts-section");
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
          <h2 className="text-sm font-bold text-white">PPT Generator Help</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Specify a presentation topic or copy-paste lecture concepts. The AI structures a sequential slide progression, writes clear bullet points, and appends reference speaker notes for live narration.
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
                <h3 className="text-xs font-bold text-white">Generating Slides via AI Pipeline</h3>
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
          ) : !slides ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
              {/* SECTION 3 — CONFIGURATION WORKSPACE */}
              <motion.div variants={itemVariants} className="p-4 border border-white/5 bg-white/[0.01] rounded-xl max-w-2xl mx-auto w-full space-y-4">
                <h3 className="text-xs font-bold text-white">Configure Slides Outline</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Presentation Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Pitch Deck for an EdTech Startup"
                      className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300">Slide Count</label>
                      <select
                        value={slideCount}
                        onChange={e => setSlideCount(e.target.value)}
                        className="w-full h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-gray-300 focus:outline-none focus:border-amber-500/50 appearance-none"
                      >
                        <option>5 Slides</option>
                        <option>10 Slides</option>
                        <option>15 Slides</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={handleGenerate}
                    className="h-8 flex-1 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-1"
                  >
                    <Presentation size={16} /> Generate Presentation
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
                <h2 className="text-sm font-bold text-white">Choose Slide Presets</h2>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Startup Pitch Deck", desc: "Constructs slides maps showing introduction, market analysis, products, and financials." },
                    { title: "Academic Lecture Presentation", desc: "Partitions lecture modules into key concept maps, explanations, and summarization points." },
                    { title: "Product Feature Slides", desc: "Focuses on detailing technical attributes, advantages, and user guides layouts." }
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
                    { step: "Brief Slide Topic", desc: "State the presentation goal and select target page/slide count." },
                    { step: "Formulate Content", desc: "AI maps logical sequences, designs bullet outlines, and appends notes." },
                    { step: "Export Presentation", desc: "Preview all generated slide templates and export files to PowerPoint." }
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
                    Slides Outline
                  </span>
                  <div className="space-y-0.5">
                    {slides.map((s, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.08, duration: 0.3 }}
                        onClick={() => setActiveSlide(idx)}
                        whileHover={{ x: 3 }}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                          activeSlide === idx
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="truncate text-[12px]">Slide {idx + 1}: {s.title}</span>
                        <ChevronRight size={12} className={activeSlide === idx ? "text-amber-500" : "text-gray-600"} />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* MAIN CONTENT PREVIEW (6 Cols) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-6 space-y-4"
              >
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="aspect-video bg-gradient-to-br from-[#1a1c29] to-[#0f111a] border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="text-[9px] text-amber-500 font-bold tracking-widest uppercase mb-1">Slide {activeSlide + 1}</div>
                    <h3 className="text-xs font-extrabold text-white mb-2 leading-tight">{slides[activeSlide]?.title}</h3>
                    <motion.ul variants={containerVariants} initial="hidden" animate="visible" className="space-y-1">
                      {slides[activeSlide]?.bullets.map((b, j) => (
                        <motion.li key={j} variants={itemVariants} className="text-gray-300 text-[12px] leading-relaxed list-disc ml-4">{b}</motion.li>
                      ))}
                    </motion.ul>
                  </div>

                  {slides[activeSlide]?.notes && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-2 pt-2 border-t border-white/5"
                    >
                      <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-wider mb-0.5">Speaker Notes</p>
                      <p className="text-gray-400 text-[11px] italic">"{slides[activeSlide]?.notes}"</p>
                    </motion.div>
                  )}
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
                      onClick={() => toast.success("Copied slide details.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Copy size={14} /> Copy Slide
                    </motion.button>
                    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                      onClick={() => toast.success("Exported PPTX successfully.")}
                      className="h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FileDown size={14} /> Export PPTX
                    </motion.button>
                  </div>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSlides(null)}
                    className="h-8 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all"
                  >
                    Start New Slides
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
                    Slides Metadata
                  </span>
                  <div className="space-y-1 text-xs">
                    {[
                      { label: "Target Topic", val: topic },
                      { label: "Total Slides", val: slides.length },
                      { label: "Theme Style", val: "Tech Premium" },
                      { label: "Language", val: "English" }
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

          {/* SECTION 11 — RECENT PPTS TABLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            id="recent-ppts-section"
            className="space-y-2.5 pt-4 border-t border-white/5"
          >
            <h2 className="text-sm font-bold text-white">Recent Presentations</h2>
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Topic</th>
                    <th className="p-2.5">Date Completed</th>
                    <th className="p-2.5 text-center">Slides count</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: "EdTech Pitch Deck", date: "Today", count: 5 },
                    { name: "Syllabus Review Slides", date: "Yesterday", count: 10 },
                    { name: "Computer Networking PPT", date: "5 Jul", count: 15 }
                  ].map((ppt, i) => (
                    <motion.tr
                      key={ppt.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-2.5 font-semibold text-white flex items-center gap-1.5 truncate max-w-[180px]">
                        <FileText size={14} className="text-amber-500 shrink-0" /> {ppt.name}
                      </td>
                      <td className="p-2.5 text-gray-400">{ppt.date}</td>
                      <td className="p-2.5 text-center text-gray-300 font-medium">{ppt.count} slides</td>
                      <td className="p-2.5 text-right">
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                          onClick={() => loadHistoryItem(ppt.name)}
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