"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getCompanyTier,
  checkFeatureAccess,
  tierGateError,
  getWorkerCount,
  getTierLimits,
} from "@/lib/tier-enforcement";

// BUG-SV-009: Server-side input validation for worker data
function validateWorkerInput(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1 || name.length > 200) {
    throw new Error("Worker name must be between 1 and 200 characters");
  }

  const phone = (formData.get("phone") as string)?.trim() || null;
  if (phone && !/^[\d\s()+\-]{7,20}$/.test(phone)) {
    throw new Error("Invalid phone number format");
  }

  const email = (formData.get("email") as string)?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format");
  }

  const role = (formData.get("role") as string)?.trim() || "worker";
  const validRoles = ["worker", "foreman", "superintendent", "safety_officer", "admin"];
  if (!validRoles.includes(role)) {
    throw new Error("Invalid worker role");
  }

  const language_pref = (formData.get("language_pref") as string)?.trim() || "en";
  if (!["en", "es"].includes(language_pref)) {
    throw new Error("Language must be 'en' or 'es'");
  }

  // Validate date fields — accept empty or valid ISO dates
  const dateFields = [
    "osha_10_cert_date", "osha_30_cert_date", "fall_protection_cert_date",
    "forklift_cert_date", "first_aid_cert_date",
  ] as const;
  const dates: Record<string, string | null> = {};
  for (const field of dateFields) {
    const val = (formData.get(field) as string)?.trim() || null;
    if (val && isNaN(Date.parse(val))) {
      throw new Error(`Invalid date for ${field.replace(/_/g, " ")}`);
    }
    dates[field] = val;
  }

  return { name, role, phone, email, language_pref, ...dates };
}

export async function createWorker(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // Tier enforcement: check worker limit
  const tier = await getCompanyTier(companyId);
  if (!checkFeatureAccess(tier, "create_worker")) {
    const gate = tierGateError("create_worker", tier);
    throw new Error(gate.error);
  }
  const limits = getTierLimits(tier);
  const currentWorkerCount = await getWorkerCount(companyId);
  if (currentWorkerCount >= limits.workers) {
    throw new Error(
      `Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan allows up to ${limits.workers} workers. Upgrade to add more.`
    );
  }

  const validated = validateWorkerInput(formData);

  const { error } = await supabase.from("workers").insert({
    company_id: companyId,
    ...validated,
  });

  // BUG-SV-036: Don't leak raw Supabase error details to client
  if (error) {
    console.error("createWorker error:", error.message);
    throw new Error("Failed to create worker. Please try again.");
  }

  revalidatePath("/workers");
  redirect("/workers");
}

export async function updateWorker(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const workerId = formData.get("worker_id") as string;
  if (!workerId) throw new Error("Worker ID required");

  const validated = validateWorkerInput(formData);

  // BUG-SV-034: Defense-in-depth — filter by company_id to prevent cross-company edits
  const { error } = await supabase
    .from("workers")
    .update({
      ...validated,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", workerId)
    .eq("company_id", companyId);

  // BUG-SV-036: Don't leak raw Supabase error details to client
  if (error) {
    console.error("updateWorker error:", error.message);
    throw new Error("Failed to update worker. Please try again.");
  }

  revalidatePath("/workers");
  revalidatePath(`/workers/${workerId}`);
  redirect(`/workers/${workerId}`);
}
