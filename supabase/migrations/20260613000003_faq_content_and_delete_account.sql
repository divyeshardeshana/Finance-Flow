-- ============================================================
-- 1. delete_user_account RPC (GDPR Article 17 — right to erasure)
-- ============================================================
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow users to delete their own account
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete all user data in dependency order
  DELETE FROM assistant_conversations WHERE user_id = user_id_param;
  DELETE FROM feature_access_logs WHERE user_id = user_id_param;
  DELETE FROM transactions WHERE user_id = user_id_param;
  DELETE FROM recurring_transactions WHERE user_id = user_id_param;
  DELETE FROM budgets WHERE user_id = user_id_param;
  DELETE FROM savings_goals WHERE user_id = user_id_param;
  DELETE FROM financial_goals WHERE user_id = user_id_param;
  DELETE FROM net_worth_entries WHERE user_id = user_id_param;
  DELETE FROM bill_reminders WHERE user_id = user_id_param;
  DELETE FROM investments WHERE user_id = user_id_param;
  DELETE FROM retirement_data WHERE user_id = user_id_param;
  DELETE FROM estate_beneficiaries WHERE user_id = user_id_param;
  DELETE FROM categories WHERE user_id = user_id_param;
  DELETE FROM custom_transaction_types WHERE user_id = user_id_param;
  DELETE FROM support_tickets WHERE user_id = user_id_param;
  DELETE FROM user_subscriptions WHERE user_id = user_id_param;
  DELETE FROM user_profiles WHERE id = user_id_param;

  -- Delete auth user (must be last)
  DELETE FROM auth.users WHERE id = user_id_param;
END;
$$;

-- ============================================================
-- 2. Comprehensive FAQ content for the website
-- ============================================================

-- Ensure slug column exists and is unique (required for ON CONFLICT)
ALTER TABLE faq_articles ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS faq_articles_slug_idx ON faq_articles (slug);

INSERT INTO faq_articles (question, answer, category, order_index, is_published, show_on_website, slug) VALUES

-- GETTING STARTED
('What is FinanceFlow AI?',
'FinanceFlow AI is an all-in-one personal finance platform that uses artificial intelligence to help you track expenses, create budgets, manage investments, plan for retirement, and reach your savings goals — all in one place. It works for individuals, freelancers, families, and students worldwide.',
'getting_started', 1, true, true, 'what-is-financeflow-ai'),

('Is FinanceFlow AI free to use?',
'Yes! FinanceFlow AI offers a free plan that includes core budgeting, expense tracking, and savings goal features. Pro and Premium plans unlock advanced features like AI financial advice, investment tracking, retirement planning, and priority support. You can start free and upgrade anytime.',
'getting_started', 2, true, true, 'is-financeflow-free'),

('How do I get started with FinanceFlow AI?',
'Getting started takes less than 2 minutes: (1) Click "Get Started Free" and create your account. (2) Set your monthly income and preferred currency. (3) Add your first expense or income transaction. (4) Create a budget for your main spending categories. From there, the AI will start giving you personalised insights based on your real data.',
'getting_started', 3, true, true, 'how-to-get-started'),

('Does FinanceFlow AI work in my country?',
'Yes. FinanceFlow AI supports 150+ currencies and works worldwide. You can set your preferred currency in Profile → Preferences and all amounts will display accordingly. The platform is currently available in English.',
'getting_started', 4, true, true, 'does-financeflow-work-in-my-country'),

('Is my financial data safe with FinanceFlow AI?',
'Your data is protected by Supabase infrastructure with bank-grade 256-bit AES encryption at rest and TLS in transit. We never share your financial data with third parties. You own your data and can export or delete it at any time from your Profile page. We comply with GDPR and applicable data protection laws.',
'getting_started', 5, true, true, 'is-my-data-safe'),

-- ACCOUNT
('How do I change my currency?',
'Go to your Profile page → Preferences tab → Currency dropdown. Select your preferred currency and save. All amounts across the app will convert to display in your chosen currency. Note: historical transactions store the original amount — conversions use current exchange rates.',
'account', 1, true, true, 'how-to-change-currency'),

('How do I reset my password?',
'On the Sign In page, click "Forgot Password" and enter your email address. You will receive a password reset link within a few minutes. Click the link and enter your new password. If you do not receive the email, check your spam folder or contact support at divyesh3@gmail.com.',
'account', 2, true, true, 'how-to-reset-password'),

('Can I change my email address?',
'Currently, email address changes require contacting support at divyesh3@gmail.com. We are working on adding self-service email change. Your email is used for login and important account notifications.',
'account', 3, true, true, 'can-i-change-email'),

('How do I update my profile photo?',
'Go to Profile → click the camera icon on your profile photo → upload an image (JPG, PNG, max 5MB). Your photo will appear across the app immediately.',
'account', 4, true, true, 'how-to-update-profile-photo'),

('How do I delete my account?',
'Go to Profile → Security tab → scroll to "Danger Zone" → click "Delete". You will need to type DELETE to confirm. This permanently removes all your data and cannot be undone. You can also export your data first using the "Export" button in the same section.',
'account', 5, true, true, 'how-to-delete-account'),

('How do I export my data?',
'Go to Profile → Security tab → "Export My Data". This downloads a JSON file containing all your transactions, budgets, savings goals, and financial goals. This is your right under GDPR Article 20 (data portability) and we make it available to all users worldwide.',
'account', 6, true, true, 'how-to-export-data'),

-- BILLING
('What payment methods do you accept?',
'We accept all major credit and debit cards (Visa, Mastercard, American Express) processed securely through Stripe. All payments are encrypted and we never store your card details on our servers.',
'billing', 1, true, true, 'payment-methods'),

('Can I change my subscription plan?',
'Yes. Go to Profile → Subscription tab to upgrade or downgrade. Upgrades take effect immediately and you are charged a prorated amount. Downgrades take effect at the end of your current billing period — you retain premium access until then.',
'billing', 2, true, true, 'change-subscription-plan'),

('How do I cancel my subscription?',
'Go to Profile → Subscription tab → "Cancel Subscription". Your plan will remain active until the end of your current billing period. You will not be charged again after cancellation. Your data is preserved and you can resubscribe at any time.',
'billing', 3, true, true, 'how-to-cancel-subscription'),

('Do you offer refunds?',
'We offer a 7-day refund for new Pro and Premium subscriptions if you are not satisfied. Contact us at divyesh3@gmail.com within 7 days of your first payment. Subsequent billing cycles are non-refundable.',
'billing', 4, true, true, 'refund-policy'),

('Is there an annual plan with a discount?',
'Yes. Annual plans offer 2 months free compared to monthly billing. You can switch to annual billing from Profile → Subscription. The discount is applied immediately when switching.',
'billing', 5, true, true, 'annual-plan-discount'),

-- FEATURES
('How does the AI Financial Assistant work?',
'The AI Assistant (available on Pro and Premium plans) analyses your real financial data — transactions, budgets, income, and savings goals — and answers your questions in plain language. Ask things like "Can I afford a new laptop?", "How much did I spend on food this month?", or "What is my savings rate?" It uses OpenAI technology with your data kept private and never used to train AI models.',
'features', 1, true, true, 'how-does-ai-assistant-work'),

('How does budget tracking work?',
'Create budgets for spending categories (Food, Transport, Entertainment, etc.) with a monthly limit. FinanceFlow automatically tracks your spending against each budget in real time. You will see a colour-coded progress bar and receive alerts when you are approaching or exceeding your limits.',
'features', 2, true, true, 'how-does-budget-tracking-work'),

('Can I set savings goals?',
'Yes. Go to Savings Goals in the sidebar → Add Goal. Set a target amount, target date, and optional monthly contribution. The app tracks your progress and shows how much you need to save each month to reach your goal on time.',
'features', 3, true, true, 'how-to-set-savings-goals'),

('Does FinanceFlow support investment tracking?',
'Yes (Pro and Premium plans). Add your investment holdings with purchase price and current value. FinanceFlow calculates your total portfolio value, gain/loss, and shows allocation by asset type. Manual entry is supported — automatic broker sync is on the roadmap.',
'features', 4, true, true, 'investment-tracking'),

('What are Bill Reminders?',
'Bill Reminders let you set up alerts for recurring payments — rent, utilities, subscriptions, insurance. You choose the due date and how many days in advance to be reminded. Reminders appear in your dashboard and can be sent by email (based on your notification settings).',
'features', 5, true, true, 'bill-reminders'),

('What is the Net Worth Tracker?',
'Net Worth = Assets − Liabilities. Add your bank balances, investments, property, and vehicles as assets. Add loans, credit card debt, and mortgages as liabilities. FinanceFlow calculates your net worth and shows how it changes over time with a historical chart.',
'features', 6, true, true, 'net-worth-tracker'),

-- TROUBLESHOOTING
('Why is my AI Assistant not responding?',
'If the AI Assistant is not responding: (1) Check your internet connection. (2) Ensure you are on a Pro or Premium plan. (3) Check if you have reached your monthly prompt limit (shown in the Assistant page). (4) Try signing out and back in. If the issue persists, contact support at divyesh3@gmail.com.',
'troubleshooting', 1, true, true, 'ai-assistant-not-responding'),

('My transactions are not showing. What do I do?',
'Try: (1) Refresh the page. (2) Check the date filter — transactions default to the current month. (3) Sign out and back in to refresh your session. (4) If you recently imported or added transactions, allow a few seconds for the database to update. Contact support if the issue continues.',
'troubleshooting', 2, true, true, 'transactions-not-showing'),

('Why is the app showing the wrong currency?',
'Go to Profile → Preferences → Currency and verify your preferred currency is set correctly. If it is correct but amounts look wrong, this may be a display refresh issue — try signing out and back in. Note that currency conversion uses live exchange rates which update daily.',
'troubleshooting', 3, true, true, 'wrong-currency-display'),

('I did not receive a verification or reset email.',
'Check your spam or junk folder first. Email delivery can take up to 5 minutes. If you still have not received it, try again with the same email address. If the problem persists, contact divyesh3@gmail.com with your email address and we will assist you directly.',
'troubleshooting', 4, true, true, 'did-not-receive-email')

ON CONFLICT (slug) DO UPDATE SET
  answer = EXCLUDED.answer,
  is_published = EXCLUDED.is_published,
  show_on_website = EXCLUDED.show_on_website,
  order_index = EXCLUDED.order_index;
