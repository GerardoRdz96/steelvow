import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PricingClient } from "./pricing-client";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const { data: company } = await supabase
    .from("companies")
    .select("plan_tier, stripe_customer_id")
    .eq("id", companyId)
    .single();

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      <PricingClient
        currentTier={company?.plan_tier || "starter"}
        hasStripeCustomer={!!company?.stripe_customer_id}
      />
    </div>
  );
}
