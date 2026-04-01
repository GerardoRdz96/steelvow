"use client";

import type { Worker } from "@/types/database";

const ROLES = [
  "worker",
  "foreman",
  "superintendent",
  "safety_officer",
  "admin",
] as const;

interface WorkerFormProps {
  action: (formData: FormData) => void;
  worker?: Worker;
}

export function WorkerForm({ action, worker }: WorkerFormProps) {
  return (
    <form action={action} className="space-y-6">
      {worker && <input type="hidden" name="worker_id" value={worker.id} />}
      {worker && <input type="hidden" name="is_active" value={String(worker.is_active)} />}

      {/* Basic Info */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Basic Info</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-1">
              Full Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={worker?.name}
              placeholder="e.g. Carlos Martinez"
              className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-900 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={worker?.role || "worker"}
              className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px] bg-white"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>
                  {r.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-900 mb-1">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={worker?.phone || ""}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-1">
                Email <span className="text-concrete-600 font-normal">(optional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={worker?.email || ""}
                placeholder="carlos@example.com"
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="language_pref" className="block text-sm font-medium text-slate-900 mb-1">
              Language
            </label>
            <select
              id="language_pref"
              name="language_pref"
              defaultValue={worker?.language_pref || "en"}
              className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px] bg-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Certifications</h2>
        <p className="text-xs text-concrete-600 mb-4">
          Enter expiry dates. You&apos;ll receive alerts at 30 and 7 days before expiry.
        </p>
        <div className="space-y-4">
          <CertField
            id="osha_10_cert_date"
            label="OSHA 10-Hour"
            defaultValue={worker?.osha_10_cert_date}
          />
          <CertField
            id="osha_30_cert_date"
            label="OSHA 30-Hour"
            defaultValue={worker?.osha_30_cert_date}
          />
          <CertField
            id="fall_protection_cert_date"
            label="Fall Protection"
            defaultValue={worker?.fall_protection_cert_date}
          />
          <CertField
            id="forklift_cert_date"
            label="Forklift Operator"
            defaultValue={worker?.forklift_cert_date}
          />
          <CertField
            id="first_aid_cert_date"
            label="First Aid / CPR"
            defaultValue={worker?.first_aid_cert_date}
          />
        </div>
      </section>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-base font-semibold px-4 py-4 rounded-xl transition-colors min-h-[56px]"
      >
        {worker ? "Save Changes" : "Add Worker"}
      </button>
    </form>
  );
}

function CertField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="flex items-center gap-4">
      <label htmlFor={id} className="text-sm font-medium text-slate-900 w-40 shrink-0">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="date"
        defaultValue={defaultValue || ""}
        className="flex-1 px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
      />
    </div>
  );
}
