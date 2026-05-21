DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

DROP FUNCTION IF EXISTS is_admin_user(uuid);

CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  is_admin_result boolean;
BEGIN
  SELECT is_admin INTO is_admin_result FROM user_profiles WHERE id = user_id LIMIT 1;
  RETURN COALESCE(is_admin_result, false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT TO authenticated USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
