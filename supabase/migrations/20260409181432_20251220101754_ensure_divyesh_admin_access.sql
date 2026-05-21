DO $$
DECLARE
  target_user_id uuid;
  profile_exists boolean;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'divyesh3@gmail.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id) INTO profile_exists;
    IF profile_exists THEN
      UPDATE user_profiles SET is_admin = true, admin_role = 'super_admin', subscription_tier = 'premium', updated_at = NOW() WHERE id = target_user_id;
    ELSE
      INSERT INTO user_profiles (id, is_admin, admin_role, subscription_tier, user_type, average_monthly_income, income_type, risk_tolerance, onboarding_completed, full_name, email_alerts, currency, country, language, timezone, theme, created_at, updated_at)
      VALUES (target_user_id, true, 'super_admin', 'premium', 'individual', 0, 'regular', 'moderate', true, 'Divyesh Ardeshana', 'weekly', 'USD', '', 'en', 'UTC', 'light', NOW(), NOW());
    END IF;
  END IF;
END $$;
