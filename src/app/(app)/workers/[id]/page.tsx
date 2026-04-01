import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { WorkerForm } from "@/components/workers/worker-form";
import { updateWorker } from "../actions";

export const dynamic = "force-dynamic";

const CERT_FIELDS = [
  { key: "osha_10_cert_date", label: "OSHA 10-Hour" },
  { key: "osha_30_cert_date", label: "OSHA 30-Hour" },
  { key: "fall_protection_cert_date", label: "Fall Protection" },
  { key: "forklift_cert_date", label: "Forklift" },
  { key: "first_aid_cert_date", label: "First Aid / CPR" },
] as const;

function getDaysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const now = new Date();
  return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // BUG-SV-010: Handle Supabase query errors
  // BUG-SV-040: Filter by company_id to prevent cross-tenant data access
  const { data: worker, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  // BUG-SV-044: Don't leak raw Supabase error messages to client
  if (error) {
    throw new Error("Failed to load worker. Please try again.");
  }
  if (!worker) notFound();

  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/workers"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Back to workers"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {worker.name}
          </h1>
          <p className="text-sm text-concrete-600">
            {worker.role.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            {!worker.is_active && <span className="text-red-600 ml-2">&middot; Inactive</span>}
          </p>
        </div>
      </div>

      {/* Cert Expiry Alerts */}
      {CERT_FIELDS.some(f => {
        const days = getDaysUntilExpiry(worker[f.key as keyof typeof worker] as string | null);
        return days !== null && days <= 30;
      }) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-bold text-yellow-800 mb-2">Certification Alerts</h3>
          {CERT_FIELDS.map(f => {
            const days = getDaysUntilExpiry(worker[f.key as keyof typeof worker] as string | null);
            if (days === null || days > 30) return null;
            return (
              <p key={f.key} className={`text-sm ${days < 0 ? "text-red-700 font-semibold" : "text-yellow-800"}`}>
                {f.label}: {days < 0 ? `Expired ${Math.abs(days)} days ago` : `Expires in ${days} days`}
              </p>
            );
          })}
        </div>
      )}

      {/* Edit Form */}
      <WorkerForm action={updateWorker} worker={worker} />
    </div>
  );
}
