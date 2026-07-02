"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Bell, ChevronDown, User, LogOut, Settings, CreditCard,
  Sun, Moon, ShieldCheck, LayoutDashboard, Users, Crown, IndianRupee,
  Brain, Briefcase, Flag, ArrowUpRight, TrendingDown, ToggleLeft,
  ToggleRight, Plus, Download, ChevronRight,
} from "lucide-react";
import { api } from "@/services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AdminUser {
  name: string;
  email: string;
  role?: string;
}

interface OverviewData {
  totalUsers?: number;
  adminUsers?: number;
  completedProfiles?: number;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  submenu?: { id: string; label: string }[];
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "linear-gradient(135deg,#f59e0b,#d97706)",
      color: "#000", padding: "12px 22px", borderRadius: 12,
      boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
      fontSize: "0.88rem", fontWeight: 700,
      animation: "fadeInUp 0.3s ease",
    }}>
      {message}
    </div>
  );
}

// ─── Sidebar sections ──────────────────────────────────────────────────────────
const sidebarSections: SidebarSection[] = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  {
    id: "users", label: "Users", icon: <Users size={18} />,
    submenu: [
      { id: "all-users", label: "All Users" },
      { id: "user-reports", label: "User Reports" },
    ],
  },
  {
    id: "subscriptions", label: "Subscriptions", icon: <Crown size={18} />,
    submenu: [
      { id: "premium-users", label: "Premium Users" },
      { id: "plans", label: "Plans" },
    ],
  },
  {
    id: "revenue", label: "Revenue", icon: <IndianRupee size={18} />,
    submenu: [
      { id: "revenue-dashboard", label: "Revenue Dashboard" },
      { id: "payment-reports", label: "Payment Reports" },
    ],
  },
  {
    id: "ai-analytics", label: "AI Analytics", icon: <Brain size={18} />,
    submenu: [
      { id: "ai-usage", label: "AI Usage" },
      { id: "token-usage", label: "Token Usage" },
    ],
  },
  {
    id: "jobs", label: "Jobs & Placements", icon: <Briefcase size={18} />,
    submenu: [
      { id: "job-listings", label: "Job Listings" },
      { id: "internship-listings", label: "Internship Listings" },
    ],
  },
  { id: "reports", label: "Reports & Flags", icon: <Flag size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function AdminSidebar({
  activeSection, onNavigate,
}: {
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (id: string) => setOpenItem((p) => (p === id ? null : id));

  const isActive = (section: SidebarSection) => {
    if (section.id === activeSection) return true;
    return section.submenu?.some((s) => s.id === activeSection) ?? false;
  };

  return (
    <aside className="dash-sidebar">
      {sidebarSections.map((section) => {
        const active = isActive(section);
        const isOpen = openItem === section.id;
        const hasSubmenu = !!section.submenu;

        if (!hasSubmenu) {
          return (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
                color: active ? "var(--primary)" : "var(--text-secondary)",
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                fontWeight: 500, fontSize: "0.82rem", cursor: "pointer",
                width: "100%", textAlign: "left", transition: "all 0.2s ease", whiteSpace: "nowrap",
              }}
            >
              <span style={{ flexShrink: 0 }}>{section.icon}</span>
              <span className="sb-label">{section.label}</span>
            </button>
          );
        }

        return (
          <div key={section.id}>
            <button
              onClick={() => toggle(section.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
                color: active ? "var(--primary)" : "var(--text-secondary)",
                background: active ? "rgba(245,158,11,0.06)" : "transparent",
                border: "1px solid transparent", fontWeight: 500,
                fontSize: "0.82rem", cursor: "pointer", width: "100%",
                transition: "all 0.2s ease", whiteSpace: "nowrap",
              }}
            >
              <span style={{ flexShrink: 0 }}>{section.icon}</span>
              <span className="sb-label" style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
              <span className="sb-arrow" style={{ marginLeft: "auto", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <ChevronDown size={13} />
              </span>
            </button>
            <div className="sb-submenu" style={{ paddingLeft: "1.2rem" }}>
              {isOpen && section.submenu?.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onNavigate(sub.id)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "0.3rem 0.5rem", fontSize: "0.76rem",
                    color: activeSection === sub.id ? "var(--primary)" : "var(--text-secondary)",
                    background: activeSection === sub.id ? "rgba(245,158,11,0.07)" : "transparent",
                    border: "none", borderRadius: 8, marginBottom: 1,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
}

// ─── Profile Dropdown ──────────────────────────────────────────────────────────
function ProfileDropdown({
  user, isDark, onComingSoon,
}: {
  user: AdminUser | null;
  isDark: boolean;
  onComingSoon: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownBg = isDark ? "#0f0f19" : "#ffffff";
  const dropdownBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItems = [
    { icon: <User size={15} />, label: "Profile", href: "#", cs: true },
    { icon: <Settings size={15} />, label: "Settings", href: "#", cs: true },
    { icon: <CreditCard size={15} />, label: "Billing", href: "#", cs: true },
    null,
    { icon: <LogOut size={15} />, label: "Logout", href: "/login" },
  ] as Array<{ icon: React.ReactNode; label: string; href: string; cs?: boolean } | null>;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <div ref={ref} style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%", border: "2px solid #f59e0b",
        background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", fontWeight: 700,
        fontSize: "0.85rem", color: "#f59e0b",
      }}>
        {initials}
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 260,
          borderRadius: 16, padding: "1rem 0.7rem", zIndex: 300,
          background: dropdownBg, backdropFilter: "blur(40px) saturate(180%)",
          border: `1px solid ${dropdownBorder}`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "0 0.4rem", marginBottom: "0.8rem" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", border: "2px solid #f59e0b",
              background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700, fontSize: "0.95rem", color: "#f59e0b", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isDark ? "#fff" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name ?? "Admin"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(128,128,128,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email ?? "admin@adyapan.ai"}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", marginBottom: "0.6rem" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {menuItems.map((item, i) =>
              item === null ? (
                <div key={i} style={{ height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", margin: "4px 0" }} />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.cs ? (e) => { e.preventDefault(); onComingSoon(); } : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.48rem 0.6rem", borderRadius: 8,
                    color: isDark ? "rgba(255,255,255,0.7)" : "#475569",
                    fontSize: "0.83rem", fontWeight: 500, textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
                    (e.currentTarget as HTMLElement).style.color = isDark ? "#fff" : "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.7)" : "#475569";
                  }}
                >
                  <span style={{ color: "#f59e0b" }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Top Navbar ────────────────────────────────────────────────────────────────
function AdminTopNav({
  user, isDark, onThemeToggle, onComingSoon,
}: {
  user: AdminUser | null;
  isDark: boolean;
  onThemeToggle: () => void;
  onComingSoon: () => void;
}) {
  const navBg = isDark ? "#060b0e" : "#ffffff";
  const navBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const navBtnBg = isDark ? "#0d151c" : "rgba(0,0,0,0.04)";
  const navBtnColor = isDark ? "#fff" : "#0f172a";
  const navInputBg = isDark ? "#0d151c" : "rgba(0,0,0,0.05)";
  const navInputColor = isDark ? "#fff" : "#0f172a";

  const iconBtnStyle: React.CSSProperties = {
    background: navBtnBg, border: `1px solid ${navBorder}`, borderRadius: 8,
    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: isDark ? "rgba(255,255,255,0.6)" : "#475569",
  };

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: 70,
      background: navBg, borderBottom: `1px solid ${navBorder}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem", zIndex: 105, boxSizing: "border-box",
      transition: "background 0.3s ease",
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
        <Link href="/dashboard/admin" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Image src="/assets/images/logo.png" alt="Adyapan AI" width={30} height={30} style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: navBtnColor }}>Adyapan AI</span>
        </Link>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8" }} />
          <input
            type="text" placeholder="Search users, reports..."
            style={{
              width: 220, padding: "0.48rem 1rem 0.48rem 2rem",
              background: navInputBg, border: `1px solid ${navBorder}`,
              borderRadius: 8, color: navInputColor, fontSize: "0.82rem", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Center badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 20, padding: "0.35rem 0.9rem",
        }}>
          <ShieldCheck size={15} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f59e0b" }}>Admin Panel</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button onClick={onThemeToggle} aria-label="Toggle theme" style={iconBtnStyle}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={onComingSoon}>
          <Bell size={19} style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#475569" }} />
          <span style={{
            position: "absolute", top: -5, right: -6, background: "#ef4444",
            color: "#fff", fontSize: "0.6rem", fontWeight: 800, width: 14, height: 14,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          }}>3</span>
        </div>
        <ProfileDropdown user={user} isDark={isDark} onComingSoon={onComingSoon} />
      </div>
    </header>
  );
}

// ─── Shared UI helpers ─────────────────────────────────────────────────────────
function StatCard({
  icon, iconBg, iconColor, value, label, trend, trendUp,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: string; label: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-color)",
      borderRadius: 16, padding: "1.1rem", transition: "all 0.3s ease",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.2)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: "0.72rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
            color: trendUp === false ? "#ef4444" : trendUp ? "#10b981" : "var(--text-muted)",
          }}>
            {trendUp === true && <ArrowUpRight size={11} />}
            {trendUp === false && <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function PanelCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-color)",
      borderRadius: 16, padding: "1.2rem", transition: "all 0.25s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.93rem", fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: 8 }}>📭</div>
      {message}
    </div>
  );
}

function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.35rem 0.85rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
        cursor: "pointer", border: "1px solid",
        borderColor: active ? "rgba(245,158,11,0.4)" : "var(--border-color)",
        background: active ? "rgba(245,158,11,0.1)" : "transparent",
        color: active ? "#f59e0b" : "var(--text-secondary)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function ActionButton({
  label, icon, variant = "secondary", onClick,
}: {
  label: string; icon?: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "0.45rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700,
        cursor: "pointer", transition: "all 0.2s ease",
        background: variant === "primary" ? "#f59e0b" : "transparent",
        color: variant === "primary" ? "#000" : "var(--text-secondary)",
        border: variant === "primary" ? "none" : "1px solid var(--border-color)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Overview Section ──────────────────────────────────────────────────────────
function OverviewSection({
  overviewData, onComingSoon,
}: {
  overviewData: OverviewData | null;
  onComingSoon: () => void;
}) {
  const quickActions = [
    { label: "Add User", icon: <Users size={16} />, color: "#3b82f6" },
    { label: "Manage Plans", icon: <Crown size={16} />, color: "#f59e0b" },
    { label: "View Reports", icon: <Flag size={16} />, color: "#ef4444" },
    { label: "Settings", icon: <Settings size={16} />, color: "#8b5cf6" },
  ];

  const statusItems = [
    { label: "API Server", status: "Operational", ok: true },
    { label: "Database", status: "Operational", ok: true },
    { label: "AI Engine", status: "Pending", ok: false },
    { label: "Payment Gateway", status: "Pending", ok: false },
    { label: "Email Service", status: "Operational", ok: true },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.9rem", marginBottom: "1.2rem",
      }} className="admin-stat-grid">
        <StatCard
          icon={<Users size={17} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6"
          value={overviewData?.totalUsers?.toString() ?? "0"}
          label="Total Users" trend="Live"
        />
        <StatCard
          icon={<ShieldCheck size={17} />} iconBg="rgba(245,158,11,0.1)" iconColor="#f59e0b"
          value={overviewData?.adminUsers?.toString() ?? "0"}
          label="Admin Accounts" trend="Live"
        />
        <StatCard
          icon={<IndianRupee size={17} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981"
          value="₹0"
          label="Total Revenue" trend="—"
        />
        <StatCard
          icon={<Brain size={17} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6"
          value={overviewData?.completedProfiles?.toString() ?? "0"}
          label="Completed Profiles" trend="Live"
        />
      </div>

      {/* Two panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }} className="admin-panel-grid">
        {/* Quick Actions */}
        <PanelCard title="Quick Actions">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={onComingSoon}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                  padding: "1rem 0.5rem", border: "1px solid var(--border-color)", borderRadius: 12,
                  background: "transparent", color: "var(--text-secondary)", fontSize: "0.78rem",
                  fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = a.color;
                  (e.currentTarget as HTMLElement).style.color = a.color;
                  (e.currentTarget as HTMLElement).style.background = `${a.color}12`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span style={{ color: a.color }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </PanelCard>

        {/* Platform Status */}
        <PanelCard title="Platform Status">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {statusItems.map((s) => (
              <div key={s.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "0.82rem", color: "var(--text-secondary)",
              }}>
                <span>{s.label}</span>
                <span style={{
                  display: "flex", alignItems: "center", gap: 5, fontWeight: 600,
                  color: s.ok ? "#10b981" : "#f59e0b",
                }}>
                  <span style={{ fontSize: "0.9rem" }}>{s.ok ? "✅" : "⚠️"}</span>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

// ─── Users Section ─────────────────────────────────────────────────────────────
function UsersSection({ onComingSoon }: { onComingSoon: () => void }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Active", "Suspended", "Premium"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Users Management</h2>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <ActionButton label="Add User" icon={<Plus size={14} />} variant="primary" onClick={onComingSoon} />
          <ActionButton label="Export" icon={<Download size={14} />} onClick={onComingSoon} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {filters.map((f) => (
          <FilterChip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
        ))}
      </div>
      <PanelCard title="All Users">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                {["#", "Name", "Email", "Joined", "Plan", "Status", "Actions"].map((col) => (
                  <th key={col} style={{
                    padding: "0.5rem 0.7rem", textAlign: "left",
                    color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap",
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
          </table>
          <EmptyState message="No users yet — connect backend to load data" />
        </div>
      </PanelCard>
    </div>
  );
}

// ─── Subscriptions Section ─────────────────────────────────────────────────────
function SubscriptionsSection({ onComingSoon }: { onComingSoon: () => void }) {
  const plans = [
    { name: "Free", users: 0, price: "₹0/mo", color: "#94a3b8" },
    { name: "Premium", users: 0, price: "₹299/mo", color: "#f59e0b" },
    { name: "Institution", users: 0, price: "Custom", color: "#8b5cf6" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.2rem" }}>Subscriptions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }} className="admin-panel-grid">
        <PanelCard title="Active Plans">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {plans.map((plan) => (
              <div key={plan.name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border-color)",
                background: "var(--bg-card-hover)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: plan.color,
                    boxShadow: `0 0 6px ${plan.color}`,
                  }} />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{plan.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", color: plan.color, fontWeight: 700 }}>{plan.price}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{plan.users} users</div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard
          title="Coupon Codes"
          action={<ActionButton label="Create Coupon" icon={<Plus size={13} />} variant="primary" onClick={onComingSoon} />}
        >
          <EmptyState message="No coupons created yet" />
        </PanelCard>
      </div>
    </div>
  );
}

// ─── Revenue Section ───────────────────────────────────────────────────────────
function RevenueSection() {
  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.2rem" }}>Revenue</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.9rem", marginBottom: "1.2rem" }} className="admin-stat-grid">
        <StatCard icon={<IndianRupee size={17} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981" value="₹0" label="Monthly Revenue" />
        <StatCard icon={<IndianRupee size={17} />} iconBg="rgba(245,158,11,0.1)" iconColor="#f59e0b" value="₹0" label="Total Revenue" />
        <StatCard icon={<IndianRupee size={17} />} iconBg="rgba(239,68,68,0.1)" iconColor="#ef4444" value="₹0" label="Pending Payouts" />
        <StatCard icon={<CreditCard size={17} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6" value="0" label="Transactions Today" />
      </div>
      <PanelCard title="Transaction History">
        <EmptyState message="No transactions yet — connect payment gateway to load data" />
      </PanelCard>
    </div>
  );
}

// ─── AI Analytics Section ──────────────────────────────────────────────────────
function AIAnalyticsSection() {
  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.2rem" }}>AI Analytics</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.9rem", marginBottom: "1.2rem" }}>
        <StatCard icon={<Brain size={17} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6" value="0" label="API Calls Today" />
        <StatCard icon={<Brain size={17} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6" value="0" label="Tokens Used" />
        <StatCard icon={<Flag size={17} />} iconBg="rgba(239,68,68,0.1)" iconColor="#ef4444" value="0" label="Escalated Queries" />
      </div>
      <PanelCard title="Usage Breakdown">
        <EmptyState message="No AI usage data yet — connect Gemini API to load data" />
      </PanelCard>
    </div>
  );
}

// ─── Jobs Section ──────────────────────────────────────────────────────────────
function JobsSection({ onComingSoon }: { onComingSoon: () => void }) {
  const [tab, setTab] = useState<"jobs" | "internships">("jobs");

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.2rem" }}>Jobs & Placements</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <FilterChip label="Job Listings" active={tab === "jobs"} onClick={() => setTab("jobs")} />
        <FilterChip label="Internship Listings" active={tab === "internships"} onClick={() => setTab("internships")} />
      </div>
      <PanelCard
        title={tab === "jobs" ? "Job Listings" : "Internship Listings"}
        action={<ActionButton label="Add Listing" icon={<Plus size={13} />} variant="primary" onClick={onComingSoon} />}
      >
        <EmptyState message={`No ${tab === "jobs" ? "job" : "internship"} listings yet — add one to get started`} />
      </PanelCard>
    </div>
  );
}

// ─── Reports Section ───────────────────────────────────────────────────────────
function ReportsSection() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Open", "Resolved", "Dismissed"];

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.2rem" }}>Reports & Flags</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {filters.map((f) => (
          <FilterChip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
        ))}
      </div>
      <PanelCard title="Reports">
        <EmptyState message="No reports yet — all looks good!" />
      </PanelCard>
    </div>
  );
}

// ─── Settings Section ──────────────────────────────────────────────────────────
function SettingsSection({ onComingSoon }: { onComingSoon: () => void }) {
  const [maintenance, setMaintenance] = useState(false);
  const [registrations, setRegistrations] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const ToggleSwitch = ({
    value, onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        background: "transparent", border: "none", cursor: "pointer",
        color: value ? "#10b981" : "var(--text-muted)",
        display: "flex", alignItems: "center",
      }}
    >
      {value ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
    </button>
  );

  const integrations = [
    { label: "Razorpay", desc: "Payment gateway", status: "Not Connected", color: "#ef4444" },
    { label: "Google OAuth", desc: "Social login", status: "Not Connected", color: "#ef4444" },
    { label: "Gemini AI", desc: "AI engine", status: "Not Connected", color: "#ef4444" },
    { label: "SMTP Email", desc: "Email service", status: "Not Connected", color: "#ef4444" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.2rem" }}>Settings</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }} className="admin-panel-grid">
        {/* General Settings */}
        <PanelCard title="General Settings">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {[
              { label: "Maintenance Mode", desc: "Temporarily disable platform access", value: maintenance, onChange: setMaintenance },
              { label: "New Registrations", desc: "Allow new users to sign up", value: registrations, onChange: setRegistrations },
              { label: "Email Notifications", desc: "Send system emails to users", value: emailNotifs, onChange: setEmailNotifs },
            ].map((setting) => (
              <div key={setting.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.7rem 0.9rem", border: "1px solid var(--border-color)", borderRadius: 10,
              }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{setting.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{setting.desc}</div>
                </div>
                <ToggleSwitch value={setting.value} onChange={setting.onChange} />
              </div>
            ))}
          </div>
        </PanelCard>

        {/* Integrations */}
        <PanelCard title="Integrations">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {integrations.map((intg) => (
              <div key={intg.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.7rem 0.9rem", border: "1px solid var(--border-color)", borderRadius: 10,
              }}>
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-primary)" }}>{intg.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{intg.desc}</div>
                </div>
                <button
                  onClick={onComingSoon}
                  style={{
                    fontSize: "0.72rem", fontWeight: 700, padding: "0.3rem 0.7rem",
                    borderRadius: 20, border: `1px solid ${intg.color}`,
                    background: `${intg.color}12`, color: intg.color, cursor: "pointer",
                  }}
                >
                  {intg.status}
                </button>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

// ─── Section Router ────────────────────────────────────────────────────────────
function SectionContent({
  activeSection, overviewData, onComingSoon,
}: {
  activeSection: string;
  overviewData: OverviewData | null;
  onComingSoon: () => void;
}) {
  switch (activeSection) {
    case "overview":
      return <OverviewSection overviewData={overviewData} onComingSoon={onComingSoon} />;
    case "users":
    case "all-users":
    case "user-reports":
      return <UsersSection onComingSoon={onComingSoon} />;
    case "subscriptions":
    case "premium-users":
    case "plans":
      return <SubscriptionsSection onComingSoon={onComingSoon} />;
    case "revenue":
    case "revenue-dashboard":
    case "payment-reports":
      return <RevenueSection />;
    case "ai-analytics":
    case "ai-usage":
    case "token-usage":
      return <AIAnalyticsSection />;
    case "jobs":
    case "job-listings":
    case "internship-listings":
      return <JobsSection onComingSoon={onComingSoon} />;
    case "reports":
      return <ReportsSection />;
    case "settings":
      return <SettingsSection onComingSoon={onComingSoon} />;
    default:
      return <OverviewSection overviewData={overviewData} onComingSoon={onComingSoon} />;
  }
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ activeSection }: { activeSection: string }) {
  const labels: Record<string, string[]> = {
    overview: ["Dashboard"],
    users: ["Users", "All Users"],
    "all-users": ["Users", "All Users"],
    "user-reports": ["Users", "User Reports"],
    subscriptions: ["Subscriptions", "Plans"],
    "premium-users": ["Subscriptions", "Premium Users"],
    plans: ["Subscriptions", "Plans"],
    revenue: ["Revenue", "Revenue Dashboard"],
    "revenue-dashboard": ["Revenue", "Revenue Dashboard"],
    "payment-reports": ["Revenue", "Payment Reports"],
    "ai-analytics": ["AI Analytics", "AI Usage"],
    "ai-usage": ["AI Analytics", "AI Usage"],
    "token-usage": ["AI Analytics", "Token Usage"],
    jobs: ["Jobs & Placements", "Job Listings"],
    "job-listings": ["Jobs & Placements", "Job Listings"],
    "internship-listings": ["Jobs & Placements", "Internship Listings"],
    reports: ["Reports & Flags"],
    settings: ["Settings"],
  };

  const parts = labels[activeSection] ?? ["Dashboard"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1.2rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
      <ShieldCheck size={13} style={{ color: "#f59e0b" }} />
      <span style={{ color: "#f59e0b", fontWeight: 700 }}>Admin</span>
      {parts.map((part, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronRight size={12} />
          <span style={{ color: i === parts.length - 1 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === parts.length - 1 ? 600 : 400 }}>
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);

  const isDark = theme === "dark";

  // ── Bootstrap: theme + user ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) setUser(JSON.parse(raw) as AdminUser);
    } catch { /* ignore */ }

    const saved = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);

    // Watch for external theme changes
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme") ?? "dark";
      setTheme(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // ── Fetch overview data ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get<OverviewData>("/admin/overview");
        setOverviewData(res.data);
      } catch {
        // Backend not connected yet — silently ignore
      }
    };
    fetchOverview();
  }, []);

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("adyapan-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const showComingSoon = () => setToast(true);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      {/* Top Navbar */}
      <AdminTopNav
        user={user}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onComingSoon={showComingSoon}
      />

      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main Content */}
      <main className="dash-main">
        <Breadcrumb activeSection={activeSection} />
        <SectionContent
          activeSection={activeSection}
          overviewData={overviewData}
          onComingSoon={showComingSoon}
        />
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message="🚀 Coming Soon! This feature will be available in the next release."
          onClose={() => setToast(false)}
        />
      )}

      {/* Inline styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .admin-stat-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        .admin-panel-grid {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 900px) {
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-panel-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .admin-stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
