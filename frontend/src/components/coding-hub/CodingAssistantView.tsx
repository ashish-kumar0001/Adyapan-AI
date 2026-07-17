"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { ChatBackground } from "@/components/ady-chat/ChatBackground";
import { AssistantSidebar, type Mode, type AssistantSession } from "./assistant/AssistantSidebar";
import { AssistantComposer } from "./assistant/AssistantComposer";
import { AssistantChat, type ChatMessage } from "./assistant/AssistantChat";
import { LanguageSelector, type LanguageId } from "./assistant/LanguageSelector";

const MODE_SUGGESTIONS: Record<Mode, { text: string; prompt: string; error?: string }[]> = {
  generate: [
    { text: "Debounced search hook", prompt: "Write a TypeScript React hook for debounced search with cleanup and abort controller support." },
    { text: "JWT auth middleware", prompt: "Create an Express.js JWT authentication middleware with token refresh and role-based access control." },
    { text: "LRU Cache implementation", prompt: "Implement an LRU Cache in Python with O(1) get and put operations using an OrderedDict." },
  ],
  debug: [
    { text: "Null reference in map", error: "TypeError: Cannot read properties of null (reading 'map')", prompt: "function UserList({ users }) {\n  return (<ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>);\n}" },
    { text: "Async memory leak", error: "Warning: Can't perform a React state update on an unmounted component.", prompt: "useEffect(() => {\n  async function load() {\n    const res = await fetch('/api/user');\n    setUser(await res.json());\n  }\n  load();\n}, []);" },
    { text: "Python IndexError", error: "IndexError: list index out of range", prompt: "def get_max(nums):\n    max_val = nums[0]\n    for i in range(len(nums)):\n        if nums[i] > max_val:\n            max_val = nums[i]\n    return max_val" },
  ],
  explain: [
    { text: "JavaScript closures", prompt: "function createCounter() {\n  let count = 0;\n  return {\n    increment() { return ++count; },\n    get() { return count; }\n  };\n}" },
    { text: "Binary search algorithm", prompt: "function binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}" },
    { text: "Python list comprehension", prompt: "squares = [x**2 for x in range(10) if x % 2 == 0]\nmatrix = [[i*j for j in range(3)] for i in range(3)]" },
  ],
  project: [
    { text: "Real-time chat app", prompt: "Build a real-time chat application with React, Socket.io, and Express with rooms, typing indicators, and message history." },
    { text: "SaaS e-commerce API", prompt: "Design a multi-tenant SaaS e-commerce backend with product catalogs, cart, payments (Stripe), and order management." },
    { text: "ML pipeline system", prompt: "Design a machine learning pipeline system that handles data ingestion, training, evaluation, and deployment with versioning." },
  ],
};

export default function CodingAssistantView() {
  const theme = useTheme();
  const isDark = theme === "dark";

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Composer state
  const [mode, setMode] = useState<Mode>("generate");
  const [languages, setLanguages] = useState<LanguageId[]>(["javascript", "python"]);
  const [input, setInput] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");
  const [generating, setGenerating] = useState(false);

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // ─── Load sessions from server ────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get("/coding/assistant/sessions");
      setSessions(res.data.sessions || []);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load session messages when switching
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await api.get(`/coding/assistant/sessions/${sessionId}`);
      const session = res.data.session;
      if (session) {
        setMode(session.mode || "generate");
        setLanguages(session.languages || ["javascript"]);
        setMessages(
          (session.messages || []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            role: m.role as "user" | "assistant",
            content: m.content as string,
            mode: m.mode as string | undefined,
            results: m.results as Record<string, unknown> | undefined,
            codeSnippet: m.codeSnippet as string | undefined,
            errorMsg: m.errorMsg as string | undefined,
            languages: m.languages as string[],
          }))
        );
      }
    } catch {
      toast.error("Failed to load session");
    }
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, loadSession]);

  // ─── Session actions ──────────────────────────────────────────────────────

  const handleNewSession = useCallback(
    async (initialMode: Mode = "generate") => {
      try {
        const res = await api.post("/coding/assistant/sessions", {
          title: "New Coding Session",
          mode: initialMode,
          languages,
        });
        const newSession = res.data.session;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMode(initialMode);
        setInput("");
        setSecondaryInput("");
        setMessages([]);
      } catch {
        toast.error("Failed to create session");
      }
    },
    [languages]
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/coding/assistant/sessions/${id}`);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch {
        toast.error("Failed to delete session");
      }
    },
    [activeSessionId]
  );

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setInput("");
    setSecondaryInput("");
  }, []);

  // ─── Submit message ───────────────────────────────────────────────────────

  const canSubmit = input.trim().length > 0 && (mode !== "debug" || secondaryInput.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || generating || !activeSessionId) return;

    const userContent =
      mode === "debug"
        ? `Error: ${secondaryInput}\n\nCode:\n${input}`
        : mode === "explain"
        ? input
        : input;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userContent,
      codeSnippet: mode === "debug" || mode === "explain" ? input : undefined,
      errorMsg: mode === "debug" ? secondaryInput : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSecondaryInput("");
    setGenerating(true);

    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("adyapan-token") || sessionStorage.getItem("adyapan-token")
        : "";

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
      const response = await fetch(`${baseUrl}/coding/assistant/sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userContent,
          languages,
          codeSnippet: userMsg.codeSnippet,
          errorMsg: userMsg.errorMsg,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let streamText = "";
      let parsedResults: Record<string, unknown> | null = null;

      // Add a streaming placeholder
      const streamingId = `ai-stream-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: streamingId, role: "assistant", content: "", mode },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "chunk") {
              streamText += event.text;
              // Update streaming message in real-time
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingId ? { ...m, content: streamText } : m
                )
              );
            } else if (event.type === "done") {
              parsedResults = event.results;
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      // Finalize: replace the streaming placeholder with the complete message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? { ...m, content: streamText || "Response generated.", results: parsedResults || undefined }
            : m
        )
      );

      fetchSessions();
    } catch (err) {
      const e = err as Error;
      const msg = e?.message || "Failed to get response";
      toast.error(msg);

      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: `Error: ${msg}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setGenerating(false);
    }
  };

  // ─── Quick suggestion click ───────────────────────────────────────────────

  const handleSuggestionClick = (prompt: string, error?: string) => {
    setInput(prompt);
    if (error) setSecondaryInput(error);
  };

  // ─── File upload ──────────────────────────────────────────────────────────

  const handleFileUpload = (text: string) => {
    setInput(text);
    if (mode === "generate" || mode === "project") {
      setMode("explain");
    }
    toast.success("File loaded into input");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const currentTabColor =
    mode === "generate" ? "#10b981" : mode === "debug" ? "#f43f5e" : mode === "explain" ? "#f59e0b" : "#0ea5e9";
  const suggestions = MODE_SUGGESTIONS[mode];

  return (
    <div
      className="relative flex overflow-hidden w-full h-full"
      style={{
        margin: "-1.25rem",
        width: "calc(100% + 2.5rem)",
        height: "calc(100% + 2.5rem)",
        background: isDark ? "#070715" : "#f0f4ff",
        color: isDark ? "#fff" : "#1a1a2e",
      }}
    >
      <ChatBackground isDark={isDark} />

      <div className="flex flex-1 overflow-hidden relative z-10 w-full h-full">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 h-full overflow-hidden relative"
              style={{ zIndex: 20 }}
            >
              {/* Close button */}
              <motion.button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-3 right-3 z-30 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${currentTabColor}, ${currentTabColor}cc)`,
                  color: "#000",
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                </svg>
              </motion.button>

              <AssistantSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={handleSelectSession}
                onNew={handleNewSession}
                onDelete={handleDeleteSession}
                isDark={isDark}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {/* Top header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between gap-4 flex-shrink-0 z-10"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
              background: isDark ? "rgba(7,7,21,0.9)" : "rgba(240,244,255,0.9)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Sidebar toggle */}
              {!sidebarOpen && (
                <motion.button
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${currentTabColor}, ${currentTabColor}cc)`,
                    color: "#000",
                    boxShadow: `0 2px 10px ${currentTabColor}30`,
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
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

              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${currentTabColor}30, ${currentTabColor}08)`,
                  border: `1px solid ${currentTabColor}40`,
                }}
              >
                <Code2 size={16} style={{ color: currentTabColor }} />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  CodeForge Assistant
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#10b981" }}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}>
                    Multi-Language Engine
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Cpu size={14} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }} />
              <span className="text-[10px] font-bold" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }}>
                {languages.length} languages active
              </span>
            </div>
          </div>

          {/* Chat messages or welcome */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 min-h-0">
            {messages.length === 0 && !generating ? (
              /* Welcome screen */
              <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center py-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
                  style={{
                    background: `linear-gradient(135deg, ${currentTabColor}30, #080614)`,
                    border: `1.5px solid ${currentTabColor}60`,
                    boxShadow: `0 0 25px ${currentTabColor}25`,
                  }}
                >
                  <Code2 size={32} style={{ color: currentTabColor }} />
                  <motion.div
                    className="absolute -inset-0.5 rounded-2xl blur-md"
                    style={{ background: currentTabColor, zIndex: -1, opacity: 0.15 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                </motion.div>

                <h1
                  className="text-3xl font-extrabold text-center tracking-tight mb-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Adyapan{" "}
                  <span style={{ color: currentTabColor }}>CodeForge</span>
                </h1>
                <p className="text-sm text-center max-w-md mb-4" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>
                  Generate production-ready code in multiple languages simultaneously.
                  Debug, explain, and plan projects with AI-powered precision.
                </p>

                {/* Language selector preview */}
                <div className="mb-6">
                  <LanguageSelector
                    selected={languages}
                    onChange={setLanguages}
                    isDark={isDark}
                  />
                </div>

                {/* Suggestions */}
                <div className="grid gap-3 sm:grid-cols-3 w-full">
                  {suggestions.map((s, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSuggestionClick(s.prompt, s.error)}
                      className="text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between h-28 cursor-pointer"
                      style={{
                        background: isDark ? "rgba(8,6,20,0.4)" : "rgba(255,255,255,0.5)",
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      }}
                      whileHover={{
                        scale: 1.02,
                        borderColor: `${currentTabColor}50`,
                        boxShadow: `0 4px 14px ${currentTabColor}10`,
                      }}
                    >
                      <div className="font-semibold" style={{ color: isDark ? "#fff" : "#1a1a2e" }}>
                        {s.text}
                      </div>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}>
                        <span>Try now</span>
                        <span style={{ color: currentTabColor }}>&rarr;</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <AssistantChat
                messages={messages}
                generating={generating}
                mode={mode}
                isDark={isDark}
              />
            )}
          </div>

          {/* Composer */}
          <AssistantComposer
            mode={mode}
            languages={languages}
            onLanguagesChange={setLanguages}
            input={input}
            onInputChange={setInput}
            secondaryInput={secondaryInput}
            onSecondaryInputChange={setSecondaryInput}
            canSubmit={canSubmit && !!activeSessionId}
            generating={generating}
            onSubmit={handleSubmit}
            onFileUpload={handleFileUpload}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}
