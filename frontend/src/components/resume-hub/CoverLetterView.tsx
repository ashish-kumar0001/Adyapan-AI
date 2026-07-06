"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import {
  Zap, ArrowLeft, Copy, Download, Trash2,
  Sparkles, RefreshCw, Calendar, FileText, Check
} from "lucide-react";

import type { ResumeHubViewType } from "@/types/resume";

interface CoverLetterItem {
  id: string;
  companyName: string;
  role: string;
  content: string;
  createdAt: string;
}

interface CoverLetterViewProps {
  setView: (v: ResumeHubViewType) => void;
}

export function CoverLetterView({ setView }: CoverLetterViewProps) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<CoverLetterItem[]>([]);

  const loadHistory = async () => {
    try {
      const res = await api.get("/cover-letter/history");
      setHistory(res.data.coverLetters || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async () => {
    if (!companyName || !role) return;
    setLoading(true);
    try {
      const res = await api.post("/cover-letter/generate", {
        companyName,
        role,
        jobDescription,
        tone,
      });
      if (res.data.success && res.data.coverLetter) {
        setContent(res.data.coverLetter.content);
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this cover letter?")) return;
    try {
      await api.delete(`/cover-letter/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (reportIdMatches(id)) setContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const reportIdMatches = (deletedId: string) => {
    const activeItem = history.find(h => h.content === content);
    return activeItem?.id === deletedId;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${companyName.replace(/\s+/g, "_")}_${role.replace(/\s+/g, "_")}_Cover_Letter.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const tones = ["Professional", "Formal", "Confident", "Friendly"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("resume-hub")}
          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] transition-colors border border-[var(--border-color)]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Cover Letter Generator
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">Create personalized, tone-specific letters with AI assistance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Form / Editor */}
        <div className="lg:col-span-7 space-y-6">
          {!content ? (
            <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">Target Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">Job Description (Optional)</label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste details to align cover letter highlights..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2.5 text-xs text-[var(--text-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1.5">Writing Tone</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tones.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${tone === t ? "bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]" : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={loading || !companyName || !role}
                onClick={handleGenerate}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Drafting Letter...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Cover Letter
                  </>
                )}
              </button>
            </div>
          ) : (
            // Editor Console
            <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{companyName} — {role}</h3>
                  <span className="text-[10px] text-[var(--text-secondary)]">Tone: {tone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              <textarea
                rows={16}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-[var(--bg-dark)] border border-[var(--border-color)] focus:border-[var(--border-hover)] focus:outline-none rounded-xl p-4 text-xs text-[var(--text-primary)] leading-relaxed font-mono"
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setContent("")}
                  className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Create New Letter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: History */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#f59e0b]" /> Letters History
          </h2>
          <div className="backdrop-blur-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 max-h-[480px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-semibold">No letters generated yet.</span>
              </div>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setCompanyName(h.companyName);
                    setRole(h.role);
                    setContent(h.content);
                  }}
                  className="p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="min-width-0 flex-1 pr-2">
                    <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#f59e0b] truncate transition-colors">
                      {h.role} @ {h.companyName}
                    </div>
                    <div className="text-[9px] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(h.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(h.id, e)}
                    className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
