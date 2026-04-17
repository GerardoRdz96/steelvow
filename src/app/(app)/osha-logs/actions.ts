"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getCompanyTier,
  checkFeatureAccess,
  tierGateError,
} from "@/lib/tier-enforcement";

/**
 * Auto-generate OSHA 300 entries from OSHA-reportable incidents
 * that don't already have a 300 entry.
 */
export async function generateOSHA300Entries(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // Tier enforcement: OSHA 300 generation requires Pro+
  const tier = await getCompanyTier(companyId);
  if (!checkFeatureAccess(tier, "osha_300")) {
    return tierGateError("osha_300", tier);
  }

  // Validate year
  if (year < 2020 || year > new Date().getFullYear() + 1) {
    throw new Error("Invalid year");
  }

  const startDate = `${year}-01-01T00:00:00Z`;
  const endDate = `${year}-12-31T23:59:59Z`;

  // Get all OSHA-reportable injuries for this year
  // BUG-SV-026: Add company_id filter for defense-in-depth
  const { data: incidents, error: incErr } = await supabase
    .from("incidents")
    .select("id, incident_type, severity, description, occurred_at, reported_by, location_description, privacy_concern")
    .eq("company_id", companyId)
    .eq("osha_reportable", true)
    .eq("incident_type", "injury")
    .gte("occurred_at", startDate)
    .lte("occurred_at", endDate)
    .order("occurred_at")
    .limit(200);

  // BUG-SV-028: Don't leak Supabase error details to client
  if (incErr) {
    console.error("OSHA 300 incidents query error:", incErr.message);
    throw new Error("Failed to fetch incident records. Please try again.");
  }
  if (!incidents || incidents.length === 0) {
    return { generated: 0, total: 0, message: "No OSHA-reportable injuries found for this year." };
  }

  // Get existing OSHA 300 entries to avoid duplicates
  const { data: existing } = await supabase
    .from("osha_300_entries")
    .select("incident_id")
    .eq("company_id", companyId)
    .eq("year", year)
    .limit(200);

  const existingIds = new Set((existing || []).map((e) => e.incident_id));

  // Filter to only unprocessed incidents
  const newIncidents = incidents.filter((i) => !existingIds.has(i.id));
  if (newIncidents.length === 0) {
    return { generated: 0, total: incidents.length, message: "All incidents already have OSHA 300 entries." };
  }

  // BUG-SV-027: Add company_id filter for defense-in-depth
  const workerIds = [...new Set(newIncidents.map((i) => i.reported_by))];
  const { data: workers } = await supabase
    .from("workers")
    .select("id, name, role")
    .eq("company_id", companyId)
    .in("id", workerIds);

  const workerMap = new Map((workers || []).map((w) => [w.id, w]));

  // Get existing case count to continue numbering
  const { count } = await supabase
    .from("osha_300_entries")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("year", year);

  let caseNum = (count || 0) + 1;

  // SEC-SV-003: Track privacy case substitutions for audit logging
  const privacySubstitutions: Array<{ incident_id: string; case_number: string }> = [];

  // Generate entries
  const entries = newIncidents.map((incident) => {
    const worker = workerMap.get(incident.reported_by);
    const caseNumber = `${year}-${String(caseNum++).padStart(4, "0")}`;

    // BUG-SV-031: Improved OSHA classification mapping
    // Note: days_away and days_restricted are placeholders — admin should update actual values
    let classification = "Other recordable case";
    let daysAway = 0;
    let daysRestricted = 0;
    if (incident.severity === "fatal") {
      classification = "Death";
    } else if (incident.severity === "serious") {
      classification = "Days away from work";
      daysAway = 1; // Placeholder — admin should update via OSHA 300 log
      daysRestricted = 0;
    }

    // BUG-SV-023: OSHA privacy concern case — substitute employee name
    const isPrivacyCase = incident.privacy_concern === true;
    const employeeName = isPrivacyCase ? "Privacy Case" : (worker?.name || "Unknown");
    const jobTitle = isPrivacyCase ? "Privacy Case" : (worker?.role || "Worker");

    // SEC-SV-003: Log privacy case substitution for audit trail
    if (isPrivacyCase) {
      privacySubstitutions.push({ incident_id: incident.id, case_number: caseNumber });
    }

    return {
      company_id: companyId,
      incident_id: incident.id,
      case_number: caseNumber,
      employee_name: employeeName,
      job_title: jobTitle,
      date_of_injury: incident.occurred_at.split("T")[0],
      where_event_occurred: incident.location_description || "",
      description: incident.description.substring(0, 500),
      classification,
      days_away: daysAway,
      days_restricted: daysRestricted,
      death: incident.severity === "fatal",
      year,
    };
  });

  const { error: insertErr } = await supabase
    .from("osha_300_entries")
    .insert(entries);

  // BUG-SV-028: Don't leak Supabase error details to client
  if (insertErr) {
    console.error("OSHA 300 insert error:", insertErr.message);
    throw new Error("Failed to generate OSHA 300 entries. Please try again.");
  }

  // SEC-SV-003: Audit log privacy case substitutions
  if (privacySubstitutions.length > 0) {
    console.log(JSON.stringify({
      event: "osha300_privacy_substitution",
      company_id: companyId,
      user_id: user.id,
      year,
      count: privacySubstitutions.length,
      cases: privacySubstitutions,
      timestamp: new Date().toISOString(),
    }));
  }

  revalidatePath("/osha-logs");
  return {
    generated: entries.length,
    total: incidents.length,
    message: `Generated ${entries.length} new OSHA 300 entries.`,
  };
}

/**
 * Export OSHA 300 data as CSV (ITA format for electronic submission)
 */
export async function getOSHA300CSV(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // BUG-SV-026: Add company_id filter for defense-in-depth
  const { data: entries, error } = await supabase
    .from("osha_300_entries")
    .select("*")
    .eq("company_id", companyId)
    .eq("year", year)
    .order("case_number")
    .limit(500);

  // BUG-SV-028: Don't leak Supabase error details to client
  if (error) {
    console.error("OSHA 300 CSV export error:", error.message);
    throw new Error("Failed to export OSHA 300 data. Please try again.");
  }
  if (!entries || entries.length === 0) return "";

  const headers = [
    "Case No.",
    "Employee Name",
    "Job Title",
    "Date of Injury/Illness",
    "Where the event occurred",
    "Describe injury/illness",
    "Classification",
    "Days Away From Work",
    "Days of Restricted Work",
    "Death",
  ];

  // BUG-SV-024: Quote ALL string fields to prevent CSV injection
  const escapeCSV = (val: string | number | boolean): string => {
    if (typeof val === "number") return String(val);
    if (typeof val === "boolean") return val ? "Y" : "N";
    // Quote and escape double quotes in all string fields
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const rows = entries.map((e) => [
    escapeCSV(e.case_number),
    escapeCSV(e.employee_name),
    escapeCSV(e.job_title),
    escapeCSV(e.date_of_injury),
    escapeCSV(e.where_event_occurred || ""),
    escapeCSV(e.description),
    escapeCSV(e.classification),
    e.days_away,
    e.days_restricted,
    e.death ? "Y" : "N",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
