"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

const navItems: Array<{ href: string; labelKey: TranslationKey; icon: string }> = [
  { href: "/dashboard", labelKey: "nav.home", icon: "H" },
  { href: "/workers", labelKey: "nav.workers", icon: "W" },
  { href: "/projects", labelKey: "nav.projects", icon: "J" },
  { href: "/inspect", labelKey: "nav.inspections", icon: "I" },
  { href: "/report", labelKey: "nav.incidents", icon: "R" },
  { href: "/osha-logs", labelKey: "nav.osha_logs", icon: "3" },
  { href: "/safety-programs", labelKey: "nav.safety_programs", icon: "S" },
  { href: "/pricing", labelKey: "nav.pricing", icon: "$" },
  { href: "/profile", labelKey: "nav.profile", icon: "P" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900">
      <div className="flex items-center h-16 px-6">
        <span className="text-xl font-extrabold tracking-tight text-white">
          Steel<span className="text-orange-500">vow</span>
        </span>
      </div>
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-xs font-bold">
                {item.icon}
              </span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-500">
        {t("footer.attribution")}
      </div>
    </aside>
  );
}
