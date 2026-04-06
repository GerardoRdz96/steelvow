import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Re-export pricing data for server-side use (API routes)
export { STEELVOW_PRICES, type StripeTier } from "@/lib/pricing-data";
