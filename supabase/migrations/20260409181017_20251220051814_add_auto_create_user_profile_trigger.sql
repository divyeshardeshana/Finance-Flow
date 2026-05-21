CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, user_type, average_monthly_income, income_type, risk_tolerance,
    onboarding_completed, full_name, email_alerts, currency, country,
    photo_url, language, timezone, theme, created_at, updated_at
  )
  VALUES (
    NEW.id, 'individual', 0, 'regular', 'moderate', false,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'weekly', 'USD', '', '', 'en', 'UTC', 'light', NOW(), NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_profiles (
  id, user_type, average_monthly_income, income_type, risk_tolerance,
  onboarding_completed, full_name, email_alerts, currency, country,
  photo_url, language, timezone, theme, created_at, updated_at
)
SELECT 
  u.id, 'individual', 0, 'regular', 'moderate', false,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'weekly', 'USD', '', '', 'en', 'UTC', 'light', u.created_at, NOW()
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
