import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Worker } from "@/types/database";
import { AttributionFooter } from "@/components/layout/attribution-footer";

export const dynamic = "force-dynamic";

const CERT_FIELDS = [
  { key: "osha_10_cert_date", label: "OSHA 10" },
  { key: "osha_30_cert_date", label: "OSHA 30" },
  { key: "fall_protection_cert_date", label: "Fall Protection" },
  { key: "forklift_cert_date", label: "Forklift" },
  { key: "first_aid_cert_date", label: "First Aid" },
] as const;

function getCertStatus(dateStr: string | null): "valid" | "expiring" | "expired" | "none" {
  if (!dateStr) return "none";
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
}

function CertBadge({ date, label }: { date: string | null; label: string }) {
  const status = getCertStatus(date);
  if (status === "none") return null;

  const colors = {
    valid: "bg-green-100 text-green-800",
    expiring: "bg-yellow-100 text-yellow-800",
    expired: "bg-red-100 text-red-800",
  };

  const icons = {
    valid: "",
    expiring: "!",
    expired: "X",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {icons[status] && <span className="font-bold">{icons[status]}</span>}
      {label}
    </span>
  );
}

export default async function WorkersPage() {
  let workers: Worker[] = [];
  let companyId: string | undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  companyId = user.app_metadata?.company_id;

  // BUG-SV-017: Limit query to 50 records (Business tier max)
  if (companyId) {
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("company_id", companyId)
      .order("name")
      .limit(50);
    if (error) console.error("Workers query error:", error.message);
    workers = (data || []) as Worker[];
  }

  const activeWorkers = workers.filter((w: Worker) => w.is_active);
  const inactiveWorkers = (workers || []).filter((w: Worker) => !w.is_active);

  // Count cert alerts
  const expiringCount = (workers || []).reduce((count: number, w: Worker) => {
    return count + CERT_FIELDS.filter(f => {
      const status = getCertStatus(w[f.key as keyof Worker] as string | null);
      return status === "expiring" || status === "expired";
    }).length;
  }, 0);

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Workers
          </h1>
          <p className="text-sm text-concrete-600 mt-1">
            {activeWorkers.length} active{" "}
            {expiringCount > 0 && (
              <span className="text-yellow-600 font-medium">
                &middot; {expiringCount} cert alert{expiringCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/workers/new"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors min-h-[48px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Worker
        </Link>
      </div>

      {/* No company setup */}
      {!companyId && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-orange-800 mb-2">Company not set up yet</p>
          <p className="text-xs text-orange-600 mb-4">Set up your company first to start adding workers.</p>
          <Link
            href="/company/setup"
            className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Set Up Company
          </Link>
        </div>
      )}

      {/* Workers List */}
      {companyId && activeWorkers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-900 mb-1">No workers yet</p>
          <p className="text-xs text-concrete-600">Add your crew members to track certifications and compliance.</p>
        </div>
      )}

      {activeWorkers.length > 0 && (
        <div className="space-y-3">
          {activeWorkers.map((worker: Worker) => (
            <Link
              key={worker.id}
              href={`/workers/${worker.id}`}
              className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-lg font-extrabold text-orange-600">
                    {worker.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{worker.name}</p>
                    <span className="text-xs text-concrete-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {worker.role}
                    </span>
                  </div>
                  <p className="text-xs text-concrete-600 mt-0.5">
                    {worker.phone || worker.email || "No contact info"}
                    {worker.language_pref === "es" && " · ES"}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {CERT_FIELDS.map(f => (
                      <CertBadge
                        key={f.key}
                        date={worker[f.key as keyof Worker] as string | null}
                        label={f.label}
                      />
                    ))}
                  </div>
                </div>
                <svg className="w-5 h-5 text-concrete-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Inactive Workers */}
      {inactiveWorkers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-concrete-600 mb-3">Inactive ({inactiveWorkers.length})</h2>
          <div className="space-y-2">
            {inactiveWorkers.map((worker: Worker) => (
              <Link
                key={worker.id}
                href={`/workers/${worker.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-4 opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-400">
                      {worker.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{worker.name}</p>
                    <p className="text-xs text-concrete-600">{worker.role} &middot; Inactive</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <AttributionFooter />
    </div>
  );
}
