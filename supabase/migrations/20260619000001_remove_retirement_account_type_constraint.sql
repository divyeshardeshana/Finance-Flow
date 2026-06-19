-- Remove restrictive CHECK constraint on account_type to allow country-specific plan names
ALTER TABLE retirement_accounts DROP CONSTRAINT IF EXISTS retirement_accounts_account_type_check;
