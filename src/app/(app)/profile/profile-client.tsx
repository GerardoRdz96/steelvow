"use client";

import { useI18n, LanguageToggle } from "@/lib/i18n/context";

interface ProfileClientProps {
  email: string;
  initial: string;
  role: string;
  companyName: string;
}

export function ProfileClient({ email, initial, role, companyName }: ProfileClientProps) {
  const { t } = useI18n();

  return (
    <div className="px-4 py-6 md:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">
        {t("profile.title")}
      </h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
            <span className="text-xl font-extrabold text-orange-600">
              {initial}
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{email}</p>
            <p className="text-sm text-concrete-600">{role}</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm font-medium text-slate-900">
            {t("profile.language_toggle")}
          </span>
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm font-medium text-slate-900">
            {t("profile.company")}
          </span>
          <span className="text-sm text-concrete-600">{companyName}</span>
        </div>
      </div>

      {/* Sign Out */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-3 rounded-xl transition-colors min-h-[48px]"
        >
          {t("profile.sign_out")}
        </button>
      </form>

      <p className="text-center text-xs text-concrete-600 mt-8">
        {t("footer.attribution")}
      </p>
    </div>
  );
}
