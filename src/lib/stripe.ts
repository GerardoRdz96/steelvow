import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Steelvow pricing tiers — Stripe price IDs
export const STEELVOW_PRICES = {
  starter: {
    priceId: "price_1THEqV2NPkKbliuArgzCHyx7",
    productId: "prod_UFkLMNPhbpXrqj",
    name: "Starter",
    price: 49,
    workers: 10,
    projects: 3,
    features: ["Daily safety checklists", "Incident reporting", "Worker certifications", "Toolbox talk logging"],
  },
  pro: {
    priceId: "price_1THEqW2NPkKbliuAfeCgsCs7",
    productId: "prod_UFkLCNbyZuYSar",
    name: "Pro",
    price: 99,
    workers: 30,
    projects: -1, // unlimited
    features: ["Everything in Starter", "AI safety programs", "OSHA 300 logs", "Spanish language support", "Photo documentation"],
  },
  business: {
    priceId: "price_1THEqX2NPkKbliuACzLA3jRQ",
    productId: "prod_UFkLXRRxPLMXYy",
    name: "Business",
    price: 199,
    workers: 50,
    projects: -1,
    features: ["Everything in Pro", "OSHA 300 auto-filing", "API access", "Priority support", "Custom checklists"],
  },
} as const;

export type StripeTier = keyof typeof STEELVOW_PRICES;
