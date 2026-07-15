"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Bug,
  Lightbulb,
  FolderKanban,
  Send,
  Code,
  Loader2,
  Sparkles,
  ArrowRight,
  Plus,
  Search,
  Trash2,
  Clock,
  Upload,
  Download,
  Check,
  FileCode,
  ChevronDown,
  CheckSquare,
  AlertTriangle,
  Cpu,
  Copy,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { renderMarkdown } from "@/utils/renderMarkdown";
import { ChatBackground } from "@/components/ady-chat/ChatBackground";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

type Mode = "generate" | "debug" | "explain" | "project";

interface CodingMessage {
  id: string;
  role: "user" | "assistant";
  content: string; // User prompt or raw assistant text
  result?: any; // Parsed JSON result for specialized visual layouts
  codeSnippet?: string; // Cache code snippet for user messages
  errorMsg?: string; // Cache error message for user messages
}

interface CodingSession {
  id: string;
  title: string;
  mode: Mode;
  messages: CodingMessage[];
  createdAt: string;
  updatedAt: string;
}

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

  return { theme, isDark: theme === "dark" };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CodingAssistantView() {
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sessions state (client-side persisted)
  const [sessions, setSessions] = useState<CodingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Composer Input state
  const [mode, setMode] = useState<Mode>("generate");
  const [input, setInput] = useState("");
  const [secondaryInput, setSecondaryInput] = useState(""); // Error message for debug
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // ─── Setup and Session Management ──────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem("adyapan-coding-sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          setMode(parsed[0].mode);
        }
      } catch (e) {
        console.error("Failed to load coding sessions:", e);
      }
    } else {
      // Create initial helper session
      const initial: CodingSession = {
        id: `coding-${Date.now()}`,
        title: "Code Generator Helper",
        mode: "generate",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions([initial]);
      setActiveSessionId(initial.id);
      localStorage.setItem("adyapan-coding-sessions", JSON.stringify([initial]));
    }
  }, []);

  const saveSessions = (updated: CodingSession[]) => {
    setSessions(updated);
    localStorage.setItem("adyapan-coding-sessions", JSON.stringify(updated));
  };

  const handleNewSession = useCallback((initialMode: Mode = "generate") => {
    const modeTitles: Record<Mode, string> = {
      generate: "Code Generator Helper",
      debug: "Code Debugger Helper",
      explain: "Code Explainer Helper",
      project: "Project Planner Helper",
    };
    const newSession: CodingSession = {
      id: `coding-${Date.now()}`,
      title: modeTitles[initialMode],
      mode: initialMode,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    setMode(initialMode);
    setInput("");
    setSecondaryInput("");
  }, [sessions]);

  const handleDeleteSession = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setMode(updated[0].mode);
      } else {
        setActiveSessionId(null);
      }
    }
  }, [sessions, activeSessionId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setMode(session.mode);
      setInput("");
      setSecondaryInput("");
    }
  }, [sessions]);

  const handleModeTabChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) {
      handleNewSession(newMode);
      return;
    }

    // If the active session is empty, we can safely update its mode
    if (currentSession.messages.length === 0) {
      const modeTitles: Record<Mode, string> = {
        generate: "Code Generator Helper",
        debug: "Code Debugger Helper",
        explain: "Code Explainer Helper",
        project: "Project Planner Helper",
      };
      const updated = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            mode: newMode,
            title: modeTitles[newMode],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      saveSessions(updated);
    } else {
      // If active session has messages, switch to an empty session in that mode if it exists, otherwise create a new one
      const emptySessionOfMode = sessions.find((s) => s.mode === newMode && s.messages.length === 0);
      if (emptySessionOfMode) {
        setActiveSessionId(emptySessionOfMode.id);
        setInput("");
        setSecondaryInput("");
      } else {
        handleNewSession(newMode);
      }
    }
  }, [sessions, activeSessionId, handleNewSession]);

  // Scroll to bottom of chat
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, generating]);

  // ─── API Submission handler ────────────────────────────────────────────────

  const canSubmit = input.trim().length > 0 && (mode !== "debug" || secondaryInput.trim().length > 0);

  const handleRunAI = async () => {
    if (!canSubmit || generating) return;
    setGenerating(true);

    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession) return;

    // Create user message
    const userMsg: CodingMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: mode === "debug"
        ? `Error: ${secondaryInput}\n\nCodeSnippet:\n${input}`
        : mode === "explain"
        ? `Explain Code:\n${input}`
        : input,
      codeSnippet: (mode === "debug" || mode === "explain") ? input : undefined,
      errorMsg: mode === "debug" ? secondaryInput : undefined,
    };

    // Temporarily add user message
    const updatedMessages = [...activeSession.messages, userMsg];
    let updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: updatedMessages,
          // Update title if it's the first message
          title: s.messages.length === 0 ? input.slice(0, 45) + (input.length > 45 ? "..." : "") : s.title,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    setInput("");
    setSecondaryInput("");

    try {
      const payload: Record<string, string> = {};
      let endpoint = "";

      if (mode === "generate") {
        payload.prompt = userMsg.content;
        endpoint = "/coding/generate";
      } else if (mode === "project") {
        payload.projectName = userMsg.content;
        endpoint = "/coding/project";
      } else if (mode === "explain") {
        payload.codeSnippet = userMsg.codeSnippet || "";
        endpoint = "/coding/explain";
      } else if (mode === "debug") {
        payload.errorMsg = userMsg.errorMsg || "";
        payload.codeSnippet = userMsg.codeSnippet || "";
        endpoint = "/coding/debug";
      }

      const res = await api.post(endpoint, payload);
      const data = res.data?.result ?? res.data;

      if (!data) {
        throw new Error("No data returned from AI assistant");
      }

      // Add assistant message
      const aiMsg: CodingMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "Structured result generated.",
        result: data,
      };

      updatedSessions = updatedSessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, aiMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      saveSessions(updatedSessions);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to call AI developer.";
      toast.error(msg);

      // Add error assistant message
      const errMsg: CodingMessage = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: `Error: ${msg}`,
      };
      updatedSessions = updatedSessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, errMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      saveSessions(updatedSessions);
    } finally {
      setGenerating(false);
    }
  };

  // ─── File Upload Handler ────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInput(text);
        toast.success(`Loaded file: ${file.name}`);
        // If mode is generate/project, switch to explain code
        if (mode === "generate" || mode === "project") {
          handleModeTabChange("explain");
        }
      }
    };
    reader.readAsText(file);
  };

  // ─── Quick Suggestion click ───────────────────────────────────────────────

  const handleSuggestionClick = (prompt: string, errorPrompt?: string) => {
    setInput(prompt);
    if (errorPrompt) {
      setSecondaryInput(errorPrompt);
    }
  };

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const messages = currentSession?.messages || [];
  const hasMessages = messages.length > 0 || generating;

  // Sidebar styling config
  const sidebarBg = isDark ? "rgba(8,6,20,0.95)" : "rgba(255,255,255,0.96)";
  const sidebarBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const primaryText = isDark ? "#ffffff" : "#0f172a";
  const mutedText = isDark ? "rgba(255,255,255,0.6)" : "#5f6368";
  const secText = isDark ? "rgba(255,255,255,0.65)" : "#475569";
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  // Modes config definitions
  const tabs = [
    { id: "generate", label: "Generate Code", icon: Code, color: "#10b981", activeColor: "rgba(16,185,129,0.15)", hoverBorder: "rgba(16,185,129,0.3)" },
    { id: "debug", label: "Debug Code", icon: Bug, color: "#f43f5e", activeColor: "rgba(244,63,94,0.15)", hoverBorder: "rgba(244,63,94,0.3)" },
    { id: "explain", label: "Explain Code", icon: Lightbulb, color: "#f59e0b", activeColor: "rgba(245,158,17,0.15)", hoverBorder: "rgba(245,158,17,0.3)" },
    { id: "project", label: "Plan Project", icon: FolderKanban, color: "#0ea5e9", activeColor: "rgba(14,165,233,0.15)", hoverBorder: "rgba(14,165,233,0.3)" },
  ];

  const currentTab = tabs.find((t) => t.id === mode) || tabs[0];

  const suggestions = {
    generate: [
      { text: "Debounced search React hook", prompt: "Write a high-performance debounced search React hook with clean cleanup handler and TypeScript declarations." },
      { text: "Express API JWT auth middleware", prompt: "Create an Express JS middleware that parses a Bearer JWT token, handles expired tokens gracefully, and attaches the user payload to req.user." },
      { text: "Tailwind responsive grid table", prompt: "Generate a responsive CSS grid table layout using TailwindCSS that folds down to single column cards on small viewports." },
    ],
    debug: [
      { text: "Cannot read properties of null ('map')", error: "TypeError: Cannot read properties of null (reading 'map')", prompt: "function UserList({ users }) {\n  return (\n    <ul>\n      {users.map(u => <li key={u.id}>{u.name}</li>)}\n    </ul>\n  );\n}" },
      { text: "useEffect memory leak warning", error: "Warning: Can't perform a React state update on an unmounted component.", prompt: "useEffect(() => {\n  async function loadData() {\n    const res = await fetch('/api/user');\n    const data = await res.json();\n    setUser(data);\n  }\n  loadData();\n}, []);" },
      { text: "Node HTTP server CORS rejected", error: "Access to fetch at 'api.local' from origin has been blocked by CORS policy", prompt: "const http = require('http');\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'application/json' });\n  res.end(JSON.stringify({ status: 'ok' }));\n});\nserver.listen(5000);" },
    ],
    explain: [
      { text: "JS closure execution context", prompt: "function createCounter() {\n  let count = 0;\n  return {\n    increment() { return ++count; },\n    get() { return count; }\n  };\n}" },
      { text: "Binary search divide & conquer", prompt: "function binarySearch(arr, val) {\n  let left = 0, right = arr.length - 1;\n  while(left <= right) {\n    let mid = Math.floor((left + right) / 2);\n    if(arr[mid] === val) return mid;\n    else if(arr[mid] < val) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}" },
      { text: "Custom Redux dispatch middleware", prompt: "const loggerMiddleware = store => next => action => {\n  console.log('dispatching', action);\n  let result = next(action);\n  console.log('next state', store.getState());\n  return result;\n};" },
    ],
    project: [
      { text: "Real-time painting canvas plan", prompt: "Real-time collaborative drawing canvas using HTML5 canvas and WebSockets." },
      { text: "SaaS Multi-tenant e-commerce backend", prompt: "Scalable e-commerce SaaS API serving multiple merchants with isolation, catalog indexing, and payment gateway webhooks." },
      { text: "Serverless image optimize pipeline", prompt: "Event-driven serverless workflow that listens to cloud storage bucket uploads, compresses images, makes webp copy, and updates DB." },
    ],
  };

  return (
    <div
      className="relative flex overflow-hidden w-full h-full"
      style={{
        background: isDark ? "#070715" : "#f0f4ff",
        color: primaryText,
      }}
    >
      {/* star backdrop */}
      <ChatBackground isDark={isDark} />

      {/* Floating hamburger for closed sidebar */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            key="side-open"
            className="absolute top-3 left-3 z-30 flex items-center justify-center rounded-lg"
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#000",
              boxShadow: "0 2px 10px rgba(245,158,11,0.3)",
            }}
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className="flex flex-1 overflow-hidden relative z-10 w-full h-full">
        
        {/* Left Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 flex flex-col overflow-hidden h-full"
              style={{
                background: sidebarBg,
                borderRight: `1px solid ${sidebarBorder}`,
                backdropFilter: "blur(20px)",
                position: "relative",
                zIndex: 10,
              }}
            >
              {/* Header row */}
              <div className="p-3 space-y-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#000",
                      boxShadow: "0 2px 10px rgba(245,158,11,0.3)",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    title="Close sidebar"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor" />
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                      <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={() => handleNewSession(mode)}
                    className="flex-1 h-10 flex items-center justify-center gap-1.5 px-3 rounded-xl font-semibold text-xs transition-all border"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      color: primaryText,
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    }}
                    whileHover={{ scale: 1.02, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Plus className="w-3.5 h-3.5" style={{ color: currentTab.color }} />
                    <span style={{ fontFamily: "'Outfit', sans-serif" }}>New Assistant</span>
                  </motion.button>
                </div>

                {/* Sidebar Search */}
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    borderColor: sidebarBorder,
                  }}
                >
                  <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mutedText }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search developers..."
                    className="flex-1 bg-transparent border-none outline-none text-xs"
                    style={{ color: primaryText }}
                  />
                </div>
              </div>

              {/* Sessions list */}
              <div className="flex-1 overflow-y-auto px-2 pb-2">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Terminal className="w-6 h-6 mb-2" style={{ color: mutedText }} />
                    <div className="text-xs font-semibold" style={{ color: primaryText }}>No helpers yet</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessions
                      .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((session, i) => {
                        const sTab = tabs.find((t) => t.id === session.mode) || tabs[0];
                        const sIcon = sTab.icon;
                        const sIconColor = sTab.color;
                        const isActive = activeSessionId === session.id;

                        return (
                          <motion.div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer group relative border"
                            style={{
                              background: isActive ? `${sIconColor}12` : "transparent",
                              borderColor: isActive ? `${sIconColor}40` : "transparent",
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            whileHover={{ background: isActive ? `${sIconColor}18` : hoverBg, x: 2 }}
                          >
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${sIconColor}18` }}
                            >
                              {React.createElement(sIcon, { className: "w-3.5 h-3.5", style: { color: sIconColor } })}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div
                                className="text-[11px] font-semibold truncate"
                                style={{ color: isActive ? sIconColor : primaryText }}
                              >
                                {session.title}
                              </div>
                              <div className="text-[9px] flex items-center gap-1 mt-0.5" style={{ color: mutedText }}>
                                <Clock className="w-2 h-2" />
                                {new Date(session.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </div>
                            </div>

                            {/* Delete session button */}
                            <motion.button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </motion.button>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Sidebar bottom */}
              <div
                className="p-3 mt-auto border-t flex items-center gap-2"
                style={{ borderColor: sidebarBorder }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: `${currentTab.color}15`, border: `1px solid ${currentTab.color}30` }}
                >
                  <Cpu className="w-4 h-4" style={{ color: currentTab.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">active engine</div>
                  <div className="text-xs font-semibold truncate" style={{ color: currentTab.color }}>
                    Developer {currentTab.label}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Right Chat Panel */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          
          {/* Top Tabs selector */}
          <div className="p-3 border-b flex items-center justify-between gap-4 flex-wrap z-10" style={{ borderColor: sidebarBorder }}>
            <div className="flex items-center gap-2 ml-10 lg:ml-0">
              <span className="font-semibold text-sm tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Developer Copilot
              </span>
              <div className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Online
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex items-center gap-1.5 bg-black/15 p-1 rounded-xl border" style={{ borderColor: sidebarBorder }}>
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = mode === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleModeTabChange(tab.id as Mode)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: isActive ? tab.activeColor : "transparent",
                      color: isActive ? tab.color : mutedText,
                    }}
                    whileHover={{ scale: 1.02, color: tab.color }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label.split(" ")[0]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Main conversation scrolling space */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            {!hasMessages ? (
              // Welcome greeting panel
              <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center py-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
                  style={{
                    background: `linear-gradient(135deg, ${currentTab.color}30, #080614)`,
                    border: `1.5px solid ${currentTab.color}60`,
                    boxShadow: `0 0 25px ${currentTab.color}25`,
                  }}
                >
                  {React.createElement(currentTab.icon, { className: "w-8 h-8", style: { color: currentTab.color } })}
                  <motion.div
                    className="absolute -inset-0.5 rounded-2xl blur-md"
                    style={{ background: currentTab.color, zIndex: -1, opacity: 0.15 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                </motion.div>

                <h1 className="text-3xl font-extrabold text-center tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Adyapan <span style={{ color: currentTab.color }}>{currentTab.label}</span>
                </h1>
                <p className="text-sm text-center max-w-md mb-8" style={{ color: secText }}>
                  Create setup guides, debug runtime issues, breakdown complex logic, and organize roadmaps with optimized LLM pipelines.
                </p>

                {/* Suggestions Grid */}
                <div className="grid gap-3 sm:grid-cols-3 w-full">
                  {suggestions[mode].map((s, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSuggestionClick(s.prompt, s.error)}
                      className="text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between h-28"
                      style={{
                        background: isDark ? "rgba(8,6,20,0.4)" : "rgba(255,255,255,0.5)",
                        borderColor: sidebarBorder,
                      }}
                      whileHover={{
                        scale: 1.02,
                        borderColor: currentTab.color + "50",
                        boxShadow: `0 4px 14px ${currentTab.color}10`,
                        background: isDark ? "rgba(8,6,20,0.6)" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      <div className="font-semibold mb-2" style={{ color: primaryText }}>
                        {s.text}
                      </div>
                      <div className="flex items-center justify-between text-[10px] w-full" style={{ color: mutedText }}>
                        <span>Try now</span>
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: currentTab.color }} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat conversation log
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => (
                  <div key={msg.id} className="flex gap-4">
                    
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
                      style={{
                        background: msg.role === "user"
                          ? hoverBg
                          : `linear-gradient(135deg, ${currentTab.color}25, ${currentTab.color}05)`,
                        borderColor: msg.role === "user"
                          ? sidebarBorder
                          : currentTab.color + "40",
                      }}
                    >
                      {msg.role === "user" ? (
                        <span className="text-[10px] font-bold uppercase">Me</span>
                      ) : (
                        React.createElement(currentTab.icon, { className: "w-4 h-4", style: { color: currentTab.color } })
                      )}
                    </div>

                    {/* Content Box */}
                    <div className="flex-1 min-w-0">
                      {msg.role === "user" ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium leading-relaxed" style={{ color: primaryText }}>
                            {msg.errorMsg ? `Debug prompt: ${msg.content.split("\n")[0]}` : msg.content}
                          </p>

                          {/* Code Snippet accordion */}
                          {msg.codeSnippet && (
                            <CodeAccordion code={msg.codeSnippet} isDark={isDark} />
                          )}
                          {msg.errorMsg && (
                            <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl flex gap-2 items-start max-w-2xl">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              <div className="text-[11px] font-mono text-red-300 leading-normal">{msg.errorMsg}</div>
                            </div>
                          )}
                        </div>
                      ) : msg.result ? (
                        // Special parsed tabbed assistants views
                        <div className="space-y-4">
                          {mode === "generate" && <GenerateResultView result={msg.result} isDark={isDark} />}
                          {mode === "debug" && <DebugResultView result={msg.result} isDark={isDark} />}
                          {mode === "explain" && <ExplainResultView result={msg.result} isDark={isDark} />}
                          {mode === "project" && <ProjectResultView result={msg.result} isDark={isDark} />}
                        </div>
                      ) : (
                        // Standard markdown response (errors, stubs)
                        <div className="text-sm leading-relaxed text-slate-300">
                          {renderMarkdown(msg.content, isDark)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking / generating state */}
                {generating && (
                  <div className="flex gap-4">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{
                        background: `${currentTab.color}15`,
                        borderColor: currentTab.color + "30",
                      }}
                    >
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: currentTab.color }} />
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-400">Developer assistant is compiling...</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messageEndRef} />
              </div>
            )}
          </div>

          {/* Bottom input area (Composer) */}
          <div
            className="p-4 flex-shrink-0 z-10 border-t"
            style={{
              background: isDark
                ? "linear-gradient(to top, rgba(7,7,21,0.98) 80%, transparent 100%)"
                : "linear-gradient(to top, rgba(240,244,255,0.98) 80%, transparent 100%)",
              borderColor: sidebarBorder,
            }}
          >
            <div className="max-w-4xl mx-auto">
              <div
                className="rounded-2xl border p-2 flex flex-col relative transition-all"
                style={{
                  background: isDark ? "rgba(8,6,20,0.6)" : "rgba(255,255,255,0.8)",
                  borderColor: currentTab.color + "25",
                  boxShadow: `0 4px 20px ${currentTab.color}05`,
                }}
              >
                {/* Secondary input if debug mode */}
                {mode === "debug" && (
                  <input
                    value={secondaryInput}
                    onChange={(e) => setSecondaryInput(e.target.value)}
                    placeholder="Enter the error message or crash log here..."
                    className="w-full bg-transparent outline-none border-b border-white/5 py-2 px-3 text-xs font-mono mb-2"
                    style={{ color: primaryText }}
                  />
                )}

                {/* Primary input (prompt or code snippet) */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "debug"
                      ? "Paste the code snippet that caused the error..."
                      : mode === "explain"
                      ? "Paste the code snippet you want analyzed..."
                      : mode === "generate"
                      ? "Describe the code feature or utility you want to generate..."
                      : "Describe the project you want to plan (e.g. system name, key features)..."
                  }
                  className="w-full bg-transparent outline-none py-2 px-3 text-sm min-h-[50px] max-h-[220px] resize-none font-mono"
                  style={{ color: primaryText }}
                  rows={mode === "debug" || mode === "explain" ? 4 : 2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleRunAI();
                    }
                  }}
                />

                {/* Action Row */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                  
                  {/* File Upload Trigger */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".js,.jsx,.ts,.tsx,.json,.py,.java,.cpp,.h,.cs,.html,.css,.md"
                    />
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center w-8 h-8 rounded-xl"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Upload local code file"
                    >
                      <Upload className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    </motion.button>

                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold" style={{ background: `${currentTab.color}15`, color: currentTab.color }}>
                      {currentTab.label}
                    </div>
                  </div>

                  {/* Send Button */}
                  <motion.button
                    onClick={handleRunAI}
                    disabled={!canSubmit || generating}
                    className="flex items-center justify-center rounded-xl font-bold text-xs"
                    style={{
                      width: 32,
                      height: 32,
                      background: currentTab.color,
                      color: "#000",
                      boxShadow: `0 4px 12px ${currentTab.color}35`,
                      cursor: !canSubmit || generating ? "not-allowed" : "pointer",
                      opacity: !canSubmit || generating ? 0.5 : 1,
                    }}
                    whileHover={canSubmit && !generating ? { scale: 1.05 } : {}}
                    whileTap={canSubmit && !generating ? { scale: 0.95 } : {}}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </motion.button>
                </div>
              </div>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Press Enter to run. Shift+Enter for newline. Supports uploading local JavaScript/TypeScript/Python source files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

// Collapsible user code snippet accordion
function CodeAccordion({ code, isDark }: { code: string; isDark: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-white/5 bg-black/40 rounded-xl overflow-hidden max-w-3xl">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-mono text-slate-300">Code Snippet ({code.split("\n").length} lines)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/10 transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span className="text-[9px] text-slate-400">{copied ? "Copied" : "Copy"}</span>
          </button>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <pre className="p-3 overflow-x-auto text-[11px] font-mono text-cyan-200 leading-normal max-h-60">
              {code}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 📄 GENERATE MODE RESULTS VIEW
function GenerateResultView({ result, isDark }: { result: any; isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<"code" | "structure" | "setup">("code");
  const [copied, setCopied] = useState(false);

  const codeString = result.code || "";

  // Extract clean code block from markdown blocks if returned
  const cleanCode = codeString.startsWith("```")
    ? codeString.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "")
    : codeString;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cleanCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "solution.code";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden shadow-2xl">
      {/* Tabs list */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/35 border-b border-white/10">
        <div className="flex gap-2">
          {(["code", "structure", "setup"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                activeTab === tab
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "code" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-1.5 text-[10px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span className="text-slate-300">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center text-[10px]"
              title="Download file"
            >
              <Download className="w-3 h-3 text-slate-300" />
            </button>
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div className="p-4 min-h-[160px]">
        {activeTab === "code" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-semibold uppercase tracking-wider">
              <FileCode className="w-3.5 h-3.5" /> Source Code
            </div>
            {/* Renders via markdown rendering to preserve highlight styling */}
            <div className="overflow-x-auto text-[11px] font-mono leading-relaxed bg-black/60 p-4 rounded-xl border border-white/5">
              {renderMarkdown(codeString.startsWith("```") ? codeString : `\`\`\`tsx\n${codeString}\n\`\`\``, isDark)}
            </div>
          </div>
        )}

        {activeTab === "structure" && (
          <div className="space-y-3">
            <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
              📁 Project Tree
            </div>
            <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/60 p-4 text-xs text-slate-300 font-mono">
              {result.folderStructure || "No structure defined."}
            </pre>
          </div>
        )}

        {activeTab === "setup" && (
          <div className="space-y-2">
            <div className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider mb-2">
              ⚙️ Setup Guide
            </div>
            <div className="text-sm leading-relaxed text-slate-300">
              {renderMarkdown(result.setupGuide || "No guide provided.", isDark)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🐞 DEBUG MODE RESULTS VIEW
function DebugResultView({ result, isDark }: { result: any; isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<"diagnosis" | "fixed">("diagnosis");
  const [copied, setCopied] = useState(false);

  const fixedString = result.fixedCode || "";
  const cleanCode = fixedString.startsWith("```")
    ? fixedString.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "")
    : fixedString;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-black/35 border-b border-white/10">
        <div className="flex gap-2">
          {(["diagnosis", "fixed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                activeTab === tab
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "diagnosis" ? "🐞 Diagnosis" : "🔧 Fixed Code"}
            </button>
          ))}
        </div>

        {activeTab === "fixed" && (
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-1.5 text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span className="text-slate-300">{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>

      <div className="p-4">
        {activeTab === "diagnosis" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wide mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Identified Issue
              </div>
              <p className="text-sm text-red-100">{result.issue || "No issue identified."}</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                <Info className="w-3.5 h-3.5" /> Root Cause Analysis
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.rootCause || "No root cause defined."}</p>
            </div>
          </div>
        )}

        {activeTab === "fixed" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
              <FileCode className="w-3.5 h-3.5" /> Resolved Code Implementation
            </div>
            <div className="overflow-x-auto text-[11px] font-mono leading-relaxed bg-black/60 p-4 rounded-xl border border-white/5">
              {renderMarkdown(fixedString.startsWith("```") ? fixedString : `\`\`\`tsx\n${fixedString}\n\`\`\``, isDark)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 💡 EXPLAIN MODE RESULTS VIEW
function ExplainResultView({ result, isDark }: { result: any; isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "complexity">("breakdown");

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-black/35 border-b border-white/10">
        <div className="flex gap-2">
          {(["breakdown", "complexity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                activeTab === tab
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "breakdown" ? "💡 Breakdown" : "⚡ Complexity"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === "breakdown" && (
          <div className="space-y-2 leading-relaxed text-sm text-slate-300">
            <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider mb-2">
              Line-By-Line Analysis
            </div>
            {renderMarkdown(result.explanation || "No explanation provided.", isDark)}
          </div>
        )}

        {activeTab === "complexity" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Complexity</span>
                <span className="text-2xl font-black text-amber-400 font-mono my-2">
                  {result.complexity?.split(";")[0] || result.complexity || "O(N)"}
                </span>
                <span className="text-[10px] text-slate-500">Based on operation execution scaling factor.</span>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Space Complexity</span>
                <span className="text-2xl font-black text-cyan-400 font-mono my-2">
                  {result.complexity?.split(";")[1] || "O(1)"}
                </span>
                <span className="text-[10px] text-slate-500">Based on auxiliary storage allocation demands.</span>
              </div>
            </div>

            <div className="p-3 border border-white/5 bg-white/5 rounded-xl text-xs flex gap-2 items-start text-slate-400">
              <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>
                Complexity values are estimated statically by compiling and parsing loop structures and data definitions in the input snippet.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🏗️ PROJECT PLAN MODE RESULTS VIEW
interface Phase {
  phase: string;
  tasks: string[];
}

function ProjectResultView({ result, isDark }: { result: any; isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<"design" | "roadmap" | "specs">("design");

  // Format roadmap into array of Phase objects
  let parsedRoadmap: Phase[] = [];
  if (Array.isArray(result.roadmap)) {
    parsedRoadmap = result.roadmap.map((item: any, idx: number) => {
      if (typeof item === "object" && item.phase) {
        return item;
      } else {
        return {
          phase: typeof item === "string" ? item : `Phase ${idx + 1}`,
          tasks: [],
        };
      }
    });
  }

  const techStack = Array.isArray(result.techStack) ? result.techStack : [];
  const features = Array.isArray(result.features) ? result.features : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-black/35 border-b border-white/10">
        <div className="flex gap-2">
          {(["design", "roadmap", "specs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                activeTab === tab
                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "design" ? "🏗️ System Design" : tab === "roadmap" ? "🗺️ Timeline" : "🛠️ Specs"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === "design" && (
          <div className="space-y-2 leading-relaxed text-sm text-slate-300">
            <div className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider mb-2">
              Architecture Overview
            </div>
            {renderMarkdown(result.architecture || "No architecture outline provided.", isDark)}
          </div>
        )}

        {activeTab === "roadmap" && (
          <div className="space-y-4">
            <div className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider">
              Milestone roadmap
            </div>
            {parsedRoadmap.length === 0 ? (
              <p className="text-xs text-slate-500">No milestones provided.</p>
            ) : (
              <div className="relative border-l border-sky-500/30 ml-3 pl-6 space-y-6 py-2">
                {parsedRoadmap.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle bullet */}
                    <div
                      className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center"
                      style={{ background: "#0ea5e9", boxShadow: "0 0 10px #0ea5e950" }}
                    >
                      <span className="text-[8px] text-black font-extrabold">{idx + 1}</span>
                    </div>

                    <div className="font-semibold text-sm text-slate-100">{step.phase}</div>
                    {step.tasks && step.tasks.length > 0 && (
                      <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-slate-400">
                        {step.tasks.map((task, tIdx) => (
                          <li key={tIdx}>{task}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "specs" && (
          <div className="space-y-5">
            {/* Tech Stack list */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Stack</div>
              {techStack.length === 0 ? (
                <p className="text-xs text-slate-500">No technologies selected.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        background: "rgba(14,165,233,0.08)",
                        borderColor: "rgba(14,165,233,0.25)",
                        color: "#38bdf8",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Core Features list */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Core Features Specifications</div>
              {features.length === 0 ? (
                <p className="text-xs text-slate-500">No features specified.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2 rounded-xl bg-black/30 border border-white/5">
                      <CheckSquare className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-300 leading-normal">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
