import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getStripeSecretKey(supabaseAdmin: ReturnType<typeof createClient>): Promise<string | null> {
  // Prefer env var (set via edge function secrets) — fall back to DB for backwards compat
  const envKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (envKey?.trim()) return envKey.trim();

  const { data: settings } = await supabaseAdmin
    .from("system_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["stripe_environment", "stripe_test_secret_key", "stripe_live_secret_key"]);

  const map: Record<string, string> = {};
  for (const s of settings ?? []) map[s.setting_key] = s.setting_value ?? "";

  const env = map["stripe_environment"] ?? "test";
  const key = env === "production" ? map["stripe_live_secret_key"] : map["stripe_test_secret_key"];
  return key?.trim() || null;
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

    const secretKey = await getStripeSecretKey(supabaseAdmin);
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please set up your Stripe keys in Admin Settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Body is optional — session_id is passed from the success redirect URL so
    // we can resolve the customer/subscription directly from Stripe without
    // depending on user_profiles.stripe_customer_id being set.
    let bodySessionId: string | null = null;
    try {
      const body = await req.json();
      bodySessionId = body?.session_id ?? null;
    } catch {
      // empty body is fine
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .maybeSingle();

    let stripeCustomerId: string | null = profile?.stripe_customer_id ?? null;

    // If customer is not linked in our DB, try to resolve it via the Stripe
    // checkout session that was just completed. This handles the case where
    // create-checkout-session silently failed to persist the customer ID.
    if (!stripeCustomerId && bodySessionId) {
      console.log(`stripe_customer_id missing for user ${user.id} — resolving via session ${bodySessionId}`);
      const sessionRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${bodySessionId}`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        const resolvedCustomerId = sessionData.customer as string | null;
        if (resolvedCustomerId) {
          stripeCustomerId = resolvedCustomerId;
          // Persist the customer ID so future syncs don't need the session_id.
          const { error: patchErr } = await supabaseAdmin
            .from("user_profiles")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", user.id);
          if (patchErr) {
            console.error("Failed to backfill stripe_customer_id:", patchErr);
          } else {
            console.log(`Backfilled stripe_customer_id ${stripeCustomerId} for user ${user.id}`);
          }
        }
      } else {
        console.error("Failed to fetch Stripe session:", await sessionRes.text());
      }
    }

    if (!stripeCustomerId) {
      return new Response(
        JSON.stringify({ synced: false, message: "No Stripe customer linked to this account.", tier: "free" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subsRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${stripeCustomerId}&status=all&limit=10&expand[]=data.default_payment_method`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    if (!subsRes.ok) {
      const err = await subsRes.json();
      return new Response(
        JSON.stringify({ error: err.error?.message ?? "Failed to fetch subscriptions from Stripe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subsData = await subsRes.json();
    const subscriptions: Record<string, unknown>[] = subsData.data ?? [];

    const activeOrTrialing = subscriptions.find(
      (s) => s.status === "active" || s.status === "trialing"
    );
    const latestSub = activeOrTrialing ?? subscriptions[0] ?? null;

    if (!latestSub) {
      const { data: freeTier } = await supabaseAdmin
        .from("subscription_tiers")
        .select("id")
        .eq("tier_name", "free")
        .maybeSingle();

      const now = new Date().toISOString();
      await supabaseAdmin
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          auto_renew: false,
          tier: "free",
          tier_id: freeTier?.id,
          stripe_subscription_id: null,
          updated_at: now,
        })
        .eq("user_id", user.id);

      await supabaseAdmin
        .from("user_profiles")
        .update({ subscription_tier: "free" })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({ synced: true, message: "No active Stripe subscription found. Plan reset to Free.", tier: "free" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSubId = latestSub.id as string;
    const stripeStatus = latestSub.status as string;
    const cancelAtPeriodEnd = latestSub.cancel_at_period_end as boolean;
    const currentPeriodEnd = latestSub.current_period_end as number;
    const currentPeriodStart = latestSub.current_period_start as number;
    const startDateUnix = (latestSub.start_date as number) ?? currentPeriodStart;
    const stripePriceId = (latestSub as Record<string, unknown> & { items?: { data?: { price?: { id: string } }[] } }).items?.data?.[0]?.price?.id ?? null;
    const subMetadata = latestSub.metadata as Record<string, string> | null;
    const planId = subMetadata?.plan_id ?? null;
    const billingCycle = subMetadata?.billing_cycle ?? "monthly";

    let mappedStatus = "active";
    if (stripeStatus === "past_due") mappedStatus = "past_due";
    else if (stripeStatus === "canceled" || stripeStatus === "cancelled") mappedStatus = "cancelled";
    else if (stripeStatus === "trialing") mappedStatus = "trial";
    else if (stripeStatus === "unpaid" || stripeStatus === "paused") mappedStatus = "past_due";
    else if (stripeStatus === "incomplete" || stripeStatus === "incomplete_expired") mappedStatus = "expired";

    const nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
    const startDate = new Date(startDateUnix * 1000).toISOString();
    const now = new Date().toISOString();

    let tierId: string | null = null;
    let tierName: string | null = null;

    if (planId) {
      const { data: tier } = await supabaseAdmin
        .from("subscription_tiers")
        .select("id, tier_name")
        .eq("id", planId)
        .maybeSingle();
      if (tier) {
        tierId = tier.id;
        tierName = tier.tier_name;
      }
    }

    if (!tierId && stripePriceId) {
      const { data: tierByPrice } = await supabaseAdmin
        .from("subscription_tiers")
        .select("id, tier_name")
        .or(`stripe_price_id_monthly.eq.${stripePriceId},stripe_price_id_annual.eq.${stripePriceId}`)
        .maybeSingle();
      if (tierByPrice) {
        tierId = tierByPrice.id;
        tierName = tierByPrice.tier_name;
      }
    }

    if (!tierId) {
      const { data: existingSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("tier_id, tier")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existingSub?.tier_id) {
        tierId = existingSub.tier_id;
        tierName = existingSub.tier;
      }
    }

    if (!tierId) {
      const { data: freeTier } = await supabaseAdmin
        .from("subscription_tiers")
        .select("id")
        .eq("tier_name", "free")
        .maybeSingle();
      tierId = freeTier?.id ?? null;
      tierName = "free";
    }

    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      stripe_subscription_id: stripeSubId,
      stripe_customer_id: stripeCustomerId,
      tier_id: tierId,
      tier: tierName,
      status: mappedStatus,
      start_date: startDate,
      next_billing_date: nextBillingDate,
      auto_renew: !cancelAtPeriodEnd,
      billing_cycle: billingCycle,
      updated_at: now,
    };

    if (stripeStatus === "canceled" || cancelAtPeriodEnd) {
      upsertPayload.cancelled_at = now;
    } else {
      upsertPayload.cancelled_at = null;
    }

    if (stripePriceId) {
      upsertPayload.stripe_price_id = stripePriceId;
    }

    const { error: upsertError } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert(upsertPayload, { onConflict: "user_id" });

    if (upsertError) {
      console.error("sync-subscription: upsert error", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to update subscription in database", details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tierName && mappedStatus === "active") {
      await supabaseAdmin
        .from("user_profiles")
        .update({ subscription_tier: tierName })
        .eq("id", user.id);
    }

    const invoicesRes = await fetch(
      `https://api.stripe.com/v1/invoices?customer=${stripeCustomerId}&limit=50`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    if (invoicesRes.ok) {
      const invoicesData = await invoicesRes.json();
      const invoices: Record<string, unknown>[] = invoicesData.data ?? [];

      for (const invoice of invoices) {
        if (invoice.status !== "paid") continue;

        const invoiceId = invoice.id as string;
        const { data: existing } = await supabaseAdmin
          .from("billing_history")
          .select("id")
          .eq("stripe_invoice_id", invoiceId)
          .maybeSingle();

        if (!existing) {
          const amount = typeof invoice.amount_paid === "number" ? invoice.amount_paid / 100 : 0;
          const paymentDateUnix = invoice.created as number;
          await supabaseAdmin.from("billing_history").insert({
            user_id: user.id,
            stripe_invoice_id: invoiceId,
            amount,
            currency: (invoice.currency as string) ?? "usd",
            status: "paid",
            invoice_url: (invoice.hosted_invoice_url as string) ?? null,
            invoice_pdf: (invoice.invoice_pdf as string) ?? null,
            payment_date: new Date(paymentDateUnix * 1000).toISOString(),
            plan_name: tierName,
            billing_cycle: billingCycle,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        synced: true,
        tier: tierName ?? "free",
        status: mappedStatus,
        nextBillingDate,
        startDate,
        autoRenew: !cancelAtPeriodEnd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-subscription-from-stripe error:", err);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
