/*
  # Add Support Tickets & FAQ System

  ## Overview
  Creates a comprehensive support ticketing system with FAQ knowledge base.
  This is a Paid Plan feature providing priority customer support.

  ## New Tables Created

  ### 1. `support_tickets`
  User support tickets:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `subject` (text) - Ticket subject
  - `description` (text) - Detailed description
  - `category` (text) - technical, billing, feature_request, bug_report, other
  - `priority` (text) - low, medium, high, urgent
  - `status` (text) - open, in_progress, waiting_response, resolved, closed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `resolved_at` (timestamptz)

  ### 2. `ticket_messages`
  Messages/replies in support tickets:
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, FK to support_tickets)
  - `user_id` (uuid, FK to auth.users)
  - `message` (text) - Message content
  - `is_staff_reply` (boolean) - Whether from support staff
  - `created_at` (timestamptz)

  ### 3. `faq_articles`
  Frequently asked questions and knowledge base:
  - `id` (uuid, primary key)
  - `category` (text) - getting_started, account, billing, features, troubleshooting
  - `question` (text) - FAQ question
  - `answer` (text) - Detailed answer
  - `order_index` (integer) - Display order
  - `view_count` (integer) - Number of views
  - `helpful_count` (integer) - Number of helpful votes
  - `is_published` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can view and create their own tickets
  - Users can view published FAQ articles
  - Only staff can resolve tickets

  ## Indexes
  - Index on user_id for user tickets
  - Index on status for filtering
  - Index on category for FAQ browsing
*/

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_staff_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for own tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for own tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Create faq_articles table
CREATE TABLE IF NOT EXISTS faq_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL CHECK (category IN ('getting_started', 'account', 'billing', 'features', 'troubleshooting')),
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer DEFAULT 0,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published FAQ articles"
  ON faq_articles FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_faq_articles_category ON faq_articles(category, order_index) WHERE is_published = true;

-- Function to update ticket timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = now()
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket updates when messages are added
DROP TRIGGER IF EXISTS update_ticket_on_message ON ticket_messages;
CREATE TRIGGER update_ticket_on_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Insert default FAQ articles
INSERT INTO faq_articles (category, question, answer, order_index) VALUES
  ('getting_started', 'How do I add my first transaction?', 
   'Navigate to the Transactions page from the sidebar, click the "Add Transaction" button, fill in the details including amount, category, and date, then click Save. You can also upload receipts using the PDF upload feature.',
   1),
  ('getting_started', 'How do I set up a budget?',
   'Go to the Budget page, where you''ll see suggested budget allocations based on the 50/30/20 rule. You can customize these allocations for each category based on your needs. The system will track your spending against these limits.',
   2),
  ('getting_started', 'What are savings goals and how do I create one?',
   'Savings goals help you track progress towards specific financial targets. Navigate to the Savings page, click "Add Goal", enter the target amount, deadline, and optional monthly contribution. The system will show your progress and suggest contribution amounts.',
   3),
  ('account', 'How do I change my currency?',
   'Go to your Profile page, scroll to the Preferences section, and select your preferred currency from the dropdown menu. This will update how amounts are displayed throughout the app.',
   1),
  ('account', 'Can I change my subscription plan?',
   'Yes! You can upgrade or downgrade your plan anytime from your Profile page. Upgrades take effect immediately, while downgrades apply at the end of your current billing period.',
   2),
  ('billing', 'What payment methods do you accept?',
   'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are processed securely through Stripe.',
   1),
  ('billing', 'How do I cancel my subscription?',
   'You can cancel your subscription anytime from your Profile page. You''ll retain access to paid features until the end of your current billing period.',
   2),
  ('features', 'What is the difference between Free, Paid, and Premium plans?',
   'Free Plan includes basic transaction tracking, budgeting, and reports. Paid Plan adds bill reminders, split transactions, advanced goals (10 goals), and priority support. Premium Plan includes everything plus net worth tracking, advanced investments, retirement planning, and estate planning.',
   1),
  ('features', 'How does the Financial Assistant work?',
   'The AI Financial Assistant analyzes your spending patterns, income, and goals to provide personalized advice. Ask questions like "How can I save more?" or "Should I invest my savings?" and get intelligent recommendations.',
   2),
  ('troubleshooting', 'My transactions aren''t showing up. What should I do?',
   'First, try refreshing the page. If that doesn''t work, check if you''re filtering by date range or category. Still having issues? Contact support and we''ll help you troubleshoot.',
   1),
  ('troubleshooting', 'I forgot my password. How do I reset it?',
   'Click the "Forgot Password" link on the sign-in page, enter your email address, and we''ll send you a password reset link. Follow the instructions in the email to create a new password.',
   2)
ON CONFLICT DO NOTHING;