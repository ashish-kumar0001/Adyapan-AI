"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Award, Globe, ExternalLink, Star, BookOpen, Code2, FileText,
  Target, Calendar, Download, GraduationCap, Layers, Edit3, Save, X,
  Upload, Trash2, ArrowLeft, Link2, Camera, CheckCircle2, AlertCircle,
  Loader2, Briefcase, MapPin, Phone, Mail, RefreshCw, AtSign
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getDiceBearUrl } from "@/lib/avatar";
import { AnimatedSkeleton } from "@/components/ui/PremiumComponents";
import { useTheme } from "@/hooks/useTheme";

// ─── Profile Interface ─────────────────────────────────────────────────────
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
  year: string | null;
  graduationYear: string | null;
  skills: string[];
  interestedDomains: string[];
  targetRole: string | null;
  careerGoal: string | null;
  careerObjective: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  resumeUrl: string | null;
  resumeName: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string; createdAt: string };
}

const DOMAINS = [
  "Artificial Intelligence", "Machine Learning", "Data Science", "Cybersecurity",
  "Web Development", "Cloud Computing", "Digital Marketing", "UI/UX Design",
  "Mobile Development", "DevOps", "Blockchain", "IoT"
];

// ─── Animations ────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

// ─── Helper: Completion % ──────────────────────────────────────────────────
function calcCompletion(p: ProfileData | null): number {
  if (!p) return 0;
  const fields = [
    p.user?.name, p.user?.email, p.username, p.phone, p.location, p.aboutMe,
    p.college, p.branch, p.degree, p.graduationYear,
    p.skills?.length > 0 ? "y" : "", p.interestedDomains?.length > 0 ? "y" : "",
    p.targetRole, p.careerObjective, p.linkedin, p.github, p.resumeUrl
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

// ─── Section Wrapper ───────────────────────────────────────────────────────
function ProfileSection({ title, icon, children, c }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  c: Record<string, string>;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible"
      className="rounded-2xl border overflow-hidden"
      style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
      <div className="px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor: c.border }}>
        <div className="p-2 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", color: c.primary }}>
          {icon}
        </div>
        <h3 className="text-sm font-bold tracking-tight" style={{ color: c.text }}>
          {title}
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
}

// ─── Field Display ─────────────────────────────────────────────────────────
function FieldDisplay({ label, value, c, icon }: {
  label: string; value?: string | null; c: Record<string, string>; icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon && <span style={{ color: c.primary }}>{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textMuted }}>
          {label}
        </span>
      </div>
      <div className={`px-4 py-3 rounded-xl text-xs font-medium border transition-all ${value ? "" : "italic"}`}
        style={{
          background: value ? c.inputBg : "transparent",
          borderColor: c.border,
          color: value ? c.text : c.textMuted
        }}>
        {value || "Not set"}
      </div>
    </div>
  );
}

// ─── Form Input ────────────────────────────────────────────────────────────
function FormInput({ label, value, onChange, placeholder, c, type = "text", hint, icon, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  c: Record<string, string>; type?: string; hint?: string; icon?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textSec }}>
        {icon && <span style={{ color: c.primary }}>{icon}</span>}
        {label}
      </label>
      {hint && <p className="text-[10px]" style={{ color: c.textMuted }}>{hint}</p>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl text-xs font-medium outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}
        onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = c.primary; }}
        onBlur={e => e.currentTarget.style.borderColor = c.border}
      />
    </div>
  );
}

// ─── Form Textarea ─────────────────────────────────────────────────────────
function FormTextarea({ label, value, onChange, placeholder, c, hint, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  c: Record<string, string>; hint?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: c.textSec }}>
        {icon && <span style={{ color: c.primary }}>{icon}</span>}
        {label}
      </label>
      {hint && <p className="text-[10px]" style={{ color: c.textMuted }}>{hint}</p>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-4 py-3 rounded-xl text-xs font-medium outline-none transition-all duration-200 resize-y"
        style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}
        onFocus={e => e.currentTarget.style.borderColor = c.primary}
        onBlur={e => e.currentTarget.style.borderColor = c.border}
      />
    </div>
  );
}

// ─── Tag Chip ──────────────────────────────────────────────────────────────
function TagChip({ label, c, onRemove }: { label: string; c: Record<string, string>; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all hover:scale-105"
      style={{ background: "rgba(245,158,11,0.08)", color: c.primary, borderColor: "rgba(245,158,11,0.2)" }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer bg-transparent border-none p-0"
          style={{ color: c.primary }}>
          <X size={10} />
        </button>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PROFILE VIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function ProfileView({ onViewDashboard }: { onViewDashboard: () => void }) {
  const theme = useTheme();
  const isDark = theme === "dark";
  const fileRef = useRef<HTMLInputElement>(null);

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
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [f, setF] = useState({
    username: "", phone: "", location: "", aboutMe: "",
    college: "", branch: "", degree: "", graduationYear: "",
    skills: "", interestedDomains: [] as string[],
    targetRole: "", careerObjective: "",
    linkedin: "", github: "", portfolio: ""
  });

  const setField = useCallback((key: keyof typeof f) => (val: string) => {
    setF(p => ({ ...p, [key]: val }));
    setHasChanges(true);
  }, []);

  const toggleDomain = useCallback((d: string) => {
    setF(p => ({
      ...p,
      interestedDomains: p.interestedDomains.includes(d)
        ? p.interestedDomains.filter(x => x !== d)
        : [...p.interestedDomains, d]
    }));
    setHasChanges(true);
  }, []);

  const populate = useCallback((data: ProfileData) => {
    setF({
      username: data.username ?? "",
      phone: data.phone ?? "",
      location: data.location ?? "",
      aboutMe: data.aboutMe ?? "",
      college: data.college ?? "",
      branch: data.branch ?? "",
      degree: data.degree ?? "",
      graduationYear: data.graduationYear ?? "",
      skills: (data.skills ?? []).join(", "),
      interestedDomains: data.interestedDomains ?? [],
      targetRole: data.targetRole ?? "",
      careerObjective: data.careerObjective ?? "",
      linkedin: data.linkedin ?? "",
      github: data.github ?? "",
      portfolio: data.portfolio ?? ""
    });
    setHasChanges(false);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/profile/me");
      const data = res.data.profile as ProfileData;
      setProfile(data);
      populate(data);
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to load profile";
      console.error("[ProfileView] Fetch error:", error);
      setError(msg);
      // Still allow editing even if fetch fails (new user scenario)
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [populate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        ...f,
        skills: f.skills.split(",").map(s => s.trim()).filter(Boolean),
        interestedDomains: f.interestedDomains
      };
      const res = await api.put("/profile/me", payload);
      toast.success("Profile updated successfully!");
      setEditMode(false);
      setHasChanges(false);
      await fetchProfile();
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to save profile";
      console.error("[ProfileView] Save error:", error);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [f, fetchProfile]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      if (!confirm("Discard unsaved changes?")) return;
    }
    setEditMode(false);
    setHasChanges(false);
    if (profile) populate(profile);
  }, [hasChanges, profile, populate]);

  const handleResumeUpload = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      await api.post("/profile/upload-resume", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Resume uploaded successfully!");
      await fetchProfile();
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || "Upload failed";
      console.error("[ProfileView] Upload error:", error);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, [fetchProfile]);

  const handleRemoveResume = useCallback(async () => {
    try {
      await api.post("/profile/remove-resume");
      toast.success("Resume removed");
      await fetchProfile();
    } catch (error) {
      console.error("[ProfileView] Remove resume error:", error);
      toast.error("Could not remove resume");
    }
  }, [fetchProfile]);

  // ── Derived ──
  const completion = calcCompletion(profile);
  const displayName = profile?.user?.name ?? "User";
  const email = profile?.user?.email ?? "";
  const skills = profile?.skills ?? [];
  const domains = profile?.interestedDomains ?? [];
  const memberSince = profile?.user?.createdAt ? new Date(profile.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "";

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <AnimatedSkeleton className="h-4 w-32 rounded" />
            <AnimatedSkeleton className="h-8 w-48 rounded" />
          </div>
            <AnimatedSkeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <AnimatedSkeleton className="h-64 rounded-2xl" />
            <AnimatedSkeleton className="h-40 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <AnimatedSkeleton className="h-48 rounded-2xl" />
            <AnimatedSkeleton className="h-48 rounded-2xl" />
            <AnimatedSkeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b"
        style={{ borderColor: c.border }}>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: c.primary }}>
            MY PROFILE
          </span>
          <h1 className="text-2xl font-black" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
            {displayName}
          </h1>
          <p className="text-xs" style={{ color: c.textMuted }}>
            {memberSince && `Member since ${memberSince}`}
          </p>
        </div>
        <div className="flex gap-2.5">
          {editMode ? (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                style={{ borderColor: c.border, color: c.textSec, background: "transparent" }}>
                <X size={14} /> Cancel
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSave} disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: hasChanges ? c.primary : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: hasChanges ? "#000" : c.textMuted }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
            </>
          ) : (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onViewDashboard}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                style={{ borderColor: c.border, color: c.textSec, background: "transparent" }}>
                <ArrowLeft size={14} /> Dashboard
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer"
                style={{ background: c.primary, color: "#000" }}>
                <Edit3 size={14} /> Edit Profile
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Error Banner ── */}
      {error && !profile && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-2xl border p-5 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: "#ef4444" }}>Could not load profile</p>
            <p className="text-[11px] mt-1" style={{ color: c.textMuted }}>{error}</p>
            <p className="text-[11px] mt-1" style={{ color: c.textMuted }}>You can still fill in your details and save.</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={fetchProfile}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            <RefreshCw size={12} className="inline mr-1" /> Retry
          </motion.button>
        </motion.div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="space-y-5">
          {/* Profile Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
            className="rounded-2xl border overflow-hidden"
            style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
            {/* Avatar Banner */}
            <div className="relative h-24 overflow-hidden" style={{
              background: `linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)`
            }}>
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: `radial-gradient(circle at 30% 50%, rgba(245,158,11,0.3) 0%, transparent 60%)` }} />
            </div>
            {/* Avatar */}
            <div className="px-6 -mt-10 pb-5 text-center relative">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-full border-4 shadow-lg overflow-hidden"
                  style={{ borderColor: c.primary, background: c.cardBg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getDiceBearUrl(displayName)} alt="avatar" width={80} height={80}
                    style={{ borderRadius: "50%", display: "block" }} />
                </div>
                {editMode && (
                  <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer shadow-md"
                    style={{ background: c.primary, color: "#000" }}>
                    <Camera size={12} />
                  </motion.button>
                )}
              </div>
              <h2 className="text-base font-black" style={{ color: c.text, fontFamily: "'Outfit', sans-serif" }}>
                {displayName}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: c.textMuted }}>{email}</p>
              {profile?.targetRole && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={{ background: "rgba(245,158,11,0.08)", color: c.primary, borderColor: "rgba(245,158,11,0.2)" }}>
                  {profile.targetRole}
                </span>
              )}
              {profile?.location && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <MapPin size={10} style={{ color: c.textMuted }} />
                  <span className="text-[11px]" style={{ color: c.textMuted }}>{profile.location}</span>
                </div>
              )}
            </div>

            {/* Completion */}
            <div className="px-6 pb-5 border-t" style={{ borderColor: c.border }}>
              <div className="flex justify-between items-center text-[11px] font-bold mt-4 mb-2">
                <span style={{ color: c.textMuted }}>Profile Completion</span>
                <span style={{ color: c.primary }}>{completion}%</span>
              </div>
              <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${c.primary}, #fbbf24)` }} />
              </div>
              {completion < 50 && (
                <p className="text-[10px] mt-2" style={{ color: c.textMuted }}>
                  Complete your profile to unlock personalized recommendations
                </p>
              )}
            </div>

            {/* Quick Stats */}
            {profile && (
              <div className="px-6 pb-5 border-t grid grid-cols-2 gap-3" style={{ borderColor: c.border }}>
                {[
                  { label: "Skills", value: skills.length, icon: <Code2 size={12} /> },
                  { label: "Domains", value: domains.length, icon: <Layers size={12} /> },
                  { label: "Links", value: [profile.linkedin, profile.github, profile.portfolio].filter(Boolean).length, icon: <Link2 size={12} /> },
                  { label: "Resume", value: profile.resumeUrl ? "Yes" : "No", icon: <FileText size={12} /> },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-2.5 rounded-xl border"
                    style={{ background: c.cardBg, borderColor: c.border }}>
                    <div className="flex items-center justify-center gap-1 mb-1" style={{ color: c.primary }}>
                      {stat.icon}
                    </div>
                    <div className="text-sm font-black" style={{ color: c.text }}>{stat.value}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Links Card */}
          {profile && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
              className="rounded-2xl border p-5 space-y-3"
              style={{ background: c.cardBg, borderColor: c.border, backdropFilter: "blur(16px)" }}>
              <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.textMuted }}>
                Quick Links
              </h3>
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all no-underline"
                  style={{ color: c.textSec, background: c.cardBgHover }}>
                  <ExternalLink size={12} style={{ color: c.primary }} />
                  LinkedIn Profile
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all no-underline"
                  style={{ color: c.textSec, background: c.cardBgHover }}>
                  <ExternalLink size={12} style={{ color: c.primary }} />
                  GitHub Profile
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all no-underline"
                  style={{ color: c.textSec, background: c.cardBgHover }}>
                  <ExternalLink size={12} style={{ color: c.primary }} />
                  Portfolio Website
                </a>
              )}
              {!profile.linkedin && !profile.github && !profile.portfolio && (
                <p className="text-[11px] italic" style={{ color: c.textMuted }}>
                  No links added yet
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {editMode ? (
              /* ─── EDIT MODE ─── */
              <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                className="space-y-5">

                {/* Personal Info */}
                <ProfileSection title="Personal Information" icon={<User size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Full Name" value={profile?.user?.name ?? ""} onChange={() => {}} placeholder="" c={c} icon={<User size={11} />} disabled />
                    <FormInput label="Username" value={f.username} onChange={setField("username")} placeholder="@username" c={c} icon={<AtSign size={11} />} />
                    <FormInput label="Email" value={profile?.user?.email ?? ""} onChange={() => {}} placeholder="" c={c} icon={<Mail size={11} />} disabled />
                    <FormInput label="Phone" value={f.phone} onChange={setField("phone")} placeholder="+91 XXXXX XXXXX" c={c} icon={<Phone size={11} />} />
                    <FormInput label="Location" value={f.location} onChange={setField("location")} placeholder="City, Country" c={c} icon={<MapPin size={11} />} />
                  </div>
                  <div className="mt-4">
                    <FormTextarea label="About Me" value={f.aboutMe} onChange={setField("aboutMe")} placeholder="Tell us about yourself..." c={c} icon={<User size={11} />} />
                  </div>
                </ProfileSection>

                {/* Academic Info */}
                <ProfileSection title="Academic Information" icon={<GraduationCap size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="College / University" value={f.college} onChange={setField("college")} placeholder="e.g. IIT Delhi" c={c} icon={<GraduationCap size={11} />} />
                    <FormInput label="Branch / Specialization" value={f.branch} onChange={setField("branch")} placeholder="e.g. CSE" c={c} icon={<BookOpen size={11} />} />
                    <FormInput label="Degree" value={f.degree} onChange={setField("degree")} placeholder="e.g. B.Tech" c={c} icon={<Award size={11} />} />
                    <FormInput label="Graduation Year" value={f.graduationYear} onChange={setField("graduationYear")} placeholder="e.g. 2025" c={c} icon={<Calendar size={11} />} />
                  </div>
                </ProfileSection>

                {/* Skills & Interests */}
                <ProfileSection title="Skills & Interests" icon={<Star size={16} />} c={c}>
                  <FormInput label="Skills" value={f.skills} onChange={setField("skills")} placeholder="Python, React, Machine Learning" c={c} hint="Separate with commas" icon={<Code2 size={11} />} />
                  {f.skills && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {f.skills.split(",").map(s => s.trim()).filter(Boolean).map((skill, i) => (
                        <TagChip key={i} label={skill} c={c} />
                      ))}
                    </div>
                  )}
                  <div className="mt-5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: c.textSec }}>
                      <Layers size={11} style={{ color: c.primary }} /> Interested Domains
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DOMAINS.map(d => {
                        const sel = f.interestedDomains.includes(d);
                        return (
                          <motion.button key={d} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            type="button" onClick={() => toggleDomain(d)}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer border transition-all duration-200"
                            style={{
                              background: sel ? "rgba(245,158,11,0.1)" : "transparent",
                              color: sel ? c.primary : c.textMuted,
                              borderColor: sel ? "rgba(245,158,11,0.3)" : c.border
                            }}>
                            {sel && <CheckCircle2 size={10} className="inline mr-1" />}
                            {d}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </ProfileSection>

                {/* Career Goals */}
                <ProfileSection title="Career Goals" icon={<Target size={16} />} c={c}>
                  <FormInput label="Target Role" value={f.targetRole} onChange={setField("targetRole")} placeholder="e.g. Full Stack Developer" c={c} icon={<Briefcase size={11} />} />
                  <div className="mt-4">
                    <FormTextarea label="Career Objective" value={f.careerObjective} onChange={setField("careerObjective")} placeholder="Describe your professional goals..." c={c} icon={<Target size={11} />} />
                  </div>
                </ProfileSection>

                {/* Professional Links */}
                <ProfileSection title="Professional Links" icon={<Globe size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="LinkedIn" value={f.linkedin} onChange={setField("linkedin")} placeholder="https://linkedin.com/in/..." c={c} icon={<ExternalLink size={11} />} />
                    <FormInput label="GitHub" value={f.github} onChange={setField("github")} placeholder="https://github.com/..." c={c} icon={<ExternalLink size={11} />} />
                  </div>
                  <div className="mt-4">
                    <FormInput label="Portfolio" value={f.portfolio} onChange={setField("portfolio")} placeholder="https://yoursite.com" c={c} icon={<Globe size={11} />} />
                  </div>
                </ProfileSection>
              </motion.div>
            ) : (
              /* ─── VIEW MODE ─── */
              <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                className="space-y-5">

                {/* Personal Info */}
                <ProfileSection title="Personal Information" icon={<User size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldDisplay label="Full Name" value={profile?.user?.name} c={c} icon={<User size={11} />} />
                    <FieldDisplay label="Username" value={profile?.username} c={c} />
                    <FieldDisplay label="Email" value={profile?.user?.email} c={c} icon={<Mail size={11} />} />
                    <FieldDisplay label="Phone" value={profile?.phone} c={c} icon={<Phone size={11} />} />
                    <FieldDisplay label="Location" value={profile?.location} c={c} icon={<MapPin size={11} />} />
                  </div>
                  <div className="mt-4">
                    <FieldDisplay label="About Me" value={profile?.aboutMe} c={c} />
                  </div>
                </ProfileSection>

                {/* Academic Info */}
                <ProfileSection title="Academic Information" icon={<GraduationCap size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldDisplay label="College / University" value={profile?.college} c={c} icon={<GraduationCap size={11} />} />
                    <FieldDisplay label="Degree & Branch" value={profile?.degree && profile?.branch ? `${profile.degree} — ${profile.branch}` : (profile?.branch || profile?.degree)} c={c} />
                    <FieldDisplay label="Graduation Year" value={profile?.graduationYear} c={c} icon={<Calendar size={11} />} />
                  </div>
                </ProfileSection>

                {/* Skills & Interests */}
                <ProfileSection title="Skills & Interests" icon={<Star size={16} />} c={c}>
                  <div className="mb-5">
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: c.textMuted }}>Skills</span>
                    {skills.length ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map(s => <TagChip key={s} label={s} c={c} />)}
                      </div>
                    ) : (
                      <p className="text-xs italic" style={{ color: c.textMuted }}>No skills added yet</p>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: c.textMuted }}>Interested Domains</span>
                    {domains.length ? (
                      <div className="flex flex-wrap gap-2">
                        {domains.map(d => <TagChip key={d} label={d} c={c} />)}
                      </div>
                    ) : (
                      <p className="text-xs italic" style={{ color: c.textMuted }}>No domains selected yet</p>
                    )}
                  </div>
                </ProfileSection>

                {/* Career Goals */}
                <ProfileSection title="Career Goals" icon={<Target size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldDisplay label="Target Role" value={profile?.targetRole} c={c} icon={<Briefcase size={11} />} />
                  </div>
                  <div className="mt-4">
                    <FieldDisplay label="Career Objective" value={profile?.careerObjective} c={c} icon={<Target size={11} />} />
                  </div>
                </ProfileSection>

                {/* Professional Links */}
                <ProfileSection title="Professional Links" icon={<Globe size={16} />} c={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldDisplay label="LinkedIn" value={profile?.linkedin} c={c} icon={<ExternalLink size={11} />} />
                    <FieldDisplay label="GitHub" value={profile?.github} c={c} icon={<ExternalLink size={11} />} />
                    <FieldDisplay label="Portfolio" value={profile?.portfolio} c={c} icon={<Globe size={11} />} />
                  </div>
                </ProfileSection>

                {/* Resume */}
                <ProfileSection title="Resume" icon={<FileText size={16} />} c={c}>
                  {profile?.resumeUrl ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{ background: c.cardBgHover, borderColor: c.border }}>
                      <div className="p-3 rounded-xl shrink-0" style={{ background: "rgba(245,158,11,0.1)", color: c.primary }}>
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: c.text }}>
                          {profile.resumeName || "Resume.pdf"}
                        </p>
                        <p className="text-[10px]" style={{ color: c.textMuted }}>Uploaded resume</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={profile.resumeUrl} target="_blank" rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border no-underline transition-all hover:scale-105"
                          style={{ background: c.cardBg, color: c.text, borderColor: c.border }}>
                          <Download size={12} /> View
                        </a>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={handleRemoveResume}
                          className="px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border-none cursor-pointer transition-all"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                          <Trash2 size={12} /> Remove
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 rounded-xl border border-dashed"
                      style={{ background: c.cardBgHover, borderColor: c.border }}>
                      <Upload size={28} className="mx-auto mb-3" style={{ color: c.textMuted }} />
                      <p className="text-xs mb-4" style={{ color: c.textMuted }}>No resume uploaded yet</p>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="px-5 py-2.5 rounded-xl border-none text-xs font-bold cursor-pointer disabled:opacity-50 transition-all shadow-md"
                        style={{ background: c.primary, color: "#000" }}>
                        {uploading ? <><Loader2 size={12} className="inline mr-1.5 animate-spin" /> Uploading...</> : <><Upload size={12} className="inline mr-1.5" /> Upload Resume</>}
                      </motion.button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={e => { const file = e.target.files?.[0]; if (file) handleResumeUpload(file); e.target.value = ""; }} />
                </ProfileSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
