-- Re-add stripe_customer_id to user_subscriptions (was removed by 20260409183104 but still
-- referenced in SubscriptionDetailsPage.tsx query, causing "Failed to load subscription data" error).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_customer_id text;
  END IF;
END $$;
