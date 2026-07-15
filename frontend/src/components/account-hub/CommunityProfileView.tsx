"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Award, Users, Globe, Share2, MessageSquare,
  ExternalLink, Star, BookOpen, Code2, FileText, Trophy, Target,
  TrendingUp, Calendar, Clock, Eye, Heart, Download, ArrowUpRight,
  Zap, Brain, GraduationCap, Shield, Flame, ChevronRight, Search,
  Bookmark, Award as AwardIcon, Lightbulb, Layers, GitBranch, Play,
  Quote, BadgeCheck, Rocket, Coffee, Crown, Medal, Sparkles, BrainCircuit,
  BarChart3, Activity, Folder, Image as ImageIcon, Presentation
} from "lucide-react";

function Github({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function Linkedin({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
import { toast } from "sonner";
import { api } from "@/services/api";
import { getDiceBearUrl } from "@/lib/avatar";
import {
  PremiumCard, PremiumButton, PremiumBadge, PremiumProgressRing,
  PremiumProgressBar, AnimatedSkeleton
} from "@/components/ui/PremiumComponents";

// ─── Animation Variants ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.3 } }),
};
const slideRight = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({ opacity: 1, x: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

// ─── Theme Hook ──────────────────────────────────────────────────────────
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
  return theme;
}

// ─── Profile Interface ───────────────────────────────────────────────────
interface ProfileData {
  id: string;
  userId: string;
  username: string | null;
  phone: string | null;
  location: string | null;
  aboutMe: string | null;
  college: string | null;
  branch: string | null;
  degree: string | null;
  graduationYear: string | null;
  skills: string[];
  interestedDomains: string[];
  targetRole: string | null;
  careerObjective: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  resumeUrl: string | null;
  resumeName: string | null;
  user?: { id: string; name: string; email: string; role: string };
}

// ─── Mock Data ───────────────────────────────────────────────────────────
const MOCK_PROJECTS = [
  { title: "Adyapan AI Dashboard", desc: "Full-stack AI-powered education platform with real-time analytics, personalized learning paths, and intelligent tutoring.", tech: ["Next.js", "TypeScript", "Python", "PostgreSQL"], stars: 142, likes: 89, views: 2340, status: "completed" as const, github: "#", demo: "#" },
  { title: "Neural Code Reviewer", desc: "AI tool that reviews code for bugs, security vulnerabilities, and performance issues using LLMs.", tech: ["Python", "FastAPI", "OpenAI", "Docker"], stars: 98, likes: 67, views: 1890, status: "completed" as const, github: "#", demo: "#" },
  { title: "Research Paper Generator", desc: "Automated research paper drafting with citation management, plagiarism detection, and formatting.", tech: ["React", "Node.js", "LangChain", "LaTeX"], stars: 76, likes: 54, views: 1230, status: "in-progress" as const, github: "#", demo: "#" },
];

const MOCK_RESEARCH = [
  { title: "Transformer-Based Automated Code Review for Educational Platforms", abstract: "We propose a novel approach using fine-tuned transformer models to provide automated, context-aware code review feedback tailored for student submissions in educational coding environments.", date: "Mar 2026", domain: "AI in Education", keywords: ["Transformers", "NLP", "Code Review", "EdTech"], citations: 12, downloads: 340 },
  { title: "Adaptive Learning Path Optimization Using Reinforcement Learning", abstract: "This paper presents an RL-based framework for dynamically optimizing personalized learning sequences based on student performance metrics and cognitive load estimation.", date: "Nov 2025", domain: "Machine Learning", keywords: ["Reinforcement Learning", "Adaptive Learning", "Student Modeling"], citations: 8, downloads: 210 },
];

const MOCK_CERTIFICATIONS = [
  { org: "Google", name: "Machine Learning Specialization", date: "Jan 2026", credentialId: "GML-2026-AK9F2", icon: "G" },
  { org: "AWS", name: "Solutions Architect Associate", date: "Sep 2025", credentialId: "AWS-SAA-8812K", icon: "A" },
  { org: "Meta", name: "Front-End Developer Professional", date: "Jun 2025", credentialId: "META-FE-2025-PL", icon: "M" },
];

const MOCK_ACHIEVEMENTS = [
  { name: "Top Contributor", desc: "Top 1% community contributor", icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", rarity: "Legendary" },
  { name: "AI Expert", desc: "100+ AI problems solved", icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-500/10", rarity: "Epic" },
  { name: "Research Scholar", desc: "Published 2+ papers", icon: BookOpen, color: "text-cyan-500", bg: "bg-cyan-500/10", rarity: "Rare" },
  { name: "Coding Champion", desc: "500+ DSA problems", icon: Code2, color: "text-emerald-500", bg: "bg-emerald-500/10", rarity: "Epic" },
  { name: "Fast Learner", desc: "Completed 10 courses in a month", icon: Rocket, color: "text-orange-500", bg: "bg-orange-500/10", rarity: "Rare" },
  { name: "Mentor Choice", desc: "Rated best mentor by peers", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10", rarity: "Epic" },
  { name: "Community Helper", desc: "Answered 200+ questions", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", rarity: "Common" },
  { name: "Open Source Hero", desc: "10+ accepted PRs", icon: GitBranch, color: "text-teal-500", bg: "bg-teal-500/10", rarity: "Rare" },
];

const MOCK_TIMELINE = [
  { time: "2 days ago", action: "Published research paper on Adaptive Learning", icon: BookOpen, color: "text-cyan-500" },
  { time: "1 week ago", action: "Uploaded project: Neural Code Reviewer", icon: Folder, color: "text-purple-500" },
  { time: "2 weeks ago", action: "Earned badge: AI Expert", icon: BrainCircuit, color: "text-amber-500" },
  { time: "1 month ago", action: "Completed Google ML Specialization", icon: GraduationCap, color: "text-emerald-500" },
  { time: "1 month ago", action: "Won weekly coding contest", icon: Trophy, color: "text-orange-500" },
  { time: "2 months ago", action: "Joined Adyapan AI community", icon: Rocket, color: "text-blue-500" },
];

const MOCK_INTERESTS = [
  "Artificial Intelligence", "Machine Learning", "Cyber Security", "Cloud Computing",
  "Data Science", "Web Development", "Competitive Programming", "Research", "Robotics", "Blockchain"
];

const MOCK_SKILLS = {
  programming: [
    { name: "Python", level: 92, endorsements: 48 },
    { name: "JavaScript", level: 88, endorsements: 42 },
    { name: "TypeScript", level: 82, endorsements: 35 },
    { name: "Java", level: 75, endorsements: 28 },
    { name: "C++", level: 70, endorsements: 22 },
    { name: "SQL", level: 85, endorsements: 30 },
  ],
  ai: [
    { name: "Machine Learning", level: 90, endorsements: 52 },
    { name: "Deep Learning", level: 85, endorsements: 40 },
    { name: "NLP", level: 78, endorsements: 32 },
    { name: "Computer Vision", level: 72, endorsements: 26 },
    { name: "TensorFlow", level: 80, endorsements: 35 },
    { name: "PyTorch", level: 82, endorsements: 38 },
  ],
  development: [
    { name: "React", level: 90, endorsements: 45 },
    { name: "Next.js", level: 88, endorsements: 42 },
    { name: "Node.js", level: 85, endorsements: 38 },
    { name: "MongoDB", level: 78, endorsements: 28 },
    { name: "Docker", level: 75, endorsements: 25 },
    { name: "Git", level: 92, endorsements: 50 },
  ],
};

const MOCK_RECOMMENDATIONS = [
  { name: "Priya Sharma", role: "ML Engineer @ Google", text: "Ashish is an exceptional developer with deep knowledge of AI/ML. His research contributions are outstanding.", rating: 5 },
  { name: "Rohan Patel", role: "SDE @ Microsoft", text: "One of the most dedicated peers I've worked with. Strong problem-solving skills and great team player.", rating: 5 },
  { name: "Ananya Reddy", role: "Research Scholar @ IIT", text: "Brilliant researcher with a passion for education technology. Highly recommend for any collaborative project.", rating: 4 },
];

const CONTRIBUTION_DATA = Array.from({ length: 91 }, () => Math.floor(Math.random() * 5));
const LANG_DIST = [
  { name: "Python", percent: 35, color: "from-blue-500 to-cyan-500" },
  { name: "JavaScript", percent: 28, color: "from-amber-500 to-orange-500" },
  { name: "TypeScript", percent: 18, color: "from-blue-600 to-blue-400" },
  { name: "Java", percent: 12, color: "from-red-500 to-rose-500" },
  { name: "C++", percent: 7, color: "from-purple-500 to-indigo-500" },
];

// ─── Section Tabs Config ─────────────────────────────────────────────────
const SECTION_TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "research", label: "Research", icon: BookOpen },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "achievements", label: "Achievements", icon: Trophy },
] as const;

type TabId = (typeof SECTION_TABS)[number]["id"];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function CommunityProfileView() {
  const theme = useTheme();
  const isDark = theme === "dark";

  const c = useMemo(() => ({
    text: isDark ? "#ffffff" : "#0f172a",
    textSec: isDark ? "rgba(255,255,255,0.7)" : "#475569",
    textMuted: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    cardBgHover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.02)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    primary: "#f59e0b",
    inputBg: isDark ? "rgba(0,0,0,0.4)" : "#f8fafc",
  }), [isDark]);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [skillFilter, setSkillFilter] = useState<keyof typeof MOCK_SKILLS>("programming");
  const [projectFilter, setProjectFilter] = useState("all");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        setProfile(res.data.profile);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  };

  // ── Derived data from profile ──
  const displayName = profile?.user?.name ?? "Ashish Kumar";
  const username = profile?.username ? `@${profile.username}` : "@ashishk";
  const bio = profile?.aboutMe || profile?.careerObjective || "Passionate AI researcher and full-stack developer building the future of education technology.";
  const displaySkills = profile?.skills?.length ? profile.skills : MOCK_SKILLS.programming.map(s => s.name);

  if (loading) {
    return (
      <div className="space-y-4">
        <AnimatedSkeleton type="card" className="h-[200px]" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <AnimatedSkeleton key={i} type="card" className="h-[100px]" />)}
        </div>
        <AnimatedSkeleton type="card" className="h-[300px]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5" style={{ color: c.text }}>

      {/* ── Hero Profile ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="rounded-2xl border overflow-hidden" style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
        {/* Cover Banner */}
        <div className="h-32 sm:h-40 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(139,92,246,0.15), rgba(6,182,212,0.1))" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(245,158,11,0.15) 0%, transparent 60%)" }} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 sm:-mt-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 shadow-lg"
                style={{ borderColor: isDark ? "#0c0d16" : "#ffffff", boxShadow: "0 0 20px rgba(245,158,11,0.2)" }}>
                <img src={getDiceBearUrl(displayName)} alt="avatar" width={96} height={96} className="block" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 flex items-center justify-center"
                style={{ borderColor: isDark ? "#0c0d16" : "#ffffff" }}>
                <BadgeCheck size={12} className="text-white" />
              </div>
            </motion.div>
            <div className="flex-1 text-center sm:text-left pb-1">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h1 className="text-xl font-extrabold">{displayName}</h1>
                <PremiumBadge variant="amber" pulse>Pro</PremiumBadge>
              </div>
              <span className="text-xs font-bold" style={{ color: c.textMuted }}>{username} · {profile?.targetRole || "AI Researcher & Full-Stack Developer"}</span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-[10px]" style={{ color: c.textMuted }}>
                <span className="flex items-center gap-1"><GraduationCap size={11} /> {profile?.college || "IIT Delhi"} · {profile?.branch || "Computer Science"} · {profile?.graduationYear || "2027"}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                <Users size={13} /> Follow
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => toast.info("Messaging coming soon")}
                className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5"
                style={{ borderColor: c.border, color: c.textSec, background: c.cardBg }}>
                <MessageSquare size={13} /> Message
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5"
                style={{ borderColor: c.border, color: c.textSec, background: c.cardBg }}>
                <Share2 size={13} />
              </motion.button>
            </div>
          </div>
          <p className="text-xs mt-4 max-w-2xl leading-relaxed" style={{ color: c.textSec }}>{bio}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {displaySkills.slice(0, 6).map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 border"
                style={{ borderColor: c.border, color: c.textSec }}>{s}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {profile?.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-[10px] font-bold flex items-center gap-1 hover:text-amber-500 transition-colors"><Globe size={11} /> Portfolio</a>}
            {profile?.github && <a href={profile.github} target="_blank" rel="noreferrer" className="text-[10px] font-bold flex items-center gap-1 hover:text-amber-500 transition-colors"><Github size={11} /> GitHub</a>}
            {profile?.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-[10px] font-bold flex items-center gap-1 hover:text-amber-500 transition-colors"><Linkedin size={11} /> LinkedIn</a>}
          </div>
        </div>
      </motion.div>

      {/* ── Community Stats ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Followers", val: "1,248", icon: Users, color: "text-cyan-500" },
          { label: "Following", val: "196", icon: User, color: "text-purple-500" },
          { label: "Reputation", val: "4,820", icon: Award, color: "text-amber-500" },
          { label: "Contributions", val: "342", icon: Heart, color: "text-rose-500" },
          { label: "Projects", val: "18", icon: Folder, color: "text-emerald-500" },
          { label: "Papers", val: "5", icon: BookOpen, color: "text-blue-500" },
          { label: "Challenges", val: "127", icon: Code2, color: "text-orange-500" },
          { label: "Certificates", val: "12", icon: Medal, color: "text-teal-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>{stat.label}</span>
              <span className="text-lg font-extrabold">{stat.val}</span>
            </div>
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18, delay: i * 0.05 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
              <stat.icon size={14} className={stat.color} />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
        {SECTION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer"
              style={{ color: isActive ? "#f59e0b" : c.textMuted }}>
              {isActive && (
                <motion.div layoutId="community-tab" className="absolute inset-0 rounded-lg"
                  style={{ background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><tab.icon size={13} />{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "overview" && <OverviewTab c={c} displayName={displayName} />}
              {activeTab === "projects" && <ProjectsTab c={c} projectFilter={projectFilter} setProjectFilter={setProjectFilter} />}
              {activeTab === "research" && <ResearchTab c={c} />}
              {activeTab === "skills" && <SkillsTab c={c} skillFilter={skillFilter} setSkillFilter={setSkillFilter} />}
              {activeTab === "activity" && <ActivityTab c={c} />}
              {activeTab === "achievements" && <AchievementsTab c={c} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="hidden xl:block w-[260px] shrink-0 space-y-4 sticky top-0 max-h-[calc(100vh-160px)] overflow-y-auto pb-4" style={{ scrollbarWidth: "thin" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border p-5 space-y-4" style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Profile Summary</span>
            <div className="space-y-3">
              {[
                { label: "Reputation", val: "4,820", icon: <Award size={12} className="text-amber-500" /> },
                { label: "Global Rank", val: "#14", icon: <Trophy size={12} className="text-purple-500" /> },
                { label: "Uni Rank", val: "#3", icon: <GraduationCap size={12} className="text-cyan-500" /> },
                { label: "Skill Level", val: "Expert", icon: <Zap size={12} className="text-emerald-500" /> },
                { label: "Streak", val: "14 days", icon: <Flame size={12} className="text-orange-500" /> },
                { label: "Focus", val: "AI/ML", icon: <Brain size={12} className="text-blue-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: c.textMuted }}>{item.icon}{item.label}</span>
                  <span className="font-bold">{item.val}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold flex items-center justify-center gap-1.5">
                <Folder size={11} /> View Projects
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5"
                style={{ borderColor: c.border, color: c.textSec }}>
                <BookOpen size={11} /> View Research
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5"
                style={{ borderColor: c.border, color: c.textSec }}>
                <MessageSquare size={11} /> Contact
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border p-5 space-y-3" style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Recent Badges</span>
            {MOCK_ACHIEVEMENTS.slice(0, 4).map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.bg} shrink-0`}>
                    <Icon size={13} className={a.color} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold block">{a.name}</span>
                    <span className="text-[9px]" style={{ color: c.textMuted }}>{a.rarity}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

function CardShell({ c, children, className = "" }: { c: Record<string, string>; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${className}`}
      style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, color }: { icon: React.ComponentType<{ size?: number }>; title: string; color?: string }) {
  return (
    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: color || "#f59e0b" }}>
      <Icon size={16} /> {title}
    </h3>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────
function OverviewTab({ c, displayName }: { c: Record<string, string>; displayName: string }) {
  return (
    <div className="space-y-5">
      {/* Learning Progress */}
      <CardShell c={c}>
        <SectionTitle icon={TrendingUp} title="Learning Progress" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {[
            { label: "Overall", val: 78, color: "amber" as const },
            { label: "AI Score", val: 92, color: "purple" as const },
            { label: "Streak", val: 70, color: "green" as const },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <PremiumProgressRing value={item.val} size={60} strokeWidth={5} />
              <span className="text-[10px] font-bold mt-2" style={{ color: c.textMuted }}>{item.label}</span>
            </div>
          ))}
          {[
            { label: "Courses Done", val: "24", sub: "/ 30" },
            { label: "Study Hours", val: "1,240", sub: "total" },
            { label: "Monthly Growth", val: "+18%", sub: "this month" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <span className="text-lg font-extrabold block">{item.val}</span>
              <span className="text-[9px]" style={{ color: c.textMuted }}>{item.sub}</span>
              <span className="text-[10px] font-bold block mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </CardShell>

      {/* Coding Activity Heatmap */}
      <CardShell c={c}>
        <SectionTitle icon={Activity} title="Coding Activity" />
        <div className="flex gap-1 flex-wrap">
          {CONTRIBUTION_DATA.map((level, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" title={`${level} contributions`}
              style={{ background: level === 0 ? (c.border) : level === 1 ? "rgba(245,158,11,0.2)" : level === 2 ? "rgba(245,158,11,0.4)" : level === 3 ? "rgba(245,158,11,0.6)" : "rgba(245,158,11,0.9)" }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {[
            { label: "Problems Solved", val: "127", icon: <Code2 size={12} className="text-emerald-500" /> },
            { label: "Coding Hours", val: "486", icon: <Clock size={12} className="text-cyan-500" /> },
            { label: "Languages", val: "6", icon: <Globe size={12} className="text-purple-500" /> },
            { label: "Current Streak", val: "14d", icon: <Flame size={12} className="text-orange-500" /> },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border" style={{ borderColor: c.border }}>
              {s.icon}
              <div>
                <span className="text-[9px] block" style={{ color: c.textMuted }}>{s.label}</span>
                <span className="text-xs font-bold">{s.val}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Language Distribution */}
        <div className="space-y-2 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Language Distribution</span>
          {LANG_DIST.map((lang) => (
            <div key={lang.name} className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold">{lang.name}</span>
                <span style={{ color: c.textMuted }}>{lang.percent}%</span>
              </div>
              <PremiumProgressBar value={lang.percent} color="amber" height={3} />
            </div>
          ))}
        </div>
      </CardShell>

      {/* Interests */}
      <CardShell c={c}>
        <SectionTitle icon={Lightbulb} title="Interests" />
        <div className="flex flex-wrap gap-2">
          {MOCK_INTERESTS.map((interest) => (
            <span key={interest} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 border transition-all hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 cursor-default"
              style={{ borderColor: c.border, color: c.textSec }}>{interest}</span>
          ))}
        </div>
      </CardShell>

      {/* Timeline */}
      <CardShell c={c}>
        <SectionTitle icon={Clock} title="Activity Timeline" />
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-[9px] top-0 bottom-0 w-px" style={{ background: c.border }} />
          {MOCK_TIMELINE.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={i} variants={slideRight} initial="hidden" animate="visible" custom={i}
                className="relative flex items-start gap-3">
                <div className="absolute left-[-15px] top-1 w-2 h-2 rounded-full border-2"
                  style={{ borderColor: c.border, background: c.cardBg }} />
                <div className="flex-1">
                  <span className="text-xs font-bold block">{item.action}</span>
                  <span className="text-[10px]" style={{ color: c.textMuted }}>{item.time}</span>
                </div>
                <Icon size={14} className={item.color} />
              </motion.div>
            );
          })}
        </div>
      </CardShell>

      {/* Recommendations */}
      <CardShell c={c}>
        <SectionTitle icon={Quote} title="Recommendations" />
        <div className="space-y-3">
          {MOCK_RECOMMENDATIONS.map((rec, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
              className="p-4 rounded-xl border" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <img src={getDiceBearUrl(rec.name)} alt={rec.name} width={32} height={32} className="block" />
                </div>
                <div>
                  <span className="text-xs font-bold block">{rec.name}</span>
                  <span className="text-[10px]" style={{ color: c.textMuted }}>{rec.role}</span>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: rec.rating }).map((_, j) => (
                    <Star key={j} size={10} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: c.textSec }}>&ldquo;{rec.text}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      </CardShell>
    </div>
  );
}

// ─── Projects Tab ────────────────────────────────────────────────────────
function ProjectsTab({ c, projectFilter, setProjectFilter }: { c: Record<string, string>; projectFilter: string; setProjectFilter: (v: string) => void }) {
  const filters = ["all", "completed", "in-progress", "research"];
  const filtered = projectFilter === "all" ? MOCK_PROJECTS : MOCK_PROJECTS.filter(p => p.status === projectFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Folder} title="Featured Projects" />
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
          {filters.map((f) => (
            <button key={f} onClick={() => setProjectFilter(f)}
              className="px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer"
              style={{ background: projectFilter === f ? "rgba(245,158,11,0.15)" : "transparent", color: projectFilter === f ? "#f59e0b" : c.textMuted }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((proj, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            whileHover={{ y: -4, scale: 1.01 }}
            className="rounded-2xl border overflow-hidden transition-all"
            style={{ background: c.cardBg, borderColor: c.border }}>
            <div className="h-32 relative" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(139,92,246,0.06))" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <Code2 size={32} className="text-amber-500/30" />
              </div>
              <div className="absolute top-2 right-2">
                <PremiumBadge variant={proj.status === "completed" ? "green" : proj.status === "in-progress" ? "amber" : "purple"}>
                  {proj.status}
                </PremiumBadge>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-extrabold">{proj.title}</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: c.textSec }}>{proj.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {proj.tech.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border"
                    style={{ borderColor: c.border, color: c.textMuted }}>{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.border }}>
                <div className="flex gap-3 text-[10px]" style={{ color: c.textMuted }}>
                  <span className="flex items-center gap-1"><Star size={10} /> {proj.stars}</span>
                  <span className="flex items-center gap-1"><Heart size={10} /> {proj.likes}</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {proj.views}</span>
                </div>
                <div className="flex gap-1.5">
                  <motion.a href={proj.github} whileHover={{ scale: 1.1 }} className="p-1.5 rounded-md border" style={{ borderColor: c.border }}>
                    <Github size={12} style={{ color: c.textSec }} />
                  </motion.a>
                  <motion.a href={proj.demo} whileHover={{ scale: 1.1 }} className="p-1.5 rounded-md border" style={{ borderColor: c.border }}>
                    <ExternalLink size={12} style={{ color: c.textSec }} />
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Research Tab ────────────────────────────────────────────────────────
function ResearchTab({ c }: { c: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <SectionTitle icon={BookOpen} title="Research Publications" />
      {MOCK_RESEARCH.map((paper, i) => (
        <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
          whileHover={{ y: -2, scale: 1.005 }}
          className="rounded-2xl border p-5 space-y-3"
          style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-extrabold leading-snug">{paper.title}</h4>
            <PremiumBadge variant="cyan">{paper.domain}</PremiumBadge>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: c.textSec }}>{paper.abstract}</p>
          <div className="flex flex-wrap gap-1.5">
            {paper.keywords.map((k) => (
              <span key={k} className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">{k}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.border }}>
            <div className="flex gap-4 text-[10px]" style={{ color: c.textMuted }}>
              <span>{paper.date}</span>
              <span className="flex items-center gap-1"><Quote size={10} /> {paper.citations} citations</span>
              <span className="flex items-center gap-1"><Download size={10} /> {paper.downloads} downloads</span>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold flex items-center gap-1">
              <FileText size={10} /> Read Paper
            </motion.button>
          </div>
        </motion.div>
      ))}

      {/* Certifications */}
      <SectionTitle icon={Medal} title="Certifications" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MOCK_CERTIFICATIONS.map((cert, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            whileHover={{ y: -3, scale: 1.01 }}
            className="p-4 rounded-xl border text-center space-y-2"
            style={{ borderColor: c.border, background: c.cardBg }}>
            <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-sm font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">{cert.icon}</div>
            <span className="text-[10px] font-bold block" style={{ color: c.textMuted }}>{cert.org}</span>
            <span className="text-xs font-bold block">{cert.name}</span>
            <span className="text-[9px] block" style={{ color: c.textMuted }}>{cert.date}</span>
            <span className="text-[8px] block font-mono" style={{ color: c.textMuted }}>{cert.credentialId}</span>
            <motion.button whileHover={{ scale: 1.03 }} className="text-[9px] font-bold text-amber-500 hover:underline flex items-center gap-1 mx-auto">
              <ExternalLink size={9} /> View Certificate
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Skills Tab ──────────────────────────────────────────────────────────
function SkillsTab({ c, skillFilter, setSkillFilter }: { c: Record<string, string>; skillFilter: keyof typeof MOCK_SKILLS; setSkillFilter: (v: keyof typeof MOCK_SKILLS) => void }) {
  const filters: { id: keyof typeof MOCK_SKILLS; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "programming", label: "Programming", icon: Code2 },
    { id: "ai", label: "AI & ML", icon: Brain },
    { id: "development", label: "Development", icon: Layers },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Zap} title="Skills Showcase" />
      </div>
      <div className="flex gap-2">
        {filters.map((f) => {
          const isActive = skillFilter === f.id;
          return (
            <motion.button key={f.id} onClick={() => setSkillFilter(f.id)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer"
              style={{ background: isActive ? "rgba(245,158,11,0.12)" : c.cardBg, borderColor: isActive ? "rgba(245,158,11,0.3)" : c.border, color: isActive ? "#f59e0b" : c.textMuted }}>
              <f.icon size={13} /> {f.label}
            </motion.button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK_SKILLS[skillFilter].map((skill, i) => (
          <motion.div key={skill.name} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-4 rounded-xl border"
            style={{ borderColor: c.border, background: c.cardBg }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">{skill.name}</span>
              <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>{skill.level}%</span>
            </div>
            <PremiumProgressBar value={skill.level} color="amber" height={4} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] flex items-center gap-1" style={{ color: c.textMuted }}>
                <Users size={9} /> {skill.endorsements} endorsements
              </span>
              <span className="text-[9px] font-bold" style={{ color: skill.level >= 85 ? "#10b981" : skill.level >= 70 ? "#f59e0b" : c.textMuted }}>
                {skill.level >= 85 ? "Expert" : skill.level >= 70 ? "Advanced" : "Intermediate"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity Tab ────────────────────────────────────────────────────────
function ActivityTab({ c }: { c: Record<string, string> }) {
  return (
    <div className="space-y-5">
      {/* Contribution Heatmap */}
      <CardShell c={c}>
        <SectionTitle icon={BarChart3} title="Contribution Heatmap" />
        <div className="flex gap-[3px] flex-wrap">
          {CONTRIBUTION_DATA.map((level, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 cursor-default"
              title={`${level} contributions`}
              style={{ background: level === 0 ? (isDark => isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)")(c.text === "#ffffff") : level === 1 ? "rgba(245,158,11,0.2)" : level === 2 ? "rgba(245,158,11,0.4)" : level === 3 ? "rgba(245,158,11,0.6)" : "rgba(245,158,11,0.9)" }} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[9px]" style={{ color: c.textMuted }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className="w-3 h-3 rounded-sm"
              style={{ background: l === 0 ? c.border : l === 1 ? "rgba(245,158,11,0.2)" : l === 2 ? "rgba(245,158,11,0.4)" : l === 3 ? "rgba(245,158,11,0.6)" : "rgba(245,158,11,0.9)" }} />
          ))}
          <span>More</span>
        </div>
      </CardShell>

      {/* Weekly & Monthly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardShell c={c}>
          <SectionTitle icon={Calendar} title="Weekly Activity" />
          <div className="space-y-2.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const hours = [3, 5, 2, 6, 4, 7, 1][i];
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-8" style={{ color: c.textMuted }}>{day}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: c.border }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(hours / 8) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  </div>
                  <span className="text-[10px] font-bold w-6 text-right">{hours}h</span>
                </div>
              );
            })}
          </div>
        </CardShell>
        <CardShell c={c}>
          <SectionTitle icon={TrendingUp} title="Monthly Growth" />
          <div className="space-y-2.5">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => {
              const val = [40, 55, 65, 72, 80, 92][i];
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-8" style={{ color: c.textMuted }}>{month}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: c.border }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right">{val}%</span>
                </div>
              );
            })}
          </div>
        </CardShell>
      </div>

      {/* Community Contributions */}
      <CardShell c={c}>
        <SectionTitle icon={Users} title="Community Contributions" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Discussion Posts", val: "48", icon: <MessageSquare size={12} className="text-blue-500" /> },
            { label: "Questions Answered", val: "124", icon: <Lightbulb size={12} className="text-amber-500" /> },
            { label: "Helpful Replies", val: "256", icon: <Heart size={12} className="text-rose-500" /> },
            { label: "Resources Shared", val: "38", icon: <Bookmark size={12} className="text-purple-500" /> },
            { label: "Study Notes", val: "22", icon: <FileText size={12} className="text-emerald-500" /> },
            { label: "Community Likes", val: "892", icon: <Star size={12} className="text-orange-500" /> },
          ].map((item, i) => (
            <motion.div key={i} variants={scaleIn} initial="hidden" animate="visible" custom={i}
              className="p-3 rounded-xl border text-center" style={{ borderColor: c.border }}>
              <div className="flex justify-center mb-1">{item.icon}</div>
              <span className="text-base font-extrabold block">{item.val}</span>
              <span className="text-[9px]" style={{ color: c.textMuted }}>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </CardShell>
    </div>
  );
}

// ─── Achievements Tab ────────────────────────────────────────────────────
function AchievementsTab({ c }: { c: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <CardShell c={c}>
        <SectionTitle icon={Trophy} title="Community Achievements" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOCK_ACHIEVEMENTS.map((ach, i) => {
            const Icon = ach.icon;
            return (
              <motion.div key={i} variants={scaleIn} initial="hidden" animate="visible" custom={i}
                whileHover={{ y: -4, scale: 1.03 }}
                className="p-4 rounded-xl border text-center space-y-2"
                style={{ borderColor: c.border, background: c.cardBg }}>
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.05 }}
                  className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${ach.bg}`}>
                  <Icon size={22} className={ach.color} />
                </motion.div>
                <span className="text-xs font-bold block">{ach.name}</span>
                <span className="text-[9px] block" style={{ color: c.textMuted }}>{ach.desc}</span>
                <PremiumBadge variant={ach.rarity === "Legendary" ? "amber" : ach.rarity === "Epic" ? "purple" : ach.rarity === "Rare" ? "cyan" : "green"}>
                  {ach.rarity}
                </PremiumBadge>
              </motion.div>
            );
          })}
        </div>
      </CardShell>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Badges", val: "24", icon: <Award size={14} className="text-amber-500" /> },
          { label: "Legendary", val: "3", icon: <Crown size={14} className="text-purple-500" /> },
          { label: "Epic", val: "8", icon: <Star size={14} className="text-cyan-500" /> },
          { label: "This Month", val: "+4", icon: <TrendingUp size={14} className="text-emerald-500" /> },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            whileHover={{ y: -2 }}
            className="p-4 rounded-xl border flex items-center gap-3"
            style={{ borderColor: c.border, background: c.cardBg }}>
            {s.icon}
            <div>
              <span className="text-[10px] font-bold uppercase block" style={{ color: c.textMuted }}>{s.label}</span>
              <span className="text-lg font-extrabold">{s.val}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
