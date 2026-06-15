-- Seed remaining 13 email templates (all alert types not covered in 20260614000010)

INSERT INTO email_templates (alert_type, template_name, subject, body_html, footer, is_active, variables)
VALUES

-- User Registration
(
  'user_registration',
  'Account Created',
  '✅ Your FinanceFlow account has been created',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your FinanceFlow account has been successfully created. You are ready to start tracking your finances smarter.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">Registered Email</p>
      <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">{{userEmail}}</p>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">If you did not create this account, please contact our support team immediately.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{loginUrl}}" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Sign In to FinanceFlow</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. All rights reserved.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{loginUrl}}']
),

-- Password Reset
(
  'password_reset',
  'Password Reset Request',
  '🔐 Reset your FinanceFlow password',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">We received a request to reset your FinanceFlow password. Click the button below to choose a new password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{resetUrl}}" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Reset My Password</a>
    </div>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #dc2626; font-size: 13px;">This link expires in <strong>{{expiresIn}}</strong>. If you did not request a password reset, ignore this email — your password will not change.</p>
    </div>
    <p style="color: #374151; font-size: 13px;">If the button above does not work, copy and paste this link: <span style="color: #1d4ed8;">{{resetUrl}}</span></p>
  </div>
</div>',
  '© 2025 FinanceFlow. This email was sent because a password reset was requested for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{resetUrl}}', '{{expiresIn}}']
),

-- Subscription Downgrade
(
  'subscription_downgrade',
  'Subscription Downgraded',
  '📋 Your FinanceFlow plan has changed to {{newPlan}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Plan Change Notification</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your FinanceFlow subscription has been updated. Here are the details of your plan change.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Previous Plan</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{oldPlan}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">New Plan</td><td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{newPlan}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Effective Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{effectiveDate}}</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Some premium features may no longer be available. You can upgrade your plan at any time from your account settings.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Available Plans</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You can upgrade your plan at any time.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{oldPlan}}', '{{newPlan}}', '{{effectiveDate}}']
),

-- Payment Failed
(
  'payment_failed',
  'Payment Failed',
  '❌ Payment failed for your FinanceFlow subscription',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Payment Notification</p>
  </div>
  <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #dc2626;">❌ Payment Unsuccessful</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">We were unable to process your payment for your FinanceFlow {{planName}} subscription.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{planName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Amount</td><td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{amount}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Attempted On</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{attemptDate}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Reason</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{failureReason}}</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Please update your payment method to avoid service interruption. We will retry the payment in {{retryDays}} days.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: #dc2626; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Update Payment Method</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Please update your payment details to maintain your subscription.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{planName}}', '{{amount}}', '{{attemptDate}}', '{{failureReason}}', '{{retryDays}}']
),

-- Account Deactivation
(
  'account_deactivation',
  'Account Deactivated',
  '⚠️ Your FinanceFlow account has been deactivated',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #374151 0%, #1f2937 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Account Notification</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your FinanceFlow account has been deactivated. You will no longer have access to your account or financial data.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">Deactivated On</p>
      <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">{{deactivationDate}}</p>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px;">Reason</p>
      <p style="margin: 4px 0 0; color: #374151; font-size: 14px;">{{reason}}</p>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">If you believe this is a mistake or would like to reactivate your account, please contact our support team.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:support@financeflow.com" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Contact Support</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Contact support if you have questions about your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{deactivationDate}}', '{{reason}}']
),

-- Support Ticket Creation
(
  'support_ticket_creation',
  'Support Ticket Created',
  '🎫 Support Ticket #{{ticketId}} has been created',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow Support</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">We have received your request</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0 0;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #15803d;">✅ Ticket Submitted Successfully</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">We have received your support request and will get back to you as soon as possible.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ticket ID</td><td style="padding: 8px 0; color: #1d4ed8; font-size: 14px; font-weight: 700; text-align: right;">#{{ticketId}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Subject</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{ticketSubject}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Priority</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{ticketPriority}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Submitted On</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{submittedDate}}</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Our support team typically responds within 24 hours on business days. You will receive an email notification when we reply.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View My Ticket</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow Support. Reply to this email or visit the support portal to update your ticket.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{ticketId}}', '{{ticketSubject}}', '{{ticketPriority}}', '{{submittedDate}}']
),

-- Support Ticket Reply
(
  'support_ticket_reply',
  'Support Ticket Reply',
  '💬 New reply on Ticket #{{ticketId}}: {{ticketSubject}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow Support</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Ticket #{{ticketId}}</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>{{replierName}}</strong> has replied to your support ticket.</p>
    <div style="background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">{{replierName}} replied:</p>
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">{{replyContent}}</p>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">Ticket Subject</p>
      <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">{{ticketSubject}}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View &amp; Reply</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow Support. Reply directly to this email or click the button above to respond.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{ticketId}}', '{{ticketSubject}}', '{{replierName}}', '{{replyContent}}']
),

-- Ticket Status Update
(
  'ticket_status_update',
  'Ticket Status Updated',
  '📋 Ticket #{{ticketId}} status changed to {{newStatus}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow Support</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Ticket Status Update</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">The status of your support ticket has been updated.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ticket ID</td><td style="padding: 8px 0; color: #1d4ed8; font-size: 14px; font-weight: 700; text-align: right;">#{{ticketId}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Subject</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{ticketSubject}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Previous Status</td><td style="padding: 8px 0; color: #6b7280; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6; text-decoration: line-through;">{{oldStatus}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">New Status</td><td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{newStatus}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Updated On</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{updatedDate}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Ticket</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow Support. Thank you for using FinanceFlow.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{ticketId}}', '{{ticketSubject}}', '{{oldStatus}}', '{{newStatus}}', '{{updatedDate}}']
),

-- Member Invited
(
  'member_invited',
  'Team Member Invitation',
  '👥 You have been invited to join {{workspaceName}} on FinanceFlow',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Team Invitation</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{inviteeName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>{{inviterName}}</strong> has invited you to join <strong>{{workspaceName}}</strong> on FinanceFlow as a <strong>{{role}}</strong>.</p>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #1d4ed8; font-size: 14px;">FinanceFlow helps teams track shared finances, manage budgets, and collaborate on financial goals.</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{inviteUrl}}" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Accept Invitation</a>
    </div>
    <p style="color: #6b7280; font-size: 13px; text-align: center;">This invitation expires in {{expiresIn}}. If you did not expect this invitation, you can safely ignore this email.</p>
  </div>
</div>',
  '© 2025 FinanceFlow. You received this because someone invited you to their workspace.',
  true,
  ARRAY['{{inviteeName}}', '{{inviterName}}', '{{workspaceName}}', '{{role}}', '{{inviteUrl}}', '{{expiresIn}}']
),

-- Member Removed
(
  'member_removed',
  'Removed from Workspace',
  '📋 You have been removed from {{workspaceName}} on FinanceFlow',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Workspace Notification</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">You have been removed from the workspace <strong>{{workspaceName}}</strong> on FinanceFlow. You will no longer have access to shared financial data in this workspace.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">Workspace</p>
      <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">{{workspaceName}}</p>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Removed On</p>
      <p style="margin: 4px 0 0; color: #374151; font-size: 14px;">{{removedDate}}</p>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Your personal FinanceFlow account and data remain intact. Only shared workspace access has been removed.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to My Account</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Your personal account and data are not affected.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{workspaceName}}', '{{removedDate}}']
),

-- Generation Complete (AI Report)
(
  'generation_complete',
  'AI Report Ready',
  '🤖 Your FinanceFlow AI report is ready',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">AI Financial Analysis</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #15803d;">🤖 Your AI Report is Ready!</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your FinanceFlow AI has finished analyzing your financial data. Your personalized <strong>{{reportType}}</strong> is ready to view.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">Report Type</p>
      <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">{{reportType}}</p>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Period Covered</p>
      <p style="margin: 4px 0 0; color: #374151; font-size: 14px;">{{reportPeriod}}</p>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Generated On</p>
      <p style="margin: 4px 0 0; color: #374151; font-size: 14px;">{{generatedDate}}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View My AI Report</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow AI. Powered by advanced financial analysis.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{reportType}}', '{{reportPeriod}}', '{{generatedDate}}']
),

-- Newsletter
(
  'newsletter',
  'FinanceFlow Newsletter',
  '📰 {{newsletterTitle}} — FinanceFlow Monthly Update',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Monthly Newsletter — {{issueDate}}</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 16px;">{{newsletterTitle}}</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Here is what is new in FinanceFlow this month.</p>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
      <div style="white-space: pre-line; color: #374151; font-size: 14px; line-height: 1.8;">{{newsletterContent}}</div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Open FinanceFlow</a>
    </div>
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Don&apos;t want to receive newsletters? <a href="{{unsubscribeUrl}}" style="color: #6b7280;">Unsubscribe here</a></p>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because you subscribed to FinanceFlow updates.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{newsletterTitle}}', '{{newsletterContent}}', '{{issueDate}}', '{{unsubscribeUrl}}']
),

-- Custom Alert
(
  'custom_alert',
  'Custom Alert',
  '🔔 {{alertTitle}} — FinanceFlow Alert',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Custom Alert</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <h2 style="color: #111827; font-size: 18px; font-weight: 700; margin: 16px 0;">{{alertTitle}}</h2>
    <div style="background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">{{alertMessage}}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View in FinanceFlow</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this custom alert because it was configured for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{alertTitle}}', '{{alertMessage}}']
)

ON CONFLICT DO NOTHING;
