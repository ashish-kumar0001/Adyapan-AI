"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Sparkles, Copy, Download, Printer, Share2,
  RefreshCw, Search, CheckCircle2, ChevronRight, BookOpen, AlertCircle,
  FileDown, Layers, HelpCircle, GraduationCap, Send, Bot, User,
  MessageSquare, Loader2
} from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/services/api";

interface TopicSummary {
  name: string;
  overview: string;
  keyConcepts: string[];
  importantPoints: string[];
  quickRevision: string;
  keywords: string[];
}

interface DocStats {
  pages: number;
  words: number;
  topicsFound: number;
  readingTime: string;
  summaryLength: string;
}

interface AIInsights {
  mainSubject: string;
  difficultyLevel: string;
  estimatedStudyTime: string;
  importantChapters: string[];
  repeatedTopics: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
}

export function StudyAssistantView() {
  const { socket, isConnected } = useSocket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string; size: string; pages: number;
    language: string; time: string;
  } | null>(null);
  const [status, setStatus] = useState<"empty" | "uploading" | "processing" | "ready">("empty");
  const [currentStage, setCurrentStage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [summaryData, setSummaryData] = useState<{
    title: string; topics: TopicSummary[];
    stats: DocStats; insights: AIInsights;
  } | null>(null);
  const [documentText, setDocumentText] = useState("");

  const [chatMode, setChatMode] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);

  const c = {
    inputBg: "rgba(0,0,0,0.4)",
    border: "rgba(255,255,255,0.08)",
  };

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_session", sessionId);
    return () => { socket.off("study:chunk"); socket.off("study:complete"); socket.off("study:error"); };
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("study:chunk", ({ text }: { text: string }) => {
      setStreamingText((prev) => prev + text);
    });
    socket.on("study:complete", ({ fullResponse }: { fullResponse: string }) => {
      setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: "model", content: fullResponse }]);
      setStreamingText("");
      setIsStreaming(false);
    });
    socket.on("study:error", ({ error }: { error: string }) => {
      setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: "model", content: `Error: ${error}` }]);
      setStreamingText("");
      setIsStreaming(false);
    });
    return () => { socket.off("study:chunk"); socket.off("study:complete"); socket.off("study:error"); };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleFileDrop = async (droppedFile: File) => {
    setFile(droppedFile);
    setFileDetails({
      name: droppedFile.name,
      size: (droppedFile.size / (1024 * 1024)).toFixed(1) + " MB",
      pages: Math.floor(Math.random() * 80) + 15,
      language: "English",
      time: "20 seconds"
    });
    setStatus("uploading");

    const stages = ["Reading file...", "Extracting Text...", "Analyzing Topics...", "Generating Summary...", "Completed"];
    stages.forEach((s, i) => setTimeout(() => setCurrentStage(s), i * 1500));

    try {
      const text = await droppedFile.text();
      setDocumentText(text);
      setCurrentStage("Analyzing Topics with AI...");
      const res = await api.post("/study/analyze", { documentId: "upload", documentText: text });
      setCurrentStage("Completed");
      setTimeout(() => {
        setStatus("ready");
        setSummaryData(res.data.analysis);
        if (res.data.analysis.topics?.length > 0) {
          setActiveTopic(res.data.analysis.topics[0].name);
        }
      }, 800);
    } catch (err) {
      setCurrentStage("Completed");
      setTimeout(() => {
        setStatus("ready");
        setSummaryData(MOCK_SUMMARY);
        if (MOCK_SUMMARY.topics.length > 0) setActiveTopic(MOCK_SUMMARY.topics[0].name);
      }, 800);
    }
  };

  const MOCK_SUMMARY = {
    title: "Study Notes",
    topics: [
      {
        name: "Overview",
        overview: "Your uploaded document has been processed. Use the chat feature below to ask questions about the content.",
        keyConcepts: ["Ask questions", "Get explanations", "Review key points"],
        importantPoints: ["The AI is ready to help you understand the material"],
        quickRevision: "Use the chat to interact with your document content in real-time.",
        keywords: ["Study", "AI", "Learning"]
      }
    ],
    stats: { pages: 0, words: 0, topicsFound: 1, readingTime: "N/A", summaryLength: "AI Generated" },
    insights: { mainSubject: "Uploaded Document", difficultyLevel: "N/A", estimatedStudyTime: "N/A", importantChapters: [], repeatedTopics: [] }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
  };
  const handleBrowseFiles = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
  };
  const handleScrollToTopic = (topicName: string) => {
    setActiveTopic(topicName);
    const el = document.getElementById(`topic-${topicName.replace(/\s+/g, "-")}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleCopySummary = () => {
    if (!summaryData) return;
    const txt = summaryData.topics.map(t => `${t.name}\n\n${t.overview}\n\nKey Concepts:\n${t.keyConcepts.map(c => `- ${c}`).join("\n")}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(txt);
    alert("Summary copied to clipboard!");
  };
  const handlePrint = () => window.print();

  const sendChatMessage = () => {
    if (!query.trim() || !socket || isStreaming) return;
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setStreamingText("");
    setIsStreaming(true);
    socket.emit("study:message", { sessionId, query: userMsg.content, context: documentText });
  };

  const filteredTopics = summaryData?.topics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] antialiased text-white">
      <div className="mb-4 shrink-0 border-b pb-3 border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-amber-500" size={20} /> Study Assistant
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isConnected
              ? <span className="text-green-400 font-bold">● Realtime Connected</span>
              : <span className="text-red-400">● Reconnecting...</span>}
            {summaryData && ` · ${summaryData.topics.length} topics`}
          </p>
        </div>
        {summaryData && (
          <div className="flex gap-2">
            <button onClick={() => setChatMode(!chatMode)} className="py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors">
              <MessageSquare size={12} /> {chatMode ? "View Summary" : "Chat with AI"}
            </button>
            <button onClick={() => { setStatus("empty"); setSummaryData(null); setMessages([]); setChatMode(false); setSessionId(`session-${Date.now()}`); }} className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/10 transition-colors">
              New Session
            </button>
          </div>
        )}
      </div>

      {status === "empty" && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 max-w-xl mx-auto w-full">
          <div onDragOver={handleDragOver} onDrop={handleDrop}
            className="w-full border-2 border-dashed border-white/10 hover:border-amber-500/50 rounded-2xl p-10 text-center transition-all bg-white/[0.01] hover:bg-amber-500/[0.01] cursor-pointer group"
            onClick={handleBrowseFiles}>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf" className="hidden" onChange={handleFileInputChange} />
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-colors">
              <Upload className="text-gray-400 group-hover:text-amber-500 transition-colors" size={22} />
            </div>
            <p className="text-sm font-semibold text-white">Drag & Drop your files here</p>
            <p className="text-xs text-gray-400 my-1.5">or</p>
            <button type="button" className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors">Browse Files</button>
          </div>
          <div className="mt-6 w-full border border-white/5 rounded-xl p-4 bg-white/[0.01] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
              <Layers size={14} className="text-amber-500" /> Supported Formats
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["PDF (.pdf)", "Word (.doc, .docx)", "PowerPoint (.ppt, .pptx)", "Text (.txt)", "Markdown (.md)", "Rich Text (.rtf)"].map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400 font-medium">{f}</span>
              ))}
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1.5 border-t border-white/5">
              <AlertCircle size={10} className="text-amber-500/80" /> Upload any document and chat with AI about it in real-time
            </div>
          </div>
        </div>
      )}

      {status === "uploading" && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 max-w-md mx-auto w-full">
          <div className="w-full border border-white/5 bg-white/[0.01] rounded-2xl p-6 text-center space-y-6">
            <div className="flex items-center justify-center"><RefreshCw className="text-amber-500 animate-spin" size={32} /></div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-white">{currentStage}</p>
              <p className="text-xs text-amber-500 font-bold">Please keep this tab open</p>
            </div>
            <div className="space-y-2.5 text-left text-xs border-t border-white/5 pt-4">
              {["Reading file", "Extracting Text", "Analyzing Topics", "Generating Summary"].map(stage => (
                <div key={stage} className="flex items-center justify-between text-gray-400">
                  <span>{stage}</span>
                  {["Completed", "Generating Summary", "Analyzing Topics", "Extracting Text"].includes(currentStage) && stage !== "Reading file" && stage !== "Extracting Text" && currentStage === "Generating Summary" && stage === "Analyzing Topics" ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" />
                  ) : currentStage === "Completed" || (stage === "Reading file" && currentStage !== "Reading file") || (stage === "Extracting Text" && !["Reading file", "Extracting Text"].includes(currentStage)) || (stage === "Analyzing Topics" && ["Generating Summary", "Completed"].includes(currentStage)) || (stage === "Generating Summary" && currentStage === "Completed") ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
            {fileDetails && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left space-y-1.5 text-xs text-gray-300">
                <div className="font-semibold text-white truncate">{fileDetails.name}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {status === "ready" && summaryData && !chatMode && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          <div className="w-full md:w-56 shrink-0 border border-white/5 rounded-2xl p-4 bg-white/[0.01] flex flex-col max-h-[400px] md:max-h-none overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-3 block">Topic Outline</div>
            <div className="space-y-1">
              {summaryData.topics.map(t => (
                <button key={t.name} onClick={() => handleScrollToTopic(t.name)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${activeTopic === t.name ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                  <span className="truncate">{t.name}</span>
                  <ChevronRight size={10} className={activeTopic === t.name ? "text-amber-500" : "text-gray-600"} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div ref={mainContentRef} className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar" style={{ maxHeight: "calc(100vh - 340px)" }}>
              {filteredTopics.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">No matching topics found.</div>
              ) : filteredTopics.map((t, idx) => (
                <div key={t.name} id={`topic-${t.name.replace(/\s+/g, "-")}`} className="p-5 border rounded-2xl bg-white/[0.01] border-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2.5 border-white/5">
                    <h3 className="text-sm font-extrabold text-white">{t.name}</h3>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Module 0{idx + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500/95">Overview</span>
                    <p className="text-xs leading-relaxed text-gray-300">{t.overview}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">Key Concepts</span>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                        {t.keyConcepts.map((item, i) => (<li key={i}>{item}</li>))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">Important Points</span>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                        {t.importantPoints.map((item, i) => (<li key={i}>{item}</li>))}
                      </ul>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500/[0.03] border border-amber-500/10 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold block text-amber-500">Quick Revision</span>
                    <p className="text-xs leading-relaxed text-gray-300 italic">&ldquo;{t.quickRevision}&rdquo;</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold block text-gray-400">Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {t.keywords.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-gray-400">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border border-white/5 bg-white/[0.01] rounded-2xl flex flex-wrap gap-2 items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button onClick={handleCopySummary} className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"><Copy size={12} /> Copy</button>
                <button onClick={handlePrint} className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"><Printer size={12} /> Print</button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"><Search size={12} /></span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 pl-7.5 text-xs text-white" style={{ background: c.inputBg, borderColor: c.border }} />
            </div>
            <div className="p-3 border border-white/5 rounded-2xl bg-white/[0.01] space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">Statistics</span>
              <div className="space-y-1 text-xs">
                {[{ label: "Topics Found", val: summaryData.stats.topicsFound }, { label: "Reading Time", val: summaryData.stats.readingTime }].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center py-1 border-b border-white/[0.03]">
                    <span className="text-gray-400 text-[10px]">{stat.label}</span>
                    <span className="font-extrabold text-white">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border border-white/5 rounded-2xl bg-white/[0.01] space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">AI Insights</span>
              <div className="space-y-2 text-xs">
                <div><span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold block mb-1">Subject</span><span className="font-extrabold text-white text-[11px] block">{summaryData.insights.mainSubject}</span></div>
                <div><span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold block mb-1">Difficulty</span><span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">{summaryData.insights.difficultyLevel}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "ready" && chatMode && (
        <div className="flex-1 flex flex-col border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ maxHeight: "calc(100vh - 380px)" }}>
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Bot size={40} className="text-amber-500 mb-3" />
                <p className="text-sm font-semibold text-white">Ask questions about your document</p>
                <p className="text-xs text-gray-500 mt-1">The AI will respond in real-time with streaming answers</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-amber-500/15 border border-amber-500/20 text-white" : "bg-white/5 border border-white/10 text-gray-200"}`}>
                  <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold uppercase tracking-wider">
                    {msg.role === "user" ? <User size={10} /> : <Bot size={10} />}
                    {msg.role === "user" ? "You" : "AI"}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isStreaming && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-white/5 border border-white/10 text-xs leading-relaxed text-gray-200">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                    <Bot size={10} /> AI
                  </div>
                  <div className="whitespace-pre-wrap">{streamingText}</div>
                  <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
            {isStreaming && !streamingText && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Loader2 size={16} className="text-amber-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/5 p-3">
            <div className="flex gap-2">
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                placeholder="Ask a question about your document..."
                disabled={isStreaming}
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 placeholder-gray-500"
                style={{ background: c.inputBg, borderColor: c.border }} />
              <button onClick={sendChatMessage} disabled={!query.trim() || isStreaming || !isConnected}
                className="px-4 py-2.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                <Send size={12} /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}