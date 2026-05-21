/*
  # Sync Email and Last Login from Auth Users

  ## Summary
  This migration fixes two issues in the User Management admin panel:
  1. Missing email addresses for some users in `user_profiles`
  2. Last login always showing "Never" despite users having logged in

  ## Changes

  ### 1. One-Time Backfill
  - Updates `user_profiles.email` from `auth.users.email` for all rows where the profile email is NULL
  - Updates `user_profiles.last_login_at` from `auth.users.last_sign_in_at` for all rows where last_login_at is NULL

  ### 2. Trigger: Sync on Auth User Update
  - Creates function `sync_auth_user_to_profile()` that copies `email` and `last_sign_in_at` from auth.users to user_profiles
  - Creates trigger `on_auth_user_updated` that fires AFTER INSERT OR UPDATE on auth.users to keep data in sync automatically

  ## Important Notes
  1. This is a safe, non-destructive migration — only fills NULL values during backfill
  2. The trigger runs as SECURITY DEFINER to allow writing to user_profiles from auth schema context
  3. Future logins and email changes in auth.users will automatically propagate to user_profiles
*/

UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE au.id = up.id
  AND (up.email IS NULL OR up.email = '');

UPDATE user_profiles up
SET last_login_at = au.last_sign_in_at
FROM auth.users au
WHERE au.id = up.id
  AND up.last_login_at IS NULL
  AND au.last_sign_in_at IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_auth_user_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET
    email = COALESCE(NEW.email, email),
    last_login_at = CASE
      WHEN NEW.last_sign_in_at IS NOT NULL AND (last_login_at IS NULL OR NEW.last_sign_in_at > last_login_at)
      THEN NEW.last_sign_in_at
      ELSE last_login_at
    END
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_profile();
