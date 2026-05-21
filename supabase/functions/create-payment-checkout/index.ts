// Edge function: creates a Stripe Checkout Session for one-time product purchases
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutItem {
  price_id: string;
  quantity: number;
  product_id?: string;
  unit_price_in_cents?: number;
}

interface RequestBody {
  items: CheckoutItem[];
  success_url: string;
  cancel_url: string;
}

async function getStripeSecretKey(
  supabaseAdmin: ReturnType<typeof createClient>
): Promise<string> {
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
    map[s.setting_key] = s.setting_value ?? "";
  }

  const env = map["stripe_environment"] ?? "test";
  const key =
    env === "production"
      ? map["stripe_live_secret_key"]
      : map["stripe_test_secret_key"];

  if (!key) {
    throw new Error(
      "Stripe is not configured. Please add Stripe keys in Admin → Settings."
    );
  }
  return key;
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

    // Authenticate the user via JWT
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

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { items, success_url, cancel_url } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "items must be a non-empty array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    for (const item of items) {
      if (!item.price_id || typeof item.price_id !== "string") {
        return new Response(
          JSON.stringify({ error: "Each item must have a valid price_id" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (!item.quantity || item.quantity < 1) {
        return new Response(
          JSON.stringify({ error: "Each item must have quantity >= 1" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "success_url and cancel_url are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripeSecretKey = await getStripeSecretKey(supabaseAdmin);

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .maybeSingle();

    let stripeCustomerId: string = profile?.stripe_customer_id ?? "";

    if (!stripeCustomerId) {
      const createRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: profile?.email ?? user.email ?? "",
          "metadata[user_id]": user.id,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(
          err.error?.message ?? "Failed to create Stripe customer"
        );
      }

      const customer = await createRes.json();
      stripeCustomerId = customer.id;

      await supabaseAdmin
        .from("user_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    // Build Stripe Checkout Session params (payment mode = one-time)
    const sessionParams = new URLSearchParams({
      mode: "payment",
      customer: stripeCustomerId,
      success_url,
      cancel_url,
      "metadata[user_id]": user.id,
    });

    items.forEach((item, idx) => {
      sessionParams.set(`line_items[${idx}][price]`, item.price_id);
      sessionParams.set(
        `line_items[${idx}][quantity]`,
        String(item.quantity)
      );
    });

    const sessionRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: sessionParams,
      }
    );

    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      throw new Error(
        err.error?.message ?? "Failed to create checkout session"
      );
    }

    const session = await sessionRes.json();

    // Create a pending order record in the database
    const amountTotal = items.reduce(
      (sum, item) => sum + (item.unit_price_in_cents ?? 0) * item.quantity,
      0
    );

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount_total: amountTotal,
        currency: "usd",
        status: "pending",
        metadata: { stripe_mode: "payment" },
      })
      .select("id")
      .single();

    if (!orderError && order) {
      const orderItemRows = items
        .filter(
          (item): item is CheckoutItem & { product_id: string } =>
            Boolean(item.product_id)
        )
        .map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_in_cents: item.unit_price_in_cents ?? 0,
        }));

      if (orderItemRows.length > 0) {
        await supabaseAdmin.from("order_items").insert(orderItemRows);
      }
    }

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-payment-checkout error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
