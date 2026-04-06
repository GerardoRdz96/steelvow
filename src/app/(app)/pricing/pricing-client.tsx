"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { STEELVOW_PRICES } from "@/lib/pricing-data";
import type { PlanTier } from "@/types/database";

const PLANS: Array<{ tier: PlanTier; workers: number; projects: number; popular?: boolean }> = [
  { tier: "starter", workers: 10, projects: 3 },
  { tier: "pro", workers: 30, projects: -1, popular: true },
  { tier: "business", workers: 50, projects: -1 },
];

export function PricingClient({
  currentTier,
  hasStripeCustomer,
}: {
  currentTier: PlanTier;
  hasStripeCustomer: boolean;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectPlan(tier: PlanTier) {
    if (tier === currentTier) return;
    setLoading(tier);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (data.url) {
        // SEC-SV-001: Validate redirect URL is a Stripe checkout domain
        try {
          const redirectUrl = new URL(data.url);
          if (redirectUrl.hostname !== "checkout.stripe.com") {
            setError("Invalid checkout URL");
            return;
          }
        } catch {
          setError("Invalid checkout URL");
          return;
        }
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {t("pricing.title")}
        </h1>
        <p className="text-sm text-concrete-600 mt-2">
          {t("pricing.subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                plan.popular
                  ? "border-orange-500 shadow-lg shadow-orange-100"
                  : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {t("pricing.most_popular")}
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900 capitalize">
                  {t(`pricing.tier_${plan.tier}` as any)}
                </h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ${plan.tier === "starter" ? 49 : plan.tier === "pro" ? 99 : 199}
                  </span>
                  <span className="text-sm text-concrete-600">/mo</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{plan.workers}</span> {t("pricing.workers")}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">
                    {plan.projects === -1 ? t("pricing.unlimited") : plan.projects}
                  </span>{" "}
                  {t("pricing.projects")}
                </p>
                {/* BUG-SV-056: Render feature list from STEELVOW_PRICES */}
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {STEELVOW_PRICES[plan.tier].features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-green-600 mt-0.5 shrink-0">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.tier)}
                disabled={isCurrent || !!loading}
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors min-h-[48px] ${
                  isCurrent
                    ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                    : plan.popular
                    ? "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                    : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                }`}
              >
                {loading === plan.tier
                  ? t("common.loading")
                  : isCurrent
                  ? t("pricing.current_plan")
                  : t("pricing.select_plan")}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-concrete-600 mt-8">
        {t("pricing.trial_note")}
      </p>
    </div>
  );
}
