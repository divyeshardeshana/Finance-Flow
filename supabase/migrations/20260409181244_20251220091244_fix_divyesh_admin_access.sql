DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'divyesh3@gmail.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    UPDATE user_profiles SET is_admin = true, admin_role = 'super_admin', subscription_tier = 'premium' WHERE id = target_user_id;
  END IF;
END $$;
