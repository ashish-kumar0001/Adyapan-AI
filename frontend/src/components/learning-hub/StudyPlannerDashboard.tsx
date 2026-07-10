"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  Calendar as CalendarIcon, BookOpen, Clock, AlertCircle, Award, 
  Sparkles, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, 
  ArrowLeft, Download, Plus, AlertTriangle, BookOpenCheck, Flame, 
  CalendarRange, ListTodo, Star, UploadCloud, FileText, CheckSquare, Square
} from "lucide-react";

interface StudyTask {
  id: string;
  topicName: string;
  scheduledDate: string;
  priority: string;
  status: string;
  estimatedTime: number;
  completedAt?: string;
}

interface StudyPlan {
  id: string;
  title: string;
  examDate?: string;
  studyMode: string;
  dailyHours: number;
  targetScore: string;
  completionPercentage: number;
  daysRemaining: number;
  streak: number;
  successProbability: string;
  workloadAnalysis: {
    dailyWorkload: string;
    burnoutRisk: string;
    totalTodayHours: number;
    learningCapacity: string;
  };
}

interface Recommendation {
  type: string;
  title: string;
  reason: string;
  priority: string;
  action: string;
}

export function StudyPlannerDashboard() {
  const [theme, setTheme] = useState("dark");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  
  // Generator form state
  const [formData, setFormData] = useState({
    title: "",
    examDate: "",
    dailyHours: "3",
    targetScore: "90%",
    studyMode: "Exam Preparation",
    customTopics: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);

  // Active plan states
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([]);
  const [todayRevisions, setTodayRevisions] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Calendar rendering states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Generation loading stages
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingStages = [
    "Analyzing Learning Material...",
    "Calculating Study Time...",
    "Identifying Priorities...",
    "Scheduling Topics...",
    "Planning Revisions...",
    "Generating Recommendations...",
    "Study Plan Ready!"
  ];

  // Load theme and plan initially
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
      setTheme(savedTheme);
    }
    fetchActivePlan();
    
    // Listen for theme mutations
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute("data-theme") ?? "dark";
      setTheme(t);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const fetchActivePlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await api.get("/study-planner");
      if (res.data.success && res.data.plan) {
        setActivePlan(res.data.plan);
        setTasks(res.data.tasks);
        await Promise.all([
          fetchTodaySchedule(),
          fetchRecommendations(),
          fetchCalendarEvents()
        ]);
      } else {
        setActivePlan(null);
        setTasks([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load study plan data.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const res = await api.get("/study-planner/today");
      if (res.data.success) {
        setTodayTasks(res.data.tasks);
        setTodayRevisions(res.data.revisions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("/study-planner/recommendations");
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const res = await api.get("/study-planner/calendar");
      if (res.data.success) {
        setCalendarEvents(res.data.events);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Rescheduling
  const handleReschedule = async () => {
    setRescheduling(true);
    try {
      const res = await api.post("/study-planner/reschedule");
      if (res.data.success) {
        toast.success(res.data.message || "Smart rescheduling completed.");
        await fetchActivePlan();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reschedule tasks.");
    } finally {
      setRescheduling(false);
    }
  };

  // Complete Study Task
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    try {
      const res = await api.post("/study-planner/task/complete", { taskId, status: nextStatus });
      if (res.data.success) {
        if (nextStatus === "Completed") {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ["#f59e0b", "#d97706", "#fbbf24"]
          });
          toast.success("Task completed! +8 XP Awarded.");
        } else {
          toast.info("Task marked as pending.");
        }
        // Update local tasks
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
        setTodayTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
        // Refresh overview metrics
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t);
        const completed = updatedTasks.filter(t => t.status === "Completed").length;
        const compPct = Math.round((completed / updatedTasks.length) * 100);
        
        if (activePlan) {
          setActivePlan({
            ...activePlan,
            completionPercentage: compPct,
            successProbability: `${Math.min(98, 70 + Math.round(compPct * 0.28))}%`
          });
        }
        await Promise.all([
          fetchRecommendations(),
          fetchCalendarEvents()
        ]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update task status.");
    }
  };

  // Generate Plan flow
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Please enter a study goal or exam name.");
    
    setGenerating(true);
    setLoadingStage(0);

    // Simulate animated loading stages
    const timer = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < loadingStages.length - 2) return prev + 1;
        return prev;
      });
    }, 1800);

    try {
      let documentText = "";
      
      if (selectedFile) {
        setAnalyzingFile(true);
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        
        const analyzeRes = await api.post("/study/analyze", fileData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        if (analyzeRes.data.success && analyzeRes.data.analysis) {
          const analysis = analyzeRes.data.analysis;
          documentText = JSON.stringify(analysis);
        }
        setAnalyzingFile(false);
      }

      setLoadingStage(5); // Planning Revisions

      const res = await api.post("/study-planner/generate", {
        ...formData,
        documentText
      });

      if (res.data.success) {
        setLoadingStage(6); // Success stage
        setTimeout(async () => {
          clearInterval(timer);
          toast.success("AI Study Plan generated successfully!");
          await fetchActivePlan();
          setGenerating(false);
        }, 1200);
      }
    } catch (error) {
      clearInterval(timer);
      console.error(error);
      toast.error("AI Plan generation failed. Please try again.");
      setGenerating(false);
    }
  };

  const handleExport = (type: string) => {
    toast.success(`Exporting ${type}...`);
    window.print();
  };

  // Calendar calculation functions
  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth(prev => {
      const copy = new Date(prev);
      copy.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return copy;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDark = theme === "dark";

  const backgroundStyle = isDark 
    ? "bg-[#080710] text-white" 
    : "bg-[#F8FAFC] text-slate-900";
  
  const glassCardStyle = isDark 
    ? "bg-[#0f0f19]/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
    : "bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_24px_rgba(148,163,184,0.15)]";

  const bannerStyle = isDark
    ? "bg-gradient-to-r from-amber-950/20 via-amber-900/10 to-slate-900/40 border border-white/5"
    : "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/5 border border-slate-200";

  return (
    <div className={`w-full min-h-screen ${backgroundStyle} relative overflow-hidden transition-all duration-300`}>
      {/* Background Radial Glow elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {isDark ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
              transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
              className="absolute top-[-8%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[130px]"
              style={{ background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)" }}
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], y: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 15, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[-8%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[130px]"
              style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)" }}
            />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[100px] bg-amber-100/50" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[100px] bg-amber-50/40" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6">
        
        {loadingPlan ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
            <RefreshCw className="animate-spin text-amber-500" size={32} />
            <p className="text-sm font-semibold opacity-60">Synchronizing planner profile...</p>
          </div>
        ) : !activePlan ? (
          
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              {generating ? (
                <div className={`flex flex-col items-center justify-center p-12 min-h-[450px] ${glassCardStyle} rounded-3xl text-center`}>
                  <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-amber-600 border-b-amber-500 border-l-amber-500/10"
                    />
                    <BookOpen className="text-amber-500 animate-pulse" size={40} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Analyzing Material & Generating Schedule</h3>
                  <p className="text-sm opacity-50 mb-8 max-w-md">Our cognitive learning priority engine is designing your personalized spaced repetition study plan.</p>
                  
                  <div className="w-full max-w-xs space-y-3 text-left">
                    {loadingStages.map((stage, idx) => {
                      const isActive = idx === loadingStage;
                      const isCompleted = idx < loadingStage;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                            isCompleted ? "bg-emerald-500 text-white" : 
                            isActive ? "border-2 border-amber-500 animate-pulse" : "border border-white/20"
                          }`}>
                            {isCompleted && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                          <span className={`text-xs font-semibold transition-all ${
                            isActive ? "text-amber-400 font-bold" : isCompleted ? "opacity-40" : "opacity-20"
                          }`}>{stage}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`${glassCardStyle} rounded-3xl p-8`}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Sparkles size={28} className="animate-pulse" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black">AI Study Planner</h1>
                    <p className="text-sm opacity-60 mt-1 max-w-md mx-auto">
                      Don't just study. Optimize study schedules using spaced repetition, cognitive workloads, and adaptive priorities.
                    </p>
                  </div>

                  <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Exam / Subject Title</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g. Machine Learning Mid-Term or AWS Solutions Architect"
                          className={`w-full px-4 py-3 rounded-xl border ${isDark ? "bg-[#0d131a] border-white/10" : "bg-slate-50 border-slate-200"} outline-none focus:border-amber-500 transition-all text-sm`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Target Exam Date</label>
                        <input
                          type="date"
                          value={formData.examDate}
                          onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border ${isDark ? "bg-[#0d131a] border-white/10" : "bg-slate-50 border-slate-200"} outline-none focus:border-amber-500 transition-all text-sm`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Daily Study Hours</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.dailyHours}
                          onChange={e => setFormData({ ...formData, dailyHours: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border ${isDark ? "bg-[#0d131a] border-white/10" : "bg-slate-50 border-slate-200"} outline-none focus:border-amber-500 transition-all text-sm`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Target Score / Percentage</label>
                        <select
                          value={formData.targetScore}
                          onChange={e => setFormData({ ...formData, targetScore: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border ${isDark ? "bg-[#0d131a] border-white/10" : "bg-slate-50 border-slate-200"} outline-none focus:border-amber-500 transition-all text-sm`}
                        >
                          <option>95%</option>
                          <option>90%</option>
                          <option>85%</option>
                          <option>80%</option>
                          <option>75%</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Study Mode</label>
                        <select
                          value={formData.studyMode}
                          onChange={e => setFormData({ ...formData, studyMode: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border ${isDark ? "bg-[#0d131a] border-white/10" : "bg-slate-50 border-slate-200"} outline-none focus:border-amber-500 transition-all text-sm`}
                        >
                          <option>Exam Preparation</option>
                          <option>Interview Preparation</option>
                          <option>Quick Revision</option>
                          <option>Deep Learning</option>
                          <option>Placement Preparation</option>
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Upload Study Material (Optional)</label>
                        <div className={`border-2 border-dashed ${isDark ? "border-white/10 hover:border-amber-500 bg-white/[0.01]" : "border-slate-200 hover:border-amber-500 bg-slate-50/50"} rounded-2xl p-6 text-center cursor-pointer transition-all relative`}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center justify-center gap-2">
                            <UploadCloud className="text-amber-500" size={28} />
                            <span className="text-xs font-bold">{selectedFile ? selectedFile.name : "Drag or drop file here"}</span>
                            <span className="text-[10px] opacity-40">Supports PDF, DOCX, TXT up to 10MB</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-75">Custom Topics list (Optional)</label>
                        <textarea
                          rows={3}
                          value={formData.customTopics}
                          onChange={e => setFormData({ ...formData, customTopics: e.target.value })}
                          placeholder="e.g. CPU Scheduling, Deadlocks, SQL Joins, TCP/IP basics..."
                          className={`w-full px-4 py-3 rounded-xl border ${isDark ? "bg-[#0d131a] border-white/10" : "bg-slate-50 border-slate-200"} outline-none focus:border-amber-500 transition-all text-sm resize-none`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles size={16} /> Let AI Build Study Plan
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            <div className={`p-6 rounded-3xl ${bannerStyle} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full">{activePlan.studyMode}</span>
                  {activePlan.daysRemaining <= 5 && (
                    <span className="text-xs font-extrabold uppercase bg-red-500/20 text-red-400 px-3 py-1 rounded-full animate-pulse">Critical Timeline</span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black">{activePlan.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold opacity-70">
                  <span className="flex items-center gap-1"><CalendarIcon size={14} /> Exam Date: {activePlan.examDate ? new Date(activePlan.examDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : "Not set"}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> Capacity: {activePlan.dailyHours} hrs/day</span>
                  <span className="flex items-center gap-1"><Star size={14} /> Target Score: {activePlan.targetScore}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative group">
                  <button 
                    onClick={() => handleExport("PDF")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      isDark ? "bg-white/[0.02] border-white/10 hover:bg-white/5" : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Download size={13} /> Export Report
                  </button>
                </div>

                <button 
                  onClick={handleReschedule}
                  disabled={rescheduling}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md shadow-amber-500/10`}
                >
                  {rescheduling ? <RefreshCw className="animate-spin" size={13} /> : <RefreshCw size={13} />} Smart Reschedule
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl ${glassCardStyle} flex flex-col justify-between min-h-[110px]`}>
                <span className="text-[10px] font-extrabold uppercase opacity-40">Streak</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-black flex items-center gap-1 text-amber-500">{activePlan.streak} <Flame size={20} className="fill-amber-500 text-amber-500" /></span>
                  <span className="text-[9px] font-bold opacity-60">Active Streak</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${glassCardStyle} flex flex-col justify-between min-h-[110px]`}>
                <span className="text-[10px] font-extrabold uppercase opacity-40">Completion Rate</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-black text-amber-500">{activePlan.completionPercentage}%</span>
                  <span className="text-[9px] font-bold opacity-60">Tasks finished</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${glassCardStyle} flex flex-col justify-between min-h-[110px]`}>
                <span className="text-[10px] font-extrabold uppercase opacity-40">Success Probability</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-black text-emerald-400">{activePlan.successProbability}</span>
                  <span className="text-[9px] font-bold opacity-60">AI Projection</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${glassCardStyle} flex flex-col justify-between min-h-[110px]`}>
                <span className="text-[10px] font-extrabold uppercase opacity-40">Days Countdown</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-black text-rose-400">{activePlan.daysRemaining} days</span>
                  <span className="text-[9px] font-bold opacity-60">Time left</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                
                <div className={`p-6 rounded-2xl ${glassCardStyle}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ListTodo className="text-amber-500" size={18} />
                      <h3 className="font-extrabold text-base">Today's Tasks</h3>
                    </div>
                    <span className="text-xs opacity-60 font-semibold">{todayTasks.length} tasks scheduled</span>
                  </div>

                  {todayTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs opacity-50 border border-dashed border-white/5 rounded-xl">
                      No tasks scheduled for today. Take a quick practice test or revise weak topics!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayTasks.map(t => {
                        const isDone = t.status === "Completed";
                        return (
                          <motion.div 
                            key={t.id}
                            whileHover={{ scale: 1.01 }}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                              isDone 
                                ? "bg-emerald-500/5 border-emerald-500/20" 
                                : isDark ? "bg-white/[0.01] border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-200/60 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleTask(t.id, t.status)}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  isDone ? "bg-emerald-500 text-white" : "border-2 border-white/20 hover:border-amber-500"
                                }`}
                              >
                                {isDone && <CheckCircle size={14} className="fill-emerald-500 text-white" />}
                              </button>
                              <div>
                                <span className={`text-sm font-semibold ${isDone ? "line-through opacity-45" : ""}`}>{t.topicName}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    t.priority === "High" ? "bg-rose-500/10 text-rose-400" : 
                                    t.priority === "Important" ? "bg-amber-500/10 text-amber-500" : "bg-amber-500/10 text-amber-500"
                                  }`}>{t.priority}</span>
                                  <span className="text-[9px] opacity-40 font-bold flex items-center gap-0.5"><Clock size={8} /> {t.estimatedTime} mins</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {todayRevisions.length > 0 && (
                    <div className="mt-6 border-t border-white/5 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">Spaced Repetition Queue</h4>
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">Forgetfulness curve block</span>
                      </div>
                      <div className="space-y-2">
                        {todayRevisions.map(rev => (
                          <div key={rev.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                            isDark ? "bg-[#14121f]/50 border-amber-500/10" : "bg-amber-500/[0.02] border-amber-500/20"
                          }`}>
                            <span className="text-xs font-semibold">{rev.topicName}</span>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">{rev.revisionType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-6 rounded-2xl ${glassCardStyle}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="text-amber-500" size={18} />
                      <h3 className="font-extrabold text-base">Monthly Roadmap</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleMonthChange("prev")} className="p-1 hover:bg-white/5 rounded-lg"><ChevronLeft size={16} /></button>
                      <span className="text-xs font-bold">{currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => handleMonthChange("next")} className="p-1 hover:bg-white/5 rounded-lg"><ChevronRight size={16} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                      <span key={d} className="text-[10px] font-black uppercase opacity-40 py-1">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
                      
                      const dayStr = day.toISOString().split("T")[0];
                      const dayEvents = calendarEvents.filter(e => e.date === dayStr);
                      const hasStudy = dayEvents.some(e => e.type === "study");
                      const hasRev = dayEvents.some(e => e.type === "revision");
                      const isSelected = selectedDate?.toDateString() === day.toDateString();

                      return (
                        <button
                          key={dayStr}
                          onClick={() => setSelectedDate(day)}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1 text-xs relative transition-all border ${
                            isSelected 
                              ? "bg-amber-500 border-amber-500 text-slate-950" 
                              : isDark ? "bg-white/[0.01] border-white/5 hover:bg-white/5" : "bg-slate-100/50 border-slate-200/50 hover:bg-slate-100"
                          }`}
                        >
                          <span className="font-extrabold">{day.getDate()}</span>
                          <div className="flex gap-0.5 justify-center mb-0.5 w-full">
                            {hasStudy && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-slate-950" : "bg-amber-500"}`} />}
                            {hasRev && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-slate-950" : "bg-amber-500"}`} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                      <h4 className="text-xs font-extrabold text-amber-500">Scheduled on {selectedDate.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}</h4>
                      {(() => {
                        const selStr = selectedDate.toISOString().split("T")[0];
                        const selEvents = calendarEvents.filter(e => e.date === selStr);
                        if (selEvents.length === 0) return <p className="text-[11px] opacity-40">No scheduled sessions or practice runs.</p>;
                        return (
                          <div className="space-y-1.5">
                            {selEvents.map(e => (
                              <div key={e.id} className="flex items-center justify-between text-[11px] font-semibold opacity-80">
                                <span>{e.title}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  e.type === "study" ? "bg-amber-500/10 text-amber-500" : "bg-amber-500/10 text-amber-500"
                                }`}>{e.status}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                
                <div className={`p-6 rounded-2xl ${glassCardStyle} text-center space-y-4`}>
                  <div className="w-20 h-20 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-500/30 animate-spin" style={{ animationDuration: "12s" }} />
                    <Award className="text-amber-500 animate-bounce" size={32} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-black">Level Progress</h3>
                    <p className="text-xs opacity-50 mt-0.5">Study Planner Intelligence XP</p>
                  </div>

                  <div className="w-full space-y-1.5 text-left">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-amber-500">Lv.{Math.round(activePlan.completionPercentage / 15) + 1} Scholar</span>
                      <span>{activePlan.completionPercentage}% Completion</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all" style={{ width: `${activePlan.completionPercentage}%` }} />
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl ${glassCardStyle}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarRange className="text-amber-500" size={18} />
                    <h3 className="font-extrabold text-base">Workload Analysis</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="opacity-60 font-semibold">Today's Intensity</span>
                      <span className={`font-bold ${
                        activePlan.workloadAnalysis.dailyWorkload === "High" ? "text-rose-400" : 
                        activePlan.workloadAnalysis.dailyWorkload === "Moderate" ? "text-amber-500" : "text-emerald-400"
                      }`}>{activePlan.workloadAnalysis.dailyWorkload} Workload</span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className="opacity-60 font-semibold">Burnout Risk</span>
                      <span className={`font-bold ${
                        activePlan.workloadAnalysis.burnoutRisk === "High" ? "text-rose-400 animate-pulse" : 
                        activePlan.workloadAnalysis.burnoutRisk === "Moderate" ? "text-amber-500" : "text-emerald-400"
                      }`}>{activePlan.workloadAnalysis.burnoutRisk} Risk</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-60 font-semibold">Allocated Capacity</span>
                      <span className="font-bold text-amber-500">{activePlan.workloadAnalysis.learningCapacity}</span>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl ${glassCardStyle}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-amber-500" size={18} />
                    <h3 className="font-extrabold text-base">AI Recommendation</h3>
                  </div>

                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.type === "study" ? "bg-amber-500/10 text-amber-500" : "bg-amber-500/10 text-amber-500"
                          }`}>{rec.type}</span>
                          <span className="text-[10px] font-bold text-rose-400">{rec.priority} Priority</span>
                        </div>
                        <h4 className="text-xs font-black">{rec.title}</h4>
                        <p className="text-[11px] opacity-60 leading-relaxed">{rec.reason}</p>
                        <button className="text-[10px] font-bold text-amber-500 flex items-center gap-1 hover:underline">{rec.action} →</button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
