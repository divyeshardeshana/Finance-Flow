/*
  # Enable Realtime on subscription tables

  Adds the subscription_tiers, feature_tier_config, and app_features tables
  to the Supabase Realtime publication so that client-side subscriptions
  receive instant change events when an admin updates plan data.
*/

DO $$
BEGIN
  -- subscription_tiers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscription_tiers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE subscription_tiers;
  END IF;

  -- feature_tier_config
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'feature_tier_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE feature_tier_config;
  END IF;

  -- app_features
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'app_features'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_features;
  END IF;
END $$;
