"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Sparkles, Calendar, Award, FileText, Download, Check
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};
import { toast } from "sonner";

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

export function BillingView() {
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
    red: "#ef4444",
    inputBg: isDark ? "rgba(0,0,0,0.4)" : "#ffffff",
  };

  const [couponCode, setCouponCode] = useState("");
  const [billingOfferMsg, setBillingOfferMsg] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "ADYAPAN20") {
      setBillingOfferMsg("🎉 Coupon Applied! You get 20% discount on your next renewal.");
      toast.success("Coupon code applied successfully!");
    } else {
      setBillingOfferMsg("❌ Invalid coupon code.");
      toast.error("Invalid coupon code.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-1"
      style={{ color: c.text }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <CreditCard className="text-amber-500" size={22} /> Billing & Plans
        </h1>
        <p className="text-xs mt-1" style={{ color: c.textMuted }}>
          Manage your subscription plans, view renewal schedules, apply coupons, and download invoice copies.
        </p>
      </div>

      {/* Stats row */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: "Current Plan", val: "Premium", icon: <Sparkles className="text-amber-500 animate-pulse" /> },
          { label: "Next Renewal", val: "Aug 1, 2026", icon: <Calendar className="text-cyan-500" /> },
          { label: "AI Credits Left", val: "36 / 100", icon: <Award className="text-emerald-500" /> },
          { label: "Recent Invoice", val: "#INV-928", icon: <FileText className="text-purple-500" /> }
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
      </motion.div>

      {/* Main Grid */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        
        {/* Plan Details Card */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
          whileHover={{ y: -2, scale: 1.005 }}
          className="p-5 border rounded-2xl space-y-4"
          style={{ background: c.cardBg, borderColor: c.border }}
        >
          <h3 className="text-sm font-bold" style={{ color: c.primary }}>Plan Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2.5" style={{ borderColor: c.border }}>
              <span style={{ color: c.textSec }}>Active Subscription</span>
              <span className="font-bold text-amber-500">Premium Tier</span>
            </div>
            <div className="flex justify-between border-b pb-2.5" style={{ borderColor: c.border }}>
              <span style={{ color: c.textSec }}>Billing Interval</span>
              <span className="font-bold">Monthly</span>
            </div>
            <div className="flex justify-between border-b pb-2.5" style={{ borderColor: c.border }}>
              <span style={{ color: c.textSec }}>Next Renewal Date</span>
              <span className="font-bold">August 1, 2026</span>
            </div>
            <div className="flex justify-between" style={{ color: c.textSec }}>
              <span>Benefits Included</span>
              <span className="font-bold text-emerald-500 flex items-center gap-1">
                <Check size={14} /> Unlimited AI Generations
              </span>
            </div>
          </div>
        </motion.div>

        {/* Coupons & payment details */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          whileHover={{ y: -2, scale: 1.005 }}
          className="p-5 border rounded-2xl space-y-4"
          style={{ background: c.cardBg, borderColor: c.border }}
        >
          <h3 className="text-sm font-bold" style={{ color: c.primary }}>Apply Offers / Coupons</h3>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. ADYAPAN20"
              className="flex-1 bg-[var(--bg-card)] border focus:border-amber-500 focus:outline-none rounded-lg p-2 text-xs transition-colors"
              style={{ background: c.inputBg, color: c.text, borderColor: c.border }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="py-2 px-4 rounded-lg bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-all"
            >
              Apply
            </motion.button>
          </form>
          <AnimatePresence>
            {billingOfferMsg && (
              <motion.p
                key="offer-msg"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-semibold"
                style={{ color: billingOfferMsg.startsWith("❌") ? c.red : c.green }}
              >
                {billingOfferMsg}
              </motion.p>
            )}
          </AnimatePresence>

          <h3 className="text-sm font-bold pt-2" style={{ color: c.primary }}>Saved Payment Method</h3>
          <motion.div
            whileHover={{ y: -2, scale: 1.005 }}
            className="p-3 border rounded-xl flex items-center justify-between text-xs"
            style={{ borderColor: c.border }}
          >
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-amber-500" />
              <span className="font-semibold">Visa Ending in •••• 4242</span>
            </div>
            <span className="text-[10px] text-gray-400">Default card</span>
          </motion.div>
        </motion.div>

      </motion.div>

      {/* Invoice list */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        whileHover={{ y: -2, scale: 1.005 }}
        className="p-5 border rounded-2xl space-y-4"
        style={{ background: c.cardBg, borderColor: c.border }}
      >
        <h3 className="text-sm font-bold" style={{ color: c.primary }}>Invoice History</h3>
        <div className="space-y-2 text-sm leading-relaxed">
          {[
            { id: "INV-928", date: "July 1, 2026", amt: "$15.00", status: "Paid" },
            { id: "INV-815", date: "June 1, 2026", amt: "$15.00", status: "Paid" }
          ].map((inv, i) => (
            <motion.div
              key={inv.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex justify-between items-center p-3 border rounded-xl"
              style={{ borderColor: c.border }}
            >
              <div>
                <span className="font-bold block text-xs">{inv.id} · {inv.date}</span>
                <span className="text-[10px] text-emerald-500">{inv.status}</span>
              </div>
              <motion.button
                onClick={() => toast.success(`Downloaded PDF Invoice ${inv.id}`)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="py-1 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-1 transition-all"
                style={{ borderColor: c.border, color: c.textSec }}
              >
                <Download size={12} /> Download
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

