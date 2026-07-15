"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Code2, Trophy, Clock, Zap, Star, Flame, Award, ChevronRight, Play,
  Lock, CheckCircle2, ChevronLeft, Calendar, ShieldAlert, Sparkles, RefreshCw, Bookmark
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
import CountUp from "react-countup";
import confetti from "canvas-confetti";

export default function CodingChallengesPage() {
  useRequireAuth("USER");
  const router = useRouter();

  // User and global layout states
  const [user, setUser] = useState<AdyapanUser | null>(null);
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const loadingSteps = [
    "Loading Challenges Catalog",
    "Preparing User Progress",
    "Calculating XP Metrics",
    "Generating Recommendations",
    "Readying Achievements Dashboard"
  ];

  // Coding challenges data
  const [challenges, setChallenges] = useState<any[]>([]);
  const [xpStats, setXpStats] = useState<any>({
    totalXP: 0,
    level: 1,
    levelProgress: 0,
    nextLevelXP: 100,
    dailyStreak: 0,
    weeklyStreak: 0,
    topicStreak: 0,
    achievements: []
  });
  const [recommendedChallenge, setRecommendedChallenge] = useState<any>(null);

  // Active view: "dashboard" or "details"
  const [viewState, setViewState] = useState<"dashboard" | "details">("dashboard");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  
  // Confetti celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedBonusXP, setEarnedBonusXP] = useState(0);

  // Load everything
  useEffect(() => {
    let active = true;
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    const fetchData = async () => {
      try {
        // Fetch User details
        const profileRes = await api.get("/profile");
        if (active && profileRes.data?.user) {
          setUser({
            name: profileRes.data.user.name,
            email: profileRes.data.user.email,
            role: profileRes.data.user.role
          });
        }

        // Fetch XP stats
        const xpRes = await api.get("/coding/xp");
        if (active && xpRes.data?.xpStats) {
          setXpStats(xpRes.data.xpStats);
        }

        // Fetch Recommendations
        const recRes = await api.get("/coding/challenge/recommendations");
        if (active && recRes.data?.recommendation) {
          setRecommendedChallenge(recRes.data.recommendation);
        }

        // Fetch all challenges list
        const challengeListRes = await api.get("/coding/challenges");
        if (active && challengeListRes.data?.challenges) {
          setChallenges(challengeListRes.data.challenges);
        }

        if (active) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load challenges dashboard data", err);
        toast.error("Error loading challenge ecosystem data.");
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch single challenge details when viewing details
  const viewChallengeDetails = async (challengeId: string) => {
    try {
      const res = await api.get(`/coding/challenge/${challengeId}`);
      if (res.data?.challenge) {
        setActiveChallenge(res.data.challenge);
        setSelectedChallengeId(challengeId);
        setViewState("details");
      }
    } catch (err) {
      toast.error("Failed to retrieve challenge details");
    }
  };

  // Sync theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const handleStartChallenge = async (challengeId: string) => {
    try {
      await api.post("/coding/challenge/start", { challengeId });
      toast.success("Challenge started! Solve questions below to unlock next nodes.");
      // Refresh details
      await viewChallengeDetails(challengeId);
      // Refresh list
      const listRes = await api.get("/coding/challenges");
      if (listRes.data?.challenges) {
        setChallenges(listRes.data.challenges);
      }
    } catch (err) {
      toast.error("Failed to start challenge");
    }
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    try {
      const res = await api.post("/coding/challenge/complete", { challengeId });
      if (res.data?.success) {
        // Trigger Confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        setEarnedBonusXP(res.data.xpEarned);
        setShowCelebration(true);
        toast.success(`Congratulations! You earned ${res.data.xpEarned} XP!`);

        // Refresh stats & details
        const xpRes = await api.get("/coding/xp");
        if (xpRes.data?.xpStats) {
          setXpStats(xpRes.data.xpStats);
        }
        
        await viewChallengeDetails(challengeId);

        const listRes = await api.get("/coding/challenges");
        if (listRes.data?.challenges) {
          setChallenges(listRes.data.challenges);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to complete challenge");
    }
  };

  const showComingSoon = () => {
    toast.info("Feature coming soon under Day 17 Portfolio Builder!");
  };

  const handleViewDashboard = () => {
    router.push("/dashboard/user");
  };

  const handleViewTool = (tool: string) => {
    if (tool === "dsa-practice") {
      router.push("/dashboard/coding");
    } else if (tool === "coding-challenges") {
      setViewState("dashboard");
      setSelectedChallengeId(null);
    } else {
      showComingSoon();
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }
  };

  const handleViewProfile = () => {
    router.push("/profile");
  };

  const handleAdyChat = () => {
    router.push("/dashboard/ady-chat");
  };

  const handlePremium = () => {
    router.push("/premium");
  };

  // Find daily challenge card
  const dailyChallenge = challenges.find(c => c.challengeType === "daily");
  
  // Categorize other challenges
  const weeklyChallenges = challenges.filter(c => c.challengeType === "weekly");
  const topicChallenges = challenges.filter(c => c.challengeType === "topic");
  const placementChallenges = challenges.filter(c => c.challengeType === "placement");

  // Loading Spinner/Gauge
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
        <FloatingOrbs />
        <div className="relative z-10 w-full max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin"></div>
              <Trophy className="h-10 w-10 text-amber-500 animate-pulse" />
            </div>
          </motion.div>

          <h2 className="mb-2 text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Preparing Coding Arena
          </h2>
          
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-color)]">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: "0%" }}
              animate={{ width: `${((loadingStepIndex + 1) / loadingSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={loadingStepIndex}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-mono"
            >
              {loadingSteps[loadingStepIndex]}...
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        onComingSoon={showComingSoon}
        activeView="coding"
        onViewDashboard={handleViewDashboard}
        onViewTool={handleViewTool}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Navbar */}
        <DashboardTopNav
          user={user}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onComingSoon={showComingSoon}
          onViewProfile={handleViewProfile}
          onAdyChat={handleAdyChat}
          onViewTool={handleViewTool}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          notifications={notifications}
          setNotifications={setNotifications}
          unreadCount={unreadCount}
          onMarkAllRead={() => {}}
          onClearAll={() => {}}
          onPremium={handlePremium}
          onViewSettings={() => handleViewTool("settings")}
        />

        <main className="relative flex-1 p-6 md:p-8">
          <FloatingOrbs />

          {/* Gamified Celebration Modal */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[var(--bg-card)] p-6 text-center shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl"></div>
                  <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl"></div>
                  
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
                    <Trophy className="h-10 w-10 animate-bounce" />
                  </div>

                  <h3 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    Challenge Completed!
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    You have successfully cracked all coding challenge checkpoints. Excellent algorithm execution!
                  </p>

                  <div className="my-6 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                    <span className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold font-mono block">
                      Bonus Reward claimed
                    </span>
                    <span className="text-3xl font-black text-amber-500 block mt-1">
                      +<CountUp end={earnedBonusXP} duration={1.5} /> XP
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <PremiumButton
                      onClick={() => {
                        setShowCelebration(false);
                        setViewState("dashboard");
                      }}
                      className="flex-1 text-center justify-center"
                    >
                      Return to Dashboard
                    </PremiumButton>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN ECOSYSTEM VIEW */}
          <AnimatePresence mode="wait">
            {viewState === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex flex-col gap-8"
              >
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-7 w-7 text-amber-500" />
                      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                        Coding Challenges
                      </h1>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Crush coding goals, earn level XP, and keep your daily consistency streaks alive!
                    </p>
                  </div>

                  {/* Streak displays */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/25 px-4 py-2 text-orange-500 shadow-sm">
                      <Flame className="h-5 w-5 fill-orange-500 animate-pulse" />
                      <div className="text-left leading-none">
                        <span className="text-xs text-orange-500/80 font-bold block">DAILY STREAK</span>
                        <span className="text-lg font-black">{xpStats.dailyStreak} Days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-2 text-amber-500 shadow-sm">
                      <Zap className="h-5 w-5 fill-amber-500 animate-bounce" />
                      <div className="text-left leading-none">
                        <span className="text-xs text-amber-500/80 font-bold block">WEEKLY STREAK</span>
                        <span className="text-lg font-black">{xpStats.weeklyStreak} Weeks</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Level and XP display / Weak Topic recommendations panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* XP Card */}
                  <div className="lg:col-span-5">
                    <PremiumCard className="relative overflow-hidden h-full flex flex-col justify-between" glow={true}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Star className="h-6 w-6 fill-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-[var(--text-primary)]">Developer Level</h3>
                            <span className="text-xs text-[var(--text-secondary)] font-mono">Level {xpStats.level} Coder</span>
                          </div>
                        </div>
                        <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          {xpStats.totalXP} XP
                        </span>
                      </div>

                      <div className="mt-6 flex-1 flex flex-col justify-end">
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1 font-mono">
                          <span>Progress to Next Level</span>
                          <span>{xpStats.levelProgress}%</span>
                        </div>
                        <PremiumProgressBar value={xpStats.levelProgress} color="amber" height={6} />
                        <span className="text-[10px] text-[var(--text-secondary)] block mt-2 text-right">
                          Next Milestone: {xpStats.nextLevelXP} XP
                        </span>
                      </div>
                    </PremiumCard>
                  </div>

                  {/* Recommendation Card */}
                  <div className="lg:col-span-7">
                    <PremiumCard className="relative overflow-hidden h-full border border-purple-500/20" glow={true}>
                      {recommendedChallenge ? (
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center h-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-purple-400">
                              <Sparkles className="h-5 w-5 fill-purple-400" />
                              <span className="text-xs font-black uppercase tracking-widest font-mono">AI RECOMMENDED CHALLENGE</span>
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
                              {recommendedChallenge.title}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                              <strong>Reason:</strong> {recommendedChallenge.reason}
                            </p>
                            <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-[var(--text-secondary)]">
                              <span className="flex items-center gap-1"><Clock size={14} /> {recommendedChallenge.questionsCount} Problems</span>
                              <span className="text-amber-500">+{recommendedChallenge.xpReward} XP Reward</span>
                            </div>
                          </div>
                          <PremiumButton
                            onClick={() => viewChallengeDetails(recommendedChallenge.id)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/30 whitespace-nowrap self-stretch md:self-auto justify-center text-center items-center flex"
                          >
                            Claim Goal <ChevronRight size={16} />
                          </PremiumButton>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full py-4 text-center">
                          <p className="text-xs text-[var(--text-secondary)]">
                            No recommendations found. Start solving challenges below to feed the AI recommender!
                          </p>
                        </div>
                      )}
                    </PremiumCard>
                  </div>
                </div>

                {/* Daily Challenge Hero Card */}
                {dailyChallenge && (
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-500" /> Active Daily Challenge
                    </h2>
                    <PremiumCard className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 shadow-lg">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <PremiumBadge variant="amber">Daily Checkpoint</PremiumBadge>
                            <span className="text-xs text-amber-500 font-bold font-mono">Resets in 8 hrs</span>
                          </div>
                          <h3 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mt-2">
                            {dailyChallenge.title}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl leading-relaxed">
                            {dailyChallenge.description}
                          </p>

                          <div className="flex flex-wrap gap-4 mt-6 text-xs text-[var(--text-secondary)] font-mono">
                            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                              <Code2 size={14} className="text-amber-500" />
                              <span>{dailyChallenge.difficulty}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                              <Clock size={14} className="text-amber-500" />
                              <span>Est. Time: 20 mins</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                              <Award size={14} className="text-amber-500" />
                              <span className="text-amber-500">+{dailyChallenge.xpReward} XP Reward</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 justify-end items-stretch md:w-48 self-stretch md:self-auto">
                          {dailyChallenge.status === "completed" ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3">
                              <CheckCircle2 className="h-8 w-8 mb-1 animate-pulse" />
                              <span className="text-xs font-bold font-mono">COMPLETED</span>
                            </div>
                          ) : (
                            <PremiumButton
                              onClick={() => {
                                if (dailyChallenge.status === "not_started") {
                                  handleStartChallenge(dailyChallenge.id);
                                } else {
                                  viewChallengeDetails(dailyChallenge.id);
                                }
                              }}
                              className="flex-1 text-center justify-center"
                            >
                              {dailyChallenge.status === "not_started" ? "Start Challenge" : "Resume Challenge"}
                            </PremiumButton>
                          )}
                          <button
                            onClick={() => viewChallengeDetails(dailyChallenge.id)}
                            className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition rounded-xl px-4 py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-1"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </PremiumCard>
                  </div>
                )}

                {/* Challenges lists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Weekly */}
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      Weekly Sprints
                    </h3>
                    <div className="flex flex-col gap-3">
                      {weeklyChallenges.map((c) => (
                        <PremiumCard key={c.id} className="cursor-pointer" onClick={() => viewChallengeDetails(c.id)}>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-amber-500 font-bold font-mono uppercase bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">WEEKLY</span>
                            <span className="text-xs text-[var(--text-secondary)]">{c.totalQuestions} Questions</span>
                          </div>
                          <h4 className="font-bold text-[var(--text-primary)] mt-1.5 text-sm">{c.title}</h4>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-amber-500">+{c.xpReward} XP</span>
                            <span className="text-[var(--text-secondary)] font-mono">{c.progressPercentage}% completed</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${c.progressPercentage}%` }}></div>
                          </div>
                        </PremiumCard>
                      ))}
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      Topic Challenges
                    </h3>
                    <div className="flex flex-col gap-3">
                      {topicChallenges.map((c) => (
                        <PremiumCard key={c.id} className="cursor-pointer" onClick={() => viewChallengeDetails(c.id)}>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-blue-500 font-bold font-mono uppercase bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">TOPIC</span>
                            <span className="text-xs text-[var(--text-secondary)]">{c.totalQuestions} Questions</span>
                          </div>
                          <h4 className="font-bold text-[var(--text-primary)] mt-1.5 text-sm">{c.title}</h4>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-amber-500">+{c.xpReward} XP</span>
                            <span className="text-[var(--text-secondary)] font-mono">{c.progressPercentage}% completed</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${c.progressPercentage}%` }}></div>
                          </div>
                        </PremiumCard>
                      ))}
                    </div>
                  </div>

                  {/* Placement */}
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      Placement Prep
                    </h3>
                    <div className="flex flex-col gap-3">
                      {placementChallenges.map((c) => (
                        <PremiumCard key={c.id} className="cursor-pointer" onClick={() => viewChallengeDetails(c.id)}>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-purple-500 font-bold font-mono uppercase bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">PLACEMENT</span>
                            <span className="text-xs text-[var(--text-secondary)]">{c.totalQuestions} Questions</span>
                          </div>
                          <h4 className="font-bold text-[var(--text-primary)] mt-1.5 text-sm">{c.title}</h4>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-amber-500">+{c.xpReward} XP</span>
                            <span className="text-[var(--text-secondary)] font-mono">{c.progressPercentage}% completed</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${c.progressPercentage}%` }}></div>
                          </div>
                        </PremiumCard>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Achievements List Display */}
                <div>
                  <h3 className="font-bold text-lg tracking-tight text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" /> Unlocked Achievements ({xpStats.achievements.length})
                  </h3>
                  {xpStats.achievements.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {xpStats.achievements.map((ach: any, idx: number) => (
                        <motion.div
                          key={ach.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <PremiumCard className="text-center p-4 border border-amber-500/10 h-full flex flex-col justify-between items-center bg-amber-500/5">
                            <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center mb-2">
                              <Award className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <h4 className="font-black text-xs text-[var(--text-primary)] leading-tight">{ach.name}</h4>
                              <span className="text-[10px] text-[var(--text-secondary)] block mt-1 uppercase font-mono">{ach.rarity}</span>
                            </div>
                            <span className="text-[9px] text-[var(--text-secondary)] font-mono block mt-2">
                              {new Date(ach.unlockedAt).toLocaleDateString()}
                            </span>
                          </PremiumCard>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <PremiumCard className="text-center py-8">
                      <div className="flex justify-center text-[var(--text-secondary)] mb-2">
                        <Award size={36} className="opacity-40 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-[var(--text-primary)]">No achievements unlocked yet</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Start your first coding challenge and begin earning XP to unlock badges.
                      </p>
                    </PremiumCard>
                  )}
                </div>
              </motion.div>
            ) : (
              /* DETAILED VIEW STATE */
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex flex-col gap-6"
              >
                {/* Back button */}
                <button
                  onClick={() => setViewState("dashboard")}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  <ChevronLeft size={16} /> Back to Challenges Hub
                </button>

                {activeChallenge && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: details overview */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      <PremiumCard glow={true}>
                        <PremiumBadge variant="amber" className="capitalize">
                          {activeChallenge.challengeType}
                        </PremiumBadge>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mt-2">
                          {activeChallenge.title}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                          {activeChallenge.description}
                        </p>

                        <div className="mt-6 flex justify-between text-xs text-[var(--text-secondary)] mb-1 font-mono">
                          <span>Overall Progress</span>
                          <span>{activeChallenge.progressPercentage}%</span>
                        </div>
                        <PremiumProgressBar value={activeChallenge.progressPercentage} color="amber" height={6} />

                        {activeChallenge.status === "completed" ? (
                          <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 text-center flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-xs font-bold font-mono">CHALLENGE COMPLETED</span>
                          </div>
                        ) : activeChallenge.status === "not_started" ? (
                          <PremiumButton
                            onClick={() => handleStartChallenge(activeChallenge.id)}
                            className="w-full mt-6 justify-center text-center"
                          >
                            Start Challenge
                          </PremiumButton>
                        ) : (
                          <button
                            onClick={() => handleCompleteChallenge(activeChallenge.id)}
                            disabled={activeChallenge.progressPercentage < 100}
                            className={`w-full mt-6 text-center rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                              activeChallenge.progressPercentage < 100
                                ? "bg-[var(--border-color)] border-[var(--border-color)] text-[var(--text-secondary)] cursor-not-allowed"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-500 hover:from-amber-400 hover:to-orange-400 cursor-pointer shadow-md"
                            }`}
                          >
                            Claim {activeChallenge.xpReward} XP Reward
                          </button>
                        )}
                      </PremiumCard>
                    </div>

                    {/* Right: progressive unlocking list */}
                    <div className="lg:col-span-8">
                      <PremiumCard className="relative min-h-[400px]">
                        <h3 className="font-extrabold text-lg text-[var(--text-primary)] mb-6 flex items-center gap-2">
                          <Code2 className="text-amber-500" /> Milestone Path
                        </h3>

                        {/* Connection lines and checklist nodes */}
                        <div className="relative flex flex-col gap-8 pl-8">
                          {/* Vertical SVG connection line */}
                          <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-[var(--border-color)]">
                            <div
                              className="w-full bg-amber-500 transition-all duration-500"
                              style={{ height: `${activeChallenge.progressPercentage}%` }}
                            ></div>
                          </div>

                          {activeChallenge.questions.map((q: any, idx: number) => (
                            <div key={q.id} className="relative flex items-start gap-4">
                              {/* Connector Dot */}
                              <div className="absolute -left-[31px] top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-[var(--bg-card)] transition shadow-sm">
                                {q.solved ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : !q.unlocked ? (
                                  <Lock className="h-3.5 w-3.5 text-[var(--text-secondary)] opacity-60" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>

                              {/* Question Card */}
                              <div className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 hover:border-amber-500/20 transition">
                                <div className="flex justify-between items-center gap-2">
                                  <div>
                                    <span className="text-[10px] text-[var(--text-secondary)] uppercase font-mono">NODE {idx + 1} • {q.topic}</span>
                                    <h4 className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{q.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      q.difficulty === "Easy"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : q.difficulty === "Medium"
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "bg-rose-500/10 text-rose-500"
                                    }`}>
                                      {q.difficulty}
                                    </span>

                                    {q.unlocked ? (
                                      <button
                                        onClick={() => router.push(`/dashboard/coding/problem/${q.id}`)}
                                        className="text-xs bg-amber-500 text-black px-3 py-1.5 rounded-lg hover:bg-amber-400 font-bold transition flex items-center gap-1"
                                      >
                                        Code <ChevronRight size={14} />
                                      </button>
                                    ) : (
                                      <span className="text-xs text-[var(--text-secondary)] bg-[var(--border-color)] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                                        <Lock size={12} /> Locked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </PremiumCard>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
