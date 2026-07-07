"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  CheckSquare, ArrowRight, PlayCircle, Trophy, RefreshCw, ChevronRight, Search, Plus, History,
  CheckCircle2, Sparkles, Brain, Zap, Star, X, FileText, HelpCircle, Layers, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(t);
    const obs = new MutationObserver(() => setTheme(document.documentElement.getAttribute("data-theme") || "dark"));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

const mkColors = (theme: string) => {
  const isDark = theme === "dark";
  return {
    isDark, text: isDark ? "#e5e7eb" : "#0f172a", textSec: isDark ? "#9ca3af" : "#475569", textMuted: isDark ? "#6b7280" : "#94a3b8", textOnAmber: "#000000",
    bg: isDark ? "rgba(255,255,255,0.025)" : "#ffffff", bgHover: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", surfaceHover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", borderHover: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)",
    inputBg: isDark ? "rgba(0,0,0,0.35)" : "#f1f5f9", cardBg: isDark ? "rgba(255,255,255,0.025)" : "#ffffff", cardBgAlt: isDark ? "rgba(0,0,0,0.25)" : "#f8fafc",
    stickyBg: isDark ? "rgba(10,10,20,0.88)" : "rgba(248,250,252,0.92)",
    amber: "#f59e0b", amberBg: isDark ? "rgba(245,158,11,0.07)" : "rgba(245,158,11,0.08)", amberBorder: isDark ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.25)", amberActive: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.1)",
    purpleBg: isDark ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.05)", purpleBorder: isDark ? "rgba(139,92,246,0.14)" : "rgba(139,92,246,0.15)",
    green: "#10b981", greenBg: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)", red: "#ef4444", redBg: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
    divider: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    pill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", pillBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };
};

interface Question { question: string; options: string[]; correctAnswer: string; explanation: string; }

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) };
const scaleIn = { hidden: { opacity: 0, scale: 0.92 }, visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }) };
const slideRight = { hidden: { opacity: 0, x: -24 }, visible: (i = 0) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.4 } }) };

export function QuizGeneratorView() {
  const theme = useTheme();
  const c = mkColors(theme);

  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("React Hooks");
  const [count, setCount] = useState("5 Questions");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Array<{ name: string; date: string; difficulty: string; score: string; data: Question[] }>>([]);

  const { socket, isConnected } = useSocket();
  const userIdRef = useRef<string>("");

  const MOCK_QUESTIONS = [
    { question: "Which hook should be used to run side effects in a functional component?", options: ["useState", "useEffect", "useContext", "useReducer"], correctAnswer: "useEffect", explanation: "useEffect is designed to perform side effects (data fetching, subscriptions, DOM manipulations) in functional React components." },
    { question: "What is the return value of the useState hook?", options: ["A state value", "A state updater function", "An array with state value and state updater", "An object containing state details"], correctAnswer: "An array with state value and state updater", explanation: "useState returns an array containing exactly two items: the current state value and a dispatch function to update it." },
    { question: "Which React hook returns a memoized callback function?", options: ["useMemo", "useCallback", "useRef", "useTransition"], correctAnswer: "useCallback", explanation: "useCallback returns a memoized version of the callback function that only changes if one of the dependencies has changed." }
  ];

  useEffect(() => {
    try { const raw = localStorage.getItem("adyapan-user"); if (raw) userIdRef.current = (JSON.parse(raw) as { id?: string })?.id ?? ""; } catch { }
    try { const stored = localStorage.getItem("adyapan-quiz-history"); if (stored) setHistory(JSON.parse(stored)); } catch {}
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleProgress = ({ progress: p, statusMessage }: { progress: number; statusMessage: string }) => { setProgress(p); setStatusMsg(statusMessage); };
    const handleComplete = ({ questions: qList }: { questions: Question[] }) => {
      setGenerating(false); setQuestions(qList); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowResult(false);
      const newHistoryItem = { name: topic, date: "Just now", difficulty, score: `0/${qList.length}`, data: qList };
      const updatedHistory = [newHistoryItem, ...history.filter(h => h.name !== topic)].slice(0, 10);
      setHistory(updatedHistory); localStorage.setItem("adyapan-quiz-history", JSON.stringify(updatedHistory));
    };
    const handleError = ({ error }: { error: string }) => { setGenerating(false); toast.error(`Generation error: ${error}`); };
    socket.on("generate:progress", handleProgress);
    socket.on("generate:complete", handleComplete);
    socket.on("generate:error", handleError);
    return () => { socket.off("generate:progress", handleProgress); socket.off("generate:complete", handleComplete); socket.off("generate:error", handleError); };
  }, [socket, topic, count, difficulty, history]);

  const handleGenerate = () => {
    setGenerating(true); setProgress(0); setStatusMsg("Starting Quiz Generator pipeline...");
    if (socket && isConnected) {
      socket.emit("generate:start", { moduleName: "quiz", payload: { topic, count: count.split(" ")[0], difficulty, userId: userIdRef.current } });
    } else {
      const stages = [{ msg: "Extracting sample questions...", prg: 30 }, { msg: "Formulating difficulty bounds...", prg: 60 }, { msg: "Writing answer explanations...", prg: 90 }, { msg: "Complete (Offline Demo Mode)...", prg: 100 }];
      let currentIdx = 0;
      const timer = setInterval(() => {
        if (currentIdx < stages.length) { setStatusMsg(stages[currentIdx].msg); setProgress(stages[currentIdx].prg); currentIdx++; }
        else { clearInterval(timer); setGenerating(false); setQuestions(MOCK_QUESTIONS); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowResult(false); }
      }, 600);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === questions[currentQ]?.correctAnswer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) { setCurrentQ(c => c + 1); setSelectedAnswer(null); }
    else setShowResult(true);
  };

  const loadHistoryItem = (item: typeof history[0]) => {
    setTopic(item.name); setDifficulty(item.difficulty); setQuestions(item.data); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowResult(false); setShowHistory(false);
  };

  const getOptionStyle = (opt: string) => {
    if (!selectedAnswer) return undefined;
    if (opt === questions[currentQ]?.correctAnswer) return { background: c.greenBg, border: `1px solid ${c.green}`, color: c.text };
    if (opt === selectedAnswer) return { background: c.redBg, border: `1px solid ${c.red}`, color: c.text };
    return { background: c.surface, border: `1px solid ${c.border}`, color: c.textMuted, opacity: 0.5 };
  };

  const stages = ["Research Topic", "Generate Questions", "Write Explanations", "Validate", "Format Output", "Completed"];

  const isReady = questions.length > 0 && !generating && !showResult;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex flex-col antialiased" style={{ color: c.text }}>
      <style>{`.qz-scroll { scrollbar-width: none; -ms-overflow-style: none; } .qz-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex items-center gap-2.5">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <CheckSquare size={18} style={{ color: "#000" }} />
          </motion.div>
          <div>
            <motion.h1 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="text-base font-extrabold leading-tight" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>Quiz Generator</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-xs leading-tight" style={{ color: c.textMuted }}>AI-powered MCQ mock tests for revision</motion.p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(questions.length > 0 || showResult) && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setQuestions([]); setShowResult(false); setCurrentQ(0); setScore(0); setSelectedAnswer(null); }} className="h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text }}>
              <Plus size={14} /> New Quiz
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setShowHistory(!showHistory)} className="h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            style={{ background: showHistory ? c.amberActive : c.surface, border: `1px solid ${showHistory ? c.amberBorder : c.border}`, color: showHistory ? c.amber : c.text }}>
            <History size={14} /> History
            {history.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black" style={{ background: c.amberBg, color: c.amber }}>{history.length}</span>}
          </motion.button>
        </div>
      </div>

      {/* HISTORY PANEL */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={{ duration: 0.3 }} className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.amberBorder}`, background: c.amberBg }}>
            <div className="p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}><History size={15} style={{ color: c.amber }} /> Recent Quizzes</h3>
              {history.length === 0 ? (
                <p className="text-sm py-2" style={{ color: c.textMuted }}>No quizzes generated yet. Submit a topic to begin.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((doc, i) => (
                    <motion.div key={doc.name} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
                      onClick={() => loadHistoryItem(doc)} whileHover={{ scale: 1.01, borderColor: c.amberBorder }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                          <FileText size={14} style={{ color: c.amber }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: c.text }}>{doc.name}</p>
                          <p className="text-xs" style={{ color: c.textMuted }}>{doc.date} · {doc.difficulty} · {doc.score}</p>
                        </div>
                      </div>
                      <motion.button whileHover={{ x: 2 }} className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all" style={{ background: c.amberActive, color: c.amber }}>
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

      <div className="flex-1">
        <AnimatePresence mode="wait">

          {/* EMPTY STATE */}
          {!generating && questions.length === 0 && !showResult && (
            <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* Config Form */}
              <motion.div className="p-6 rounded-3xl relative overflow-hidden" style={{ background: c.surface, border: `2px solid ${c.border}` }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 right-8 w-24 h-24 rounded-full" style={{ opacity: c.isDark ? 0.05 : 0.08, background: "radial-gradient(circle, #f59e0b, transparent)" }} />
                  <div className="absolute bottom-4 left-8 w-16 h-16 rounded-full" style={{ opacity: c.isDark ? 0.04 : 0.06, background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
                </div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-lg font-extrabold text-center" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>Configure Quiz Outline</h3>
                  <div className="space-y-3 max-w-xl mx-auto">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold" style={{ color: c.textSec }}>Topic or Syllabus Segment</label>
                      <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. React Hooks, AWS Architecture"
                        className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold" style={{ color: c.textSec }}>Questions Count</label>
                        <select value={count} onChange={e => setCount(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none appearance-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}>
                          <option>5 Questions</option><option>10 Questions</option><option>20 Questions</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold" style={{ color: c.textSec }}>Difficulty</label>
                        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none appearance-none" style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}>
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleGenerate}
                      className="w-full py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}>
                      <PlayCircle size={16} /> Generate &amp; Start Quiz
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Presets */}
              <div>
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}><Zap size={15} style={{ color: c.amber }} /> Choose Preset Challenges</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "React Hooks Challenge", desc: "Isolate questions surrounding useEffect triggers, dependency lists, and custom hooks bindings.", icon: <Star size={18} style={{ color: c.amber }} /> },
                    { title: "AWS Architecture Test", desc: "Filters quiz formulations to VPC setups, ELB nodes configurations, and DynamoDB indexes.", icon: <Brain size={18} style={{ color: "#a78bfa" }} /> },
                    { title: "Compiler Design Quiz", desc: "Formulates lexical analyzes steps, parse tree connections, and code optimizers stages queries.", icon: <Sparkles size={18} style={{ color: "#22d3ee" }} /> }
                  ].map((item, i) => (
                    <motion.div key={item.title} custom={i} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => setTopic(item.title)} className="p-5 rounded-2xl relative overflow-hidden cursor-pointer group transition-all" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.surface, border: `1px solid ${c.border}` }}>{item.icon}</div>
                        <div><h4 className="text-sm font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>{item.title}</h4></div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div>
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}><Zap size={15} style={{ color: c.amber }} /> How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "01", title: "Configure", desc: "Specify a topic, question count, and difficulty level for the quiz.", icon: <BookOpen size={18} style={{ color: c.amber }} /> },
                    { step: "02", title: "Answer", desc: "The AI generates multiple-choice questions. Select your answer for each one.", icon: <Brain size={18} style={{ color: "#a78bfa" }} /> },
                    { step: "03", title: "Review", desc: "Get instant feedback with explanations for every correct answer.", icon: <Sparkles size={18} style={{ color: "#22d3ee" }} /> }
                  ].map((item, i) => (
                    <motion.div key={item.step} custom={i} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ y: -4, scale: 1.01 }} className="p-5 rounded-2xl relative overflow-hidden group transition-all" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.surface, border: `1px solid ${c.border}` }}>{item.icon}</div>
                        <div><span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Step {item.step}</span><h4 className="text-sm font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>{item.title}</h4></div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: c.text }}><Star size={14} style={{ color: c.amber }} /> Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {["MCQ Questions", "Difficulty Levels", "Instant Scoring", "Explanation Review", "Performance Stats", "Try Again"].map((feat, i) => (
                    <motion.div key={feat} custom={i} variants={scaleIn} initial="hidden" animate="visible" className="flex items-center gap-2 text-sm" style={{ color: c.textSec }}>
                      <CheckCircle2 size={14} style={{ color: c.amber }} className="shrink-0" />
                      <span>{feat}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* PROCESSING */}
          {generating && (
            <motion.div key="generating" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 gap-8">
              <div className="relative w-24 h-24">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full" style={{ border: `3px solid transparent`, borderTopColor: c.amber, borderRightColor: c.amberBg }} />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-3 rounded-full" style={{ border: `2px solid transparent`, borderTopColor: "rgba(139,92,246,0.6)", borderLeftColor: "rgba(139,92,246,0.2)" }} />
                <div className="absolute inset-0 flex items-center justify-center"><Brain size={28} style={{ color: c.amber }} /></div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>Generating Quiz...</h3>
                <p className="text-sm" style={{ color: c.textMuted }}>{statusMsg}</p>
              </div>
              <div className="w-full max-w-lg grid grid-cols-3 gap-3">
                {stages.map((step, idx) => {
                  const stageIdx = stages.indexOf(statusMsg);
                  const isActive = idx <= stageIdx;
                  return (
                    <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-xl text-center space-y-1.5 transition-all duration-500" style={{ background: isActive ? c.amberBg : c.surface, border: `1px solid ${isActive ? c.amberBorder : c.border}` }}>
                      <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Stage {idx + 1}</span>
                      <span className="text-xs font-semibold block" style={{ color: c.text }}>{step}</span>
                      {isActive && idx === stageIdx && <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 rounded-full mx-auto" style={{ background: c.amber }} />}
                      {isActive && idx < stageIdx && <CheckCircle2 size={12} style={{ color: c.green }} className="mx-auto" />}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ACTIVE QUIZ - 30/70 SPLIT */}
          {isReady && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-0" style={{ minHeight: "600px" }}>
              {/* LEFT PANEL 30% */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="qz-scroll flex flex-col gap-3 overflow-y-auto pr-3" style={{ width: "30%", minWidth: "200px", maxHeight: "80vh", position: "sticky", top: 0 }}>
                {/* Info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-2xl shrink-0" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                      <CheckSquare size={14} style={{ color: c.amber }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: c.text }}>{topic}</p>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ background: c.greenBg, color: c.green }}>In Progress</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Questions", value: questions.length },
                      { label: "Answered", value: `${currentQ + (selectedAnswer ? 1 : 0)}/${questions.length}` },
                      { label: "Difficulty", value: difficulty },
                      { label: "Score", value: <CountUp start={0} end={score} duration={0.5} /> }
                    ].map(stat => (
                      <div key={stat.label} className="p-2 rounded-lg text-center" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}>
                        <span className="text-[10px] block" style={{ color: c.textMuted }}>{stat.label}</span>
                        <span className="text-xs font-extrabold" style={{ color: c.text }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Question Nav */}
                <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                  <div className="p-3 border-b sticky top-0 z-10" style={{ borderColor: c.divider, background: c.stickyBg, backdropFilter: "blur(12px)" }}>
                    <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: c.amber }}>Questions List</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {questions.map((q, idx) => (
                      <motion.button key={idx} custom={idx} variants={slideRight} initial="hidden" animate="visible"
                        onClick={() => { if (!selectedAnswer || currentQ === idx) { setCurrentQ(idx); setSelectedAnswer(null); } }} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                        className="w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all duration-200"
                        style={{ background: currentQ === idx ? c.amberActive : "transparent", border: currentQ === idx ? `1px solid ${c.amberBorder}` : "1px solid transparent" }}>
                        <span className="text-sm font-semibold truncate" style={{ color: currentQ === idx ? c.amber : c.textSec }}>Question {idx + 1}</span>
                        <motion.div animate={{ rotate: currentQ === idx ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronRight size={12} style={{ color: currentQ === idx ? c.amber : c.textMuted }} />
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Performance */}
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="p-3 rounded-2xl shrink-0" style={{ background: c.amberBg, border: `1px solid ${c.amberBorder}` }}>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-2.5 flex items-center gap-1.5" style={{ color: c.amber }}><Trophy size={11} /> Quiz Performance</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Target Topic", value: topic },
                      { label: "Correct", value: score },
                      { label: "Remaining", value: questions.length - currentQ - 1 },
                      { label: "Progress", value: `${Math.round((currentQ + (selectedAnswer ? 1 : 0)) / questions.length * 100)}%` }
                    ].map((insight, i) => (
                      <motion.div key={insight.label} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.08 }}
                        className="p-2 rounded-xl text-center" style={{ background: c.cardBgAlt, border: `1px solid ${c.border}` }}>
                        <span className="text-[10px] block leading-tight" style={{ color: c.textMuted }}>{insight.label}</span>
                        <span className="text-xs font-extrabold block truncate mt-0.5" style={{ color: c.text }}>{insight.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT PANEL 70% */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="flex-1 flex flex-col min-w-0 pl-4">
                <motion.div key={currentQ} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl" style={{ background: c.cardBg, border: `1px solid ${c.amberBorder}` }}>
                  <div className="flex justify-between items-center pb-3 mb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <span className="text-xs font-semibold" style={{ color: c.textMuted }}>Question {currentQ + 1} of {questions.length}</span>
                    <span className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: c.amber }}>
                      <Trophy size={14} /> Score: <CountUp start={0} end={score} duration={0.5} />
                    </span>
                  </div>

                  <h3 className="text-sm font-bold mb-4 leading-relaxed" style={{ color: c.text }}>{questions[currentQ]?.question}</h3>

                  <div className="grid grid-cols-1 gap-2.5">
                    {questions[currentQ]?.options.map((opt, i) => (
                      <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        onClick={() => handleAnswer(opt)} whileHover={selectedAnswer ? {} : { scale: 1.01, x: 2 }}
                        className="p-3 rounded-xl text-left font-semibold text-sm transition-all"
                        style={getOptionStyle(opt)}>
                        {opt}
                      </motion.button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedAnswer && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="p-4 rounded-xl space-y-2" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                            <span className="text-[10px] uppercase tracking-widest font-black block" style={{ color: c.amber }}>AI Explanation</span>
                            <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{questions[currentQ]?.explanation}</p>
                          </motion.div>
                          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={handleNext}
                            className="w-full mt-3 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}>
                            {currentQ < questions.length - 1 ? <>Next Question <ArrowRight size={16} /></> : "View Results"}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* RESULT SCREEN */}
          {showResult && questions.length > 0 && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center justify-center py-12 max-w-xl mx-auto text-center space-y-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: c.greenBg, border: `1px solid ${c.green}` }}>
                <CheckSquare size={28} style={{ color: c.green }} />
              </motion.div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>Quiz Completed!</h3>
                <p className="text-sm mt-1" style={{ color: c.textMuted }}>
                  You scored <span className="font-extrabold" style={{ color: c.amber }}><CountUp start={0} end={score} duration={0.8} />/{questions.length}</span> (<CountUp start={0} end={Math.round((score / questions.length) * 100)} duration={0.8} suffix="%" /> accuracy)
                </p>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="w-full p-4 rounded-xl space-y-2 text-left" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold" style={{ color: c.textMuted }}>Strong Topics</span>
                  <span className="text-xs font-extrabold" style={{ color: c.green }}>{topic}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold" style={{ color: c.textMuted }}>Target Accuracy</span>
                  <span className={`text-xs font-extrabold ${score / questions.length >= 0.7 ? "text-green-400" : "text-amber-400"}`}
                    style={{ color: score / questions.length >= 0.7 ? c.green : c.amber }}>
                    {Math.round((score / questions.length) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold" style={{ color: c.textMuted }}>Difficulty</span>
                  <span className="text-xs font-extrabold" style={{ color: c.textSec }}>{difficulty}</span>
                </div>
              </motion.div>

              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setQuestions([]); setShowResult(false); setCurrentQ(0); setScore(0); setSelectedAnswer(null); }}
                className="py-2.5 px-6 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}>
                <RefreshCw size={15} /> Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
