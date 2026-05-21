import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { name, email, subject, message }: ContactFormRequest = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return jsonResponse({ success: false, message: "Name, email, and message are required." }, 400);
    }

    if (!email.includes("@")) {
      return jsonResponse({ success: false, message: "Please provide a valid email address." }, 400);
    }

    const smtpKeys = [
      "smtp_host", "smtp_port", "smtp_username", "smtp_password",
      "smtp_from_email", "smtp_from_name", "smtp_use_tls", "admin_email",
    ];

    const { data: smtpSettings, error: settingsError } = await serviceClient
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", smtpKeys);

    if (settingsError) {
      return jsonResponse({ success: false, message: "Failed to load email settings." }, 500);
    }

    const cfg: Record<string, string> = {};
    for (const row of smtpSettings || []) {
      cfg[row.setting_key] = row.setting_value;
    }

    if (!cfg.smtp_host || !cfg.smtp_port || !cfg.smtp_username || !cfg.smtp_password) {
      return jsonResponse({
        success: false,
        message: "Email service is not configured yet. Please try again later.",
      }, 503);
    }

    const port = parseInt(cfg.smtp_port, 10);
    const useSSL = port === 465;
    const fromName = cfg.smtp_from_name || "FinanceFlow";
    const fromEmail = cfg.smtp_from_email || cfg.smtp_username;
    const adminEmail = cfg.admin_email?.trim() || null;
    const displaySubject = subject || "General Inquiry";
    const sentAt = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port,
      secure: useSSL,
      auth: { user: cfg.smtp_username, pass: cfg.smtp_password },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });

    const adminHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">New Contact Form Submission</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Received via the FinanceFlow website</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;width:120px;">From</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${name} &lt;${email}&gt;</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Subject</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${displaySubject}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;">Received</td>
                  <td style="padding:8px 0;">${sentAt}</td>
                </tr>
              </table>
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
                <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap;">${message}</p>
              </div>
              <div style="margin-top:24px;padding:16px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
                <p style="margin:0;font-size:13px;color:#1d4ed8;">Reply directly to this email to respond to ${name}.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">FinanceFlow Contact System &mdash; ${sentAt}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const userHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">We've received your message</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Thank you for reaching out to FinanceFlow</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.7;">
                Thank you for contacting us. We've received your message and a member of our team will get back to you within 24 hours.
              </p>
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your Message Summary</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;">
                  <tr>
                    <td style="padding:6px 0;font-weight:600;width:80px;">Subject</td>
                    <td style="padding:6px 0;">${displaySubject}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-weight:600;vertical-align:top;">Message</td>
                    <td style="padding:6px 0;line-height:1.6;white-space:pre-wrap;">${message}</td>
                  </tr>
                </table>
              </div>
              <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.7;">
                In the meantime, you can browse our <a href="https://financeflow.app/help" style="color:#2563eb;text-decoration:none;font-weight:500;">Help Center</a> for quick answers to common questions.
              </p>
              <p style="margin:20px 0 0;font-size:14px;color:#475569;">
                Best regards,<br>
                <strong style="color:#1e293b;">The FinanceFlow Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const adminMailOptions: Record<string, unknown> = {
      from: `"${fromName}" <${fromEmail}>`,
      to: fromEmail,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact Form] ${displaySubject} — from ${name}`,
      html: adminHtml,
      text: `New contact form submission\n\nFrom: ${name} <${email}>\nSubject: ${displaySubject}\nReceived: ${sentAt}\n\nMessage:\n${message}`,
    };

    if (adminEmail && adminEmail !== fromEmail) {
      adminMailOptions.bcc = adminEmail;
    }

    await transporter.sendMail(adminMailOptions);

    EdgeRuntime.waitUntil(transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: `"${name}" <${email}>`,
      subject: `We received your message — FinanceFlow`,
      html: userHtml,
      text: `Hi ${name},\n\nThank you for contacting us. We've received your message and a member of our team will get back to you within 24 hours.\n\nYour message:\nSubject: ${displaySubject}\n${message}\n\nBest regards,\nThe FinanceFlow Team`,
    }));

    return jsonResponse({ success: true, message: "Message sent successfully." });
  } catch (error) {
    console.error("[send-contact-email] Error:", error);
    let message = "Failed to send message. Please try again later.";
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("authentication") || msg.includes("auth")) {
        message = "Email service authentication failed. Please try again later.";
      } else if (msg.includes("econnrefused") || msg.includes("connection refused")) {
        message = "Email service is unavailable. Please try again later.";
      } else if (msg.includes("timeout") || msg.includes("timed out")) {
        message = "Email service timed out. Please try again later.";
      }
    }
    return jsonResponse({ success: false, message }, 500);
  }
});
