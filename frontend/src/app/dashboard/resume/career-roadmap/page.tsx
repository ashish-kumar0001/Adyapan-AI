"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  DashboardSidebar,
  DashboardTopNav,
  AdyapanUser,
} from "../../user/page";

const CareerNavigationEngine = dynamic(
  () => import("@/components/resume-hub/CareerNavigationEngine").then(m => m.CareerNavigationEngine),
  { loading: () => <div className="w-full min-h-[400px] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div> }
);

export default function CareerRoadmapPage() {
  useRequireAuth("USER");
  const [user, setUser] = useState<AdyapanUser | null>(null);
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("adyapan-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    try {
      const raw = localStorage.getItem("adyapan-user") || sessionStorage.getItem("adyapan-user");
      if (raw) setUser(JSON.parse(raw) as AdyapanUser);
    } catch {}
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      <DashboardTopNav
        user={user} theme={theme}
        onThemeToggle={() => { const n = theme === "dark" ? "light" : "dark"; setTheme(n); localStorage.setItem("adyapan-theme", n); document.documentElement.setAttribute("data-theme", n); }}
        onViewProfile={() => {}}
        onAdyChat={() => {}}
        onViewTool={() => {}}
        onMenuToggle={() => setSidebarOpen(p => !p)}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadCount={unreadCount}
        onMarkAllRead={() => {}}
        onClearAll={() => {}}
        onPremium={() => {}}
      />
      <DashboardSidebar activeView="resume" onViewDashboard={() => {}} onViewTool={() => {}} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="dash-main relative z-10">
        <CareerNavigationEngine setView={() => {}} />
      </main>
    </div>
  );
}
