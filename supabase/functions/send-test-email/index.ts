import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendTestEmailRequest {
  recipientEmail: string;
}

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
    console.log("[send-test-email] Function invoked");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Authentication failed" }, 401);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await serviceClient
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return jsonResponse({ error: "Admin privileges required" }, 403);
    }

    const { recipientEmail }: SendTestEmailRequest = await req.json();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return jsonResponse({
        success: false,
        message: "Please provide a valid recipient email address.",
      });
    }

    const smtpKeys = [
      "smtp_host",
      "smtp_port",
      "smtp_username",
      "smtp_password",
      "smtp_from_email",
      "smtp_from_name",
      "smtp_use_tls",
    ];

    const { data: smtpSettings, error: settingsError } = await serviceClient
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", smtpKeys);

    if (settingsError) {
      return jsonResponse({
        success: false,
        message: "Failed to load SMTP settings from database.",
      });
    }

    const cfg: Record<string, string> = {};
    for (const row of smtpSettings || []) {
      cfg[row.setting_key] = row.setting_value;
    }

    if (
      !cfg.smtp_host ||
      !cfg.smtp_port ||
      !cfg.smtp_username ||
      !cfg.smtp_password
    ) {
      const missing = [];
      if (!cfg.smtp_host) missing.push("SMTP Host");
      if (!cfg.smtp_port) missing.push("SMTP Port");
      if (!cfg.smtp_username) missing.push("SMTP Username");
      if (!cfg.smtp_password) missing.push("SMTP Password");
      return jsonResponse({
        success: false,
        message: `Missing SMTP configuration: ${missing.join(", ")}. Please configure these in the Email settings tab.`,
      });
    }

    const port = parseInt(cfg.smtp_port, 10);
    const useSSL = port === 465;
    const fromName = cfg.smtp_from_name || "FinanceApp";
    const fromEmail = cfg.smtp_from_email || cfg.smtp_username;
    const sentAt = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const subject = `Test Email from ${fromName} - SMTP Configuration Verified`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Email Configuration Test</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your SMTP settings are working correctly</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">Connection Successful</p>
                <p style="margin:4px 0 0;color:#15803d;font-size:13px;">This email confirms that your SMTP configuration is working.</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;width:120px;">Provider</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${cfg.smtp_host}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Port</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${port} (${useSSL ? "SSL/TLS" : "STARTTLS"})</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">From</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${fromName} &lt;${fromEmail}&gt;</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;">Sent At</td>
                  <td style="padding:8px 0;">${sentAt}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                This is an automated test email. No action is required.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textBody = `Test Email from ${fromName}\n\nThis email confirms that your SMTP configuration is working correctly.\n\nProvider: ${cfg.smtp_host}\nPort: ${port} (${useSSL ? "SSL/TLS" : "STARTTLS"})\nFrom: ${fromName} <${fromEmail}>\nSent At: ${sentAt}\n\nThis is an automated test email. No action is required.`;

    console.log(
      `[send-test-email] Sending via ${cfg.smtp_host}:${port} to ${recipientEmail}`
    );

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port,
      secure: useSSL,
      auth: {
        user: cfg.smtp_username,
        pass: cfg.smtp_password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log("[send-test-email] Email sent successfully");

    return jsonResponse({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
    });
  } catch (error) {
    console.error("[send-test-email] Error:", error);

    let message = "Failed to send test email.";
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("invalid login") ||
        msg.includes("authentication") ||
        msg.includes("auth")
      ) {
        message =
          "SMTP authentication failed. Please verify your username and password.";
      } else if (
        msg.includes("econnrefused") ||
        msg.includes("connection refused")
      ) {
        message =
          "Could not connect to the SMTP server. Please verify the host and port.";
      } else if (msg.includes("timeout") || msg.includes("timed out")) {
        message =
          "Connection timed out. The SMTP server may be unreachable or the port may be blocked.";
      } else if (msg.includes("self signed") || msg.includes("certificate")) {
        message =
          "TLS certificate error. The SMTP server certificate could not be verified.";
      } else if (msg.includes("enotfound") || msg.includes("getaddrinfo")) {
        message =
          "SMTP host not found. Please check the hostname is correct.";
      } else {
        message = `SMTP error: ${error.message}`;
      }
    }

    return jsonResponse({ success: false, message });
  }
});
