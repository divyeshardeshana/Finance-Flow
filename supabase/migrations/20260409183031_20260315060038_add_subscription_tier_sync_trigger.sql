/*
  # Add Subscription Tier Sync Trigger

  Adds a database trigger to keep user_profiles.subscription_tier in sync
  whenever user_subscriptions changes to active status.
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
