"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, Cell
} from "recharts";
import {
  BarChart3, TrendingUp, Award, Clock, Target, ArrowLeft,
  ChevronRight, Flame, Sparkles, CheckCircle2, XCircle,
  Calendar, User, Code, Briefcase, Loader2, AlertTriangle
} from "lucide-react";
import { generateInterviewPDF } from "@/utils/interview-pdf";

interface SessionSummary {
  id: string;
  role: string;
  company?: string;
  type: string;
  difficulty: string;
  technology?: string;
  status: string;
  overallScore?: number;
  evaluation?: {
    overallScore: number;
    communicationScore: number;
    technicalScore?: number;
    hrScore?: number;
    confidenceScore?: number;
    fluencyScore?: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    summary: string;
    hiringRecommendation: string;
  };
  createdAt: string;
  endedAt?: string;
  duration: number;
  messageCount: number;
  violationCount: number;
}

export default function InterviewAnalyticsPage() {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [filter, setFilter] = useState<"all" | "technical" | "behavioral" | "general">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["interview-history"],
    queryFn: async () => {
      const res = await api.get("/interview/history");
      return res.data.sessions as SessionSummary[];
    },
  });

  const sessions = (data || []).filter(s =>
    filter === "all" ? true : s.type === filter
  );

  const completedSessions = (data || []).filter(s => s.evaluation?.overallScore);

  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) / completedSessions.length)
    : 0;

  const bestScore = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => s.evaluation?.overallScore || 0))
    : 0;

  const latestScore = completedSessions.length > 0
    ? completedSessions[0].evaluation?.overallScore || 0
    : 0;

  // Score trend data (last 10 sessions)
  const trendData = [...completedSessions].reverse().slice(-10).map((s, i) => ({
    index: i + 1,
    score: s.evaluation?.overallScore || 0,
    role: s.role,
    date: new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  }));

  // Score breakdown average
  const radarData = completedSessions.length > 0 ? [
    { subject: "Communication", value: Math.round(completedSessions.reduce((a, s) => a + (s.evaluation?.communicationScore || 0), 0) / completedSessions.length) },
    { subject: "Technical", value: Math.round(completedSessions.filter(s => s.evaluation?.technicalScore).reduce((a, s) => a + (s.evaluation?.technicalScore || 0), 0) / (completedSessions.filter(s => s.evaluation?.technicalScore).length || 1)) },
    { subject: "HR/Behavioral", value: Math.round(completedSessions.filter(s => s.evaluation?.hrScore).reduce((a, s) => a + (s.evaluation?.hrScore || 0), 0) / (completedSessions.filter(s => s.evaluation?.hrScore).length || 1)) },
    { subject: "Confidence", value: Math.round(completedSessions.filter(s => s.evaluation?.confidenceScore).reduce((a, s) => a + (s.evaluation?.confidenceScore || 0), 0) / (completedSessions.filter(s => s.evaluation?.confidenceScore).length || 1)) },
    { subject: "Fluency", value: Math.round(completedSessions.filter(s => s.evaluation?.fluencyScore).reduce((a, s) => a + (s.evaluation?.fluencyScore || 0), 0) / (completedSessions.filter(s => s.evaluation?.fluencyScore).length || 1)) },
  ] : [];

  // Type distribution
  const typeData = ["technical", "behavioral", "general"].map(type => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count: (data || []).filter(s => s.type === type).length,
    color: type === "technical" ? "#06b6d4" : type === "behavioral" ? "#f59e0b" : "#10b981",
  }));

  const scoreColor = (score: number) => score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  const handleDownloadPDF = (session: SessionSummary) => {
    if (!session.evaluation) return;
    generateInterviewPDF({
      sessionId: session.id,
      role: session.role,
      company: session.company,
      type: session.type,
      difficulty: session.difficulty,
      language: "english",
      durationMinutes: session.duration,
      technology: session.technology,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      evaluation: session.evaluation,
    });
  };

  return (
    <div className="min-h-screen bg-[#080710] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/8 bg-[#080710]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-black">Interview Analytics</h1>
              <p className="text-xs text-white/40">Your performance trends & insights</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/interview")}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={13} /> New Interview
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-amber-500" />
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BarChart3 size={28} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">No Interview Data Yet</h2>
            <p className="text-sm text-white/40">Complete your first interview to see analytics</p>
            <button
              onClick={() => router.push("/dashboard/interview")}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
            >
              Start First Interview
            </button>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Interviews", value: data.length, icon: <Calendar size={18} className="text-amber-500" />, color: "amber" },
                { label: "Average Score", value: `${avgScore}%`, icon: <Target size={18} className="text-cyan-500" />, color: "cyan" },
                { label: "Best Score", value: `${bestScore}%`, icon: <Award size={18} className="text-emerald-500" />, color: "emerald" },
                { label: "Latest Score", value: `${latestScore}%`, icon: <TrendingUp size={18} className="text-violet-500" />, color: "violet" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-4 rounded-2xl border border-white/8 bg-white/3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{kpi.label}</span>
                    {kpi.icon}
                  </div>
                  <div className="text-2xl font-black text-white">{kpi.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score Trend */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="md:col-span-2 p-5 rounded-2xl border border-white/8 bg-white/3"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold">Score Trend</h3>
                  <span className="text-[10px] text-white/30 ml-auto">Last {trendData.length} sessions</span>
                </div>
                {trendData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#10101f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: 11 }}
                        formatter={(val: number) => [`${val}%`, "Score"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#f59e0b" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-white/25 text-sm">
                    Complete 2+ interviews to see trend
                  </div>
                )}
              </motion.div>

              {/* Radar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl border border-white/8 bg-white/3"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-cyan-500" />
                  <h3 className="text-sm font-bold">Score Breakdown</h3>
                </div>
                {radarData.length > 0 && radarData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }} />
                      <Radar name="Score" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-white/25 text-sm text-center">
                    Complete interviews to see breakdown
                  </div>
                )}
              </motion.div>
            </div>

            {/* Type distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-5 rounded-2xl border border-white/8 bg-white/3"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={16} className="text-violet-500" />
                  <h3 className="text-sm font-bold">By Interview Type</h3>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={typeData} barSize={28}>
                    <XAxis dataKey="type" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#10101f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: 11 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {typeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Common strengths */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-5 rounded-2xl border border-white/8 bg-white/3 col-span-1 md:col-span-2"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={16} className="text-emerald-500" />
                  <h3 className="text-sm font-bold">Top Strengths Across Interviews</h3>
                </div>
                {completedSessions.length > 0 ? (
                  <ul className="space-y-2">
                    {Array.from(new Set(completedSessions.flatMap(s => s.evaluation?.strengths || []))).slice(0, 5).map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-white/70">{str}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/25 text-center py-8">No data yet</p>
                )}
              </motion.div>
            </div>

            {/* History Table */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold">Interview History</h3>
                </div>
                {/* Filter tabs */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {(["all", "technical", "behavioral", "general"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${filter === f ? "bg-amber-500 text-black" : "text-white/40 hover:text-white/70"}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-white/25 text-sm">
                    No {filter === "all" ? "" : filter} interviews yet
                  </div>
                ) : (
                  sessions.slice(0, 20).map(session => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          session.type === "technical" ? "bg-cyan-500/10" : session.type === "behavioral" ? "bg-amber-500/10" : "bg-emerald-500/10"
                        }`}>
                          {session.type === "technical" ? <Code size={14} className="text-cyan-500" /> :
                           session.type === "behavioral" ? <User size={14} className="text-amber-500" /> :
                           <Briefcase size={14} className="text-emerald-500" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{session.role}{session.company && ` @ ${session.company}`}</div>
                          <div className="text-[10px] text-white/40 capitalize flex items-center gap-1.5 mt-0.5">
                            <span>{session.type}</span>
                            <span>·</span>
                            <span>{session.difficulty}</span>
                            <span>·</span>
                            <span>{new Date(session.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {session.violationCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400">
                            <AlertTriangle size={11} /> {session.violationCount}
                          </div>
                        )}
                        {session.evaluation?.overallScore ? (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                            style={{ background: `${scoreColor(session.evaluation.overallScore)}20`, color: scoreColor(session.evaluation.overallScore) }}
                          >
                            {session.evaluation.overallScore}%
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {session.status}
                          </span>
                        )}
                        <ChevronRight size={14} className="text-white/20" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Session detail panel */}
            {selectedSession?.evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{selectedSession.role} — Detailed Report</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPDF(selectedSession)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold hover:bg-amber-500/20 transition-colors"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5"
                    >
                      <XCircle size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{selectedSession.evaluation.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Strengths</h4>
                    <ul className="space-y-1.5">
                      {selectedSession.evaluation.strengths.map((s, i) => (
                        <li key={i} className="text-[11px] text-white/70 flex items-start gap-1.5">
                          <CheckCircle2 size={11} className="text-emerald-500 mt-0.5 shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Improvements Needed</h4>
                    <ul className="space-y-1.5">
                      {selectedSession.evaluation.weaknesses.map((w, i) => (
                        <li key={i} className="text-[11px] text-white/70 flex items-start gap-1.5">
                          <XCircle size={11} className="text-red-500 mt-0.5 shrink-0" />{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
