"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { clearAuthSession } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Crown, IndianRupee, Brain, Briefcase,
  Flag, Shield, Activity, Server, BarChart3, FileText, Code2,
  GraduationCap, Mic2, BookOpen, Bell, Search, Settings, LogOut,
  ChevronDown, ChevronRight, Menu, X, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Clock, TrendingUp, TrendingDown, User,
  DollarSign, Zap, Sparkles, ArrowUpRight, Eye, Ban, Trash2, Key,
  Download, ShoppingCart, MessageCircle, Wifi, Terminal, Lock,
  Sun, Moon, Loader2, HardDrive, Cpu, Globe, Smartphone,
  ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────

type SectionId =
  | "overview" | "activity" | "users" | "ai-usage" | "modules"
  | "learning" | "coding" | "resume" | "interview" | "research"
  | "subscriptions" | "payments" | "revenue" | "ai-models"
  | "system-health" | "security" | "content" | "support"
  | "notifications" | "reports" | "settings";

interface ActivityItem {
  time: string;
  user: string;
  action: string;
  module: string;
  id: string;
}

// ─── Theme Hook ────────────────────────────────────────────────────

function useAdminTheme() {
  const [theme, setTheme] = useState("dark");
  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("adyapan-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);
  useEffect(() => {
    const t = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);
  return { theme, toggle };
}

const C = (theme: string) => ({
  bg: theme === "dark" ? "#070b12" : "#f1f5f9",
  sidebar: theme === "dark" ? "#0c1322" : "#ffffff",
  card: theme === "dark" ? "rgba(255,255,255,0.03)" : "#ffffff",
  cardHover: theme === "dark" ? "rgba(255,255,255,0.06)" : "#f8fafc",
  border: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
  text: theme === "dark" ? "#ffffff" : "#0f172a",
  textSec: theme === "dark" ? "rgba(255,255,255,0.6)" : "#475569",
  textMuted: theme === "dark" ? "rgba(255,255,255,0.3)" : "#94a3b8",
  primary: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  navBg: theme === "dark" ? "#0c1322" : "#ffffff",
});

// ─── Stat Card ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, trend, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string | number;
  trend?: { up: boolean; pct: string }; color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color || "#f59e0b"}15` }}>
          <span style={{ color: color || "#f59e0b" }}>{icon}</span>
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
      <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
    </motion.div>
  );
}

// ─── Mini Card ─────────────────────────────────────────────────────

function MiniCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color || "#f59e0b"}15` }}>
        <span className="w-4 h-4" style={{ color: color || "#f59e0b" }}>{icon}</span>
      </div>
      <div>
        <div className="text-sm font-extrabold font-mono">{value}</div>
        <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Pill Badge ───────────────────────────────────────────────────

function Pill({ children, color = "#f59e0b" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {children}
    </span>
  );
}

// ====================================================================
// MAIN ADMIN DASHBOARD PAGE
// ====================================================================

export default function AdminDashboard() {
  const { theme, toggle: toggleTheme } = useAdminTheme();
  const c = C(theme);
  const router = useRouter();

  // Auth
  useRequireAuth("ADMIN");
  const { user } = useAuth();

  // Sidebar
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

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

  // Loading
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<any>(null);

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

  // Initial load
  useEffect(() => {
    if (user) {
      Promise.all([loadData(), loadUsers(1, "")])
        .finally(() => setLoading(false));
    } else if (!localStorage.getItem("adyapan-token")) {
      setLoading(false);
    }
  }, [user, loadData, loadUsers]);

  // User search with debounce
  const handleUserSearch = (val: string) => {
    setUserSearch(val);
    setUserPage(1);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => loadUsers(1, val), 400));
  };

  // User actions
  const handleUserAction = async (userId: string, action: string, plan?: string) => {
    setUserActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/action`, { action, plan });
      loadUsers(userPage, userSearch);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setUserActionLoading(null);
    }
  };

  // Toggle sidebar menu
  const toggleMenu = (id: string) => setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));

  // ─── Sidebar Navigation ───────────────────────────────────────────

  const sidebarItems: { id: SectionId; label: string; icon: React.ReactNode; children?: { id: SectionId; label: string }[] }[] = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "activity", label: "Live Activity", icon: <Activity className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" />,
      children: [
        { id: "users", label: "All Users" },
        { id: "security", label: "Security" },
      ] },
    { id: "ai-usage", label: "AI Usage", icon: <Brain className="w-4 h-4" /> },
    { id: "modules", label: "Modules", icon: <BarChart3 className="w-4 h-4" />,
      children: [
        { id: "learning", label: "Learning Hub" },
        { id: "coding", label: "Coding Hub" },
        { id: "resume", label: "Resume Hub" },
        { id: "interview", label: "Interview Hub" },
      ] },
    { id: "subscriptions", label: "Subscriptions", icon: <Crown className="w-4 h-4" />,
      children: [
        { id: "subscriptions", label: "Plans" },
        { id: "payments", label: "Payments" },
        { id: "revenue", label: "Revenue" },
      ] },
    { id: "ai-models", label: "AI Models", icon: <Terminal className="w-4 h-4" /> },
    { id: "system-health", label: "System Health", icon: <Server className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  // ─── Loading State ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: c.bg }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: c.primary }} />
          <div className="text-sm font-bold" style={{ color: c.textSec }}>Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDER
  // =================================================================

  return (
    <div className="min-h-screen flex" style={{ background: c.bg, color: c.text }}>
      {/* ─── Sidebar ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-screen sticky top-0 flex-shrink-0 overflow-hidden flex flex-col border-r z-30"
            style={{ background: c.sidebar, borderColor: c.border }}
          >
            <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: c.border }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000" }}>
                A
              </div>
              <div>
                <div className="text-sm font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Adyapan AI</div>
                <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.primary }}>Admin Console</div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {sidebarItems.map(item => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.id];
                const isActive = activeSection === item.id || item.children?.some(ch => ch.id === activeSection);

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleMenu(item.id);
                        }
                        setActiveSection(item.id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: isActive ? `${c.primary}12` : "transparent",
                        color: isActive ? c.primary : c.textSec,
                        border: isActive ? `1px solid ${c.primary}20` : "1px solid transparent",
                      }}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {hasChildren && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      )}
                    </button>
                    {hasChildren && isExpanded && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {item.children!.map(child => (
                          <button
                            key={child.id}
                            onClick={() => setActiveSection(child.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                            style={{
                              background: activeSection === child.id ? `${c.primary}10` : "transparent",
                              color: activeSection === child.id ? c.primary : c.textMuted,
                            }}
                          >
                            <ChevronRight className="w-2.5 h-2.5" />
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="p-3 border-t" style={{ borderColor: c.border }}>
              <button
                onClick={() => { clearAuthSession(); router.push("/login"); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ color: c.textMuted }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── Main Content ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 border-b" style={{ background: c.navBg, borderColor: c.border, backdropFilter: "blur(12px)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `${c.green}12`, color: c.green, border: `1px solid ${c.green}20` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            All Systems Online
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={loadData} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold" style={{ background: c.primary, color: "#000" }}>
                {user?.name?.[0] || "A"}
              </div>
              <div className="text-xs font-semibold">{user?.name || "Admin"}</div>
            </div>
          </div>
        </header>

        {/* ─── Content Area ──────────────────────────────────────────── */}
        <div className="p-5 space-y-6 max-w-7xl mx-auto">

          {/* ==================== OVERVIEW ==================== */}
          {activeSection === "overview" && (
            <Section id="overview">
              {/* Hero KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={stats?.users?.total ?? 0} color={c.blue} delay={0} />
                <StatCard icon={<Activity className="w-5 h-5" />} label="AI Requests" value={stats?.totalAiRequests ?? 0} color={c.primary} delay={0.05} />
                <StatCard icon={<Crown className="w-5 h-5" />} label="Premium Users" value={stats?.users?.premium ?? 0} color={c.primary} delay={0.1} />
                <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue (Month)" value={`₹${(stats?.revenue?.month ?? 0) / 100}`} color={c.green} delay={0.15} />
                <StatCard icon={<Server className="w-5 h-5" />} label="New Today" value={stats?.users?.newToday ?? 0} color={c.purple} delay={0.2} trend={{ up: true, pct: "+12%" }} />
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <MiniCard icon={<FileText className="w-4 h-4" />} label="Resumes" value={stats?.modules?.resume?.resumes ?? 0} color={c.blue} />
                <MiniCard icon={<GraduationCap className="w-4 h-4" />} label="Study Sessions" value={stats?.modules?.learning?.studySessions ?? 0} color={c.green} />
                <MiniCard icon={<Code2 className="w-4 h-4" />} label="Coding Sessions" value={stats?.modules?.coding?.sessions ?? 0} color={c.purple} />
                <MiniCard icon={<Mic2 className="w-4 h-4" />} label="Interviews" value={stats?.modules?.interview?.sessions ?? 0} color={c.primary} />
              </div>

              {/* Module Activity Grid */}
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <BarChart3 className="w-5 h-5" style={{ color: c.primary }} />
                Platform Activity
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Resume Hub", icon: <FileText className="w-5 h-5" />, count: (stats?.modules?.resume?.resumes ?? 0) + (stats?.modules?.resume?.atsReports ?? 0) + (stats?.modules?.resume?.coverLetters ?? 0), color: c.blue },
                  { label: "Learning Hub", icon: <GraduationCap className="w-5 h-5" />, count: (stats?.modules?.learning?.studySessions ?? 0) + (stats?.modules?.learning?.notes ?? 0) + (stats?.modules?.learning?.quizzes ?? 0), color: c.green },
                  { label: "Coding Hub", icon: <Code2 className="w-5 h-5" />, count: (stats?.modules?.coding?.sessions ?? 0) + (stats?.modules?.coding?.submissions ?? 0), color: c.purple },
                  { label: "Interview Hub", icon: <Mic2 className="w-5 h-5" />, count: stats?.modules?.interview?.sessions ?? 0, color: c.primary },
                  { label: "Ady Chat", icon: <MessageCircle className="w-5 h-5" />, count: stats?.modules?.chat?.sessions ?? 0, color: c.red },
                ].map((mod, i) => (
                  <motion.button
                    key={mod.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    onClick={() => {
                      const map: Record<string, SectionId> = { "Resume Hub": "resume", "Learning Hub": "learning", "Coding Hub": "coding", "Interview Hub": "interview", "Ady Chat": "ai-usage" };
                      setActiveSection(map[mod.label] || "modules");
                    }}
                    className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                    style={{ background: c.card, border: `1px solid ${c.border}` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${mod.color}15` }}>
                      <span style={{ color: mod.color }}>{mod.icon}</span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono mb-0.5">{mod.count}</div>
                    <div className="text-xs font-medium" style={{ color: c.textSec }}>{mod.label}</div>
                  </motion.button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "View Users", icon: <Users className="w-4 h-4" />, section: "users" as SectionId },
                  { label: "AI Analytics", icon: <Brain className="w-4 h-4" />, section: "ai-usage" as SectionId },
                  { label: "Revenue", icon: <IndianRupee className="w-4 h-4" />, section: "revenue" as SectionId },
                  { label: "System Health", icon: <Server className="w-4 h-4" />, section: "system-health" as SectionId },
                ].map(action => (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(action.section)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all"
                    style={{ background: c.card, border: `1px solid ${c.border}`, color: c.textSec }}
                  >
                    <span style={{ color: c.primary }}>{action.icon}</span>
                    {action.label}
                    <ArrowUpRight className="w-3 h-3 ml-auto" style={{ color: c.textMuted }} />
                  </motion.button>
                ))}
              </div>
            </Section>
          )}

          {/* ==================== ACTIVITY FEED ==================== */}
          {activeSection === "activity" && (
            <Section id="activity">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Activity className="w-5 h-5" style={{ color: c.primary }} />
                Live Activity Feed
                <Pill color={c.green}>Real-time</Pill>
              </h2>
              <div className="rounded-2xl overflow-hidden" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <div className="divide-y" style={{ borderColor: c.border }}>
                  {activities.length === 0 ? (
                    <div className="py-16 text-center" style={{ color: c.textMuted }}>
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm font-semibold">No activity yet</div>
                    </div>
                  ) : (
                    activities.slice(0, 30).map((item, i) => (
                      <motion.div
                        key={`${item.id}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="text-[10px] font-mono font-bold w-16 flex-shrink-0" style={{ color: c.textMuted }}>
                          {new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                          style={{ background: `${c.primary}15`, color: c.primary }}>
                          {item.user[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{item.user}</span>
                          <span className="text-xs ml-2" style={{ color: c.textSec }}>{item.action}</span>
                        </div>
                        <Pill color={c.blue}>{item.module}</Pill>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* ==================== USERS ==================== */}
          {activeSection === "users" && (
            <Section id="users">
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <h2 className="text-xl font-extrabold flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <Users className="w-5 h-5" style={{ color: c.primary }} />
                  User Management
                </h2>
                <div className="flex-1" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                  <Search className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
                  <input
                    value={userSearch}
                    onChange={e => handleUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="bg-transparent border-none outline-none text-xs w-40"
                    style={{ color: c.text }}
                  />
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${c.border}` }}>
                        <th className="text-left px-4 py-3 font-bold">User</th>
                        <th className="text-left px-4 py-3 font-bold">Email</th>
                        <th className="text-left px-4 py-3 font-bold">Plan</th>
                        <th className="text-left px-4 py-3 font-bold">Status</th>
                        <th className="text-left px-4 py-3 font-bold">Activity</th>
                        <th className="text-left px-4 py-3 font-bold">Joined</th>
                        <th className="text-right px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: c.border }}>
                      {users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0" style={{ background: `${c.primary}15`, color: c.primary }}>
                                {u.name[0]}
                              </div>
                              <span className="font-semibold">{u.name}</span>
                              {u.role === "ADMIN" && <Pill color={c.purple}>Admin</Pill>}
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: c.textSec }}>{u.email}</td>
                          <td className="px-4 py-3">
                            <Pill color={u.plan !== "free" ? c.primary : c.textMuted}>
                              {u.plan}
                            </Pill>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${u.subscriptionStatus === "active" ? "bg-green-500" : "bg-gray-500"}`} />
                              <span style={{ color: c.textSec }}>{u.subscriptionStatus || "inactive"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: c.textSec }}>
                            R:{u._count?.resumes ?? 0} C:{u._count?.chatSessions ?? 0} I:{u._count?.interviewSessions ?? 0}
                          </td>
                          <td className="px-4 py-3" style={{ color: c.textMuted }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUserAction(u.id, "upgrade", "pro_yearly")}
                                disabled={userActionLoading === u.id}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-green-500/10"
                                title="Upgrade"
                              >
                                <Crown className="w-3.5 h-3.5" style={{ color: c.green }} />
                              </button>
                              <button
                                onClick={() => handleUserAction(u.id, "suspend")}
                                disabled={userActionLoading === u.id}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"
                                title="Suspend"
                              >
                                <Ban className="w-3.5 h-3.5" style={{ color: c.red }} />
                              </button>
                              <button
                                onClick={() => { if (confirm("Delete this user?")) handleUserAction(u.id, "delete"); }}
                                disabled={userActionLoading === u.id}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" style={{ color: c.red }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {userPagination && (
                  <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: c.border }}>
                    <div className="text-xs" style={{ color: c.textMuted }}>
                      Showing {((userPagination.page - 1) * userPagination.limit) + 1}-{Math.min(userPagination.page * userPagination.limit, userPagination.total)} of {userPagination.total}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { const p = userPage - 1; setUserPage(p); loadUsers(p, userSearch); }}
                        disabled={userPage <= 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}` }}
                      >Previous</button>
                      <button
                        onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(p, userSearch); }}
                        disabled={userPage >= userPagination.pages}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}` }}
                      >Next</button>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ==================== AI USAGE ==================== */}
          {activeSection === "ai-usage" && (
            <Section id="ai-usage">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Brain className="w-5 h-5" style={{ color: c.primary }} />
                AI Usage Analytics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={<Zap className="w-5 h-5" />} label="Total AI Requests" value={aiAnalytics?.totalRequests ?? 0} color={c.primary} />
                <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Resume Hub" value={(aiAnalytics?.modules?.resumeHub?.resumes ?? 0) + (aiAnalytics?.modules?.resumeHub?.atsReports ?? 0)} color={c.blue} />
                <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Learning Hub" value={(aiAnalytics?.modules?.learningHub?.studySessions ?? 0) + (aiAnalytics?.modules?.learningHub?.notes ?? 0) + (aiAnalytics?.modules?.learningHub?.quizzes ?? 0)} color={c.green} />
                <StatCard icon={<Code2 className="w-5 h-5" />} label="Coding Hub" value={(aiAnalytics?.modules?.codingHub?.sessions ?? 0) + (aiAnalytics?.modules?.codingHub?.submissions ?? 0)} color={c.purple} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Resume Hub */}
                <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                  <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: c.blue }} />
                    Resume Hub
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "Resumes Created", value: aiAnalytics?.modules?.resumeHub?.resumes ?? 0 },
                      { label: "ATS Reports", value: aiAnalytics?.modules?.resumeHub?.atsReports ?? 0 },
                      { label: "Cover Letters", value: aiAnalytics?.modules?.resumeHub?.coverLetters ?? 0 },
                      { label: "LinkedIn Reports", value: aiAnalytics?.modules?.resumeHub?.linkedinReports ?? 0 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs" style={{ color: c.textSec }}>{item.label}</span>
                        <span className="text-sm font-extrabold font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Hub */}
                <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                  <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" style={{ color: c.green }} />
                    Learning Hub
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "Study Sessions", value: aiAnalytics?.modules?.learningHub?.studySessions ?? 0 },
                      { label: "Notes Generated", value: aiAnalytics?.modules?.learningHub?.notes ?? 0 },
                      { label: "Quizzes Created", value: aiAnalytics?.modules?.learningHub?.quizzes ?? 0 },
                      { label: "Assignments", value: aiAnalytics?.modules?.learningHub?.assignments ?? 0 },
                      { label: "PPTs", value: aiAnalytics?.modules?.learningHub?.ppts ?? 0 },
                      { label: "Mind Maps", value: aiAnalytics?.modules?.learningHub?.mindmaps ?? 0 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs" style={{ color: c.textSec }}>{item.label}</span>
                        <span className="text-sm font-extrabold font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coding Hub */}
                <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                  <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
                    <Code2 className="w-4 h-4" style={{ color: c.purple }} />
                    Coding Hub
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "Coding Sessions", value: aiAnalytics?.modules?.codingHub?.sessions ?? 0 },
                      { label: "Submissions", value: aiAnalytics?.modules?.codingHub?.submissions ?? 0 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs" style={{ color: c.textSec }}>{item.label}</span>
                        <span className="text-sm font-extrabold font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Hub */}
                <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                  <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
                    <Mic2 className="w-4 h-4" style={{ color: c.primary }} />
                    Interview Hub
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "Total Interviews", value: aiAnalytics?.modules?.interviewHub?.sessions ?? 0 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5">
                        <span className="text-xs" style={{ color: c.textSec }}>{item.label}</span>
                        <span className="text-sm font-extrabold font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ==================== MODULES (Overview) ==================== */}
          {activeSection === "modules" && (
            <Section id="modules">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <BarChart3 className="w-5 h-5" style={{ color: c.primary }} />
                Module Management
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: "resume", label: "Resume Hub", icon: <FileText className="w-6 h-6" />, color: c.blue, data: moduleData?.resumeHub },
                  { id: "learning", label: "Learning Hub", icon: <GraduationCap className="w-6 h-6" />, color: c.green, data: moduleData?.learningHub },
                  { id: "coding", label: "Coding Hub", icon: <Code2 className="w-6 h-6" />, color: c.purple, data: moduleData?.codingHub },
                  { id: "interview", label: "Interview Hub", icon: <Mic2 className="w-6 h-6" />, color: c.primary, data: moduleData?.interviewHub },
                ].map(mod => (
                  <motion.button
                    key={mod.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setActiveSection(mod.id as SectionId)}
                    className="rounded-2xl p-5 text-left transition-all"
                    style={{ background: c.card, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${mod.color}15` }}>
                          <span style={{ color: mod.color }}>{mod.icon}</span>
                        </div>
                        <div>
                          <div className="font-extrabold text-sm">{mod.label}</div>
                          <div className="text-[10px] font-bold" style={{ color: c.textMuted }}>{mod.data?.total ?? 0} total actions</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: c.textMuted }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(mod.data ?? {}).filter(([k]) => k !== "total" && k !== "templates" && k !== "byType" && k !== "completionRate").slice(0, 4).map(([key, val]) => (
                        <div key={key} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="text-sm font-extrabold font-mono">{val as number}</div>
                          <div className="text-[9px] font-medium" style={{ color: c.textMuted }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        </div>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </Section>
          )}

          {/* ==================== INDIVIDUAL MODULES ==================== */}
          {["resume", "learning", "coding", "interview"].includes(activeSection) && (
            <Section id={activeSection}>
              <button onClick={() => setActiveSection("modules")}
                className="flex items-center gap-2 text-xs font-bold mb-4" style={{ color: c.primary }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Modules
              </button>
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {activeSection === "resume" ? <FileText className="w-5 h-5" /> : activeSection === "learning" ? <GraduationCap className="w-5 h-5" /> : activeSection === "coding" ? <Code2 className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
                <span style={{ color: c.primary }}>
                  {activeSection === "resume" ? "Resume Hub" : activeSection === "learning" ? "Learning Hub" : activeSection === "coding" ? "Coding Hub" : "Interview Hub"}
                </span>
                Analytics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moduleData?.[activeSection === "resume" ? "resumeHub" : activeSection === "learning" ? "learningHub" : activeSection === "coding" ? "codingHub" : "interviewHub"] && (
                  Object.entries(moduleData[activeSection === "resume" ? "resumeHub" : activeSection === "learning" ? "learningHub" : activeSection === "coding" ? "codingHub" : "interviewHub"] ?? {})
                    .filter(([k]) => k !== "templates" && k !== "byType")
                    .map(([key, val]) => (
                      <StatCard
                        key={key}
                        icon={<BarChart3 className="w-5 h-5" />}
                        label={key.replace(/([A-Z])/g, ' $1').trim()}
                        value={val as number}
                        color={c.primary}
                      />
                    ))
                )}
              </div>
              {activeSection === "interview" && moduleData?.interviewHub?.completionRate !== undefined && (
                <div className="mt-4 rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                  <div className="text-sm font-bold mb-2">Completion Rate</div>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-extrabold font-mono" style={{ color: c.green }}>{moduleData.interviewHub.completionRate}%</div>
                    <div className="flex-1 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${moduleData.interviewHub.completionRate}%`, background: "linear-gradient(90deg, #f59e0b, #10b981)" }} />
                    </div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ==================== SUBSCRIPTIONS ==================== */}
          {activeSection === "subscriptions" && (
            <Section id="subscriptions">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Crown className="w-5 h-5" style={{ color: c.primary }} />
                Subscription Plans
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "Free", price: "₹0", color: c.textMuted, features: ["1 Resume", "Basic AI", "3 Cover Letters"], users: stats?.users?.free ?? 0 },
                  { name: "Pro Monthly", price: "₹149", color: c.primary, features: ["Unlimited Resumes", "All AI Models", "Interview Hub"], users: stats?.users?.premium ?? 0 },
                  { name: "Pro Yearly", price: "₹999", color: c.purple, features: ["Everything in Pro", "2 Months Free", "Premium Badge"], users: stats?.users?.premium ?? 0 },
                ].map(plan => (
                  <div key={plan.name} className="rounded-2xl p-6" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                    <h3 className="text-lg font-extrabold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
                    <div className="text-3xl font-extrabold mb-4">{plan.price}</div>
                    <div className="space-y-2 mb-6">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: c.textSec }}>
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: c.green }} />
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs font-bold" style={{ color: c.textMuted }}>
                      {plan.users} users
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ==================== PAYMENTS ==================== */}
          {activeSection === "payments" && (
            <Section id="payments">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <ShoppingCart className="w-5 h-5" style={{ color: c.primary }} />
                Payment Transactions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Successful" value={stats?.revenue?.successfulPayments ?? 0} color={c.green} />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Failed" value={stats?.revenue?.failedPayments ?? 0} color={c.red} />
                <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`₹${(stats?.revenue?.total ?? 0) / 100}`} color={c.primary} />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Month Revenue" value={`₹${(stats?.revenue?.month ?? 0) / 100}`} color={c.green} />
              </div>
            </Section>
          )}

          {/* ==================== REVENUE ==================== */}
          {activeSection === "revenue" && (
            <Section id="revenue">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <IndianRupee className="w-5 h-5" style={{ color: c.primary }} />
                Revenue Analytics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`₹${(revenueData?.total ?? 0) / 100}`} color={c.primary} />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="This Month" value={`₹${(revenueData?.month ?? 0) / 100}`} color={c.green} />
                <StatCard icon={<Crown className="w-5 h-5" />} label="Premium Users" value={revenueData?.premiumUsers ?? 0} color={c.primary} />
                <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Avg. Order" value={`₹${((revenueData?.averageOrderValue ?? 0) / 100)}`} color={c.purple} />
              </div>
            </Section>
          )}

          {/* ==================== AI MODELS ==================== */}
          {activeSection === "ai-models" && (
            <Section id="ai-models">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Terminal className="w-5 h-5" style={{ color: c.primary }} />
                AI Model Monitoring
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "Gemini 2.5 Flash", provider: "Google", status: "active", color: c.blue, requests: "843", avgTime: "1.2s", cost: "₹34" },
                  { name: "OpenAI GPT-4o", provider: "OpenAI", status: "active", color: c.green, requests: "412", avgTime: "1.8s", cost: "₹89" },
                  { name: "Claude Sonnet 4", provider: "Anthropic", status: "idle", color: c.purple, requests: "128", avgTime: "2.1s", cost: "₹42" },
                  { name: "DeepSeek V3", provider: "DeepSeek", status: "active", color: c.primary, requests: "256", avgTime: "0.9s", cost: "₹12" },
                  { name: "Llama 3.3 70B", provider: "Meta", status: "active", color: c.red, requests: "95", avgTime: "1.5s", cost: "₹8" },
                  { name: "Mistral Large", provider: "Mistral", status: "idle", color: c.textMuted, requests: "0", avgTime: "-", cost: "₹0" },
                ].map(model => (
                  <div key={model.name} className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{
                          background: model.status === "active" ? c.green : c.textMuted,
                          boxShadow: model.status === "active" ? `0 0 8px ${c.green}` : "none",
                        }} />
                        <div>
                          <div className="text-sm font-extrabold">{model.name}</div>
                          <div className="text-[10px]" style={{ color: c.textMuted }}>{model.provider}</div>
                        </div>
                      </div>
                      <Pill color={model.status === "active" ? c.green : c.textMuted}>{model.status}</Pill>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-extrabold font-mono">{model.requests}</div>
                        <div className="text-[9px]" style={{ color: c.textMuted }}>Requests</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold font-mono">{model.avgTime}</div>
                        <div className="text-[9px]" style={{ color: c.textMuted }}>Avg Time</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold font-mono">{model.cost}</div>
                        <div className="text-[9px]" style={{ color: c.textMuted }}>Cost</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ==================== SYSTEM HEALTH ==================== */}
          {activeSection === "system-health" && (
            <Section id="system-health">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Server className="w-5 h-5" style={{ color: c.primary }} />
                System Health
                <Pill color={c.green}>All Systems Operational</Pill>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={<HardDrive className="w-5 h-5" />} label="Memory (Heap)" value={`${systemHealth?.memory?.used ?? 0}MB / ${systemHealth?.memory?.total ?? 0}MB`} color={c.blue} />
                <StatCard icon={<Cpu className="w-5 h-5" />} label="Uptime" value={systemHealth ? `${Math.floor((systemHealth.uptime ?? 0) / 3600)}h` : "0h"} color={c.green} />
                <StatCard icon={<Globe className="w-5 h-5" />} label="Platform" value={systemHealth?.platform ?? "unknown"} color={c.purple} />
                <StatCard icon={<Terminal className="w-5 h-5" />} label="Node.js" value={systemHealth?.nodeVersion ?? "?"} color={c.primary} />
              </div>

              <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <h4 className="font-extrabold text-sm mb-4">Resource Usage</h4>
                <div className="space-y-3">
                  {[
                    { label: "Memory (RSS)", used: systemHealth?.memory?.rss ?? 0, total: 1024, color: c.blue },
                    { label: "Heap Used", used: systemHealth?.memory?.used ?? 0, total: systemHealth?.memory?.total ?? 512, color: c.primary },
                  ].map(res => (
                    <div key={res.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: c.textSec }}>{res.label}</span>
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
            </Section>
          )}

          {/* ==================== SECURITY ==================== */}
          {activeSection === "security" && (
            <Section id="security">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Shield className="w-5 h-5" style={{ color: c.primary }} />
                Security Dashboard
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={<Shield className="w-5 h-5" />} label="Security Status" value="Secure" color={c.green} />
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Admins" value={stats?.users?.admin ?? 1} color={c.blue} />
                <StatCard icon={<Lock className="w-5 h-5" />} label="Failed Logins" value="0" color={c.red} />
                <StatCard icon={<Ban className="w-5 h-5" />} label="Blocked IPs" value="0" color={c.textMuted} />
              </div>
            </Section>
          )}

          {/* ==================== SETTINGS ==================== */}
          {activeSection === "settings" && (
            <Section id="settings">
              <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Settings className="w-5 h-5" style={{ color: c.primary }} />
                Admin Settings
              </h2>
              <div className="rounded-2xl p-6" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <div className="space-y-4">
                  {[
                    { label: "Maintenance Mode", desc: "Disable platform access for non-admin users" },
                    { label: "New Registrations", desc: "Allow new users to sign up" },
                    { label: "Email Notifications", desc: "Send system notifications to admins" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-bold">{item.label}</div>
                        <div className="text-xs" style={{ color: c.textMuted }}>{item.desc}</div>
                      </div>
                      <div className="w-10 h-6 rounded-full" style={{
                        background: "rgba(245,158,11,0.3)",
                        padding: 2,
                        transition: "background 0.2s",
                      }}>
                        <div className="w-5 h-5 rounded-full bg-white ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}
