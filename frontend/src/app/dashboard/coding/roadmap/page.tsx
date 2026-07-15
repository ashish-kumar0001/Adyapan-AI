"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Code2, Play, Sparkles, Trophy, Clock, RefreshCw, X, ChevronRight,
  HelpCircle, ExternalLink, Check, Award, ChevronDown, CheckCircle2,
  BookOpen, Star, AlertCircle, ShieldAlert, BrainCircuit, Target,
  GraduationCap, Briefcase, Compass
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
} from "../../user/page";

// Onboarding loading steps
const LOADING_STEPS = [
  "Analyzing Coding History",
  "Evaluating Skill Level",
  "Detecting Weak Topics",
  "Generating Roadmap",
  "Building Timeline",
  "Preparing Recommendations",
  "Roadmap Ready!"
];

export default function CodingRoadmapPage() {
  useRequireAuth("USER");

  const router = useRouter();
  const [user, setUser] = useState<AdyapanUser | null>(null);
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>({
    placementReadiness: 0,
    interviewReadiness: 0,
    stats: { solvedCount: 0, challengesCompleted: 0, avgComplexity: 0, avgReview: 0, topicCoverage: 0 }
  });
  const [recommendations, setRecommendations] = useState<any>(null);
  
  // Questionnaire / Onboarding states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [formData, setFormData] = useState({
    skillLevel: "Intermediate",
    targetRole: "SDE-1",
    targetCompany: "FAANG",
    dailyStudyTime: "2 hours",
    targetTimeline: 8,
    preferredLanguage: "C++"
  });

  // Expanded weeks tracker
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true });

  // Load user details and existing roadmap
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // User details
    try {
      const rawUser = localStorage.getItem("adyapan-user") || sessionStorage.getItem("adyapan-user");
      if (rawUser) {
        setUser(JSON.parse(rawUser));
      }
    } catch { /* ignore */ }

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const roadmapRes = await api.get("/coding/roadmap");
      if (roadmapRes.data.roadmap) {
        setRoadmap(roadmapRes.data.roadmap);
        
        // Fetch readiness and recommendations only if roadmap exists
        const [readinessRes, recRes] = await Promise.all([
          api.get("/coding/roadmap/readiness"),
          api.get("/coding/roadmap/recommendations")
        ]);
        setReadiness(readinessRes.data.readiness);
        setRecommendations(recRes.data.recommendations);
      }
    } catch (err) {
      console.error("Failed to load roadmap data", err);
      toast.error("Could not fetch roadmap details");
    } finally {
      setLoading(false);
    }
  };

  // Simulate premium roadmap generation checkpoints
  const triggerGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLoadingStepIdx(0);

    // Step 1: Start UI animation
    const stepInterval = setInterval(() => {
      setLoadingStepIdx((prev) => {
        if (prev < LOADING_STEPS.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    try {
      // Step 2: Make actual generate API call
      const res = await api.post("/coding/roadmap/generate", formData);
      
      // Step 3: Complete steps once API returns
      clearInterval(stepInterval);
      setLoadingStepIdx(LOADING_STEPS.length - 2);
      
      setTimeout(() => {
        setLoadingStepIdx(LOADING_STEPS.length - 1);
        setTimeout(() => {
          setRoadmap(res.data.roadmap);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
          setIsGenerating(false);
          fetchData(); // refresh metrics and recommendations
        }, 600);
      }, 500);

    } catch (err) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      toast.error("AI Roadmap generation failed. Please try again.");
    }
  };

  const handleUpdateProgress = async () => {
    try {
      toast.loading("Syncing roadmap progress with workspace...", { id: "sync" });
      const res = await api.post("/coding/roadmap/update");
      setRoadmap(res.data.roadmap);
      
      const [readinessRes, recRes] = await Promise.all([
        api.get("/coding/roadmap/readiness"),
        api.get("/coding/roadmap/recommendations")
      ]);
      setReadiness(readinessRes.data.readiness);
      setRecommendations(recRes.data.recommendations);

      toast.success("Progress synced successfully!", { id: "sync" });
      
      if (res.data.roadmap?.completionPercentage === 100) {
        confetti({ particleCount: 200, spread: 100 });
      }
    } catch {
      toast.error("Failed to sync progress", { id: "sync" });
    }
  };

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  const handleResetRoadmap = () => {
    if (window.confirm("Are you sure you want to discard your current roadmap and generate a new one?")) {
      setRoadmap(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Dynamic Background Orbs */}
      <FloatingOrbs />

      {/* Dashboard Sidebar */}
      <DashboardSidebar
        onComingSoon={() => toast.info("Coming soon!")}
        activeView="coding"
        onViewDashboard={() => router.push("/dashboard/user")}
        onViewTool={(tool) => {
          if (tool === "dsa-practice") router.push("/dashboard/coding");
          else router.push(`/dashboard/user?view=${tool}`);
        }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto px-4 md:px-8 py-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
              <Compass className="w-8 h-8 text-amber-500 animate-spin-slow" />
              AI Coding Roadmap
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Your personalized pathway to interview ready proficiency. Optimized with learning analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {roadmap && (
              <>
                <PremiumButton variant="secondary" className="text-xs py-2" onClick={handleUpdateProgress}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Sync Progress
                </PremiumButton>
                <button
                  onClick={handleResetRoadmap}
                  className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition"
                >
                  Regenerate
                </button>
              </>
            )}
          </div>
        </div>

        {/* LOADING ONBOARDING STATE */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"
              />
              <p className="text-sm text-slate-400">Loading your profile roadmap...</p>
            </div>
          ) : isGenerating ? (
            // Custom Loading Checkpoint Sequence Reveal
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto py-16 text-center"
            >
              <PremiumCard variant="bordered" className="p-8 w-full">
                <BrainCircuit className="w-16 h-16 text-amber-500 mx-auto mb-6 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-100 mb-4">Building Your Personalized Path</h3>
                
                <div className="space-y-3 text-left max-w-xs mx-auto mb-6">
                  {LOADING_STEPS.map((step, idx) => {
                    const isDone = idx < loadingStepIdx;
                    const isActive = idx === loadingStepIdx;
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isDone || isActive ? 1 : 0.25, x: 0 }}
                        className="flex items-center gap-3"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : isActive ? (
                          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${isActive ? "text-amber-400 font-bold" : "text-slate-300"}`}>
                          {step}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(loadingStepIdx / (LOADING_STEPS.length - 1)) * 100}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
              </PremiumCard>
            </motion.div>
          ) : !roadmap ? (
            // Onboarding Questionnaire Forms (Empty State)
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto w-full"
            >
              <PremiumCard variant="glass" className="p-8 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <GraduationCap className="w-36 h-36" />
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  <h2 className="text-xl font-bold text-slate-100">Setup Coding Roadmap</h2>
                </div>

                <p className="text-xs md:text-sm text-slate-400 mb-6">
                  Answer a few questions about your preparation status and targeted placements. Our AI agent will calculate your readiness footprint and map out a optimized roadmap timeline.
                </p>

                <form onSubmit={triggerGeneration} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Skill Level Selection */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Current Skill Level</label>
                      <select
                        value={formData.skillLevel}
                        onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                        className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Beginner">Beginner (No core DSA knowledge)</option>
                        <option value="Intermediate">Intermediate (Familiar with arrays/stacks, weak on tree/graph)</option>
                        <option value="Advanced">Advanced (Strong logic, practicing hard/optimization)</option>
                      </select>
                    </div>

                    {/* Target Company Track */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Target Track</label>
                      <select
                        value={formData.targetCompany}
                        onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                        className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="FAANG">FAANG Track (Google, Amazon, Microsoft)</option>
                        <option value="Product Companies">Product Companies Track (Uber, Atlassian, Stripe)</option>
                        <option value="Startup">Startup Track (Rapid problem solving, Full-stack coding)</option>
                        <option value="Accenture">Service Tech Track (Accenture, TCS, Infosys)</option>
                        <option value="Competitive Programming">Competitive Programming Track</option>
                      </select>
                    </div>

                    {/* Target Role */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Target Role</label>
                      <select
                        value={formData.targetRole}
                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                        className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Internship">Internship Placement</option>
                        <option value="Placement">Campus Placement (Entry level SDE)</option>
                        <option value="SDE-1">SDE-1 Role (Full-time placement)</option>
                      </select>
                    </div>

                    {/* Timeline Weeks Selection */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Timeline Weeks</label>
                      <select
                        value={formData.targetTimeline}
                        onChange={(e) => setFormData({ ...formData, targetTimeline: Number(e.target.value) })}
                        className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="4">4 Weeks (Fast Crash Course)</option>
                        <option value="6">6 Weeks (Standard path)</option>
                        <option value="8">8 Weeks (Thorough prep - Recommended)</option>
                        <option value="12">12 Weeks (Extended deep dive)</option>
                      </select>
                    </div>

                    {/* Preferred Programming Language */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Preferred Language</label>
                      <select
                        value={formData.preferredLanguage}
                        onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                        className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="C++">C++</option>
                        <option value="Java">Java</option>
                        <option value="Python">Python</option>
                        <option value="JavaScript">JavaScript</option>
                      </select>
                    </div>

                    {/* Daily Study Time */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Daily Study Time</label>
                      <select
                        value={formData.dailyStudyTime}
                        onChange={(e) => setFormData({ ...formData, dailyStudyTime: e.target.value })}
                        className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="1 hour">1 Hour / Day</option>
                        <option value="2 hours">2 Hours / Day</option>
                        <option value="4 hours">4 Hours / Day</option>
                        <option value="6+ hours">6+ Hours / Day</option>
                      </select>
                    </div>

                  </div>

                  <PremiumButton type="submit" className="w-full py-4 text-sm mt-4">
                    <Sparkles className="w-4 h-4 mr-2" /> Generate AI Roadmap
                  </PremiumButton>
                </form>
              </PremiumCard>
            </motion.div>
          ) : (
            // ACTIVE ROADMAP DASHBOARD
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
            >
              
              {/* Timeline Tree Panel (Left & Center) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Score and Analytics Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Placement Readiness Score Meter */}
                  <PremiumCard variant="glass" className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Placement Readiness</span>
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    
                    <div className="flex items-center gap-5 my-2">
                      <div className="relative w-18 h-18 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 shadow-glow">
                        <span className="text-2xl font-extrabold text-amber-400">
                          {readiness?.placementReadiness}
                        </span>
                        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 pointer-events-none" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">Ready Track</div>
                        <div className="text-xs text-slate-400">Targeting {roadmap?.targetCompany}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xxs text-slate-500 mb-1">
                        <span>Roadmap Completion</span>
                        <span>{roadmap?.completionPercentage}%</span>
                      </div>
                      <PremiumProgressBar value={roadmap?.completionPercentage || 0} />
                    </div>
                  </PremiumCard>

                  {/* Interview Readiness Score Meter */}
                  <PremiumCard variant="glass" className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interview Readiness</span>
                      <Target className="w-5 h-5 text-orange-500" />
                    </div>

                    <div className="flex items-center gap-5 my-2">
                      <div className="relative w-18 h-18 flex items-center justify-center rounded-full bg-slate-900 border border-white/5">
                        <span className="text-2xl font-extrabold text-orange-400">
                          {readiness?.interviewReadiness}
                        </span>
                        <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 pointer-events-none" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">DSA Coverage</div>
                        <div className="text-xs text-slate-400">{readiness?.stats?.topicCoverage} core categories covered</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xxs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Code Review: {readiness?.stats?.avgReview}/100</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5 text-orange-500" />
                        <span>Complexity: {readiness?.stats?.avgComplexity}/100</span>
                      </div>
                    </div>
                  </PremiumCard>
                </div>

                {/* Interactive timeline tree */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Roadmap Path Weeks</h3>
                    <span className="text-xs text-slate-500">{roadmap?.weeks?.length} weeks structured</span>
                  </div>

                  <div className="space-y-3">
                    {roadmap?.weeks?.map((week: any) => {
                      const isOpen = expandedWeeks[week.week];
                      const isWeekCompleted = week.status === "completed";
                      const isWeekInProgress = week.status === "in_progress";

                      return (
                        <PremiumCard
                          key={week.week}
                          variant={isWeekInProgress ? "bordered" : "glass"}
                          className="border-white/5 transition-all duration-300"
                        >
                          {/* Week header bar */}
                          <div
                            onClick={() => toggleWeek(week.week)}
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.015]"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isWeekCompleted ? "bg-green-500/20 text-green-400" :
                                isWeekInProgress ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
                              }`}>
                                {isWeekCompleted ? <Check className="w-4 h-4" /> : `W${week.week}`}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                  {week.title}
                                  {isWeekCompleted && <span className="text-xxs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Completed</span>}
                                  {isWeekInProgress && <span className="text-xxs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Active</span>}
                                </h4>
                                <p className="text-xxs text-slate-400 mt-0.5">{week.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-semibold">{week.completion_percentage}%</span>
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </div>
                          </div>

                          {/* Expanded content */}
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-white/5 bg-slate-950/20"
                              >
                                <div className="p-5 space-y-4">
                                  
                                  {/* Week summary details */}
                                  <div className="flex flex-wrap gap-4 text-xxs text-slate-400">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg">
                                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Target: {week.target_question_count} problems</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg">
                                      <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Progression: {week.difficulty_progression}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg">
                                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Topics: {week.topics.join(", ")}</span>
                                    </div>
                                  </div>

                                  {/* Recommended questions checklist */}
                                  <div className="space-y-2">
                                    <div className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Recommended Workspace Tasks</div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {week.recommended_questions?.map((q: any) => {
                                        const isSolved = q.solved;
                                        return (
                                          <div
                                            key={q.id}
                                            className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition"
                                          >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                              {isSolved ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                              ) : (
                                                <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                                              )}
                                              <div className="overflow-hidden">
                                                <div className="text-xs font-semibold text-slate-200 truncate">{q.title}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                  <span className={`text-[10px] ${
                                                    q.difficulty === "Easy" ? "text-green-400" :
                                                    q.difficulty === "Medium" ? "text-amber-400" : "text-red-400"
                                                  }`}>
                                                    {q.difficulty}
                                                  </span>
                                                  <span className="text-[10px] text-slate-500">•</span>
                                                  <span className="text-[10px] text-slate-500 truncate">{q.topic}</span>
                                                </div>
                                              </div>
                                            </div>

                                            <PremiumButton
                                              variant={isSolved ? "ghost" : "glow"}
                                              className="text-[10px] py-1 px-3"
                                              onClick={() => router.push(`/dashboard/coding/problem/${q.id}`)}
                                            >
                                              {isSolved ? "Review" : "Solve"} <Play className="w-2.5 h-2.5 ml-1 fill-current" />
                                            </PremiumButton>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </PremiumCard>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Sidebar AI Assistant/Coach Panels (Right) */}
              <div className="space-y-6">
                
                {/* AI Coach Guidance Card */}
                <PremiumCard variant="bordered" className="p-5 border-amber-500/10">
                  <div className="flex items-center gap-2.5 mb-3 text-amber-500">
                    <BrainCircuit className="w-5 h-5" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">AI Placement Mentor</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-white/5 mb-4">
                    "{roadmap?.guidance}"
                  </p>

                  <div className="text-xxs text-slate-400 leading-relaxed">
                    Overall roadmap completed: <strong>{roadmap?.completionPercentage}%</strong>. Complete weekly milestones by solving recommended question cards to unlock higher readiness statistics.
                  </div>
                </PremiumCard>

                {/* Recommendations card */}
                {recommendations && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">AI Recommendations</h3>
                    
                    {/* Study Next recommendation */}
                    <PremiumCard variant="glass" className="p-4 flex gap-3.5 items-start">
                      <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Study Next</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">{recommendations.studyNext?.topic}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{recommendations.studyNext?.reason}</div>
                      </div>
                    </PremiumCard>

                    {/* Practice Next recommendation */}
                    <PremiumCard variant="glass" className="p-4 flex gap-3.5 items-start">
                      <Play className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Practice Next</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">{recommendations.practiceNext?.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{recommendations.practiceNext?.reason}</div>
                        
                        {recommendations.practiceNext?.id && (
                          <PremiumButton
                            variant="primary"
                            className="text-[10px] py-1 px-3 mt-3 w-full"
                            onClick={() => router.push(`/dashboard/coding/problem/${recommendations.practiceNext.id}`)}
                          >
                            Solve Problem <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </PremiumButton>
                        )}
                      </div>
                    </PremiumCard>

                    {/* Revise Next recommendation */}
                    <PremiumCard variant="glass" className="p-4 flex gap-3.5 items-start">
                      <RefreshCw className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Revise Next</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">{recommendations.reviseNext?.topic}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{recommendations.reviseNext?.reason}</div>
                      </div>
                    </PremiumCard>

                    {/* Challenge Next recommendation */}
                    <PremiumCard variant="glass" className="p-4 flex gap-3.5 items-start">
                      <Trophy className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Challenge Next</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">{recommendations.challengeNext?.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{recommendations.challengeNext?.reason}</div>
                      </div>
                    </PremiumCard>

                  </div>
                )}

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
