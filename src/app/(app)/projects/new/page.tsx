import Link from "next/link";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/projects"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Back to projects"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          New Project
        </h1>
      </div>

      <form action={createProject} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Project Name *
          </label>
          <input
            name="name"
            required
            placeholder="e.g., Downtown Office Build"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Address
          </label>
          <input
            name="address"
            placeholder="123 Main St, City, ST"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Project Type
          </label>
          <select
            name="project_type"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px] bg-white"
          >
            <option value="">Select type</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
            <option value="renovation">Renovation</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Start Date
          </label>
          <input
            name="start_date"
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
        >
          Create Project
        </button>
      </form>
    </div>
  );
}
