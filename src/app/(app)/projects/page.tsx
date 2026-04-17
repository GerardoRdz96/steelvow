import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const companyId = user.app_metadata?.company_id;
  if (!companyId) redirect("/company/setup");

  // BUG-SV-017: Limit query to 50 records
  // BUG-SV-039: Filter by company_id to prevent cross-tenant data access
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  // BUG-SV-043: Don't leak raw Supabase error messages to client
  // BUG-SV-064: Log error but don't crash — show empty state instead
  if (error) {
    console.error("Projects query error:", error.message);
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Projects
        </h1>
        <Link
          href="/projects/new"
          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors min-h-[48px] flex items-center"
        >
          + New Project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-sm text-concrete-600">No projects yet.</p>
          <p className="text-xs text-concrete-600 mt-1">
            Create a project to start running inspections.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {project.name}
                  </h3>
                  {project.address && (
                    <p className="text-xs text-concrete-600 mt-0.5">
                      {project.address}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    project.status === "active"
                      ? "bg-green-100 text-green-700"
                      : project.status === "paused"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
