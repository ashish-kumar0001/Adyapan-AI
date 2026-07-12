"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, ShieldCheck, Lock, Globe, Mail, Phone, User
} from "lucide-react";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
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

export function ManageAccountView() {
  const theme = useTheme();
  const isDark = theme === "dark";

  const c = {
    text: isDark ? "#ffffff" : "#0f172a",
    textSec: isDark ? "rgba(255,255,255,0.7)" : "#475569",
    textMuted: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8",
    cardBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    primary: "#f59e0b",
    inputBg: isDark ? "rgba(0,0,0,0.4)" : "#ffffff",
  };

  const [fullName, setFullName] = useState("Ashish Kumar");
  const [email, setEmail] = useState("ashish@adyapan.ai");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [twoFactor, setTwoFactor] = useState(false);
  const [privacyProfile, setPrivacyProfile] = useState(true);
  const [privacyResume, setPrivacyResume] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("adyapan-full-name");
    const storedEmail = localStorage.getItem("adyapan-email");
    const storedPhone = localStorage.getItem("adyapan-phone");
    if (storedName) setFullName(storedName);
    if (storedEmail) setEmail(storedEmail);
    if (storedPhone) setPhone(storedPhone);
  }, []);

  const handleSave = () => {
    localStorage.setItem("adyapan-full-name", fullName);
    localStorage.setItem("adyapan-email", email);
    localStorage.setItem("adyapan-phone", phone);
    toast.success("Account preferences updated successfully!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto p-1"
      style={{ color: c.text }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="text-amber-500" size={22} /> Manage Account
        </h1>
        <p className="text-xs mt-1" style={{ color: c.textMuted }}>
          Update your profile information, manage OAuth credentials, and adjust security or privacy policies.
        </p>
      </div>

      {/* Main Grid */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        
        {/* Personal Details Form */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
          whileHover={{ y: -2, scale: 1.005 }}
          className="p-5 border rounded-2xl space-y-4"
          style={{ background: c.cardBg, borderColor: c.border }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.primary }}>
            <User size={16} /> Personal Information
          </h3>
          <div className="space-y-3">
            {[
              { label: "Full Name", val: fullName, set: setFullName, icon: null },
              { label: "Email Address", val: email, set: setEmail, icon: <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} /> },
              { label: "Phone Number", val: phone, set: setPhone, icon: <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} /> },
            ].map((field, i) => (
              <motion.div key={field.label} custom={i} variants={fadeUp} initial="hidden" animate="visible" className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: c.textSec }}>{field.label}</label>
                {field.label === "Full Name" ? (
                  <input
                    value={field.val as string}
                    onChange={(e) => (field.set as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border focus:border-amber-500 focus:outline-none rounded-lg p-2.5 text-xs transition-colors"
                    style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                  />
                ) : (
                  <div className="relative">
                    <input
                      value={field.val as string}
                      onChange={(e) => (field.set as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border focus:border-amber-500 focus:outline-none rounded-lg p-2.5 pl-8 text-xs transition-colors"
                      style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
                    />
                    {field.icon}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Connections & Security Column */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="space-y-6"
        >
          <motion.div
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-5 border rounded-2xl space-y-4"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.primary }}>
              <Globe size={16} /> Connected Accounts
            </h3>
            <div className="space-y-3 text-xs">
              {([
                { name: "Google Account", status: "Connected" },
                { name: "GitHub OAuth", status: "Connected" },
                { name: "LinkedIn Profile", status: null },
              ] as { name: string; status: string | null }[]).map((acct, i) => (
                <motion.div
                  key={acct.name}
                  custom={i} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex justify-between items-center p-2.5 border rounded-xl"
                  style={{ borderColor: c.border }}
                >
                  <span className="font-semibold">{acct.name}</span>
                  {acct.status ? (
                    <span className="text-emerald-500 font-bold">{acct.status}</span>
                  ) : (
                    <motion.button
                      onClick={() => toast.success("Connected to LinkedIn successfully!")}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="text-amber-500 hover:underline font-bold"
                    >
                      Connect
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-5 border rounded-2xl space-y-4"
            style={{ background: c.cardBg, borderColor: c.border }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.primary }}>
              <Lock size={16} /> Security
            </h3>
            <div className="flex justify-between items-center">
              <div className="text-xs">
                <span className="font-semibold block">Two-Factor Authentication</span>
                <span className="text-[10px]" style={{ color: c.textMuted }}>Secure account logins with SMS/Email checks.</span>
              </div>
              <motion.button
                onClick={() => setTwoFactor(!twoFactor)}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-6 rounded-full relative transition-colors ${twoFactor ? "bg-amber-500" : "bg-white/10"}`}
                style={{ border: `1px solid ${c.border}` }}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${twoFactor ? "right-1" : "left-1"}`} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

      </motion.div>

      {/* Privacy settings */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        whileHover={{ y: -2, scale: 1.005 }}
        className="p-5 border rounded-2xl space-y-4"
        style={{ background: c.cardBg, borderColor: c.border }}
      >
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: c.primary }}>
          <ShieldCheck size={16} /> Privacy Visibility
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: "Public Community Profile", desc: "Allow followers to view achievements and feeds.", val: privacyProfile, set: setPrivacyProfile },
            { label: "Resume Visibility", desc: "Share resume documents with partner recruiters.", val: privacyResume, set: setPrivacyResume },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              custom={i} variants={fadeUp} initial="hidden" animate="visible"
              className="flex justify-between items-center"
            >
              <div className="text-xs">
                <span className="font-semibold block">{item.label}</span>
                <span className="text-[10px]" style={{ color: c.textMuted }}>{item.desc}</span>
              </div>
              <motion.button
                onClick={() => item.set(!item.val)}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-6 rounded-full relative transition-colors ${item.val ? "bg-amber-500" : "bg-white/10"}`}
                style={{ border: `1px solid ${c.border}` }}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.val ? "right-1" : "left-1"}`} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Save Button Row */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="flex justify-end pt-2"
      >
        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="py-2.5 px-6 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-extrabold text-xs transition-all"
        >
          Save Settings
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

