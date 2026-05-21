import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings } = await supabaseAdmin
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["stripe_environment", "stripe_test_secret_key", "stripe_live_secret_key"]);

    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.setting_key] = s.setting_value ?? "";

    const env = map["stripe_environment"] ?? "test";
    const secretKey = env === "production" ? map["stripe_live_secret_key"] : map["stripe_test_secret_key"];

    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Stripe secret key not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeBase = "https://api.stripe.com/v1";
    const stripeHeaders = {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const plans = [
      { tier_name: "paid", display_name: "Pro", monthly_price: 900, annual_price: 9900 },
      { tier_name: "premium", display_name: "Premium", monthly_price: 1999, annual_price: 19999 },
    ];

    const results: Record<string, unknown> = {};

    for (const plan of plans) {
      const productBody = new URLSearchParams();
      productBody.append("name", plan.display_name);
      productBody.append("metadata[tier_name]", plan.tier_name);

      const productRes = await fetch(`${stripeBase}/products`, {
        method: "POST",
        headers: stripeHeaders,
        body: productBody.toString(),
      });
      const product = await productRes.json();

      if (!product.id) {
        results[plan.tier_name] = { error: "product_creation_failed", detail: product };
        continue;
      }

      const monthlyBody = new URLSearchParams();
      monthlyBody.append("product", product.id);
      monthlyBody.append("unit_amount", String(plan.monthly_price));
      monthlyBody.append("currency", "usd");
      monthlyBody.append("recurring[interval]", "month");
      monthlyBody.append("nickname", `${plan.display_name} Monthly`);

      const monthlyRes = await fetch(`${stripeBase}/prices`, {
        method: "POST",
        headers: stripeHeaders,
        body: monthlyBody.toString(),
      });
      const monthlyPrice = await monthlyRes.json();

      const annualBody = new URLSearchParams();
      annualBody.append("product", product.id);
      annualBody.append("unit_amount", String(plan.annual_price));
      annualBody.append("currency", "usd");
      annualBody.append("recurring[interval]", "year");
      annualBody.append("nickname", `${plan.display_name} Annual`);

      const annualRes = await fetch(`${stripeBase}/prices`, {
        method: "POST",
        headers: stripeHeaders,
        body: annualBody.toString(),
      });
      const annualPrice = await annualRes.json();

      if (!monthlyPrice.id || !annualPrice.id) {
        results[plan.tier_name] = { error: "price_creation_failed", monthly: monthlyPrice, annual: annualPrice };
        continue;
      }

      const { error: dbError } = await supabaseAdmin
        .from("subscription_tiers")
        .update({
          stripe_price_id_monthly: monthlyPrice.id,
          stripe_price_id_annual: annualPrice.id,
        })
        .eq("tier_name", plan.tier_name);

      results[plan.tier_name] = {
        monthly: monthlyPrice.id,
        annual: annualPrice.id,
        db_error: dbError,
      };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
