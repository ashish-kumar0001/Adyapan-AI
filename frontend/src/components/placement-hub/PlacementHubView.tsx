"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, DollarSign, Send, Sparkles, CheckCircle2,
  XCircle, Info, Heart, ArrowRight, Share2, Trash2, Plus, Clock,
  MessageSquare, Award, ArrowLeft, ArrowRightLeft, ChevronRight,
  AlertCircle, FileText, UserCheck, Play, PlusCircle, Check, RefreshCw,
  HelpCircle, ShieldAlert, Award as BadgeIcon, Lightbulb, BookOpen, Target, Flame
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  trick?: string;
}

interface PracticeSession {
  topic: string;
  questions: Question[];
  currentIdx: number;
  selectedOptionIdx: number | null;
  submitted: boolean;
  score: number;
  history: { questionIdx: number; selectedIdx: number; correct: boolean }[];
}

interface MockTest {
  id: string;
  name: string;
  company: string;
  durationMs: number;
  totalQuestions: number;
  sections: { name: string; questions: Question[] }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlacementHubViewProps {
  setView: (v: any) => void;
  activeModule?: string;
  theme?: string;
}

const APTITUDE_TOPICS = [
  { name: "Number System", icon: null },
  { name: "Percentages", icon: null },
  { name: "Profit & Loss", icon: null },
  { name: "Time & Work", icon: null },
  { name: "Time, Speed & Distance", icon: null },
  { name: "Simple & Compound Interest", icon: null },
  { name: "Ratio & Proportion", icon: null },
  { name: "Probability", icon: null },
  { name: "Permutations & Combinations", icon: null },
  { name: "Data Interpretation", icon: null }
];

const REASONING_TOPICS = [
  { name: "Puzzles", icon: null },
  { name: "Seating Arrangement", icon: null },
  { name: "Blood Relations", icon: null },
  { name: "Coding-Decoding", icon: null },
  { name: "Direction Sense", icon: null },
  { name: "Syllogisms", icon: null },
  { name: "Number Series", icon: null },
  { name: "Analogy", icon: null },
  { name: "Statement & Conclusion", icon: null },
  { name: "Logical Deduction", icon: null }
];

const TECHNICAL_TOPICS = [
  { name: "Programming Fundamentals", icon: null },
  { name: "OOP Concepts", icon: null },
  { name: "Data Structures", icon: null },
  { name: "Algorithms", icon: null },
  { name: "DBMS & SQL", icon: null },
  { name: "Operating Systems", icon: null },
  { name: "Computer Networks", icon: null }
];

const MOCK_MOCK_TESTS: MockTest[] = [
  {
    id: "mock-1",
    name: "TCS NQT Placement Simulation",
    company: "TCS",
    durationMs: 45 * 60 * 1000,
    totalQuestions: 15,
    sections: [
      {
        name: "Quantitative Aptitude",
        questions: [
          { id: "q-1", text: "If a work can be completed by 10 men in 15 days, how many days will 15 men take to complete the same work?", options: ["8 days", "10 days", "12 days", "15 days"], correctIdx: 1, explanation: "Using work formula M1 * D1 = M2 * D2: 10 * 15 = 15 * D2 => D2 = 10.", trick: "Inverse proportion: 1.5x men means 1/1.5 = 2/3x time. 15 * (2/3) = 10." },
          { id: "q-2", text: "A shopkeeper sells a book at a profit of 20%. If he had bought it at 10% less and sold it for ₹18 more, he would have gained 40%. Find the Cost Price of the book.", options: ["₹200", "₹300", "₹400", "₹500"], correctIdx: 1, explanation: "Let CP = 100x. SP1 = 120x. New CP = 90x. New SP = 90x * 1.4 = 126x. Difference = 6x. 6x = 18 => x = 3 => CP = 300.", trick: "Percentage difference method: 126% - 120% = 6%, which is equal to ₹18. CP = 18/0.06 = 300." }
        ]
      },
      {
        name: "Logical Reasoning",
        questions: [
          { id: "q-3", text: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?", options: ["His own", "His son's", "His father's", "His nephew's"], correctIdx: 1, explanation: "'My father's son' with no siblings means the speaker himself. So, that man's father is the speaker himself. The photograph is of his son.", trick: "Substitute relations backwards: My father's son = Me. Man's father = Me. So, the man is my son." }
        ]
      }
    ]
  },
  {
    id: "mock-2",
    name: "Amazon Online Assessment Prep",
    company: "Amazon",
    durationMs: 60 * 60 * 1000,
    totalQuestions: 20,
    sections: [
      {
        name: "Technical MCQs",
        questions: [
          { id: "q-4", text: "Which of the following data structures is optimal for implementing a LIFO (Last In First Out) system?", options: ["Queue", "Stack", "Linked List", "Binary Tree"], correctIdx: 1, explanation: "A Stack inserts and removes elements from the same end, providing Last In First Out behavior.", trick: "LIFO = Stack; FIFO = Queue." },
          { id: "q-5", text: "What is the worst-case time complexity of searching an element in a binary search tree (BST)?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctIdx: 2, explanation: "In the worst case of a skewed BST (degenerated into a linked list), the search requires scanning all elements, which takes O(n) time.", trick: "A skewed tree behaves like a linked list, which is O(n)." }
        ]
      }
    ]
  }
];

export function PlacementHubView({ setView, activeModule = "placement-hub", theme = "dark" }: PlacementHubViewProps) {
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#080710" : "#f0f4ff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    surfaceHover: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
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

  // Tab State: "aptitude" | "reasoning" | "mcqs" | "mocks" | "readiness"
  const [tab, setTab] = useState<"aptitude" | "reasoning" | "mcqs" | "mocks" | "readiness">("aptitude");

  // Practice session state
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
  const [showTrick, setShowTrick] = useState(false);

  // Active Mock Test state
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [testAnswers, setTestAnswers] = useState<Record<string, number>>({});
  const [testCompletedReport, setTestCompletedReport] = useState<any | null>(null);

  // Stats / History
  const [completedMocksCount, setCompletedMocksCount] = useState(2);
  const [avgAccuracy, setAvgAccuracy] = useState(82);

  // AI Assistant panel state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am your Adyapan AI Placement Coach. Ask me to explain a math problem, create a mock test, or recommend study resources!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Timer reference for mock test
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync tab with activeModule from props
  useEffect(() => {
    if (activeModule === "placement-aptitude") setTab("aptitude");
    else if (activeModule === "placement-reasoning") setTab("reasoning");
    else if (activeModule === "placement-mcqs") setTab("mcqs");
    else if (activeModule === "placement-mocks") setTab("mocks");
    else if (activeModule === "placement-readiness") setTab("readiness");
  }, [activeModule]);

  // Mock test countdown timer
  useEffect(() => {
    if (activeTest && testTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTestTimeRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(timerRef.current!);
            handleEndMockTest(true);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTest, testTimeRemaining]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleStartPractice = (topicName: string, category: "aptitude" | "reasoning" | "mcqs") => {
    // Standard mock questions pool based on topic
    const sampleQuestions: Question[] = [
      {
        id: "pq-1",
        text: `Find the missing value for ${topicName} assessment:\nIn a set of items, if 30% are defective and 140 are functional, what is the total count?`,
        options: ["180", "200", "220", "250"],
        correctIdx: 1,
        explanation: "Since 30% are defective, 70% are functional. 70% of Total = 140 => Total = 140 / 0.70 = 200.",
        trick: "Divide directly: 140 / 0.7 = 200."
      },
      {
        id: "pq-2",
        text: `Evaluate for ${topicName} context:\nA train travelling at 60 km/h crosses a pole in 9 seconds. What is the length of the train?`,
        options: ["120 meters", "150 meters", "180 meters", "324 meters"],
        correctIdx: 1,
        explanation: "Speed in m/s = 60 * 5/18 = 50/3 m/s. Distance (train length) = Speed * Time = (50/3) * 9 = 150 meters.",
        trick: "60 km/h is roughly 16.67 m/s. 16.67 * 9 = 150."
      }
    ];

    setPracticeSession({
      topic: topicName,
      questions: sampleQuestions,
      currentIdx: 0,
      selectedOptionIdx: null,
      submitted: false,
      score: 0,
      history: []
    });
    setShowTrick(false);
  };

  const handlePracticeSubmit = () => {
    if (!practiceSession || practiceSession.selectedOptionIdx === null || practiceSession.submitted) return;

    const currentQ = practiceSession.questions[practiceSession.currentIdx];
    const isCorrect = practiceSession.selectedOptionIdx === currentQ.correctIdx;

    setPracticeSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        submitted: true,
        score: isCorrect ? prev.score + 1 : prev.score,
        history: [...prev.history, { questionIdx: prev.currentIdx, selectedIdx: prev.selectedOptionIdx!, correct: isCorrect }]
      };
    });
  };

  const handlePracticeNext = () => {
    if (!practiceSession) return;
    const nextIdx = practiceSession.currentIdx + 1;
    if (nextIdx < practiceSession.questions.length) {
      setPracticeSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentIdx: nextIdx,
          selectedOptionIdx: null,
          submitted: false
        };
      });
      setShowTrick(false);
    } else {
      // Finished practice
      alert(`🎉 Practice Completed! Your Score: ${practiceSession.score}/${practiceSession.questions.length}`);
      setPracticeSession(null);
    }
  };

  const handleStartMockTest = (test: MockTest) => {
    setActiveTest(test);
    setTestTimeRemaining(test.durationMs);
    setTestAnswers({});
    setTestCompletedReport(null);
  };

  const handleSelectMockAnswer = (qId: string, optIdx: number) => {
    setTestAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleEndMockTest = (auto = false) => {
    if (!activeTest) return;
    if (!auto && !confirm("Are you sure you want to submit your mock test?")) return;

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correctCount = 0;
    let totalQuestions = 0;
    const sectionScores: Record<string, number> = {};

    activeTest.sections.forEach(sec => {
      let secCorrect = 0;
      sec.questions.forEach(q => {
        totalQuestions += 1;
        const selected = testAnswers[q.id];
        if (selected === q.correctIdx) {
          correctCount += 1;
          secCorrect += 1;
        }
      });
      sectionScores[sec.name] = secCorrect;
    });

    const finalPercent = Math.round((correctCount / totalQuestions) * 100);

    setTestCompletedReport({
      score: finalPercent,
      correct: correctCount,
      total: totalQuestions,
      sections: sectionScores,
      accuracy: finalPercent
    });

    setCompletedMocksCount(prev => prev + 1);
    setAvgAccuracy(prev => Math.round((prev + finalPercent) / 2));
    setActiveTest(null);
  };

  const handleAssistantSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const promptText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: promptText }]);
    setChatLoading(true);

    try {
      await new Promise(r => setTimeout(r, 1500));
      let responseText = "I parsed your query but didn't find any direct triggers. Try asking:\n- *'Create a mock test for TCS'*\n- *'Explain percentages shortcuts'*\n- *'Generate SQL technical MCQs'*";

      if (promptText.toLowerCase().includes("tcs") || promptText.toLowerCase().includes("infosys")) {
        const targetTest = MOCK_MOCK_TESTS[0];
        handleStartMockTest(targetTest);
        setTab("mocks");
        responseText = "📝 **Action Triggered**: Launched the **TCS NQT placement simulation** test environment. Complete the sections before the timer expires!";
      } else if (promptText.toLowerCase().includes("explain")) {
        responseText = "💡 **AI Mathematics Shortcut Guide**:\nFor percentages calculations: *X% of Y is always equal to Y% of X*.\nExample: 8% of 50 = 50% of 8 = 4. This makes arithmetic computations much faster during timed mock tests!";
      } else if (promptText.toLowerCase().includes("mcq") || promptText.toLowerCase().includes("sql")) {
        setTab("mcqs");
        responseText = "🧠 **Action Triggered**: Navigated to **Technical MCQs**. Choose a domain card (e.g. *DBMS & SQL*) to begin timed practice.";
      } else if (promptText.toLowerCase().includes("weak")) {
        setTab("readiness");
        responseText = "📊 **Action Triggered**: Navigated to the **Readiness Score Dashboard**. Review your strong vs weak areas and recommended learning roadmaps.";
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: responseText }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex flex-col h-full min-h-[calc(100vh-120px)]" style={{ color: c.text }}>
      <div className="flex-1 flex flex-col gap-6">

        {/* ==================== 1. DASHBOARD OVERVIEW CARDS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          {[
            { label: "Placement Readiness Score", val: "74%", icon: <Target className="text-amber-500" /> },
            { label: "Practice Streak", val: "7 Days", icon: <Flame className="text-orange-500" /> },
            { label: "Mock Tests Completed", val: `${completedMocksCount}`, icon: <CheckCircle2 className="text-emerald-500" /> },
            { label: "Average Accuracy", val: `${avgAccuracy}%`, icon: <Award className="text-cyan-500" /> }
          ].map((card, idx) => (
            <div key={idx} className="p-4 border rounded-xl flex items-center justify-between" style={{ background: c.cardBg, borderColor: c.border }}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>{card.label}</span>
                <span className="text-xl font-extrabold block" style={{ fontFamily: "'Outfit', sans-serif" }}>{card.val}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ==================== 2. NAVIGATION TABS ==================== */}
        <div className="flex justify-between items-center border-b shrink-0" style={{ borderColor: c.border }}>
          <div className="flex gap-2">
            {[
              { id: "aptitude" as const, label: "Aptitude Practice" },
              { id: "reasoning" as const, label: "Logical Reasoning" },
              { id: "mcqs" as const, label: "Technical MCQs" },
              { id: "mocks" as const, label: "Mock Tests" },
              { id: "readiness" as const, label: "Readiness Score" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPracticeSession(null); }}
                className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-colors -mb-[1px]`}
                style={{
                  color: tab === t.id ? c.primary : c.textSec,
                  borderColor: tab === t.id ? c.primary : "transparent"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
          >
            <Sparkles size={12} className="animate-pulse" /> AI Assistant
          </button>
        </div>

        {/* ==================== 3. CONTENT AREA ==================== */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {/* TAB A: APTITUDE PRACTICE */}
            {tab === "aptitude" && !practiceSession && (
              <motion.div
                key="aptitude-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 sm:grid-cols-5 gap-4"
              >
                {APTITUDE_TOPICS.map(item => (
                  <div
                    key={item.name}
                    onClick={() => handleStartPractice(item.name, "aptitude")}
                    className="p-5 border rounded-2xl text-center cursor-pointer hover:shadow-lg hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-3"
                    style={{ background: c.cardBg, borderColor: c.border }}
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-bold font-sans" style={{ color: c.text }}>{item.name}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* TAB B: LOGICAL REASONING */}
            {tab === "reasoning" && !practiceSession && (
              <motion.div
                key="reasoning-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 sm:grid-cols-5 gap-4"
              >
                {REASONING_TOPICS.map(item => (
                  <div
                    key={item.name}
                    onClick={() => handleStartPractice(item.name, "reasoning")}
                    className="p-5 border rounded-2xl text-center cursor-pointer hover:shadow-lg hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-3"
                    style={{ background: c.cardBg, borderColor: c.border }}
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-bold font-sans" style={{ color: c.text }}>{item.name}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* TAB C: TECHNICAL MCQS */}
            {tab === "mcqs" && !practiceSession && (
              <motion.div
                key="mcqs-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {TECHNICAL_TOPICS.map(item => (
                  <div
                    key={item.name}
                    onClick={() => handleStartPractice(item.name, "mcqs")}
                    className="p-5 border rounded-2xl text-center cursor-pointer hover:shadow-lg hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-3"
                    style={{ background: c.cardBg, borderColor: c.border }}
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-bold font-sans" style={{ color: c.text }}>{item.name}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* PRACTICE SESSION ACTIVE INTERFACE */}
            {practiceSession && (
              <motion.div
                key="practice-active"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 border rounded-2xl space-y-6"
                style={{ background: c.cardBg, borderColor: c.border }}
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: c.border }}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Practice Module</span>
                    <h3 className="text-sm font-extrabold" style={{ color: c.text }}>{practiceSession.topic}</h3>
                  </div>
                  <button
                    onClick={() => setPracticeSession(null)}
                    className="text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Exit Session
                  </button>
                </div>

                {/* Question Details */}
                <div className="space-y-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>
                    Question {practiceSession.currentIdx + 1} of {practiceSession.questions.length}
                  </div>
                  <p className="text-sm font-semibold leading-relaxed whitespace-pre-line" style={{ color: c.text }}>
                    {practiceSession.questions[practiceSession.currentIdx].text}
                  </p>

                  {/* Options List */}
                  <div className="space-y-2">
                    {practiceSession.questions[practiceSession.currentIdx].options.map((opt, oIdx) => {
                      const isSelected = practiceSession.selectedOptionIdx === oIdx;
                      const isCorrectAnswer = oIdx === practiceSession.questions[practiceSession.currentIdx].correctIdx;
                      const isSubmitted = practiceSession.submitted;

                      let optBg = "bg-white/5 border-white/10";
                      let optText = c.text;

                      if (isSelected) {
                        optBg = "bg-amber-500/10 border-amber-500/30";
                        optText = "var(--primary)";
                      }

                      if (isSubmitted) {
                        if (isCorrectAnswer) {
                          optBg = "bg-emerald-500/10 border-emerald-500/30";
                          optText = "#10b981";
                        } else if (isSelected) {
                          optBg = "bg-red-500/10 border-red-500/30";
                          optText = "#ef4444";
                        }
                      }

                      return (
                        <div
                          key={oIdx}
                          onClick={() => {
                            if (!isSubmitted) {
                              setPracticeSession(prev => {
                                if (!prev) return null;
                                return { ...prev, selectedOptionIdx: oIdx };
                              });
                            }
                          }}
                          className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${optBg}`}
                          style={{ color: optText }}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isCorrectAnswer && <CheckCircle2 size={14} className="text-emerald-500" />}
                          {isSubmitted && isSelected && !isCorrectAnswer && <XCircle size={14} className="text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Explanations & Action controls */}
                <div className="pt-4 border-t flex flex-wrap justify-between items-center gap-4" style={{ borderColor: c.border }}>
                  <div className="flex gap-2">
                    {!practiceSession.submitted ? (
                      <button
                        onClick={handlePracticeSubmit}
                        disabled={practiceSession.selectedOptionIdx === null}
                        className="py-2 px-4 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-40 transition-colors"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handlePracticeNext}
                        className="py-2 px-4 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors"
                      >
                        {practiceSession.currentIdx + 1 < practiceSession.questions.length ? "Next Question" : "Finish Practice"}
                      </button>
                    )}

                    {practiceSession.submitted && (
                      <button
                        onClick={() => setShowTrick(!showTrick)}
                        className="py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        style={{ borderColor: c.border }}
                      >
                        <Lightbulb size={13} className="text-amber-500" />
                        {showTrick ? "Show Solution" : "Show Trick/Shortcut"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Solution Box */}
                {practiceSession.submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 border rounded-xl space-y-2 text-xs leading-relaxed"
                    style={{ borderColor: c.border }}
                  >
                    {showTrick && practiceSession.questions[practiceSession.currentIdx].trick ? (
                      <>
                        <h4 className="font-extrabold text-amber-500 uppercase tracking-wider text-[10px]">AI Mathematical Shortcut:</h4>
                        <p style={{ color: c.textSec }}>{practiceSession.questions[practiceSession.currentIdx].trick}</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-extrabold text-emerald-500 uppercase tracking-wider text-[10px]">Step-by-step Solution:</h4>
                        <p style={{ color: c.textSec }}>{practiceSession.questions[practiceSession.currentIdx].explanation}</p>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* TAB D: MOCK TESTS */}
            {tab === "mocks" && !activeTest && (
              <motion.div
                key="mocks-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Reports Summary */}
                {testCompletedReport && (
                  <div className="p-5 border rounded-2xl bg-emerald-500/10 border-emerald-500/20 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Latest Mock Test Evaluation
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: c.textSec }}>
                      You completed the mock test with a score of **{testCompletedReport.score}%** ({testCompletedReport.correct}/{testCompletedReport.total} questions correct). We have adjusted your readiness indicators!
                    </p>
                  </div>
                )}

                {/* Mock lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {MOCK_MOCK_TESTS.map(test => (
                    <div
                      key={test.id}
                      className="p-5 border rounded-2xl flex flex-col justify-between"
                      style={{ background: c.cardBg, borderColor: c.border }}
                    >
                      <div className="space-y-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {test.company} Simulation
                        </span>
                        <h4 className="font-extrabold text-sm" style={{ color: c.text }}>{test.name}</h4>
                        <div className="text-[10px] space-y-1" style={{ color: c.textMuted }}>
                          <div>Duration: {test.durationMs / 60 / 1000} Minutes</div>
                          <div>Total Questions: {test.totalQuestions}</div>
                        </div>
                      </div>

                      <div className="mt-6 pt-3 border-t flex justify-end" style={{ borderColor: c.border }}>
                        <button
                          onClick={() => handleStartMockTest(test)}
                          className="py-1.5 px-3 rounded bg-amber-500 text-black hover:bg-amber-400 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Play size={10} className="fill-current" /> Launch Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ACTIVE MOCK TEST EXAM INTERFACE */}
            {activeTest && (
              <motion.div
                key="test-exam-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-[calc(100vh-130px)] rounded-2xl border"
                style={{ background: c.cardBg, borderColor: c.border }}
              >
                {/* Exam Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b shrink-0 bg-white/[0.01]" style={{ borderColor: c.border }}>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">Placement Assessment</span>
                    <h3 className="text-sm font-extrabold" style={{ color: c.text }}>{activeTest.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs font-black" style={{ color: testTimeRemaining < 5 * 60 * 1000 ? c.red : c.text }}>
                      <Clock size={14} /> {formatTime(testTimeRemaining)}
                    </div>
                    <button
                      onClick={() => handleEndMockTest(false)}
                      className="py-1.5 px-3 rounded bg-red-500/15 border border-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-500/25 transition-colors"
                    >
                      Finish Test
                    </button>
                  </div>
                </div>

                {/* Exam Sections & Questions */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {activeTest.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 border-b pb-2" style={{ borderColor: c.border }}>
                        Section: {sec.name}
                      </h4>
                      {sec.questions.map((q, qIdx) => (
                        <div key={q.id} className="space-y-3">
                          <p className="text-xs font-bold leading-relaxed whitespace-pre-line" style={{ color: c.text }}>
                            Q{qIdx + 1}. {q.text}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = testAnswers[q.id] === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  onClick={() => handleSelectMockAnswer(q.id, oIdx)}
                                  className={`p-2.5 border rounded-lg cursor-pointer transition-all text-xs font-semibold ${
                                    isSelected ? "bg-amber-500/15 border-amber-500/35 text-amber-500" : "bg-white/5 border-white/10"
                                  }`}
                                  style={isSelected ? {} : { color: c.textSec }}
                                >
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB E: READINESS SCORE */}
            {tab === "readiness" && (
              <motion.div
                key="readiness-dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Readiness Circular Ring Dashboard */}
                <div className="p-6 border rounded-2xl flex flex-col md:flex-row items-center gap-8 justify-around" style={{ background: c.cardBg, borderColor: c.border }}>
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" stroke="var(--border-color)" strokeWidth="10" fill="transparent" style={{ stroke: c.border }} />
                      <circle
                        cx="64" cy="64" r="54"
                        stroke={c.primary}
                        strokeWidth="10" fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - 0.74)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-extrabold" style={{ color: c.text }}>74%</span>
                      <span className="block text-[8px] uppercase tracking-wider" style={{ color: c.textMuted }}>Aggregate score</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center md:text-left">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                      Intermediate Prep Tier
                    </span>
                    <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Placement Readiness Analysis</h2>
                    <p className="text-xs leading-relaxed max-w-md" style={{ color: c.textSec }}>
                      Your stats show excellent programming core concepts, but need higher focus on quant (probability) and logical deduction frameworks to unlock top tier interview links.
                    </p>
                  </div>
                </div>

                {/* Readiness Breakdown list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category bars */}
                  <div className="p-5 border rounded-2xl space-y-4" style={{ background: c.cardBg, borderColor: c.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: c.text }}>Category Breakdown</h4>
                    {[
                      { label: "Technical Concepts", val: 85, color: "#10b981" },
                      { label: "Quantitative Aptitude", val: 68, color: "#f59e0b" },
                      { label: "Logical Reasoning", val: 72, color: "#06b6d4" },
                      { label: "Coding Algorithms", val: 80, color: "#8b5cf6" },
                      { label: "Communication Flow", val: 65, color: "#ec4899" }
                    ].map(bar => (
                      <div key={bar.label} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold" style={{ color: c.textSec }}>
                          <span>{bar.label}</span>
                          <span>{bar.val}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 border overflow-hidden" style={{ borderColor: c.border }}>
                          <div className="h-full rounded-full" style={{ width: `${bar.val}%`, background: bar.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Weak vs Strong topics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 border rounded-2xl space-y-3" style={{ background: c.cardBg, borderColor: c.border }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Strong Topics
                      </h4>
                      <ul className="space-y-1.5 text-xs font-semibold" style={{ color: c.textSec }}>
                        <li>• OOP / Programming Core</li>
                        <li>• Data Structures</li>
                        <li>• Percentages / Profit & Loss</li>
                        <li>• Coding Logic</li>
                      </ul>
                    </div>

                    <div className="p-5 border rounded-2xl space-y-3" style={{ background: c.cardBg, borderColor: c.border }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                        <XCircle size={14} /> Focus Topics
                      </h4>
                      <ul className="space-y-1.5 text-xs font-semibold" style={{ color: c.textSec }}>
                        <li>• Probability</li>
                        <li>• Permutations & Combos</li>
                        <li>• Syllogisms / Deduction</li>
                        <li>• Speech / Interview Confidence</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* AI Roadmap / Learning Path */}
                <div className="p-5 border rounded-2xl space-y-3 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                    <Sparkles size={14} /> AI Improvement Roadmap
                  </h4>
                  <ul className="space-y-2">
                    <li className="text-xs leading-relaxed flex items-start gap-2" style={{ color: c.textSec }}>
                      <span className="text-amber-500 font-bold">1.</span>
                      <span>Initiate a timed practice session for **Probability** under Aptitude to learn shortcut formulas.</span>
                    </li>
                    <li className="text-xs leading-relaxed flex items-start gap-2" style={{ color: c.textSec }}>
                      <span className="text-amber-500 font-bold">2.</span>
                      <span>Run a **TCS NQT placement simulation** mock test to evaluate section time management.</span>
                    </li>
                    <li className="text-xs leading-relaxed flex items-start gap-2" style={{ color: c.textSec }}>
                      <span className="text-amber-500 font-bold">3.</span>
                      <span>Access the **Interview Hub** once your readiness score crosses 80% to start behavioral checks.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ==================== 4. FLOATING CHAT SIDEBAR PANEL ==================== */}
      <AnimatePresence>
        {assistantOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-[70px] right-0 bottom-0 z-[190] w-80 border-l flex flex-col shadow-2xl"
            style={{ background: isDark ? "#0d1117" : "#ffffff", borderColor: c.border }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.text }}>AI Placement Coach</span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle size={14} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, idx) => {
                const isAI = msg.role === "assistant";
                return (
                  <div key={idx} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                        isAI
                          ? "bg-white/5 border border-white/10 rounded-tl-sm"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-tr-sm"
                      }`}
                      style={{ borderColor: c.border }}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-sm p-3 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500 animate-spin" />
                    <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Drafting response...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            <div className="p-3 border-t bg-white/[0.01] flex flex-col gap-1.5" style={{ borderColor: c.border }}>
              <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: c.textMuted }}>Suggestions</span>
              {[
                "Create a mock test for TCS",
                "Explain percentages shortcuts",
                "Generate SQL technical MCQs"
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setChatInput(s); }}
                  className="w-full text-left p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[10px] font-semibold truncate transition-colors"
                  style={{ borderColor: c.border, color: c.textSec }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input form */}
            <div className="p-3 border-t flex gap-1.5" style={{ borderColor: c.border }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask placement coach..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAssistantSend();
                }}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
              />
              <button
                onClick={handleAssistantSend}
                disabled={!chatInput.trim() || chatLoading}
                className="w-8 h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
              >
                <Send size={12} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
