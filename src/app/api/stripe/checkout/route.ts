import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STEELVOW_PRICES, type StripeTier } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = user.app_metadata?.company_id;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const tier = body.tier as StripeTier;

    if (!tier || !STEELVOW_PRICES[tier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const priceConfig = STEELVOW_PRICES[tier];

    // Get or create Stripe customer
    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id, name")
      .eq("id", companyId)
      .single();

    let customerId = company?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company?.name || undefined,
        metadata: {
          company_id: companyId,
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    // BUG-SV-054: Use env var instead of Origin header to prevent open redirect
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://steelvow.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceConfig.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          company_id: companyId,
          tier,
        },
      },
      success_url: `${origin}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: {
        company_id: companyId,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
