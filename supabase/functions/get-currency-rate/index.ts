import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { fromCurrency, toCurrency } = await req.json();

    if (!fromCurrency || !toCurrency) {
      return jsonResponse({ success: false, message: "fromCurrency and toCurrency are required" }, 400);
    }

    const liveRate = await fetchLiveRate(fromCurrency, toCurrency);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settingsRows } = await serviceClient
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["openai_api_key", "openai_model"]);

    const settings: Record<string, string> = {};
    for (const row of settingsRows || []) {
      settings[row.setting_key] = row.setting_value;
    }

    const apiKey = settings["openai_api_key"];
    const model = settings["openai_model"] || "gpt-4o-mini";

    let aiRate: number | null = null;
    let aiSource = "OpenAI";

    if (apiKey && apiKey.startsWith("sk-")) {
      try {
        const prompt = `What is the current real-time exchange rate from ${fromCurrency} to ${toCurrency}? Respond with only a single numeric value (the rate), no text, no units, no explanation. Example: 124.2389`;

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "You are a financial data assistant. When asked for an exchange rate, respond with only the numeric rate value. No text, no symbols, no units.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 20,
            temperature: 0,
          }),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          const content = openaiData.choices?.[0]?.message?.content?.trim();
          if (content) {
            const parsed = parseFloat(content.replace(/[^0-9.]/g, ""));
            if (!isNaN(parsed) && parsed > 0) {
              aiRate = parsed;
            }
          }
        }
      } catch (err) {
        console.error("OpenAI error:", err);
      }
    }

    return jsonResponse({
      success: true,
      fromCurrency,
      toCurrency,
      liveRate,
      aiRate,
      aiSource,
    });
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse({ success: false, message: "Internal server error" }, 500);
  }
});

async function fetchLiveRate(from: string, to: string): Promise<number | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rates?.[to] ?? null;
  } catch {
    return null;
  }
}
