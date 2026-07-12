"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { HeroProgressSection } from "./HeroProgressSection";
import { TopicProgressTracker, type TopicProgressItem } from "./TopicProgressTracker";
import { ConceptMasteryMap, type ConceptMasteryItem } from "./ConceptMasteryMap";
import { LearningTimeline, type TimelineEvent } from "./LearningTimeline";
import { MilestoneSystem, type MilestoneItem } from "./MilestoneSystem";
import { RevisionQueue, type RevisionQueueItem } from "./RevisionQueue";
import { KnowledgeGrowthChart, type GrowthDataPoint } from "./KnowledgeGrowthChart";
import { AIInsightsPanel, type RecommendationItem } from "./AIInsightsPanel";
import {
  TrendingUp, Brain, BookOpen, Trophy, RotateCcw,
  BarChart3, Sparkles, Clock, CheckSquare, RefreshCw,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProgressData {
  overallProgress: number;
  learningLevel: number;
  learningLevelName: string;
  masteryScore: number;
  masteryGrade: string;
  topicsCompleted: number;
  documentsCompleted: number;
  questionsPracticed: number;
  studySessions: number;
  currentStreak: number;
  status: string;
  topicProgress: TopicProgressItem[];
  conceptMastery: ConceptMasteryItem[];
  milestones: MilestoneItem[];
  revisionQueue: RevisionQueueItem[];
  timeline: TimelineEvent[];
  insights: string[];
  recommendations: RecommendationItem[];
  knowledgeGrowth: GrowthDataPoint[];
}

// ─── Loading Screen ──────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Collecting Learning Activity",
  "Calculating Progress",
  "Tracking Topic Completion",
  "Measuring Concept Mastery",
  "Building Learning Journey",
  "Generating Recommendations",
  "Complete",
];

function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setCurrentStep(i), i * 500)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="mb-8"
      >
        <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 border-t-violet-500 flex items-center justify-center">
          <TrendingUp size={22} className="text-violet-400" />
        </div>
      </motion.div>

      <h3 className="text-lg font-bold text-white mb-6">Analyzing Your Learning Journey</h3>

      <div className="w-full max-w-sm space-y-3">
        {LOADING_STEPS.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: i <= currentStep ? 1 : 0.25, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: i <= currentStep ? 1 : 0.5 }}
              transition={{ delay: i * 0.5, type: "spring", stiffness: 300 }}
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                i < currentStep
                  ? "bg-emerald-500"
                  : i === currentStep
                  ? "bg-violet-500 animate-pulse"
                  : "bg-white/10"
              }`}
            >
              {i < currentStep && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </motion.div>
            <span className={`text-sm font-semibold ${i <= currentStep ? "text-white/80" : "text-white/20"}`}>
              {step}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCalculate }: { onCalculate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="text-7xl mb-6"
      >
        📚
      </motion.div>
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 0.3, ease: "easeInOut" }}
        className="text-4xl mb-6"
      >
        🎓
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-3">Your Learning Journey Starts Here</h2>
      <p className="text-white/50 text-sm max-w-md mb-8 leading-relaxed">
        Upload your first document and use AI tools to unlock intelligent progress tracking, 
        concept mastery mapping, and personalized learning insights.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCalculate}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-lg hover:shadow-violet-500/25 transition-all"
      >
        <TrendingUp size={16} />
        Calculate My Progress
      </motion.button>
    </motion.div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, iconColor, children, id,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="p-6 rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-xl ${iconColor.replace("text-", "bg-").replace("400", "400/10").replace("500", "500/10")}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function ProgressDashboard() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/progress/dashboard");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      // If no data exists yet, show empty state
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        setData(null);
      } else {
        setError("Failed to load progress data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCalculate = useCallback(async () => {
    setCalculating(true);
    setError(null);
    try {
      const res = await api.post("/progress/calculate");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError("Failed to calculate progress. Please try again.");
    } finally {
      setCalculating(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hasData = data && (data.documentsCompleted > 0 || data.topicProgress.length > 0 || data.overallProgress > 0);

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      {data && !loading && (
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCalculate}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
          >
            <RefreshCw size={13} className={calculating ? "animate-spin" : ""} />
            {calculating ? "Recalculating..." : "Recalculate"}
          </motion.button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading || calculating ? (
          <LoadingScreen key="loading" />
        ) : error ? (
          <motion.div key="error" className="text-center py-16">
            <p className="text-red-400 font-semibold">{error}</p>
            <button onClick={fetchDashboard} className="mt-4 text-sm text-white/50 underline">
              Try again
            </button>
          </motion.div>
        ) : !hasData ? (
          <EmptyState key="empty" onCalculate={handleCalculate} />
        ) : (
          <motion.div key="dashboard" className="space-y-6">
            {/* ─ Hero ─ */}
            <HeroProgressSection
              overallProgress={data!.overallProgress}
              learningLevel={data!.learningLevel}
              learningLevelName={data!.learningLevelName}
              topicsCompleted={data!.topicsCompleted}
              documentsCompleted={data!.documentsCompleted}
              studySessions={data!.studySessions}
              currentStreak={data!.currentStreak}
              status={data!.status}
              masteryScore={data!.masteryScore}
              masteryGrade={data!.masteryGrade}
            />

            {/* ─ Two Column: Topic Progress + Revision Queue ─ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Section title="Topic Progress Tracker" icon={BookOpen} iconColor="text-violet-400" id="topics">
                  <TopicProgressTracker topics={data!.topicProgress} />
                </Section>
              </div>
              <div className="lg:col-span-1">
                <Section title="Revision Queue" icon={RotateCcw} iconColor="text-amber-400" id="revision">
                  <RevisionQueue queue={data!.revisionQueue} />
                </Section>
              </div>
            </div>

            {/* ─ Knowledge Growth Chart ─ */}
            <Section title="Knowledge Growth" icon={BarChart3} iconColor="text-emerald-400" id="growth">
              <KnowledgeGrowthChart data={data!.knowledgeGrowth} />
            </Section>

            {/* ─ Concept Mastery Map ─ */}
            <Section title="Concept Mastery Map" icon={Brain} iconColor="text-blue-400" id="concepts">
              <ConceptMasteryMap concepts={data!.conceptMastery} />
            </Section>

            {/* ─ Milestones ─ */}
            <Section title="Achievements & Milestones" icon={Trophy} iconColor="text-amber-400" id="milestones">
              <MilestoneSystem milestones={data!.milestones} />
            </Section>

            {/* ─ Timeline + AI Panel side by side ─ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Learning Journey Timeline" icon={Clock} iconColor="text-teal-400" id="timeline">
                <LearningTimeline events={data!.timeline} />
              </Section>
              <Section title="AI Insights & Recommendations" icon={Sparkles} iconColor="text-violet-400" id="insights">
                <AIInsightsPanel insights={data!.insights} recommendations={data!.recommendations} />
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

