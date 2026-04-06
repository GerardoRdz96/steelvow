import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SafetyProgramsClient } from "./safety-programs-client";

export const dynamic = "force-dynamic";

export default async function SafetyProgramsPage() {
  let programs: any[] = [];
  let companyName = "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();
  if (companyErr) console.error("Company query error:", companyErr.message);
  companyName = company?.name || "";

  const { data: progs, error: progsErr } = await supabase
    .from("safety_programs")
    .select("*")
    .eq("company_id", companyId)
    .order("program_type")
    .order("language");
  if (progsErr) console.error("Safety programs query error:", progsErr.message);
  programs = progs || [];

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      <SafetyProgramsClient
        programs={programs}
        companyName={companyName}
      />
    </div>
  );
}
