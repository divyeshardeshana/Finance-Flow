import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getStripeSecretKey(supabaseAdmin: ReturnType<typeof createClient>): Promise<string> {
  const { data: settings } = await supabaseAdmin
    .from("system_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["stripe_environment", "stripe_test_secret_key", "stripe_live_secret_key"]);

  const map: Record<string, string> = {};
  for (const s of settings ?? []) map[s.setting_key] = s.setting_value;

  const env = map["stripe_environment"] ?? "test";
  return env === "production" ? map["stripe_live_secret_key"] : map["stripe_test_secret_key"];
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

    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subscription?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "No active Stripe subscription found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (subscription.status === "cancelled") {
      return new Response(JSON.stringify({ error: "Subscription is already cancelled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secretKey = await getStripeSecretKey(supabaseAdmin);
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cancelRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!cancelRes.ok) {
      const err = await cancelRes.json();
      return new Response(JSON.stringify({ error: err.error?.message ?? "Failed to downgrade subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    const { data: freeTier } = await supabaseAdmin
      .from("subscription_tiers")
      .select("id")
      .eq("tier_name", "free")
      .maybeSingle();

    await supabaseAdmin
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        auto_renew: false,
        cancelled_at: now,
        updated_at: now,
        tier_id: freeTier?.id ?? null,
        tier: "free",
      })
      .eq("user_id", user.id);

    await supabaseAdmin
      .from("user_profiles")
      .update({ subscription_tier: "free" })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({ success: true, downgradedToFree: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("downgrade-to-free error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
