/*
  # Email Templates System

  ## Summary
  Creates a comprehensive email template management system allowing admins to
  configure and customize all transactional and notification emails sent by the platform.

  ## New Tables

  ### `email_templates`
  Stores admin-configured email templates for every alert type in the system.
  - `id` - UUID primary key
  - `alert_type` - Enum-like text for the category of email (e.g., 'password_reset', 'welcome_email')
  - `template_name` - Human-readable name for the template
  - `sender_email` - Optional override sender email (falls back to SMTP config default)
  - `subject` - Email subject line (supports dynamic variables like {{userName}})
  - `body_html` - Rich HTML body content (supports dynamic variables)
  - `footer` - Optional footer text (company info, unsubscribe link)
  - `is_active` - Whether this template is currently active
  - `variables` - JSONB array of available dynamic variables for this alert type
  - `created_at` / `updated_at` - Timestamps

  ## Security
  - RLS enabled
  - Only authenticated admins (is_admin = true) can insert/update/delete
  - Authenticated users and service role can read active templates (needed for sending)
*/

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  template_name text NOT NULL,
  sender_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  footer text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  variables jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_templates_alert_type_check CHECK (
    alert_type IN (
      'support_ticket_creation',
      'support_ticket_reply',
      'ticket_status_update',
      'generation_complete',
      'member_invited',
      'member_removed',
      'user_registration',
      'password_reset',
      'subscription_upgrade',
      'subscription_downgrade',
      'payment_confirmation',
      'payment_failed',
      'account_deactivation',
      'welcome_email',
      'newsletter',
      'custom_alert'
    )
  )
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_email_templates_updated_at();

INSERT INTO email_templates (alert_type, template_name, subject, body_html, footer, is_active, variables) VALUES
(
  'welcome_email',
  'Welcome Email',
  'Welcome to FinanceFlow AI, {{userName}}!',
  '<h1>Welcome to FinanceFlow AI!</h1><p>Hi {{userName}},</p><p>We''re thrilled to have you on board. Your journey to smarter financial management starts now.</p><p>Here''s what you can do right away:</p><ul><li>Set up your budget and track expenses</li><li>Connect your financial goals</li><li>Explore our AI-powered financial assistant</li></ul><p>If you have any questions, our support team is always here to help.</p><p>Best regards,<br>The FinanceFlow AI Team</p>',
  'FinanceFlow AI | You are receiving this email because you registered an account. © 2025 FinanceFlow AI. All rights reserved.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{loginUrl}}"]'::jsonb
),
(
  'password_reset',
  'Password Reset',
  'Reset your FinanceFlow AI password',
  '<h1>Password Reset Request</h1><p>Hi {{userName}},</p><p>We received a request to reset your password for your FinanceFlow AI account.</p><p>Click the link below to reset your password. This link expires in 24 hours.</p><p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset My Password</a></p><p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p><p>Best regards,<br>The FinanceFlow AI Team</p>',
  'FinanceFlow AI | You are receiving this because a password reset was requested for your account.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{resetUrl}}", "{{expiresAt}}"]'::jsonb
),
(
  'support_ticket_creation',
  'Support Ticket Created',
  'Support ticket #{{ticketId}} received — {{ticketSubject}}',
  '<h1>We''ve received your support request</h1><p>Hi {{userName}},</p><p>Thank you for contacting FinanceFlow AI support. We have received your ticket and our team will get back to you shortly.</p><p><strong>Ticket Details:</strong></p><ul><li><strong>Ticket ID:</strong> #{{ticketId}}</li><li><strong>Subject:</strong> {{ticketSubject}}</li><li><strong>Priority:</strong> {{ticketPriority}}</li><li><strong>Status:</strong> Open</li></ul><p>We typically respond within 24 hours on business days.</p><p>Best regards,<br>The FinanceFlow AI Support Team</p>',
  'FinanceFlow AI Support | This is an automated confirmation of your support request.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{ticketId}}", "{{ticketSubject}}", "{{ticketPriority}}"]'::jsonb
),
(
  'support_ticket_reply',
  'Support Ticket Reply',
  'New reply on ticket #{{ticketId}} — {{ticketSubject}}',
  '<h1>New reply on your support ticket</h1><p>Hi {{userName}},</p><p>Our support team has replied to your ticket <strong>#{{ticketId}}: {{ticketSubject}}</strong>.</p><blockquote style="border-left:4px solid #2563eb;padding:12px 16px;margin:16px 0;background:#f0f4ff;border-radius:0 8px 8px 0;">{{replyContent}}</blockquote><p>You can view the full conversation and reply by logging in to your account.</p><p>Best regards,<br>The FinanceFlow AI Support Team</p>',
  'FinanceFlow AI Support | Reply to this email or log in to continue the conversation.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{ticketId}}", "{{ticketSubject}}", "{{replyContent}}", "{{agentName}}"]'::jsonb
),
(
  'subscription_upgrade',
  'Subscription Upgraded',
  'Your FinanceFlow AI plan has been upgraded!',
  '<h1>Welcome to {{newPlan}}!</h1><p>Hi {{userName}},</p><p>Great news! Your FinanceFlow AI subscription has been successfully upgraded.</p><p><strong>Upgrade Details:</strong></p><ul><li><strong>Previous Plan:</strong> {{oldPlan}}</li><li><strong>New Plan:</strong> {{newPlan}}</li><li><strong>Effective Date:</strong> {{effectiveDate}}</li></ul><p>You now have access to all premium features. Start exploring your new capabilities today!</p><p>Best regards,<br>The FinanceFlow AI Team</p>',
  'FinanceFlow AI | Manage your subscription in your account settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{oldPlan}}", "{{newPlan}}", "{{effectiveDate}}", "{{billingAmount}}"]'::jsonb
),
(
  'payment_confirmation',
  'Payment Confirmation',
  'Payment confirmed — FinanceFlow AI subscription',
  '<h1>Payment Confirmed</h1><p>Hi {{userName}},</p><p>We have successfully processed your payment for FinanceFlow AI.</p><p><strong>Payment Details:</strong></p><ul><li><strong>Amount:</strong> {{amount}}</li><li><strong>Plan:</strong> {{planName}}</li><li><strong>Date:</strong> {{paymentDate}}</li><li><strong>Transaction ID:</strong> {{transactionId}}</li></ul><p>Your subscription is active and your next billing date is <strong>{{nextBillingDate}}</strong>.</p><p>Best regards,<br>The FinanceFlow AI Team</p>',
  'FinanceFlow AI | Keep this email as your receipt. Manage billing in your account settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{amount}}", "{{planName}}", "{{paymentDate}}", "{{transactionId}}", "{{nextBillingDate}}"]'::jsonb
),
(
  'payment_failed',
  'Payment Failed',
  'Action required: Payment failed for your FinanceFlow AI subscription',
  '<h1>Payment Failed</h1><p>Hi {{userName}},</p><p>We were unable to process your payment for FinanceFlow AI. Your subscription may be at risk of being paused.</p><p><strong>Details:</strong></p><ul><li><strong>Amount Due:</strong> {{amount}}</li><li><strong>Failed Date:</strong> {{failedDate}}</li><li><strong>Reason:</strong> {{failureReason}}</li></ul><p>Please update your payment method as soon as possible to avoid service interruption.</p><p><a href="{{billingUrl}}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Update Payment Method</a></p><p>Best regards,<br>The FinanceFlow AI Team</p>',
  'FinanceFlow AI | Please update your payment method to continue your subscription.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{amount}}", "{{failedDate}}", "{{failureReason}}", "{{billingUrl}}"]'::jsonb
)
ON CONFLICT DO NOTHING;
