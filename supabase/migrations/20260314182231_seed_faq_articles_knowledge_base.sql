/*
  # Seed FAQ Articles for Knowledge Base

  ## Summary
  Inserts comprehensive FAQ content for the FinanceFlow Knowledge Base page.
  Articles are grouped into 5 categories and only inserted if they don't already exist.

  ## Categories & Articles
  1. **account** (Account Management)
     - How do I change my currency?
     - Can I change my subscription plan?
  2. **billing** (Billing & Subscription)
     - What payment methods do you accept?
     - How do I cancel my subscription?
  3. **features** (Features)
     - What is the difference between Free, Paid, and Premium plans?
     - How does the Financial Assistant work?
  4. **getting_started** (Getting Started)
     - How do I add my first transaction?
     - How do I set up a budget?
     - What are savings goals and how do I create one?
  5. **troubleshooting** (Troubleshooting)
     - My transactions aren't showing up. What should I do?
     - I forgot my password. How do I reset it?

  ## Notes
  - Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicate inserts
  - All articles are published (is_published = true)
  - helpful_count starts at 0 except for the currency article (starts at 2 per spec)
*/

INSERT INTO faq_articles (question, answer, category, is_published, helpful_count, order_index)
VALUES
  (
    'How do I change my currency?',
    'Go to your Profile page, scroll to the Preferences section, and select your preferred currency from the dropdown menu. This will update how amounts are displayed throughout the app.',
    'account',
    true,
    2,
    1
  ),
  (
    'Can I change my subscription plan?',
    'Yes! Navigate to your Profile page and click on "Manage Subscription". From there you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    'account',
    true,
    0,
    2
  ),
  (
    'What payment methods do you accept?',
    'We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as payments through Stripe. All transactions are processed securely.',
    'billing',
    true,
    0,
    1
  ),
  (
    'How do I cancel my subscription?',
    'You can cancel your subscription at any time from the Subscription page in your Profile. After cancellation, you will retain access until the end of your current billing period.',
    'billing',
    true,
    0,
    2
  ),
  (
    'What is the difference between Free, Paid, and Premium plans?',
    'The Free plan gives you access to core features like transaction tracking, budgeting, and savings goals. The Paid plan unlocks advanced tools such as reports, bill reminders, and investment tracking. The Premium plan includes all features including AI-powered tools like the Financial Assistant, expense predictions, and AI recommendations.',
    'features',
    true,
    0,
    1
  ),
  (
    'How does the Financial Assistant work?',
    'The Financial Assistant is an AI-powered chatbot that analyzes your financial data and provides personalized advice. It can answer questions about your spending, suggest ways to save money, and help you plan for the future. It is powered by OpenAI and requires a Premium subscription.',
    'features',
    true,
    0,
    2
  ),
  (
    'How do I add my first transaction?',
    'Navigate to the Transactions page from the sidebar. Click the "Add Transaction" button in the top right corner, fill in the details such as amount, category, date, and description, then click Save. Your transaction will appear in the list immediately.',
    'getting_started',
    true,
    0,
    1
  ),
  (
    'How do I set up a budget?',
    'Go to the Budget page from the sidebar. Click "Add Budget Category" and choose a spending category (e.g., Food, Transport). Set your monthly limit for that category. FinanceFlow will track your spending against your budget and alert you when you are getting close to the limit.',
    'getting_started',
    true,
    0,
    2
  ),
  (
    'What are savings goals and how do I create one?',
    'Savings goals help you track progress toward a specific financial target, like an emergency fund, vacation, or a new car. Go to Savings Goals in the sidebar, click "New Goal", enter a name, target amount, and optional deadline. You can then add contributions as you save.',
    'getting_started',
    true,
    0,
    3
  ),
  (
    'My transactions aren''t showing up. What should I do?',
    'First, try refreshing the page. If transactions are still missing, check that you''re viewing the correct date range and that no filters are applied. If you recently added a transaction and it''s not appearing, log out and log back in. If the problem persists, please contact our support team.',
    'troubleshooting',
    true,
    0,
    1
  ),
  (
    'I forgot my password. How do I reset it?',
    'On the login page, click "Forgot Password". Enter your registered email address and we will send you a password reset link. Check your spam folder if you do not receive the email within a few minutes. The reset link is valid for 24 hours.',
    'troubleshooting',
    true,
    0,
    2
  )
ON CONFLICT DO NOTHING;
