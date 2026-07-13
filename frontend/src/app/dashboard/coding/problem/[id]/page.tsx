"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { toast } from "sonner";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import {
  Code2, Sparkles, BookMarked, MessageSquare, StickyNote,
  ChevronLeft, Play, Settings, AlertCircle, CheckCircle2,
  Maximize2, Minimize2, Info, Moon, Sun, Pin, PinOff,
  Trash2, Plus, Search, HelpCircle, ChevronRight, CornerDownRight,
  BookOpen, Terminal, Send, Clock, RefreshCw
} from "lucide-react";
import {
  FloatingOrbs,
  PremiumCard,
  PremiumButton,
  PremiumBadge,
  PremiumProgressBar
} from "@/components/ui/PremiumComponents";
import {
  DashboardSidebar,
  DashboardTopNav,
  AdyapanUser
} from "../../../user/page";
import { renderMarkdown } from "@/utils/renderMarkdown";

// Checklists for loading experience
const loadingSteps = [
  "Preparing workspace environment",
  "Initializing code execution context",
  "Restoring last saved session state",
  "Loading AI coaching models",
  "Configuring Monaco compilation tools"
];

const DEFAULT_CODE = {
  python: `# Write your python solution here\n\ndef solve():\n    pass\n`,
  cpp: `// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nvoid solve() {\n    \n}\n`,
  java: `// Write your Java solution here\npublic class Solution {\n    public static void solve() {\n        \n    }\n}\n`,
  javascript: `// Write your JavaScript solution here\nfunction solve() {\n    \n}\n`
};

export default function ProblemWorkspacePage() {
  useRequireAuth("USER");
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;

  // Shell Layout settings
  const [user, setUser] = useState<AdyapanUser | null>(null);
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Loading settings
  const [loading, setLoading] = useState(true);
  const [loadingIndex, setLoadingIndex] = useState(0);

  // Workspace Data
  const [problem, setProblem] = useState<any>(null);
  const [progress, setProgress] = useState<any>({
    status: "not_started",
    timeSpent: 0,
    bookmarked: false
  });
  const [notes, setNotes] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  // Panel settings (resizable)
  const [leftWidth, setLeftWidth] = useState(30); // percentages
  const [rightWidth, setRightWidth] = useState(30);
  const [activeTabLeft, setActiveTabLeft] = useState<"statement" | "notes" | "discussion">("statement");
  const containerRef = useRef<HTMLDivElement>(null);

  // Monaco options
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [minimap, setMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  // Notes options
  const [noteInput, setNoteInput] = useState("");
  const [searchNote, setSearchNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Discussion options
  const [discussionInput, setDiscussionInput] = useState("");

  // AI assistant options
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI DSA Coach. I am fully aware of this problem and your code structure. How can I guide you today? Use the quick action buttons below or type a custom question."
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [commonMistakes, setCommonMistakes] = useState<string[]>([]);

  // Code execution state
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [outputTab, setOutputTab] = useState<"input" | "output" | "testcases">("output");
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(30);

  // Time spent tracker
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Load User, Theme, Notifications
  useEffect(() => {
    const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(savedTheme);
    setEditorTheme(savedTheme === "dark" ? "vs-dark" : "light");
    document.documentElement.setAttribute("data-theme", savedTheme);

    try {
      const rawUser = localStorage.getItem("adyapan-user") || sessionStorage.getItem("adyapan-user");
      if (rawUser) {
        setUser(JSON.parse(rawUser));
      }
    } catch { /* ignore */ }

    api.get("/notifications?limit=5")
      .then(res => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.notifications?.filter((n: any) => !n.read).length || 0);
      })
      .catch(() => {});
  }, []);

  // Loading timer check-list simulation
  useEffect(() => {
    if (loadingIndex < loadingSteps.length) {
      const timer = setTimeout(() => {
        setLoadingIndex(prev => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    } else if (problemId && loading) {
      fetchWorkspaceData();
    }
  }, [loadingIndex, problemId, loading]);

  // Keep track of time spent active on page
  useEffect(() => {
    if (!loading) {
      timerRef.current = setInterval(() => {
        setTimeSpentSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [loading]);

  // Auto-Save code every 5 seconds
  useEffect(() => {
    if (loading || !problem) return;
    const saveTimer = setTimeout(() => {
      handleAutoSaveCode();
    }, 5000);
    return () => clearTimeout(saveTimer);
  }, [code, language, loading, problem]);

  const fetchWorkspaceData = async () => {
    try {
      const res = await api.get(`/coding/workspace/${problemId}`);
      const data = res.data;
      setProblem(data.question);
      setProgress(data.progress);
      setNotes(data.notes || []);
      setDiscussions(data.discussions || []);
      
      // Load restored session
      if (data.session) {
        setCode(data.session.codeContent);
        setLanguage(data.session.language);
      } else {
        setCode(DEFAULT_CODE[language as keyof typeof DEFAULT_CODE] || DEFAULT_CODE.python);
      }

      setLoading(false);
    } catch (err) {
      console.error("Workspace load error:", err);
      toast.error("Failed to load problem workspace data");
      router.push("/dashboard/coding");
    }
  };

  const handleAutoSaveCode = async () => {
    if (!problem) return;
    try {
      await api.post(`/coding/workspace/${problemId}/save`, {
        codeContent: code,
        language,
        status: progress.status === "solved" ? "solved" : "attempted",
        timeSpent: 5 // increment time spent by 5 seconds
      });
    } catch (err) {
      // Slient failure for auto save
      console.error("Auto save failed", err);
    }
  };

  const handleManualSaveCode = async () => {
    if (!problem) return;
    const savePromise = api.post(`/coding/workspace/${problemId}/save`, {
      codeContent: code,
      language,
      status: progress.status === "solved" ? "solved" : "attempted",
      timeSpent: 0
    });
    
    toast.promise(savePromise, {
      loading: "Saving code in Neon cloud...",
      success: "Workspace synced and backup saved!",
      error: "Failed to save code"
    });
  };

  // Toggle Theme
  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setEditorTheme(next === "dark" ? "vs-dark" : "light");
    localStorage.setItem("adyapan-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Bookmark Toggle
  const handleBookmarkToggle = async () => {
    if (!problem) return;
    const nextBookmarked = !progress.bookmarked;
    try {
      await api.post(`/coding/workspace/${problemId}/bookmark`, { bookmarked: nextBookmarked });
      setProgress((prev: any) => ({ ...prev, bookmarked: nextBookmarked }));
      toast.success(nextBookmarked ? "Problem bookmarked for revision!" : "Bookmark removed");
    } catch (err) {
      toast.error("Failed to update bookmark status");
    }
  };

  // Mark Solved
  const handleMarkSolved = async () => {
    if (!problem) return;
    try {
      await api.post(`/coding/workspace/${problemId}/save`, {
        codeContent: code,
        language,
        status: "solved",
        timeSpent: 0
      });
      setProgress((prev: any) => ({ ...prev, status: "solved", solved: true }));
      toast.success("Problem marked as Solved! Excellent work! 🎉");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Resizing hooks
  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 15 && newWidth < 50) {
        setLeftWidth(newWidth);
      }
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((rect.right - moveEvent.clientX) / rect.width) * 100;
      if (newWidth > 15 && newWidth < 50) {
        setRightWidth(newWidth);
      }
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const startResizeTerminal = (e: React.MouseEvent) => {
    e.preventDefault();
    const middlePanel = (e.target as HTMLElement).closest("[data-middle-panel]");
    if (!middlePanel) return;
    const handleMove = (moveEvent: MouseEvent) => {
      const rect = middlePanel.getBoundingClientRect();
      const newHeight = ((rect.bottom - moveEvent.clientY) / rect.height) * 100;
      if (newHeight > 10 && newHeight < 70) {
        setTerminalHeight(newHeight);
      }
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  // Notes operations
  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    try {
      const res = await api.post(`/coding/workspace/${problemId}/notes`, {
        id: editingNoteId || undefined,
        noteContent: noteInput
      });
      if (res.data.success) {
        if (editingNoteId) {
          setNotes(prev => prev.map(n => n.id === editingNoteId ? res.data.note : n));
          toast.success("Note updated!");
        } else {
          setNotes(prev => [res.data.note, ...prev]);
          toast.success("Note saved!");
        }
        setNoteInput("");
        setEditingNoteId(null);
      }
    } catch (err) {
      toast.error("Failed to save note");
    }
  };

  const handleTogglePinNote = async (note: any) => {
    try {
      const res = await api.post(`/coding/workspace/${problemId}/notes`, {
        id: note.id,
        noteContent: note.noteContent,
        pinned: !note.pinned
      });
      if (res.data.success) {
        setNotes(prev => prev.map(n => n.id === note.id ? res.data.note : n).sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
        toast.success(note.pinned ? "Note unpinned" : "Note pinned");
      }
    } catch (err) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await api.post(`/coding/workspace/${problemId}/notes`, { id, action: "delete" });
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Note deleted");
    } catch (err) {
      toast.error("Failed to delete note");
    }
  };

  // Discussion operations
  const handlePostDiscussion = async () => {
    if (!discussionInput.trim()) return;
    try {
      const res = await api.post(`/coding/workspace/${problemId}/discussion`, {
        message: discussionInput
      });
      if (res.data.success) {
        setDiscussions(prev => [...prev, res.data.discussion]);
        setDiscussionInput("");
        toast.success("Comment posted!");
      }
    } catch (err) {
      toast.error("Failed to post message");
    }
  };

  // AI Hint triggers
  const handleTriggerHint = async (hintIndex: number) => {
    if (activeHintIndex >= hintIndex) return; // already unlocked
    setAiGenerating(true);
    try {
      const res = await api.post(`/coding/workspace/${problemId}/hint`, { hintIndex });
      if (res.data.success) {
        setHints(prev => ({ ...prev, [hintIndex]: res.data.hint }));
        setActiveHintIndex(hintIndex);
        if (hintIndex === 3 && res.data.commonMistakes) {
          setCommonMistakes(res.data.commonMistakes);
        }
        
        // Append to AI chat conversation
        setMessages(prev => [
          ...prev,
          { role: "user", content: `Give me Hint ${hintIndex}` },
          { role: "assistant", content: `**Hint ${hintIndex}:** ${res.data.hint}` }
        ]);
        toast.success(`Hint ${hintIndex} unlocked!`);
      }
    } catch (err) {
      toast.error("Failed to unlock hint");
    } finally {
      setAiGenerating(false);
    }
  };

  // Custom AI prompt action
  const handleTriggerAIAction = async (type: string, actionLabel: string) => {
    setAiGenerating(true);
    setMessages(prev => [...prev, { role: "user", content: actionLabel }]);
    try {
      const res = await api.post(`/coding/workspace/${problemId}/explain`, {
        type,
        codeSnippet: code
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: "assistant", content: res.data.explanation }]);
      }
    } catch (err) {
      toast.error("AI Coach failed to generate analysis");
    } finally {
      setAiGenerating(false);
    }
  };

  // Custom chat message
  const handleSendCustomMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiInput("");
    setAiGenerating(true);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    
    try {
      const prompt = `Student Question: "${userMsg}"
Code currently written by student:
\`\`\`
${code}
\`\`\`
Answer the student's question based on the coding problem. Provide hints or feedback but do NOT give them the complete copy-paste solution immediately. Support their learning process.`;
      const res = await api.post(`/coding/workspace/${problemId}/explain`, {
        type: "custom",
        codeSnippet: prompt
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: "assistant", content: res.data.explanation }]);
      }
    } catch (err) {
      toast.error("AI Coach failed to reply");
    } finally {
      setAiGenerating(false);
    }
  };

  // Code execution handlers
  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setOutputTab("output");
    setOutput("");
    setShowTerminal(true);
    try {
      const res = await api.post(`/coding/workspace/${problemId}/run`, {
        code,
        language,
        stdin,
      });
      const data = res.data;
      if (data.success) {
        setOutput(data.output || "(No output)");
      } else {
        setOutput(data.error || data.output || "Execution failed");
      }
    } catch (err: any) {
      setOutput(err.response?.data?.error || err.message || "Failed to run code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setOutputTab("testcases");
    setTestResults([]);
    setShowTerminal(true);
    try {
      const res = await api.post(`/coding/workspace/${problemId}/submit`, {
        code,
        language,
      });
      const data = res.data;
      setTestResults(data.testResults || []);
      if (data.allPassed) {
        setProgress((prev: any) => ({ ...prev, status: "solved", solved: true }));
        toast.success(`All ${data.totalTests} test cases passed!`);
      } else {
        toast.warning(`${data.passedTests}/${data.totalTests} test cases passed`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse examples if present
  const renderExamples = () => {
    if (!problem?.examples) return null;
    let parsed: any[] = [];
    try {
      parsed = typeof problem.examples === 'string' ? JSON.parse(problem.examples) : problem.examples;
    } catch {
      return <pre className="text-xs bg-black/40 p-3 rounded-lg border border-[var(--border-color)] overflow-x-auto text-[var(--text-secondary)]">{JSON.stringify(problem.examples)}</pre>;
    }

    return (
      <div className="flex flex-col gap-4 mt-2">
        {parsed.map((ex: any, idx: number) => (
          <div key={idx} className="bg-black/40 p-4 rounded-xl border border-[var(--border-color)]">
            <p className="text-xs font-bold text-amber-500 mb-2">Example {idx + 1}:</p>
            <div className="flex flex-col gap-1.5 text-xs font-mono text-[var(--text-primary)]">
              <div><span className="text-[var(--text-secondary)]">Input:</span> {ex.input}</div>
              <div><span className="text-[var(--text-secondary)]">Output:</span> {ex.output}</div>
              {ex.explanation && (
                <div className="mt-1 text-[var(--text-secondary)] italic">
                  <span className="text-amber-500/80 font-semibold font-sans not-italic">Explanation:</span> {ex.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Filter notes
  const filteredNotes = notes.filter(n => 
    n.noteContent.toLowerCase().includes(searchNote.toLowerCase())
  );

  // Formatted TimeSpent
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComingSoon = () => toast.info("Coming soon!");
  const handleViewProfile = () => router.push("/profile");
  const handlePremium = () => router.push("/premium");
  const handleViewDashboard = () => router.push("/dashboard/user");
  const handleAdyChat = () => {
    localStorage.setItem("dashboard-active-view", "ady-chat");
    router.push("/dashboard/user");
  };
  const handleViewTool = (tool: string) => {
    localStorage.setItem("dashboard-active-view", tool);
    router.push("/dashboard/user");
  };



  // Active view layout shell
  return (
    <div className="relative overflow-hidden font-sans" style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      <FloatingOrbs />
      
      {/* Top Navbar */}
      <DashboardTopNav
        user={user}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onComingSoon={handleComingSoon}
        onViewProfile={handleViewProfile}
        onAdyChat={handleAdyChat}
        onViewTool={handleViewTool}
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadCount={unreadCount}
        onMarkAllRead={() => {}}
        onClearAll={() => {}}
        onPremium={handlePremium}
        onViewSettings={() => handleViewTool("settings")}
      />

      {/* Sidebar */}
      <DashboardSidebar
        onComingSoon={handleComingSoon}
        activeView="coding"
        onViewDashboard={handleViewDashboard}
        onViewTool={handleViewTool}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Three panel workspace container */}
      <main className="dash-main relative z-10 flex flex-col font-sans" style={{ height: "calc(100vh - 70px)", padding: 0 }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[70vh]">
            <div className="relative w-full max-w-md p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6"
              >
                <Code2 size={32} className="text-black" />
              </motion.div>
              
              <h2 className="text-xl font-black mb-1 bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-primary)]/70 bg-clip-text text-transparent">
                AI Problem Workspace
              </h2>
              <p className="text-[10px] text-amber-500 uppercase tracking-widest font-black mb-6">
                Building Developer Sandbox
              </p>

              <div className="w-full flex flex-col gap-3">
                {loadingSteps.map((step, idx) => {
                  const isDone = idx < loadingIndex;
                  const isCurrent = idx === loadingIndex;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs font-semibold py-1">
                      <span className={isDone ? "text-[var(--text-primary)]/40 line-through" : isCurrent ? "text-amber-500" : "text-[var(--text-primary)]/20"}>
                        {step}
                      </span>
                      <div>
                        {isDone ? (
                          <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10" />
                        ) : isCurrent ? (
                          <RefreshCw size={12} className="animate-spin text-amber-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[var(--border-color)]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Workspace Toolbar (Header) */}
        <div className="h-12 border-b border-[var(--border-color)] bg-black/35 backdrop-blur-md px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard/coding")}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5 transition"
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-[var(--border-color)]" />
            <h1 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-xs md:max-w-md flex items-center gap-2">
              <span>{problem?.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                problem?.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                problem?.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}>
                {problem?.difficulty}
              </span>
              {problem?.rating && (
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                  ★ {problem.rating}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Active timer badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-[var(--border-color)] rounded-full text-xs font-mono text-[var(--text-secondary)]">
              <Clock size={12} className="text-amber-500" />
              <span>{formatTime(timeSpentSeconds)}</span>
            </div>

            <button
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded-lg border transition ${
                progress.bookmarked 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
              }`}
              title="Bookmark Question"
            >
              <BookMarked size={14} />
            </button>

            <button
              onClick={handleManualSaveCode}
              className="text-xs bg-white/5 hover:bg-white/10 text-[var(--text-primary)] font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-color)] transition flex items-center gap-1.5"
            >
              <span>Sync Backup</span>
            </button>

            <button
              onClick={handleMarkSolved}
              className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-black px-4 py-1.5 rounded-lg shadow-lg shadow-emerald-500/10 transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} className="fill-black/10" />
              <span>Mark Solved</span>
            </button>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
          
          {/* Left panel (Problem Content, Notes, Discussion) */}
          <div 
            style={{ width: `${leftWidth}%` }} 
            className="flex flex-col border-r border-[var(--border-color)] bg-black/15 backdrop-blur-sm overflow-hidden"
          >
            {/* Tab header */}
            <div className="h-10 border-b border-[var(--border-color)] flex items-center px-4 bg-black/25">
              {[
                { id: "statement", label: "Problem", icon: BookOpen },
                { id: "notes", label: "My Notes", icon: StickyNote },
                { id: "discussion", label: "Discussion", icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTabLeft === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabLeft(tab.id as any)}
                    className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg transition font-semibold mr-1.5 ${
                      active 
                        ? "bg-white/5 text-[var(--text-primary)] border border-white/10" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon size={12} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth select-text">
              
              {/* Tab 1: Statement */}
              {activeTabLeft === "statement" && (
                <div className="flex flex-col gap-6">
                  {/* Metadata tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] bg-white/5 border border-white/10 text-[var(--text-secondary)] px-2.5 py-1 rounded-full font-semibold capitalize">
                      Topic: {problem?.topic}
                    </span>
                    <span className="text-[10px] bg-white/5 border border-white/10 text-[var(--text-secondary)] px-2.5 py-1 rounded-full font-semibold">
                      Source: {problem?.source}
                    </span>
                    {problem?.placementImportance && (
                      <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-black">
                        💼 Placements Key
                      </span>
                    )}
                    {problem?.interviewImportance && (
                      <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full font-black">
                        🎙 Interview Choice
                      </span>
                    )}
                  </div>

                  {/* Problem Description */}
                  <div className="prose prose-invert max-w-none text-sm text-[var(--text-secondary)] leading-relaxed space-y-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Description</h3>
                    <p className="whitespace-pre-line">{problem?.problemUrl ? `This problem is imported from Codeforces (${problem.externalId}). Link: ${problem.problemUrl}\n\n` : ""}{problem?.title}. Walk through the statements and build an optimal algorithm.</p>
                  </div>

                  {/* Constraints */}
                  <div className="flex flex-col gap-2 mt-2">
                    <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-500" />
                      <span>Constraints</span>
                    </h3>
                    <div className="bg-black/30 p-3 rounded-lg border border-[var(--border-color)] text-xs font-mono text-[var(--text-secondary)]">
                      {problem?.externalId ? "Codeforces Standard constraints (typically 1.0s limit, 256MB memory limit)." : "Standard execution constraints apply."}
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Examples</h3>
                    {renderExamples() || <p className="text-xs text-[var(--text-muted)] italic">No examples provided. Use AI Guidance to explain or discuss edge cases.</p>}
                  </div>
                </div>
              )}

              {/* Tab 2: Notes */}
              {activeTabLeft === "notes" && (
                <div className="flex flex-col gap-6">
                  {/* Note Creator */}
                  <div className="bg-white/5 border border-[var(--border-color)] p-4 rounded-2xl flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                      <span>{editingNoteId ? "Edit Note" : "Take New Note"}</span>
                      {editingNoteId && (
                        <button 
                          onClick={() => { setNoteInput(""); setEditingNoteId(null); }}
                          className="text-[10px] text-amber-500 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </h3>
                    <textarea
                      placeholder="Write observations, optimal ideas, or mistakes (Markdown supported)..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      rows={4}
                      className="w-full bg-black/40 border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      onClick={handleSaveNote}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl shadow-lg transition"
                    >
                      {editingNoteId ? "Update Note" : "Save Personal Note"}
                    </button>
                  </div>

                  {/* Note Search / List */}
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                      <input
                        placeholder="Search notes..."
                        value={searchNote}
                        onChange={(e) => setSearchNote(e.target.value)}
                        className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-white/20 transition"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      {filteredNotes.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-6">No notes matching query.</p>
                      ) : (
                        filteredNotes.map((note) => (
                          <div 
                            key={note.id} 
                            className={`p-4 border rounded-xl bg-black/25 flex flex-col gap-3 transition ${
                              note.pinned ? "border-amber-500/30 bg-amber-500/[0.02]" : "border-[var(--border-color)] hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                              <span>Saved {new Date(note.updatedAt).toLocaleDateString()}</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleTogglePinNote(note)}
                                  className={`hover:text-[var(--text-primary)] ${note.pinned ? "text-amber-500" : ""}`}
                                >
                                  {note.pinned ? <Pin size={12} /> : <PinOff size={12} />}
                                </button>
                                <button 
                                  onClick={() => { setEditingNoteId(note.id); setNoteInput(note.noteContent); }}
                                  className="hover:text-[var(--text-primary)]"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="hover:text-rose-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                              {note.noteContent}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Discussion */}
              {activeTabLeft === "discussion" && (
                <div className="flex flex-col gap-6">
                  {/* Discussion comment form */}
                  <div className="flex gap-2">
                    <input
                      placeholder="Ask a question or leave a note..."
                      value={discussionInput}
                      onChange={(e) => setDiscussionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostDiscussion()}
                      className="flex-1 bg-white/5 border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-white/20 transition"
                    />
                    <button
                      onClick={handlePostDiscussion}
                      className="p-2.5 bg-white/5 border border-[var(--border-color)] hover:bg-white/10 text-[var(--text-primary)] rounded-xl transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Comment List */}
                  <div className="flex flex-col gap-3">
                    {discussions.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-6">No discussions yet. Be the first to start the conversation!</p>
                    ) : (
                      discussions.map((disc) => (
                        <div key={disc.id} className="p-3 bg-white/5 border border-[var(--border-color)] rounded-xl flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xs font-black text-black shrink-0">
                            {user?.name?.charAt(0) || "S"}
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-[var(--text-primary)]">Student ({user?.name || "Anon"})</span>
                              <span className="text-[var(--text-muted)]">{new Date(disc.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                              {disc.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Left panel resize handler */}
          <div 
            onMouseDown={startResizeLeft}
            className="w-1 hover:w-1.5 bg-[var(--border-color)] hover:bg-amber-500/50 cursor-col-resize transition-all z-10 shrink-0"
          />

          {/* Middle panel (Code Editor + Terminal) */}
          <div data-middle-panel className="flex-1 flex flex-col overflow-hidden bg-black/5">
            {/* Editor config toolbar */}
            <div className="h-10 border-b border-[var(--border-color)] flex items-center justify-between px-4 bg-black/25">
              <div className="flex items-center gap-3">
                {/* Language Select */}
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setCode(DEFAULT_CODE[e.target.value as keyof typeof DEFAULT_CODE] || "");
                  }}
                  className="bg-white/5 text-xs text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 focus:outline-none focus:border-white/20 transition cursor-pointer"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC 17)</option>
                  <option value="java">Java (JDK 21)</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                </select>

                <div className="h-4 w-px bg-[var(--border-color)]" />

                {/* Minimap toggle */}
                <button
                  onClick={() => setMinimap(prev => !prev)}
                  className={`p-1.5 rounded-lg border transition ${minimap ? "bg-white/10 border-white/20 text-white" : "border-transparent text-[var(--text-secondary)] hover:text-white"}`}
                  title="Toggle Minimap"
                >
                  <Maximize2 size={12} />
                </button>

                {/* Word wrap toggle */}
                <button
                  onClick={() => setWordWrap(prev => !prev)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition font-semibold ${wordWrap ? "bg-white/10 border-white/20 text-white" : "border-transparent text-[var(--text-secondary)] hover:text-white"}`}
                >
                  Word Wrap
                </button>

                {/* Font size control */}
                <div className="flex items-center gap-1 border border-[var(--border-color)] bg-white/5 rounded-lg px-2 py-0.5 text-xs font-mono text-[var(--text-secondary)]">
                  <button onClick={() => setFontSize(prev => Math.max(10, prev - 1))} className="hover:text-white px-1">-</button>
                  <span>{fontSize}px</span>
                  <button onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="hover:text-white px-1">+</button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Auto-saved to Neon</span>
                </span>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden relative font-mono">
              <Editor
                height="100%"
                language={language}
                theme={editorTheme}
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  fontSize,
                  minimap: { enabled: minimap },
                  wordWrap: wordWrap ? "on" : "off",
                  lineNumbers: "on",
                  scrollbar: {
                    vertical: "auto",
                    horizontal: "auto"
                  },
                  automaticLayout: true,
                  padding: { top: 16 }
                }}
                loading={
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-dark)] z-10 text-[var(--text-secondary)] text-xs">
                    <RefreshCw size={24} className="animate-spin text-amber-500" />
                    <span>Loading Monaco Editor sandbox...</span>
                  </div>
                }
              />
            </div>

            {/* Terminal panel (resizable, toggleable) */}
            {showTerminal && (
              <>
                <div
                  onMouseDown={startResizeTerminal}
                  className="h-1 hover:h-1.5 bg-[var(--border-color)] hover:bg-amber-500/50 cursor-row-resize transition-all z-10 shrink-0"
                />
                <div style={{ height: `${terminalHeight}%` }} className="flex flex-col border-t border-[var(--border-color)] bg-black/30 shrink-0 overflow-hidden">
                  {/* Terminal header */}
                  <div className="h-8 border-b border-[var(--border-color)] flex items-center justify-between px-3 bg-black/30 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-amber-500" />
                      {(["input", "output", "testcases"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setOutputTab(tab)}
                          className={`text-[10px] px-2.5 py-1 rounded transition font-semibold ${
                            outputTab === tab
                              ? "bg-white/10 text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {tab === "input" ? "Input" : tab === "output" ? "Output" : "Test Cases"}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRun}
                        disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1.5 text-[10px] px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-[var(--text-muted)] text-black font-black rounded-lg transition"
                      >
                        {isRunning ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                        <span>{isRunning ? "Running..." : "Run"}</span>
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1.5 text-[10px] px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-white/10 disabled:text-[var(--text-muted)] text-black font-black rounded-lg transition"
                      >
                        {isSubmitting ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />}
                        <span>{isSubmitting ? "Judging..." : "Submit"}</span>
                      </button>
                      <button
                        onClick={() => setShowTerminal(false)}
                        className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                      >
                        <Minimize2 size={10} />
                      </button>
                    </div>
                  </div>
                  {/* Terminal content */}
                  <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                    {outputTab === "input" && (
                      <textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="Enter custom input (stdin)..."
                        className="w-full h-full bg-transparent text-emerald-400 placeholder-[var(--text-muted)] resize-none focus:outline-none"
                      />
                    )}
                    {outputTab === "output" && (
                      <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                        {isRunning ? (
                          <span className="flex items-center gap-2 text-amber-500">
                            <RefreshCw size={12} className="animate-spin" />
                            Executing on Piston engine...
                          </span>
                        ) : output ? (
                          output
                        ) : (
                          <span className="text-[var(--text-muted)]">Click "Run" to execute your code against custom input.</span>
                        )}
                      </pre>
                    )}
                    {outputTab === "testcases" && (
                      <div className="flex flex-col gap-2">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2 text-amber-500">
                            <RefreshCw size={12} className="animate-spin" />
                            Running against test cases...
                          </span>
                        ) : testResults.length === 0 ? (
                          <span className="text-[var(--text-muted)]">Click "Submit" to run against all test cases.</span>
                        ) : (
                          testResults.map((tr: any, i: number) => (
                            <div key={i} className={`p-2.5 rounded-lg border text-[10px] font-mono ${
                              tr.passed
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-rose-500/5 border-rose-500/20"
                            }`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                {tr.passed
                                  ? <CheckCircle2 size={12} className="text-emerald-500" />
                                  : <AlertCircle size={12} className="text-rose-500" />
                                }
                                <span className={`font-bold ${tr.passed ? "text-emerald-500" : "text-rose-500"}`}>
                                  Test Case {tr.testCase} {tr.passed ? "Passed" : "Failed"}
                                </span>
                              </div>
                              {!tr.passed && (
                                <div className="flex flex-col gap-1 text-[var(--text-secondary)]">
                                  <div><span className="text-[var(--text-muted)]">Input:</span> {tr.input}</div>
                                  <div><span className="text-[var(--text-muted)]">Expected:</span> {tr.expected}</div>
                                  <div><span className="text-rose-400">Got:</span> {tr.actual}</div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Run button bar when terminal is hidden */}
            {!showTerminal && (
              <div className="h-10 border-t border-[var(--border-color)] bg-black/25 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                  <Terminal size={14} className="text-amber-500" />
                  <span>Piston Code Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRun}
                    disabled={isRunning || isSubmitting}
                    className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-[var(--text-muted)] text-black font-bold px-4 py-1.5 rounded-lg transition"
                  >
                    {isRunning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                    <span>{isRunning ? "Running..." : "Run"}</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isRunning || isSubmitting}
                    className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 disabled:bg-white/10 disabled:text-[var(--text-muted)] text-black font-bold px-4 py-1.5 rounded-lg transition"
                  >
                    {isSubmitting ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                    <span>{isSubmitting ? "Judging..." : "Submit"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel resize handler */}
          <div 
            onMouseDown={startResizeRight}
            className="w-1 hover:w-1.5 bg-[var(--border-color)] hover:bg-amber-500/50 cursor-col-resize transition-all z-10 shrink-0"
          />

          {/* Right panel (AI assistant) */}
          <div 
            style={{ width: `${rightWidth}%` }} 
            className="flex flex-col border-l border-[var(--border-color)] bg-black/15 backdrop-blur-sm overflow-hidden"
          >
            {/* AI Assistant Header */}
            <div className="h-10 border-b border-[var(--border-color)] flex items-center justify-between px-4 bg-black/25">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Sparkles size={14} className="text-amber-500 animate-pulse" />
                <span>AI DSA Coach</span>
              </div>
              <PremiumBadge variant="amber">Coaching Mode</PremiumBadge>
            </div>

            {/* AI assistant messages viewport */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col gap-1.5 max-w-[85%] text-xs ${
                      msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black">
                      {msg.role === 'user' ? 'You' : 'Coach'}
                    </div>
                    <div 
                      className={`p-3.5 rounded-2xl leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-amber-500 text-black font-semibold rounded-tr-none whitespace-pre-line' 
                          : 'bg-white/5 border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none font-medium'
                      }`}
                    >
                      {msg.role === 'user' ? msg.content : renderMarkdown(msg.content, theme === "dark")}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {aiGenerating && (
                <div className="self-start flex flex-col gap-1.5 max-w-[80%] text-xs">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black">Coach</div>
                  <div className="p-3.5 bg-white/5 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span>Typing analysis...</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Action Widgets Panel */}
            <div className="border-t border-[var(--border-color)] bg-black/25 p-3 flex flex-col gap-3 z-10 shrink-0">
              
              {/* Progressive Hints system */}
              <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] text-amber-500 uppercase tracking-widest font-black flex items-center justify-between">
                  <span>Progressive Hint Scaffold</span>
                  <span>Unlocked {activeHintIndex}/3</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[1, 2, 3].map(idx => {
                    const unlocked = activeHintIndex >= idx;
                    const available = activeHintIndex + 1 === idx;
                    return (
                      <button
                        key={idx}
                        disabled={unlocked || !available || aiGenerating}
                        onClick={() => handleTriggerHint(idx)}
                        className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition flex items-center justify-center gap-1 ${
                          unlocked 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold" 
                            : available 
                              ? "bg-amber-500 hover:bg-amber-600 text-black shadow-md" 
                              : "bg-white/5 border border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed"
                        }`}
                      >
                        <span>Hint {idx}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fast Coach Action list */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Explain Problem", type: "problem" },
                  { label: "Explain Constraints", type: "constraints" },
                  { label: "Explain Example", type: "example" },
                  { label: "Discuss Edge Cases", type: "edge_cases" },
                  { label: "FAANG Interview Tips", type: "interview" },
                  { label: "Placements Context", type: "placement" }
                ].map(act => (
                  <button
                    key={act.type}
                    disabled={aiGenerating}
                    onClick={() => handleTriggerAIAction(act.type, act.label)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] px-2.5 py-1 rounded-full transition font-semibold"
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {/* Custom Chat Input */}
              <div className="flex gap-2">
                <input
                  placeholder="Ask the coach details about your code..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCustomMessage()}
                  disabled={aiGenerating}
                  className="flex-1 bg-black/40 border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition"
                />
                <button
                  onClick={handleSendCustomMessage}
                  disabled={aiGenerating}
                  className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-white/5 disabled:text-[var(--text-muted)] text-black rounded-xl transition"
                >
                  <Send size={14} />
                </button>
              </div>

            </div>

          </div>

        </div>
        </>
        )}
      </main>
    </div>
  );
}
