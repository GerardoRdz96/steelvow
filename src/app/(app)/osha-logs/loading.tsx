export default function OSHALogsLoading() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-slate-100 rounded animate-pulse mt-2" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="h-5 w-56 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-sm text-concrete-600">Loading OSHA 300 log...</p>
      </div>
    </div>
  );
}
