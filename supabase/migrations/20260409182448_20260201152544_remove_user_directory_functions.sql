/*
  # Remove User Directory Functions

  This migration removes database functions that were used by the User Directory feature in the admin panel.

  ## Functions Being Removed
  - `get_users_for_admin` - Retrieved user list with filtering and pagination
  - `get_users_count_for_admin` - Counted users with filtering
  - `admin_create_user_account` - Created new user accounts from admin panel
  - `bulk_update_user_subscriptions` - Bulk updated user subscription tiers

  ## Impact
  - User Directory page has been removed from the admin panel
  - These functions are no longer called by any part of the application
  - Other admin functions for subscriptions, payments, and tickets remain intact

  ## Notes
  - This is a cleanup migration to remove unused database functions
  - Does not affect any data or tables
  - Only removes stored procedures/functions
*/

DROP FUNCTION IF EXISTS get_users_for_admin(text, text, integer, integer);
DROP FUNCTION IF EXISTS get_users_count_for_admin(text, text);
DROP FUNCTION IF EXISTS admin_create_user_account(text, text, text, text, boolean, text, text, text, text);
DROP FUNCTION IF EXISTS bulk_update_user_subscriptions(text[], text);
