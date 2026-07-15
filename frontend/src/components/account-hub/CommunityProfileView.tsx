"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import {
  User, Award, Users, Globe, Share2, MessageSquare,
  ExternalLink, Star, BookOpen, Code2, FileText, Trophy,
  TrendingUp, Calendar, Clock, Eye, Heart, Download, ArrowUpRight,
  Zap, Brain, GraduationCap, Flame,
  Bookmark, Lightbulb, Layers, GitBranch,
  Quote, BadgeCheck, Rocket, Coffee, Crown, Medal, BrainCircuit,
  BarChart3, Activity, Folder, ImageIcon, Plus,
  MapPin, Send, Terminal, Cpu, Database, Wifi, Lock, Sun, Server
} from "lucide-react";
import CountUp from "react-countup";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getDiceBearUrl } from "@/lib/avatar";
import {
  PremiumBadge, PremiumProgressRing,
  PremiumProgressBar, AnimatedSkeleton
} from "@/components/ui/PremiumComponents";

// ═══════════════════════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.07, duration: 0.4, type: "spring", stiffness: 200, damping: 20 },
  }),
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <span ref={ref} className="tabular-nums">
      {isInView ? (
        <CountUp end={value} duration={2} separator="," prefix={prefix} suffix={suffix} />
      ) : (
        `${prefix}0${suffix}`
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE INTERFACE & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

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

// ─── Mock Data ────────────────────────────────────────────────────────────

const MOCK_STATS = {
  followers: 1248,
  following: 196,
  reputation: 4820,
  contributions: 342,
  projects: 18,
  papers: 5,
  challenges: 127,
  certificates: 12,
};

const MOCK_LEARNING = {
  overall: 78,
  aiScore: 92,
  streak: 14,
  coursesCompleted: 24,
  totalCourses: 30,
  learningHours: 1240,
  weeklyGrowth: 12,
  monthlyGrowth: 18,
};

const MOCK_SKILLS = {
  programming: [
    { name: "Python", level: 92, endorsements: 48, icon: Terminal },
    { name: "JavaScript", level: 88, endorsements: 42, icon: Code2 },
    { name: "TypeScript", level: 82, endorsements: 35, icon: Code2 },
    { name: "Java", level: 75, endorsements: 28, icon: Cpu },
    { name: "C++", level: 70, endorsements: 22, icon: Terminal },
    { name: "SQL", level: 85, endorsements: 30, icon: Database },
  ],
  ai: [
    { name: "Machine Learning", level: 90, endorsements: 52, icon: Brain },
    { name: "Deep Learning", level: 85, endorsements: 40, icon: BrainCircuit },
    { name: "NLP", level: 78, endorsements: 32, icon: MessageSquare },
    { name: "Computer Vision", level: 72, endorsements: 26, icon: Eye },
    { name: "TensorFlow", level: 80, endorsements: 35, icon: Layers },
    { name: "PyTorch", level: 82, endorsements: 38, icon: Flame },
  ],
  development: [
    { name: "React", level: 90, endorsements: 45, icon: Layers },
    { name: "Next.js", level: 88, endorsements: 42, icon: Zap },
    { name: "Node.js", level: 85, endorsements: 38, icon: Server },
    { name: "MongoDB", level: 78, endorsements: 28, icon: Database },
    { name: "Docker", level: 75, endorsements: 25, icon: Lock },
    { name: "Git", level: 92, endorsements: 50, icon: GitBranch },
  ],
};

const MOCK_PROJECTS = [
  {
    title: "Adyapan AI Dashboard",
    desc: "Full-stack AI-powered education platform with real-time analytics, personalized learning paths, and intelligent tutoring.",
    tech: ["Next.js", "TypeScript", "Python", "PostgreSQL"],
    stars: 142,
    likes: 89,
    views: 2340,
    comments: 34,
    status: "completed" as const,
    github: "#",
    demo: "#",
    gradient: "from-amber-500/20 via-orange-500/10 to-purple-500/10",
  },
  {
    title: "Neural Code Reviewer",
    desc: "AI tool that reviews code for bugs, security vulnerabilities, and performance issues using LLMs.",
    tech: ["Python", "FastAPI", "OpenAI", "Docker"],
    stars: 98,
    likes: 67,
    views: 1890,
    comments: 22,
    status: "completed" as const,
    github: "#",
    demo: "#",
    gradient: "from-purple-500/20 via-blue-500/10 to-cyan-500/10",
  },
  {
    title: "Research Paper Generator",
    desc: "Automated research paper drafting with citation management, plagiarism detection, and formatting.",
    tech: ["React", "Node.js", "LangChain", "LaTeX"],
    stars: 76,
    likes: 54,
    views: 1230,
    comments: 18,
    status: "in-progress" as const,
    github: "#",
    demo: "#",
    gradient: "from-cyan-500/20 via-blue-500/10 to-purple-500/10",
  },
  {
    title: "AI Study Companion",
    desc: "Personalized study assistant using RAG with adaptive quizzing, flashcards, and mind map generation.",
    tech: ["Python", "LangChain", "React", "Vector DB"],
    stars: 64,
    likes: 45,
    views: 980,
    comments: 15,
    status: "completed" as const,
    github: "#",
    demo: "#",
    gradient: "from-emerald-500/20 via-cyan-500/10 to-blue-500/10",
  },
];

const MOCK_RESEARCH = [
  {
    title: "Transformer-Based Automated Code Review for Educational Platforms",
    abstract: "We propose a novel approach using fine-tuned transformer models to provide automated, context-aware code review feedback tailored for student submissions in educational coding environments.",
    date: "Mar 2026",
    domain: "AI in Education",
    keywords: ["Transformers", "NLP", "Code Review", "EdTech"],
    citations: 12,
    downloads: 340,
  },
  {
    title: "Adaptive Learning Path Optimization Using Reinforcement Learning",
    abstract: "This paper presents an RL-based framework for dynamically optimizing personalized learning sequences based on student performance metrics and cognitive load estimation.",
    date: "Nov 2025",
    domain: "Machine Learning",
    keywords: ["Reinforcement Learning", "Adaptive Learning", "Student Modeling"],
    citations: 8,
    downloads: 210,
  },
  {
    title: "Multi-Modal Emotion Recognition in Virtual Classrooms",
    abstract: "A deep learning approach combining facial expression analysis, voice prosody, and text sentiment for real-time student engagement detection in online learning environments.",
    date: "Jul 2025",
    domain: "Computer Vision",
    keywords: ["Emotion Recognition", "Multi-Modal", "Deep Learning", "EdTech"],
    citations: 15,
    downloads: 420,
  },
];

const MOCK_CERTIFICATIONS = [
  { org: "Google", name: "Machine Learning Specialization", date: "Jan 2026", credentialId: "GML-2026-AK9F2", color: "from-blue-500 to-cyan-500" },
  { org: "AWS", name: "Solutions Architect Associate", date: "Sep 2025", credentialId: "AWS-SAA-8812K", color: "from-orange-500 to-amber-500" },
  { org: "Meta", name: "Front-End Developer Professional", date: "Jun 2025", credentialId: "META-FE-2025-PL", color: "from-blue-600 to-indigo-500" },
  { org: "DeepLearning.AI", name: "Deep Learning Specialization", date: "Mar 2025", credentialId: "DLAI-DL-2025-X9", color: "from-purple-500 to-pink-500" },
];

const MOCK_ACHIEVEMENTS = [
  { name: "Top Contributor", desc: "Top 1% community contributor", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", rarity: "Legendary", glow: "shadow-amber-500/20" },
  { name: "AI Expert", desc: "100+ AI problems solved", icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", rarity: "Epic", glow: "shadow-purple-500/20" },
  { name: "Research Scholar", desc: "Published 2+ papers", icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", rarity: "Rare", glow: "shadow-cyan-500/20" },
  { name: "Coding Champion", desc: "500+ DSA problems", icon: Code2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", rarity: "Epic", glow: "shadow-emerald-500/20" },
  { name: "Fast Learner", desc: "Completed 10 courses in a month", icon: Rocket, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", rarity: "Rare", glow: "shadow-orange-500/20" },
  { name: "Mentor Choice", desc: "Rated best mentor by peers", icon: Heart, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", rarity: "Epic", glow: "shadow-rose-500/20" },
  { name: "Community Helper", desc: "Answered 200+ questions", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", rarity: "Common", glow: "shadow-blue-500/20" },
  { name: "Open Source Hero", desc: "10+ accepted PRs", icon: GitBranch, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", rarity: "Rare", glow: "shadow-teal-500/20" },
];

const MOCK_TIMELINE = [
  { time: "2 days ago", action: "Published research paper on Adaptive Learning", icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { time: "1 week ago", action: "Uploaded project: Neural Code Reviewer", icon: Folder, color: "text-purple-400", bg: "bg-purple-500/10" },
  { time: "2 weeks ago", action: "Earned badge: AI Expert", icon: BrainCircuit, color: "text-amber-400", bg: "bg-amber-500/10" },
  { time: "1 month ago", action: "Completed Google ML Specialization", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { time: "1 month ago", action: "Won weekly coding contest", icon: Trophy, color: "text-orange-400", bg: "bg-orange-500/10" },
  { time: "2 months ago", action: "Joined Adyapan AI community", icon: Rocket, color: "text-blue-400", bg: "bg-blue-500/10" },
];

const MOCK_RECOMMENDATIONS = [
  { name: "Priya Sharma", role: "ML Engineer @ Google", text: "Ashish is an exceptional developer with deep knowledge of AI/ML. His research contributions are outstanding and he consistently delivers high-quality work.", rating: 5 },
  { name: "Rohan Patel", role: "SDE @ Microsoft", text: "One of the most dedicated peers I've worked with. Strong problem-solving skills and a great team player who elevates everyone around him.", rating: 5 },
  { name: "Ananya Reddy", role: "Research Scholar @ IIT", text: "Brilliant researcher with a passion for education technology. Highly recommend for any collaborative project or research endeavor.", rating: 4 },
];

const MOCK_INTERESTS = [
  "Artificial Intelligence", "Machine Learning", "Cyber Security", "Cloud Computing",
  "Data Science", "Web Development", "Competitive Programming", "Research", "Robotics", "Blockchain"
];

const CONTRIBUTION_DATA = Array.from({ length: 91 }, () => Math.floor(Math.random() * 5));

const LANG_DIST = [
  { name: "Python", percent: 35, color: "from-blue-500 to-cyan-500" },
  { name: "JavaScript", percent: 28, color: "from-amber-500 to-orange-500" },
  { name: "TypeScript", percent: 18, color: "from-blue-600 to-blue-400" },
  { name: "Java", percent: 12, color: "from-red-500 to-rose-500" },
  { name: "C++", percent: 7, color: "from-purple-500 to-indigo-500" },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", hours: 3 },
  { day: "Tue", hours: 5 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 6 },
  { day: "Fri", hours: 4 },
  { day: "Sat", hours: 7 },
  { day: "Sun", hours: 1 },
];

const MONTHLY_GROWTH = [
  { month: "Jan", value: 40 },
  { month: "Feb", value: 55 },
  { month: "Mar", value: 65 },
  { month: "Apr", value: 72 },
  { month: "May", value: 80 },
  { month: "Jun", value: 92 },
];

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
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function GlassCard({ children, className = "", glow = false, glowColor = "rgba(245,158,11,0.06)" }: {
  children: React.ReactNode; className?: string; glow?: boolean; glowColor?: string;
}) {
  return (
    <div className={`relative rounded-[20px] border overflow-hidden ${className}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}>
      {glow && (
        <div className="absolute -inset-20 pointer-events-none opacity-40"
          style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 60%)` }} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, gradient = false }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; title: string; subtitle?: string; gradient?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <Icon size={16} className="text-amber-400" />
      </div>
      <div>
        <h3 className={`text-sm font-extrabold ${gradient ? "bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent" : ""}`}
          style={{ color: gradient ? undefined : "#ffffff" }}>
          {title}
        </h3>
        {subtitle && <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function SkillLevelBadge({ level }: { level: number }) {
  if (level >= 90) return <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">Expert</span>;
  if (level >= 75) return <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">Advanced</span>;
  return <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md">Intermediate</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CommunityProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [skillFilter, setSkillFilter] = useState<keyof typeof MOCK_SKILLS>("programming");
  const [projectFilter, setProjectFilter] = useState("all");
  const [isFollowing, setIsFollowing] = useState(false);

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

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  }, []);

  const handleFollow = useCallback(() => {
    setIsFollowing(prev => !prev);
    toast.success(isFollowing ? "Unfollowed" : "Following!");
  }, [isFollowing]);

  const displayName = profile?.user?.name ?? "Ashish Kumar";
  const username = profile?.username ? `@${profile.username}` : "@ashishk";
  const bio = profile?.aboutMe || profile?.careerObjective || "Passionate AI researcher and full-stack developer building the future of education technology. Committed to making AI-powered learning accessible to everyone.";
  const displaySkills = profile?.skills?.length ? profile.skills : MOCK_SKILLS.programming.map(s => s.name);

  if (loading) {
    return (
      <div className="space-y-5 p-1">
        <AnimatedSkeleton type="card" className="h-[280px] rounded-[20px]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <AnimatedSkeleton key={i} type="card" className="h-[100px] rounded-[20px]" />)}
        </div>
        <AnimatedSkeleton type="card" className="h-[400px] rounded-[20px]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5 min-h-screen"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO PROFILE SECTION                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <GlassCard glow glowColor="rgba(139,92,246,0.08)">
        {/* Cover Banner with parallax-like gradient */}
        <div className="h-36 sm:h-48 relative overflow-hidden rounded-t-[20px]">
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #0B1120 0%, rgba(139,92,246,0.3) 30%, rgba(59,130,246,0.2) 60%, rgba(6,182,212,0.15) 80%, #0B1120 100%)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.12) 0%, transparent 50%)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.1) 0%, transparent 50%)" }} />
          {/* Floating orbs */}
          <motion.div
            className="absolute top-6 right-12 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl"
            animate={{ scale: [1, 1.3, 1], x: [0, 15, 0], y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-4 left-20 w-32 h-32 rounded-full bg-cyan-500/8 blur-3xl"
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        <div className="px-5 sm:px-8 pb-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-14">
            {/* Profile Image */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="relative shrink-0"
            >
              <div className="w-28 h-28 rounded-[22px] overflow-hidden border-4"
                style={{
                  borderColor: "#0B1120",
                  boxShadow: "0 0 30px rgba(245,158,11,0.25), 0 0 60px rgba(139,92,246,0.1)",
                }}>
                <img src={getDiceBearUrl(displayName)} alt="avatar" width={112} height={112} className="block" />
              </div>
              {/* Verified Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "3px solid #0B1120" }}
              >
                <BadgeCheck size={14} className="text-white" />
              </motion.div>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-white tracking-tight">{displayName}</h1>
                <PremiumBadge variant="amber" pulse>Pro</PremiumBadge>
                <PremiumBadge variant="purple">Top 1%</PremiumBadge>
              </div>
              <p className="text-xs font-bold mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {username} · {profile?.targetRole || "AI Researcher & Full-Stack Developer"}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="flex items-center gap-1"><GraduationCap size={12} className="text-amber-400" /> {profile?.college || "IIT Delhi"}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{profile?.branch || "Computer Science"}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Class of {profile?.graduationYear || "2027"}</span>
                {profile?.location && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="flex items-center gap-1"><MapPin size={11} /> {profile.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: isFollowing ? "none" : "0 0 20px rgba(245,158,11,0.3)" }}
                whileTap={{ scale: 0.96 }}
                onClick={handleFollow}
                className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                style={{
                  background: isFollowing ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #f59e0b, #ea580c)",
                  color: isFollowing ? "rgba(255,255,255,0.7)" : "#000",
                  border: isFollowing ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}
              >
                {isFollowing ? <><User size={13} /> Following</> : <><Plus size={13} /> Follow</>}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => toast.info("Messaging coming soon")}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.03)" }}
              >
                <MessageSquare size={13} /> Message
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08, rotate: 15 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleShare}
                className="w-10 h-10 rounded-xl border flex items-center justify-center"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.03)" }}
              >
                <Share2 size={14} />
              </motion.button>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[11px] mt-5 max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            {bio}
          </p>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {displaySkills.slice(0, 8).map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ scale: 1.08, backgroundColor: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.3)" }}
                className="px-3 py-1 rounded-lg text-[10px] font-bold cursor-default transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}
              >
                {s}
              </motion.span>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-4 mt-4">
            {profile?.portfolio && (
              <a href={profile.portfolio} target="_blank" rel="noreferrer"
                className="text-[11px] font-bold flex items-center gap-1.5 hover:text-amber-400 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Globe size={12} /> Portfolio <ArrowUpRight size={10} />
              </a>
            )}
            {profile?.github && (
              <a href={profile.github} target="_blank" rel="noreferrer"
                className="text-[11px] font-bold flex items-center gap-1.5 hover:text-amber-400 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Github size={12} /> GitHub <ArrowUpRight size={10} />
              </a>
            )}
            {profile?.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer"
                className="text-[11px] font-bold flex items-center gap-1.5 hover:text-amber-400 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
                <Linkedin size={12} /> LinkedIn <ArrowUpRight size={10} />
              </a>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COMMUNITY STATISTICS                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Followers", val: MOCK_STATS.followers, icon: Users, color: "#06b6d4", gradient: "from-cyan-500 to-blue-500" },
          { label: "Following", val: MOCK_STATS.following, icon: User, color: "#8b5cf6", gradient: "from-purple-500 to-indigo-500" },
          { label: "Reputation", val: MOCK_STATS.reputation, icon: Award, color: "#f59e0b", gradient: "from-amber-500 to-orange-500" },
          { label: "Contributions", val: MOCK_STATS.contributions, icon: Heart, color: "#f43f5e", gradient: "from-rose-500 to-pink-500" },
          { label: "Projects", val: MOCK_STATS.projects, icon: Folder, color: "#10b981", gradient: "from-emerald-500 to-teal-500" },
          { label: "Research Papers", val: MOCK_STATS.papers, icon: BookOpen, color: "#3b82f6", gradient: "from-blue-500 to-indigo-500" },
          { label: "Challenges Solved", val: MOCK_STATS.challenges, icon: Code2, color: "#f97316", gradient: "from-orange-500 to-amber-500" },
          { label: "Certificates", val: MOCK_STATS.certificates, icon: Medal, color: "#14b8a6", gradient: "from-teal-500 to-cyan-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            whileHover={{ y: -4, scale: 1.02, boxShadow: `0 12px 40px rgba(0,0,0,0.3)` }}
            className="relative rounded-[20px] border p-4 flex items-center justify-between overflow-hidden"
            style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="absolute inset-0 opacity-30"
              style={{ background: `radial-gradient(circle at 80% 20%, ${stat.color}15 0%, transparent 50%)` }} />
            <div className="relative z-10 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                {stat.label}
              </span>
              <span className="text-xl font-extrabold text-white block">
                <AnimatedCounter value={stat.val} />
              </span>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18, delay: i * 0.05 }}
              className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient}`}
              style={{ boxShadow: `0 4px 15px ${stat.color}30` }}
            >
              <stat.icon size={16} className="text-white" />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB NAVIGATION                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-1 p-1.5 rounded-2xl overflow-x-auto"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        {SECTION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer"
              style={{ color: isActive ? "#f59e0b" : "rgba(255,255,255,0.4)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="community-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><tab.icon size={13} />{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT + SIDEBAR                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-5">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "projects" && <ProjectsTab projectFilter={projectFilter} setProjectFilter={setProjectFilter} />}
              {activeTab === "research" && <ResearchTab />}
              {activeTab === "skills" && <SkillsTab skillFilter={skillFilter} setSkillFilter={setSkillFilter} />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "achievements" && <AchievementsTab />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RIGHT SIDEBAR                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <aside className="hidden xl:block w-[270px] shrink-0 space-y-4 sticky top-0 max-h-[calc(100vh-160px)] overflow-y-auto pb-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {/* Profile Summary Card */}
          <GlassCard glow glowColor="rgba(245,158,11,0.06)">
            <div className="p-5 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto overflow-hidden mb-2"
                  style={{ border: "2px solid rgba(245,158,11,0.3)", boxShadow: "0 0 20px rgba(245,158,11,0.15)" }}>
                  <img src={getDiceBearUrl(displayName)} alt="avatar" width={56} height={56} className="block" />
                </div>
                <span className="text-xs font-extrabold text-white block">{displayName}</span>
                <span className="text-[10px] block" style={{ color: "rgba(255,255,255,0.4)" }}>{username}</span>
              </div>

              <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              <div className="space-y-3">
                {[
                  { label: "Reputation Score", val: "4,820", icon: Award, color: "text-amber-400", gradient: "from-amber-500 to-orange-500" },
                  { label: "Global Rank", val: "#14", icon: Trophy, color: "text-purple-400", gradient: "from-purple-500 to-indigo-500" },
                  { label: "University Rank", val: "#3", icon: GraduationCap, color: "text-cyan-400", gradient: "from-cyan-500 to-blue-500" },
                  { label: "Skill Level", val: "Expert", icon: Zap, color: "text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
                  { label: "Learning Streak", val: "14 days", icon: Flame, color: "text-orange-400", gradient: "from-orange-500 to-red-500" },
                  { label: "Current Focus", val: "AI/ML", icon: Brain, color: "text-blue-400", gradient: "from-blue-500 to-indigo-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.gradient} shrink-0`}>
                        <item.icon size={10} className="text-white" />
                      </div>
                      {item.label}
                    </span>
                    <span className="font-bold text-white">{item.val}</span>
                  </motion.div>
                ))}
              </div>

              <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              <div className="space-y-2">
                {[
                  { label: "View Projects", icon: Folder, primary: true },
                  { label: "View Research", icon: BookOpen, primary: false },
                  { label: "Contact", icon: Send, primary: false },
                ].map((btn, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all"
                    style={btn.primary ? {
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      color: "#f59e0b",
                    } : {
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.5)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <btn.icon size={11} /> {btn.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Recent Achievements */}
          <GlassCard>
            <div className="p-5 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Recent Badges
              </span>
              {MOCK_ACHIEVEMENTS.slice(0, 5).map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.04)" }}
                    className="flex items-center gap-3 p-2 rounded-xl transition-all cursor-default"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.bg} shrink-0`}>
                      <Icon size={16} className={a.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold block text-white truncate">{a.name}</span>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{a.rarity}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>

          {/* Active Status Card */}
          <GlassCard>
            <div className="p-5 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Quick Stats
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Online", val: "2h 14m", icon: Wifi, color: "text-emerald-400" },
                  { label: "This Week", val: "28h", icon: Clock, color: "text-cyan-400" },
                  { label: "Avg. Daily", val: "4.2h", icon: Coffee, color: "text-amber-400" },
                  { label: "Peak Hour", val: "11 PM", icon: Sun, color: "text-purple-400" },
                ].map((stat, i) => (
                  <div key={i} className="p-2.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <stat.icon size={12} className={`${stat.color} mx-auto mb-1`} />
                    <span className="text-[9px] block" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</span>
                    <span className="text-[10px] font-bold text-white block">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Learning Progress */}
      <GlassCard glow glowColor="rgba(139,92,246,0.05)">
        <div className="p-6">
          <SectionHeader icon={TrendingUp} title="Learning Progress" subtitle="Your learning journey at a glance" gradient />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-5 mt-2">
            {[
              { label: "Overall", val: MOCK_LEARNING.overall, color: "amber" as const },
              { label: "AI Score", val: MOCK_LEARNING.aiScore, color: "purple" as const },
              { label: "Streak", val: 70, color: "green" as const },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={i}
                className="flex flex-col items-center"
              >
                <PremiumProgressRing value={item.val} size={72} strokeWidth={6} />
                <span className="text-[10px] font-bold mt-2 text-white">{item.label}</span>
              </motion.div>
            ))}
            {[
              { label: "Courses Done", val: MOCK_LEARNING.coursesCompleted, sub: `/ ${MOCK_LEARNING.totalCourses}` },
              { label: "Study Hours", val: MOCK_LEARNING.learningHours, sub: "total" },
              { label: "Monthly Growth", val: `+${MOCK_LEARNING.monthlyGrowth}`, sub: "this month", prefix: "", suffix: "%" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={i + 3}
                className="text-center"
              >
                <span className="text-2xl font-extrabold text-white block">
                  {typeof item.val === "number" ? (
                    <AnimatedCounter value={item.val} />
                  ) : (
                    item.val
                  )}
                </span>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.sub}</span>
                <span className="text-[10px] font-bold block mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Coding Activity Heatmap */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Activity} title="Coding Activity" subtitle="Your contribution heatmap" />
          <div className="flex gap-[3px] flex-wrap mt-2">
            {CONTRIBUTION_DATA.map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.005 }}
                whileHover={{ scale: 1.4 }}
                className="w-3 h-3 rounded-[3px] cursor-default transition-all"
                title={`${level} contributions`}
                style={{
                  background: level === 0 ? "rgba(255,255,255,0.04)" :
                    level === 1 ? "rgba(245,158,11,0.2)" :
                    level === 2 ? "rgba(245,158,11,0.4)" :
                    level === 3 ? "rgba(245,158,11,0.65)" :
                    "rgba(245,158,11,0.9)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <div key={l} className="w-3 h-3 rounded-sm"
                style={{
                  background: l === 0 ? "rgba(255,255,255,0.04)" :
                    l === 1 ? "rgba(245,158,11,0.2)" :
                    l === 2 ? "rgba(245,158,11,0.4)" :
                    l === 3 ? "rgba(245,158,11,0.65)" :
                    "rgba(245,158,11,0.9)",
                }}
              />
            ))}
            <span>More</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: "Problems Solved", val: 127, icon: Code2, color: "text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
              { label: "Coding Hours", val: 486, icon: Clock, color: "text-cyan-400", gradient: "from-cyan-500 to-blue-500" },
              { label: "Languages", val: 6, icon: Globe, color: "text-purple-400", gradient: "from-purple-500 to-indigo-500" },
              { label: "Current Streak", val: 14, suffix: "d", icon: Flame, color: "text-orange-400", gradient: "from-orange-500 to-red-500" },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -2 }}
                className="p-3.5 rounded-xl flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${s.gradient} shrink-0`}>
                  <s.icon size={14} className="text-white" />
                </div>
                <div>
                  <span className="text-[9px] block" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
                  <span className="text-sm font-extrabold text-white">
                    <AnimatedCounter value={s.val} suffix={s.suffix || ""} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Language Distribution */}
          <div className="space-y-2.5 mt-5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              Language Distribution
            </span>
            {LANG_DIST.map((lang, i) => (
              <motion.div
                key={lang.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="space-y-1"
              >
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-white">{lang.name}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{lang.percent}%</span>
                </div>
                <PremiumProgressBar value={lang.percent} color="amber" height={4} />
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Interests */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Lightbulb} title="Interests" subtitle="Topics you're passionate about" />
          <div className="flex flex-wrap gap-2 mt-2">
            {MOCK_INTERESTS.map((interest, i) => (
              <motion.span
                key={interest}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.08, backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.25)", color: "#f59e0b" }}
                className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold cursor-default transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                {interest}
              </motion.span>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Activity Timeline */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Clock} title="Activity Timeline" subtitle="Recent activity" />
          <div className="relative pl-8 space-y-5 mt-3">
            <div className="absolute left-[11px] top-0 bottom-0 w-px" style={{ background: "linear-gradient(to bottom, rgba(245,158,11,0.3), rgba(139,92,246,0.2), rgba(6,182,212,0.1), transparent)" }} />
            {MOCK_TIMELINE.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  variants={slideRight}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  className="relative flex items-start gap-4"
                >
                  <div className="absolute left-[-20px] top-1.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ borderColor: "#f59e0b", background: "#0B1120" }} />
                  <div className="flex-1 p-3 rounded-xl transition-all hover:bg-white/[0.02]"
                    style={{ border: "1px solid transparent" }}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.bg} shrink-0`}>
                        <Icon size={13} className={item.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-white block truncate">{item.action}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.time}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Recommendations */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Quote} title="Recommendations" subtitle="What peers say about you" />
          <div className="space-y-3 mt-2">
            {MOCK_RECOMMENDATIONS.map((rec, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -2, borderColor: "rgba(245,158,11,0.15)" }}
                className="p-4 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={getDiceBearUrl(rec.name)} alt={rec.name} width={36} height={36} className="block" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-white block">{rec.name}</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{rec.role}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: rec.rating }).map((_, j) => (
                      <Star key={j} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  &ldquo;{rec.text}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS TAB
// ═══════════════════════════════════════════════════════════════════════════

function ProjectsTab({ projectFilter, setProjectFilter }: { projectFilter: string; setProjectFilter: (v: string) => void }) {
  const filters = ["all", "completed", "in-progress", "research"];
  const filtered = projectFilter === "all" ? MOCK_PROJECTS : MOCK_PROJECTS.filter(p => p.status === projectFilter);

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={Folder} title="Featured Projects" subtitle="Your best work" />
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setProjectFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer"
                  style={{
                    background: projectFilter === f ? "rgba(245,158,11,0.12)" : "transparent",
                    color: projectFilter === f ? "#f59e0b" : "rgba(255,255,255,0.35)",
                    border: projectFilter === f ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((proj, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -6, scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                className="rounded-[20px] border overflow-hidden transition-all"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
              >
                {/* Project Thumbnail */}
                <div className={`h-36 relative bg-gradient-to-br ${proj.gradient}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}
                    >
                      <Code2 size={24} className="text-white/60" />
                    </motion.div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <PremiumBadge variant={proj.status === "completed" ? "green" : proj.status === "in-progress" ? "amber" : "purple"}>
                      {proj.status}
                    </PremiumBadge>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h4 className="text-sm font-extrabold text-white">{proj.title}</h4>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {proj.desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tech.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <span className="flex items-center gap-1"><Star size={10} className="text-amber-400" /> {proj.stars}</span>
                      <span className="flex items-center gap-1"><Heart size={10} className="text-rose-400" /> {proj.likes}</span>
                      <span className="flex items-center gap-1"><Eye size={10} className="text-cyan-400" /> {proj.views}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={10} className="text-blue-400" /> {proj.comments}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <motion.a href={proj.github} whileHover={{ scale: 1.15, rotate: 5 }}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Github size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
                      </motion.a>
                      <motion.a href={proj.demo} whileHover={{ scale: 1.15, rotate: -5 }}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <ExternalLink size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RESEARCH TAB
// ═══════════════════════════════════════════════════════════════════════════

function ResearchTab() {
  return (
    <div className="space-y-5">
      {/* Publications */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={BookOpen} title="Research Publications" subtitle="Your academic contributions" gradient />
          <div className="space-y-4 mt-2">
            {MOCK_RESEARCH.map((paper, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -3, borderColor: "rgba(139,92,246,0.2)" }}
                className="rounded-[20px] border p-5 space-y-3 transition-all"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-extrabold leading-snug text-white">{paper.title}</h4>
                  <PremiumBadge variant="cyan">{paper.domain}</PremiumBadge>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {paper.abstract}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {paper.keywords.map((k) => (
                    <span key={k} className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span>{paper.date}</span>
                    <span className="flex items-center gap-1"><Quote size={10} className="text-amber-400" /> {paper.citations} citations</span>
                    <span className="flex items-center gap-1"><Download size={10} className="text-cyan-400" /> {paper.downloads} downloads</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 0 15px rgba(245,158,11,0.2)" }}
                    whileTap={{ scale: 0.96 }}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
                  >
                    <FileText size={10} /> Read Paper
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Certifications */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Medal} title="Certifications" subtitle="Professional credentials" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {MOCK_CERTIFICATIONS.map((cert, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -4, scale: 1.02, boxShadow: "0 15px 30px rgba(0,0,0,0.3)" }}
                className="p-5 rounded-[20px] border text-center space-y-3 transition-all"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br ${cert.color}`}>
                  <span className="text-sm font-black text-white">{cert.org[0]}</span>
                </div>
                <span className="text-[10px] font-bold block" style={{ color: "rgba(255,255,255,0.4)" }}>{cert.org}</span>
                <span className="text-xs font-bold text-white block">{cert.name}</span>
                <span className="text-[9px] block" style={{ color: "rgba(255,255,255,0.35)" }}>{cert.date}</span>
                <span className="text-[8px] block font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{cert.credentialId}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-[10px] font-bold flex items-center gap-1 mx-auto mt-1"
                  style={{ color: "#f59e0b" }}
                >
                  <ExternalLink size={10} /> View Certificate
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILLS TAB
// ═══════════════════════════════════════════════════════════════════════════

function SkillsTab({ skillFilter, setSkillFilter }: { skillFilter: keyof typeof MOCK_SKILLS; setSkillFilter: (v: keyof typeof MOCK_SKILLS) => void }) {
  const filters: { id: keyof typeof MOCK_SKILLS; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "programming", label: "Programming", icon: Code2 },
    { id: "ai", label: "AI & ML", icon: Brain },
    { id: "development", label: "Development", icon: Layers },
  ];

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Zap} title="Skills Showcase" subtitle="Your technical expertise" gradient />

          <div className="flex gap-2 mt-2 mb-5">
            {filters.map((f) => {
              const isActive = skillFilter === f.id;
              return (
                <motion.button
                  key={f.id}
                  onClick={() => setSkillFilter(f.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  style={{
                    background: isActive ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    color: isActive ? "#f59e0b" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <f.icon size={13} /> {f.label}
                </motion.button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_SKILLS[skillFilter].map((skill, i) => {
              const SkillIcon = skill.icon;
              return (
                <motion.div
                  key={skill.name}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileHover={{ y: -3, borderColor: "rgba(245,158,11,0.2)" }}
                  className="p-4 rounded-[16px] border transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <SkillIcon size={14} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{skill.name}</span>
                        <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>{skill.level}%</span>
                      </div>
                    </div>
                    <SkillLevelBadge level={skill.level} />
                  </div>
                  <PremiumProgressBar value={skill.level} color="amber" height={4} />
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[9px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <Users size={9} /> {skill.endorsements} endorsements
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY TAB
// ═══════════════════════════════════════════════════════════════════════════

function ActivityTab() {
  return (
    <div className="space-y-5">
      {/* Contribution Heatmap */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={BarChart3} title="Contribution Heatmap" subtitle="Your coding consistency" />
          <div className="flex gap-[3px] flex-wrap mt-2">
            {CONTRIBUTION_DATA.map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.005 }}
                whileHover={{ scale: 1.5 }}
                className="w-3.5 h-3.5 rounded-[3px] cursor-default"
                title={`${level} contributions`}
                style={{
                  background: level === 0 ? "rgba(255,255,255,0.04)" :
                    level === 1 ? "rgba(245,158,11,0.2)" :
                    level === 2 ? "rgba(245,158,11,0.4)" :
                    level === 3 ? "rgba(245,158,11,0.65)" :
                    "rgba(245,158,11,0.9)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <div key={l} className="w-3 h-3 rounded-sm"
                style={{
                  background: l === 0 ? "rgba(255,255,255,0.04)" :
                    l === 1 ? "rgba(245,158,11,0.2)" :
                    l === 2 ? "rgba(245,158,11,0.4)" :
                    l === 3 ? "rgba(245,158,11,0.65)" :
                    "rgba(245,158,11,0.9)",
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </GlassCard>

      {/* Weekly & Monthly Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard>
          <div className="p-6">
            <SectionHeader icon={Calendar} title="Weekly Activity" subtitle="Hours per day" />
            <div className="space-y-3 mt-2">
              {WEEKLY_ACTIVITY.map((item, i) => (
                <motion.div
                  key={item.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[10px] font-bold w-8" style={{ color: "rgba(255,255,255,0.4)" }}>{item.day}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.hours / 8) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #f59e0b, #ea580c)" }}
                    />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right text-white">{item.hours}h</span>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-6">
            <SectionHeader icon={TrendingUp} title="Monthly Growth" subtitle="Progress over time" />
            <div className="space-y-3 mt-2">
              {MONTHLY_GROWTH.map((item, i) => (
                <motion.div
                  key={item.month}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[10px] font-bold w-8" style={{ color: "rgba(255,255,255,0.4)" }}>{item.month}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #06b6d4, #3b82f6)" }}
                    />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right text-white">{item.value}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Community Contributions */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Users} title="Community Contributions" subtitle="Your impact on the community" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {[
              { label: "Discussion Posts", val: 48, icon: MessageSquare, color: "text-blue-400", gradient: "from-blue-500 to-indigo-500" },
              { label: "Questions Answered", val: 124, icon: Lightbulb, color: "text-amber-400", gradient: "from-amber-500 to-orange-500" },
              { label: "Helpful Replies", val: 256, icon: Heart, color: "text-rose-400", gradient: "from-rose-500 to-pink-500" },
              { label: "Resources Shared", val: 38, icon: Bookmark, color: "text-purple-400", gradient: "from-purple-500 to-indigo-500" },
              { label: "Study Notes", val: 22, icon: FileText, color: "text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
              { label: "Community Likes", val: 892, icon: Star, color: "text-orange-400", gradient: "from-orange-500 to-amber-500" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -3, scale: 1.02 }}
                className="p-4 rounded-[16px] border text-center transition-all"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center bg-gradient-to-br ${item.gradient} mb-2`}>
                  <item.icon size={16} className="text-white" />
                </div>
                <span className="text-xl font-extrabold text-white block">
                  <AnimatedCounter value={item.val} />
                </span>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Portfolio Gallery */}
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={ImageIcon} title="Portfolio Gallery" subtitle="Visual showcase" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {[
              { title: "Dashboard UI", gradient: "from-amber-500/20 to-orange-500/10" },
              { title: "ML Model Viz", gradient: "from-purple-500/20 to-blue-500/10" },
              { title: "Research Poster", gradient: "from-cyan-500/20 to-teal-500/10" },
              { title: "Mobile App", gradient: "from-emerald-500/20 to-green-500/10" },
              { title: "API Docs", gradient: "from-rose-500/20 to-pink-500/10" },
              { title: "Conference Talk", gradient: "from-blue-500/20 to-indigo-500/10" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.03 }}
                className={`h-28 rounded-[16px] bg-gradient-to-br ${item.gradient} border flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group`}
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="text-[10px] font-bold text-white/60 relative z-10">{item.title}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye size={18} className="text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════

function AchievementsTab() {
  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="p-6">
          <SectionHeader icon={Trophy} title="Community Achievements" subtitle="Your earned badges and milestones" gradient />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {MOCK_ACHIEVEMENTS.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileHover={{ y: -6, scale: 1.04, boxShadow: `0 15px 30px rgba(0,0,0,0.3)` }}
                  className="p-5 rounded-[20px] border text-center space-y-3 transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: i * 0.05 }}
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${ach.bg} ${ach.border} border`}
                  >
                    <Icon size={24} className={ach.color} />
                  </motion.div>
                  <span className="text-xs font-bold text-white block">{ach.name}</span>
                  <span className="text-[9px] block leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{ach.desc}</span>
                  <PremiumBadge variant={
                    ach.rarity === "Legendary" ? "amber" :
                    ach.rarity === "Epic" ? "purple" :
                    ach.rarity === "Rare" ? "cyan" : "green"
                  }>
                    {ach.rarity}
                  </PremiumBadge>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Badges", val: 24, icon: Award, color: "text-amber-400", gradient: "from-amber-500 to-orange-500" },
          { label: "Legendary", val: 3, icon: Crown, color: "text-purple-400", gradient: "from-purple-500 to-indigo-500" },
          { label: "Epic", val: 8, icon: Star, color: "text-cyan-400", gradient: "from-cyan-500 to-blue-500" },
          { label: "This Month", val: 4, prefix: "+", icon: TrendingUp, color: "text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
        ].map((s, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={i}
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-4 rounded-[20px] border flex items-center gap-3 transition-all"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shrink-0`}>
              <s.icon size={16} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase block" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
              <span className="text-xl font-extrabold text-white">
                <AnimatedCounter value={s.val} prefix={s.prefix || ""} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
