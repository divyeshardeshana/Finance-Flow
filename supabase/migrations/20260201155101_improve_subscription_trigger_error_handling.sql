/*
  # Improve Subscription Creation Trigger Error Handling

  1. Purpose
    - Add better error handling to subscription creation trigger
    - Log errors for debugging
    - Prevent trigger from blocking user creation if subscription fails

  2. Changes
    - Update auto_create_user_subscription function with try-catch logic
    - Add error logging
    - Make subscription creation non-blocking
*/

-- Improved function with better error handling
CREATE OR REPLACE FUNCTION auto_create_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  tier_uuid UUID;
  subscription_exists BOOLEAN;
BEGIN
  -- Check if subscription already exists
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions WHERE user_id = NEW.id
  ) INTO subscription_exists;

  -- Only proceed if no subscription exists
  IF NOT subscription_exists THEN
    -- Get the tier ID based on the subscription_tier name
    SELECT id INTO tier_uuid
    FROM subscription_tiers
    WHERE tier_name = NEW.subscription_tier;

    -- Create subscription if tier exists
    IF tier_uuid IS NOT NULL THEN
      BEGIN
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
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_auto_create_subscription ON user_profiles;

CREATE TRIGGER trigger_auto_create_subscription
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_subscription();
