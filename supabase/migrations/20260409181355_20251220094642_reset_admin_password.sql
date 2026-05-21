DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'divyesh3@gmail.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@2024!Secure', gen_salt('bf')), updated_at = now()
    WHERE id = target_user_id;
  END IF;
END $$;
