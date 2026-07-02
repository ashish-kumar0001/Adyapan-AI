"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Crown, Bell, ChevronDown,
  User, LogOut, Settings, CreditCard, TrendingUp, Award,
  BookOpen, Code2, Compass, FileText, Mic,
  Briefcase, UserCircle, BarChart3, Wand2, GraduationCap,
  LayoutDashboard, Sun, Moon, TrendingDown, ArrowUpRight,
  BookMarked, ClipboardList,
  Star, Zap,
  LineChart, Trophy,
  Upload, Download, Trash2, CheckCircle, XCircle,
  Phone, Mail, MapPin, Target, Github, Linkedin,
} from "lucide-react";
import { api } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdyapanUser {
  name: string;
  email: string;
  role?: string;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  college: string;
  branch: string;
  phone?: string;
  year?: string;
  skills: string[];
  linkedin?: string;
  github?: string;
  resumeUrl?: string;
  resumeFilename?: string;
  resumeSize?: number;
  atsScore?: number;
  careerGoal?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  submenu?: { label: string; href: string }[];
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
        color: "#fff", padding: "12px 22px", borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        fontSize: "0.88rem", fontWeight: 600,
        animation: "fadeInUp 0.3s ease",
      }}
    >
      {message}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = "var(--primary)", height = 5 }: { value: number; color?: string; height?: number }) {
  return (
    <div style={{ height, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 1s ease" }} />
    </div>
  );
}

// ─── Sidebar Data ─────────────────────────────────────────────────────────────
const sidebarItems: SidebarItem[] = [
  { id: "profile", label: "My Profile", icon: <User size={18} />, href: "/profile/user" },
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/dashboard/user" },
  {
    id: "learning", label: "Learning Hub", icon: <GraduationCap size={18} />,
    submenu: [
      { label: "Study Assistant", href: "#" }, { label: "Notes Generator", href: "#" },
      { label: "PPT Generator", href: "#" }, { label: "Assignment Generator", href: "#" },
      { label: "MCQ Generator", href: "#" }, { label: "PDF Summarizer", href: "#" },
      { label: "Flashcards", href: "#" }, { label: "Mind Maps", href: "#" },
      { label: "Topic Explainer", href: "#" },
    ],
  },
  {
    id: "coding", label: "Coding Hub", icon: <Code2 size={18} />,
    submenu: [
      { label: "Coding Assistant", href: "#" }, { label: "Code Generator", href: "#" },
      { label: "Code Debugger", href: "#" }, { label: "DSA Practice", href: "#" },
      { label: "Coding Challenges", href: "#" }, { label: "Project Ideas", href: "#" },
      { label: "GitHub Portfolio Builder", href: "#" },
    ],
  },
  {
    id: "career", label: "Career Hub", icon: <Compass size={18} />,
    submenu: [
      { label: "Career Guide", href: "#" }, { label: "Career Roadmap", href: "#" },
      { label: "Skill Gap Analysis", href: "#" }, { label: "Domain Recommendation", href: "#" },
      { label: "Learning Path Generator", href: "#" },
    ],
  },
  {
    id: "resume", label: "Resume Hub", icon: <FileText size={18} />,
    submenu: [
      { label: "Resume Builder", href: "#" }, { label: "ATS Score Checker", href: "#" },
      { label: "Resume Analyzer", href: "#" }, { label: "Cover Letter Generator", href: "#" },
      { label: "LinkedIn Optimizer", href: "#" },
    ],
  },
  {
    id: "interview", label: "Interview Hub", icon: <Mic size={18} />,
    submenu: [
      { label: "AI HR Interview", href: "#" }, { label: "AI Technical Interview", href: "#" },
      { label: "Mock Interviews", href: "#" }, { label: "Voice Interview", href: "#" },
      { label: "Company-wise Prep", href: "#" },
    ],
  },
  {
    id: "research", label: "Research Hub", icon: <BookOpen size={18} />,
    submenu: [
      { label: "Research Paper AI", href: "#" }, { label: "Research Topic Generator", href: "#" },
      { label: "Literature Review Gen", href: "#" }, { label: "Citation Generator", href: "#" },
      { label: "Plagiarism Checker", href: "#" },
    ],
  },
  {
    id: "internship", label: "Internship Hub", icon: <Briefcase size={18} />,
    submenu: [
      { label: "Internship Finder", href: "#" }, { label: "Recommendations", href: "#" },
      { label: "Internship Tracker", href: "#" },
    ],
  },
  {
    id: "job", label: "Job Hub", icon: <UserCircle size={18} />,
    submenu: [
      { label: "Job Matching", href: "#" }, { label: "Resume vs JD Match", href: "#" },
      { label: "Job Referrals", href: "#" }, { label: "Hiring Challenges", href: "#" },
    ],
  },
  {
    id: "placement", label: "Placement Hub", icon: <Trophy size={18} />,
    submenu: [
      { label: "Aptitude Practice", href: "#" }, { label: "Logical Reasoning", href: "#" },
      { label: "Technical MCQs", href: "#" }, { label: "Mock Tests", href: "#" },
      { label: "Readiness Score", href: "#" },
    ],
  },
  {
    id: "productivity", label: "AI Productivity", icon: <Wand2 size={18} />,
    submenu: [
      { label: "AI Chat Assistant", href: "#" }, { label: "Email Writer", href: "#" },
      { label: "SOP Generator", href: "#" }, { label: "LinkedIn Post Gen", href: "#" },
      { label: "Content Writer", href: "#" },
    ],
  },
  {
    id: "analytics", label: "Analytics", icon: <LineChart size={18} />,
    submenu: [
      { label: "Learning Progress", href: "#" }, { label: "Interview Progress", href: "#" },
      { label: "Resume Score", href: "#" }, { label: "Skill Growth", href: "#" },
    ],
  },
];

// ─── Sidebar Component ────────────────────────────────────────────────────────
function DashboardSidebar({ activeId, onComingSoon }: { activeId: string; onComingSoon: () => void }) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="dash-sidebar">
      {sidebarItems.map((item) => {
        const isActive = item.id === activeId;
        const isOpen = openItem === item.id;
        const hasSubmenu = !!item.submenu;

        return (
          <div key={item.id}>
            {!hasSubmenu ? (
              <Link
                href={item.href ?? "#"}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                  border: isActive ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                  fontWeight: 500, fontSize: "0.82rem", textDecoration: "none",
                  transition: "all 0.2s ease", whiteSpace: "nowrap",
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span className="sb-label">{item.label}</span>
              </Link>
            ) : (
              <div>
                <button
                  onClick={() => toggleItem(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
                    color: "var(--text-secondary)", background: "transparent",
                    border: "1px solid transparent", fontWeight: 500,
                    fontSize: "0.82rem", cursor: "pointer", width: "100%",
                    transition: "all 0.2s ease", whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span className="sb-label" style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                  <span className="sb-arrow" style={{ marginLeft: "auto", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <ChevronDown size={13} />
                  </span>
                </button>
                <div className="sb-submenu" style={{ paddingLeft: "1.2rem" }}>
                  {isOpen && item.submenu?.map((sub) => (
                    <a
                      key={sub.label}
                      href={sub.href}
                      onClick={(e) => { e.preventDefault(); onComingSoon(); }}
                      style={{
                        display: "block", padding: "0.28rem 0.5rem", fontSize: "0.76rem",
                        color: "var(--text-secondary)", borderRadius: 8, marginBottom: 1,
                        textDecoration: "none", transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
function ProfileDropdown({ user, onComingSoon }: { user: AdyapanUser | null; onComingSoon: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItems = [
    { icon: <User size={15} />, label: "My Profile", href: "/profile/user" },
    { icon: <TrendingUp size={15} />, label: "Learning Progress", href: "#", cs: true },
    { icon: <Award size={15} />, label: "Certificates", href: "#", cs: true },
    null,
    { icon: <Settings size={15} />, label: "Settings", href: "#", cs: true },
    { icon: <CreditCard size={15} />, label: "Billing", href: "#", cs: true },
    null,
    { icon: <LogOut size={15} />, label: "Logout", href: "/" },
  ] as Array<{ icon: React.ReactNode; label: string; href: string; cs?: boolean } | null>;

  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div ref={ref} style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--primary)",
        background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
        color: "var(--primary)",
      }}>
        {initials}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280,
          borderRadius: 18, padding: "1.1rem 0.7rem", zIndex: 300,
          background: "linear-gradient(180deg,rgba(15,15,25,0.85) 0%,rgba(8,7,16,0.75) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "0 0.4rem", marginBottom: "0.9rem" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--primary)",
              background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700, fontSize: "1rem", color: "var(--primary)", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name ?? "User"}
              </div>
              <div style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email ?? "user@email.com"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "0.9rem" }}>
            {["View Community Profile", "Manage Account"].map((label) => (
              <button key={label} onClick={onComingSoon} style={{
                background: "#0d151c", color: "#fff", border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.5rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: "0.7rem" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {menuItems.map((item, i) =>
              item === null ? (
                <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.cs ? (e) => { e.preventDefault(); onComingSoon(); } : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.5rem 0.6rem", borderRadius: 8, color: "rgba(255,255,255,0.7)",
                    fontSize: "0.84rem", fontWeight: 500, textDecoration: "none", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                  }}
                >
                  <span style={{ color: "var(--primary)" }}>{item.icon}</span>
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

// ─── TopNav Component ─────────────────────────────────────────────────────────
function DashboardTopNav({
  user, theme, onThemeToggle, onComingSoon,
}: {
  user: AdyapanUser | null;
  theme: string;
  onThemeToggle: () => void;
  onComingSoon: () => void;
}) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [evaluateOpen, setEvaluateOpen] = useState(false);

  const navBtnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "0.5rem 0.9rem", borderRadius: 8, fontWeight: 600,
    fontSize: "0.8rem", cursor: "pointer", border: "1px solid var(--border-color)",
    background: "#0d151c", color: "#fff", transition: "all 0.2s ease",
  };

  const genItems = ["Notes", "Assignment", "PPT", "MCQs", "Research Paper", "Resume"];
  const evalItems = ["ATS Score", "Resume Analysis", "Skill Assessment", "Placement Readiness"];

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: 70,
      background: "#060b0e", borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem", zIndex: 105, boxSizing: "border-box",
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link href="/dashboard/user" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Image src="/assets/images/logo.png" alt="Adyapan AI" width={30} height={30} style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#fff" }}>Adyapan AI</span>
        </Link>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text" placeholder="Search tools, notes, jobs..."
            style={{
              width: 230, padding: "0.5rem 1rem 0.5rem 2rem",
              background: "#0d151c", border: "1px solid var(--border-color)",
              borderRadius: 8, color: "#fff", fontSize: "0.83rem", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Center */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ position: "relative" }}
          onMouseEnter={() => setGenerateOpen(true)}
          onMouseLeave={() => setGenerateOpen(false)}
        >
          <button style={navBtnBase}><Zap size={13} /> Generate <ChevronDown size={12} /></button>
          {generateOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 170,
              background: "#0d151c", border: "1px solid var(--border-color)",
              borderRadius: 10, padding: "0.4rem", zIndex: 200,
            }}>
              {genItems.map((item) => (
                <button key={item} onClick={onComingSoon} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.45rem 0.7rem", fontSize: "0.8rem", color: "var(--text-secondary)",
                  background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
                }}>{item}</button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onComingSoon} style={navBtnBase}><Mic size={13} /> AI Interview</button>

        <div style={{ position: "relative" }}
          onMouseEnter={() => setEvaluateOpen(true)}
          onMouseLeave={() => setEvaluateOpen(false)}
        >
          <button style={navBtnBase}><Star size={13} /> Evaluate <ChevronDown size={12} /></button>
          {evaluateOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 180,
              background: "#0d151c", border: "1px solid var(--border-color)",
              borderRadius: 10, padding: "0.4rem", zIndex: 200,
            }}>
              {evalItems.map((item) => (
                <button key={item} onClick={onComingSoon} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.45rem 0.7rem", fontSize: "0.8rem", color: "var(--text-secondary)",
                  background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
                }}>{item}</button>
              ))}
            </div>
          )}
        </div>

        <span style={{ width: 1, height: 20, background: "var(--border-color)", margin: "0 4px" }} />
        <button onClick={onComingSoon} style={{ ...navBtnBase, padding: "0.5rem 0.75rem" }}>Jobs</button>
        <button onClick={onComingSoon} style={{ ...navBtnBase, padding: "0.5rem 0.75rem" }}>Internships</button>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={onComingSoon} style={{ ...navBtnBase, color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}>
          <Crown size={13} /> Premium
        </button>
        <button onClick={onThemeToggle} aria-label="Toggle theme" style={{
          background: "#0d151c", border: "1px solid var(--border-color)", borderRadius: 8,
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-secondary)",
        }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={19} style={{ color: "var(--text-secondary)" }} />
          <span style={{
            position: "absolute", top: -5, right: -6, background: "#ef4444",
            color: "#fff", fontSize: "0.6rem", fontWeight: 800, width: 14, height: 14,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          }}>2</span>
        </div>
        <ProfileDropdown user={user} onComingSoon={onComingSoon} />
      </div>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, iconBg, iconColor, value, label,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: string; label: string;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-color)",
      borderRadius: 16, padding: "1rem", transition: "all 0.3s ease",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.01)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.2)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Profile completion calculator ───────────────────────────────────────────
function calcCompletion(p: ProfileData | null): number {
  if (!p) return 0;
  const fields = [
    p.user?.name, p.user?.email, p.phone, p.college, p.branch,
    p.year, p.skills?.length > 0 ? "yes" : "", p.linkedin, p.github, p.resumeUrl,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Input style helper ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.9rem",
  background: "#0d151c", border: "1px solid var(--border-color)",
  borderRadius: 8, color: "#fff", fontSize: "0.84rem", outline: "none",
  boxSizing: "border-box",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const [user, setUser] = useState<AdyapanUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [saving, setSaving] = useState(false);

  // Resume
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToast(true);
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      const data = res.data as ProfileData;
      setProfile(data);
      // Prefill edit fields
      setEditName(data.user?.name ?? "");
      setEditPhone(data.phone ?? "");
      setEditCollege(data.college ?? "");
      setEditBranch(data.branch ?? "");
      setEditYear(data.year ?? "");
      setEditGoal(data.careerGoal ?? "");
      setEditLinkedin(data.linkedin ?? "");
      setEditGithub(data.github ?? "");
      setEditSkills((data.skills ?? []).join(", "));
    } catch {
      // silently fail – user might not have a profile yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) setUser(JSON.parse(raw) as AdyapanUser);
    } catch { /* ignore */ }

    const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("adyapan-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/profile/me", {
        college: editCollege,
        branch: editBranch,
        phone: editPhone,
        year: editYear,
        careerGoal: editGoal,
        linkedin: editLinkedin,
        github: editGithub,
        skills: editSkills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      showToast("✅ Profile updated successfully!");
      setEditMode(false);
      await fetchProfile();
    } catch {
      showToast("❌ Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ File too large. Max size is 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      await api.post("/profile/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("✅ Resume uploaded successfully!");
      await fetchProfile();
    } catch {
      showToast("❌ Resume upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    setRemoving(true);
    try {
      await api.post("/profile/remove-resume");
      showToast("🗑️ Resume removed.");
      await fetchProfile();
    } catch {
      showToast("❌ Could not remove resume.");
    } finally {
      setRemoving(false);
    }
  };

  const completion = calcCompletion(profile);
  const initials = (profile?.user?.name ?? user?.name ?? "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const displayName = profile?.user?.name ?? user?.name ?? "User";
  const skills = profile?.skills ?? [];
  const resumeScore = profile?.atsScore ?? 78;

  const circumference = 339.3;
  const strokeDashoffset = circumference * (1 - completion / 100);

  const activityItems = [
    { label: "Profile viewed by AI Career Coach", time: "2 mins ago", color: "var(--primary)" },
    { label: "Resume score updated to " + resumeScore + "/100", time: "1 hour ago", color: "#10b981" },
    { label: "Skill gap analysis completed", time: "3 hours ago", color: "#3b82f6" },
    { label: "Mock Interview session completed", time: "Yesterday", color: "#8b5cf6" },
    { label: "Profile completion nudge sent", time: "2 days ago", color: "#ec4899" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      <DashboardTopNav user={user} theme={theme} onThemeToggle={handleThemeToggle} onComingSoon={() => showToast("🚀 Coming Soon!")} />
      <DashboardSidebar activeId="profile" onComingSoon={() => showToast("🚀 Coming Soon!")} />

      <main className="dash-main">
        {/* ── Profile Hero Banner ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(139,92,246,0.08))",
          border: "1px solid var(--border-color)", borderRadius: 20, padding: "1.8rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: "2rem", marginBottom: "1.4rem", flexWrap: "wrap",
        }}>
          {/* Left: Avatar + info */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            {/* SVG Avatar Ring */}
            <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
              <svg width="110" height="110" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
                <circle cx="55" cy="55" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="55" cy="55" r="54" fill="none"
                  stroke="var(--primary)" strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 86, height: 86, borderRadius: "50%",
                background: "rgba(245,158,11,0.12)",
                border: "2px solid rgba(245,158,11,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1.6rem", color: "var(--primary)",
              }}>
                {initials}
              </div>
            </div>

            {/* Name + badges */}
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                {displayName}
              </h1>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                {profile?.college && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: "3px 10px" }}>
                    <MapPin size={11} /> {profile.college}
                  </span>
                )}
                {profile?.branch && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 20, padding: "3px 10px" }}>
                    <BookOpen size={11} /> {profile.branch}
                  </span>
                )}
                {profile?.year && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "3px 10px" }}>
                    <GraduationCap size={11} /> {profile.year}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(245,158,11,0.12)", color: "var(--primary)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "2px 10px" }}>
                  User
                </span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: "2px 10px" }}>
                  ● Active
                </span>
              </div>
            </div>
          </div>

          {/* Right: Completion + buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", minWidth: 220 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.35rem" }}>
                <span>Profile Completion</span>
                <span>{completion}%</span>
              </div>
              <ProgressBar value={completion} height={6} />
            </div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                onClick={() => setEditMode((v) => !v)}
                style={{
                  flex: 1, padding: "0.55rem 1rem", borderRadius: 10, fontWeight: 700,
                  fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s",
                  background: editMode ? "rgba(245,158,11,0.15)" : "var(--primary)",
                  color: editMode ? "var(--primary)" : "#000",
                  border: editMode ? "1px solid rgba(245,158,11,0.4)" : "none",
                }}
              >
                {editMode ? "← Cancel" : "✏️ Edit Profile"}
              </button>
              <Link
                href="/dashboard/user"
                style={{
                  flex: 1, padding: "0.55rem 1rem", borderRadius: 10, fontWeight: 700,
                  fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s",
                  background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)", textDecoration: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.85rem", marginBottom: "1.4rem" }} className="profile-stat-grid">
          <StatCard icon={<GraduationCap size={17} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6" value="82%" label="Learning Score" />
          <StatCard icon={<FileText size={17} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6" value={`${resumeScore}/100`} label="Resume Score" />
          <StatCard icon={<Mic size={17} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981" value="3" label="Interviews Done" />
          <StatCard icon={<TrendingUp size={17} />} iconBg="rgba(245,158,11,0.1)" iconColor="var(--primary)" value="80%" label="Career Progress" />
          <StatCard icon={<ClipboardList size={17} />} iconBg="rgba(6,182,212,0.1)" iconColor="#06b6d4" value="24" label="Notes Generated" />
        </div>

        {/* ── Main Grid: Left 40% + Right 60% ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Loading profile…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "1.4rem", alignItems: "start" }} className="profile-main-grid">

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>

              {/* Personal Info / Edit Form */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 16, padding: "1.2rem",
              }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
                  {editMode ? "Edit Profile" : "Personal Info"}
                </div>

                {!editMode ? (
                  /* ── View Mode ── */
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { icon: <User size={14} />, label: "Full Name", value: profile?.user?.name },
                      { icon: <Mail size={14} />, label: "Email", value: profile?.user?.email },
                      { icon: <Phone size={14} />, label: "Phone", value: profile?.phone },
                      { icon: <MapPin size={14} />, label: "College", value: profile?.college },
                      { icon: <BookOpen size={14} />, label: "Branch", value: profile?.branch },
                      { icon: <GraduationCap size={14} />, label: "Academic Year", value: profile?.year },
                      { icon: <Target size={14} />, label: "Career Goal", value: profile?.careerGoal },
                      { icon: <Linkedin size={14} />, label: "LinkedIn", value: profile?.linkedin },
                      { icon: <Github size={14} />, label: "GitHub", value: profile?.github },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                        <span style={{ color: "var(--primary)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>{label}</div>
                          <div style={{ fontSize: "0.82rem", color: value ? "var(--text-primary)" : "var(--text-muted)" }}>
                            {value || "—"}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--primary)", marginTop: 1, flexShrink: 0 }}><Star size={14} /></span>
                      <div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Skills</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {skills.length > 0
                            ? skills.map((s) => (
                                <span key={s} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--primary)", borderRadius: 20, padding: "4px 12px", fontSize: "0.78rem" }}>{s}</span>
                              ))
                            : <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No skills added</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Edit Mode ── */
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {[
                      { label: "Full Name", value: editName, setter: setEditName, placeholder: "Your full name" },
                      { label: "Phone", value: editPhone, setter: setEditPhone, placeholder: "+91 9876543210" },
                      { label: "College", value: editCollege, setter: setEditCollege, placeholder: "College name" },
                      { label: "Branch", value: editBranch, setter: setEditBranch, placeholder: "e.g. Computer Science" },
                      { label: "Academic Year", value: editYear, setter: setEditYear, placeholder: "e.g. 3rd Year" },
                      { label: "Career Goal", value: editGoal, setter: setEditGoal, placeholder: "e.g. Software Engineer at a startup" },
                      { label: "LinkedIn URL", value: editLinkedin, setter: setEditLinkedin, placeholder: "https://linkedin.com/in/..." },
                      { label: "GitHub URL", value: editGithub, setter: setEditGithub, placeholder: "https://github.com/..." },
                      { label: "Skills (comma-separated)", value: editSkills, setter: setEditSkills, placeholder: "React, Node.js, Python" },
                    ].map(({ label, value, setter, placeholder }) => (
                      <div key={label}>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder={placeholder}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{
                        marginTop: "0.4rem", padding: "0.65rem", borderRadius: 10,
                        background: "var(--primary)", color: "#000", fontWeight: 700,
                        fontSize: "0.85rem", border: "none", cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.7 : 1, transition: "all 0.2s",
                      }}
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>

              {/* Resume Card */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 16, padding: "1.2rem",
              }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
                  Resume
                </div>

                {profile?.resumeUrl ? (
                  /* Resume exists */
                  <div>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)",
                      borderRadius: 12, padding: "0.9rem 1rem", marginBottom: "0.8rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={16} style={{ color: "#3b82f6" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            {profile.resumeFilename ?? "resume.pdf"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {profile.resumeSize ? `${(profile.resumeSize / 1024).toFixed(0)} KB` : "PDF file"}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: "3px 10px" }}>
                        ATS: {resumeScore}/100
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                      <a
                        href={`http://localhost:5000${profile.resumeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "0.55rem", borderRadius: 10, fontWeight: 700, fontSize: "0.8rem",
                          background: "rgba(59,130,246,0.1)", color: "#3b82f6",
                          border: "1px solid rgba(59,130,246,0.25)", textDecoration: "none",
                        }}
                      >
                        <Download size={14} /> Download
                      </a>
                      <button
                        onClick={handleRemoveResume}
                        disabled={removing}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "0.55rem", borderRadius: 10, fontWeight: 700, fontSize: "0.8rem",
                          background: "rgba(239,68,68,0.08)", color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer",
                          opacity: removing ? 0.7 : 1,
                        }}
                      >
                        <Trash2 size={14} /> {removing ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No resume */
                  <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.8rem" }}>
                      <Upload size={22} style={{ color: "var(--primary)" }} />
                    </div>
                    <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>No resume uploaded yet</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "0.6rem 1.4rem", borderRadius: 10, fontWeight: 700,
                        fontSize: "0.82rem", cursor: "pointer",
                        background: "var(--primary)", color: "#000", border: "none",
                      }}
                    >
                      Upload Resume
                    </button>
                  </div>
                )}

                {/* Upload form (always available below existing resume too) */}
                <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    {profile?.resumeUrl ? "Replace resume:" : "Upload your resume (PDF/DOCX, max 5 MB):"}
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeUpload(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "0.5rem 1rem", borderRadius: 10, fontWeight: 600,
                        fontSize: "0.8rem", cursor: uploading ? "not-allowed" : "pointer",
                        background: "rgba(245,158,11,0.08)", color: "var(--primary)",
                        border: "1px solid rgba(245,158,11,0.25)", opacity: uploading ? 0.7 : 1,
                      }}
                    >
                      <Upload size={13} /> {uploading ? "Uploading…" : "Choose File"}
                    </button>
                    {uploading && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Uploading…</span>}
                  </div>
                </div>
              </div>

              {/* Skills Visualization */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 16, padding: "1.2rem",
              }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
                  Skills
                </div>
                {skills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.3)",
                          color: "var(--primary)",
                          borderRadius: 20,
                          padding: "4px 12px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
                    No skills added yet. Edit your profile to add skills.
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 16, padding: "1.2rem",
              }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
                  Recent Activity
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {activityItems.map((item) => (
                    <div key={item.label} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", background: item.color,
                        boxShadow: `0 0 5px ${item.color}`, marginTop: 5, flexShrink: 0,
                      }} />
                      <div>
                        <p style={{ fontSize: "0.77rem", fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</p>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {toast && <Toast message={toastMsg} onClose={() => setToast(false)} />}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .profile-stat-grid {
          grid-template-columns: repeat(5, 1fr);
        }
        .profile-main-grid {
          grid-template-columns: 2fr 3fr;
        }
        @media (max-width: 1100px) {
          .profile-stat-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .profile-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .profile-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
