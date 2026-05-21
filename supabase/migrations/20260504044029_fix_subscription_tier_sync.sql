/*
  # Fix subscription tier mismatch

  ## Problem
  user_subscriptions.tier and tier_id were pointing to 'free' for users whose
  user_profiles.subscription_tier is 'premium'. This caused the app to treat
  premium users as free users.

  ## Changes
  1. Update all active user_subscriptions rows so tier and tier_id match the
     corresponding user_profiles.subscription_tier value.
  2. Add a trigger that keeps user_subscriptions.tier and tier_id in sync
     whenever user_profiles.subscription_tier is updated.
*/

-- Sync existing active subscriptions to match profile tier
UPDATE user_subscriptions us
SET 
  tier = up.subscription_tier,
  tier_id = st.id,
  updated_at = now()
FROM user_profiles up
JOIN subscription_tiers st ON st.tier_name = up.subscription_tier
WHERE us.user_id = up.id
  AND us.status = 'active'
  AND us.tier != up.subscription_tier;

-- Create a function + trigger so future profile tier changes also sync subscriptions
CREATE OR REPLACE FUNCTION sync_subscription_tier_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    UPDATE user_subscriptions
    SET 
      tier = NEW.subscription_tier,
      tier_id = (SELECT id FROM subscription_tiers WHERE tier_name = NEW.subscription_tier LIMIT 1),
      updated_at = now()
    WHERE user_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_subscription_tier ON user_profiles;

CREATE TRIGGER trg_sync_subscription_tier
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_tier_from_profile();
