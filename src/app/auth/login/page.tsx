"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AttributionFooter } from "@/components/layout/attribution-footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a login link.");
    }
    setLoading(false);
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Steel<span className="text-orange-600">vow</span>
          </h1>
          <p className="text-sm text-concrete-600 mt-2">
            OSHA Compliance for Construction Crews
          </p>
        </div>

        {/* Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-900 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="foreman@company.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-base placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>


        {/* Message */}
        {message && (
          <p className="mt-4 text-sm text-center text-concrete-600">
            {message}
          </p>
        )}

        <AttributionFooter />
      </div>
    </div>
  );
}
