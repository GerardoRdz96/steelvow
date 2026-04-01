import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompanySetupForm } from "@/components/company/company-setup-form";

export const dynamic = "force-dynamic";

export default async function CompanySetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // If company already exists, go to dashboard
  const companyId = user.app_metadata?.company_id;
  if (companyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();
    if (company) redirect("/dashboard");
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Set Up Your Company
        </h1>
        <p className="text-sm text-concrete-600 mt-2">
          Tell us about your construction business to get started.
        </p>
      </div>

      <CompanySetupForm />
    </div>
  );
}
