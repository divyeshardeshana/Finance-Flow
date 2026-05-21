/*
  # Fix Mutable Function Search Paths

  ## Summary
  Recreates all functions with SET search_path = public to prevent
  search path injection attacks. This is a security best practice
  that prevents malicious schemas from intercepting function calls.

  ## Functions Fixed
  - update_seo_pages_updated_at
  - update_email_templates_updated_at
  - auto_create_user_subscription
  - update_transaction_split_metadata
  - validate_split_amounts
  - calculate_suggested_contribution
  - check_milestone_completion
  - calculate_net_worth
  - create_net_worth_snapshot
  - calculate_next_occurrence
  - calculate_next_due_date
  - auto_categorize_bill
  - update_ticket_timestamp
  - calculate_retirement_projection
  - set_ticket_sla_deadlines
  - update_quiz_stats
*/

CREATE OR REPLACE FUNCTION public.update_seo_pages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_create_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
tier_uuid UUID;
subscription_exists BOOLEAN;
BEGIN
SELECT EXISTS(
SELECT 1 FROM user_subscriptions WHERE user_id = NEW.id
) INTO subscription_exists;

IF NOT subscription_exists THEN
SELECT id INTO tier_uuid
FROM subscription_tiers
WHERE tier_name = NEW.subscription_tier;

IF tier_uuid IS NOT NULL THEN
BEGIN
INSERT INTO user_subscriptions (
user_id,
tier_id,
status,
start_date,
auto_renew
)
VALUES (
NEW.id,
tier_uuid,
'active',
NOW(),
true
);
EXCEPTION WHEN OTHERS THEN
RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
END;
END IF;
END IF;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_transaction_split_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
UPDATE transactions
SET
is_split = (SELECT COUNT(*) FROM transaction_splits WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)) > 0,
split_count = (SELECT COUNT(*) FROM transaction_splits WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id))
WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);

RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_split_amounts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
transaction_amount numeric;
total_splits numeric;
split_count_val integer;
BEGIN
SELECT amount INTO transaction_amount
FROM transactions
WHERE id = NEW.transaction_id;

SELECT COALESCE(SUM(amount), 0), COUNT(*)
INTO total_splits, split_count_val
FROM transaction_splits
WHERE transaction_id = NEW.transaction_id;

IF split_count_val >= 2 AND ABS(total_splits - ABS(transaction_amount)) > 0.01 THEN
RAISE EXCEPTION 'Total split amounts (%) must equal transaction amount (%)',
total_splits, ABS(transaction_amount);
END IF;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_suggested_contribution(goal_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
goal RECORD;
months_remaining numeric;
remaining_amount numeric;
suggested_amount numeric;
BEGIN
SELECT * INTO goal FROM savings_goals WHERE id = goal_id_param;

IF goal.status != 'active' THEN
RETURN 0;
END IF;

remaining_amount := goal.target_amount - goal.current_amount;

IF remaining_amount <= 0 THEN
RETURN 0;
END IF;

IF goal.deadline IS NULL THEN
RETURN ROUND(remaining_amount / 12, 2);
END IF;

months_remaining := GREATEST(
EXTRACT(YEAR FROM age(goal.deadline, CURRENT_DATE)) * 12 +
EXTRACT(MONTH FROM age(goal.deadline, CURRENT_DATE)),
1
);

suggested_amount := ROUND(remaining_amount / months_remaining, 2);

RETURN suggested_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_milestone_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
milestone RECORD;
BEGIN
FOR milestone IN
SELECT * FROM goal_milestones
WHERE goal_id = NEW.id
AND is_completed = false
AND target_amount <= NEW.current_amount
LOOP
UPDATE goal_milestones
SET is_completed = true, completed_at = now()
WHERE id = milestone.id;
END LOOP;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_net_worth(user_id_param uuid)
RETURNS TABLE(total_assets numeric, total_liabilities numeric, net_worth numeric)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
RETURN QUERY
SELECT
COALESCE((SELECT SUM(current_value) FROM assets WHERE user_id = user_id_param), 0) as total_assets,
COALESCE((SELECT SUM(current_balance) FROM liabilities WHERE user_id = user_id_param), 0) as total_liabilities,
COALESCE((SELECT SUM(current_value) FROM assets WHERE user_id = user_id_param), 0) -
COALESCE((SELECT SUM(current_balance) FROM liabilities WHERE user_id = user_id_param), 0) as net_worth;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_net_worth_snapshot(user_id_param uuid, snapshot_date_param date)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
snapshot_id uuid;
calc_assets numeric;
calc_liabilities numeric;
calc_net_worth numeric;
BEGIN
SELECT * INTO calc_assets, calc_liabilities, calc_net_worth
FROM calculate_net_worth(user_id_param);

INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_assets, total_liabilities, net_worth)
VALUES (user_id_param, snapshot_date_param, calc_assets, calc_liabilities, calc_net_worth)
ON CONFLICT (user_id, snapshot_date)
DO UPDATE SET
total_assets = calc_assets,
total_liabilities = calc_liabilities,
net_worth = calc_net_worth
RETURNING id INTO snapshot_id;

RETURN snapshot_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_next_occurrence(occurrence_date date, freq text)
RETURNS date
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
CASE freq
WHEN 'daily' THEN
RETURN occurrence_date + INTERVAL '1 day';
WHEN 'weekly' THEN
RETURN occurrence_date + INTERVAL '1 week';
WHEN 'biweekly' THEN
RETURN occurrence_date + INTERVAL '2 weeks';
WHEN 'monthly' THEN
RETURN occurrence_date + INTERVAL '1 month';
WHEN 'yearly' THEN
RETURN occurrence_date + INTERVAL '1 year';
ELSE
RETURN occurrence_date + INTERVAL '1 month';
END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_next_due_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
IF NEW.frequency = 'monthly' THEN
NEW.next_due_date := NEW.due_date + INTERVAL '1 month';
ELSIF NEW.frequency = 'quarterly' THEN
NEW.next_due_date := NEW.due_date + INTERVAL '3 months';
ELSIF NEW.frequency = 'yearly' THEN
NEW.next_due_date := NEW.due_date + INTERVAL '1 year';
ELSE
NEW.next_due_date := NEW.due_date;
END IF;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_categorize_bill()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
IF NEW.bill_name ~* '(electric|electricity|water|gas|internet|phone|mobile|cable|utility)' THEN
NEW.category := 'utilities';
ELSIF NEW.bill_name ~* '(visa|mastercard|amex|credit card|discover|card payment)' THEN
NEW.category := 'credit_cards';
ELSIF NEW.bill_name ~* '(netflix|spotify|amazon prime|hulu|disney|subscription|membership|youtube premium|apple music)' THEN
NEW.category := 'subscriptions';
END IF;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
UPDATE support_tickets
SET updated_at = now()
WHERE id = NEW.ticket_id;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_retirement_projection(
current_age_param integer,
retirement_age_param integer,
life_expectancy_param integer,
current_savings_param numeric,
annual_contribution_param numeric,
expected_return_param numeric,
inflation_param numeric,
desired_income_param numeric
)
RETURNS TABLE(projected_balance numeric, monthly_income numeric, savings_gap numeric)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
years_to_retirement integer;
years_in_retirement integer;
future_value numeric;
withdrawal_rate numeric := 0.04;
sustainable_income numeric;
BEGIN
years_to_retirement := retirement_age_param - current_age_param;
years_in_retirement := life_expectancy_param - retirement_age_param;

future_value := current_savings_param * power(1 + (expected_return_param / 100.0), years_to_retirement);

IF years_to_retirement > 0 AND expected_return_param > 0 THEN
future_value := future_value + (annual_contribution_param * ((power(1 + (expected_return_param / 100.0), years_to_retirement) - 1) / (expected_return_param / 100.0)));
END IF;

sustainable_income := future_value * withdrawal_rate;

RETURN QUERY SELECT
future_value as projected_balance,
(sustainable_income / 12.0) as monthly_income,
(desired_income_param - sustainable_income) as savings_gap;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ticket_sla_deadlines()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
IF NEW.sla_response_due IS NULL THEN
IF NEW.priority IN ('high', 'urgent') THEN
NEW.sla_response_due = NEW.created_at + INTERVAL '24 hours';
NEW.sla_resolution_due = NEW.created_at + INTERVAL '3 days';
ELSE
NEW.sla_response_due = NEW.created_at + INTERVAL '48 hours';
NEW.sla_resolution_due = NEW.created_at + INTERVAL '7 days';
END IF;
END IF;

RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_quiz_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
UPDATE quiz_questions
SET
usage_count = usage_count + 1,
success_rate = (
SELECT ROUND(
(COUNT(*) FILTER (WHERE is_correct = true)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
2
)
FROM user_quiz_attempts
WHERE quiz_question_id = NEW.quiz_question_id
)
WHERE id = NEW.quiz_question_id;

RETURN NEW;
END;
$$;
