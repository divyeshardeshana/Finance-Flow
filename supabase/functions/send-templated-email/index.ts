import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

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

function replacePlaceholders(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value || "");
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { alert_type, recipient_email, recipient_name, variables = {} } = await req.json();

    if (!alert_type || !recipient_email) {
      return jsonResponse({ success: false, message: "Missing required fields: alert_type and recipient_email." }, 400);
    }

    const smtpKeys = [
      "smtp_host", "smtp_port", "smtp_username", "smtp_password",
      "smtp_from_email", "smtp_from_name", "smtp_use_tls",
    ];

    const { data: smtpRows } = await serviceClient
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", smtpKeys);

    const cfg: Record<string, string> = {};
    for (const row of smtpRows || []) cfg[row.setting_key] = row.setting_value;

    if (!cfg.smtp_host || !cfg.smtp_port || !cfg.smtp_username || !cfg.smtp_password) {
      return jsonResponse({ success: false, message: "SMTP is not configured." }, 503);
    }

    const { data: templateData } = await serviceClient
      .from("email_templates")
      .select("*")
      .eq("alert_type", alert_type)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!templateData) {
      return jsonResponse({ success: false, message: `No active template found for alert_type: ${alert_type}` }, 404);
    }

    const mergedVars: Record<string, string> = {
      userName: recipient_name || "",
      userEmail: recipient_email,
      ...variables,
    };

    const subject = replacePlaceholders(templateData.subject, mergedVars);
    const bodyHtml = replacePlaceholders(templateData.body_html, mergedVars);
    const footer = templateData.footer ? replacePlaceholders(templateData.footer, mergedVars) : "";

    const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">FinanceFlow AI</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;color:#1e293b;font-size:14px;line-height:1.8;">
            ${bodyHtml}
          </td>
        </tr>
        ${footer ? `<tr><td style="padding:16px 40px 28px;border-top:1px solid #f1f5f9;"><p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">${footer}</p></td></tr>` : ""}
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const port = parseInt(cfg.smtp_port, 10);
    const fromEmail = templateData.sender_email?.trim() || cfg.smtp_from_email || cfg.smtp_username;
    const fromName = cfg.smtp_from_name || "FinanceFlow AI";

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port,
      secure: port === 465,
      auth: { user: cfg.smtp_username, pass: cfg.smtp_password },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient_name ? `"${recipient_name}" <${recipient_email}>` : recipient_email,
      subject,
      html: fullHtml,
      text: bodyHtml.replace(/<[^>]*>/g, "").replace(/\n{3,}/g, "\n\n").trim(),
    });

    return jsonResponse({ success: true, message: "Email sent successfully.", template: templateData.template_name });
  } catch (error) {
    console.error("[send-templated-email] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email.";
    return jsonResponse({ success: false, message }, 500);
  }
});
