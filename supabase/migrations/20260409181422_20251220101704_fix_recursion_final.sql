DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
END $$;

DROP FUNCTION IF EXISTS is_admin_user(uuid);

CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  admin_status boolean;
BEGIN
  SELECT COALESCE(is_admin, false) INTO admin_status FROM user_profiles WHERE id = user_id;
  RETURN COALESCE(admin_status, false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;

CREATE POLICY "user_select_own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "user_insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "user_update_own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "user_delete_own" ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_select_all" ON user_profiles FOR SELECT TO authenticated USING (is_admin_user(auth.uid()) = true);
CREATE POLICY "admin_update_all" ON user_profiles FOR UPDATE TO authenticated USING (is_admin_user(auth.uid()) = true) WITH CHECK (is_admin_user(auth.uid()) = true);
CREATE POLICY "admin_delete_all" ON user_profiles FOR DELETE TO authenticated USING (is_admin_user(auth.uid()) = true);
