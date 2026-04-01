"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_RESULTS = ["pass", "fail", "na", null] as const;

interface SyncInspectionInput {
  offlineId: string;
  projectId: string;
  checklistType: string;
  status: "draft" | "completed";
  findings: Array<{
    id: string;
    label: string;
    result: "pass" | "fail" | "na" | null;
    notes: string;
    photoPath: string | null;
  }>;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
}

// BUG-SV-038: Server-side input validation (matching syncIncident/syncToolboxTalk pattern)
function validateInspectionInput(input: SyncInspectionInput): string | null {
  if (!input.offlineId || !UUID_REGEX.test(input.offlineId)) return "Invalid offlineId";
  if (!input.projectId || !UUID_REGEX.test(input.projectId)) return "Invalid projectId";
  if (!input.checklistType || input.checklistType.trim().length < 1) return "Checklist type required";
  if (input.checklistType.length > 200) return "Checklist type too long (max 200 chars)";
  if (!["draft", "completed"].includes(input.status)) return "Status must be 'draft' or 'completed'";
  if (!Array.isArray(input.findings)) return "Findings must be an array";
  if (input.findings.length > 200) return "Max 200 findings";
  for (const f of input.findings) {
    if (!f.id || typeof f.id !== "string") return "Each finding must have a valid id";
    if (!f.label || typeof f.label !== "string") return "Each finding must have a label";
    if (f.label.length > 500) return "Finding label too long (max 500 chars)";
    if (f.result !== null && !["pass", "fail", "na"].includes(f.result)) return "Invalid finding result";
    if (f.notes && f.notes.length > 2000) return "Finding notes too long (max 2000 chars)";
  }
  if (input.score !== null && (typeof input.score !== "number" || input.score < 0 || input.score > 100)) return "Score must be 0-100 or null";
  if (input.completedAt !== null && isNaN(Date.parse(input.completedAt))) return "Invalid completedAt date";
  if (!input.createdAt || isNaN(Date.parse(input.createdAt))) return "Invalid createdAt date";
  return null;
}

export async function syncInspection(input: SyncInspectionInput) {
  // BUG-SV-038: Validate before any DB operations
  const validationError = validateInspectionInput(input);
  if (validationError) throw new Error(validationError);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // BUG-SV-013: Require worker record — auth UUID would violate workers(id) FK
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

  const { error } = await supabase.from("inspections").upsert(
    {
      offline_id: input.offlineId,
      project_id: input.projectId,
      company_id: companyId,
      worker_id: worker.id,
      checklist_type: input.checklistType.trim(),
      status: input.status === "completed" ? "completed" : "draft",
      score: input.score,
      findings: input.findings,
      completed_at: input.completedAt,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "offline_id" }
  );

  // BUG-SV-036: Don't leak raw Supabase error details to client
  if (error) {
    console.error("syncInspection error:", error.message);
    throw new Error("Failed to sync inspection. Please try again.");
  }

  return { success: true };
}
