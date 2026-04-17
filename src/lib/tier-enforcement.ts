import { createClient } from "@/lib/supabase/server";
import { STEELVOW_PRICES, type StripeTier } from "@/lib/pricing-data";

// ── Feature access map ─────────────────────────────────────────────
// Which tiers can use which features
const FEATURE_ACCESS: Record<string, StripeTier[]> = {
  create_project: ["starter", "pro", "business"],
  create_worker: ["starter", "pro", "business"],
  ai_safety_programs: ["pro", "business"],
  osha_300: ["pro", "business"],
  spanish_language: ["pro", "business"],
  photo_documentation: ["pro", "business"],
  osha_auto_filing: ["business"],
  api_access: ["business"],
  custom_checklists: ["business"],
};

const FEATURE_LABELS: Record<string, string> = {
  create_project: "creating projects",
  create_worker: "adding workers",
  ai_safety_programs: "AI Safety Programs",
  osha_300: "OSHA 300 Log Generation",
  spanish_language: "Spanish language support",
  photo_documentation: "photo documentation",
  osha_auto_filing: "OSHA 300 auto-filing",
  api_access: "API access",
  custom_checklists: "custom checklists",
};

const TIER_NAMES: Record<StripeTier, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

// ── Core functions ─────────────────────────────────────────────────

export async function getCompanyTier(companyId: string): Promise<StripeTier> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("companies")
      .select("plan_tier")
      .eq("id", companyId)
      .single();
    return (data?.plan_tier as StripeTier) || "starter";
  } catch {
    return "starter";
  }
}

export function checkFeatureAccess(tier: StripeTier, feature: string): boolean {
  const allowed = FEATURE_ACCESS[feature];
  return allowed ? allowed.includes(tier) : true;
}

function minRequiredTier(feature: string): string {
  const tiers = FEATURE_ACCESS[feature];
  if (!tiers || tiers.length === 0) return "Starter";
  return TIER_NAMES[tiers[0] as StripeTier] || "Starter";
}

export function tierGateError(feature: string, currentTier: StripeTier) {
  const label = FEATURE_LABELS[feature] || feature;
  const required = minRequiredTier(feature);
  return {
    error: `${label} requires a ${required} plan or higher. Upgrade to unlock this feature.`,
    upgrade: true,
    currentTier,
    requiredTier: required.toLowerCase(),
  };
}

// ── Count helpers ──────────────────────────────────────────────────

export async function getWorkerCount(companyId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("workers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getProjectCount(companyId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export function getTierLimits(tier: StripeTier) {
  const plan = STEELVOW_PRICES[tier];
  return {
    workers: plan.workers,
    projects: plan.projects, // -1 = unlimited
  };
}
