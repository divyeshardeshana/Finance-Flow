/*
  # Add User-Facing Email Alert Notification Templates

  ## Summary
  Extends the email_templates system to support the 8 user-facing email alert
  types that correspond to the alert preferences configurable in the user Profile
  page (Email Alerts tab).

  ## Changes

  ### Modified Tables
  - `email_templates` — drops old CHECK constraint on alert_type and replaces it
    with an expanded constraint that includes 8 new alert types. Also inserts
    default templates for each new type.

  ## New Alert Types
  1. budget_threshold_exceeded  — spending reaches configured % of a budget
  2. large_transaction_detected — single transaction exceeds threshold amount
  3. bill_due_reminder          — bill is approaching its due date
  4. monthly_summary_report     — monthly income/spending/savings breakdown
  5. weekly_spending_digest     — weekly snapshot of spending patterns
  6. savings_goal_milestone     — savings goal reaches 25/50/75/100%
  7. low_balance_warning        — net balance falls below threshold
  8. unusual_spending_pattern   — spending in a category spikes vs average

  ## Security
  - No RLS changes required; existing policies already cover all rows in this table.

  ## Notes
  - All new templates are seeded as active with sensible default subject lines
    and body HTML using the dynamic variable placeholders.
  - The CHECK constraint is updated non-destructively: existing data is preserved.
*/

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

INSERT INTO email_templates (alert_type, template_name, sender_email, subject, body_html, footer, is_active, variables) VALUES

(
  'budget_threshold_exceeded',
  'Budget Threshold Exceeded',
  '',
  'Heads up: Your {{budgetName}} budget is {{thresholdPct}}% spent',
  '<h2>Budget Alert</h2>
<p>Hi {{userName}},</p>
<p>Your <strong>{{budgetName}}</strong> budget has reached <strong>{{thresholdPct}}%</strong> of its limit.</p>
<p>You have spent <strong>{{currentSpend}} {{currency}}</strong> out of <strong>{{budgetLimit}} {{currency}}</strong>.</p>
<p>Consider reviewing your spending to stay on track this month.</p>',
  'You are receiving this alert because you enabled Budget Threshold notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{budgetName}}", "{{thresholdPct}}", "{{currentSpend}}", "{{budgetLimit}}", "{{currency}}"]'
),

(
  'large_transaction_detected',
  'Large Transaction Detected',
  '',
  'Large transaction detected: {{transactionAmount}} {{currency}}',
  '<h2>Large Transaction Alert</h2>
<p>Hi {{userName}},</p>
<p>A transaction of <strong>{{transactionAmount}} {{currency}}</strong> was recorded on <strong>{{transactionDate}}</strong>.</p>
<p><strong>Description:</strong> {{transactionDescription}}</p>
<p>This exceeds your configured threshold of <strong>{{thresholdAmount}} {{currency}}</strong>.</p>
<p>If this was not you, please contact support immediately.</p>',
  'You are receiving this alert because you enabled Large Transaction notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{transactionAmount}}", "{{currency}}", "{{transactionDate}}", "{{transactionDescription}}", "{{thresholdAmount}}"]'
),

(
  'bill_due_reminder',
  'Bill Due Reminder',
  '',
  'Reminder: {{billName}} is due in {{daysUntilDue}} days',
  '<h2>Bill Due Reminder</h2>
<p>Hi {{userName}},</p>
<p>Your bill <strong>{{billName}}</strong> is due on <strong>{{dueDate}}</strong> — that is in <strong>{{daysUntilDue}} days</strong>.</p>
<p><strong>Amount due:</strong> {{billAmount}} {{currency}}</p>
<p>Make sure your payment is ready to avoid any late fees.</p>',
  'You are receiving this reminder because you enabled Bill Due Reminder notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{billName}}", "{{billAmount}}", "{{currency}}", "{{dueDate}}", "{{daysUntilDue}}"]'
),

(
  'monthly_summary_report',
  'Monthly Summary Report',
  '',
  'Your {{reportMonth}} Financial Summary',
  '<h2>Monthly Financial Summary</h2>
<p>Hi {{userName}},</p>
<p>Here is your financial overview for <strong>{{reportMonth}}</strong>:</p>
<ul>
  <li><strong>Total Income:</strong> {{totalIncome}} {{currency}}</li>
  <li><strong>Total Expenses:</strong> {{totalExpenses}} {{currency}}</li>
  <li><strong>Net Savings:</strong> {{netSavings}} {{currency}}</li>
  <li><strong>Top Spending Category:</strong> {{topCategory}}</li>
</ul>
<p>Log in to view your full report and insights.</p>',
  'You are receiving this summary because you enabled Monthly Summary Report notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{reportMonth}}", "{{totalIncome}}", "{{totalExpenses}}", "{{netSavings}}", "{{currency}}", "{{topCategory}}"]'
),

(
  'weekly_spending_digest',
  'Weekly Spending Digest',
  '',
  'Your Weekly Spending Digest: {{weekStart}} – {{weekEnd}}',
  '<h2>Weekly Spending Digest</h2>
<p>Hi {{userName}},</p>
<p>Here is your spending snapshot for <strong>{{weekStart}} – {{weekEnd}}</strong>:</p>
<ul>
  <li><strong>Total Spent:</strong> {{totalSpend}} {{currency}}</li>
  <li><strong>Transactions:</strong> {{transactionCount}}</li>
  <li><strong>Top Category:</strong> {{topCategory}}</li>
</ul>
<p>Stay on track — log in to review your full spending breakdown.</p>',
  'You are receiving this digest because you enabled Weekly Spending Digest notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{weekStart}}", "{{weekEnd}}", "{{totalSpend}}", "{{currency}}", "{{topCategory}}", "{{transactionCount}}"]'
),

(
  'savings_goal_milestone',
  'Savings Goal Milestone',
  '',
  'You reached {{milestonePct}}% of your "{{goalName}}" goal!',
  '<h2>Savings Milestone Reached!</h2>
<p>Hi {{userName}},</p>
<p>Congratulations! You have reached <strong>{{milestonePct}}%</strong> of your savings goal: <strong>{{goalName}}</strong>.</p>
<p><strong>Saved so far:</strong> {{currentAmount}} {{currency}}</p>
<p><strong>Target:</strong> {{targetAmount}} {{currency}}</p>
<p>Keep it up — you are making great progress!</p>',
  'You are receiving this notification because you enabled Savings Goal Milestone alerts in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{goalName}}", "{{milestonePct}}", "{{currentAmount}}", "{{targetAmount}}", "{{currency}}"]'
),

(
  'low_balance_warning',
  'Low Balance Warning',
  '',
  'Low balance alert: your balance is {{currentBalance}} {{currency}}',
  '<h2>Low Balance Warning</h2>
<p>Hi {{userName}},</p>
<p>Your current net balance is <strong>{{currentBalance}} {{currency}}</strong>, which is below your configured threshold of <strong>{{thresholdAmount}} {{currency}}</strong>.</p>
<p>This alert was triggered on <strong>{{balanceDate}}</strong>.</p>
<p>Consider reviewing your recent transactions or adding funds to stay on track.</p>',
  'You are receiving this alert because you enabled Low Balance Warning notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{currentBalance}}", "{{thresholdAmount}}", "{{currency}}", "{{balanceDate}}"]'
),

(
  'unusual_spending_pattern',
  'Unusual Spending Pattern',
  '',
  'Unusual spending detected in {{category}} this {{periodLabel}}',
  '<h2>Unusual Spending Pattern Detected</h2>
<p>Hi {{userName}},</p>
<p>We noticed your spending in <strong>{{category}}</strong> is higher than usual this <strong>{{periodLabel}}</strong>.</p>
<p><strong>Current spend:</strong> {{currentSpend}} {{currency}}</p>
<p><strong>Your average:</strong> {{averageSpend}} {{currency}}</p>
<p><strong>Increase:</strong> {{percentageIncrease}}% above average</p>
<p>Log in to review your transactions and keep your budget on track.</p>',
  'You are receiving this alert because you enabled Unusual Spending Pattern notifications in your profile settings.',
  true,
  '["{{userName}}", "{{userEmail}}", "{{category}}", "{{currentSpend}}", "{{averageSpend}}", "{{percentageIncrease}}", "{{currency}}", "{{periodLabel}}"]'
)

ON CONFLICT DO NOTHING;
