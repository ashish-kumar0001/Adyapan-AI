"use client";

import { SocketProvider } from "@/context/SocketContext";
import { useState, useEffect, useRef } from "react";
import { clearAuthSession } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/services/api";
import Link from "next/link";
import Image from "next/image";
import { ResumeTemplateMarketplace } from "@/components/resume-hub/ResumeTemplateMarketplace";
import { ResumeBuilderView } from "@/components/resume-hub/ResumeBuilderView";
import { AtsCheckerView } from "@/components/resume-hub/AtsCheckerView";
import { ResumeAnalyzerView } from "@/components/resume-hub/ResumeAnalyzerView";
import { CoverLetterView } from "@/components/resume-hub/CoverLetterView";
import { LinkedInView } from "@/components/resume-hub/LinkedInView";
import { StudyAssistantView } from "@/components/learning-hub/StudyAssistantView";
import { NotesGeneratorView } from "@/components/learning-hub/NotesGeneratorView";
import { QuizGeneratorView } from "@/components/learning-hub/QuizGeneratorView";
import { AssignmentGeneratorView } from "@/components/learning-hub/AssignmentGeneratorView";
import { PptGeneratorView } from "@/components/learning-hub/PptGeneratorView";
import { MindMapsView } from "@/components/learning-hub/MindMapsView";
import { CodingAssistantView } from "@/components/coding-hub/CodingAssistantView";
import { DsaPracticeView } from "@/components/coding-hub/DsaPracticeView";
import { CodingChallengesView } from "@/components/coding-hub/CodingChallengesView";
import { GithubPortfolioView } from "@/components/coding-hub/GithubPortfolioView";
import type { ResumeHubViewType } from "@/types/resume";
import {
  Search, Crown, Bell, ChevronDown, Menu,
  User, LogOut, Settings, CreditCard, TrendingUp, Award,
  BookOpen, Code2, FileText, Mic,
  Briefcase, UserCircle, BarChart3, Wand2, GraduationCap,
  LayoutDashboard, Sun, Moon, TrendingDown, ArrowUpRight,
  BookMarked, ClipboardList,
  Star, Zap,
  LineChart, Trophy, MessageCircle,
  Target, Globe, Edit3, Save, X,
  Upload, Download, Trash2, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdyapanUser {
  name: string;
  email: string;
  role?: string;
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
        background: "rgba(245,158,11,0.15)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "#f59e0b",
        border: "1px solid rgba(245,158,11,0.35)",
        padding: "12px 22px", borderRadius: 14,
        boxShadow: "0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        fontSize: "0.88rem", fontWeight: 600,
        animation: "fadeInUp 0.3s ease",
      }}
    >
      {message}
    </div>
  );
}

// ─── Sidebar Data ─────────────────────────────────────────────────────────────
const sidebarItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/dashboard/user" },
  {
    id: "learning", label: "Learning Hub", icon: <GraduationCap size={18} />,
    submenu: [
      { label: "Study Assistant", href: "#" },
      { label: "Notes Generator", href: "#" },
      { label: "Quiz Generator", href: "#" },
      { label: "Assignment Generator", href: "#" },
      { label: "PPT Generator", href: "#" },
      { label: "Mind Maps", href: "#" },
    ],
  },
  {
    id: "coding", label: "Coding Hub", icon: <Code2 size={18} />,
    submenu: [
      { label: "Coding Assistant", href: "#" },
      { label: "DSA Practice", href: "#" },
      { label: "Coding Challenges", href: "#" },
      { label: "GitHub Portfolio Builder", href: "#" },
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
function DashboardSidebar({ onComingSoon, activeView, onViewDashboard, onViewTool, sidebarOpen, setSidebarOpen }: {
  onComingSoon: () => void;
  activeView: string;
  onViewDashboard: () => void;
  onViewTool: (tool: ResumeHubViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  return (
    <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* Mobile close button */}
      <div className="mobile-close-btn" style={{ display: "none", justifyContent: "flex-end", padding: "0.5rem 0.5rem 0" }}>
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 4, color: "var(--text-secondary)",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Dashboard */}
      <button
        onClick={() => {
          onViewDashboard();
          setSidebarOpen(false);
        }}
        style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.55rem 0.5rem", borderRadius: 12, marginBottom: 2,
          color: activeView === "dashboard" ? "var(--primary)" : "var(--text-secondary)",
          background: activeView === "dashboard" ? "rgba(245,158,11,0.1)" : "transparent",
          border: activeView === "dashboard" ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
          fontWeight: 500, fontSize: "0.82rem", cursor: "pointer", width: "100%",
          textAlign: "left", whiteSpace: "nowrap",
        }}
      >
        <span style={{ flexShrink: 0 }}><LayoutDashboard size={18} /></span>
        <span className="sb-label">Dashboard</span>
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border-color)", margin: "0.5rem 0.3rem 0.7rem" }} />

      {/* Hub items (skip dashboard since it's a top button) */}
      {sidebarItems.filter(item => item.id !== "dashboard").map((item) => {
        const isOpen = openItem === item.id;
        return (
          <div key={item.id} className={isOpen ? "sb-item open" : "sb-item"}>
            <button
              onClick={() => {
                toggleItem(item.id);
                if (item.id === "resume") {
                  onViewTool("resume-hub");
                  setSidebarOpen(false);
                }
              }}
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
            {/* Submenu: visible when open AND sidebar is hovered */}
            {isOpen && (
              <div className="sb-submenu" style={{ paddingLeft: "1.2rem" }}>
                {item.submenu?.map((sub) => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (sub.label === "Resume Builder") onViewTool("resume-hub");
                      else if (sub.label === "ATS Score Checker") onViewTool("ats-checker");
                      else if (sub.label === "Resume Analyzer") onViewTool("resume-analyzer");
                      else if (sub.label === "Cover Letter Generator") onViewTool("cover-letter");
                      else if (sub.label === "LinkedIn Optimizer") onViewTool("linkedin-optimizer");
                      else if (sub.label === "Study Assistant") onViewTool("study-assistant");
                      else if (sub.label === "Notes Generator") onViewTool("notes-generator");
                      else if (sub.label === "Quiz Generator") onViewTool("quiz-generator");
                      else if (sub.label === "Assignment Generator") onViewTool("assignment-generator");
                      else if (sub.label === "PPT Generator") onViewTool("ppt-generator");
                      else if (sub.label === "Mind Maps") onViewTool("mind-maps");
                      else if (sub.label === "Coding Assistant") onViewTool("coding-assistant");
                      else if (sub.label === "DSA Practice") onViewTool("dsa-practice");
                      else if (sub.label === "Coding Challenges") onViewTool("coding-challenges");
                      else if (sub.label === "GitHub Portfolio Builder") onViewTool("github-portfolio");
                      else onComingSoon();
                      setSidebarOpen(false);
                    }}
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
            )}
          </div>
        );
      })}
    </aside>
  );
}

// ─── TopNav Component ─────────────────────────────────────────────────────────
function DashboardTopNav({
  user, theme, onThemeToggle, onComingSoon, onViewProfile, onAdyChat, onViewTool, onMenuToggle,
}: {
  user: AdyapanUser | null;
  theme: string;
  onThemeToggle: () => void;
  onComingSoon: () => void;
  onViewProfile: () => void;
  onAdyChat: () => void;
  onViewTool: (tool: ResumeHubViewType) => void;
  onMenuToggle: () => void;
}) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Resume ATS Score updated to 78%", time: "3 hours ago", read: false },
    { id: 2, text: "New DSA Practice question is available", time: "5 hours ago", read: false },
    { id: 3, text: "Assignment Generator completed successfully", time: "Yesterday", read: true },
  ]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDarkTheme = theme === "dark";
  const navBg = isDarkTheme ? "#060b0e" : "#ffffff";
  const navBtnBg = isDarkTheme ? "#0d151c" : "rgba(0,0,0,0.04)";
  const navBtnColor = isDarkTheme ? "#fff" : "#0f172a";
  const navInputBg = isDarkTheme ? "#0d151c" : "rgba(0,0,0,0.05)";
  const navInputColor = isDarkTheme ? "#fff" : "#0f172a";
  const navBorder = isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const dropdownBg = isDarkTheme ? "#0d151c" : "#ffffff";

  const navBtnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "0.5rem 0.9rem", borderRadius: 8, fontWeight: 600,
    fontSize: "0.8rem", cursor: "pointer", border: `1px solid ${navBorder}`,
    background: navBtnBg, color: navBtnColor, transition: "all 0.2s ease",
  };

  const genItems = ["Notes", "Assignment", "PPT", "Quiz", "Research Paper", "Resume"];
  const evalItems = ["ATS Score", "Resume Analysis", "Skill Assessment", "Placement Readiness"];

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: 70,
      background: navBg, borderBottom: `1px solid ${navBorder}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1rem", zIndex: 105, boxSizing: "border-box",
      transition: "background 0.3s ease",
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="mobile-menu-btn"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            display: "none", alignItems: "center", justifyContent: "center",
            padding: 4, color: navBtnColor, marginRight: 2,
          }}
        >
          <Menu size={20} />
        </button>

        <Link href="/dashboard/user" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Image src="/assets/logo.png" alt="Adyapan AI" width={30} height={30} style={{ borderRadius: "50%" }} />
          <span style={{ fontWeight: 700, fontSize: "1.15rem", color: navBtnColor }}>Adyapan AI</span>
        </Link>
        <div className="desktop-search" style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text" placeholder="Search tools, notes, jobs..."
            style={{
              width: 230, padding: "0.5rem 1rem 0.5rem 2rem",
              background: navInputBg, border: `1px solid ${navBorder}`,
              borderRadius: 8, color: navInputColor, fontSize: "0.83rem", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Center */}
      <div className="desktop-nav-center" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Generate dropdown */}
        <div style={{ position: "relative" }}
          onMouseEnter={() => setGenerateOpen(true)}
          onMouseLeave={() => setGenerateOpen(false)}
        >
          <button style={navBtnBase}>
            <Zap size={13} /> Generate <ChevronDown size={12} />
          </button>
          {generateOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 170,
              background: dropdownBg, border: `1px solid ${navBorder}`,
              borderRadius: 10, padding: "0.4rem", zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}>
              {genItems.map((item) => (
                <button key={item} onClick={() => {
                  if (item === "Resume") onViewTool("resume-builder");
                  else if (item === "Notes") onViewTool("notes-generator");
                  else if (item === "Assignment") onViewTool("assignment-generator");
                  else if (item === "PPT") onViewTool("ppt-generator");
                  else if (item === "Quiz") onViewTool("quiz-generator");
                  else onComingSoon();
                }} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.45rem 0.7rem", fontSize: "0.8rem", color: "var(--text-secondary)",
                  background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
                }}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onComingSoon} style={navBtnBase}>
          <Mic size={13} /> AI Interview
        </button>

        {/* Evaluate dropdown */}
        <div style={{ position: "relative" }}
          onMouseEnter={() => setEvaluateOpen(true)}
          onMouseLeave={() => setEvaluateOpen(false)}
        >
          <button style={navBtnBase}>
            <Star size={13} /> Evaluate <ChevronDown size={12} />
          </button>
          {evaluateOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 180,
              background: dropdownBg, border: `1px solid ${navBorder}`,
              borderRadius: 10, padding: "0.4rem", zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}>
              {evalItems.map((item) => (
                <button key={item} onClick={() => {
                  if (item === "ATS Score") onViewTool("ats-checker");
                  else if (item === "Resume Analysis") onViewTool("resume-analyzer");
                  else onComingSoon();
                }} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.45rem 0.7rem", fontSize: "0.8rem", color: "var(--text-secondary)",
                  background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
                }}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <span style={{ width: 1, height: 20, background: "var(--border-color)", margin: "0 4px" }} />
        <button onClick={onComingSoon} style={{ ...navBtnBase, padding: "0.5rem 0.75rem" }}>Jobs</button>
        <button onClick={onComingSoon} style={{ ...navBtnBase, padding: "0.5rem 0.75rem" }}>Internships</button>
        <span style={{ width: 1, height: 20, background: "var(--border-color)", margin: "0 4px" }} />
        <button
          onClick={onAdyChat}
          style={{
            ...navBtnBase,
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(245,158,11,0.2))",
            border: "1px solid rgba(139,92,246,0.4)",
            color: "#c4b5fd",
            fontWeight: 700,
          }}
        >
          <MessageCircle size={13} /> Ady Chat
        </button>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button className="desktop-premium" onClick={onComingSoon} style={{ ...navBtnBase, color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}>
          <Crown size={13} /> Premium
        </button>

        {/* Theme toggle */}
        <button onClick={onThemeToggle} aria-label="Toggle theme" style={{
          background: navBtnBg, border: `1px solid ${navBorder}`, borderRadius: 8,
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-secondary)",
        }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {/* Notification bell */}
        <div ref={notificationsRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotificationsOpen(prev => !prev)}
            aria-label="Notifications"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 4, position: "relative", color: "var(--text-secondary)",
              outline: "none",
            }}
          >
            <Bell size={19} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={{
                position: "absolute", top: 0, right: 0, background: "#ef4444",
                color: "#fff", fontSize: "0.6rem", fontWeight: 800, width: 14, height: 14,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 10, minWidth: 280,
              background: dropdownBg, border: `1px solid ${navBorder}`,
              borderRadius: 12, padding: "0.8rem", zIndex: 200,
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", borderBottom: `1px solid ${navBorder}`, paddingBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: navBtnColor }}>Notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <button
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "240px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.45rem", borderRadius: 8, background: n.read ? "transparent" : "rgba(245,158,11,0.05)", border: `1px solid ${n.read ? "transparent" : "rgba(245,158,11,0.15)"}` }}>
                      {!n.read && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", marginTop: 6, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: n.read ? 500 : 600, lineHeight: 1.3 }}>{n.text}</p>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div style={{ borderTop: `1px solid ${navBorder}`, paddingTop: "0.5rem", marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setNotifications([])}
                    style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Profile dropdown */}
        <ProfileDropdown user={user} onComingSoon={onComingSoon} theme={theme} onViewProfile={onViewProfile} />
      </div>
    </header>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
function ProfileDropdown({ user, onComingSoon, theme, onViewProfile }: { user: AdyapanUser | null; onComingSoon: () => void; theme: string; onViewProfile: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDarkTheme = theme === "dark";
  const dropdownBg = isDarkTheme ? "#0f0f19" : "#ffffff";
  const dropdownBorder = isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const menuItems = [
    { icon: <User size={15} />, label: "My Profile", href: "#", onClickFn: onViewProfile },
    { icon: <TrendingUp size={15} />, label: "Learning Progress", href: "#", cs: true },
    { icon: <Award size={15} />, label: "Certificates", href: "#", cs: true },
    null,
    { icon: <Settings size={15} />, label: "Settings", href: "#", cs: true },
    { icon: <CreditCard size={15} />, label: "Billing", href: "#", cs: true },
    null,
    { icon: <LogOut size={15} />, label: "Logout", href: "/login", onClickFn: () => { clearAuthSession(); window.location.href = "/login"; } },
  ] as Array<{ icon: React.ReactNode; label: string; href: string; cs?: boolean; onClickFn?: () => void } | null>;

  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div ref={ref} style={{ position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
          position: "absolute", top: "calc(100% + 4px)", right: 0, width: 280,
          borderRadius: 18, paddingTop: "0.4rem", zIndex: 300,
        }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{
            borderRadius: 18, padding: "1.1rem 0.7rem",
            background: dropdownBg,
            backdropFilter: "blur(40px) saturate(180%)",
            border: `1px solid ${dropdownBorder}`,
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}>
          {/* User header */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "0 0.4rem", marginBottom: "0.9rem" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--primary)",
              background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700, fontSize: "1rem", color: "var(--primary)", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: isDarkTheme ? "#fff" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name ?? "User"}
              </div>
              <div style={{ fontSize: "0.73rem", color: isDarkTheme ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email ?? "user@email.com"}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "0.9rem" }}>
            {["View Community Profile", "Manage Account"].map((label) => (
              <button key={label} onClick={onComingSoon} style={{
                background: isDarkTheme ? "#0d151c" : "#f1f5f9",
                color: isDarkTheme ? "#fff" : "#0f172a",
                border: `1px solid ${isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                padding: "0.5rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", marginBottom: "0.7rem" }} />

          {/* Menu items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {menuItems.map((item, i) =>
              item === null ? (
                <div key={i} style={{ height: 1, background: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", margin: "4px 0" }} />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClickFn ? (e) => { e.preventDefault(); setOpen(false); item.onClickFn!(); } : item.cs ? (e) => { e.preventDefault(); onComingSoon(); } : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.5rem 0.6rem", borderRadius: 8,
                    color: isDarkTheme ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)",
                    fontSize: "0.84rem", fontWeight: 500, textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
                    (e.currentTarget as HTMLElement).style.color = isDarkTheme ? "#fff" : "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = isDarkTheme ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)";
                  }}
                >
                  <span style={{ color: "var(--primary)" }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Widget Card ─────────────────────────────────────────────────────────
function StatCard({
  icon, iconBg, iconColor, value, label, trend, trendUp,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: string; label: string; trend: string; trendUp?: boolean;
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
        <span style={{
          fontSize: "0.72rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
          color: trendUp === false ? "#ef4444" : trendUp ? "#10b981" : "var(--text-muted)",
        }}>
          {trendUp === true && <ArrowUpRight size={11} />}
          {trendUp === false && <TrendingDown size={11} />}
          {trend}
        </span>
      </div>
      <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Panel Card ───────────────────────────────────────────────────────────────
function PanelCard({ title, children, flagStyle }: { title: string; children: React.ReactNode; flagStyle?: boolean }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: `1px solid ${flagStyle ? "rgba(245,158,11,0.15)" : "var(--border-color)"}`,
      borderRadius: 16, padding: "1.2rem", transition: "all 0.25s ease",
      boxShadow: flagStyle ? "0 4px 20px rgba(245,158,11,0.05)" : "none",
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "none";
        (e.currentTarget as HTMLElement).style.boxShadow = flagStyle ? "0 4px 20px rgba(245,158,11,0.05)" : "none";
      }}
    >
      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
        {title}
      </div>
      {children}
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

// ─── Compact List Item ────────────────────────────────────────────────────────
function CompactItem({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: "0.78rem", color: "var(--text-secondary)",
      borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.42rem", marginBottom: "0.42rem",
    }}>
      <span>{label}</span>
      <strong style={{ color: highlight ? "var(--primary)" : "var(--text-primary)" }}>{value}</strong>
    </div>
  );
}
// ─── Welcome Banner ───────────────────────────────────────────────────────────
function WelcomeBanner({
  user,
  targetRole,
  profileCompletion,
  onStartStudy,
  onBuildResume,
  onPracticeDsa
}: {
  user: AdyapanUser | null;
  targetRole: string;
  profileCompletion: number;
  onStartStudy: () => void;
  onBuildResume: () => void;
  onPracticeDsa: () => void;
}) {
  const [greeting, setGreeting] = useState("Good Morning");
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good Morning");
    else if (hr < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const btnBase: React.CSSProperties = {
    padding: "0.52rem 1rem", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s ease",
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(139,92,246,0.1))",
      border: "1px solid var(--border-color)", borderRadius: 18, padding: "1.5rem",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: "1.5rem", marginBottom: "1.2rem", flexWrap: "wrap",
    }}>
      <div>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
          {greeting}, {user?.name ?? "User"} 👋
        </h1>
        <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "0.9rem" }}>
          {targetRole ? (
            <>Continue your learning journey as a <strong style={{ color: "var(--primary)" }}>{targetRole}</strong>.</>
          ) : (
            "Continue your learning journey and build your professional profile."
          )}
        </p>
        <div style={{ maxWidth: 280 }}>
          <div style={{ fontSize: "0.77rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.35rem" }}>
            Profile Completion: {profileCompletion}%
          </div>
          <ProgressBar value={profileCompletion} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
        <button onClick={onStartStudy} style={{ ...btnBase, background: "var(--primary)", color: "#000", border: "none" }}>
          Start Study Session
        </button>
        <button onClick={onBuildResume} style={{ ...btnBase, background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
          Build Resume
        </button>
        <button onClick={onPracticeDsa} style={{ ...btnBase, background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
          Practice DSA
        </button>
      </div>
    </div>
  );
}

// ─── Stat Cards Grid ──────────────────────────────────────────────────────────
function StatCardsGrid({ stats }: { stats: any }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "0.85rem", marginBottom: "1.2rem",
    }}
      className="stat-grid-responsive"
    >
      <StatCard icon={<FileText size={17} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6" value={`${stats.avgAtsScore}%`} label="Avg Resume ATS" trend={stats.resumesCount > 0 ? `${stats.resumesCount} Resumes` : "No resumes"} />
      <StatCard icon={<BarChart3 size={17} />} iconBg="rgba(236,72,153,0.1)" iconColor="#ec4899" value={`${stats.avgLinkedinScore}%`} label="Avg LinkedIn Score" trend={stats.avgLinkedinScore > 0 ? "Optimized" : "Not optimized"} />
      <StatCard icon={<Code2 size={17} />} iconBg="rgba(245,158,11,0.1)" iconColor="var(--primary)" value={String(stats.dsaSolved)} label="DSA Problems Solved" trend={stats.dsaStreak > 0 ? `${stats.dsaStreak} Day Streak 🔥` : "No active streak"} trendUp={stats.dsaStreak > 0} />
      <StatCard icon={<GraduationCap size={17} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6" value={String(stats.studySessionsCount)} label="Study Sessions" trend={`${stats.notesCount + stats.quizzesCount} Assets Gen`} />
    </div>
  );
}
// ─── 3-Column Panel Grid ──────────────────────────────────────────────────────
function PanelGrid({ stats, onViewTool }: { stats: any; onViewTool: (v: any) => void }) {
  const quickActions = [
    { label: "Study Assistant", icon: <GraduationCap size={16} />, color: "#8b5cf6", target: "study-assistant" },
    { label: "DSA Practice", icon: <Code2 size={16} />, color: "var(--primary)", target: "dsa-practice" },
    { label: "Resume Builder", icon: <FileText size={16} />, color: "#3b82f6", target: "resume-hub" },
    { label: "ATS Checker", icon: <BarChart3 size={16} />, color: "#10b981", target: "ats-checker" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.2rem", alignItems: "start" }}
      className="panel-grid-responsive"
    >
      {/* Column 1: Learning Hub */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <PanelCard title="Learning Hub Performance">
          <div style={{ marginBottom: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: 4 }}>
              <span>Learning Progress</span>
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                {stats.studySessionsCount > 0 ? "Active" : "Not Started"}
              </span>
            </div>
            <ProgressBar value={stats.studySessionsCount > 0 ? 100 : 0} color="#8b5cf6" />
          </div>
          <div style={{ marginTop: "0.9rem" }}>
            <CompactItem label="Study Sessions" value={stats.studySessionsCount} />
            <CompactItem label="Notes Generated" value={stats.notesCount} />
            <CompactItem label="Quizzes Created" value={stats.quizzesCount} />
            <CompactItem label="Assignments Created" value={stats.assignmentsCount} />
            <CompactItem label="PPTs Generated" value={stats.pptsCount} />
            <CompactItem label="Mind Maps Built" value={stats.mindmapsCount} />
          </div>
        </PanelCard>
      </div>

      {/* Column 2: Coding Hub */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <PanelCard title="Coding Hub Performance">
          <div style={{ marginBottom: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: 4 }}>
              <span>DSA Accuracy</span>
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>{Math.round(stats.dsaAccuracy * 100)}%</span>
            </div>
            <ProgressBar value={Math.round(stats.dsaAccuracy * 100)} color="var(--primary)" />
          </div>
          <div style={{ marginTop: "0.9rem" }}>
            <CompactItem label="DSA Problems Solved" value={stats.dsaSolved} highlight />
            <CompactItem label="Current Streak" value={`${stats.dsaStreak} days`} />
            <CompactItem label="AI Coding Chats" value={stats.codingSessionsCount} />
            <CompactItem label="Coding Challenges" value={stats.challengesCount} />
          </div>
        </PanelCard>
      </div>

      {/* Column 3: Resume Hub & Quick Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <PanelCard title="Resume Hub Performance">
          <div style={{ marginTop: "0.4rem" }}>
            <CompactItem label="Resumes Created" value={stats.resumesCount} />
            <CompactItem label="Cover Letters" value={stats.coverLettersCount} />
            <CompactItem label="Average ATS Score" value={`${stats.avgAtsScore}%`} highlight />
            <CompactItem label="Average LinkedIn Score" value={`${stats.avgLinkedinScore}%`} highlight />
          </div>
        </PanelCard>

        <PanelCard title="Quick Actions">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onViewTool(action.target as any)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6rem", border: "1px solid var(--border-color)",
                  borderRadius: 8, background: "transparent", color: "var(--text-secondary)",
                  fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = action.color;
                  (e.currentTarget as HTMLElement).style.color = action.color;
                  (e.currentTarget as HTMLElement).style.background = `${action.color}0d`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                <span style={{ color: action.color }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
// ─── Profile Types & Helpers ──────────────────────────────────────────────────
interface ProfileData {
  user: { id: string; name: string; email: string; role: string; };
  username?: string; phone?: string; location?: string; aboutMe?: string;
  college?: string; branch?: string; degree?: string; year?: string;
  graduationYear?: string; skills: string[]; interestedDomains: string[];
  targetRole?: string; careerGoal?: string; careerObjective?: string;
  linkedin?: string; github?: string; portfolio?: string;
  resumeUrl?: string; resumeName?: string;
}
const DOMAINS = ["Artificial Intelligence","Machine Learning","Data Science","Cybersecurity","Web Development","Cloud Computing","Digital Marketing","UI/UX Design"];
function calcCompletion(p: ProfileData | null): number {
  if (!p) return 0;
  const fields = [p.user?.name,p.user?.email,p.username,p.phone,p.location,p.aboutMe,p.college,p.branch,p.degree,p.graduationYear,p.skills?.length>0?"y":"",p.interestedDomains?.length>0?"y":"",p.targetRole,p.careerObjective,p.linkedin,p.github,p.resumeUrl];
  return Math.round((fields.filter(Boolean).length/fields.length)*100);
}
function ProfileProgressBar({ value }: { value: number }) {
  return <div style={{height:6,width:"100%",background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${value}%`,background:"var(--primary)",borderRadius:3,transition:"width 1s ease"}} /></div>;
}
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:16,padding:"1.4rem",marginBottom:"1.2rem"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1.1rem"}}><span style={{color:"var(--primary)"}}>{icon}</span><h3 style={{fontSize:"0.95rem",fontWeight:700,color:"var(--text-primary)",margin:0}}>{title}</h3></div>{children}</div>;
}
function FieldRow({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return <div style={{marginBottom:"0.8rem"}}><div style={{fontSize:"0.72rem",fontWeight:600,color:"var(--text-muted)",marginBottom:3,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>{label}</div><div style={{fontSize:"0.88rem",color:value?"var(--text-primary)":"var(--text-muted)",fontWeight:value?500:400}}>{value||placeholder||"—"}</div></div>;
}
function ProfileFormInput({ label, value, onChange, placeholder, type="text", hint }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; hint?:string }) {
  return <div style={{marginBottom:"0.9rem"}}><label style={{display:"block",fontSize:"0.76rem",fontWeight:600,color:"var(--text-secondary)",marginBottom:4,textTransform:"uppercase" as const,letterSpacing:"0.04em"}}>{label}</label>{hint&&<div style={{fontSize:"0.71rem",color:"var(--text-muted)",marginBottom:4}}>{hint}</div>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"0.58rem 0.85rem",background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:8,color:"var(--text-primary)",fontSize:"0.84rem",outline:"none",boxSizing:"border-box" as const}} onFocus={e=>(e.currentTarget.style.borderColor="var(--primary)")} onBlur={e=>(e.currentTarget.style.borderColor="var(--border-color)")} /></div>;
}
function ProfileFormTextarea({ label, value, onChange, placeholder, hint }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; hint?:string }) {
  return <div style={{marginBottom:"0.9rem"}}><label style={{display:"block",fontSize:"0.76rem",fontWeight:600,color:"var(--text-secondary)",marginBottom:4,textTransform:"uppercase" as const,letterSpacing:"0.04em"}}>{label}</label>{hint&&<div style={{fontSize:"0.71rem",color:"var(--text-muted)",marginBottom:4}}>{hint}</div>}<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{width:"100%",padding:"0.58rem 0.85rem",background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:8,color:"var(--text-primary)",fontSize:"0.84rem",outline:"none",boxSizing:"border-box" as const,resize:"vertical"}} onFocus={e=>(e.currentTarget.style.borderColor="var(--primary)")} onBlur={e=>(e.currentTarget.style.borderColor="var(--border-color)")} /></div>;
}

// ─── Profile View (inline, no nav/sidebar) ───────────────────────────────────
function ProfileView({ onViewDashboard }: { onViewDashboard: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileToast, setProfileToast] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState({ username:"",phone:"",location:"",aboutMe:"",college:"",branch:"",degree:"",graduationYear:"",skills:"",interestedDomains:[] as string[],targetRole:"",careerObjective:"",linkedin:"",github:"",portfolio:"" });
  const setField = (key: keyof typeof f) => (val: string) => setF(p => ({...p,[key]:val}));
  const populate = (data: ProfileData) => setF({ username:data.username??"",phone:data.phone??"",location:data.location??"",aboutMe:data.aboutMe??"",college:data.college??"",branch:data.branch??"",degree:data.degree??"",graduationYear:data.graduationYear??"",skills:(data.skills??[]).join(", "),interestedDomains:data.interestedDomains??[],targetRole:data.targetRole??"",careerObjective:data.careerObjective??"",linkedin:data.linkedin??"",github:data.github??"",portfolio:data.portfolio??"" });
  const fetchProfile = async () => { try { const res = await api.get("/profile/me"); const data = res.data.profile as ProfileData; setProfile(data); populate(data); } catch {/**/} finally { setLoading(false); } };
  useEffect(() => { fetchProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const handleSave = async () => { setSaving(true); try { await api.put("/profile/me",{...f,skills:f.skills.split(",").map(s=>s.trim()).filter(Boolean)}); setProfileToast("✅ Profile updated!"); setEditMode(false); await fetchProfile(); } catch { setProfileToast("❌ Failed to save."); } finally { setSaving(false); } };
  const handleResume = async (file: File) => { if(file.size>5*1024*1024){setProfileToast("❌ Max 5MB.");return;} setUploading(true); try { const fd=new FormData();fd.append("resume",file); await api.post("/profile/upload-resume",fd,{headers:{"Content-Type":"multipart/form-data"}}); setProfileToast("✅ Resume uploaded!"); await fetchProfile(); } catch { setProfileToast("❌ Upload failed."); } finally { setUploading(false); } };
  const handleRemoveResume = async () => { try { await api.post("/profile/remove-resume"); setProfileToast("🗑️ Resume removed."); await fetchProfile(); } catch { setProfileToast("❌ Could not remove."); } };
  const toggleDomain = (d: string) => setF(p => ({...p,interestedDomains:p.interestedDomains.includes(d)?p.interestedDomains.filter(x=>x!==d):[...p.interestedDomains,d]}));
  const completion = calcCompletion(profile);
  const displayName = profile?.user?.name ?? "User";
  const initials = displayName.split(" ").map((n:string)=>n[0]).join("").toUpperCase().slice(0,2);
  const skills = profile?.skills??[];
  const domains = profile?.interestedDomains??[];
  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300,color:"var(--text-muted)"}}>Loading profile…</div>;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",flexWrap:"wrap",gap:"0.75rem"}}>
        <div><p style={{fontSize:"0.78rem",color:"var(--primary)",fontWeight:600,marginBottom:2}}>USER PROFILE</p><h1 style={{fontSize:"1.4rem",fontWeight:800,color:"var(--text-primary)",margin:0}}>{displayName}</h1></div>
        <div style={{display:"flex",gap:"0.6rem"}}>
          {editMode ? (<><button onClick={()=>setEditMode(false)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0.5rem 1rem",borderRadius:8,fontSize:"0.82rem",fontWeight:600,cursor:"pointer",background:"transparent",border:"1px solid var(--border-color)",color:"var(--text-secondary)"}}><X size={14}/> Cancel</button><button onClick={handleSave} disabled={saving} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0.5rem 1rem",borderRadius:8,fontSize:"0.82rem",fontWeight:700,cursor:"pointer",background:"var(--primary)",border:"none",color:"#000",opacity:saving?0.65:1}}><Save size={14}/> {saving?"Saving…":"Save Changes"}</button></>) : (<button onClick={()=>setEditMode(true)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0.5rem 1rem",borderRadius:8,fontSize:"0.82rem",fontWeight:700,cursor:"pointer",background:"var(--primary)",border:"none",color:"#000"}}><Edit3 size={14}/> Edit Profile</button>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:"1.2rem",alignItems:"start"}} className="profile-grid">
        <div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:16,padding:"1.5rem",marginBottom:"1rem",textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:"50%",border:"3px solid var(--primary)",background:"rgba(245,158,11,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"1.8rem",color:"var(--primary)",margin:"0 auto 0.85rem"}}>{initials}</div>
            <div style={{fontWeight:800,fontSize:"1.05rem",color:"var(--text-primary)",marginBottom:2}}>{displayName}</div>
            <div style={{fontSize:"0.78rem",color:"var(--text-muted)",marginBottom:"0.4rem"}}>{profile?.user?.email}</div>
            {profile?.targetRole&&<div style={{fontSize:"0.78rem",color:"var(--primary)",fontWeight:600,marginBottom:"1rem"}}>{profile.targetRole}</div>}
            <div style={{marginTop:"0.85rem"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"0.76rem",marginBottom:4}}><span style={{color:"var(--text-secondary)"}}>Profile Completion</span><span style={{color:"var(--primary)",fontWeight:700}}>{completion}%</span></div><ProfileProgressBar value={completion} /></div>
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-color)",borderRadius:16,padding:"1.1rem",marginBottom:"1rem"}}>
            <div style={{fontSize:"0.82rem",fontWeight:700,color:"var(--text-primary)",marginBottom:"0.75rem"}}>Quick Actions</div>
            {[{label:"Edit Profile",icon:<Edit3 size={13}/>,fn:()=>setEditMode(true)},{label:"Back to Dashboard",icon:<LayoutDashboard size={13}/>,fn:onViewDashboard},{label:"Download Profile",icon:<Download size={13}/>,fn:()=>setProfileToast("🚀 Coming Soon!")},{label:"Add Portfolio Links",icon:<Globe size={13}/>,fn:()=>setEditMode(true)}].map(a=>(<button key={a.label} onClick={a.fn} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"0.45rem 0.5rem",borderRadius:8,background:"transparent",border:"none",color:"var(--text-secondary)",fontSize:"0.81rem",cursor:"pointer",textAlign:"left",marginBottom:2}} onMouseEnter={e=>(e.currentTarget.style.color="var(--primary)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-secondary)")}><span style={{color:"var(--primary)"}}>{a.icon}</span>{a.label}</button>))}
          </div>
        </div>
        <div>
          {!editMode ? (
            <>
              <SectionCard title="Personal Information" icon={<User size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1.5rem"}}><FieldRow label="Full Name" value={profile?.user?.name} placeholder="Not set"/><FieldRow label="Username" value={profile?.username} placeholder="Not set"/><FieldRow label="Email" value={profile?.user?.email}/><FieldRow label="Phone" value={profile?.phone} placeholder="Not set"/><FieldRow label="Location" value={profile?.location} placeholder="Not set"/></div><FieldRow label="About Me" value={profile?.aboutMe} placeholder="Tell us about yourself..."/></SectionCard>
              <SectionCard title="Academic Information" icon={<GraduationCap size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1.5rem"}}><FieldRow label="College / University" value={profile?.college} placeholder="Not set"/><FieldRow label="Degree & Branch" value={profile?.degree&&profile?.branch?`${profile.degree} – ${profile.branch}`:(profile?.branch||profile?.degree)} placeholder="Not set"/><FieldRow label="Graduation Year" value={profile?.graduationYear} placeholder="Not set"/></div></SectionCard>
              <SectionCard title="Skills & Interests" icon={<Star size={16}/>}>
                <div style={{marginBottom:"1rem"}}><div style={{fontSize:"0.72rem",fontWeight:600,color:"var(--text-muted)",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Skills</div>{skills.length?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{skills.map(s=><span key={s} style={{padding:"0.25rem 0.75rem",borderRadius:20,fontSize:"0.76rem",fontWeight:600,background:"rgba(245,158,11,0.1)",color:"var(--primary)",border:"1px solid rgba(245,158,11,0.25)"}}>{s}</span>)}</div>:<span style={{fontSize:"0.82rem",color:"var(--text-muted)"}}>No skills added yet</span>}</div>
                <div><div style={{fontSize:"0.72rem",fontWeight:600,color:"var(--text-muted)",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:"0.05em"}}>Interested Domains</div>{domains.length?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{domains.map(d=><span key={d} style={{padding:"0.25rem 0.75rem",borderRadius:20,fontSize:"0.76rem",fontWeight:600,background:"rgba(59,130,246,0.1)",color:"#3b82f6",border:"1px solid rgba(59,130,246,0.25)"}}>{d}</span>)}</div>:<span style={{fontSize:"0.82rem",color:"var(--text-muted)"}}>No domains selected yet</span>}</div>
              </SectionCard>
              <SectionCard title="Career Goals" icon={<Target size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1.5rem"}}><FieldRow label="Target Role" value={profile?.targetRole} placeholder="Not set"/></div><FieldRow label="Career Objective" value={profile?.careerObjective} placeholder="Describe your professional goals..."/></SectionCard>
              <SectionCard title="Professional Links" icon={<Globe size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1.5rem"}}><FieldRow label="LinkedIn" value={profile?.linkedin} placeholder="Not set"/><FieldRow label="GitHub" value={profile?.github} placeholder="Not set"/><FieldRow label="Portfolio" value={profile?.portfolio} placeholder="Not set"/></div></SectionCard>
              <SectionCard title="Resume" icon={<FileText size={16}/>}>
                {profile?.resumeUrl?(<div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"rgba(245,158,11,0.05)",borderRadius:10,border:"1px solid rgba(245,158,11,0.15)"}}><FileText size={20} style={{color:"var(--primary)",flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.85rem",fontWeight:600,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.resumeName||"Resume"}</div></div><a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{padding:"0.4rem 0.8rem",borderRadius:7,background:"rgba(59,130,246,0.1)",color:"#3b82f6",border:"1px solid rgba(59,130,246,0.2)",fontSize:"0.78rem",fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,flexShrink:0}}><Download size={12}/> View</a><button onClick={handleRemoveResume} style={{padding:"0.4rem 0.8rem",borderRadius:7,background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,flexShrink:0}}><Trash2 size={12}/> Remove</button></div>):(<div style={{textAlign:"center",padding:"1.5rem"}}><Upload size={28} style={{color:"var(--text-muted)",marginBottom:8}}/><p style={{fontSize:"0.82rem",color:"var(--text-muted)",marginBottom:"0.75rem"}}>No resume uploaded yet</p><button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{padding:"0.5rem 1.2rem",borderRadius:8,background:"var(--primary)",border:"none",color:"#000",fontWeight:700,fontSize:"0.82rem",cursor:"pointer"}}>{uploading?"Uploading…":"Upload Resume"}</button></div>)}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0];if(file)handleResume(file);e.target.value="";}}/>
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard title="Personal Information" icon={<User size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1rem"}}><ProfileFormInput label="Username" value={f.username} onChange={setField("username")} placeholder="@username"/><ProfileFormInput label="Phone" value={f.phone} onChange={setField("phone")} placeholder="+91 XXXXX XXXXX"/><ProfileFormInput label="Location" value={f.location} onChange={setField("location")} placeholder="City, Country"/></div><ProfileFormTextarea label="About Me" value={f.aboutMe} onChange={setField("aboutMe")} placeholder="Tell us about yourself..."/></SectionCard>
              <SectionCard title="Academic Information" icon={<GraduationCap size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1rem"}}><ProfileFormInput label="College / University" value={f.college} onChange={setField("college")} placeholder="e.g. IIT Delhi"/><ProfileFormInput label="Branch / Specialization" value={f.branch} onChange={setField("branch")} placeholder="e.g. CSE"/><ProfileFormInput label="Degree" value={f.degree} onChange={setField("degree")} placeholder="e.g. B.Tech"/><ProfileFormInput label="Graduation Year" value={f.graduationYear} onChange={setField("graduationYear")} placeholder="e.g. 2025"/></div></SectionCard>
              <SectionCard title="Skills & Interests" icon={<Star size={16}/>}><ProfileFormInput label="Skills" value={f.skills} onChange={setField("skills")} placeholder="Python, React, Machine Learning" hint="Separate with commas"/><div><div style={{fontSize:"0.76rem",fontWeight:600,color:"var(--text-secondary)",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:"0.04em"}}>Interested Domains</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{DOMAINS.map(d=>{const sel=f.interestedDomains.includes(d);return(<button key={d} onClick={()=>toggleDomain(d)} style={{padding:"0.3rem 0.8rem",borderRadius:20,fontSize:"0.76rem",fontWeight:600,cursor:"pointer",background:sel?"rgba(245,158,11,0.15)":"transparent",color:sel?"var(--primary)":"var(--text-secondary)",border:sel?"1px solid rgba(245,158,11,0.35)":"1px solid var(--border-color)",transition:"all 0.15s"}}>{d}</button>);})}</div></div></SectionCard>
              <SectionCard title="Career Goals" icon={<Target size={16}/>}><ProfileFormInput label="Target Role" value={f.targetRole} onChange={setField("targetRole")} placeholder="e.g. Full Stack Developer"/><ProfileFormTextarea label="Career Objective" value={f.careerObjective} onChange={setField("careerObjective")} placeholder="Describe your professional goals..."/></SectionCard>
              <SectionCard title="Professional Links" icon={<Globe size={16}/>}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 1rem"}}><ProfileFormInput label="LinkedIn" value={f.linkedin} onChange={setField("linkedin")} placeholder="https://linkedin.com/in/..."/><ProfileFormInput label="GitHub" value={f.github} onChange={setField("github")} placeholder="https://github.com/..."/><ProfileFormInput label="Portfolio" value={f.portfolio} onChange={setField("portfolio")} placeholder="https://yoursite.com"/></div></SectionCard>
            </>
          )}
        </div>
      </div>
      {profileToast && <Toast message={profileToast} onClose={()=>setProfileToast("")} />}
      <style>{`.profile-grid { grid-template-columns: 280px 1fr; } @media(max-width:768px){.profile-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  return (
    <SocketProvider>
      <UserDashboardContent />
    </SocketProvider>
  );
}

function UserDashboardContent() {
  useRequireAuth("USER");
  const [user, setUser] = useState<AdyapanUser | null>(null);
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(false);
  const [activeView, setActiveView] = useState<ResumeHubViewType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Modern");

  const [dashboardStats, setDashboardStats] = useState({
    resumesCount: 0,
    avgAtsScore: 0,
    avgLinkedinScore: 0,
    coverLettersCount: 0,
    notesCount: 0,
    quizzesCount: 0,
    assignmentsCount: 0,
    pptsCount: 0,
    mindmapsCount: 0,
    studySessionsCount: 0,
    codingSessionsCount: 0,
    dsaSolved: 0,
    dsaAccuracy: 0,
    dsaStreak: 0,
    challengesCount: 0,
    profileCompletion: 0,
    targetRole: ""
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Load theme immediately
    const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Seed from localStorage first (instant display), then refresh from API
    try {
      const raw = localStorage.getItem("adyapan-user");
      if (raw) setUser(JSON.parse(raw) as AdyapanUser);
    } catch { /* ignore */ }

    // Fetch fresh user data from server
    api.get("/auth/me").then(res => {
      const fresh = (res.data as { user: AdyapanUser }).user;
      setUser(fresh);
      localStorage.setItem("adyapan-user", JSON.stringify(fresh));
    }).catch(() => { /* token invalid — interceptor will redirect */ });

    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute("data-theme") ?? "dark";
      setTheme(t);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeView !== "dashboard") return;

    async function fetchDashboardStats() {
      setStatsLoading(true);
      try {
        const [
          profileRes,
          resumesRes,
          atsRes,
          linkedinRes,
          lettersRes,
          notesRes,
          quizRes,
          assignRes,
          pptRes,
          mindmapRes,
          studyRes,
          codingRes,
          dsaRes,
          challengesRes
        ] = await Promise.allSettled([
          api.get("/profile/me"),
          api.get("/resume/list"),
          api.get("/ats/history"),
          api.get("/linkedin/history"),
          api.get("/cover-letter/history"),
          api.get("/notes/history"),
          api.get("/quiz/history"),
          api.get("/assignment/history"),
          api.get("/ppt/history"),
          api.get("/mindmap/history"),
          api.get("/study/history"),
          api.get("/coding/history"),
          api.get("/dsa/progress"),
          api.get("/challenges/")
        ]);

        const profileData = profileRes.status === "fulfilled" ? profileRes.value.data.profile : null;
        const completion = profileData ? calcCompletion(profileData) : 0;
        const targetRole = profileData?.targetRole || "";

        const resumes = resumesRes.status === "fulfilled" ? (resumesRes.value.data.resumes || []) : [];
        const atsReports = atsRes.status === "fulfilled" ? (atsRes.value.data.reports || []) : [];
        const linkedinReports = linkedinRes.status === "fulfilled" ? (linkedinRes.value.data.reports || []) : [];
        const coverLetters = lettersRes.status === "fulfilled" ? (lettersRes.value.data.coverLetters || []) : [];

        const notes = notesRes.status === "fulfilled" ? (notesRes.value.data.notes || []) : [];
        const quizzes = quizRes.status === "fulfilled" ? (quizRes.value.data.quizzes || []) : [];
        const assignments = assignRes.status === "fulfilled" ? (assignRes.value.data.assignments || []) : [];
        const ppts = pptRes.status === "fulfilled" ? (pptRes.value.data.presentations || []) : [];
        const mindmaps = mindmapRes.status === "fulfilled" ? (mindmapRes.value.data.mindmaps || []) : [];
        const studySessions = studyRes.status === "fulfilled" ? (studyRes.value.data.sessions || []) : [];

        const codingSessions = codingRes.status === "fulfilled" ? (codingRes.value.data.sessions || []) : [];
        const dsaProgress = dsaRes.status === "fulfilled" ? (dsaRes.value.data.progress || null) : null;
        const challenges = challengesRes.status === "fulfilled" ? (challengesRes.value.data || []) : [];

        const avgAtsScore = atsReports.length
          ? Math.round(atsReports.reduce((sum: number, r: any) => sum + r.score, 0) / atsReports.length)
          : 0;

        const avgLinkedinScore = linkedinReports.length
          ? Math.round(linkedinReports.reduce((sum: number, r: any) => sum + r.score, 0) / linkedinReports.length)
          : 0;

        setDashboardStats({
          resumesCount: resumes.length,
          avgAtsScore,
          avgLinkedinScore,
          coverLettersCount: coverLetters.length,
          notesCount: notes.length,
          quizzesCount: quizzes.length,
          assignmentsCount: assignments.length,
          pptsCount: ppts.length,
          mindmapsCount: mindmaps.length,
          studySessionsCount: studySessions.length,
          codingSessionsCount: codingSessions.length,
          dsaSolved: dsaProgress?.solved || 0,
          dsaAccuracy: dsaProgress?.accuracy || 0,
          dsaStreak: dsaProgress?.streak || 0,
          challengesCount: challenges.length,
          profileCompletion: completion,
          targetRole
        });
      } catch (err) {
        console.error("Error fetching dashboard statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchDashboardStats();
  }, [activeView]);

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("adyapan-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const showComingSoon = () => setToast(true);
  const handleViewProfile = () => setActiveView("profile");
  const handleViewDashboard = () => setActiveView("dashboard");
  const handleAdyChat = () => { window.open("/chat", "_blank"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      <DashboardTopNav user={user} theme={theme} onThemeToggle={handleThemeToggle} onComingSoon={showComingSoon} onViewProfile={handleViewProfile} onAdyChat={handleAdyChat} onViewTool={setActiveView} onMenuToggle={() => setSidebarOpen(prev => !prev)} />
      <DashboardSidebar onComingSoon={showComingSoon} activeView={activeView} onViewDashboard={handleViewDashboard} onViewTool={setActiveView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="dash-main resume-hub-theme">
        {activeView === "profile" ? (
          <ProfileView onViewDashboard={handleViewDashboard} />
        ) : activeView === "resume-hub" ? (
          <ResumeTemplateMarketplace
            onSelectTemplate={(templateName) => {
              setSelectedTemplate(templateName);
              setActiveView("resume-builder");
            }}
          />
        ) : activeView === "resume-builder" ? (
          <ResumeBuilderView setView={setActiveView} selectedTemplate={selectedTemplate} />
        ) : activeView === "ats-checker" ? (
          <AtsCheckerView setView={setActiveView} />
        ) : activeView === "resume-analyzer" ? (
          <ResumeAnalyzerView setView={setActiveView} />
        ) : activeView === "cover-letter" ? (
          <CoverLetterView setView={setActiveView} />
        ) : activeView === "linkedin-optimizer" ? (
          <LinkedInView setView={setActiveView} />
        ) : activeView === "study-assistant" ? (
          <StudyAssistantView />
        ) : activeView === "notes-generator" ? (
          <NotesGeneratorView />
        ) : activeView === "quiz-generator" ? (
          <QuizGeneratorView />
        ) : activeView === "assignment-generator" ? (
          <AssignmentGeneratorView />
        ) : activeView === "ppt-generator" ? (
          <PptGeneratorView />
        ) : activeView === "mind-maps" ? (
          <MindMapsView />
        ) : activeView === "coding-assistant" ? (
          <CodingAssistantView />
        ) : activeView === "dsa-practice" ? (
          <DsaPracticeView />
        ) : activeView === "coding-challenges" ? (
          <CodingChallengesView />
        ) : activeView === "github-portfolio" ? (
          <GithubPortfolioView />
        ) : (
          statsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "var(--text-secondary)", gap: "0.75rem" }}>
              <RefreshCw className="animate-spin text-amber-500" size={24} />
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading your dashboard statistics...</span>
            </div>
          ) : (
            <>
              <WelcomeBanner
                user={user}
                targetRole={dashboardStats.targetRole}
                profileCompletion={dashboardStats.profileCompletion}
                onStartStudy={() => setActiveView("study-assistant")}
                onBuildResume={() => setActiveView("resume-hub")}
                onPracticeDsa={() => setActiveView("dsa-practice")}
              />
              <StatCardsGrid stats={dashboardStats} />
              <PanelGrid stats={dashboardStats} onViewTool={setActiveView} />
            </>
          )
        )}
      </main>

      {toast && (
        <Toast message="🚀 Coming Soon! This feature will be available in the next release." onClose={() => setToast(false)} />
      )}

      {/* Inline responsive styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-grid-responsive {
          grid-template-columns: repeat(4, 1fr);
        }
        .panel-grid-responsive {
          grid-template-columns: 1fr 1fr 1fr;
        }
        @media (max-width: 1200px) {
          .stat-grid-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          .panel-grid-responsive { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .stat-grid-responsive { grid-template-columns: 1fr !important; }
          .panel-grid-responsive { grid-template-columns: 1fr !important; }
          .dash-main { margin-left: 0 !important; }
        }
        .dash-sidebar input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
