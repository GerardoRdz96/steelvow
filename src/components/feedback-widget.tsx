"use client";

import { useEffect, useRef, useState } from "react";

type Category = "bug" | "idea" | "praise" | "other";
type Status = "idle" | "sending" | "success" | "error";

const CATEGORIES: Array<{ key: Category; label: string; icon: string }> = [
  { key: "bug", label: "Bug", icon: "⚠" },
  { key: "idea", label: "Idea", icon: "✦" },
  { key: "praise", label: "Praise", icon: "♥" },
  { key: "other", label: "Other", icon: "…" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const firstFieldRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 3) {
      setErrorMsg("Please write at least 3 characters.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email.trim() || undefined,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "Could not send feedback. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("");
      setEmail("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1800);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 rounded-full bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center"
        >
          <button
            type="button"
            aria-label="Close feedback"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 id="feedback-title" className="text-lg font-extrabold text-slate-900">
                  Send feedback
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Found a bug or have an idea? We read every message.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Category
                </legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {CATEGORIES.map((c, i) => (
                    <button
                      key={c.key}
                      ref={i === 0 ? firstFieldRef : undefined}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      aria-pressed={category === c.key}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                        category === c.key
                          ? "border-orange-600 bg-orange-50 text-slate-900"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-base" aria-hidden="true">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="feedback-message" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Your message
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
                  placeholder="What happened? What did you expect?"
                />
                <p className="mt-1 text-right text-xs text-slate-400">{message.length}/2000</p>
              </div>

              <div>
                <label htmlFor="feedback-email" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Email <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
                  placeholder="you@example.com"
                />
              </div>

              {status === "error" && errorMsg && (
                <p className="text-sm text-red-600" role="alert">{errorMsg}</p>
              )}
              {status === "success" && (
                <p className="text-sm text-emerald-600" role="status">Thanks! We got it.</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "sending" || status === "success"}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50"
                >
                  {status === "sending" ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
