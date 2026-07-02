import Link from "next/link";
import { ChartNoAxesColumn, ShieldCheck, UserRound } from "lucide-react";
import type { UserRole } from "@/types/user";
import { cn } from "@/lib/cn";

type SidebarProps = {
  role: UserRole;
  active?: "dashboard" | "profile";
};

const roleItems = {
  user: [
    { label: "Dashboard", href: "/dashboard/user", key: "dashboard", icon: ChartNoAxesColumn },
    { label: "Profile", href: "/profile/user", key: "profile", icon: UserRound },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", key: "dashboard", icon: ChartNoAxesColumn },
    { label: "Profile", href: "/profile/admin", key: "profile", icon: ShieldCheck },
  ],
} as const;

export function Sidebar({ role, active = "dashboard" }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 rounded-lg border border-[#d9ded4] bg-white p-3 shadow-sm lg:w-64">
      <div className="px-2 py-3">
        <p className="text-xs font-semibold uppercase text-[#6b756f]">{role} workspace</p>
      </div>
      <div className="flex gap-2 lg:flex-col">
        {roleItems[role].map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 flex-1 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors lg:flex-none",
                isActive
                  ? "bg-[#e0f2f1] text-[#115e59]"
                  : "text-[#334039] hover:bg-[#eef3ea]",
              )}
            >
              <Icon aria-hidden="true" size={17} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
