"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, Sparkles } from "lucide-react";
import EngineLanding from "./EngineLanding";
import EngineLoading from "./EngineLoading";
import EngineInterview from "./EngineInterview";
import EngineReport from "./EngineReport";
import EngineTranscript from "./EngineTranscript";
import EngineAnalytics from "./EngineAnalytics";
import type { EngineConfig, EngineEvaluation } from "./EngineTypes";

type ViewScreen = "landing" | "loading" | "active" | "report" | "analytics";

interface EngineViewProps {
  theme: string;
}

export default function EngineView({ theme }: EngineViewProps) {
  const [screen, setScreen] = useState<ViewScreen>("landing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [launching, setLaunching] = useState(false);

  const handleStart = useCallback((interviewConfig: EngineConfig) => {
    setConfig(interviewConfig);
    setScreen("loading");
  }, []);

  const handleLoadingComplete = useCallback(async () => {
    if (!config) return;
    setLaunching(true);
    try {
      const res = await api.post("/engine/start", {
        interviewType: config.interviewType,
        targetRole: config.targetRole,
        targetCompany: config.targetCompany || null,
        difficulty: config.difficulty,
        experienceLevel: config.experienceLevel,
        durationMinutes: config.durationMinutes,
        technology: config.technology || null,
        language: config.language,
        aiVoiceEnabled: config.aiVoiceEnabled,
        voiceGender: config.voiceGender,
        voiceSpeed: config.voiceSpeed,
        voicePitch: config.voicePitch,
        resumeAware: config.resumeAware,
        customInstructions: config.customInstructions || "",
      });
      if (res.data.success) {
        setSessionId(res.data.session.id);
        setMessages(res.data.messages || []);
        setScreen("active");
      } else {
        toast.error("Failed to start interview");
        setScreen("landing");
      }
    } catch {
      toast.error("Failed to start interview session");
      setScreen("landing");
    } finally {
      setLaunching(false);
    }
  }, [config, launching]);

  const handleInterviewComplete = useCallback(async (completedSessionId: string) => {
    try {
      toast.info("Generating your evaluation...");
      const res = await api.post(`/engine/${completedSessionId}/evaluate`);
      if (res.data.success) {
        setEvaluation(res.data.evaluation);
        setMessages(res.data.messages || []);
        setScreen("report");
        toast.success("Evaluation complete!");
      } else {
        toast.error("Failed to generate evaluation");
        setScreen("landing");
      }
    } catch {
      toast.error("Failed to generate evaluation");
      setScreen("landing");
    }
  }, []);

  const handleInterviewEnd = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await api.post(`/engine/${sessionId}/end`);
      if (res.data.evaluation) {
        setEvaluation(res.data.evaluation);
      }
      if (res.data.session?.messages) {
        setMessages(res.data.session.messages);
      }
      setScreen("report");
    } catch {
      setScreen("landing");
    }
  }, [sessionId]);

  const handleReset = useCallback(() => {
    setScreen("landing");
    setSessionId(null);
    setEvaluation(null);
    setMessages([]);
    setConfig(null);
  }, []);

  return (
    <div
      className="relative"
      style={{
        background: "var(--bg-dark)",
        color: "var(--text-primary)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header — hidden during active interview (EngineInterview has its own) */}
      {screen !== "landing" && screen !== "active" && (
        <div className="sticky top-0 z-50 border-b border-white/8 bg-[#080710]/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Sparkles size={13} className="text-black" />
                </div>
                <span className="text-sm font-bold hidden sm:inline">AI Interview Engine</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sessionId && (
                <span className="text-[9px] px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  SESSION ACTIVE
                </span>
              )}
              <button
                onClick={() => setScreen("analytics")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold text-white/50 hover:bg-white/5 hover:text-white transition-all"
              >
                <BarChart3 size={12} /> Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Content */}
      <AnimatePresence mode="wait">
        {screen === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <EngineLanding
              onStart={handleStart}
              onViewHistory={() => setScreen("analytics")}
              onViewAnalytics={() => setScreen("analytics")}
            />
          </motion.div>
        )}

        {screen === "loading" && config && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EngineLoading config={config} onComplete={handleLoadingComplete} />
          </motion.div>
        )}

        {screen === "active" && sessionId && config && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <EngineInterview
              sessionId={sessionId}
              config={config}
              onComplete={handleInterviewComplete}
              onEnd={handleInterviewEnd}
            />
          </motion.div>
        )}

        {screen === "report" && sessionId && evaluation && config && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <EngineReport
              sessionId={sessionId}
              evaluation={evaluation}
              messages={messages}
              config={config}
              onRetry={handleReset}
              onViewAnalytics={() => setScreen("analytics")}
              onNewInterview={handleReset}
            />
            <div className="max-w-5xl mx-auto px-4 pb-12">
              <EngineTranscript
                messages={messages}
                sessionId={sessionId}
                config={{
                  interviewType: config.interviewType,
                  targetRole: config.targetRole,
                  targetCompany: config.targetCompany,
                }}
              />
            </div>
          </motion.div>
        )}

        {screen === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <EngineAnalytics
              onBack={handleReset}
              onStartInterview={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
