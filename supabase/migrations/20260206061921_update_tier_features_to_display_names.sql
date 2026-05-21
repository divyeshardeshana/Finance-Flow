/*
  # Update subscription tier features to human-readable display names

  1. Modified Tables
    - `subscription_tiers`
      - Updated `features` column values from snake_case keys to human-readable display names
      - Free tier: Basic Transactions, Basic Budget, Basic Reports, Learning Challenges, Bill Reminders
      - Paid tier: Free Features +, AI Recommendations, Split Transactions, Advanced Goals, Advanced Reports, Priority Support
      - Premium tier: Pro Features +, Net Worth Tracker, Advanced Investments, Retirement Planning, Financial Assistant, Expense Predictions, Stock Predictions

  2. Notes
    - Feature access control uses a separate hardcoded tier map, not this column
    - This change only affects display on pricing cards
    - Admin can further customize via the Pricing Page admin panel
*/

UPDATE subscription_tiers
SET features = '["Basic Transactions", "Basic Budget", "Basic Reports", "Learning Challenges", "Bill Reminders"]'::jsonb
WHERE tier_name = 'free';

UPDATE subscription_tiers
SET features = '["Free Features +", "AI Recommendations", "Split Transactions", "Advanced Goals", "Advanced Reports", "Priority Support"]'::jsonb
WHERE tier_name = 'paid';

UPDATE subscription_tiers
SET features = '["Pro Features +", "Net Worth Tracker", "Advanced Investments", "Retirement Planning", "Financial Assistant", "Expense Predictions", "Stock Predictions"]'::jsonb
WHERE tier_name = 'premium';