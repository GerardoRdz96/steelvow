import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanTier } from "@/types/database";

// Disable body parsing — Stripe needs raw body for signature verification
export const dynamic = "force-dynamic";

// BUG-SV-055: Return null for unknown priceIds to prevent silent downgrade
function tierFromPriceId(priceId: string): PlanTier | null {
  switch (priceId) {
    case "price_1THEqV2NPkKbliuArgzCHyx7": return "starter";
    case "price_1THEqW2NPkKbliuAfeCgsCs7": return "pro";
    case "price_1THEqX2NPkKbliuACzLA3jRQ": return "business";
    default:
      console.error(`Unknown Stripe priceId: ${priceId} — skipping tier update`);
      return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const companyId = session.metadata?.company_id;
      const tier = session.metadata?.tier as PlanTier;

      if (companyId && tier) {
        await supabase
          .from("companies")
          .update({
            plan_tier: tier,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq("id", companyId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const companyId = subscription.metadata?.company_id;
      const priceId = subscription.items.data[0]?.price?.id;

      if (companyId && priceId) {
        const tier = tierFromPriceId(priceId);
        if (tier) {
          await supabase
            .from("companies")
            .update({
              plan_tier: tier,
              updated_at: new Date().toISOString(),
            })
            .eq("id", companyId);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const companyId = subscription.metadata?.company_id;

      if (companyId) {
        // Downgrade to starter (free-like) on cancellation
        await supabase
          .from("companies")
          .update({
            plan_tier: "starter",
            updated_at: new Date().toISOString(),
          })
          .eq("id", companyId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.error(
        `Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`
      );
      // Could send email notification here via Resend
      break;
    }
  }

  return NextResponse.json({ received: true });
}
