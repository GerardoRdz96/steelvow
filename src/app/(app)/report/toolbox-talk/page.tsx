"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ToolboxTalkForm } from "@/components/incidents/toolbox-talk-form";

export default function ToolboxTalkPage() {
  const router = useRouter();
  const [context, setContext] = useState<{
    companyId: string;
    workerId: string;
  } | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [noWorkerProfile, setNoWorkerProfile] = useState(false);
  const [step, setStep] = useState<"project" | "form">("project");

  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const companyId = user.app_metadata?.company_id;
      if (!companyId) { router.push("/company/setup"); return; }

      const [projectRes, workerRes, selfRes] = await Promise.all([
        // BUG-SV-022: Add range limit to projects query
        // BUG-SV-042: Filter by company_id to prevent cross-tenant data access
        supabase.from("projects").select("id, name").eq("company_id", companyId).eq("status", "active").order("name").limit(50),
        supabase.from("workers").select("id, name").eq("company_id", companyId).eq("is_active", true).order("name").limit(50),
        // BUG-SV-045: Filter by company_id to match server actions pattern
        supabase.from("workers").select("id").eq("email", user.email).eq("company_id", companyId).single(),
      ]);

      setProjects(projectRes.data || []);
      setWorkers(workerRes.data || []);

      if (!selfRes.data) {
        setNoWorkerProfile(true);
        setLoading(false);
        return;
      }

      setContext({ companyId, workerId: selfRes.data.id });
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-pulse text-concrete-600 text-sm">Loading...</div>
      </div>
    );
  }

  if (noWorkerProfile) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-blue-600">T</span>
        </div>
        <p className="text-lg font-bold text-slate-900 mb-2">Worker Profile Required</p>
        <p className="text-sm text-concrete-600 mb-4">
          An admin needs to add you as a worker before you can log toolbox talks.
        </p>
        <button onClick={() => router.push("/report")} className="text-orange-600 font-semibold text-sm">
          Back to Reports
        </button>
      </div>
    );
  }

  if (step === "project") {
    return (
      <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/report")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Toolbox Talk</h1>
            <p className="text-xs text-concrete-600">Select the project for this talk</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Select Project</h2>
          {projects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-concrete-600 mb-3">No active projects.</p>
              <button
                onClick={() => router.push("/projects/new")}
                className="bg-orange-600 text-white text-sm font-semibold px-4 py-3 rounded-xl min-h-[48px]"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors min-h-[48px] ${
                    selectedProject === project.id
                      ? "border-orange-400 bg-orange-50"
                      : "border-slate-200 hover:border-orange-300"
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-900">{project.name}</span>
                </button>
              ))}
            </div>
          )}
          {selectedProject && (
            <button
              onClick={() => setStep("form")}
              className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              Start Talk
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ToolboxTalkForm
      companyId={context!.companyId}
      projectId={selectedProject}
      workerId={context!.workerId}
      projectName={projects.find((p) => p.id === selectedProject)?.name || "Unknown"}
      workers={workers}
      onComplete={() => router.push("/report?saved=talk")}
      onBack={() => setStep("project")}
    />
  );
}
