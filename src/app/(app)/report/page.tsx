"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getDecryptedRecentIncidents,
  getDecryptedRecentToolboxTalks,
  type OfflineIncident,
  type OfflineToolboxTalk,
} from "@/lib/db";
import { ReportSyncBanner } from "@/components/incidents/report-sync-banner";
import { AttributionFooter } from "@/components/layout/attribution-footer";

export default function ReportPageWrapper() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-center text-concrete-600 text-sm">Loading...</div>}>
      <ReportPage />
    </Suspense>
  );
}

function ReportPage() {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");
  const [recentIncidents, setRecentIncidents] = useState<OfflineIncident[]>([]);
  const [recentTalks, setRecentTalks] = useState<OfflineToolboxTalk[]>([]);

  useEffect(() => {
    async function loadRecent() {
      const incidents = await getDecryptedRecentIncidents(10);
      setRecentIncidents(incidents);

      const talks = await getDecryptedRecentToolboxTalks(10);
      setRecentTalks(talks);
    }
    loadRecent();
  }, [saved]);

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Incidents & Reports
        </h1>
      </div>

      {/* Success Toasts */}
      {saved === "incident" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-green-800">Incident report saved!</p>
        </div>
      )}
      {saved === "talk" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-green-800">Toolbox talk recorded!</p>
        </div>
      )}

      {/* Sync Banner */}
      <ReportSyncBanner />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <Link
          href="/report/incident"
          className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-red-300 transition-colors flex items-center gap-4 min-h-[56px]"
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 text-red-600 font-bold text-lg">
            !
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Incident Report</p>
            <p className="text-xs text-concrete-600">Injury, near-miss, or property damage</p>
          </div>
          <svg className="w-5 h-5 text-concrete-600 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/report/toolbox-talk"
          className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 transition-colors flex items-center gap-4 min-h-[56px]"
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
            T
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Toolbox Talk</p>
            <p className="text-xs text-concrete-600">Log safety meeting with signatures</p>
          </div>
          <svg className="w-5 h-5 text-concrete-600 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Incidents</h2>
        {recentIncidents.length === 0 ? (
          <div className="text-center py-6 text-concrete-600">
            <p className="text-sm">No incidents reported yet.</p>
            <p className="text-xs mt-1">Use the button above to file your first report.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div
                key={incident.offlineId}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                    incident.incidentType === "injury"
                      ? "bg-red-100 text-red-600"
                      : incident.incidentType === "near_miss"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                  }`}>
                    {incident.incidentType === "injury" ? "!" :
                     incident.incidentType === "near_miss" ? "~" : "#"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {incident.incidentType.replace("_", " ")}
                    </p>
                    <p className="text-xs text-concrete-600">
                      {new Date(incident.createdAt).toLocaleDateString()}
                      {" · "}
                      <span className={
                        incident.severity === "fatal" ? "text-red-600 font-medium" :
                        incident.severity === "serious" ? "text-orange-600 font-medium" :
                        "text-yellow-600"
                      }>
                        {incident.severity}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-concrete-600">
                  {incident.syncedAt ? "Synced" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Toolbox Talks */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Toolbox Talks</h2>
        {recentTalks.length === 0 ? (
          <div className="text-center py-6 text-concrete-600">
            <p className="text-sm">No toolbox talks recorded yet.</p>
            <p className="text-xs mt-1">Log your safety meetings to prove training delivery.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTalks.map((talk) => (
              <div
                key={talk.offlineId}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{talk.topic}</p>
                  <p className="text-xs text-concrete-600">
                    {new Date(talk.createdAt).toLocaleDateString()}
                    {" · "}
                    {talk.durationMinutes} min
                    {" · "}
                    {talk.attendees.length} attendee{talk.attendees.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-xs text-concrete-600">
                  {talk.syncedAt ? "Synced" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AttributionFooter />
    </div>
  );
}
