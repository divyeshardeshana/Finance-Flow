import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

async function getStripeConfig(supabaseAdmin: ReturnType<typeof createClient>) {
  // Prefer env vars (set via edge function secrets) — fall back to DB for backwards compat
  const envWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const envSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (envSecretKey && envWebhookSecret) {
    return { env: "env", secretKey: envSecretKey, webhookSecret: envWebhookSecret };
  }

  const { data: settings } = await supabaseAdmin
    .from("system_settings")
    .select("setting_key, setting_value")
    .in("setting_key", [
      "stripe_environment",
      "stripe_test_secret_key",
      "stripe_test_webhook_secret",
      "stripe_live_secret_key",
      "stripe_live_webhook_secret",
    ]);

  const map: Record<string, string> = {};
  for (const s of settings ?? []) {
    map[s.setting_key] = s.setting_value ?? "";
  }

  const env = map["stripe_environment"] ?? "test";
  const secretKey = envSecretKey || (env === "production" ? map["stripe_live_secret_key"] : map["stripe_test_secret_key"]);
  const webhookSecret = envWebhookSecret || (env === "production" ? map["stripe_live_webhook_secret"] : map["stripe_test_webhook_secret"]);

  return { env, secretKey, webhookSecret };
}

async function verifyStripeSignature(
  body: string,
  signature: string,
  webhookSecret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    let timestamp = "";
    const v1Signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") timestamp = value;
      if (key === "v1") v1Signatures.push(value);
    }

    if (!timestamp || v1Signatures.length === 0) return false;

    const tsNumber = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - tsNumber) > 300) return false;

    const signedPayload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return v1Signatures.some((v1) => v1 === expectedSig);
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { secretKey, webhookSecret } = await getStripeConfig(supabaseAdmin);

    if (!secretKey || !webhookSecret) {
      console.error("Stripe not configured — missing secretKey or webhookSecret");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();

    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid Stripe signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);

    const { data: existing } = await supabaseAdmin
      .from("stripe_webhooks_log")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.from("stripe_webhooks_log").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: "processing",
    });

    EdgeRuntime.waitUntil(handleEvent(event, supabaseAdmin, secretKey));

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleEvent(
  event: Record<string, unknown>,
  supabaseAdmin: ReturnType<typeof createClient>,
  secretKey: string
) {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data as { object: Record<string, unknown> }, supabaseAdmin, secretKey);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data as { object: Record<string, unknown> }, supabaseAdmin, secretKey);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data as { object: Record<string, unknown> }, supabaseAdmin, secretKey);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data as { object: Record<string, unknown> }, supabaseAdmin, secretKey);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data as { object: Record<string, unknown> }, supabaseAdmin);
        break;
      // ── One-time payment events ──────────────────────────────────────────
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data as { object: Record<string, unknown> }, supabaseAdmin);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data as { object: Record<string, unknown> }, supabaseAdmin);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await supabaseAdmin
      .from("stripe_webhooks_log")
      .update({ status: "processed" })
      .eq("stripe_event_id", event.id as string);
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
    await supabaseAdmin
      .from("stripe_webhooks_log")
      .update({ status: "failed" })
      .eq("stripe_event_id", event.id as string);
  }
}

async function getFreeTierId(supabaseAdmin: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("subscription_tiers")
    .select("id")
    .eq("tier_name", "free")
    .maybeSingle();
  return data?.id ?? null;
}

async function resolveUserFromCustomer(
  stripeCustomerId: string,
  stripeSubscriptionId: string | null,
  supabaseAdmin: ReturnType<typeof createClient>,
  secretKey: string
): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (profile) return profile.id;

  if (stripeSubscriptionId) {
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (subRes.ok) {
      const subData = await subRes.json();
      const metaUserId = subData.metadata?.user_id;
      if (metaUserId) {
        await supabaseAdmin
          .from("user_profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", metaUserId);
        return metaUserId;
      }
    }
  }

  const customerRes = await fetch(
    `https://api.stripe.com/v1/customers/${stripeCustomerId}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  if (customerRes.ok) {
    const customerData = await customerRes.json();
    const metaUserId = customerData.metadata?.user_id ?? customerData.metadata?.userId;
    if (metaUserId) {
      await supabaseAdmin
        .from("user_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", metaUserId);
      return metaUserId;
    }

    if (customerData.email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("email", customerData.email)
        .maybeSingle();
      if (profileByEmail) {
        await supabaseAdmin
          .from("user_profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", profileByEmail.id);
        return profileByEmail.id;
      }
    }
  }

  return null;
}

// ── One-time payment handlers ─────────────────────────────────────────────────

async function handleOneTimeCheckoutCompleted(
  session: Record<string, unknown>,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const sessionId = session.id as string;
  const paymentIntentId = session.payment_intent as string | null;
  const amountTotal = session.amount_total as number | null;
  const currency = (session.currency as string) ?? "usd";

  // Update the pending order created by create-payment-checkout
  const updatePayload: Record<string, unknown> = {
    status: "paid",
    updated_at: new Date().toISOString(),
  };
  if (paymentIntentId) updatePayload.stripe_payment_intent_id = paymentIntentId;
  if (amountTotal !== null) updatePayload.amount_total = amountTotal;
  updatePayload.currency = currency;

  const { error } = await supabaseAdmin
    .from("orders")
    .update(updatePayload)
    .eq("stripe_session_id", sessionId);

  if (error) {
    console.error("checkout.session.completed (payment): update error", error);
    throw error;
  }
  console.log(`checkout.session.completed (payment): order paid for session ${sessionId}`);
}

async function handlePaymentIntentFailed(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const pi = data.object;
  const paymentIntentId = pi.id as string;

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "pending");

  if (error) {
    console.error("payment_intent.payment_failed: update error", error);
    throw error;
  }
  console.log(`payment_intent.payment_failed: marked order failed for PI ${paymentIntentId}`);
}

async function handleChargeRefunded(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const charge = data.object;
  const paymentIntentId = charge.payment_intent as string | null;

  if (!paymentIntentId) {
    console.log("charge.refunded: no payment_intent, skipping");
    return;
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error("charge.refunded: update error", error);
    throw error;
  }
  console.log(`charge.refunded: marked order refunded for PI ${paymentIntentId}`);
}

// ── Subscription handlers ─────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>,
  secretKey: string
) {
  const session = data.object;

  // Route to one-time payment handler if mode is "payment"
  if (session.mode === "payment") {
    await handleOneTimeCheckoutCompleted(session, supabaseAdmin);
    return;
  }

  if (session.mode !== "subscription") return;

  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;
  const metadata = session.metadata as Record<string, string> | null;
  const userId = metadata?.user_id;
  const planId = metadata?.plan_id;
  const billingCycle = metadata?.billing_cycle ?? "monthly";

  if (!userId || !planId) {
    console.error("checkout.session.completed: missing user_id or plan_id in metadata", { metadata });
    return;
  }

  const { data: tier } = await supabaseAdmin
    .from("subscription_tiers")
    .select("id, tier_name, display_name")
    .eq("id", planId)
    .maybeSingle();

  if (!tier) {
    console.error(`checkout.session.completed: tier not found for planId ${planId}`);
    return;
  }

  let nextBillingDate: string | null = null;
  let startDate: string = new Date().toISOString();

  if (stripeSubscriptionId) {
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (subRes.ok) {
      const subData = await subRes.json();
      nextBillingDate = new Date(subData.current_period_end * 1000).toISOString();
      if (subData.start_date) {
        startDate = new Date(subData.start_date * 1000).toISOString();
      } else if (subData.current_period_start) {
        startDate = new Date(subData.current_period_start * 1000).toISOString();
      }
    }
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        billing_cycle: billingCycle,
        status: "active",
        start_date: startDate,
        next_billing_date: nextBillingDate,
        cancelled_at: null,
        auto_renew: true,
        tier_id: tier.id,
        tier: tier.tier_name,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("checkout.session.completed: upsert error", upsertError);
    throw upsertError;
  }

  await supabaseAdmin
    .from("user_profiles")
    .update({
      subscription_tier: tier.tier_name,
      stripe_customer_id: stripeCustomerId,
    })
    .eq("id", userId);

  console.log(`checkout.session.completed: activated ${tier.display_name} for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>,
  secretKey: string
) {
  const invoice = data.object;
  const stripeCustomerId = invoice.customer as string;
  const stripeSubscriptionId = invoice.subscription as string | null;

  if (!stripeSubscriptionId) return;

  const userId = await resolveUserFromCustomer(stripeCustomerId, stripeSubscriptionId, supabaseAdmin, secretKey);
  if (!userId) {
    console.error(`invoice.payment_succeeded: no user found for customer ${stripeCustomerId}`);
    return;
  }

  const subRes = await fetch(
    `https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  let nextBillingDate: string | null = null;
  let planId: string | null = null;
  let billingCycle = "monthly";
  let startDate: string | null = null;

  if (subRes.ok) {
    const subData = await subRes.json();
    nextBillingDate = new Date(subData.current_period_end * 1000).toISOString();
    planId = subData.metadata?.plan_id ?? null;
    billingCycle = subData.metadata?.billing_cycle ?? "monthly";
    if (subData.start_date) {
      startDate = new Date(subData.start_date * 1000).toISOString();
    }
  }

  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: "active",
    auto_renew: true,
    next_billing_date: nextBillingDate,
    last_payment_date: now,
    payment_failed_count: 0,
    updated_at: now,
    cancelled_at: null,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    billing_cycle: billingCycle,
  };

  if (startDate) {
    updatePayload.start_date = startDate;
  }

  if (planId) {
    const { data: tier } = await supabaseAdmin
      .from("subscription_tiers")
      .select("id, tier_name")
      .eq("id", planId)
      .maybeSingle();

    if (tier) {
      updatePayload.tier_id = tier.id;
      updatePayload.tier = tier.tier_name;

      await supabaseAdmin
        .from("user_profiles")
        .update({ subscription_tier: tier.tier_name })
        .eq("id", userId);
    }
  }

  const { data: existingSub } = await supabaseAdmin
    .from("user_subscriptions")
    .select("id, tier_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingSub) {
    const freeTierId = await getFreeTierId(supabaseAdmin);
    const tierIdForInsert = (updatePayload.tier_id as string) ?? freeTierId;
    if (!tierIdForInsert) {
      console.error("invoice.payment_succeeded: cannot upsert — no tier_id available");
      return;
    }
    updatePayload.tier_id = tierIdForInsert;
  } else if (!updatePayload.tier_id) {
    updatePayload.tier_id = existingSub.tier_id;
  }

  await supabaseAdmin
    .from("user_subscriptions")
    .upsert({ user_id: userId, ...updatePayload }, { onConflict: "user_id" });

  const invoiceAmount = typeof invoice.amount_paid === "number" ? invoice.amount_paid / 100 : 0;
  const currency = (invoice.currency as string) ?? "usd";
  const invoiceId = invoice.id as string;

  const { data: existingBilling } = await supabaseAdmin
    .from("billing_history")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();

  if (!existingBilling) {
    const { data: subRow } = await supabaseAdmin
      .from("user_subscriptions")
      .select("subscription_tiers!tier_id(display_name), billing_cycle")
      .eq("user_id", userId)
      .maybeSingle();

    const tierInfo = subRow?.subscription_tiers as { display_name: string } | null;
    const billingHistoryCycle = subRow?.billing_cycle ?? billingCycle;

    await supabaseAdmin.from("billing_history").insert({
      user_id: userId,
      stripe_invoice_id: invoiceId,
      amount: invoiceAmount,
      currency,
      status: "paid",
      invoice_url: (invoice.hosted_invoice_url as string) ?? null,
      invoice_pdf: (invoice.invoice_pdf as string) ?? null,
      payment_date: startDate ?? now,
      plan_name: tierInfo?.display_name ?? null,
      billing_cycle: billingHistoryCycle,
    });
  }

  console.log(`invoice.payment_succeeded: recorded payment for user ${userId}`);
}

async function handleInvoicePaymentFailed(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>,
  secretKey: string
) {
  const invoice = data.object;
  const stripeCustomerId = invoice.customer as string;
  const stripeSubscriptionId = invoice.subscription as string | null;

  if (!stripeSubscriptionId) return;

  const userId = await resolveUserFromCustomer(stripeCustomerId, stripeSubscriptionId, supabaseAdmin, secretKey);
  if (!userId) return;

  const { data: subRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select("payment_failed_count")
    .eq("user_id", userId)
    .maybeSingle();

  const failedCount = (subRow?.payment_failed_count ?? 0) + 1;
  const now = new Date().toISOString();

  await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "past_due",
      payment_failed_count: failedCount,
      updated_at: now,
    })
    .eq("user_id", userId);

  console.log(`invoice.payment_failed: marked past_due for user ${userId}, attempt ${failedCount}`);
}

async function handleSubscriptionUpdated(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>,
  secretKey: string
) {
  const subscription = data.object;
  const stripeCustomerId = subscription.customer as string;
  const stripeSubscriptionId = subscription.id as string;
  const status = subscription.status as string;

  const userId = await resolveUserFromCustomer(stripeCustomerId, stripeSubscriptionId, supabaseAdmin, secretKey);
  if (!userId) return;

  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;
  const currentPeriodEnd = subscription.current_period_end as number;
  const nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();

  let mappedStatus = "active";
  if (status === "past_due") mappedStatus = "past_due";
  else if (status === "canceled" || status === "cancelled") mappedStatus = "cancelled";
  else if (status === "trialing") mappedStatus = "trial";
  else if (status === "unpaid" || status === "paused") mappedStatus = "past_due";

  const now = new Date().toISOString();

  await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: mappedStatus,
      auto_renew: !cancelAtPeriodEnd,
      next_billing_date: nextBillingDate,
      cancelled_at: cancelAtPeriodEnd ? now : null,
      updated_at: now,
    })
    .eq("user_id", userId);

  console.log(`customer.subscription.updated: status=${mappedStatus} for user ${userId}`);
}

async function handleSubscriptionDeleted(
  data: { object: Record<string, unknown> },
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const subscription = data.object;
  const stripeCustomerId = subscription.customer as string;

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!profile) {
    console.error(`customer.subscription.deleted: no user for customer ${stripeCustomerId}`);
    return;
  }

  const freeTierId = await getFreeTierId(supabaseAdmin);
  const now = new Date().toISOString();

  await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "cancelled",
      auto_renew: false,
      cancelled_at: now,
      tier_id: freeTierId,
      tier: "free",
      stripe_subscription_id: null,
      updated_at: now,
    })
    .eq("user_id", profile.id);

  await supabaseAdmin
    .from("user_profiles")
    .update({ subscription_tier: "free" })
    .eq("id", profile.id);

  console.log(`customer.subscription.deleted: downgraded to free for user ${profile.id}`);
}
