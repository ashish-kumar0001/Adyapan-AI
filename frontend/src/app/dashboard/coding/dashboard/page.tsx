"use client";

import dynamic from "next/dynamic";

const CodingDashboardView = dynamic(
  () => import("@/components/coding-hub/CodingDashboardView").then((m) => m.CodingDashboardView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-dark)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 animate-pulse" />
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    ),
  }
);

export default function CodingDashboardPage() {
  return <CodingDashboardView />;
}
