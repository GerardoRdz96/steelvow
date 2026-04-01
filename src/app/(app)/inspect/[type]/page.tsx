"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CHECKLIST_TEMPLATES } from "@/lib/checklist-templates";
import { ChecklistForm } from "@/components/inspections/checklist-form";
import { createBrowserClient } from "@supabase/ssr";

export default function InspectionPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const [context, setContext] = useState<{
    companyId: string;
    projectId: string;
    workerId: string;
  } | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [noWorkerProfile, setNoWorkerProfile] = useState(false);
  const [step, setStep] = useState<"project" | "checklist">("project");

  const template = CHECKLIST_TEMPLATES[params.type];

  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const companyId = user.app_metadata?.company_id;
      if (!companyId) {
        router.push("/company/setup");
        return;
      }

      // Get active projects for this company
      // BUG-SV-022: Add range limit to projects query
      // BUG-SV-041: Filter by company_id to prevent cross-tenant data access
      const { data: projectList } = await supabase
        .from("projects")
        .select("id, name")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("name")
        .range(0, 49);

      setProjects(projectList || []);

      // BUG-SV-013: Require worker record — auth UUID would violate workers(id) FK
      // BUG-SV-045: Filter by company_id to match server actions pattern
      const { data: worker } = await supabase
        .from("workers")
        .select("id")
        .eq("email", user.email)
        .eq("company_id", companyId)
        .single();

      if (!worker) {
        setNoWorkerProfile(true);
        setLoading(false);
        return;
      }

      setContext({
        companyId,
        projectId: "",
        workerId: worker.id,
      });
      setLoading(false);
    }
    init();
  }, [router]);

  if (!template) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-lg font-bold text-slate-900">Checklist not found</p>
        <button
          onClick={() => router.push("/inspect")}
          className="mt-4 text-orange-600 font-semibold text-sm"
        >
          Back to Inspections
        </button>
      </div>
    );
  }

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
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-slate-900 mb-2">Worker Profile Required</p>
        <p className="text-sm text-concrete-600 mb-4">
          An admin needs to add you as a worker before you can run inspections.
        </p>
        <button
          onClick={() => router.push("/inspect")}
          className="text-orange-600 font-semibold text-sm"
        >
          Back to Inspections
        </button>
      </div>
    );
  }

  if (step === "project") {
    return (
      <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/inspect")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              {template.name}
            </h1>
            <p className="text-xs text-concrete-600">{template.description}</p>
          </div>
        </div>

        {/* Project Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">
            Select Project
          </h2>
          {projects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-concrete-600 mb-3">
                No active projects. Create one first.
              </p>
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
                  <span className="text-sm font-semibold text-slate-900">
                    {project.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedProject && (
            <button
              onClick={() => {
                setContext((prev) =>
                  prev ? { ...prev, projectId: selectedProject } : null
                );
                setStep("checklist");
              }}
              className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              Start Inspection
            </button>
          )}
        </div>
      </div>
    );
  }

  // Checklist step
  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-200 bg-white">
        <button
          onClick={() => setStep("project")}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">{template.name}</h1>
          <p className="text-xs text-concrete-600">
            {projects.find((p) => p.id === context?.projectId)?.name || "Unknown Project"}
          </p>
        </div>
      </div>

      <ChecklistForm
        template={template}
        companyId={context!.companyId}
        projectId={context!.projectId}
        workerId={context!.workerId}
        onComplete={() => {
          router.push("/inspect?saved=1");
        }}
      />
    </div>
  );
}
