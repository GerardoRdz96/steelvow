"use client";

import { setupCompany } from "@/app/(app)/company/setup/actions";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export function CompanySetupForm() {
  return (
    <form action={setupCompany} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-1">
            Company Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Martinez Construction LLC"
            className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
          />
        </div>

        <div>
          <label htmlFor="ein" className="block text-sm font-medium text-slate-900 mb-1">
            EIN <span className="text-concrete-600 font-normal">(optional)</span>
          </label>
          <input
            id="ein"
            name="ein"
            type="text"
            placeholder="XX-XXXXXXX"
            className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-900 mb-1">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            placeholder="123 Main St, City"
            className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-slate-900 mb-1">
              State
            </label>
            <select
              id="state"
              name="state"
              className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px] bg-white"
            >
              <option value="">Select...</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="employee_count" className="block text-sm font-medium text-slate-900 mb-1">
              Employees
            </label>
            <input
              id="employee_count"
              name="employee_count"
              type="number"
              min="1"
              max="999"
              placeholder="10"
              className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-base text-slate-900 placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-base font-semibold px-4 py-4 rounded-xl transition-colors min-h-[56px]"
      >
        Create Company
      </button>

      <p className="text-center text-xs text-concrete-600">
        You can update these details later from your profile.
      </p>
    </form>
  );
}
