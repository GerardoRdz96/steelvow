import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  let companyName = "Not set";
  if (companyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    companyName = company?.name || "Not set";
  }

  return (
    <ProfileClient
      email={user.email || user.phone || "Worker"}
      initial={user.email?.charAt(0).toUpperCase() || user.phone?.slice(-2) || "?"}
      role={user.user_metadata?.role || "Team Member"}
      companyName={companyName}
    />
  );
}
