"use client";

import { useState, useEffect } from "react";
import { db, getDecryptedIncidents, getDecryptedToolboxTalks } from "@/lib/db";
import { syncIncident } from "@/app/(app)/report/actions";
import { syncToolboxTalk } from "@/app/(app)/report/actions";

export function ReportSyncBanner() {
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [pendingTalks, setPendingTalks] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    async function checkPending() {
      const incidents = await db.incidents.filter((i) => i.syncedAt === null).count();
      const talks = await db.toolboxTalks.filter((t) => t.syncedAt === null).count();
      setPendingIncidents(incidents);
      setPendingTalks(talks);
    }
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  const total = pendingIncidents + pendingTalks;
  if (total === 0) return null;

  const handleSync = async () => {
    if (cooldown) return;
    setSyncing(true);
    setCooldown(true);
    try {
      const pendingI = await getDecryptedIncidents((i) => i.syncedAt === null);
      for (const incident of pendingI) {
        try {
          await syncIncident({
            offlineId: incident.offlineId,
            projectId: incident.projectId,
            incidentType: incident.incidentType,
            severity: incident.severity,
            description: incident.description,
            locationDescription: incident.locationDescription,
            occurredAt: incident.occurredAt,
            oshaReportable: incident.oshaReportable,
            privacyConcern: incident.privacyConcern || false,
            photos: incident.photos,
            createdAt: incident.createdAt,
          });
          await db.incidents.update(incident.offlineId, { syncedAt: new Date().toISOString() });
        } catch {
          console.error(`Failed to sync incident ${incident.offlineId}`);
        }
      }

      const pendingT = await getDecryptedToolboxTalks((t) => t.syncedAt === null);
      for (const talk of pendingT) {
        try {
          await syncToolboxTalk({
            offlineId: talk.offlineId,
            projectId: talk.projectId,
            topic: talk.topic,
            durationMinutes: talk.durationMinutes,
            attendees: talk.attendees,
            signatures: talk.signatures,
            notes: talk.notes,
            createdAt: talk.createdAt,
          });
          await db.toolboxTalks.update(talk.offlineId, { syncedAt: new Date().toISOString() });
        } catch {
          console.error(`Failed to sync toolbox talk ${talk.offlineId}`);
        }
      }

      const ri = await db.incidents.filter((i) => i.syncedAt === null).count();
      const rt = await db.toolboxTalks.filter((t) => t.syncedAt === null).count();
      setPendingIncidents(ri);
      setPendingTalks(rt);
    } finally {
      setSyncing(false);
      setTimeout(() => setCooldown(false), 10000);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-yellow-800">
          {total} report{total !== 1 ? "s" : ""} saved offline
        </p>
        <p className="text-xs text-yellow-700">
          {pendingIncidents > 0 && `${pendingIncidents} incident${pendingIncidents !== 1 ? "s" : ""}`}
          {pendingIncidents > 0 && pendingTalks > 0 && " + "}
          {pendingTalks > 0 && `${pendingTalks} toolbox talk${pendingTalks !== 1 ? "s" : ""}`}
        </p>
      </div>
      <button
        onClick={handleSync}
        disabled={syncing || cooldown}
        className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors min-h-[40px] disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync"}
      </button>
    </div>
  );
}
