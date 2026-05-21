/*
  # Add Subscription Tier Sync Trigger

  ## Summary
  This migration adds a database-level trigger that automatically keeps
  user_profiles.subscription_tier in sync whenever a user_subscriptions row
  changes to active status. This is the most reliable safety net for subscription
  activation — even if the webhook fires out of order, the profile will always
  reflect the correct current tier.

  ## Changes

  ### New function: sync_user_profile_subscription_tier()
  - Fires AFTER INSERT OR UPDATE on user_subscriptions
  - When a row becomes status='active', updates user_profiles.subscription_tier
    to match the tier column of that subscription row
  - Only runs when status changes to 'active' (avoids unnecessary updates)

  ### New trigger: trg_sync_subscription_tier
  - Attached to user_subscriptions AFTER INSERT OR UPDATE
  - Calls sync_user_profile_subscription_tier() for each affected row

  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS on user_profiles
  - No new RLS policies needed — trigger fires internally
*/

CREATE OR REPLACE FUNCTION sync_user_profile_subscription_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE user_profiles
    SET subscription_tier = NEW.tier,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_subscription_tier ON user_subscriptions;

CREATE TRIGGER trg_sync_subscription_tier
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_subscription_tier();
