"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AttributionFooter } from "@/components/layout/attribution-footer";

type AuthMode = "email" | "phone";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

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

  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      setMessage(error.message);
    } else {
      setStep("verify");
      setMessage("Enter the code sent to your phone.");
    }
    setLoading(false);
  }

  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
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

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => {
              setMode("email");
              setStep("input");
              setMessage("");
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              mode === "email"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-concrete-600"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => {
              setMode("phone");
              setStep("input");
              setMessage("");
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              mode === "phone"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-concrete-600"
            }`}
          >
            Phone
          </button>
        </div>

        {/* Email Login */}
        {mode === "email" && (
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
        )}

        {/* Phone Login */}
        {mode === "phone" && step === "input" && (
          <form onSubmit={handlePhoneSend} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-900 mb-1.5"
              >
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-base placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {/* OTP Verify */}
        {mode === "phone" && step === "verify" && (
          <form onSubmit={handlePhoneVerify} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-slate-900 mb-1.5"
              >
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-center text-2xl font-mono tracking-widest placeholder:text-concrete-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[48px]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setOtp("");
                setMessage("");
              }}
              className="w-full text-sm text-concrete-600 hover:text-slate-900"
            >
              Back
            </button>
          </form>
        )}

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
