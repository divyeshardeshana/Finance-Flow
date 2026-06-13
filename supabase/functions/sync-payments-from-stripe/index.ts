import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.is_admin) throw new Error("Admin access required");

    const { data: settings } = await adminClient
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["stripe_environment", "stripe_test_secret_key", "stripe_live_secret_key"]);

    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.setting_key] = s.setting_value ?? "";

    const env = map["stripe_environment"] ?? "test";
    const secretKey =
      env === "production"
        ? map["stripe_live_secret_key"]
        : map["stripe_test_secret_key"];

    if (!secretKey || !secretKey.startsWith("sk_")) {
      throw new Error(
        "Stripe secret key not configured. Please save it in Admin → System Settings → Stripe."
      );
    }

    let hasMore = true;
    let startingAfter: string | null = null;
    let synced = 0;
    let skipped = 0;

    while (hasMore) {
      const url = new URL("https://api.stripe.com/v1/invoices");
      url.searchParams.set("limit", "100");
      url.searchParams.set("expand[]", "data.customer");
      if (startingAfter) url.searchParams.set("starting_after", startingAfter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${secretKey}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Stripe API error");
      }

      const page = await res.json();
      hasMore = page.has_more;

      for (const invoice of page.data ?? []) {
        startingAfter = invoice.id;
        if (invoice.status === "draft") continue;

        const customerEmail =
          typeof invoice.customer === "object" ? invoice.customer?.email : null;

        let userId: string | null = null;
        if (customerEmail) {
          const { data: up } = await adminClient
            .from("user_profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();
          userId = up?.id ?? null;
        }

        const { data: existing } = await adminClient
          .from("billing_history")
          .select("id")
          .eq("stripe_invoice_id", invoice.id)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const amount =
          typeof invoice.amount_paid === "number" ? invoice.amount_paid / 100 : 0;

        const status =
          invoice.status === "paid"
            ? "paid"
            : invoice.status === "void"
            ? "void"
            : invoice.status === "uncollectible"
            ? "uncollectible"
            : "open";

        await adminClient.from("billing_history").insert({
          user_id: userId,
          stripe_invoice_id: invoice.id,
          amount,
          currency: invoice.currency ?? "usd",
          status,
          description:
            invoice.description ||
            invoice.lines?.data?.[0]?.description ||
            null,
          invoice_url: invoice.hosted_invoice_url ?? null,
          invoice_pdf: invoice.invoice_pdf ?? null,
          payment_date: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : new Date(invoice.created * 1000).toISOString(),
          plan_name: invoice.lines?.data?.[0]?.description ?? null,
          billing_cycle: "monthly",
        });
        synced++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
