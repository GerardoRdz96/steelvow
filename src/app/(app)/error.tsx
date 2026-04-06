"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error details to console for debugging
  console.error("[Steelvow App Error]", {
    message: error.message,
    digest: error.digest,
    stack: error.stack,
  });

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-red-600">!</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-600 mb-1">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={reset}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors min-h-[48px]"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl transition-colors min-h-[48px] inline-flex items-center"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
