-- Fix email_templates table schema to match EmailManagement component expectations
-- and seed all 24 alert type templates with content

-- 1. Add missing columns if not exist
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS alert_type text;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS template_name text;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS sender_email text NOT NULL DEFAULT '';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS body_html text NOT NULL DEFAULT '';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS footer text NOT NULL DEFAULT '';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Drop old check constraint if exists
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_alert_type_check;

-- 3. Add check constraint with all 24 alert types
ALTER TABLE email_templates ADD CONSTRAINT email_templates_alert_type_check CHECK (
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
    'custom_alert',
    'budget_threshold_exceeded',
    'large_transaction_detected',
    'bill_due_reminder',
    'monthly_summary_report',
    'weekly_spending_digest',
    'savings_goal_milestone',
    'low_balance_warning',
    'unusual_spending_pattern'
  )
);

-- 4. Delete existing templates to re-seed cleanly
DELETE FROM email_templates;

-- 5. Seed all 24 templates
INSERT INTO email_templates (alert_type, template_name, name, sender_email, subject, body_html, html_body, footer, is_active, variables) VALUES

(
  'welcome_email',
  'Welcome Email',
  'welcome_email',
  '',
  'Welcome to FinanceFlow AI, {{userName}}!',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Welcome to FinanceFlow AI!</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">We''re thrilled to have you on board. Your journey to smarter financial management starts now.</p><p style="margin-bottom:8px;font-weight:600;">Here''s what you can do right away:</p><ul style="padding-left:20px;margin-bottom:16px;"><li style="margin-bottom:8px;">Set up your budget and track expenses</li><li style="margin-bottom:8px;">Connect your financial goals</li><li style="margin-bottom:8px;">Explore our AI-powered financial assistant</li><li style="margin-bottom:8px;">Monitor your investments and net worth</li></ul><a href="{{loginUrl}}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:16px;">Get Started</a><p style="margin-top:16px;">If you have any questions, our support team is always here to help.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | You are receiving this email because you registered an account. © 2026 FinanceFlow AI. All rights reserved.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{loginUrl}}"]'::jsonb
),

(
  'user_registration',
  'User Registration (Admin)',
  'user_registration',
  '',
  'New user registered: {{userName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">New User Registration</h1><p style="margin-bottom:12px;">A new user has registered on FinanceFlow AI.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Name</td><td style="padding:8px;border:1px solid #334155;">{{userName}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Email</td><td style="padding:8px;border:1px solid #334155;">{{userEmail}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Registration Date</td><td style="padding:8px;border:1px solid #334155;">{{registrationDate}}</td></tr></table><a href="{{loginUrl}}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Admin Panel</a><p style="margin-top:16px;">Best regards,<br><strong>FinanceFlow AI System</strong></p></div>',
  '',
  'FinanceFlow AI | Admin notification for new user registration.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{registrationDate}}", "{{loginUrl}}"]'::jsonb
),

(
  'password_reset',
  'Password Reset',
  'password_reset',
  '',
  'Reset your FinanceFlow AI password',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Password Reset Request</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">We received a request to reset your password for your FinanceFlow AI account.</p><p style="margin-bottom:16px;">Click the button below to reset your password. This link expires in 24 hours.</p><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:16px;">Reset My Password</a><p style="margin-bottom:12px;color:#94a3b8;font-size:14px;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | You are receiving this because a password reset was requested for your account.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{resetUrl}}", "{{expiresAt}}"]'::jsonb
),

(
  'subscription_upgrade',
  'Subscription Upgraded',
  'subscription_upgrade',
  '',
  'Your FinanceFlow AI plan has been upgraded!',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#10b981;font-size:24px;margin-bottom:16px;">Plan Upgraded Successfully!</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Great news! Your FinanceFlow AI subscription has been successfully upgraded.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Previous Plan</td><td style="padding:8px;border:1px solid #334155;">{{oldPlan}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">New Plan</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{newPlan}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Effective Date</td><td style="padding:8px;border:1px solid #334155;">{{effectiveDate}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Billing Amount</td><td style="padding:8px;border:1px solid #334155;">{{billingAmount}}</td></tr></table><p style="margin-bottom:16px;">You now have access to all premium features. Start exploring your new capabilities today!</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Manage your subscription in your account settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{oldPlan}}", "{{newPlan}}", "{{effectiveDate}}", "{{billingAmount}}"]'::jsonb
),

(
  'subscription_downgrade',
  'Subscription Downgraded',
  'subscription_downgrade',
  '',
  'Your FinanceFlow AI plan has been changed',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#f59e0b;font-size:24px;margin-bottom:16px;">Plan Changed</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Your FinanceFlow AI subscription has been changed.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Previous Plan</td><td style="padding:8px;border:1px solid #334155;">{{oldPlan}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">New Plan</td><td style="padding:8px;border:1px solid #334155;">{{newPlan}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Effective Date</td><td style="padding:8px;border:1px solid #334155;">{{effectiveDate}}</td></tr></table><p style="margin-bottom:12px;">Some features may no longer be available. You can upgrade at any time from your account settings.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Manage your subscription in your account settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{oldPlan}}", "{{newPlan}}", "{{effectiveDate}}"]'::jsonb
),

(
  'payment_confirmation',
  'Payment Confirmation',
  'payment_confirmation',
  '',
  'Payment confirmed — FinanceFlow AI subscription',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#10b981;font-size:24px;margin-bottom:16px;">Payment Confirmed</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">We have successfully processed your payment for FinanceFlow AI.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Amount</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{amount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Plan</td><td style="padding:8px;border:1px solid #334155;">{{planName}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Payment Date</td><td style="padding:8px;border:1px solid #334155;">{{paymentDate}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Transaction ID</td><td style="padding:8px;border:1px solid #334155;">{{transactionId}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Next Billing Date</td><td style="padding:8px;border:1px solid #334155;">{{nextBillingDate}}</td></tr></table><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Keep this email as your receipt. Manage billing in your account settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{amount}}", "{{planName}}", "{{paymentDate}}", "{{transactionId}}", "{{nextBillingDate}}"]'::jsonb
),

(
  'payment_failed',
  'Payment Failed',
  'payment_failed',
  '',
  'Action required: Payment failed for your FinanceFlow AI subscription',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#ef4444;font-size:24px;margin-bottom:16px;">Payment Failed</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">We were unable to process your payment for FinanceFlow AI. Your subscription may be at risk of being paused.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Amount Due</td><td style="padding:8px;border:1px solid #334155;color:#ef4444;">{{amount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Failed Date</td><td style="padding:8px;border:1px solid #334155;">{{failedDate}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Reason</td><td style="padding:8px;border:1px solid #334155;">{{failureReason}}</td></tr></table><a href="{{billingUrl}}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:16px;">Update Payment Method</a><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Please update your payment method to continue your subscription.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{amount}}", "{{failedDate}}", "{{failureReason}}", "{{billingUrl}}"]'::jsonb
),

(
  'account_deactivation',
  'Account Deactivation',
  'account_deactivation',
  '',
  'Your FinanceFlow AI account has been deactivated',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#ef4444;font-size:24px;margin-bottom:16px;">Account Deactivated</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Your FinanceFlow AI account has been deactivated on {{deactivationDate}}.</p><p style="margin-bottom:12px;"><strong>Reason:</strong> {{reason}}</p><p style="margin-bottom:16px;">If you believe this is an error or wish to appeal, please contact our support team.</p><a href="mailto:{{supportEmail}}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:16px;">Contact Support</a><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Contact support if you have questions about your account.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{deactivationDate}}", "{{reason}}", "{{supportEmail}}"]'::jsonb
),

(
  'support_ticket_creation',
  'Support Ticket Created',
  'support_ticket_creation',
  '',
  'Support ticket #{{ticketId}} received — {{ticketSubject}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">We''ve Received Your Request</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Thank you for contacting FinanceFlow AI support. We have received your ticket and our team will get back to you within 24 hours on business days.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Ticket ID</td><td style="padding:8px;border:1px solid #334155;">#{{ticketId}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Subject</td><td style="padding:8px;border:1px solid #334155;">{{ticketSubject}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Priority</td><td style="padding:8px;border:1px solid #334155;">{{ticketPriority}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Status</td><td style="padding:8px;border:1px solid #334155;color:#10b981;">Open</td></tr></table><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Support Team</strong></p></div>',
  '',
  'FinanceFlow AI Support | This is an automated confirmation of your support request.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{ticketId}}", "{{ticketSubject}}", "{{ticketPriority}}"]'::jsonb
),

(
  'support_ticket_reply',
  'Support Ticket Reply',
  'support_ticket_reply',
  '',
  'New reply on ticket #{{ticketId}} — {{ticketSubject}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">New Reply on Your Support Ticket</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Our support team has replied to your ticket <strong>#{{ticketId}}: {{ticketSubject}}</strong>.</p><div style="border-left:4px solid #2563eb;padding:12px 16px;margin:16px 0;background:#1e293b;border-radius:0 8px 8px 0;"><p style="margin:0;font-style:italic;">{{replyContent}}</p><p style="margin:8px 0 0;font-size:12px;color:#64748b;">— {{agentName}}</p></div><p style="margin-bottom:16px;">Log in to view the full conversation and reply.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Support Team</strong></p></div>',
  '',
  'FinanceFlow AI Support | Reply to this email or log in to continue the conversation.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{ticketId}}", "{{ticketSubject}}", "{{replyContent}}", "{{agentName}}"]'::jsonb
),

(
  'ticket_status_update',
  'Ticket Status Update',
  'ticket_status_update',
  '',
  'Ticket #{{ticketId}} status updated: {{newStatus}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Ticket Status Updated</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">The status of your support ticket has been updated.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Ticket ID</td><td style="padding:8px;border:1px solid #334155;">#{{ticketId}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Subject</td><td style="padding:8px;border:1px solid #334155;">{{ticketSubject}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Previous Status</td><td style="padding:8px;border:1px solid #334155;">{{oldStatus}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">New Status</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{newStatus}}</td></tr></table><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Support Team</strong></p></div>',
  '',
  'FinanceFlow AI Support | Ticket status notification.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{ticketId}}", "{{ticketSubject}}", "{{oldStatus}}", "{{newStatus}}"]'::jsonb
),

(
  'member_invited',
  'Member Invited',
  'member_invited',
  '',
  'You''ve been invited to join {{teamName}} on FinanceFlow AI',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">You''re Invited!</h1><p style="margin-bottom:12px;">Hi {{inviteeName}},</p><p style="margin-bottom:12px;"><strong>{{inviterName}}</strong> has invited you to join <strong>{{teamName}}</strong> on FinanceFlow AI.</p><p style="margin-bottom:16px;color:#94a3b8;font-size:14px;">This invitation expires on {{expiresAt}}.</p><a href="{{inviteUrl}}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:16px;">Accept Invitation</a><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | You received this because you were invited to join a team.',
  true,
  '["{{inviteeName}}", "{{inviterName}}", "{{inviteUrl}}", "{{teamName}}", "{{expiresAt}}"]'::jsonb
),

(
  'member_removed',
  'Member Removed',
  'member_removed',
  '',
  'You have been removed from {{teamName}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#f59e0b;font-size:24px;margin-bottom:16px;">Team Membership Update</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">You have been removed from <strong>{{teamName}}</strong> by {{removedBy}}.</p><p style="margin-bottom:12px;">Your personal account and data remain unaffected. If you believe this was a mistake, please contact your team administrator.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Team membership notification.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{teamName}}", "{{removedBy}}"]'::jsonb
),

(
  'generation_complete',
  'Generation Complete',
  'generation_complete',
  '',
  'Your {{generationType}} is ready on FinanceFlow AI',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#10b981;font-size:24px;margin-bottom:16px;">Your Report is Ready!</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Your <strong>{{generationType}}</strong> has been generated and is ready to view.</p><a href="{{resultUrl}}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:16px;">View Report</a><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Your generated content is available in your account.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{generationType}}", "{{resultUrl}}"]'::jsonb
),

(
  'newsletter',
  'Newsletter',
  'newsletter',
  '',
  '{{newsletterTitle}} — FinanceFlow AI',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">{{newsletterTitle}}</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:16px;">Here is your latest update from FinanceFlow AI. We''ve been working hard to bring you new features and insights to help you manage your finances better.</p><p style="color:#64748b;font-size:13px;margin-top:24px;">You are receiving this because you are subscribed to FinanceFlow AI updates. <a href="{{unsubscribeUrl}}" style="color:#3b82f6;">Unsubscribe</a></p></div>',
  '',
  'FinanceFlow AI | © 2026 FinanceFlow AI. All rights reserved.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{unsubscribeUrl}}", "{{newsletterTitle}}"]'::jsonb
),

(
  'custom_alert',
  'Custom Alert',
  'custom_alert',
  '',
  'Important notification from FinanceFlow AI',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Notification</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">{{customVariable1}}</p><p style="margin-bottom:12px;">{{customVariable2}}</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | © 2026 FinanceFlow AI. All rights reserved.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{customVariable1}}", "{{customVariable2}}"]'::jsonb
),

(
  'budget_threshold_exceeded',
  'Budget Threshold Exceeded',
  'budget_threshold_exceeded',
  '',
  'Alert: You''ve reached {{thresholdPct}}% of your {{budgetName}} budget',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#f59e0b;font-size:24px;margin-bottom:16px;">Budget Threshold Alert</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">You''ve reached <strong>{{thresholdPct}}%</strong> of your <strong>{{budgetName}}</strong> budget for this period.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Budget</td><td style="padding:8px;border:1px solid #334155;">{{budgetName}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Current Spend</td><td style="padding:8px;border:1px solid #334155;color:#f59e0b;">{{currency}}{{currentSpend}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Budget Limit</td><td style="padding:8px;border:1px solid #334155;">{{currency}}{{budgetLimit}}</td></tr></table><p style="margin-bottom:12px;">Review your spending to stay within budget for the rest of the period.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Budget alert notification. Manage alerts in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{budgetName}}", "{{thresholdPct}}", "{{currentSpend}}", "{{budgetLimit}}", "{{currency}}"]'::jsonb
),

(
  'large_transaction_detected',
  'Large Transaction Detected',
  'large_transaction_detected',
  '',
  'Large transaction detected: {{currency}}{{transactionAmount}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#ef4444;font-size:24px;margin-bottom:16px;">Large Transaction Alert</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">A large transaction has been recorded on your FinanceFlow AI account that exceeds your alert threshold of {{currency}}{{thresholdAmount}}.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Amount</td><td style="padding:8px;border:1px solid #334155;color:#ef4444;font-weight:600;">{{currency}}{{transactionAmount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Description</td><td style="padding:8px;border:1px solid #334155;">{{transactionDescription}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Date</td><td style="padding:8px;border:1px solid #334155;">{{transactionDate}}</td></tr></table><p style="margin-bottom:12px;">If this was not you, please review your account immediately.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Transaction alert notification. Manage alerts in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{transactionAmount}}", "{{currency}}", "{{transactionDate}}", "{{transactionDescription}}", "{{thresholdAmount}}"]'::jsonb
),

(
  'bill_due_reminder',
  'Bill Due Reminder',
  'bill_due_reminder',
  '',
  'Reminder: {{billName}} is due in {{daysUntilDue}} days',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Bill Due Reminder</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">This is a reminder that <strong>{{billName}}</strong> is due in <strong>{{daysUntilDue}} days</strong>.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Bill</td><td style="padding:8px;border:1px solid #334155;">{{billName}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Amount</td><td style="padding:8px;border:1px solid #334155;">{{currency}}{{billAmount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Due Date</td><td style="padding:8px;border:1px solid #334155;color:#f59e0b;font-weight:600;">{{dueDate}}</td></tr></table><p style="margin-bottom:12px;">Make sure you have sufficient funds to cover this payment.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Bill reminder notification. Manage reminders in your Bill Reminders section.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{billName}}", "{{billAmount}}", "{{currency}}", "{{dueDate}}", "{{daysUntilDue}}"]'::jsonb
),

(
  'monthly_summary_report',
  'Monthly Summary Report',
  'monthly_summary_report',
  '',
  'Your {{reportMonth}} Financial Summary — FinanceFlow AI',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Monthly Financial Summary</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Here is your financial summary for <strong>{{reportMonth}}</strong>.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Total Income</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{currency}}{{totalIncome}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Total Expenses</td><td style="padding:8px;border:1px solid #334155;color:#ef4444;">{{currency}}{{totalExpenses}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Net Savings</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{currency}}{{netSavings}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Top Spending Category</td><td style="padding:8px;border:1px solid #334155;">{{topCategory}}</td></tr></table><p style="margin-bottom:12px;">Log in to FinanceFlow AI for detailed reports and insights.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Monthly report. Manage report preferences in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{reportMonth}}", "{{totalIncome}}", "{{totalExpenses}}", "{{netSavings}}", "{{currency}}", "{{topCategory}}"]'::jsonb
),

(
  'weekly_spending_digest',
  'Weekly Spending Digest',
  'weekly_spending_digest',
  '',
  'Your weekly spending digest: {{weekStart}} – {{weekEnd}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#3b82f6;font-size:24px;margin-bottom:16px;">Weekly Spending Digest</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Here''s your spending summary for the week of <strong>{{weekStart}} – {{weekEnd}}</strong>.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Total Spent</td><td style="padding:8px;border:1px solid #334155;color:#f59e0b;font-weight:600;">{{currency}}{{totalSpend}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Transactions</td><td style="padding:8px;border:1px solid #334155;">{{transactionCount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Top Category</td><td style="padding:8px;border:1px solid #334155;">{{topCategory}}</td></tr></table><p style="margin-bottom:12px;">Log in to FinanceFlow AI for a full breakdown of your weekly spending.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Weekly digest. Manage digest preferences in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{weekStart}}", "{{weekEnd}}", "{{totalSpend}}", "{{currency}}", "{{topCategory}}", "{{transactionCount}}"]'::jsonb
),

(
  'savings_goal_milestone',
  'Savings Goal Milestone',
  'savings_goal_milestone',
  '',
  'Milestone reached: {{milestonePct}}% of your {{goalName}} goal!',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#10b981;font-size:24px;margin-bottom:16px;">Savings Goal Milestone!</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Congratulations! You''ve reached <strong>{{milestonePct}}%</strong> of your <strong>{{goalName}}</strong> savings goal!</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Goal</td><td style="padding:8px;border:1px solid #334155;">{{goalName}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Current Amount</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{currency}}{{currentAmount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Target Amount</td><td style="padding:8px;border:1px solid #334155;">{{currency}}{{targetAmount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Progress</td><td style="padding:8px;border:1px solid #334155;color:#10b981;font-weight:600;">{{milestonePct}}%</td></tr></table><p style="margin-bottom:12px;">Keep it up — you''re making great progress!</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Savings goal milestone notification.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{goalName}}", "{{milestonePct}}", "{{currentAmount}}", "{{targetAmount}}", "{{currency}}"]'::jsonb
),

(
  'low_balance_warning',
  'Low Balance Warning',
  'low_balance_warning',
  '',
  'Warning: Your account balance is low — {{currency}}{{currentBalance}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#ef4444;font-size:24px;margin-bottom:16px;">Low Balance Warning</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">Your net balance has fallen below your configured alert threshold.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Current Balance</td><td style="padding:8px;border:1px solid #334155;color:#ef4444;font-weight:600;">{{currency}}{{currentBalance}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Alert Threshold</td><td style="padding:8px;border:1px solid #334155;">{{currency}}{{thresholdAmount}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">As of</td><td style="padding:8px;border:1px solid #334155;">{{balanceDate}}</td></tr></table><p style="margin-bottom:12px;">Consider reviewing your upcoming expenses and income to maintain a healthy balance.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Balance alert notification. Manage alerts in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{currentBalance}}", "{{thresholdAmount}}", "{{currency}}", "{{balanceDate}}"]'::jsonb
),

(
  'unusual_spending_pattern',
  'Unusual Spending Pattern',
  'unusual_spending_pattern',
  '',
  'Alert: Unusual spending detected in {{category}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#e2e8f0;padding:32px;border-radius:12px;"><h1 style="color:#f59e0b;font-size:24px;margin-bottom:16px;">Unusual Spending Pattern Detected</h1><p style="margin-bottom:12px;">Hi {{userName}},</p><p style="margin-bottom:12px;">We''ve noticed an unusual spike in your <strong>{{category}}</strong> spending compared to your historical average.</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Category</td><td style="padding:8px;border:1px solid #334155;">{{category}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Current Spend</td><td style="padding:8px;border:1px solid #334155;color:#f59e0b;font-weight:600;">{{currency}}{{currentSpend}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Avg Spend</td><td style="padding:8px;border:1px solid #334155;">{{currency}}{{averageSpend}}</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Increase</td><td style="padding:8px;border:1px solid #334155;color:#ef4444;font-weight:600;">+{{percentageIncrease}}%</td></tr><tr><td style="padding:8px;border:1px solid #334155;font-weight:600;background:#1e293b;">Period</td><td style="padding:8px;border:1px solid #334155;">{{periodLabel}}</td></tr></table><p style="margin-bottom:12px;">Log in to review your transactions and ensure everything is accurate.</p><p style="margin-top:16px;">Best regards,<br><strong>The FinanceFlow AI Team</strong></p></div>',
  '',
  'FinanceFlow AI | Spending pattern alert. Manage alerts in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{category}}", "{{currentSpend}}", "{{averageSpend}}", "{{percentageIncrease}}", "{{currency}}", "{{periodLabel}}"]'::jsonb
);
