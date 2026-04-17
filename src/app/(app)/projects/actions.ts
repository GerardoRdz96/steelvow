"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getCompanyTier,
  checkFeatureAccess,
  tierGateError,
  getProjectCount,
  getTierLimits,
} from "@/lib/tier-enforcement";

function validateProjectInput(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2 || name.length > 200) {
    throw new Error("Project name must be between 2 and 200 characters");
  }

  const address = (formData.get("address") as string)?.trim() || null;
  const project_type = (formData.get("project_type") as string)?.trim() || null;
  const start_date = (formData.get("start_date") as string)?.trim() || null;
  if (start_date && isNaN(Date.parse(start_date))) {
    throw new Error("Invalid start date");
  }

  return { name, address, project_type, start_date };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // Tier enforcement: check project limit
  const tier = await getCompanyTier(companyId);
  if (!checkFeatureAccess(tier, "create_project")) {
    const gate = tierGateError("create_project", tier);
    throw new Error(gate.error);
  }
  const limits = getTierLimits(tier);
  if (limits.projects !== -1) {
    const currentCount = await getProjectCount(companyId);
    if (currentCount >= limits.projects) {
      throw new Error(
        `Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan allows up to ${limits.projects} projects. Upgrade to add more.`
      );
    }
  }

  const validated = validateProjectInput(formData);

  const { error } = await supabase.from("projects").insert({
    company_id: companyId,
    ...validated,
  });

  // BUG-SV-036: Don't leak raw Supabase error details to client
  if (error) {
    console.error("createProject error:", error.message);
    throw new Error("Failed to create project. Please try again.");
  }

  revalidatePath("/projects");
  redirect("/projects");
}
