import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getStripeConfig(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data: settings } = await supabaseAdmin
    .from("system_settings")
    .select("setting_key, setting_value")
    .in("setting_key", [
      "stripe_environment",
      "stripe_test_secret_key",
      "stripe_live_secret_key",
    ]);

  const map: Record<string, string> = {};
  for (const s of settings ?? []) {
    map[s.setting_key] = s.setting_value;
  }

  const env = map["stripe_environment"] ?? "test";
  const secretKey =
    env === "production"
      ? map["stripe_live_secret_key"]
      : map["stripe_test_secret_key"];

  return { env, secretKey };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId, billingCycle, successUrl, cancelUrl } = await req.json();
    if (!planId || !billingCycle) {
      return new Response(JSON.stringify({ error: "planId and billingCycle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { env, secretKey } = await getStripeConfig(supabaseAdmin);
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Stripe is not configured. Please set up Stripe keys in Admin Settings." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tier } = await supabaseAdmin
      .from("subscription_tiers")
      .select("id, tier_name, display_name, stripe_price_id_monthly, stripe_price_id_annual")
      .eq("id", planId)
      .maybeSingle();

    if (!tier) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceId = billingCycle === "annual"
      ? tier.stripe_price_id_annual
      : tier.stripe_price_id_monthly;

    if (!priceId) {
      return new Response(JSON.stringify({ error: `No Stripe price ID configured for ${tier.display_name} (${billingCycle}). Please configure it in Admin → Subscriptions.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .maybeSingle();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const createCustomerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: profile?.email ?? user.email ?? "",
          "metadata[user_id]": user.id,
        }),
      });

      if (!createCustomerRes.ok) {
        const err = await createCustomerRes.json();
        return new Response(JSON.stringify({ error: err.error?.message ?? "Failed to create Stripe customer" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const customer = await createCustomerRes.json();
      stripeCustomerId = customer.id;

      await supabaseAdmin
        .from("user_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    const origin = req.headers.get("origin") ?? "http://localhost:5173";
    const finalSuccessUrl = successUrl ?? `${origin}/dashboard?subscription_success=1&session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl ?? `${origin}/dashboard?subscription_cancel=1`;

    const sessionBody = new URLSearchParams({
      mode: "subscription",
      customer: stripeCustomerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      "metadata[user_id]": user.id,
      "metadata[plan_id]": planId,
      "metadata[plan_name]": tier.display_name,
      "metadata[billing_cycle]": billingCycle,
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][plan_id]": planId,
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionBody,
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      return new Response(JSON.stringify({ error: err.error?.message ?? "Failed to create checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await sessionRes.json();

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id, environment: env }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
