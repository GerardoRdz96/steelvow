"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CHECKLIST_TEMPLATES, CHECKLIST_TYPES } from "@/lib/checklist-templates";
import { db, type OfflineInspection } from "@/lib/db";
import { SyncBanner } from "@/components/inspections/sync-banner";

export default function InspectPageWrapper() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-center text-concrete-600 text-sm">Loading...</div>}>
      <InspectPage />
    </Suspense>
  );
}

function InspectPage() {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");
  const [recentInspections, setRecentInspections] = useState<OfflineInspection[]>([]);

  useEffect(() => {
    async function loadRecent() {
      const recent = await db.inspections
        .orderBy("createdAt")
        .reverse()
        .limit(10)
        .toArray();
      setRecentInspections(recent);
    }
    loadRecent();
  }, [saved]);

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Inspections
        </h1>
      </div>

      {/* Success Toast */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-green-800">
            Inspection saved successfully!
          </p>
        </div>
      )}

      {/* Sync Banner */}
      <SyncBanner />

      {/* Checklist Types */}
      <h2 className="text-sm font-bold text-concrete-600 uppercase tracking-wider mb-3">
        Start New Inspection
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {CHECKLIST_TYPES.map((type) => {
          const template = CHECKLIST_TEMPLATES[type];
          return (
            <Link
              key={type}
              href={`/inspect/${type}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-orange-400 transition-colors min-h-[56px]"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm mb-2">
                {template.icon}
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {template.name}
              </p>
              <p className="text-xs text-concrete-600 mt-0.5">
                {template.items.length} items
              </p>
            </Link>
          );
        })}

        {/* Coming soon placeholders for remaining types */}
        {[
          { type: "excavation", icon: "E", name: "Excavation" },
          { type: "electrical", icon: "L", name: "Electrical" },
          { type: "ppe", icon: "P", name: "PPE" },
        ].map((item) => (
          <div
            key={item.type}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-left opacity-50 cursor-not-allowed min-h-[56px]"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm mb-2">
              {item.icon}
            </span>
            <p className="text-sm font-semibold text-slate-500">{item.name}</p>
            <p className="text-xs text-concrete-600 mt-0.5">Coming soon</p>
          </div>
        ))}
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Recent Inspections
        </h2>
        {recentInspections.length === 0 ? (
          <div className="text-center py-8 text-concrete-600">
            <p className="text-sm">No inspections completed yet.</p>
            <p className="text-xs mt-1">
              Select a checklist type above to start your first inspection.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInspections.map((inspection) => (
              <div
                key={inspection.offlineId}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {CHECKLIST_TEMPLATES[inspection.checklistType]?.name ||
                      inspection.checklistType}
                  </p>
                  <p className="text-xs text-concrete-600">
                    {new Date(inspection.createdAt).toLocaleDateString()}{" "}
                    {inspection.status === "draft" && (
                      <span className="text-yellow-600 font-medium">Draft</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {inspection.score !== null && (
                    <span
                      className={`text-lg font-extrabold ${
                        inspection.score >= 90
                          ? "text-green-600"
                          : inspection.score >= 70
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {inspection.score}%
                    </span>
                  )}
                  <p className="text-xs text-concrete-600">
                    {inspection.syncedAt ? "Synced" : "Offline"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
