"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Sparkles, Terminal, FileText, CheckCircle, ChevronDown,
  Brain, BookOpen, Trophy, MessageSquare, Play,
  Calendar, Star, Check, Layers,
  Search, Briefcase
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { landingFAQs } from "@/data/platform";

export default function LandingPage() {
  const [faqSearch, setFaqSearch] = useState("");
  const [pricingPeriod, setPricingPeriod] = useState<"monthly" | "annually">("annually");
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  // Stats Counter state
  const [statLearned, setStatLearned] = useState(0);
  const [statNotes, setStatNotes] = useState(0);
  const [statResumes, setStatResumes] = useState(0);
  const [statInterviews, setStatInterviews] = useState(0);

  // ATS Scanner state
  const [atsScanning, setAtsScanning] = useState(false);
  const [atsScore, setAtsScore] = useState(0);

  // Coding Hub Terminal state
  const [terminalStep, setTerminalStep] = useState(0);
  const [terminalText, setTerminalText] = useState("");
  const promptString = "Build a microservices-based Netflix Clone using React...";

  // 3D Parallax and scroll progress
  const { scrollY } = useScroll();

  const heroScale = useTransform(scrollY, [0, 500], [1, 0.92]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Handle auto-typing for Coding Hub terminal
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTerminalText((prev) => prev + promptString.charAt(index));
      index++;
      if (index >= promptString.length) {
        clearInterval(interval);
        setTimeout(() => setTerminalStep(1), 1000);
        setTimeout(() => setTerminalStep(2), 2500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Trigger ATS scanner loop
  useEffect(() => {
    const timer = setInterval(() => {
      setAtsScanning(true);
      setAtsScore(0);
      let current = 0;
      const scanInterval = setInterval(() => {
        current += 2;
        setAtsScore(current);
        if (current >= 92) {
          clearInterval(scanInterval);
          setTimeout(() => setAtsScanning(false), 2000);
        }
      }, 30);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  // Trigger counter increments when visible
  useEffect(() => {
    const startCounters = () => {
      let l = 0, n = 0, r = 0, i = 0;
      const learnedInt = setInterval(() => {
        l += 8;
        if (l >= 1248) { setStatLearned(1248); clearInterval(learnedInt); }
        else setStatLearned(l);
      }, 15);
      const notesInt = setInterval(() => {
        n += 5;
        if (n >= 412) { setStatNotes(412); clearInterval(notesInt); }
        else setStatNotes(n);
      }, 20);
      const resumesInt = setInterval(() => {
        r += 1;
        if (r >= 85) { setStatResumes(85); clearInterval(resumesInt); }
        else setStatResumes(r);
      }, 25);
      const interviewInt = setInterval(() => {
        i += 1;
        if (i >= 94) { setStatInterviews(94); clearInterval(interviewInt); }
        else setStatInterviews(i);
      }, 30);
    };

    const handleScroll = () => {
      const section = document.getElementById("live-dashboard");
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          startCounters();
          window.removeEventListener("scroll", handleScroll);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add landing class to body
  useEffect(() => {
    document.body.classList.add("landing");
    return () => document.body.classList.remove("landing");
  }, []);

  // Filter FAQs
  const filteredFAQs = landingFAQs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // 3D Scroll transition setting
  const scroll3DVariant = {
    initial: { rotateX: 12, y: 60, opacity: 0 },
    whileInView: { rotateX: 0, y: 0, opacity: 1 },
    viewport: { once: false, margin: "-120px" },
    transition: { duration: 0.75, ease: "easeOut" as const }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#03060b", color: "#f3f4f6" }} className="overflow-x-hidden font-sans">
      <Navbar />

      {/* Background Glows (Matched with Amber/Orange Logo) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[140px] animate-pulse" style={{ animationDuration: "8s" }} />
      </div>

      {/* SECTION 1: HERO */}
      <motion.section
        id="home"
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 md:px-8 z-10"
      >
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Content */}
          <div className="lg:col-span-6 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-400">
              <Sparkles size={12} className="animate-spin" /> The Future of Learning is Agentic AI
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              One AI <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Operating System</span> For Careers
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-lg">
              One central system for learning, smart coding, automated resume building, AI behavioral interviews, and placement channels.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-300">
              <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full">✨ Learn Faster</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full">💻 Build Smarter</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full">🚀 Get Hired</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-6 py-3 font-semibold text-black transition-all transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
              >
                Start Free Today <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold text-white border border-white/10 transition-colors"
              >
                Watch Demo <Play size={14} />
              </a>
            </div>
          </div>

          {/* Interactive Floating 3D Dashboard Mockup */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl opacity-10 blur-xl animate-pulse" />
            <motion.div
              style={{ transformStyle: "preserve-3d" }}
              whileHover={{ rotateY: 10, rotateX: -5 }}
              className="relative w-full max-w-[480px] aspect-[4/3] rounded-2xl border border-white/10 bg-[#090b11]/80 backdrop-blur-xl p-6 shadow-2xl transition-all cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-[10px] text-gray-500 font-mono">dashboard.adyapan.ai</div>
              </div>

              {/* Mock Dashboard Layout */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Learning Speed</div>
                    <div className="text-xl font-bold text-amber-400">9.4x Faster</div>
                  </div>
                  <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-2">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">AI Agent Action Graph</div>
                    <div className="h-16 flex items-end gap-1 pt-2">
                      <div className="w-full bg-amber-500/40 rounded-t h-[40%] animate-pulse" />
                      <div className="w-full bg-orange-500/60 rounded-t h-[75%] animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <div className="w-full bg-yellow-400/80 rounded-t h-[60%] animate-pulse" style={{ animationDelay: "0.4s" }} />
                      <div className="w-full bg-amber-500 rounded-t h-[90%] animate-pulse" style={{ animationDelay: "0.6s" }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                    <Brain className="w-6 h-6 text-amber-400 mx-auto animate-pulse" />
                    <span className="block text-[8px] text-gray-400">Skills Verified</span>
                    <span className="block text-xs font-bold text-white">18 Mastered</span>
                  </div>
                  <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-center space-y-1">
                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto animate-bounce" />
                    <span className="block text-[8px] text-gray-400">Rank</span>
                    <span className="block text-xs font-bold text-white">Top 2%</span>
                  </div>
                </div>
              </div>

              {/* Floating Orbits */}
              <div className="absolute top-1/4 right-[-20px] px-3 py-1.5 bg-[#0d0f17] border border-white/10 rounded-lg text-[9px] text-white flex items-center gap-1.5 shadow-lg shadow-black/40">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" /> Study Assistant
              </div>
              <div className="absolute bottom-1/4 left-[-15px] px-3 py-1.5 bg-[#0d0f17] border border-white/10 rounded-lg text-[9px] text-white flex items-center gap-1.5 shadow-lg shadow-black/40">
                <Terminal className="w-3.5 h-3.5 text-amber-400" /> Coding Copilot
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 2: SCROLL STORY */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 border-t border-white/5 bg-[#05070c]"
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Adyapan AI Builds Your Journey Automatically
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              Watch how our agentic system constructs a tailormade career path step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
            {/* Step 1 */}
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="text-xs uppercase text-amber-400 font-bold tracking-wider">Goal Selection</div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                <div className="text-[10px] text-gray-400">Target Role</div>
                <div className="text-sm font-bold text-white">Machine Learning Engineer</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Define your primary goals, and our platform tunes your syllabus automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="text-xs uppercase text-orange-400 font-bold tracking-wider">Roadmap Node</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <CheckCircle size={12} className="text-amber-400" /> Learn Core ML
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <CheckCircle size={12} className="text-amber-400" /> Build Projects
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                  <div className="w-3 h-3 rounded-full border border-gray-600" /> Practice Interviews
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                A custom timeline is drawn, mapping skill acquisitions, builds, and recruiter preparation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="text-xs uppercase text-yellow-400 font-bold tracking-wider">Career Launch</div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <div className="text-xs font-bold text-white">Fast-tracked Screen</div>
                <div className="text-[9px] text-amber-400">Direct Partner Hiring</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Match automatically with micro-internships and placement drives based on verified data.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: AGENT ECOSYSTEM */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 bg-[#030712] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              The Agent Ecosystem
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Every hub acts as an interconnected node. Your study performance directly builds your resume skills, preparing you for matching interview modules.
            </p>
            <div className="space-y-4">
              {[
                "Learning data generates project ideas",
                "Project builds automatically upgrade your ATS resume",
                "ATS resume configures AI coaching questions",
                "Coaching score feeds direct placement matches"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-gray-300">
                  <Check size={14} className="text-amber-400" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 flex justify-center relative">
            <svg viewBox="0 0 400 400" className="w-full max-w-[420px] aspect-square overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <line x1="200" y1="200" x2="80" y2="100" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" />
              <line x1="200" y1="200" x2="320" y2="100" stroke="url(#lineGrad)" strokeWidth="1.5" />
              <line x1="200" y1="200" x2="80" y2="300" stroke="url(#lineGrad)" strokeWidth="1.5" />
              <line x1="200" y1="200" x2="320" y2="300" stroke="url(#lineGrad)" strokeWidth="1.5" />

              {/* Center Node */}
              <circle cx="200" cy="200" r="28" fill="#1c160c" stroke="#f59e0b" strokeWidth="2" />
              <text x="200" y="204" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Adyapan AI</text>

              {/* Connected Nodes */}
              <circle cx="80" cy="100" r="22" fill="#0d0d0d" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="80" y="103" textAnchor="middle" fill="#fde047" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Learning</text>

              <circle cx="320" cy="100" r="22" fill="#0d0d0d" stroke="#ea580c" strokeWidth="1.5" />
              <text x="320" y="103" textAnchor="middle" fill="#fdba74" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Coding</text>

              <circle cx="80" cy="300" r="22" fill="#0d0d0d" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="80" y="303" textAnchor="middle" fill="#fde047" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Resume Hub</text>

              <circle cx="320" cy="300" r="22" fill="#0d0d0d" stroke="#ea580c" strokeWidth="1.5" />
              <text x="320" y="303" textAnchor="middle" fill="#fdba74" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Placement</text>
            </svg>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: LEARNING HUB */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        id="features"
        className="py-24 relative z-10 bg-[#05070c] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-400">
              <Brain size={12} /> Personalized Academy
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Explore the Learning Hub
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
              Automated document synthesis, syllabus notes, custom question generators, and study plan utilities in one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-amber-500/35 transition-colors">
              <BookOpen className="w-8 h-8 text-amber-400" />
              <h3 className="text-xl font-bold text-white">Notes Generator</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload PDFs or slides, and get beautifully structured summaries, key takeaways, and flashcards instantly.
              </p>
            </div>
            <div className="p-8 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-orange-500/35 transition-colors">
              <Brain className="w-8 h-8 text-orange-400" />
              <h3 className="text-xl font-bold text-white">Quiz Creator</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Test yourself with conceptual questions generated straight from your syllabus to check validation scores.
              </p>
            </div>
            <div className="p-8 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-yellow-500/35 transition-colors">
              <Layers className="w-8 h-8 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Mind Map builder</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Unlock tree mind-maps generated from raw topic inputs to link connected academic definitions logically.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 5: CODING HUB */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 bg-[#030712] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-400">
              <Terminal size={12} /> Tech & Execution
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Coding Assistant & Workspace
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Design architectures, write correct functions, solve coding challenges, and prepare for algorithmic technical interviews.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/3 border border-white/5 rounded-xl">
                <span className="block text-sm font-bold text-white">DSA Hub</span>
                <span className="block text-[10px] text-gray-500 mt-1">Algorithmic preparations</span>
              </div>
              <div className="p-4 bg-white/3 border border-white/5 rounded-xl">
                <span className="block text-sm font-bold text-white">Portfolio Gen</span>
                <span className="block text-[10px] text-gray-500 mt-1">Showcase finished projects</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="w-full max-w-[480px] aspect-[4/3] rounded-2xl border border-white/10 bg-[#090b11]/90 font-mono text-[11px] overflow-hidden flex flex-col shadow-2xl">
              <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="text-[10px] text-gray-500">Terminal — node workspace</div>
              </div>
              <div className="p-5 flex-1 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">~</span>
                  <span className="text-white">{terminalText}</span>
                </div>
                {terminalStep >= 1 && (
                  <div className="text-gray-400 space-y-1 animate-fadeIn">
                    <span className="text-amber-400 block font-bold">🚀 Initializing AI Build Agent...</span>
                    <span className="block font-bold">✓ Setting up Tech Stack: Next.js + NestJS + Docker</span>
                    <span className="block">✓ Assembling architecture structures...</span>
                  </div>
                )}
                {terminalStep >= 2 && (
                  <div className="text-gray-400 space-y-1 animate-fadeIn">
                    <span className="text-green-400 block font-bold">📦 Generated Files:</span>
                    <span className="block text-amber-400 font-bold">├── gateway/src/main.ts (Gateway Service)</span>
                    <span className="block text-amber-400 font-bold">├── auth-service/src/auth.controller.ts (JWT Auth)</span>
                    <span className="block text-amber-400 font-bold">└── billing-service/prisma/schema.prisma (Neon DB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 6: RESUME HUB (ATS SCANNER) */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 bg-[#05070c] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[360px] aspect-[1/1.4] bg-white border border-gray-200 rounded-xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
              {atsScanning && (
                <div className="absolute left-0 w-full h-1 bg-amber-500/80 shadow-[0_0_10px_#f59e0b] animate-scan" style={{ top: "40%" }} />
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-900 rounded" />
                    <div className="w-16 h-2.5 bg-gray-400 rounded" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center font-bold text-[9px] text-white">
                    {atsScore}%
                  </div>
                </div>

                <div className="h-0.5 bg-gray-200 w-full" />

                <div className="space-y-2">
                  <div className="w-12 h-3 bg-gray-900 rounded" />
                  <div className="w-full h-2.5 bg-gray-300 rounded" />
                  <div className="w-5/6 h-2.5 bg-gray-300 rounded" />
                </div>

                <div className="space-y-2">
                  <div className="w-20 h-3 bg-gray-900 rounded" />
                  <div className="w-full h-2.5 bg-gray-300 rounded" />
                  <div className="w-4/5 h-2.5 bg-gray-300 rounded" />
                </div>
              </div>

              <div className="flex justify-between items-center text-[8px] text-gray-500">
                <span>ATS Optimized</span>
                <span>Verified by Adyapan</span>
              </div>
            </div>

            <div className="absolute bottom-10 right-4 p-4 bg-[#090b11] border border-white/10 rounded-2xl flex items-center gap-3 shadow-xl">
              <div className="w-12 h-12 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                  <circle cx="24" cy="24" r="20" stroke="#f59e0b" strokeWidth="4" fill="transparent" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - atsScore / 100)} />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">{atsScore}%</span>
              </div>
              <div>
                <span className="block text-[8px] text-gray-400 uppercase">Search Visibility</span>
                <span className="block text-xs font-bold text-white">ATS Grade A+</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-400">
              <FileText size={12} /> Conversion & Profile
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Most Important Conversion: Resume Hub
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Assemble resume drafts, test keywords with the ATS Score Checker, run AI SWOT reviews, and export to LinkedIn.
            </p>
            <div className="space-y-4">
              {[
                "Instant ATS audit checking formatting issues",
                "SWOT analyzer identifying skill gaps",
                "LinkedIn Profile Optimizer improving recruiter visibility",
                "Cover Letter Generator aligning with target JDs"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-gray-300">
                  <Check size={14} className="text-amber-400" />
                  {text}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#f59e0b] hover:underline">
                Unlock Resume Hub <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 7: INTERVIEW COACH */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 bg-[#030712] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-400">
              <MessageSquare size={12} /> Behavioral Drills
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              AI Interview Simulation
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Speak or code live. Receive structured analytics evaluations tracking your Confidence, Communication quality, Tech speed, and structure.
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-white font-bold">88%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Communication</span>
                  <span className="text-white font-bold">92%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[480px] bg-[#0c0d15] border border-white/5 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Brain size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">AI HR Coach</span>
                  <span className="block text-[8px] text-green-400">Live Simulation</span>
                </div>
              </div>

              <div className="space-y-3 text-[11px] leading-relaxed">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 max-w-[85%]">
                  &quot;Tell me about a time you handled a difficult conflict inside a technical engineering team.&quot;
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-300 max-w-[85%] ml-auto text-right">
                  &quot;I resolved a branch merge conflict by scheduling a sync alignment to map data models together.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 8: PLACEMENT HUB */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 bg-[#05070c] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-400">
              <Trophy size={12} /> Opportunities
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Placement Hub & Opportunities
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
              Get matched directly with micro-internships, placement drives, remote gigs, and hackathons verified by credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-amber-400/30 transition-colors">
              <Briefcase className="w-8 h-8 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Micro-Internships</h3>
              <p className="text-xs text-gray-500">Short-term remote engineering positions.</p>
            </div>
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-orange-400/30 transition-colors">
              <Trophy className="w-8 h-8 text-orange-400" />
              <h3 className="text-lg font-bold text-white">Hiring Drives</h3>
              <p className="text-xs text-gray-500">Direct hiring partnership opportunities.</p>
            </div>
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-yellow-400/30 transition-colors">
              <Calendar className="w-8 h-8 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Hackathons</h3>
              <p className="text-xs text-gray-500">Compete globally and verify skill sets.</p>
            </div>
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4 hover:border-amber-500/30 transition-colors">
              <Star className="w-8 h-8 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Job Referrals</h3>
              <p className="text-xs text-gray-500">Connect with alumni and hiring mentors.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 9: LIVE DASHBOARD EXPERIENCE */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        id="live-dashboard"
        className="py-24 relative z-10 bg-[#030712] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 text-left space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Live Platform Statistics
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Every learning session, mock test, and resume check is logged dynamically in your verified workspace.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="block text-3xl font-extrabold text-amber-455 text-amber-400">{statLearned}+</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Hours Learned</span>
            </div>
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="block text-3xl font-extrabold text-orange-400">{statNotes}+</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Notes Generated</span>
            </div>
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="block text-3xl font-extrabold text-yellow-400">{statResumes}%</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Resume Score</span>
            </div>
            <div className="p-6 bg-white/2 border border-white/5 rounded-2xl text-center space-y-2">
              <span className="block text-3xl font-extrabold text-amber-400">{statInterviews}/100</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Interview Score</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 10: PRICING */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="py-24 relative z-10 bg-[#05070c] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Transparent, Flexible Plans
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
              Choose the tier that maps perfectly with your academic or career requirements.
            </p>

            {/* Toggle pricing period */}
            <div className="inline-flex bg-white/5 border border-white/5 rounded-full p-1 mt-4">
              <button
                onClick={() => setPricingPeriod("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  pricingPeriod === "monthly" ? "bg-amber-500 text-black" : "text-gray-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingPeriod("annually")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  pricingPeriod === "annually" ? "bg-amber-500 text-black" : "text-gray-400"
                }`}
              >
                Annually (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-8 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-sm font-bold text-gray-400">Free Tier</span>
                <div className="text-4xl font-extrabold text-white">$0</div>
                <p className="text-xs text-gray-500">Essential tools for all college students.</p>
              </div>
              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Syllabus Notes Creator</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> ATS Resume Scanner (3 checks)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> General Job Hub access</li>
              </ul>
              <Link href="/login" className="w-full text-center py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                Start Free
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 bg-[#0f0e09] border-2 border-amber-500/40 rounded-2xl flex flex-col justify-between space-y-6 relative">
              <div className="absolute top-4 right-4 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[9px] font-bold text-amber-300 uppercase">
                Most Popular
              </div>
              <div className="space-y-2">
                <span className="text-sm font-bold text-amber-400 font-bold">Pro Plan</span>
                <div className="text-4xl font-extrabold text-white">
                  {pricingPeriod === "annually" ? "$12" : "$15"}{" "}
                  <span className="text-xs text-gray-500">/ mo</span>
                </div>
                <p className="text-xs text-gray-500">Ultimate behavioral coach & full resume audits.</p>
              </div>
              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Infinite Resume SWOT Reviews</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Unlimited AI Mock Interviews</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Direct LinkedIn Profile Optimizer</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Micro-internships matching channels</li>
              </ul>
              <Link href="/login" className="w-full text-center py-2 text-xs font-bold rounded-lg bg-amber-500 text-black hover:bg-amber-600 transition-colors">
                Upgrade to Pro
              </Link>
            </div>

            {/* Campus */}
            <div className="p-8 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-sm font-bold text-gray-400">Campus Partner</span>
                <div className="text-2xl font-extrabold text-white">Institutional</div>
                <p className="text-xs text-gray-500">For departments, placement cells, and universities.</p>
              </div>
              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> White-label domain portals</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Admin placement tracker console</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Bulk student cohort analytics</li>
              </ul>
              <Link href="/login" className="w-full text-center py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                Contact Campus Sales
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 11: FAQ */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        id="faq"
        className="py-24 relative z-10 bg-[#030712] border-t border-white/5"
      >
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
              Quick answers about core features, ATS checks, and account credits.
            </p>

            {/* Interactive Search box */}
            <div className="relative max-w-md mx-auto mt-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-amber-500 focus:outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-8">No matching FAQs found.</div>
            ) : (
              filteredFAQs.map((faq, idx) => (
                <div key={idx} className="bg-white/2 border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-white cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${activeFAQ === idx ? "rotate-180" : ""}`} />
                  </button>
                  {activeFAQ === idx && (
                    <div className="px-5 pb-5 pt-0 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.section>

      {/* SECTION 12: FINAL CTA */}
      <motion.section
        {...scroll3DVariant}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        className="relative py-28 overflow-hidden z-10 border-t border-white/5 bg-[#05070c] text-center flex flex-col items-center justify-center"
      >
        {/* Animated Particles background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[20%] left-[10%] w-2.5 h-2.5 rounded-full bg-amber-500 animate-float" />
          <div className="absolute top-[50%] right-[15%] w-1.5 h-1.5 rounded-full bg-orange-400 animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[30%] left-[30%] w-2 h-2 rounded-full bg-yellow-400 animate-float" style={{ animationDelay: "4s" }} />
        </div>

        <div className="max-w-3xl px-4 space-y-8 relative">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center p-[2px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#05070c] rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Your Learning. Your Skills.<br />
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Your Future. Powered by AI.</span>
          </h2>

          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Everything you need to learn, build outstanding projects, optimize ATS resume documents, pass interviews, and launch your career.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-8 py-3.5 font-bold text-black transition-all transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 text-sm"
            >
              Launch Adyapan AI
            </Link>
            <Link
              href="/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-8 py-3.5 font-bold text-white border border-white/10 transition-colors text-sm"
            >
              Start Free Today
            </Link>
          </div>
        </div>
      </motion.section>

      <Footer />

      {/* Embedded style tags for custom animations */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scan {
          animation: scan 3.5s infinite ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s forwards ease-out;
        }

        .text-gradient {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
