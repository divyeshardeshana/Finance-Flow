-- Seed subscription_tiers with default plans if table is empty or tiers missing
-- Safe to run multiple times (ON CONFLICT DO UPDATE preserves admin edits on re-run)

INSERT INTO subscription_tiers (
  tier_name,
  display_name,
  monthly_price,
  annual_price,
  description,
  cta_text,
  features,
  max_goals,
  is_active
)
VALUES
  (
    'free',
    'Free',
    0,
    0,
    'Perfect for getting started',
    'Get Started',
    ARRAY[
      'Basic Transactions',
      'Basic Budget',
      'Basic Reports',
      'Learning Challenges',
      'Bill Reminders'
    ],
    3,
    true
  ),
  (
    'paid',
    'Pro',
    9,
    99,
    'For serious financial planning',
    'Get Started',
    ARRAY[
      'Free Features +',
      'AI Recommendations',
      'Split Transactions',
      'Advanced Goals',
      'Advanced Reports',
      'Priority Support'
    ],
    10,
    true
  ),
  (
    'premium',
    'Premium',
    19,
    199,
    'Complete financial management',
    'Get Started',
    ARRAY[
      'Pro Features +',
      'Net Worth Tracker',
      'Advanced Investments',
      'Retirement Planning',
      'Financial Assistant',
      'Expense Predictions',
      'Stock Predictions'
    ],
    10,
    true
  )
ON CONFLICT (tier_name) DO UPDATE SET
  is_active = true;
