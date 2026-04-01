import Link from "next/link";
import { WorkerForm } from "@/components/workers/worker-form";
import { createWorker } from "../actions";

export default function NewWorkerPage() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/workers"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Back to workers"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Add Worker
        </h1>
      </div>

      <WorkerForm action={createWorker} />
    </div>
  );
}
