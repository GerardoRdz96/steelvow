import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OSHA300Actions } from "./osha-300-actions";
import { AttributionFooter } from "@/components/layout/attribution-footer";

export const dynamic = "force-dynamic";

export default async function OSHALogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const currentYear = new Date().getFullYear();

  // BUG-SV-025: Run queries in parallel + try-catch to prevent page freeze
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let company: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entries: any[] | null = null;
  let unprocessedCount = 0;
  let queryError = false;

  try {
    // BUG-SV-025: Parallel queries prevent sequential hang (if one query is slow, others don't wait)
    // BUG-SV-025: Promise.resolve() wraps PromiseLike into proper Promise for parallel execution
    const companyQuery = Promise.resolve(
      supabase.from("companies").select("name, ein, address, state, employee_count").eq("id", companyId).single()
    ).catch(() => ({ data: null, error: { message: "company query failed" } }));

    const entriesQuery = Promise.resolve(
      supabase.from("osha_300_entries").select("*").eq("company_id", companyId).eq("year", currentYear).order("case_number").range(0, 199)
    ).catch(() => ({ data: null, error: { message: "entries query failed" } }));

    const reportableQuery = Promise.resolve(
      supabase.from("incidents").select("id").eq("company_id", companyId).eq("osha_reportable", true).eq("incident_type", "injury").gte("occurred_at", `${currentYear}-01-01T00:00:00Z`).lte("occurred_at", `${currentYear}-12-31T23:59:59Z`).range(0, 199)
    ).catch(() => ({ data: null, error: { message: "incidents query failed" } }));

    const [companyRes, entriesRes, reportableRes] = await Promise.all([companyQuery, entriesQuery, reportableQuery]);

    company = companyRes.data;

    if (entriesRes.error) {
      console.error("OSHA 300 entries query error:", entriesRes.error.message);
      queryError = true;
    }
    entries = entriesRes.data;

    const allReportable = reportableRes.data;
    const existingIncidentIds = new Set((entries || []).map((e: { incident_id: string }) => e.incident_id));
    unprocessedCount = (allReportable || []).filter((i: { id: string }) => !existingIncidentIds.has(i.id)).length;
  } catch (err) {
    console.error("OSHA Logs page error:", err);
    queryError = true;
  }

  // Summary stats for 300A
  const totalEntries = entries?.length || 0;
  const totalDeaths = entries?.filter((e) => e.death).length || 0;
  const totalDaysAway = entries?.reduce((sum: number, e: { days_away?: number }) => sum + (e.days_away || 0), 0) || 0;
  const totalDaysRestricted = entries?.reduce((sum: number, e: { days_restricted?: number }) => sum + (e.days_restricted || 0), 0) || 0;

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          OSHA 300 Log
        </h1>
        <p className="text-sm text-concrete-600 mt-1">
          {company?.name || "Your Company"} · {currentYear} Log of Work-Related Injuries and Illnesses
        </p>
      </div>

      {/* BUG-SV-025: Show error banner if DB queries failed instead of crashing */}
      {queryError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800">
            Could not load all OSHA log data. Some information may be missing. Please try refreshing.
          </p>
        </div>
      )}

      {/* 300A Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Form 300A Summary — {currentYear}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-concrete-600">Total Cases</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalEntries}</p>
          </div>
          <div>
            <p className="text-xs text-concrete-600">Deaths</p>
            <p className={`text-2xl font-extrabold ${totalDeaths > 0 ? "text-red-600" : "text-slate-900"}`}>
              {totalDeaths}
            </p>
          </div>
          <div>
            <p className="text-xs text-concrete-600">Days Away</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalDaysAway}</p>
          </div>
          <div>
            <p className="text-xs text-concrete-600">Days Restricted</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalDaysRestricted}</p>
          </div>
        </div>
        {company && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-concrete-600">
            <p>EIN: {company.ein || "Not set"}</p>
            <p>Employees: {company.employee_count}</p>
            <p>Address: {company.address || "Not set"}</p>
            <p>State: {company.state || "Not set"}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <OSHA300Actions year={currentYear} unprocessedCount={unprocessedCount} />

      {/* Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Log Entries ({totalEntries})
          </h2>
        </div>
        {totalEntries === 0 ? (
          <div className="text-center py-8 text-concrete-600">
            <p className="text-sm">No OSHA 300 entries for {currentYear}.</p>
            <p className="text-xs mt-1">
              {unprocessedCount > 0
                ? `${unprocessedCount} reportable incident${unprocessedCount !== 1 ? "s" : ""} can be auto-generated.`
                : "Report injuries marked as OSHA-reportable to populate this log."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-concrete-600">
                  <th className="px-4 py-3 font-semibold">Case #</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Classification</th>
                  <th className="px-4 py-3 font-semibold text-center">Away</th>
                  <th className="px-4 py-3 font-semibold text-center">Restr.</th>
                  <th className="px-4 py-3 font-semibold text-center">Death</th>
                </tr>
              </thead>
              <tbody>
                {(entries || []).map((entry: { id: string; case_number: string; employee_name: string; job_title: string; date_of_injury: string; where_event_occurred?: string; description: string; classification: string; days_away: number; days_restricted: number; death: boolean }) => (
                  <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{entry.case_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{entry.employee_name}</td>
                    <td className="px-4 py-3 text-concrete-600">{entry.job_title}</td>
                    <td className="px-4 py-3 text-concrete-600 whitespace-nowrap">{entry.date_of_injury}</td>
                    <td className="px-4 py-3 text-concrete-600 max-w-[120px] truncate">{entry.where_event_occurred || "\u2014"}</td>
                    <td className="px-4 py-3 text-concrete-600 max-w-[200px] truncate">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        entry.death
                          ? "bg-red-100 text-red-700"
                          : entry.classification === "Days away from work"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {entry.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{entry.days_away}</td>
                    <td className="px-4 py-3 text-center">{entry.days_restricted}</td>
                    <td className="px-4 py-3 text-center">
                      {entry.death && <span className="text-red-600 font-bold">Y</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AttributionFooter />
    </div>
  );
}
