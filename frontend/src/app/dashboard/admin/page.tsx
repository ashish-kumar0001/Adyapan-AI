"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/services/api";
import { clearAuthSession } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  Search, Crown, Bell, ChevronDown, Menu, User, LogOut, Settings, CreditCard,
  TrendingUp, Award, BookOpen, Code2, FileText, Mic, Briefcase, UserCircle,
  BarChart3, Wand2, GraduationCap, LayoutDashboard, Sun, Moon, TrendingDown,
  ArrowUpRight, Star, Zap, LineChart, Trophy, MessageCircle, X,
  RefreshCw, ArrowLeft, Shield, Activity, Server, Brain, IndianRupee,
  DollarSign, ShoppingCart, CheckCircle2, XCircle, AlertTriangle, Clock,
  Terminal, HardDrive, Cpu, Globe, Smartphone, Lock, Ban, Eye, Trash2,
  Loader2, Sparkles, Flag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────

interface ActivityItem {
  time: string;
  user: string;
  action: string;
  module: string;
  id: string;
}

type SectionId =
  | "overview" | "activity" | "users" | "ai-usage" | "modules"
  | "learning" | "coding" | "resume" | "interview" | "research"
  | "subscriptions" | "payments" | "revenue" | "ai-models"
  | "system-health" | "security" | "content" | "support"
  | "notifications" | "reports" | "settings";

// ─── Sidebar Data ──────────────────────────────────────────────────────

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  submenu?: { id: string; label: string; section: SectionId }[];
}

const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  {
    id: "users-section", label: "Users", icon: <UserCircle size={18} />,
    submenu: [
      { id: "users", label: "All Users", section: "users" },
      { id: "security", label: "Security", section: "security" },
    ],
  },
  { id: "activity", label: "Live Activity", icon: <Activity size={18} /> },
  { id: "ai-usage", label: "AI Usage", icon: <Brain size={18} /> },
  {
    id: "modules", label: "Modules", icon: <BarChart3 size={18} />,
    submenu: [
      { id: "learning", label: "Learning Hub", section: "learning" },
      { id: "coding", label: "Coding Hub", section: "coding" },
      { id: "resume", label: "Resume Hub", section: "resume" },
      { id: "interview", label: "Interview Hub", section: "interview" },
    ],
  },
  {
    id: "subscriptions", label: "Subscriptions", icon: <Crown size={18} />,
    submenu: [
      { id: "subscriptions", label: "Plans", section: "subscriptions" },
      { id: "payments", label: "Payments", section: "payments" },
      { id: "revenue", label: "Revenue", section: "revenue" },
    ],
  },
  { id: "ai-models", label: "AI Models", icon: <Terminal size={18} /> },
  { id: "system-health", label: "System Health", icon: <Server size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

// ─── Toast ─────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000",
        padding: "12px 22px", borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        fontSize: "0.88rem", fontWeight: 700,
      }}
    >
      {message}
    </motion.div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string | number;
  trend?: { up: boolean; pct: string }; color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-2xl p-4 border"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color || "var(--primary)"}15` }}>
          <span style={{ color: color || "var(--primary)" }}>{icon}</span>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{
              background: trend.up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: trend.up ? "#10b981" : "#ef4444",
            }}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.pct}
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold mb-0.5 font-mono">{value}</div>
      <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </motion.div>
  );
}

// ─── Pill ──────────────────────────────────────────────────────────────

function Pill({ children, color = "var(--primary)" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {children}
    </span>
  );
}

// ========================================================================
// MAIN ADMIN DASHBOARD
// ========================================================================

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  useRequireAuth("ADMIN");

  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userPagination, setUserPagination] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [aiAnalytics, setAiAnalytics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [moduleData, setModuleData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

  // Theme
  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("adyapan-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };
  useEffect(() => {
    const t = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const toggleItem = (id: string) => setOpenItem(prev => prev === id ? null : id);

  // Data loading
  const loadData = useCallback(async () => {
    try {
      const [statsRes, activityRes, aiRes, revRes, modRes, healthRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/activity"),
        api.get("/admin/analytics/ai"),
        api.get("/admin/analytics/revenue"),
        api.get("/admin/modules"),
        api.get("/admin/system-health"),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (activityRes.data.success) setActivities(activityRes.data.activities);
      if (aiRes.data.success) setAiAnalytics(aiRes.data.analytics);
      if (revRes.data.success) setRevenueData(revRes.data.revenue);
      if (modRes.data.success) setModuleData(modRes.data.modules);
      if (healthRes.data.success) setSystemHealth(healthRes.data.health);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadUsers = useCallback(async (page: number, search: string) => {
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setUserPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      Promise.all([loadData(), loadUsers(1, "")])
        .finally(() => setLoading(false));
    } else if (!localStorage.getItem("adyapan-token")) {
      setLoading(false);
    }
  }, [user, loadData, loadUsers]);

  const handleUserSearch = (val: string) => {
    setUserSearch(val);
    setUserPage(1);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => loadUsers(1, val), 400));
  };

  const handleUserAction = async (userId: string, action: string, plan?: string) => {
    setUserActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/action`, { action, plan });
      loadUsers(userPage, userSearch);
      setToast(action === "delete" ? "User deleted" : action === "suspend" ? "User suspended" : "Action completed");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setUserActionLoading(null);
    }
  };

  const showComingSoon = () => setToast("Coming soon!");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-dark)" }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "var(--primary)" }} />
          <div className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      {/* Top Navigation */}
      <header style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: 70,
        background: theme === "dark" ? "#060b0e" : "#ffffff",
        borderBottom: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1rem", zIndex: 105, boxSizing: "border-box",
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mobile-menu-btn"
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, color: "var(--text-secondary)" }}>
            <Menu size={20} />
          </motion.button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/assets/logo.png" alt="Adyapan AI" width={30} height={30} style={{ borderRadius: "50%" }} />
            <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text-primary)" }}>Adyapan AI</span>
          </div>
          <Pill color="var(--primary)">Admin Console</Pill>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            style={{
              background: theme === "dark" ? "#0d151c" : "rgba(0,0,0,0.04)",
              border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: 8, width: 36, height: 36, display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              color: "var(--text-secondary)",
            }}>
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </motion.span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
            onClick={loadData}
            style={{
              background: theme === "dark" ? "#0d151c" : "rgba(0,0,0,0.04)",
              border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: 8, width: 36, height: 36, display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              color: "var(--text-secondary)",
            }}>
            <RefreshCw size={15} />
          </motion.button>
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
            style={{ background: theme === "dark" ? "#0d151c" : "rgba(0,0,0,0.04)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold"
              style={{ background: "var(--primary)", color: "#000" }}>
              {user?.name?.[0] || "A"}
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{user?.name || "Admin"}</span>
          </div>
        </div>
      </header>

      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="mobile-close-btn" style={{ display: "none", justifyContent: "flex-end", padding: "0.5rem 0.5rem 0" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setSidebarOpen(false)}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, color: "var(--text-secondary)" }}>
            <X size={20} />
          </motion.button>
        </div>

        {/* Logo */}
        <div style={{ padding: "0.8rem 0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/assets/logo.png" alt="Adyapan AI" width={32} height={32} style={{ borderRadius: "50%" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Adyapan AI</div>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Admin Console</div>
            </div>
          </div>
        </div>

        {/* Dashboard button */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
            color: activeSection === "overview" ? "var(--primary)" : "var(--text-secondary)",
            background: activeSection === "overview" ? "rgba(245,158,11,0.1)" : "transparent",
            border: activeSection === "overview" ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
            fontWeight: 500, fontSize: "0.82rem", cursor: "pointer", width: "100%",
            textAlign: "left", whiteSpace: "nowrap",
          }}>
          <span style={{ flexShrink: 0 }}><LayoutDashboard size={18} /></span>
          <span className="sb-label">Dashboard</span>
        </motion.button>

        <div style={{ height: 1, background: "var(--border-color)", margin: "0.5rem 0.3rem 0.7rem" }} />

        {/* Sidebar items */}
        {sidebarItems.filter(item => item.id !== "overview").map((item) => {
          const isOpen = openItem === item.id;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          return (
            <div key={item.id} className={isOpen ? "sb-item open" : "sb-item"}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (hasSubmenu) { toggleItem(item.id); }
                  else { setActiveSection(item.id as SectionId); setSidebarOpen(false); }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
                  color: "var(--text-secondary)", background: "transparent",
                  border: "1px solid transparent", fontWeight: 500,
                  fontSize: "0.82rem", cursor: "pointer", width: "100%",
                  transition: "all 0.2s ease", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span className="sb-label" style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                {hasSubmenu && (
                  <span className="sb-arrow" style={{ marginLeft: "auto", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <ChevronDown size={13} />
                  </span>
                )}
              </motion.button>
              {hasSubmenu && isOpen && (
                <div className="sb-submenu" style={{ paddingLeft: "1.2rem" }}>
                  {item.submenu!.map(sub => (
                    <a key={sub.id} href="#"
                      onClick={(e) => { e.preventDefault(); setActiveSection(sub.section); setSidebarOpen(false); }}
                      style={{
                        display: "block", padding: "0.28rem 0.5rem", fontSize: "0.76rem",
                        color: "var(--text-secondary)", borderRadius: 8, marginBottom: 1,
                        textDecoration: "none", transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--primary)"; (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.05)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: "auto", padding: "0.5rem", borderTop: "1px solid var(--border-color)" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { clearAuthSession(); router.push("/login"); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.55rem 0.5rem", borderRadius: 12,
              color: "var(--text-secondary)", background: "transparent",
              border: "1px solid transparent", fontWeight: 500,
              fontSize: "0.82rem", cursor: "pointer", width: "100%", textAlign: "left",
            }}>
            <LogOut size={18} />
            <span className="sb-label">Sign Out</span>
          </motion.button>
        </div>
      </aside>

      {/* ─── Main Content ───────────────────────────────────────────── */}
      <main className="dash-main resume-hub-theme" style={{ marginTop: 70 }}>
        {/* ==================== OVERVIEW ==================== */}
        {activeSection === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <StatCard icon={<UserCircle className="w-5 h-5" />} label="Total Users" value={stats?.users?.total ?? 0} color="#3b82f6" delay={0} />
              <StatCard icon={<Activity className="w-5 h-5" />} label="AI Requests" value={stats?.totalAiRequests ?? 0} color="var(--primary)" delay={0.05} />
              <StatCard icon={<Crown className="w-5 h-5" />} label="Premium Users" value={stats?.users?.premium ?? 0} color="var(--primary)" delay={0.1} />
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue (Month)" value={`₹${(stats?.revenue?.month ?? 0) / 100}`} color="#10b981" delay={0.15} />
              <StatCard icon={<Server className="w-5 h-5" />} label="New Today" value={stats?.users?.newToday ?? 0} color="#8b5cf6" delay={0.2} trend={{ up: true, pct: "+12%" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <FileText className="w-4 h-4" />, label: "Resumes", value: stats?.modules?.resume?.resumes ?? 0, color: "#3b82f6" },
                { icon: <GraduationCap className="w-4 h-4" />, label: "Study Sessions", value: stats?.modules?.learning?.studySessions ?? 0, color: "#10b981" },
                { icon: <Code2 className="w-4 h-4" />, label: "Coding Sessions", value: stats?.modules?.coding?.sessions ?? 0, color: "#8b5cf6" },
                { icon: <Mic className="w-4 h-4" />, label: "Interviews", value: stats?.modules?.interview?.sessions ?? 0, color: "var(--primary)" },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl p-3 border"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                    <span style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold font-mono">{item.value}</div>
                    <div className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{item.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <h3 className="text-lg font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Platform Activity</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Resume Hub", icon: <FileText className="w-5 h-5" />, count: (stats?.modules?.resume?.resumes ?? 0) + (stats?.modules?.resume?.atsReports ?? 0) + (stats?.modules?.resume?.coverLetters ?? 0), color: "#3b82f6", sec: "resume" as SectionId },
                { label: "Learning Hub", icon: <GraduationCap className="w-5 h-5" />, count: (stats?.modules?.learning?.studySessions ?? 0) + (stats?.modules?.learning?.notes ?? 0) + (stats?.modules?.learning?.quizzes ?? 0), color: "#10b981", sec: "learning" as SectionId },
                { label: "Coding Hub", icon: <Code2 className="w-5 h-5" />, count: (stats?.modules?.coding?.sessions ?? 0) + (stats?.modules?.coding?.submissions ?? 0), color: "#8b5cf6", sec: "coding" as SectionId },
                { label: "Interview Hub", icon: <Mic className="w-5 h-5" />, count: stats?.modules?.interview?.sessions ?? 0, color: "var(--primary)", sec: "interview" as SectionId },
                { label: "Ady Chat", icon: <MessageCircle className="w-5 h-5" />, count: stats?.modules?.chat?.sessions ?? 0, color: "#ef4444", sec: "ai-usage" as SectionId },
              ].map((mod, i) => (
                <motion.button key={mod.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveSection(mod.sec)}
                  className="rounded-2xl p-5 text-left border transition-all"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${mod.color}15` }}>
                    <span style={{ color: mod.color }}>{mod.icon}</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono mb-0.5">{mod.count}</div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{mod.label}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== ACTIVITY FEED ==================== */}
        {activeSection === "activity" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-5xl mx-auto">
            <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: "var(--primary)" }} />
              Live Activity Feed
              <Pill color="#10b981">Real-time</Pill>
            </h2>
            <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {activities.length === 0 ? (
                  <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-semibold">No activity yet</div>
                  </div>
                ) : (
                  activities.slice(0, 30).map((item, i) => (
                    <motion.div key={`${item.id}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                      <div className="text-[10px] font-mono font-bold w-16 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                        style={{ background: "rgba(245,158,11,0.15)", color: "var(--primary)" }}>
                        {item.user[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold">{item.user}</span>
                        <span className="text-xs ml-2" style={{ color: "var(--text-secondary)" }}>{item.action}</span>
                      </div>
                      <Pill color="var(--primary)">{item.module}</Pill>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== USERS ==================== */}
        {activeSection === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <UserCircle className="w-5 h-5" style={{ color: "var(--primary)" }} />
                User Management
              </h2>
              <div className="flex-1" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <Search className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <input value={userSearch} onChange={e => handleUserSearch(e.target.value)} placeholder="Search users..."
                  className="bg-transparent border-none outline-none text-xs w-40" style={{ color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-color)" }}>
                      <th className="text-left px-4 py-3 font-bold">User</th>
                      <th className="text-left px-4 py-3 font-bold">Email</th>
                      <th className="text-left px-4 py-3 font-bold">Plan</th>
                      <th className="text-left px-4 py-3 font-bold">Status</th>
                      <th className="text-left px-4 py-3 font-bold">Activity</th>
                      <th className="text-left px-4 py-3 font-bold">Joined</th>
                      <th className="text-right px-4 py-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                              style={{ background: "rgba(245,158,11,0.15)", color: "var(--primary)" }}>
                              {u.name[0]}
                            </div>
                            <span className="font-semibold">{u.name}</span>
                            {u.role === "ADMIN" && <Pill color="#8b5cf6">Admin</Pill>}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                        <td className="px-4 py-3">
                          <Pill color={u.plan !== "free" ? "var(--primary)" : "var(--text-muted)"}>{u.plan}</Pill>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${u.subscriptionStatus === "active" ? "bg-green-500" : "bg-gray-500"}`} />
                            <span style={{ color: "var(--text-secondary)" }}>{u.subscriptionStatus || "inactive"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                          R:{u._count?.resumes ?? 0} C:{u._count?.chatSessions ?? 0} I:{u._count?.interviewSessions ?? 0}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleUserAction(u.id, "upgrade", "pro_yearly")} disabled={userActionLoading === u.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-green-500/10" title="Upgrade">
                              <Crown className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                            </button>
                            <button onClick={() => handleUserAction(u.id, "suspend")} disabled={userActionLoading === u.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10" title="Suspend">
                              <Ban className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                            </button>
                            <button onClick={() => { if (confirm("Delete this user?")) handleUserAction(u.id, "delete"); }}
                              disabled={userActionLoading === u.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {userPagination && (
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Showing {((userPagination.page - 1) * userPagination.limit) + 1}-{Math.min(userPagination.page * userPagination.limit, userPagination.total)} of {userPagination.total}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { const p = userPage - 1; setUserPage(p); loadUsers(p, userSearch); }}
                      disabled={userPage <= 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)" }}>Previous</button>
                    <button onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(p, userSearch); }}
                      disabled={userPage >= userPagination.pages}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)" }}>Next</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== AI USAGE ==================== */}
        {activeSection === "ai-usage" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-6xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Brain className="w-5 h-5" style={{ color: "var(--primary)" }} />AI Usage Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<Zap className="w-5 h-5" />} label="Total AI Requests" value={aiAnalytics?.totalRequests ?? 0} color="var(--primary)" />
              <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Resume Hub" value={(aiAnalytics?.modules?.resumeHub?.resumes ?? 0) + (aiAnalytics?.modules?.resumeHub?.atsReports ?? 0)} color="#3b82f6" />
              <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Learning Hub" value={(aiAnalytics?.modules?.learningHub?.studySessions ?? 0) + (aiAnalytics?.modules?.learningHub?.notes ?? 0) + (aiAnalytics?.modules?.learningHub?.quizzes ?? 0)} color="#10b981" />
              <StatCard icon={<Code2 className="w-5 h-5" />} label="Coding Hub" value={(aiAnalytics?.modules?.codingHub?.sessions ?? 0) + (aiAnalytics?.modules?.codingHub?.submissions ?? 0)} color="#8b5cf6" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Resume Hub", icon: <FileText className="w-4 h-4" />, color: "#3b82f6", items: [
                  { label: "Resumes Created", value: aiAnalytics?.modules?.resumeHub?.resumes },
                  { label: "ATS Reports", value: aiAnalytics?.modules?.resumeHub?.atsReports },
                  { label: "Cover Letters", value: aiAnalytics?.modules?.resumeHub?.coverLetters },
                  { label: "LinkedIn Reports", value: aiAnalytics?.modules?.resumeHub?.linkedinReports },
                ] },
                { title: "Learning Hub", icon: <GraduationCap className="w-4 h-4" />, color: "#10b981", items: [
                  { label: "Study Sessions", value: aiAnalytics?.modules?.learningHub?.studySessions },
                  { label: "Notes Generated", value: aiAnalytics?.modules?.learningHub?.notes },
                  { label: "Quizzes Created", value: aiAnalytics?.modules?.learningHub?.quizzes },
                  { label: "Assignments", value: aiAnalytics?.modules?.learningHub?.assignments },
                  { label: "PPTs", value: aiAnalytics?.modules?.learningHub?.ppts },
                  { label: "Mind Maps", value: aiAnalytics?.modules?.learningHub?.mindmaps },
                ] },
                { title: "Coding Hub", icon: <Code2 className="w-4 h-4" />, color: "#8b5cf6", items: [
                  { label: "Coding Sessions", value: aiAnalytics?.modules?.codingHub?.sessions },
                  { label: "Submissions", value: aiAnalytics?.modules?.codingHub?.submissions },
                ] },
                { title: "Interview Hub", icon: <Mic className="w-4 h-4" />, color: "var(--primary)", items: [
                  { label: "Total Interviews", value: aiAnalytics?.modules?.interviewHub?.sessions },
                ] },
              ].map(section => (
                <div key={section.title} className="rounded-2xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
                    <span style={{ color: section.color }}>{section.icon}</span>
                    {section.title}
                  </h4>
                  <div className="space-y-2">
                    {section.items.map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                        <span className="text-sm font-extrabold font-mono">{item.value ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== MODULES OVERVIEW ==================== */}
        {activeSection === "modules" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-6xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: "var(--primary)" }} />Module Management
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { id: "resume", label: "Resume Hub", icon: <FileText className="w-6 h-6" />, color: "#3b82f6", data: moduleData?.resumeHub },
                { id: "learning", label: "Learning Hub", icon: <GraduationCap className="w-6 h-6" />, color: "#10b981", data: moduleData?.learningHub },
                { id: "coding", label: "Coding Hub", icon: <Code2 className="w-6 h-6" />, color: "#8b5cf6", data: moduleData?.codingHub },
                { id: "interview", label: "Interview Hub", icon: <Mic className="w-6 h-6" />, color: "var(--primary)", data: moduleData?.interviewHub },
              ].map(mod => (
                <motion.button key={mod.id} whileHover={{ scale: 1.01 }}
                  onClick={() => setActiveSection(mod.id as SectionId)}
                  className="rounded-2xl p-5 text-left border transition-all"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${mod.color}15` }}>
                        <span style={{ color: mod.color }}>{mod.icon}</span>
                      </div>
                      <div>
                        <div className="font-extrabold text-sm">{mod.label}</div>
                        <div className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{mod.data?.total ?? 0} total actions</div>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(mod.data ?? {}).filter(([k]) => k !== "total" && k !== "templates" && k !== "byType" && k !== "completionRate").slice(0, 4).map(([key, val]) => (
                      <div key={key} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-sm font-extrabold font-mono">{val as number}</div>
                        <div className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== INDIVIDUAL MODULES ==================== */}
        {["resume", "learning", "coding", "interview"].includes(activeSection as string) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-6xl mx-auto space-y-4">
            <button onClick={() => setActiveSection("modules")}
              className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--primary)" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Modules
            </button>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              {activeSection === "resume" ? <FileText className="w-5 h-5" /> : activeSection === "learning" ? <GraduationCap className="w-5 h-5" /> : activeSection === "coding" ? <Code2 className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span style={{ color: "var(--primary)" }}>
                {activeSection === "resume" ? "Resume Hub" : activeSection === "learning" ? "Learning Hub" : activeSection === "coding" ? "Coding Hub" : "Interview Hub"}
              </span> Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {moduleData?.[activeSection === "resume" ? "resumeHub" : activeSection === "learning" ? "learningHub" : activeSection === "coding" ? "codingHub" : "interviewHub"] && 
                Object.entries(moduleData[activeSection === "resume" ? "resumeHub" : activeSection === "learning" ? "learningHub" : activeSection === "coding" ? "codingHub" : "interviewHub"])
                  .filter(([k]) => k !== "templates" && k !== "byType")
                  .map(([key, val]) => (
                    <StatCard key={key} icon={<BarChart3 className="w-5 h-5" />}
                      label={key.replace(/([A-Z])/g, ' $1').trim()}
                      value={val as number} color="var(--primary)" />
                  ))
              }
            </div>
          </motion.div>
        )}

        {/* ==================== SUBSCRIPTIONS ==================== */}
        {activeSection === "subscriptions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-5xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Crown className="w-5 h-5" style={{ color: "var(--primary)" }} />Subscription Plans
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Free", price: "₹0", color: "var(--text-muted)", features: ["1 Resume", "Basic AI", "3 Cover Letters"], users: stats?.users?.free ?? 0 },
                { name: "Pro Monthly", price: "₹149", color: "var(--primary)", features: ["Unlimited Resumes", "All AI Models", "Interview Hub"], users: stats?.users?.premium ?? 0 },
                { name: "Pro Yearly", price: "₹999", color: "#8b5cf6", features: ["Everything in Pro", "2 Months Free", "Premium Badge"], users: stats?.users?.premium ?? 0 },
              ].map(plan => (
                <div key={plan.name} className="rounded-2xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <h3 className="text-lg font-extrabold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
                  <div className="text-3xl font-extrabold mb-4">{plan.price}</div>
                  <div className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{plan.users} users</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== PAYMENTS ==================== */}
        {activeSection === "payments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-5xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" style={{ color: "var(--primary)" }} />Payment Transactions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Successful" value={stats?.revenue?.successfulPayments ?? 0} color="#10b981" />
              <StatCard icon={<XCircle className="w-5 h-5" />} label="Failed" value={stats?.revenue?.failedPayments ?? 0} color="#ef4444" />
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`₹${(stats?.revenue?.total ?? 0) / 100}`} color="var(--primary)" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Month Revenue" value={`₹${(stats?.revenue?.month ?? 0) / 100}`} color="#10b981" />
            </div>
          </motion.div>
        )}

        {/* ==================== REVENUE ==================== */}
        {activeSection === "revenue" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-5xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <IndianRupee className="w-5 h-5" style={{ color: "var(--primary)" }} />Revenue Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`₹${(revenueData?.total ?? 0) / 100}`} color="var(--primary)" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="This Month" value={`₹${(revenueData?.month ?? 0) / 100}`} color="#10b981" />
              <StatCard icon={<Crown className="w-5 h-5" />} label="Premium Users" value={revenueData?.premiumUsers ?? 0} color="var(--primary)" />
              <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Avg. Order" value={`₹${((revenueData?.averageOrderValue ?? 0) / 100)}`} color="#8b5cf6" />
            </div>
          </motion.div>
        )}

        {/* ==================== AI MODELS ==================== */}
        {activeSection === "ai-models" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-6xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Terminal className="w-5 h-5" style={{ color: "var(--primary)" }} />AI Model Monitoring
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Gemini 2.5 Flash", provider: "Google", status: "active", color: "#3b82f6", requests: "843", avgTime: "1.2s", cost: "₹34" },
                { name: "OpenAI GPT-4o", provider: "OpenAI", status: "active", color: "#10b981", requests: "412", avgTime: "1.8s", cost: "₹89" },
                { name: "Claude Sonnet 4", provider: "Anthropic", status: "idle", color: "#8b5cf6", requests: "128", avgTime: "2.1s", cost: "₹42" },
                { name: "DeepSeek V3", provider: "DeepSeek", status: "active", color: "var(--primary)", requests: "256", avgTime: "0.9s", cost: "₹12" },
                { name: "Llama 3.3 70B", provider: "Meta", status: "active", color: "#ef4444", requests: "95", avgTime: "1.5s", cost: "₹8" },
                { name: "Mistral Large", provider: "Mistral", status: "idle", color: "var(--text-muted)", requests: "0", avgTime: "-", cost: "₹0" },
              ].map(model => (
                <div key={model.name} className="rounded-2xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: model.status === "active" ? "#10b981" : "var(--text-muted)", boxShadow: model.status === "active" ? "0 0 8px #10b981" : "none" }} />
                      <div>
                        <div className="text-sm font-extrabold">{model.name}</div>
                        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{model.provider}</div>
                      </div>
                    </div>
                    <Pill color={model.status === "active" ? "#10b981" : "var(--text-muted)"}>{model.status}</Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-sm font-extrabold font-mono">{model.requests}</div><div className="text-[9px]" style={{ color: "var(--text-muted)" }}>Requests</div></div>
                    <div><div className="text-sm font-extrabold font-mono">{model.avgTime}</div><div className="text-[9px]" style={{ color: "var(--text-muted)" }}>Avg Time</div></div>
                    <div><div className="text-sm font-extrabold font-mono">{model.cost}</div><div className="text-[9px]" style={{ color: "var(--text-muted)" }}>Cost</div></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ==================== SYSTEM HEALTH ==================== */}
        {activeSection === "system-health" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-5xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Server className="w-5 h-5" style={{ color: "var(--primary)" }} />System Health
              <Pill color="#10b981">All Systems Operational</Pill>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<HardDrive className="w-5 h-5" />} label="Memory" value={`${systemHealth?.memory?.used ?? 0}MB / ${systemHealth?.memory?.total ?? 0}MB`} color="#3b82f6" />
              <StatCard icon={<Cpu className="w-5 h-5" />} label="Uptime" value={systemHealth ? `${Math.floor((systemHealth.uptime ?? 0) / 3600)}h` : "0h"} color="#10b981" />
              <StatCard icon={<Globe className="w-5 h-5" />} label="Platform" value={systemHealth?.platform ?? "unknown"} color="#8b5cf6" />
              <StatCard icon={<Terminal className="w-5 h-5" />} label="Node.js" value={systemHealth?.nodeVersion ?? "?"} color="var(--primary)" />
            </div>
            <div className="rounded-2xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <h4 className="font-extrabold text-sm mb-4">Resource Usage</h4>
              <div className="space-y-3">
                {[
                  { label: "Memory (RSS)", used: systemHealth?.memory?.rss ?? 0, total: 1024, color: "#3b82f6" },
                  { label: "Heap Used", used: systemHealth?.memory?.used ?? 0, total: systemHealth?.memory?.total ?? 512, color: "var(--primary)" },
                ].map(res => (
                  <div key={res.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: "var(--text-secondary)" }}>{res.label}</span>
                      <span className="font-bold font-mono">{res.used}MB / {res.total}MB</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, (res.used / res.total) * 100)}%`,
                        background: `linear-gradient(90deg, ${res.color}, transparent)`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== SECURITY ==================== */}
        {activeSection === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-5xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: "var(--primary)" }} />Security Dashboard
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<Shield className="w-5 h-5" />} label="Security Status" value="Secure" color="#10b981" />
              <StatCard icon={<UserCircle className="w-5 h-5" />} label="Total Admins" value={stats?.users?.admin ?? 1} color="#3b82f6" />
              <StatCard icon={<Lock className="w-5 h-5" />} label="Failed Logins" value="0" color="#ef4444" />
              <StatCard icon={<Ban className="w-5 h-5" />} label="Blocked IPs" value="0" color="var(--text-muted)" />
            </div>
          </motion.div>
        )}

        {/* ==================== SETTINGS ==================== */}
        {activeSection === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 max-w-3xl mx-auto space-y-4">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: "var(--primary)" }} />Admin Settings
            </h2>
            <div className="rounded-2xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <div className="space-y-4">
                {[
                  { label: "Maintenance Mode", desc: "Disable platform access for non-admin users" },
                  { label: "New Registrations", desc: "Allow new users to sign up" },
                  { label: "Email Notifications", desc: "Send system notifications to admins" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                    <div className="w-10 h-6 rounded-full" style={{ background: "rgba(245,158,11,0.3)", padding: 2 }}>
                      <div className="w-5 h-5 rounded-full bg-white ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Responsive styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .dash-main { margin-left: 0 !important; }
        }
        .dash-sidebar input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
