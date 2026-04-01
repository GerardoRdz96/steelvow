"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

import type { TranslationKey } from "@/lib/i18n/translations";

const tabs: { href: string; labelKey: TranslationKey; icon: React.ReactNode }[] = [
  {
    href: "/dashboard",
    labelKey: "nav.home",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: "/inspect",
    labelKey: "nav.inspect",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
  {
    href: "/report",
    labelKey: "nav.report",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  },
];

const moreItems: { href: string; labelKey: TranslationKey }[] = [
  { href: "/workers", labelKey: "nav.workers" },
  { href: "/projects", labelKey: "nav.projects" },
  { href: "/safety-programs", labelKey: "nav.safety_programs" },
  { href: "/osha-logs", labelKey: "nav.osha_logs" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/profile", labelKey: "nav.profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* More sheet overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More sheet */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-white border-t border-slate-200 rounded-t-2xl shadow-lg pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="p-4 space-y-1">
            {moreItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setShowMore(false)}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-xl transition-colors ${
                  isActive
                    ? "text-orange-600"
                    : "text-concrete-600 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span className="text-xs font-medium mt-0.5">{t(tab.labelKey)}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-xl transition-colors ${
              isMoreActive || showMore
                ? "text-orange-600"
                : "text-concrete-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="text-xs font-medium mt-0.5">{t("nav.more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
