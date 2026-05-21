import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("is_admin, admin_role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.is_admin === true || (profile?.admin_role != null && profile?.admin_role !== "");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let secretKeyFromBody: string | null = null;
    try {
      const body = await req.json();
      secretKeyFromBody = body?.secretKey ?? null;
    } catch {
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["stripe_environment", "stripe_test_secret_key", "stripe_live_secret_key"]);

    if (settingsError) {
      console.error("Failed to load system_settings:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to load Stripe settings from database." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.setting_key] = s.setting_value ?? "";

    const env = map["stripe_environment"] ?? "test";
    const dbKey = env === "production" ? map["stripe_live_secret_key"] : map["stripe_test_secret_key"];
    const secretKey = (secretKeyFromBody ?? dbKey ?? "").trim();

    if (!secretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No Stripe ${env} secret key configured. Please enter your ${env === "production" ? "sk_live_..." : "sk_test_..."} key in the field above and save it, then click Test Connection.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!secretKey.startsWith("sk_")) {
      const expectedPrefix = env === "production" ? "sk_live_" : "sk_test_";
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid key format. Expected a secret key starting with "${expectedPrefix}". The saved value does not look like a Stripe secret key.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (env === "production" && secretKey.startsWith("sk_test_")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Mode mismatch: Environment is set to Production but a Test key (sk_test_...) is configured. Switch environment to Test mode or replace the key with sk_live_...",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (env === "test" && secretKey.startsWith("sk_live_")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Mode mismatch: Environment is set to Test but a Live key (sk_live_...) is configured. Switch environment to Production or replace the key with sk_test_...",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountRes = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const accountData = await accountRes.json();

    if (!accountRes.ok) {
      const stripeError = accountData?.error;
      let message = stripeError?.message ?? "Stripe API returned an error.";

      if (stripeError?.type === "authentication_error") {
        message = `Authentication failed — the key is invalid or has been revoked. Stripe says: "${stripeError.message}"`;
      } else if (stripeError?.code === "api_key_expired") {
        message = "The Stripe API key has expired. Please generate a new key in your Stripe Dashboard.";
      }

      return new Response(
        JSON.stringify({ success: false, error: message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        accountId: accountData.id,
        businessName:
          accountData.business_profile?.name ??
          accountData.display_name ??
          accountData.email ??
          "Stripe Account",
        environment: env,
        livemode: accountData.livemode,
        chargesEnabled: accountData.charges_enabled,
        payoutsEnabled: accountData.payouts_enabled,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("test-stripe-connection error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
