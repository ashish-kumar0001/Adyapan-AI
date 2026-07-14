"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Award, Users, Globe, Share2, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getDiceBearUrl } from "@/lib/avatar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.3 } }),
};

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(t);
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

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
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

function calcCompletion(p: ProfileData | null): number {
  if (!p) return 0;
  const fields = [
    p.user?.name, p.user?.email, p.username, p.phone, p.location, p.aboutMe,
    p.college, p.branch, p.degree, p.graduationYear, p.skills?.length > 0 ? "y" : "",
    p.interestedDomains?.length > 0 ? "y" : "", p.targetRole, p.careerObjective,
    p.linkedin, p.github, p.resumeUrl
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export function CommunityProfileView() {
  const theme = useTheme();
  const isDark = theme === "dark";

  const c = {
    text: isDark ? "#ffffff" : "#0f172a",
    textSec: isDark ? "rgba(255,255,255,0.7)" : "#475569",
    textMuted: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    primary: "#f59e0b",
    green: "#10b981",
  };

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] font-semibold animate-pulse" style={{ color: "var(--text-muted)" }}>
        Loading community profile…
      </div>
    );
  }

  const displayName = profile?.user?.name ?? "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const username = profile?.username ? `@${profile.username}` : `@${displayName.toLowerCase().replace(/\s+/g, "")}`;
  const bio = profile?.aboutMe || profile?.careerObjective || "Tell the community about yourself by editing your profile!";
  const completion = calcCompletion(profile);

  const projects = [];
  if (profile?.github) projects.push({ name: "GitHub Profile", url: profile.github });
  if (profile?.portfolio) projects.push({ name: "Personal Portfolio", url: profile.portfolio });
  if (profile?.linkedin) projects.push({ name: "LinkedIn Profile", url: profile.linkedin });

  const displaySkills = profile?.skills && profile.skills.length > 0 ? profile.skills : ["React", "TypeScript", "Node.js", "Python", "SQL"];
  const verifiedSkills = profile?.interestedDomains && profile.interestedDomains.length > 0 ? profile.interestedDomains : ["DSA Concepts", "Generative APIs"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto p-1"
      style={{ color: c.text }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <User className="text-amber-500" size={22} /> Community Profile
        </h1>
        <p className="text-xs mt-1" style={{ color: c.textMuted }}>
          View and manage your public rank, statistics, and accomplishments in the Adyapan community.
        </p>
      </div>

      {/* Main Grid */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        
        {/* Left Column - Profile Summary Card */}
        <div className="md:col-span-2 space-y-6">
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" animate="visible"
            whileHover={{ y: -3, scale: 1.01 }}
            className="p-6 border rounded-2xl flex flex-col sm:flex-row items-center gap-6"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full border-2 border-amber-500 shrink-0 overflow-hidden"
            >
              <img src={getDiceBearUrl(displayName)} alt="avatar" width={80} height={80} style={{ borderRadius: "50%", display: "block" }} />
            </motion.div>
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-extrabold" style={{ color: c.text }}>{displayName}</h2>
              <span className="text-xs font-bold block" style={{ color: c.textMuted }}>{username}</span>
              <p className="text-sm leading-relaxed" style={{ color: c.textSec }}>{bio}</p>
            </div>
          </motion.div>

          {/* Stats widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Profile Completion", val: `${completion}%`, icon: <User className="text-amber-500" /> },
              { label: "Reputation Score", val: "1,240", icon: <Award className="text-cyan-500" /> },
              { label: "Followers", val: "880", icon: <Users className="text-emerald-500" /> },
              { label: "Community Rank", val: "#14", icon: <Award className="text-purple-500" /> }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -3, scale: 1.01 }}
                className="p-4 border rounded-xl flex items-center justify-between"
                style={{ background: c.cardBg, borderColor: c.border }}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textMuted }}>{card.label}</span>
                  <span className="text-lg font-extrabold block">{card.val}</span>
                </div>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0"
                >
                  {card.icon}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Published Projects / Portfolio Links */}
          <motion.div
            custom={4} variants={fadeUp} initial="hidden" animate="visible"
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-5 border rounded-2xl space-y-4"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Globe className="text-amber-500" size={16} /> Portfolio & Social Links
            </h3>
            {projects.length === 0 ? (
              <p className="text-xs italic" style={{ color: c.textMuted }}>No public profile links provided. Edit your profile to add LinkedIn, GitHub, or Portfolio links.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((proj, i) => (
                  <motion.a
                    key={proj.name}
                    href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                    target="_blank"
                    rel="noreferrer"
                    custom={i} variants={fadeUp} initial="hidden" animate="visible"
                    whileHover={{ y: -2, x: 4 }}
                    className="p-3 border rounded-xl flex items-center justify-between block cursor-pointer"
                    style={{ borderColor: c.border }}
                  >
                    <div>
                      <span className="font-extrabold block text-sm">{proj.name}</span>
                      <span className="text-xs" style={{ color: c.textMuted }}>{proj.url}</span>
                    </div>
                    <Globe size={16} className="text-cyan-500" />
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="space-y-6"
        >
          {/* Stats List */}
          <motion.div
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-5 border rounded-2xl space-y-4"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <h3 className="text-sm font-bold" style={{ color: c.primary }}>Community Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { label: "Profile Views", val: "124" },
                { label: "Followers", val: "880" },
                { label: "Following", val: "190" },
                { label: "Connections", val: "320" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i} variants={scaleIn} initial="hidden" animate="visible"
                  className="p-3 border rounded-xl"
                  style={{ borderColor: c.border }}
                >
                  <span className="text-[10px] block" style={{ color: c.textMuted }}>{stat.label}</span>
                  <span className="text-base font-black">{stat.val}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Skills Portfolio */}
          <motion.div
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-5 border rounded-2xl space-y-4"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <h3 className="text-sm font-bold" style={{ color: c.primary }}>Skills Portfolio</h3>
            <div className="space-y-3">
              {[
                { label: "Technical Skills", skills: displaySkills, verified: false },
                { label: "Interested Domains", skills: verifiedSkills, verified: true },
              ].map((group, i) => (
                <motion.div key={group.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                  <span className="text-xs font-bold block mb-2" style={{ color: c.textSec }}>{group.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.skills.map(s => (
                      <span
                        key={s}
                        className={`px-2.5 py-1 rounded text-xs font-bold ${group.verified ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-white/5 border"}`}
                        style={group.verified ? {} : { borderColor: c.border, color: c.textSec }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="flex gap-2.5 justify-stretch"
          >
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex-1 py-2.5 px-4 rounded-xl border hover:bg-white/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ borderColor: c.border, background: c.cardBg }}
            >
              <Share2 size={14} /> Share Profile
            </motion.button>
            <motion.button
              onClick={() => toast.info("Messaging is disabled in preview mode.")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={14} /> Message
            </motion.button>
          </motion.div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}

