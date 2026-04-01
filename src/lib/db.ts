"use client";

import Dexie, { type EntityTable } from "dexie";
import {
  encryptField,
  decryptField,
  encryptRecord,
  decryptRecord,
} from "./crypto";

export interface OfflineInspection {
  offlineId: string;
  companyId: string;
  projectId: string;
  workerId: string;
  checklistType: string;
  status: "draft" | "completed";
  findings: ChecklistFinding[];
  score: number | null;
  completedAt: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export interface ChecklistFinding {
  id: string;
  label: string;
  result: "pass" | "fail" | "na" | null;
  notes: string;
  photoPath: string | null;
}

export interface OfflineIncident {
  offlineId: string;
  companyId: string;
  projectId: string;
  reportedBy: string;
  incidentType: "injury" | "near_miss" | "property_damage";
  severity: "minor" | "serious" | "fatal";
  description: string;
  locationDescription: string;
  occurredAt: string;
  oshaReportable: boolean;
  privacyConcern: boolean;
  photos: string[];
  createdAt: string;
  syncedAt: string | null;
}

export interface OfflineToolboxTalk {
  offlineId: string;
  companyId: string;
  projectId: string;
  ledBy: string;
  topic: string;
  durationMinutes: number;
  attendees: string[];
  signatures: Record<string, string>;
  notes: string;
  createdAt: string;
  syncedAt: string | null;
}

const db = new Dexie("SteelvowDB") as Dexie & {
  inspections: EntityTable<OfflineInspection, "offlineId">;
  incidents: EntityTable<OfflineIncident, "offlineId">;
  toolboxTalks: EntityTable<OfflineToolboxTalk, "offlineId">;
};

db.version(1).stores({
  inspections: "offlineId, companyId, projectId, status, checklistType, createdAt",
});

db.version(2).stores({
  inspections: "offlineId, companyId, projectId, status, checklistType, createdAt",
  incidents: "offlineId, companyId, projectId, incidentType, createdAt",
  toolboxTalks: "offlineId, companyId, projectId, createdAt",
});

// BUG-SV-023: Add privacyConcern to incidents (no index change needed, same stores)
db.version(3).stores({
  inspections: "offlineId, companyId, projectId, status, checklistType, createdAt",
  incidents: "offlineId, companyId, projectId, incidentType, createdAt",
  toolboxTalks: "offlineId, companyId, projectId, createdAt",
}).upgrade((tx) => {
  return tx.table("incidents").toCollection().modify((incident) => {
    if (incident.privacyConcern === undefined) {
      incident.privacyConcern = false;
    }
  });
});

export { db };

// SEC-SV-005: Encrypted wrappers for PII fields in IndexedDB
// Incidents: description, locationDescription contain injury details
// ToolboxTalks: signatures (biometric), notes may reference workers

export async function addEncryptedIncident(
  data: OfflineIncident
): Promise<string> {
  return db.incidents.add({
    ...data,
    description: await encryptField(data.description),
    locationDescription: await encryptField(data.locationDescription),
  });
}

export async function getDecryptedIncidents(
  filter?: (i: OfflineIncident) => boolean
): Promise<OfflineIncident[]> {
  const items = filter
    ? await db.incidents.filter(filter).toArray()
    : await db.incidents.toArray();
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      description: await decryptField(item.description),
      locationDescription: await decryptField(item.locationDescription),
    }))
  );
}

export async function addEncryptedToolboxTalk(
  data: OfflineToolboxTalk
): Promise<string> {
  return db.toolboxTalks.add({
    ...data,
    signatures: await encryptRecord(data.signatures),
    notes: await encryptField(data.notes),
  });
}

export async function getDecryptedToolboxTalks(
  filter?: (t: OfflineToolboxTalk) => boolean
): Promise<OfflineToolboxTalk[]> {
  const items = filter
    ? await db.toolboxTalks.filter(filter).toArray()
    : await db.toolboxTalks.toArray();
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      signatures: await decryptRecord(item.signatures),
      notes: await decryptField(item.notes),
    }))
  );
}

export async function getDecryptedRecentIncidents(
  limit: number
): Promise<OfflineIncident[]> {
  const items = await db.incidents
    .orderBy("createdAt")
    .reverse()
    .limit(limit)
    .toArray();
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      description: await decryptField(item.description),
      locationDescription: await decryptField(item.locationDescription),
    }))
  );
}

export async function getDecryptedRecentToolboxTalks(
  limit: number
): Promise<OfflineToolboxTalk[]> {
  const items = await db.toolboxTalks
    .orderBy("createdAt")
    .reverse()
    .limit(limit)
    .toArray();
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      signatures: await decryptRecord(item.signatures),
      notes: await decryptField(item.notes),
    }))
  );
}
