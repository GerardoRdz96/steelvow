"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateOSHA300Entries, getOSHA300CSV } from "./actions";

interface Props {
  year: number;
  unprocessedCount: number;
}

export function OSHA300Actions({ year, unprocessedCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateOSHA300Entries(year);
        setMessage({ type: "success", text: result.message });
        router.refresh();
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to generate entries" });
      }
    });
  };

  const handleExportCSV = () => {
    startTransition(async () => {
      try {
        const csv = await getOSHA300CSV(year);
        if (!csv) {
          setMessage({ type: "error", text: "No entries to export." });
          return;
        }
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `osha-300-log-${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "success", text: "CSV downloaded." });
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Export failed" });
      }
    });
  };

  return (
    <div className="mb-6 space-y-3">
      {message && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${
          message.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}>
          <p className={`text-sm font-semibold ${
            message.type === "success" ? "text-green-800" : "text-red-800"
          }`}>
            {message.text}
          </p>
          <button
            onClick={() => setMessage(null)}
            className={`text-sm font-bold ml-3 ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            X
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {unprocessedCount > 0 && (
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors min-h-[48px] disabled:opacity-50"
          >
            {isPending ? "Generating..." : `Auto-Generate (${unprocessedCount} new)`}
          </button>
        )}
        <button
          onClick={handleExportCSV}
          disabled={isPending}
          className="bg-white border border-slate-200 hover:border-orange-300 text-slate-700 text-sm font-semibold px-4 py-3 rounded-xl transition-colors min-h-[48px] disabled:opacity-50"
        >
          {isPending ? "Exporting..." : "Export CSV"}
        </button>
      </div>
    </div>
  );
}
