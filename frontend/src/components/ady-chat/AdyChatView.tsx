"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { ResumeHubViewType } from "@/types/resume";

import { IntroAnimation } from "./IntroAnimation";
import { ChatBackground } from "./ChatBackground";
import { ChatNavbar } from "./ChatNavbar";
import { ChatSidebar } from "./ChatSidebar";
import { ChatGreeting } from "./ChatGreeting";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { ADY_MODELS, type ChatSession, type ChatMessage } from "./types";

// ─── Voice recognition hook ──────────────────────────────────────────────────

function useVoiceRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onResult(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult]);

  return { listening, toggle };
}

// ─── Theme hook ──────────────────────────────────────────────────────────────

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

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AdyChatViewProps {
  setView: (v: ResumeHubViewType) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdyChatView({ setView }: AdyChatViewProps) {
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // ── Intro animation ────────────────────────────────────────────────────────
  const [introComplete, setIntroComplete] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(ADY_MODELS[0].id);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load sessions ──────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get("/ady-chat/sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (introComplete) loadSessions();
  }, [introComplete, loadSessions]);

  // ── Load messages ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await api.get(`/ady-chat/sessions/${sessionId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, loadMessages]);

  // ── New session ────────────────────────────────────────────────────────────
  const handleNewSession = useCallback(async () => {
    try {
      const res = await api.post("/ady-chat/sessions", { model: selectedModel });
      if (res.data.success) {
        setSessions(prev => [res.data.session, ...prev]);
        setActiveSessionId(res.data.session.id);
        setMessages([]);
        setStreamingText("");
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedModel]);

  // ── Delete session ─────────────────────────────────────────────────────────
  const handleDeleteSession = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/ady-chat/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeSessionId]);

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/ady-chat/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setUploadedFile({ name: res.data.filename, text: res.data.text });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  // ── Voice ──────────────────────────────────────────────────────────────────
  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => prev + text);
  }, []);
  const { listening, toggle: toggleVoice } = useVoiceRecognition(handleVoiceResult);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !uploadedFile) return;

    let finalMessage = text;
    if (uploadedFile) {
      finalMessage = `[File: ${uploadedFile.name}]\n\n${uploadedFile.text}\n\n---\n${text || "Please analyze this document."}`;
    }

    // Create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await api.post("/ady-chat/sessions", {
          model: selectedModel,
          title: finalMessage.slice(0, 80),
        });
        if (res.data.success) {
          sessionId = res.data.session.id;
          setActiveSessionId(sessionId);
          setSessions(prev => [res.data.session, ...prev]);
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: sessionId!,
      role: "user",
      content: finalMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setUploadedFile(null);
    setLoading(true);
    setStreamingText("");

    // Streaming fetch
    const token = typeof window !== "undefined" ? (localStorage.getItem("adyapan-token") || sessionStorage.getItem("adyapan-token")) : null;
    try {
      const res = await fetch(`${api.defaults.baseURL}/ady-chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId, message: finalMessage, model: selectedModel }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === "chunk") {
              accumulated += data.text;
              setStreamingText(accumulated);
            } else if (data.type === "done") {
              const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                sessionId: sessionId!,
                role: "assistant",
                content: accumulated,
                createdAt: new Date().toISOString(),
              };
              setMessages(prev => [...prev, aiMsg]);
              setStreamingText("");
              loadSessions();
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sessionId: sessionId!,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  }, [input, uploadedFile, activeSessionId, selectedModel, loadSessions]);

  // ── Suggestion card click ──────────────────────────────────────────────────
  const handleSuggestionClick = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const hasMessages = messages.length > 0 || !!streamingText;
  const userName = user?.name || "Ashish";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Intro animation (blocks everything until complete) ── */}
      <AnimatePresence>
        {!introComplete && (
          <IntroAnimation onComplete={() => setIntroComplete(true)} />
        )}
      </AnimatePresence>

      {/* ── Main chat interface ── */}
      <motion.div
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {/* Animated background */}
        <ChatBackground />

        {/* Navbar */}
        <ChatNavbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onSettingsClick={() => {}}
        />

        {/* Body: sidebar + main */}
        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Sidebar toggle button (mobile) */}
          <motion.button
            className="absolute top-3 left-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center sm:hidden"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
            }}
            onClick={() => setSidebarOpen(o => !o)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>

          {/* Desktop sidebar toggle */}
          <motion.button
            className="hidden sm:flex absolute top-3 left-3 z-20 w-8 h-8 rounded-xl items-center justify-center"
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
            }}
            onClick={() => setSidebarOpen(o => !o)}
            whileHover={{ scale: 1.06, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}
            whileTap={{ scale: 0.94 }}
          >
            <Menu className="w-4 h-4" />
          </motion.button>

          {/* Sidebar */}
          <ChatSidebar
            isOpen={sidebarOpen}
            sessions={sessions}
            activeSessionId={activeSessionId}
            isDark={isDark}
            onNewChat={handleNewSession}
            onSelectSession={id => {
              setActiveSessionId(id);
            }}
            onDeleteSession={handleDeleteSession}
            userName={userName}
          />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {!hasMessages ? (
                /* ── Greeting / empty state ── */
                <motion.div
                  key="greeting"
                  className="flex-1 flex flex-col overflow-hidden"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                    y: -20,
                    transition: { duration: 0.35, ease: [0.43, 0.13, 0.23, 0.96] },
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="flex-1 flex items-center justify-center overflow-y-auto">
                    <ChatGreeting
                      userName={userName}
                      isDark={isDark}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  </div>

                  {/* Input at bottom of greeting */}
                  <div className="pb-6 pt-2">
                    <ChatInput
                      input={input}
                      isDark={isDark}
                      loading={loading}
                      listening={listening}
                      uploadedFile={uploadedFile}
                      selectedModel={selectedModel}
                      hasMessages={false}
                      onInputChange={setInput}
                      onSend={handleSend}
                      onVoiceToggle={toggleVoice}
                      onFileSelect={handleFileSelect}
                      onRemoveFile={() => setUploadedFile(null)}
                      onModelChange={setSelectedModel}
                    />
                  </div>
                </motion.div>
              ) : (
                /* ── Active conversation ── */
                <motion.div
                  key="conversation"
                  className="flex-1 flex flex-col overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* Messages */}
                  <MessageList
                    messages={messages}
                    streamingText={streamingText}
                    loading={loading}
                    isDark={isDark}
                    onRegenerate={() => {
                      // Regenerate last AI message
                      const lastUser = [...messages].reverse().find(m => m.role === "user");
                      if (lastUser) {
                        setInput(lastUser.content);
                        setMessages(prev => prev.slice(0, -1));
                      }
                    }}
                  />

                  {/* Input at bottom of conversation */}
                  <div
                    className="pb-5 pt-2"
                    style={{
                      background: isDark
                        ? "linear-gradient(to top, rgba(6,6,18,0.9) 0%, transparent 100%)"
                        : "linear-gradient(to top, rgba(248,250,252,0.9) 0%, transparent 100%)",
                    }}
                  >
                    <ChatInput
                      input={input}
                      isDark={isDark}
                      loading={loading}
                      listening={listening}
                      uploadedFile={uploadedFile}
                      selectedModel={selectedModel}
                      hasMessages={true}
                      onInputChange={setInput}
                      onSend={handleSend}
                      onVoiceToggle={toggleVoice}
                      onFileSelect={handleFileSelect}
                      onRemoveFile={() => setUploadedFile(null)}
                      onModelChange={setSelectedModel}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
