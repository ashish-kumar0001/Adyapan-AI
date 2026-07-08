"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Search, Filter, MapPin, Calendar, DollarSign, Send,
  Sparkles, CheckCircle2, XCircle, Info, Heart, ArrowRight, Share2,
  Trash2, Plus, Clock, MessageSquare, Award, ArrowLeft, ArrowRightLeft,
  ChevronRight, AlertCircle, FileText, UserCheck, Play, PlusCircle
} from "lucide-react";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35 } }),
};

interface Internship {
  id: string;
  role: string;
  company: string;
  logoBg: string;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  duration: string;
  stipend: string;
  skills: string[];
  description: string;
  responsibilities: string[];
  eligibility: string[];
  deadline: string;
  website: string;
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  learningPath: string[];
}

interface Application {
  id: string;
  company: string;
  role: string;
  stipend: string;
  status: "Saved" | "Applied" | "Under Review" | "Shortlisted" | "Interview Scheduled" | "Offer Received" | "Rejected";
  notes?: string;
  reminderDate?: string;
  dateAdded: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface InternshipHubViewProps {
  setView: (v: any) => void;
  activeModule?: string;
  theme?: string;
}

const EMPTY_INTERNSHIPS: Internship[] = [];

const TRACKER_STATUSES = [
  "Saved",
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Offer Received",
  "Rejected"
] as const;

export function InternshipHubView({ setView, activeModule = "internship-hub", theme = "dark" }: InternshipHubViewProps) {
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#080710" : "#f0f4ff",
    surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    surfaceHover: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    text: isDark ? "#ffffff" : "#0f172a",
    textSec: isDark ? "rgba(255,255,255,0.7)" : "#475569",
    textMuted: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
    primary: "#f59e0b",
    primaryDark: "#d97706",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    inputBg: isDark ? "rgba(0,0,0,0.4)" : "#ffffff",
    green: "#10b981",
    red: "#ef4444",
  };

  // Screen/Tab state
  const [tab, setTab] = useState<"finder" | "recommendations" | "tracker">("finder");
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [locFilter, setLocFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [durationFilter, setDurationFilter] = useState("All");

  // Selected Internship Modal
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [savedInternships, setSavedInternships] = useState<string[]>([]);

  // Tracker Kanban state
  const [applications, setApplications] = useState<Application[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppCompany, setNewAppCompany] = useState("");
  const [newAppRole, setNewAppRole] = useState("");
  const [newAppStipend, setNewAppStipend] = useState("");
  const [newAppStatus, setNewAppStatus] = useState<Application["status"]>("Applied");
  const [newAppNotes, setNewAppNotes] = useState("");

  // AI Assistant panel state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I am your Adyapan AI Placement Assistant. Ask me to find internships, write resume bullets, or draft cover letters!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync tab with activeModule from props
  useEffect(() => {
    if (activeModule === "internship-finder") setTab("finder");
    else if (activeModule === "internship-recommendations") setTab("recommendations");
    else if (activeModule === "internship-tracker") setTab("tracker");
  }, [activeModule]);

  // Load tracker applications from localStorage
  useEffect(() => {
    const savedApps = localStorage.getItem("ady-internship-apps");
    if (savedApps) {
      try {
        setApplications(JSON.parse(savedApps));
      } catch { /* ignore */ }
    } else {
      // Seed default tracker applications
      const defaults: Application[] = [
        { id: "app-1", company: "Google", role: "Machine Learning Intern", stipend: "₹50,000 / mo", status: "Interview Scheduled", notes: "First interview with hiring manager on Friday.", dateAdded: new Date().toISOString() },
        { id: "app-2", company: "Netflix", role: "Frontend Developer Intern", stipend: "$4,500 / mo", status: "Applied", notes: "Submitted via referral.", dateAdded: new Date().toISOString() }
      ];
      setApplications(defaults);
      localStorage.setItem("ady-internship-apps", JSON.stringify(defaults));
    }

    const savedSaves = localStorage.getItem("ady-internship-saves");
    if (savedSaves) {
      try {
        setSavedInternships(JSON.parse(savedSaves));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const saveAppsToStorage = (updated: Application[]) => {
    setApplications(updated);
    localStorage.setItem("ady-internship-apps", JSON.stringify(updated));
  };

  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let updated: string[];
    if (savedInternships.includes(id)) {
      updated = savedInternships.filter(x => x !== id);
    } else {
      updated = [...savedInternships, id];
    }
    setSavedInternships(updated);
    localStorage.setItem("ady-internship-saves", JSON.stringify(updated));
  };

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppCompany.trim() || !newAppRole.trim()) return;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      company: newAppCompany.trim(),
      role: newAppRole.trim(),
      stipend: newAppStipend.trim() || "Unpaid",
      status: newAppStatus,
      notes: newAppNotes.trim() || undefined,
      dateAdded: new Date().toISOString()
    };

    const updated = [newApp, ...applications];
    saveAppsToStorage(updated);

    // Clear form
    setNewAppCompany("");
    setNewAppRole("");
    setNewAppStipend("");
    setNewAppStatus("Applied");
    setNewAppNotes("");
    setShowAddForm(false);
  };

  const handleMoveApp = (id: string, dir: "left" | "right") => {
    const appIndex = applications.findIndex(x => x.id === id);
    if (appIndex === -1) return;
    const currentStatus = applications[appIndex].status;
    const currentStatusIdx = TRACKER_STATUSES.indexOf(currentStatus);
    
    let nextIdx = currentStatusIdx;
    if (dir === "left" && currentStatusIdx > 0) nextIdx -= 1;
    if (dir === "right" && currentStatusIdx < TRACKER_STATUSES.length - 1) nextIdx += 1;

    if (nextIdx !== currentStatusIdx) {
      const updated = [...applications];
      updated[appIndex] = { ...updated[appIndex], status: TRACKER_STATUSES[nextIdx] };
      saveAppsToStorage(updated);
    }
  };

  const handleDeleteApp = (id: string) => {
    if (!confirm("Are you sure you want to remove this application?")) return;
    const updated = applications.filter(x => x.id !== id);
    saveAppsToStorage(updated);
  };

  // Filter listings
  const filteredInternships = EMPTY_INTERNSHIPS;

  const handleAssistantSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const promptText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: promptText }]);
    setChatLoading(true);

    try {
      toast.error("AI Assistant is not available yet. Real-time responses will be enabled in a future update.");
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Stats computed from state
  const totalApps = applications.length;
  const interviewingApps = applications.filter(a => a.status === "Interview Scheduled").length;
  const offersApps = applications.filter(a => a.status === "Offer Received").length;
  const savedAppsCount = savedInternships.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="relative flex flex-col h-full min-h-[calc(100vh-120px)]" style={{ color: c.text }}>
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Compact Module Header */}
        <div className="flex justify-between items-center border-b pb-2.5 shrink-0" style={{ borderColor: c.border }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Internship Workspace</p>
            <h2 className="text-base font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {tab === "finder" && "Internship Finder"}
              {tab === "recommendations" && "AI Recommendations"}
              {tab === "tracker" && "Application Tracker"}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
          >
            <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex">
              <Sparkles size={12} />
            </motion.span> AI Assistant
          </motion.button>
        </div>

        {/* ==================== 3. CONTENT AREA ==================== */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {/* TAB A: INTERNSHIP FINDER */}
            {tab === "finder" && (
              <motion.div
                key="finder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex flex-col h-full"
              >
                {/* Search & Advanced Filters */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} whileHover={{ y: -2, scale: 1.005 }} className="p-4 rounded-xl border space-y-3" style={{ background: c.cardBg, borderColor: c.border }}>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }}>
                        <Search size={14} />
                      </motion.span>
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by job role, company name, tech, skills..."
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg py-2 pl-9 pr-4 text-xs"
                        style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                      />
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Location</label>
                      <select
                        value={locFilter}
                        onChange={(e) => setLocFilter(e.target.value)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                        style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                      >
                        <option value="All">All Locations</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="US">United States (US)</option>
                      </select>
                    </motion.div>

                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Work Mode</label>
                      <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                        style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                      >
                        <option value="All">All Modes</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </motion.div>

                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Duration</label>
                      <select
                        value={durationFilter}
                        onChange={(e) => setDurationFilter(e.target.value)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                        style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                      >
                        <option value="All">All Durations</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                      </select>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Listings */}
                {filteredInternships.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: c.border }}>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-gray-400" />
                    <span className="text-xs font-semibold" style={{ color: c.textMuted }}>No internships available.</span>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredInternships.map((item, i) => {
                      const isSaved = savedInternships.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                          whileHover={{ y: -4, scale: 1.01 }}
                          onClick={() => setSelectedInternship(item)}
                          className="p-5 border rounded-xl hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                          style={{ background: c.cardBg, borderColor: c.border }}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3 items-center">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                                  style={{ background: item.logoBg }}
                                >
                                  {item.company[0]}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-sm truncate" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>{item.role}</h4>
                                  <span className="text-[10px] font-bold" style={{ color: c.textSec }}>{item.company}</span>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => handleToggleSave(item.id, e)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 group-hover:bg-white/10"
                              >
                                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex">
                                  <Heart size={14} className={isSaved ? "text-red-500 fill-current" : "text-gray-400"} />
                                </motion.span>
                              </motion.button>
                            </div>

                            {/* Job Specs */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold" style={{ color: c.textSec }}>
                              <span className="flex items-center gap-1"><MapPin size={12} /> {item.location} ({item.mode})</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {item.duration}</span>
                              <span className="flex items-center gap-1"><DollarSign size={12} /> {item.stipend}</span>
                            </div>

                            <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: c.textMuted }}>{item.description}</p>
                          </div>

                          {/* Tech Tags */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {item.skills.slice(0, 3).map(s => (
                              <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10" style={{ borderColor: c.border, color: c.textSec }}>
                                {s}
                              </span>
                            ))}
                            {item.skills.length > 3 && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10" style={{ borderColor: c.border, color: c.textMuted }}>
                                +{item.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB B: AI RECOMMENDATIONS */}
            {tab === "recommendations" && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header Info */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} whileHover={{ y: -2, scale: 1.005 }} className="p-5 border rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/10 space-y-2">
                  <h3 className="text-base font-extrabold flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex">
                      <Sparkles size={16} className="text-amber-500" />
                    </motion.span> Profile Match Engine
                  </h3>
                  <p className="text-xs leading-relaxed max-w-2xl" style={{ color: c.textSec }}>
                    Our placement engine compares your current profile achievements, resume tags, and completed DSA scores against corporate hiring criteria. Focus on matching roles and review missing skills study guides.
                  </p>
                </motion.div>

                {/* Recommendations Loop */}
                <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: c.border }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-gray-400" />
                  <span className="text-xs font-semibold" style={{ color: c.textMuted }}>No internship recommendations available. Connect your profile to get started.</span>
                </div>
              </motion.div>
            )}

            {/* TAB C: KANBAN TRACKER */}
            {tab === "tracker" && (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex flex-col h-full"
              >
                {/* Tracker stats summary bar */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="p-4 rounded-xl border flex flex-wrap gap-6 justify-between items-center" style={{ background: c.cardBg, borderColor: c.border }}>
                  <div className="flex gap-6">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: c.textMuted }}>Total Tracked</span>
                      <span className="text-base font-black block" style={{ color: c.text }}>{totalApps}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500">Interviews Scheduled</span>
                      <span className="text-base font-black block text-amber-500">{interviewingApps}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500">Offers Received</span>
                      <span className="text-base font-black block text-emerald-500">{offersApps}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAddForm(true)}
                    className="py-2 px-4 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="inline-flex">
                      <PlusCircle size={14} />
                    </motion.span> Add Application
                  </motion.button>
                </motion.div>

                {/* Drag-and-drop / Arrow Kanban Grid */}
                <div className="flex-1 overflow-x-auto flex gap-4 pb-4 select-none custom-scrollbar min-h-[400px]">
                  {TRACKER_STATUSES.map((columnStatus, ci) => {
                    const colApps = applications.filter(a => a.status === columnStatus);
                    return (
                      <motion.div
                        key={columnStatus}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        custom={ci}
                        className="w-72 border rounded-xl flex flex-col shrink-0 overflow-hidden"
                        style={{ background: c.cardBg, borderColor: c.border }}
                      >
                        {/* Column Header */}
                        <div className="p-3 border-b flex justify-between items-center bg-white/[0.01]" style={{ borderColor: c.border }}>
                          <span className="text-xs font-extrabold" style={{ color: c.text }}>{columnStatus}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/5 border" style={{ borderColor: c.border, color: c.textSec }}>
                            {colApps.length}
                          </span>
                        </div>

                        {/* Column Cards */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                          {colApps.length === 0 ? (
                            <div className="text-center py-8 text-[10px] font-semibold" style={{ color: c.textMuted }}>
                              No cards in this phase.
                            </div>
                          ) : (
                            colApps.map((app, ai) => (
                              <motion.div
                                key={app.id}
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={ai}
                                whileHover={{ y: -3, scale: 1.01 }}
                                className="p-3 border rounded-lg space-y-2 bg-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                                style={{ borderColor: c.border }}
                              >
                                <div className="space-y-1">
                                  <h5 className="text-xs font-extrabold truncate" style={{ color: c.text }}>{app.role}</h5>
                                  <span className="text-[10px] font-bold" style={{ color: c.textSec }}>{app.company}</span>
                                </div>

                                {app.notes && (
                                  <p className="text-[10px] leading-relaxed italic border-t pt-1 mt-1 truncate" style={{ color: c.textMuted, borderColor: c.border }}>
                                    {app.notes}
                                  </p>
                                )}

                                <div className="flex justify-between items-center pt-2">
                                  <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleDeleteApp(app.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </motion.button>

                                  {/* Direct arrows to move card */}
                                  <div className="flex gap-1">
                                    <motion.button
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => handleMoveApp(app.id, "left")}
                                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                                      title="Move Left"
                                    >
                                      <ChevronRight size={12} className="transform rotate-180" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => handleMoveApp(app.id, "right")}
                                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                                      title="Move Right"
                                    >
                                      <ChevronRight size={12} />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ==================== 4. DETAIL MODAL DIALOG ==================== */}
      <AnimatePresence>
        {selectedInternship && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedInternship(null)}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border p-6 overflow-y-auto max-h-[85vh] space-y-4 shadow-2xl relative"
              style={{ background: isDark ? "#0d1117" : "#ffffff", borderColor: c.border }}
            >
              {/* Header */}
              <div className="flex gap-4 items-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
                  style={{ background: selectedInternship.logoBg }}
                >
                  {selectedInternship.company[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>{selectedInternship.role}</h3>
                  <span className="text-xs font-bold" style={{ color: c.textSec }}>{selectedInternship.company} · {selectedInternship.location}</span>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 border-y py-3 text-center text-xs" style={{ borderColor: c.border }}>
                <div>
                  <span className="text-[9px] uppercase tracking-wider block" style={{ color: c.textMuted }}>Work Mode</span>
                  <span className="font-bold">{selectedInternship.mode}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider block" style={{ color: c.textMuted }}>Duration</span>
                  <span className="font-bold">{selectedInternship.duration}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider block" style={{ color: c.textMuted }}>Stipend</span>
                  <span className="font-bold text-amber-500">{selectedInternship.stipend}</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.text }}>Role Description</h4>
                  <p className="text-xs leading-relaxed" style={{ color: c.textSec }}>{selectedInternship.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.text }}>Responsibilities</h4>
                  <ul className="list-disc list-inside text-xs leading-relaxed space-y-1" style={{ color: c.textSec }}>
                    {selectedInternship.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.text }}>Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedInternship.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border" style={{ borderColor: c.border, color: c.textSec }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold pt-2 border-t" style={{ borderColor: c.border }}>
                  <span style={{ color: c.textMuted }}>Deadline: {selectedInternship.deadline}</span>
                  <a href={selectedInternship.website} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">
                    Company Website
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 justify-end">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleToggleSave(selectedInternship.id)}
                  className="py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-colors"
                  style={{ borderColor: c.border }}
                >
                  {savedInternships.includes(selectedInternship.id) ? "Saved" : "Save Internship"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const alreadyApplied = applications.some(a => a.company === selectedInternship.company && a.role === selectedInternship.role);
                    if (!alreadyApplied) {
                      const newApp: Application = {
                        id: `app-${Date.now()}`,
                        company: selectedInternship.company,
                        role: selectedInternship.role,
                        stipend: selectedInternship.stipend,
                        status: "Applied",
                        dateAdded: new Date().toISOString()
                      };
                      saveAppsToStorage([newApp, ...applications]);
                    }
                    alert("🚀 Applied successfully! Card added to your Application Tracker.");
                    setSelectedInternship(null);
                  }}
                  className="py-2 px-4 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-colors"
                >
                  Apply Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 5. ADD APPLICATION FORM OVERLAY ==================== */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.form
              onSubmit={handleAddApplication}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl relative"
              style={{ background: isDark ? "#0d1117" : "#ffffff", borderColor: c.border }}
            >
              <h3 className="font-extrabold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Track New Application</h3>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Company Name</label>
                <input
                  required
                  value={newAppCompany}
                  onChange={(e) => setNewAppCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                  style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Role Title</label>
                <input
                  required
                  value={newAppRole}
                  onChange={(e) => setNewAppRole(e.target.value)}
                  placeholder="e.g. SDE Intern"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                  style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Stipend / Salary</label>
                <input
                  value={newAppStipend}
                  onChange={(e) => setNewAppStipend(e.target.value)}
                  placeholder="e.g. ₹40,000 / mo"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                  style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Current Status</label>
                <select
                  value={newAppStatus}
                  onChange={(e) => setNewAppStatus(e.target.value as any)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                  style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                >
                  {TRACKER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>Personal Notes</label>
                <textarea
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  placeholder="Interview schedule, referral details..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs resize-none h-16"
                  style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-1.5 px-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-colors"
                  style={{ borderColor: c.border }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="py-1.5 px-3 rounded bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-colors"
                >
                  Track Application
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 6. FLOATING CHAT SIDEBAR PANEL ==================== */}
      <AnimatePresence>
        {assistantOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-[70px] right-0 bottom-0 z-[190] w-80 border-l flex flex-col shadow-2xl"
            style={{ background: isDark ? "#0d1117" : "#ffffff", borderColor: c.border }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: c.text }}>AI Placement Assistant</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setAssistantOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle size={14} />
              </motion.button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, idx) => {
                const isAI = msg.role === "assistant";
                return (
                  <motion.div key={idx} initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                        isAI
                          ? "bg-white/5 border border-white/10 rounded-tl-sm"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-tr-sm"
                      }`}
                      style={{ borderColor: c.border }}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </motion.div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-sm p-3 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500 animate-spin" />
                    <span className="text-[10px] font-bold" style={{ color: c.textMuted }}>Drafting response...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="p-3 border-t bg-white/[0.01] flex flex-col gap-1.5" style={{ borderColor: c.border }}>
              <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: c.textMuted }}>Suggestions</span>
              {[
                "Recommend ML internships",
                "Show remote internships",
                "Help improve my resume"
              ].map((s, si) => (
                <motion.button
                  key={s}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={si}
                  whileHover={{ y: -2, scale: 1.005 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setChatInput(s); }}
                  className="w-full text-left p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[10px] font-semibold truncate transition-colors"
                  style={{ borderColor: c.border, color: c.textSec }}
                >
                  {s}
                </motion.button>
              ))}
            </div>

            {/* Input form */}
            <div className="p-3 border-t flex gap-1.5" style={{ borderColor: c.border }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask placement assistant..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAssistantSend();
                }}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[#f59e0b] focus:outline-none rounded-lg p-2 text-xs"
                style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
              />
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleAssistantSend}
                disabled={!chatInput.trim() || chatLoading}
                className="w-8 h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors"
              >
                <Send size={12} />
              </motion.button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}
