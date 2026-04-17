"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SafetyProgramType, Language } from "@/types/database";
import {
  getCompanyTier,
  checkFeatureAccess,
  tierGateError,
} from "@/lib/tier-enforcement";

import { PROGRAM_LABELS } from "@/lib/safety-program-labels";

export async function getSafetyPrograms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const { data: programs, error } = await supabase
    .from("safety_programs")
    .select("*")
    .eq("company_id", companyId)
    .order("program_type")
    .order("language");

  if (error) {
    console.error("getSafetyPrograms error:", error.message);
    throw new Error("Failed to load safety programs.");
  }

  return programs || [];
}

export async function generateSafetyProgram(
  programType: SafetyProgramType,
  language: Language
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // Tier enforcement: AI safety programs require Pro+
  const tier = await getCompanyTier(companyId);
  if (!checkFeatureAccess(tier, "ai_safety_programs")) {
    return tierGateError("ai_safety_programs", tier);
  }

  const validTypes: SafetyProgramType[] = ["fall_protection", "hazcom", "respiratory", "loto", "heat"];
  if (!validTypes.includes(programType)) {
    throw new Error("Invalid program type.");
  }
  if (language !== "en" && language !== "es") {
    throw new Error("Invalid language.");
  }

  // Get company info for personalization
  const { data: company } = await supabase
    .from("companies")
    .select("name, address, state, employee_count")
    .eq("id", companyId)
    .single();

  if (!company) {
    throw new Error("Company not found.");
  }

  // BUG-SV-047: Sanitize company fields before prompt interpolation
  const sanitize = (val: string | null | undefined, maxLen = 200): string => {
    if (!val) return "Not specified";
    return val
      .replace(/[\r\n]+/g, " ")       // strip newlines (prevent prompt injection)
      .replace(/[<>{}]/g, "")           // strip angle brackets / braces
      .trim()
      .slice(0, maxLen);
  };

  const safeCompanyName = sanitize(company.name, 100);
  const safeAddress = sanitize(company.address, 200);
  const safeState = sanitize(company.state, 50);
  const safeEmployeeCount = company.employee_count
    ? String(Math.min(Math.max(1, company.employee_count), 99999))
    : "Not specified";

  // BUG-SV-048: Rate limit — max 10 generations per company per day
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { count: dailyCount } = await supabase
    .from("safety_programs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("last_reviewed_at", `${today}T00:00:00.000Z`);

  if ((dailyCount ?? 0) >= 10) {
    throw new Error("Daily generation limit reached (10/day). Please try again tomorrow.");
  }

  const programLabel = PROGRAM_LABELS[programType][language];

  // Call Claude API to generate the program
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("AI service not configured. Contact support.");
  }

  const langInstruction = language === "es"
    ? "Write the entire program in Spanish. Use professional, clear language appropriate for construction workers."
    : "Write in clear, professional English appropriate for construction workers.";

  const prompt = `Generate a comprehensive written ${programLabel} for a construction company with the following details:

Company: ${safeCompanyName}
Location: ${safeAddress}, ${safeState}
Employees: ${safeEmployeeCount}

Requirements:
- Follow OSHA 29 CFR 1926 standards for construction
- Include: Purpose, Scope, Responsibilities, Procedures, Training Requirements, Recordkeeping
- Be specific to construction industry hazards
- Include practical, actionable procedures that a small contractor can follow
- ${langInstruction}
- Format with clear section headers using markdown (## for sections, ### for subsections)
- Keep it comprehensive but concise (aim for 2000-3000 words)
- Include date placeholder for "Effective Date" and "Last Reviewed"`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", response.status, await response.text());
    throw new Error("Failed to generate safety program. Please try again.");
  }

  const result = await response.json();
  const content = result.content?.[0]?.text;

  if (!content) {
    throw new Error("AI generated empty content. Please try again.");
  }

  // Check if program already exists for this type+language
  const { data: existing } = await supabase
    .from("safety_programs")
    .select("id, version")
    .eq("company_id", companyId)
    .eq("program_type", programType)
    .eq("language", language)
    .single();

  if (existing) {
    // Update existing program with new version
    const { error: updateError } = await supabase
      .from("safety_programs")
      .update({
        content,
        version: existing.version + 1,
        generated_by: "ai",
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Update safety program error:", updateError.message);
      throw new Error("Failed to save safety program.");
    }
  } else {
    // Insert new program
    const { error: insertError } = await supabase
      .from("safety_programs")
      .insert({
        company_id: companyId,
        program_type: programType,
        content,
        language,
        version: 1,
        generated_by: "ai",
        last_reviewed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Insert safety program error:", insertError.message);
      throw new Error("Failed to save safety program.");
    }
  }

  revalidatePath("/safety-programs");
  return { success: true, programType, language };
}

export async function deleteSafetyProgram(programId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const { error } = await supabase
    .from("safety_programs")
    .delete()
    .eq("id", programId)
    .eq("company_id", companyId);

  if (error) {
    console.error("deleteSafetyProgram error:", error.message);
    throw new Error("Failed to delete safety program.");
  }

  revalidatePath("/safety-programs");
}
