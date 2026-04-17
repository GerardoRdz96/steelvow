import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AttributionFooter } from "@/components/layout/attribution-footer";

export const dynamic = "force-dynamic";

interface CertExpiry {
  name: string;
  certType: string;
  expiryDate: string;
  daysUntil: number;
}

function calculateComplianceScore(stats: {
  totalInspections30d: number;
  openIncidents: number;
  expiredCerts: number;
  completedTalks30d: number;
  totalWorkers: number;
  totalProjects: number;
}): { score: number; breakdown: { label: string; points: number; max: number }[] } {
  // BUG-SV-033: Return unavailable when no projects exist (prevents inflation)
  if (stats.totalWorkers === 0 || stats.totalProjects === 0) {
    return { score: -1, breakdown: [] }; // Not enough data
  }

  const breakdown: { label: string; points: number; max: number }[] = [];

  // Inspections regularity (40 points)
  // Target: at least 1 inspection per active project per week (4 per month)
  const inspectionTarget = Math.max(stats.totalProjects * 4, 1);
  const inspectionRatio = Math.min(stats.totalInspections30d / inspectionTarget, 1);
  const inspPoints = Math.round(inspectionRatio * 40);
  breakdown.push({ label: "Inspection Regularity", points: inspPoints, max: 40 });

  // Open incidents penalty (25 points)
  // 0 open = 25 pts, each open incident deducts 5
  const incidentPoints = Math.max(25 - stats.openIncidents * 5, 0);
  breakdown.push({ label: "Incident Resolution", points: incidentPoints, max: 25 });

  // Cert compliance (20 points)
  // % of workers with all certs current
  if (stats.totalWorkers > 0) {
    const certRatio = Math.max(1 - stats.expiredCerts / stats.totalWorkers, 0);
    const certPoints = Math.round(certRatio * 20);
    breakdown.push({ label: "Certification Currency", points: certPoints, max: 20 });
  } else {
    breakdown.push({ label: "Certification Currency", points: 0, max: 20 });
  }

  // Training (toolbox talks) (15 points)
  // Target: at least 2 talks per project per month
  const talkTarget = Math.max(stats.totalProjects * 2, 1);
  const talkRatio = Math.min(stats.completedTalks30d / talkTarget, 1);
  const talkPoints = Math.round(talkRatio * 15);
  breakdown.push({ label: "Safety Training", points: talkPoints, max: 15 });

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  return { score, breakdown };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all dashboard data in parallel
  const [
    workersRes,
    projectsRes,
    inspectionsRes,
    openIncidentsRes,
    recentIncidentsRes,
    toolboxTalksRes,
    companyRes,
  ] = await Promise.all([
    // BUG-SV-025: Add explicit .eq("company_id", companyId) for defense-in-depth
    supabase.from("workers").select("id, name, is_active, osha_10_cert_date, osha_30_cert_date, fall_protection_cert_date, forklift_cert_date, first_aid_cert_date").eq("company_id", companyId).eq("is_active", true).limit(100),
    supabase.from("projects").select("id, name, status").eq("company_id", companyId).limit(100),
    supabase.from("inspections").select("id, score, completed_at, checklist_type").eq("company_id", companyId).gte("completed_at", thirtyDaysAgo).limit(200),
    supabase.from("incidents").select("id, severity, incident_type, osha_reportable").eq("company_id", companyId).eq("status", "open").limit(50),
    supabase.from("incidents").select("id, incident_type, severity, description, occurred_at, status").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("toolbox_talks").select("id").eq("company_id", companyId).gte("created_at", thirtyDaysAgo).limit(200),
    supabase.from("companies").select("name, plan_tier").eq("id", companyId).single(),
  ]);

  const workers = workersRes.data || [];
  const projects = projectsRes.data || [];
  const inspections30d = inspectionsRes.data || [];
  const openIncidents = openIncidentsRes.data || [];
  const recentIncidents = recentIncidentsRes.data || [];
  const toolboxTalks30d = toolboxTalksRes.data || [];
  const company = companyRes.data;

  const activeProjects = projects.filter((p) => p.status === "active");

  // Calculate expiring certs (within 30 days)
  const certExpirations: CertExpiry[] = [];
  const certFields = [
    { key: "osha_10_cert_date", label: "OSHA 10" },
    { key: "osha_30_cert_date", label: "OSHA 30" },
    { key: "fall_protection_cert_date", label: "Fall Protection" },
    { key: "forklift_cert_date", label: "Forklift" },
    { key: "first_aid_cert_date", label: "First Aid" },
  ] as const;

  let expiredCertCount = 0;
  for (const w of workers) {
    for (const field of certFields) {
      const dateVal = w[field.key] as string | null;
      if (!dateVal) continue;
      const expiry = new Date(dateVal);
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) expiredCertCount++;
      // BUG-SV-029: Only show recently expired (up to 7 days ago), not 30
      if (daysUntil <= 30 && daysUntil >= -7) {
        certExpirations.push({ name: w.name, certType: field.label, expiryDate: dateVal, daysUntil });
      }
    }
  }
  certExpirations.sort((a, b) => a.daysUntil - b.daysUntil);

  // Calculate compliance score
  const { score, breakdown } = calculateComplianceScore({
    totalInspections30d: inspections30d.length,
    openIncidents: openIncidents.length,
    expiredCerts: expiredCertCount,
    completedTalks30d: toolboxTalks30d.length,
    totalWorkers: workers.length,
    totalProjects: activeProjects.length,
  });

  const scoreColor = score < 0 ? "text-concrete-600" : score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";

  // Average inspection score
  const scoredInspections = inspections30d.filter((i) => i.score !== null);
  const avgScore = scoredInspections.length > 0
    ? Math.round(scoredInspections.reduce((sum, i) => sum + (i.score || 0), 0) / scoredInspections.length)
    : null;

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm text-concrete-600 mt-1">
          {company?.name || "Your Company"} · {activeProjects.length} active project{activeProjects.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Compliance Score Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <p className="text-sm font-medium text-concrete-600 mb-2">
          Compliance Score
        </p>
        {score < 0 ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-concrete-600">--</span>
              <span className="text-lg text-concrete-600">/ 100</span>
            </div>
            <p className="text-xs text-orange-600 font-medium mt-2">
              Add workers and complete inspections to calculate your score
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold ${scoreColor}`}>{score}</span>
              <span className="text-lg text-concrete-600">/ 100</span>
            </div>
            <div className="mt-4 space-y-2">
              {breakdown.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs text-concrete-600 w-40 shrink-0">{b.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.points >= b.max * 0.8 ? "bg-green-500" : b.points >= b.max * 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${(b.points / b.max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-12 text-right">
                    {b.points}/{b.max}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Open Incidents"
          value={openIncidents.length.toString()}
          variant={openIncidents.length > 0 ? "danger" : "default"}
          href="/report"
        />
        <StatCard
          label="Cert Expiring Soon"
          value={certExpirations.filter((c) => c.daysUntil >= 0 && c.daysUntil <= 30).length.toString()}
          variant={certExpirations.some((c) => c.daysUntil <= 7) ? "warning" : "default"}
          href="/workers"
        />
        <StatCard
          label="Inspections (30d)"
          value={inspections30d.length.toString()}
          subtext={avgScore !== null ? `Avg: ${avgScore}%` : undefined}
          href="/inspect"
        />
        <StatCard
          label="Active Workers"
          value={workers.length.toString()}
          href="/workers"
        />
      </div>

      {/* Cert Expiration Alerts */}
      {certExpirations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Certification Alerts
          </h2>
          <div className="space-y-2">
            {certExpirations.slice(0, 5).map((cert, i) => (
              <div
                key={`${cert.name}-${cert.certType}-${i}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{cert.name}</p>
                  <p className="text-xs text-concrete-600">{cert.certType}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  cert.daysUntil < 0
                    ? "bg-red-100 text-red-700"
                    : cert.daysUntil <= 7
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {cert.daysUntil < 0
                    ? `Expired ${Math.abs(cert.daysUntil)}d ago`
                    : cert.daysUntil === 0
                    ? "Expires today"
                    : `${cert.daysUntil}d left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Incidents</h2>
          <Link href="/report" className="text-xs font-semibold text-orange-600">
            View All
          </Link>
        </div>
        {recentIncidents.length === 0 ? (
          <div className="text-center py-6 text-concrete-600">
            <p className="text-sm">No incidents reported.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                    incident.incident_type === "injury"
                      ? "bg-red-100 text-red-600"
                      : incident.incident_type === "near_miss"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                  }`}>
                    {incident.incident_type === "injury" ? "!" :
                     incident.incident_type === "near_miss" ? "~" : "#"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {incident.incident_type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-concrete-600">
                      {new Date(incident.occurred_at).toLocaleDateString()}
                      {" · "}
                      <span className={
                        incident.severity === "fatal" ? "text-red-600 font-medium" :
                        incident.severity === "serious" ? "text-orange-600 font-medium" :
                        "text-concrete-600"
                      }>
                        {incident.severity}
                      </span>
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  incident.status === "open"
                    ? "bg-red-100 text-red-700"
                    : incident.status === "investigating"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {incident.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/osha-logs"
          className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-300 transition-colors text-center"
        >
          <p className="text-sm font-semibold text-slate-900">OSHA 300 Logs</p>
          <p className="text-xs text-concrete-600 mt-1">View & export</p>
        </Link>
        <Link
          href="/inspect"
          className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-300 transition-colors text-center"
        >
          <p className="text-sm font-semibold text-slate-900">Run Inspection</p>
          <p className="text-xs text-concrete-600 mt-1">Start checklist</p>
        </Link>
      </div>

      <AttributionFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  variant = "default",
  href,
}: {
  label: string;
  value: string;
  subtext?: string;
  variant?: "default" | "danger" | "warning";
  href?: string;
}) {
  const valueColor = {
    default: "text-slate-900",
    danger: "text-red-600",
    warning: "text-yellow-600",
  }[variant];

  const content = (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-300 transition-colors">
      <p className="text-xs font-medium text-concrete-600">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${valueColor}`}>{value}</p>
      {subtext && <p className="text-xs text-concrete-600 mt-0.5">{subtext}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
