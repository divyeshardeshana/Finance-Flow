/*
  # Fix Corrupt Production Stripe Secret Key

  Clears any invalid stripe_production_secret_key value so the edge function
  returns a clean 503 "not configured" response rather than throwing an exception.
*/

UPDATE system_settings
SET setting_value = ''
WHERE setting_key = 'stripe_production_secret_key'
  AND setting_value NOT LIKE 'sk_live_%'
  AND setting_value != '';
