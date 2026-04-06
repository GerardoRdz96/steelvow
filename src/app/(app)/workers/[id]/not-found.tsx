import Link from "next/link";

export default function WorkerNotFound() {
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
          Worker Not Found
        </h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-900 mb-1">This worker does not exist</p>
        <p className="text-xs text-concrete-600 mb-4">The worker may have been removed or the link is invalid.</p>
        <Link
          href="/workers"
          className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Back to Workers
        </Link>
      </div>
    </div>
  );
}
