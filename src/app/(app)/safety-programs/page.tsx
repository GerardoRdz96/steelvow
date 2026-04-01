import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SafetyProgramsClient } from "./safety-programs-client";

export const dynamic = "force-dynamic";

export default async function SafetyProgramsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  const { data: programs } = await supabase
    .from("safety_programs")
    .select("*")
    .eq("company_id", companyId)
    .order("program_type")
    .order("language");

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      <SafetyProgramsClient
        programs={programs || []}
        companyName={company?.name || ""}
      />
    </div>
  );
}
