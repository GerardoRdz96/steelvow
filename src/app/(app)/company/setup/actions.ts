"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

function validateCompanyInput(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2 || name.length > 200) {
    throw new Error("Company name must be between 2 and 200 characters");
  }

  const ein = (formData.get("ein") as string)?.trim() || null;
  if (ein && !/^\d{2}-\d{7}$/.test(ein)) {
    throw new Error("EIN must be in XX-XXXXXXX format");
  }

  const employeeCountStr = formData.get("employee_count") as string;
  const employee_count = parseInt(employeeCountStr) || 0;
  if (employee_count < 0 || employee_count > 10000) {
    throw new Error("Employee count must be between 0 and 10,000");
  }

  const address = (formData.get("address") as string)?.trim() || null;
  const state = (formData.get("state") as string)?.trim() || null;

  return { name, ein, address, state, employee_count };
}

export async function setupCompany(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // BUG-SV-004: Guard against re-execution if user already has a company
  if (user.app_metadata?.company_id) {
    redirect("/dashboard");
  }

  // BUG-SV-009: Validate input server-side
  const validated = validateCompanyInput(formData);

  // Create company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert(validated)
    .select()
    .single();

  // BUG-SV-036: Don't leak raw Supabase error details to client
  if (companyError) {
    console.error("setupCompany error:", companyError.message);
    throw new Error("Failed to create company. Please try again.");
  }

  // BUG-SV-046: Use service role client for admin API (anon key lacks admin privileges)
  const adminClient = createAdminClient();
  const { error: userError } = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: {
      company_id: company.id,
      role: "admin",
    },
  });

  // BUG-SV-005: If admin API fails, abort — do NOT fallback to user_metadata
  if (userError) {
    // Rollback: delete the company we just created
    await supabase.from("companies").delete().eq("id", company.id);
    throw new Error("Failed to set admin role. Please try again or contact support.");
  }

  redirect("/dashboard");
}
