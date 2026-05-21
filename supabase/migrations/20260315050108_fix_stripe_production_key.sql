/*
  # Fix Corrupt Production Stripe Secret Key

  ## Problem
  The stripe_production_secret_key stored value starts with "mk_" which is not a
  valid Stripe secret key format (must start with "sk_live_"). This causes the
  create-checkout-session edge function to return a 503 error whenever the
  active environment is "production", and it can also throw an exception that
  falls through to a 500 response which the frontend incorrectly renders as a
  session verification error.

  ## Change
  - Clear the corrupt production secret key value so the edge function returns
    a clean 503 "not configured" response rather than throwing an exception.
  - The admin can re-enter a valid sk_live_ key through the Admin > System
    Settings > Stripe panel.

  ## Notes
  - The test environment keys (sk_test_*) are valid and unaffected.
  - The active environment is currently set to "test" so no checkout flows
    are blocked by this change.
*/

UPDATE system_settings
SET setting_value = ''
WHERE setting_key = 'stripe_production_secret_key'
  AND setting_value NOT LIKE 'sk_live_%'
  AND setting_value != '';
