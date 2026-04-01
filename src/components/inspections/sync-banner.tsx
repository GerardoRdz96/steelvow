"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { syncInspection } from "@/app/(app)/inspect/actions";

export function SyncBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    async function checkPending() {
      const count = await db.inspections
        .filter((i) => i.syncedAt === null)
        .count();
      setPendingCount(count);
    }
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) return null;

  // BUG-SV-016: Debounce sync button — 10s cooldown after click
  const handleSync = async () => {
    if (cooldown) return;
    setSyncing(true);
    setCooldown(true);
    try {
      const pending = await db.inspections
        .filter((i) => i.syncedAt === null)
        .toArray();

      for (const inspection of pending) {
        try {
          await syncInspection({
            offlineId: inspection.offlineId,
            projectId: inspection.projectId,
            checklistType: inspection.checklistType,
            status: inspection.status,
            findings: inspection.findings,
            score: inspection.score,
            completedAt: inspection.completedAt,
            createdAt: inspection.createdAt,
          });
          await db.inspections.update(inspection.offlineId, {
            syncedAt: new Date().toISOString(),
          });
        } catch {
          console.error(`Failed to sync inspection ${inspection.offlineId}`);
        }
      }

      const remaining = await db.inspections
        .filter((i) => i.syncedAt === null)
        .count();
      setPendingCount(remaining);
    } finally {
      setSyncing(false);
      setTimeout(() => setCooldown(false), 10000);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-yellow-800">
          {pendingCount} inspection{pendingCount !== 1 ? "s" : ""} saved offline
        </p>
        <p className="text-xs text-yellow-700">
          Tap sync to upload to the server
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
