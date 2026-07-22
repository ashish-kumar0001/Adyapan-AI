"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Sparkles, Layers, Download, Save, Eye, Edit3,
  CheckCircle2, RefreshCw, MessageSquare, Send, X, ChevronRight,
  ChevronDown, ArrowLeft, Wand2, ShieldCheck, AlignLeft, Maximize2,
  FileCode, FileDown, Plus, Trash2, Sliders, Code2, Play
} from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

interface PaperEditorWorkspaceProps {
  paper: any;
  onBack: () => void;
  onOpenTemplates: () => void;
  c: any;
}

export function PaperEditorWorkspace({
  paper: initialPaper,
  onBack,
  onOpenTemplates,
  c,
}: PaperEditorWorkspaceProps) {
  const [paper, setPaper] = useState(initialPaper);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialPaper?.sections?.[0]?.id || "abstract"
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "visuals" | "chat">("edit");
  const [enhancing, setEnhancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hello! I am your AI Research Co-Author. I can help refine sections, check citations, or rephrase content to elevate academic tone." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Visual Content State
  const [visualTopic, setVisualTopic] = useState(initialPaper?.title || "");
  const [visualType, setVisualType] = useState<"architecture" | "flowchart" | "equation" | "table">("architecture");
  const [generatedVisual, setGeneratedVisual] = useState<any>(null);
  const [generatingVisual, setGeneratingVisual] = useState(false);

  const currentSection = paper?.sections?.find((s: any) => s.id === activeSectionId) || paper?.sections?.[0];

  const updateSectionContent = (newContent: string) => {
    if (!currentSection) return;
    const updatedSections = (paper.sections || []).map((s: any) =>
      s.id === currentSection.id ? { ...s, content: newContent } : s
    );
    setPaper({ ...paper, sections: updatedSections });
  };

  const handleAIEnhance = async (mode: string) => {
    if (!currentSection?.content) return;
    setEnhancing(true);
    try {
      const res = await api.post("/research/enhance", { text: currentSection.content, mode });
      if (res.data?.success && res.data?.enhancedText) {
        updateSectionContent(res.data.enhancedText);
        toast.success(`Enhanced with ${mode.replace("_", " ")} mode!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Enhancement failed");
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerateVisual = async () => {
    setGeneratingVisual(true);
    try {
      const res = await api.post("/research/generate-visual", {
        contentType: visualType,
        topic: visualTopic || paper?.title,
        context: currentSection?.content?.slice(0, 500)
      });
      if (res.data?.success && res.data?.visual) {
        setGeneratedVisual(res.data.visual);
        toast.success("Generated visual content!");
      }
    } catch (err: any) {
      toast.error("Visual generation failed");
    } finally {
      setGeneratingVisual(false);
    }
  };

  const handleExport = async (format: "pdf" | "docx" | "latex" | "markdown") => {
    setExportingFormat(format);
    try {
      const res = await api.post(`/research/export/${format}`, { paper, template: paper?.metadata?.template || "IEEE" }, { responseType: "blob" });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "latex" ? "tex" : (format === "markdown" ? "md" : format);
      a.download = `${(paper?.title || "research-paper").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.${ext}`;
      a.click();
      toast.success(`Exported as ${format.toUpperCase()}!`);
    } catch (err: any) {
      toast.error(`Export to ${format} failed`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/research/chat", {
        message: msg,
        paperContext: paper?.sections?.map((s: any) => `${s.title}: ${s.content}`).join("\n\n"),
        sources: paper?.references || []
      });
      if (res.data?.success && res.data?.reply) {
        setChatMessages(prev => [...prev, { role: "assistant", text: res.data.reply }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Sorry, I had trouble processing your query." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-2xl overflow-hidden border shadow-xl" style={{ background: c.bg, borderColor: c.border }}>
      {/* Top Action Bar */}
      <div className="px-5 py-3 flex items-center justify-between gap-4 shrink-0" style={{ borderBottom: `1px solid ${c.divider}`, background: c.isDark ? "#0f172a" : "#f8fafc" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: c.text }}>{paper?.title || "Research Paper Workspace"}</h1>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: c.textMuted }}>
              <span className="font-semibold text-blue-400 uppercase tracking-wider">{paper?.metadata?.template || "IEEE"}</span>
              <span>•</span>
              <span>{paper?.metadata?.wordCount || 3400} words</span>
              <span>•</span>
              <span>{paper?.sections?.length || 8} Sections</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onOpenTemplates} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
            <Layers size={14} /> Change Template
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          <button onClick={() => handleExport("pdf")} disabled={!!exportingFormat} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20">
            <Download size={14} /> PDF
          </button>

          <button onClick={() => handleExport("latex")} disabled={!!exportingFormat} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1.5">
            <FileCode size={14} /> LaTeX
          </button>

          <button onClick={() => handleExport("docx")} disabled={!!exportingFormat} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1.5">
            <FileDown size={14} /> DOCX
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Section Navigation */}
        <div className="w-64 p-3 border-r flex flex-col gap-1 overflow-y-auto shrink-0" style={{ borderColor: c.divider, background: c.isDark ? "rgba(255,255,255,0.01)" : "#ffffff" }}>
          <div className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-gray-400">Paper Structure</div>
          {(paper?.sections || [
            { id: "abstract", title: "Abstract" },
            { id: "intro", title: "1. Introduction" },
            { id: "related", title: "2. Related Work" },
            { id: "methodology", title: "3. Proposed Methodology" },
            { id: "results", title: "4. Experimental Results" },
            { id: "discussion", title: "5. Discussion" },
            { id: "conclusion", title: "6. Conclusion" },
            { id: "references", title: "References" },
          ]).map((s: any) => {
            const isActive = activeSectionId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSectionId(s.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                  isActive ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <span className="truncate">{s.title}</span>
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </div>

        {/* Middle / Right Split: Workspace Mode Tabs */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* View Modes Sub-Header */}
          <div className="px-5 py-2 flex items-center justify-between border-b text-xs" style={{ borderColor: c.divider, background: c.isDark ? "#0f172a" : "#f1f5f9" }}>
            <div className="flex items-center gap-1">
              <button onClick={() => setActiveTab("edit")} className={`px-3 py-1 rounded-md font-semibold ${activeTab === "edit" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                Section Editor
              </button>
              <button onClick={() => setActiveTab("preview")} className={`px-3 py-1 rounded-md font-semibold ${activeTab === "preview" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                Academic Preview
              </button>
              <button onClick={() => setActiveTab("visuals")} className={`px-3 py-1 rounded-md font-semibold ${activeTab === "visuals" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                Visual Content Studio
              </button>
            </div>

            {/* AI Enhancement Action Bar */}
            {activeTab === "edit" && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-1"><Wand2 size={12} /> AI Enhance:</span>
                <button onClick={() => handleAIEnhance("academic_tone")} disabled={enhancing} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-blue-400 font-medium text-[11px]">Academic Tone</button>
                <button onClick={() => handleAIEnhance("grammar")} disabled={enhancing} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 font-medium text-[11px]">Grammar</button>
                <button onClick={() => handleAIEnhance("plagiarism_reduction")} disabled={enhancing} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-amber-400 font-medium text-[11px]">Paraphrase</button>
                <button onClick={() => handleAIEnhance("expand")} disabled={enhancing} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-purple-400 font-medium text-[11px]">Expand</button>
                <button onClick={() => handleAIEnhance("humanize")} disabled={enhancing} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-indigo-400 font-medium text-[11px]">Humanize</button>
              </div>
            )}
          </div>

          {/* Main Display Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "edit" && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: c.text }}>{currentSection?.title || "Section Content"}</h2>
                  <span className="text-xs text-gray-400">Markdown & Math supported</span>
                </div>

                <textarea
                  value={currentSection?.content || ""}
                  onChange={e => updateSectionContent(e.target.value)}
                  placeholder="Write or edit paper section content here..."
                  className="w-full h-[calc(100vh-320px)] p-4 rounded-xl font-mono text-sm leading-relaxed outline-none resize-none"
                  style={{ background: c.inputBg, color: c.text, border: `1px solid ${c.border}` }}
                />
              </div>
            )}

            {activeTab === "preview" && (
              <div className="max-w-4xl mx-auto p-8 rounded-xl bg-white text-slate-900 font-serif text-sm leading-relaxed shadow-xl border border-slate-200">
                <div className="text-center pb-6 border-b border-slate-300">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{paper?.metadata?.template || "IEEE"} Template</div>
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{paper?.title}</h1>
                  <div className="text-xs text-slate-600 font-semibold">{paper?.authors?.join(", ") || "Author(s)"}</div>
                </div>

                <div className="my-6 p-4 bg-slate-50 border-l-4 border-blue-600 rounded text-xs italic text-slate-700">
                  <div className="font-bold not-italic text-slate-900 uppercase tracking-wider mb-1">Abstract</div>
                  {paper?.abstract}
                </div>

                <div className="space-y-6">
                  {(paper?.sections || []).map((s: any) => (
                    <div key={s.id}>
                      <h2 className="text-base font-extrabold uppercase text-slate-900 border-b border-slate-200 pb-1 mb-2">{s.title}</h2>
                      <p className="whitespace-pre-wrap text-slate-800 text-justify leading-relaxed">{s.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "visuals" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="p-5 rounded-xl border space-y-4" style={{ background: c.isDark ? "rgba(255,255,255,0.02)" : "#ffffff", borderColor: c.border }}>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.text }}>
                    <Code2 size={16} className="text-blue-500" /> Scientific Visual & Diagram Generator
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 block mb-1">Visual Type</label>
                      <select
                        value={visualType}
                        onChange={(e: any) => setVisualType(e.target.value)}
                        className="w-full p-2 rounded-lg text-xs outline-none"
                        style={{ background: c.inputBg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        <option value="architecture">Architecture Flowchart (Mermaid)</option>
                        <option value="flowchart">Workflow Diagram</option>
                        <option value="equation">LaTeX Equation Block</option>
                        <option value="table">Scientific Markdown Table</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-400 block mb-1">Diagram Concept</label>
                      <input
                        type="text"
                        value={visualTopic}
                        onChange={e => setVisualTopic(e.target.value)}
                        placeholder="e.g. Multi-head Attention Neural Pipeline"
                        className="w-full p-2 rounded-lg text-xs outline-none"
                        style={{ background: c.inputBg, color: c.text, border: `1px solid ${c.border}` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateVisual}
                    disabled={generatingVisual}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    <Play size={14} /> {generatingVisual ? "Generating..." : "Generate Scientific Component"}
                  </button>
                </div>

                {generatedVisual && (
                  <div className="p-5 rounded-xl border space-y-3 bg-slate-950 text-white font-mono text-xs border-slate-800">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{generatedVisual.title}</span>
                      <button onClick={() => updateSectionContent(`${currentSection?.content || ""}\n\n${generatedVisual.code}`)} className="text-blue-400 hover:underline">
                        + Append to Current Section
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-lg overflow-x-auto text-emerald-400">{generatedVisual.code}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: AI Research Assistant Chat */}
        <div className="w-80 border-l flex flex-col shrink-0" style={{ borderColor: c.divider, background: c.isDark ? "#0f172a" : "#ffffff" }}>
          <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: c.divider }}>
            <Sparkles size={16} className="text-blue-500" />
            <h3 className="text-xs font-bold" style={{ color: c.text }}>AI Research Assistant</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl text-xs ${msg.role === "user" ? "bg-blue-600 text-white ml-6" : "bg-white/5 text-gray-300 mr-6 border border-white/10"}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2" style={{ borderColor: c.divider }}>
            <input
              type="text"
              placeholder="Ask AI to rephrase, cite..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendChat()}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: c.inputBg, color: c.text, border: `1px solid ${c.border}` }}
            />
            <button onClick={handleSendChat} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
