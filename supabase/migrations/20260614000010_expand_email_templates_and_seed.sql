-- 1. Expand email_templates CHECK constraint to include financial alert types
ALTER TABLE email_templates
  DROP CONSTRAINT IF EXISTS email_templates_alert_type_check;

ALTER TABLE email_templates
  ADD CONSTRAINT email_templates_alert_type_check CHECK (
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

-- 2. Seed financial alert email templates
INSERT INTO email_templates (alert_type, template_name, subject, body_html, footer, is_active, variables)
VALUES

-- Budget Threshold Exceeded
(
  'budget_threshold_exceeded',
  'Budget Threshold Alert',
  '⚠️ Budget Alert: {{budgetName}} has reached {{thresholdPct}}%',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0 0;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #c2410c;">⚠️ Budget Threshold Reached</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Your <strong>{{budgetName}}</strong> budget has reached <strong>{{thresholdPct}}%</strong> of its limit.
    </p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Budget Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{budgetName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Current Spend</td><td style="padding: 8px 0; color: #ef4444; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{currentSpend}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Budget Limit</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{budgetLimit}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Usage</td><td style="padding: 8px 0; color: #f59e0b; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{thresholdPct}}%</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Consider reviewing your spending in this category to stay within budget.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Budget Details</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because budget alerts are enabled for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{budgetName}}', '{{thresholdPct}}', '{{currentSpend}}', '{{budgetLimit}}', '{{currency}}']
),

-- Large Transaction Detected
(
  'large_transaction_detected',
  'Large Transaction Alert',
  '🔔 Large Transaction Detected: {{transactionAmount}} {{currency}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0 0;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #dc2626;">🔔 Large Transaction Detected</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      A transaction of <strong>{{transactionAmount}} {{currency}}</strong> — above your {{thresholdAmount}} {{currency}} alert threshold — has been recorded on your account.
    </p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Description</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{transactionDescription}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Amount</td><td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{transactionAmount}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{transactionDate}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Your Threshold</td><td style="padding: 8px 0; color: #6b7280; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{thresholdAmount}} {{currency}}</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">If you did not make this transaction, please contact support immediately.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Transaction</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because large transaction alerts are enabled for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{transactionAmount}}', '{{currency}}', '{{transactionDate}}', '{{transactionDescription}}', '{{thresholdAmount}}']
),

-- Bill Due Reminder
(
  'bill_due_reminder',
  'Bill Due Reminder',
  '📅 Reminder: {{billName}} is due in {{daysUntilDue}} day(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0 0;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1d4ed8;">📅 Upcoming Bill Reminder</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      This is a reminder that <strong>{{billName}}</strong> is due in <strong>{{daysUntilDue}} day(s)</strong>.
    </p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Bill Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{billName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Amount Due</td><td style="padding: 8px 0; color: #1d4ed8; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{billAmount}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Due Date</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{dueDate}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Days Remaining</td><td style="padding: 8px 0; color: #f59e0b; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{daysUntilDue}} days</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Make sure to arrange payment before the due date to avoid late fees.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Bill Reminders</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because bill reminders are enabled for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{billName}}', '{{billAmount}}', '{{currency}}', '{{dueDate}}', '{{daysUntilDue}}']
),

-- Monthly Summary Report
(
  'monthly_summary_report',
  'Monthly Financial Summary',
  '📊 Your {{reportMonth}} Financial Summary is Ready',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Monthly Financial Summary — {{reportMonth}}</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Here is your financial summary for <strong>{{reportMonth}}</strong>.</p>
    <div style="display: grid; gap: 12px; margin: 24px 0;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div><p style="margin: 0; color: #15803d; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Income</p></div>
        <p style="margin: 0; color: #15803d; font-size: 20px; font-weight: 700;">{{totalIncome}} {{currency}}</p>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div><p style="margin: 0; color: #dc2626; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Expenses</p></div>
        <p style="margin: 0; color: #dc2626; font-size: 20px; font-weight: 700;">{{totalExpenses}} {{currency}}</p>
      </div>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div><p style="margin: 0; color: #1d4ed8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Net Savings</p></div>
        <p style="margin: 0; color: #1d4ed8; font-size: 20px; font-weight: 700;">{{netSavings}} {{currency}}</p>
      </div>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">Top Spending Category</p>
      <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">{{topCategory}}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Full Report</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Monthly summaries are sent at the start of each month. Manage alerts in your profile.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{reportMonth}}', '{{totalIncome}}', '{{totalExpenses}}', '{{netSavings}}', '{{currency}}', '{{topCategory}}']
),

-- Weekly Spending Digest
(
  'weekly_spending_digest',
  'Weekly Spending Digest',
  '📈 Your Weekly Spending Digest: {{weekStart}} – {{weekEnd}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Weekly Digest: {{weekStart}} – {{weekEnd}}</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Here is your spending snapshot for the week of <strong>{{weekStart}}</strong> to <strong>{{weekEnd}}</strong>.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Spent</td><td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: 700; text-align: right;">{{totalSpend}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Transactions</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{transactionCount}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Top Category</td><td style="padding: 8px 0; color: #1d4ed8; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{topCategory}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Transactions</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Weekly digests are sent every Monday. Manage alerts in your profile.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{weekStart}}', '{{weekEnd}}', '{{totalSpend}}', '{{currency}}', '{{topCategory}}', '{{transactionCount}}']
),

-- Savings Goal Milestone
(
  'savings_goal_milestone',
  'Savings Goal Milestone',
  '🎉 Congratulations! {{goalName}} reached {{milestonePct}}%',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">🎉 Savings Milestone Achieved!</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #15803d;">{{milestonePct}}% Complete!</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Fantastic progress! Your savings goal <strong>{{goalName}}</strong> has reached <strong>{{milestonePct}}%</strong> of its target. Keep it up!
    </p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Goal</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{goalName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Saved So Far</td><td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{currentAmount}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Target Amount</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{targetAmount}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Progress</td><td style="padding: 8px 0; color: #059669; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{milestonePct}}%</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #059669, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Savings Goals</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because savings goal notifications are enabled for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{goalName}}', '{{milestonePct}}', '{{currentAmount}}', '{{targetAmount}}', '{{currency}}']
),

-- Low Balance Warning
(
  'low_balance_warning',
  'Low Balance Warning',
  '⚠️ Low Balance Alert: Your balance is {{currentBalance}} {{currency}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #c2410c;">⚠️ Low Balance Warning</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Your account balance has fallen below your configured alert threshold.
    </p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Current Balance</td><td style="padding: 8px 0; color: #c2410c; font-size: 20px; font-weight: 700; text-align: right;">{{currentBalance}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Your Alert Threshold</td><td style="padding: 8px 0; color: #6b7280; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{thresholdAmount}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">As of</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{balanceDate}}</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Review your recent transactions and consider topping up your account to avoid declined payments.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Transactions</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because low balance alerts are enabled for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{currentBalance}}', '{{thresholdAmount}}', '{{currency}}', '{{balanceDate}}']
),

-- Unusual Spending Pattern
(
  'unusual_spending_pattern',
  'Unusual Spending Pattern Alert',
  '📊 Unusual Spending Detected in {{category}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Smart Finance Management</p>
  </div>
  <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0 0;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #dc2626;">📊 Unusual Spending Detected</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      We noticed that your spending in <strong>{{category}}</strong> during <strong>{{periodLabel}}</strong> is significantly higher than usual.
    </p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Category</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{category}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Current Spend</td><td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{currentSpend}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Your Average</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{averageSpend}} {{currency}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Increase</td><td style="padding: 8px 0; color: #f59e0b; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">+{{percentageIncrease}}%</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Period</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{periodLabel}}</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">Review your spending to ensure everything looks correct. If this is intentional, no action is needed.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Spending Report</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. You are receiving this because unusual spending alerts are enabled for your account.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{category}}', '{{currentSpend}}', '{{averageSpend}}', '{{percentageIncrease}}', '{{currency}}', '{{periodLabel}}']
)

ON CONFLICT DO NOTHING;

-- 3. Also seed core transactional templates with FinanceFlow branding
INSERT INTO email_templates (alert_type, template_name, subject, body_html, footer, is_active, variables)
VALUES

-- Welcome Email
(
  'welcome_email',
  'Welcome to FinanceFlow',
  '🎉 Welcome to FinanceFlow, {{userName}}!',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 40px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700;">Welcome to FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 0; font-size: 16px;">Your smart finance journey starts now</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 40px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}}, 👋</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Welcome to FinanceFlow! We are thrilled to have you on board. Your account is ready and you can start managing your finances smarter today.
    </p>
    <div style="margin: 32px 0;">
      <div style="border-left: 3px solid #3b82f6; padding: 12px 16px; margin: 12px 0; background: #f8fafc;"><p style="margin: 0; color: #374151; font-size: 14px;"><strong>📊 Track Transactions</strong> — Record and categorize all your income and expenses</p></div>
      <div style="border-left: 3px solid #06b6d4; padding: 12px 16px; margin: 12px 0; background: #f8fafc;"><p style="margin: 0; color: #374151; font-size: 14px;"><strong>💰 Set Budgets</strong> — Create budgets and get alerts when you are near limits</p></div>
      <div style="border-left: 3px solid #10b981; padding: 12px 16px; margin: 12px 0; background: #f8fafc;"><p style="margin: 0; color: #374151; font-size: 14px;"><strong>🎯 Savings Goals</strong> — Set targets and track your progress automatically</p></div>
      <div style="border-left: 3px solid #8b5cf6; padding: 12px 16px; margin: 12px 0; background: #f8fafc;"><p style="margin: 0; color: #374151; font-size: 14px;"><strong>🤖 AI Insights</strong> — Get personalized recommendations from our AI assistant</p></div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{loginUrl}}" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Get Started →</a>
    </div>
    <p style="color: #6b7280; font-size: 13px; text-align: center;">Questions? Reply to this email — we are always happy to help.</p>
  </div>
</div>',
  '© 2025 FinanceFlow. All rights reserved.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{loginUrl}}']
),

-- Subscription Upgrade
(
  'subscription_upgrade',
  'Subscription Upgraded',
  '🚀 Your FinanceFlow plan has been upgraded to {{newPlan}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Plan Upgrade Confirmation</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #15803d;">🚀 Plan Upgraded Successfully!</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your FinanceFlow subscription has been upgraded. You now have access to all premium features.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Previous Plan</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; text-decoration: line-through;">{{oldPlan}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">New Plan</td><td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{newPlan}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Effective Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{effectiveDate}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Amount Billed</td><td style="padding: 8px 0; color: #1d4ed8; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">{{billingAmount}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Explore Premium Features</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Thank you for upgrading your plan.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{oldPlan}}', '{{newPlan}}', '{{effectiveDate}}', '{{billingAmount}}']
),

-- Payment Confirmation
(
  'payment_confirmation',
  'Payment Confirmation',
  '✅ Payment Confirmed — {{planName}} ({{paymentDate}})',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FinanceFlow</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Payment Receipt</p>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0 0; text-align: center;">
    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #15803d;">✅ Payment Successful</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 32px 24px;">
    <p style="color: #374151; font-size: 16px;">Hi {{userName}},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your payment has been processed successfully. Here are your receipt details:</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">{{planName}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Amount</td><td style="padding: 8px 0; color: #15803d; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{{amount}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Payment Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{paymentDate}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Transaction ID</td><td style="padding: 8px 0; color: #6b7280; font-size: 12px; font-family: monospace; text-align: right; border-top: 1px solid #f3f4f6;">{{transactionId}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Next Billing Date</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #f3f4f6;">{{nextBillingDate}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: linear-gradient(135deg, #1e40af, #0891b2); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Billing History</a>
    </div>
  </div>
</div>',
  '© 2025 FinanceFlow. Keep this email as your payment receipt.',
  true,
  ARRAY['{{userName}}', '{{userEmail}}', '{{amount}}', '{{planName}}', '{{paymentDate}}', '{{transactionId}}', '{{nextBillingDate}}']
)

ON CONFLICT DO NOTHING;
