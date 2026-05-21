import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TicketNotificationRequest {
  event_type: "ticket_created" | "ticket_updated";
  ticket_id: string;
  ticket_subject: string;
  ticket_category: string;
  ticket_priority: string;
  ticket_description?: string;
  ticket_status?: string;
  user_email: string;
  user_name: string;
  admin_message?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function capitalise(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : s;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TicketNotificationRequest = await req.json();
    const {
      event_type,
      ticket_id,
      ticket_subject,
      ticket_category,
      ticket_priority,
      ticket_description,
      ticket_status,
      user_email,
      user_name,
      admin_message,
    } = payload;

    if (!event_type || !ticket_id || !user_email) {
      return jsonResponse({ success: false, message: "Missing required fields." }, 400);
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
        message: "Email service is not configured.",
      }, 503);
    }

    const port = parseInt(cfg.smtp_port, 10);
    const useSSL = port === 465;
    const fromName = cfg.smtp_from_name || "FinanceFlow";
    const fromEmail = cfg.smtp_from_email || cfg.smtp_username;
    const adminEmail = cfg.admin_email?.trim() || null;
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

    if (event_type === "ticket_created") {
      const adminHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">New Support Ticket</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">A user has submitted a new support request</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;margin-bottom:24px;">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;width:120px;">Ticket ID</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-family:monospace;">${ticket_id}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">From</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${user_name} &lt;${user_email}&gt;</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Subject</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${ticket_subject}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Category</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${capitalise(ticket_category)}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">Priority</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${capitalise(ticket_priority)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600;">Received</td><td style="padding:8px 0;">${sentAt}</td></tr>
            </table>
            ${ticket_description ? `<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;"><p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Description</p><p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap;">${ticket_description}</p></div>` : ""}
            <div style="margin-top:24px;padding:16px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
              <p style="margin:0;font-size:13px;color:#1d4ed8;">Log in to the admin panel to view and respond to this ticket.</p>
            </div>
          </td>
        </tr>
        <tr><td style="padding:0 40px 32px;"><p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">FinanceFlow Support System &mdash; ${sentAt}</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const userHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Your ticket has been received</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">We'll get back to you within 24 hours</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">Hi <strong>${user_name}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.7;">Thank you for contacting us. We've received your support ticket and our team will get back to you within 24 hours.</p>
            <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ticket Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;">
                <tr><td style="padding:6px 0;font-weight:600;width:90px;">Subject</td><td style="padding:6px 0;">${ticket_subject}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Category</td><td style="padding:6px 0;">${capitalise(ticket_category)}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Priority</td><td style="padding:6px 0;">${capitalise(ticket_priority)}</td></tr>
                ${ticket_description ? `<tr><td style="padding:6px 0;font-weight:600;vertical-align:top;">Description</td><td style="padding:6px 0;line-height:1.6;white-space:pre-wrap;">${ticket_description}</td></tr>` : ""}
              </table>
            </div>
            <p style="margin:20px 0 0;font-size:14px;color:#475569;">Best regards,<br><strong style="color:#1e293b;">The FinanceFlow Support Team</strong></p>
          </td>
        </tr>
        <tr><td style="padding:0 40px 32px;"><p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">This is an automated confirmation. Please do not reply to this email.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const adminRecipient = adminEmail || fromEmail;
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: adminRecipient,
        replyTo: `"${user_name}" <${user_email}>`,
        subject: `[New Ticket] ${ticket_subject} — from ${user_name}`,
        html: adminHtml,
        text: `New support ticket submitted\n\nFrom: ${user_name} <${user_email}>\nSubject: ${ticket_subject}\nCategory: ${capitalise(ticket_category)}\nPriority: ${capitalise(ticket_priority)}\n\n${ticket_description || ""}`,
      });

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: `"${user_name}" <${user_email}>`,
        subject: `We received your support request — FinanceFlow`,
        html: userHtml,
        text: `Hi ${user_name},\n\nYour support ticket has been received.\n\nSubject: ${ticket_subject}\nCategory: ${capitalise(ticket_category)}\nPriority: ${capitalise(ticket_priority)}\n\nWe'll get back to you within 24 hours.\n\nBest regards,\nThe FinanceFlow Support Team`,
      });

    } else if (event_type === "ticket_updated") {
      const statusLabel = ticket_status ? capitalise(ticket_status) : "Updated";

      const userHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Your ticket has been updated</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Our support team has responded to your request</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">Hi <strong>${user_name}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.7;">Your support ticket has been updated by our team.</p>
            <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Ticket Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;">
                <tr><td style="padding:6px 0;font-weight:600;width:90px;">Subject</td><td style="padding:6px 0;">${ticket_subject}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Status</td><td style="padding:6px 0;"><span style="display:inline-block;padding:2px 10px;background-color:#dbeafe;color:#1d4ed8;border-radius:20px;font-size:12px;font-weight:600;">${statusLabel}</span></td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Updated</td><td style="padding:6px 0;">${sentAt}</td></tr>
              </table>
            </div>
            ${admin_message ? `<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;"><p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Response from Support Team</p><p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap;">${admin_message}</p></div>` : ""}
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;">Log in to your account to view the full conversation and reply.</p>
            <p style="margin:20px 0 0;font-size:14px;color:#475569;">Best regards,<br><strong style="color:#1e293b;">The FinanceFlow Support Team</strong></p>
          </td>
        </tr>
        <tr><td style="padding:0 40px 32px;"><p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">This is an automated notification. Please log in to reply.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: `"${user_name}" <${user_email}>`,
        subject: `Your support ticket has been updated — FinanceFlow`,
        html: userHtml,
        text: `Hi ${user_name},\n\nYour support ticket "${ticket_subject}" has been updated.\nStatus: ${statusLabel}\n\n${admin_message ? `Response from support team:\n${admin_message}\n\n` : ""}Log in to your account to view the full conversation.\n\nBest regards,\nThe FinanceFlow Support Team`,
      });
    }

    return jsonResponse({ success: true, message: "Notification sent." });
  } catch (error) {
    console.error("[send-ticket-notification] Error:", error);
    let message = "Failed to send notification.";
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("authentication") || msg.includes("auth")) {
        message = "Email service authentication failed.";
      } else if (msg.includes("econnrefused") || msg.includes("connection refused")) {
        message = "Email service is unavailable.";
      } else if (msg.includes("timeout") || msg.includes("timed out")) {
        message = "Email service timed out.";
      }
    }
    return jsonResponse({ success: false, message }, 500);
  }
});
