/*
  # Auto-Create User Subscription Trigger

  1. Purpose
    - Automatically create a subscription record when a new user is created via admin
    - Link users to their assigned subscription tier
    - Ensure all users have a subscription record for proper access control

  2. Changes
    - Create function to auto-create subscription on user profile creation
    - Add trigger to execute function after user_profiles insert
    - Link to appropriate subscription tier based on user's subscription_tier field

  3. Benefits
    - Eliminates manual subscription creation step
    - Ensures data consistency between profiles and subscriptions
    - Simplifies admin user creation process
*/

CREATE OR REPLACE FUNCTION auto_create_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  tier_uuid UUID;
BEGIN
  SELECT id INTO tier_uuid
  FROM subscription_tiers
  WHERE tier_name = NEW.subscription_tier;

  IF tier_uuid IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id,
      tier_id,
      status,
      start_date,
      auto_renew
    )
    VALUES (
      NEW.id,
      tier_uuid,
      'active',
      NOW(),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_create_subscription ON user_profiles;

CREATE TRIGGER trigger_auto_create_subscription
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_subscription();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;
