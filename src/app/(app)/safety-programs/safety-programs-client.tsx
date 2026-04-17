"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { generateSafetyProgram, deleteSafetyProgram } from "./actions";
import { PROGRAM_LABELS } from "@/lib/safety-program-labels";
import { useI18n } from "@/lib/i18n/context";
import type { SafetyProgram, SafetyProgramType, Language } from "@/types/database";

// BUG-SV-050: Parse inline markdown formatting (**bold**, *italic*, `code`)
function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++} className="font-semibold text-slate-900">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="bg-slate-100 px-1 rounded text-xs">{match[4]}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length ? parts : [text];
}

const PROGRAM_TYPES: SafetyProgramType[] = [
  "fall_protection",
  "hazcom",
  "respiratory",
  "loto",
  "heat",
];

const PROGRAM_ICONS: Record<SafetyProgramType, string> = {
  fall_protection: "FP",
  hazcom: "HC",
  respiratory: "RP",
  loto: "LT",
  heat: "HI",
};

const PROGRAM_COLORS: Record<SafetyProgramType, string> = {
  fall_protection: "bg-red-100 text-red-700",
  hazcom: "bg-yellow-100 text-yellow-700",
  respiratory: "bg-blue-100 text-blue-700",
  loto: "bg-purple-100 text-purple-700",
  heat: "bg-orange-100 text-orange-700",
};

export function SafetyProgramsClient({ programs, companyName }: { programs: SafetyProgram[]; companyName: string }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewing, setViewing] = useState<SafetyProgram | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(type: SafetyProgramType, lang: Language) {
    const key = `${type}-${lang}`;
    setGenerating(key);
    setError(null);
    try {
      const result = await generateSafetyProgram(type, lang);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      // BUG-SV-049: Clear viewing state so list re-renders with fresh data
      if (viewing?.program_type === type && viewing?.language === lang) {
        setViewing(null);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("safety.delete_confirm"))) return;
    try {
      await deleteSafetyProgram(id);
      if (viewing?.id === id) setViewing(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  // Page header (i18n)
  const pageHeader = (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        {t("safety.title")}
      </h1>
      <p className="text-sm text-concrete-600 mt-1">
        {t("safety.subtitle")} {companyName || (locale === "es" ? "tu empresa" : "your company")}
      </p>
    </div>
  );

  // If viewing a program, show it full screen
  if (viewing) {
    return (
      <div>
        {pageHeader}
        <button
          onClick={() => setViewing(null)}
          className="flex items-center gap-2 text-sm font-semibold text-orange-600 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {t("safety.back_to_programs")}
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold ${PROGRAM_COLORS[viewing.program_type]}`}>
                {PROGRAM_ICONS[viewing.program_type]}
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {PROGRAM_LABELS[viewing.program_type][viewing.language]}
                </h2>
                <p className="text-xs text-concrete-600">
                  v{viewing.version} &middot; {viewing.language === "es" ? "Español" : "English"} &middot; {t("safety.generated_by_ai")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate(viewing.program_type, viewing.language)}
                disabled={!!generating}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-2 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {generating ? t("safety.regenerating") : t("safety.regenerate")}
              </button>
            </div>
          </div>

          <div className="prose prose-sm prose-slate max-w-none">
            {viewing.content.split("\n").map((line, i) => {
              if (line.startsWith("### ")) {
                return <h3 key={i} className="text-base font-bold text-slate-900 mt-6 mb-2">{parseInline(line.replace("### ", ""))}</h3>;
              }
              if (line.startsWith("## ")) {
                return <h2 key={i} className="text-lg font-bold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-200">{parseInline(line.replace("## ", ""))}</h2>;
              }
              if (line.startsWith("# ")) {
                return <h1 key={i} className="text-xl font-extrabold text-slate-900 mt-4 mb-4">{parseInline(line.replace("# ", ""))}</h1>;
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return <li key={i} className="text-sm text-slate-700 ml-4 mb-1">{parseInline(line.replace(/^[-*] /, ""))}</li>;
              }
              if (line.match(/^\d+\./)) {
                return <li key={i} className="text-sm text-slate-700 ml-4 mb-1 list-decimal">{parseInline(line.replace(/^\d+\.\s*/, ""))}</li>;
              }
              if (line.trim() === "") {
                return <div key={i} className="h-2" />;
              }
              return <p key={i} className="text-sm text-slate-700 mb-1">{parseInline(line)}</p>;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {pageHeader}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Generate new programs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">{t("safety.generate_section_title")}</h2>
        <p className="text-xs text-concrete-600 mb-4">
          {t("safety.generate_description")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAM_TYPES.map((type) => {
            const existingEn = programs.find((p) => p.program_type === type && p.language === "en");
            const existingEs = programs.find((p) => p.program_type === type && p.language === "es");
            return (
              <div
                key={type}
                className="border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold ${PROGRAM_COLORS[type]}`}>
                    {PROGRAM_ICONS[type]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{PROGRAM_LABELS[type].en}</p>
                    <p className="text-xs text-concrete-600">{PROGRAM_LABELS[type].es}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => existingEn ? setViewing(existingEn) : handleGenerate(type, "en")}
                    disabled={generating === `${type}-en`}
                    className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg min-h-[40px] transition-colors ${
                      existingEn
                        ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        : "bg-orange-600 text-white hover:bg-orange-700"
                    } disabled:opacity-50`}
                  >
                    {generating === `${type}-en`
                      ? "Generating..."
                      : existingEn
                      ? `EN v${existingEn.version}`
                      : "Generate EN"}
                  </button>
                  <button
                    onClick={() => existingEs ? setViewing(existingEs) : handleGenerate(type, "es")}
                    disabled={generating === `${type}-es`}
                    className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg min-h-[40px] transition-colors ${
                      existingEs
                        ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        : "bg-orange-600 text-white hover:bg-orange-700"
                    } disabled:opacity-50`}
                  >
                    {generating === `${type}-es`
                      ? "Generando..."
                      : existingEs
                      ? `ES v${existingEs.version}`
                      : "Generar ES"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Existing programs list */}
      {programs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">{t("safety.your_programs")} ({programs.length})</h2>
          <div className="space-y-2">
            {programs.map((program) => (
              <div
                key={program.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <button
                  onClick={() => setViewing(program)}
                  className="flex items-center gap-3 text-left flex-1"
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold ${PROGRAM_COLORS[program.program_type]}`}>
                    {PROGRAM_ICONS[program.program_type]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {PROGRAM_LABELS[program.program_type][program.language]}
                    </p>
                    <p className="text-xs text-concrete-600">
                      v{program.version} &middot; {program.language === "es" ? "Español" : "English"} &middot;{" "}
                      {program.last_reviewed_at
                        ? new Date(program.last_reviewed_at).toLocaleDateString()
                        : t("safety.never_reviewed")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(program.id)}
                  className="text-concrete-600 hover:text-red-600 p-2 rounded-lg transition-colors"
                  title="Delete program"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
