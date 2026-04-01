"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { t as translate, type Locale, type TranslationKey } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "steelvow-locale";

// BUG-SV-053: SSR-safe localStorage read to prevent hydration flash
function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "es" ? "es" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Use "en" for SSR, then sync on mount — suppressHydrationWarning on wrapper
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(key, locale),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {/* Prevent flash: hide content until locale is resolved from storage */}
      <div suppressHydrationWarning style={mounted ? undefined : { visibility: "hidden" }}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "es" : "en")}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 min-h-[44px]"
      title={locale === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      <span className="text-base">{locale === "en" ? "🇺🇸" : "🇲🇽"}</span>
      <span>{locale === "en" ? "EN" : "ES"}</span>
    </button>
  );
}
