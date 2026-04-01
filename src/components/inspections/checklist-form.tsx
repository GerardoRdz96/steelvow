"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, type ChecklistFinding } from "@/lib/db";
import { type ChecklistTemplate } from "@/lib/checklist-templates";

interface ChecklistFormProps {
  template: ChecklistTemplate;
  companyId: string;
  projectId: string;
  workerId: string;
  onComplete: () => void;
}

export function ChecklistForm({
  template,
  companyId,
  projectId,
  workerId,
  onComplete,
}: ChecklistFormProps) {
  const [findings, setFindings] = useState<ChecklistFinding[]>(
    template.items.map((item) => ({
      id: item.id,
      label: item.label,
      result: null,
      notes: "",
      photoPath: null,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const completedCount = findings.filter((f) => f.result !== null).length;
  const totalCount = findings.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const setResult = useCallback(
    (id: string, result: "pass" | "fail" | "na") => {
      setFindings((prev) =>
        prev.map((f) => (f.id === id ? { ...f, result } : f))
      );
    },
    []
  );

  const setNotes = useCallback((id: string, notes: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, notes } : f))
    );
  }, []);

  const calculateScore = (items: ChecklistFinding[]): number => {
    const scoreable = items.filter((f) => f.result !== "na" && f.result !== null);
    if (scoreable.length === 0) return 100;
    const passed = scoreable.filter((f) => f.result === "pass").length;
    return Math.round((passed / scoreable.length) * 100);
  };

  const handleSave = async (asDraft: boolean) => {
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const score = calculateScore(findings);

      await db.inspections.add({
        offlineId: uuidv4(),
        companyId,
        projectId,
        workerId,
        checklistType: template.type,
        status: asDraft ? "draft" : "completed",
        findings,
        score: asDraft ? null : score,
        completedAt: asDraft ? null : now,
        createdAt: now,
        syncedAt: null,
      });

      onComplete();
    } catch (err) {
      console.error("Failed to save inspection:", err);
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Group findings by category
  const categories = template.items.reduce<Record<string, typeof template.items>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="pb-32">
      {/* BUG-SV-018: Inline error banner replaces alert() */}
      {saveError && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-red-800">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="text-red-600 text-sm font-bold ml-3">X</button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-700">
            {completedCount} / {totalCount} items
          </span>
          <span className="text-xs font-bold text-orange-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items by Category */}
      <div className="px-4 py-4 space-y-6">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-bold text-concrete-600 uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((item) => {
                const finding = findings.find((f) => f.id === item.id)!;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 transition-colors ${
                      finding.result === "pass"
                        ? "border-green-300 bg-green-50/50"
                        : finding.result === "fail"
                        ? "border-red-300 bg-red-50/50"
                        : finding.result === "na"
                        ? "border-slate-200 bg-slate-50/50 opacity-60"
                        : "border-slate-200"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900 mb-3">
                      {item.label}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResult(item.id, "pass")}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[48px] ${
                          finding.result === "pass"
                            ? "bg-green-600 text-white"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => setResult(item.id, "fail")}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[48px] ${
                          finding.result === "fail"
                            ? "bg-red-600 text-white"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        Fail
                      </button>
                      <button
                        type="button"
                        onClick={() => setResult(item.id, "na")}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-colors min-h-[48px] ${
                          finding.result === "na"
                            ? "bg-slate-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        N/A
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedNotes(
                            expandedNotes === item.id ? null : item.id
                          )
                        }
                        className="py-3 px-3 rounded-xl text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors min-h-[48px]"
                        title="Add notes"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Notes Expansion */}
                    {expandedNotes === item.id && (
                      <textarea
                        value={finding.notes}
                        onChange={(e) => setNotes(item.id, e.target.value)}
                        placeholder="Add notes..."
                        className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-20">
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors min-h-[48px] disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving || completedCount === 0}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors min-h-[48px] disabled:opacity-50 disabled:bg-orange-300"
        >
          {saving ? "Saving..." : "Complete Inspection"}
        </button>
      </div>
    </div>
  );
}
