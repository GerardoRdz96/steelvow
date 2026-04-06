"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// BUG-SV-020: Server-side validation for report actions

const INCIDENT_TYPES = ["injury", "near_miss", "property_damage"] as const;
const SEVERITIES = ["minor", "serious", "fatal"] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SyncIncidentInput {
  offlineId: string;
  projectId: string;
  incidentType: "injury" | "near_miss" | "property_damage";
  severity: "minor" | "serious" | "fatal";
  description: string;
  locationDescription: string;
  occurredAt: string;
  oshaReportable: boolean;
  privacyConcern: boolean;
  photos: string[];
  createdAt: string;
}

// SEC-SV-006: Validate photo storage paths — prevent path traversal and enforce format
const PHOTO_PATH_REGEX = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

function validatePhotoPath(path: string): boolean {
  if (typeof path !== "string" || path.length > 500) return false;
  if (path.includes("..") || path.includes("//") || path.startsWith("/")) return false;
  return PHOTO_PATH_REGEX.test(path);
}

// SEC-SV-007: Validate signature data URLs — prevent oversized or malformed data
const SIGNATURE_DATA_URL_PREFIX = "data:image/jpeg;base64,";
const MAX_SIGNATURE_SIZE = 500_000; // 500KB base64

function validateSignature(value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.length > MAX_SIGNATURE_SIZE) return false;
  if (!value.startsWith(SIGNATURE_DATA_URL_PREFIX)) return false;
  return true;
}

function validateIncidentInput(input: SyncIncidentInput): string | null {
  if (!input.offlineId || !UUID_REGEX.test(input.offlineId)) return "Invalid offlineId";
  if (!input.projectId || !UUID_REGEX.test(input.projectId)) return "Invalid projectId";
  if (!INCIDENT_TYPES.includes(input.incidentType)) return "Invalid incident type";
  if (!SEVERITIES.includes(input.severity)) return "Invalid severity";
  if (!input.description || input.description.trim().length < 5) return "Description too short (min 5 chars)";
  if (input.description.length > 5000) return "Description too long (max 5000 chars)";
  if (input.locationDescription && input.locationDescription.length > 1000) return "Location description too long";
  if (!input.occurredAt || isNaN(Date.parse(input.occurredAt))) return "Invalid occurredAt date";
  if (typeof input.oshaReportable !== "boolean") return "oshaReportable must be boolean";
  // BUG-SV-037: Validate privacyConcern is boolean (OSHA 300 privacy case logic)
  if (typeof input.privacyConcern !== "boolean") return "privacyConcern must be boolean";
  if (!Array.isArray(input.photos) || input.photos.length > 20) return "Photos must be array (max 20)";
  // SEC-SV-006: Validate each photo path format and prevent path traversal
  for (const photo of input.photos) {
    if (!validatePhotoPath(photo)) return "Invalid photo path format";
  }
  return null;
}

export async function syncIncident(input: SyncIncidentInput) {
  const validationError = validateIncidentInput(input);
  if (validationError) throw new Error(validationError);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // BUG-SV-035: Filter worker lookup by company_id for defense-in-depth
  const { data: worker } = await supabase
    .from("workers")
    .select("id")
    .eq("email", user.email)
    .eq("company_id", companyId)
    .single();

  if (!worker) {
    throw new Error("Worker profile not found. Set up your worker profile first.");
  }

  const { error } = await supabase.from("incidents").upsert(
    {
      offline_id: input.offlineId,
      project_id: input.projectId,
      company_id: companyId,
      reported_by: worker.id,
      incident_type: input.incidentType,
      severity: input.severity,
      description: input.description.trim(),
      location_description: input.locationDescription?.trim() || null,
      occurred_at: input.occurredAt,
      osha_reportable: input.oshaReportable,
      privacy_concern: input.privacyConcern || false,
      status: "open",
      photos: input.photos,
    },
    { onConflict: "offline_id" }
  );

  // BUG-SV-028: Don't leak Supabase error details to client
  if (error) {
    console.error("syncIncident error:", error.message);
    throw new Error("Failed to sync incident. Please try again.");
  }
  return { success: true };
}

interface SyncToolboxTalkInput {
  offlineId: string;
  projectId: string;
  topic: string;
  durationMinutes: number;
  attendees: string[];
  signatures: Record<string, string>;
  notes: string;
  createdAt: string;
}

function validateToolboxTalkInput(input: SyncToolboxTalkInput): string | null {
  if (!input.offlineId || !UUID_REGEX.test(input.offlineId)) return "Invalid offlineId";
  if (!input.projectId || !UUID_REGEX.test(input.projectId)) return "Invalid projectId";
  if (!input.topic || input.topic.trim().length < 2) return "Topic too short (min 2 chars)";
  if (input.topic.length > 500) return "Topic too long (max 500 chars)";
  if (typeof input.durationMinutes !== "number" || input.durationMinutes < 1 || input.durationMinutes > 480) return "Duration must be 1-480 minutes";
  if (!Array.isArray(input.attendees) || input.attendees.length === 0) return "At least one attendee required";
  if (input.attendees.length > 200) return "Max 200 attendees";
  if (input.notes && input.notes.length > 5000) return "Notes too long (max 5000 chars)";
  // SEC-SV-007: Validate each signature is a valid, size-limited JPEG data URL
  if (input.signatures && typeof input.signatures === "object") {
    const sigEntries = Object.entries(input.signatures);
    if (sigEntries.length > 200) return "Max 200 signatures";
    for (const [key, value] of sigEntries) {
      if (!UUID_REGEX.test(key)) return "Invalid signature key (must be UUID)";
      if (!validateSignature(value)) return "Invalid or oversized signature data";
    }
  }
  return null;
}

export async function syncToolboxTalk(input: SyncToolboxTalkInput) {
  const validationError = validateToolboxTalkInput(input);
  if (validationError) throw new Error(validationError);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // BUG-SV-035: Filter worker lookup by company_id for defense-in-depth
  const { data: worker } = await supabase
    .from("workers")
    .select("id")
    .eq("email", user.email)
    .eq("company_id", companyId)
    .single();

  if (!worker) {
    throw new Error("Worker profile not found. Set up your worker profile first.");
  }

  const { error } = await supabase.from("toolbox_talks").upsert(
    {
      offline_id: input.offlineId,
      project_id: input.projectId,
      company_id: companyId,
      led_by: worker.id,
      topic: input.topic.trim(),
      duration_minutes: input.durationMinutes,
      attendees: input.attendees,
      signatures: input.signatures,
      notes: input.notes?.trim() || null,
    },
    { onConflict: "offline_id" }
  );

  // BUG-SV-028: Don't leak Supabase error details to client
  if (error) {
    console.error("syncToolboxTalk error:", error.message);
    throw new Error("Failed to sync toolbox talk. Please try again.");
  }
  return { success: true };
}
