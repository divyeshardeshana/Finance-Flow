/*
  # Add Financial Literacy Gamification System

  ## Overview
  Creates a comprehensive gamification system for financial literacy including
  quizzes, challenges, achievements, streaks, and rewards.

  ## New Tables Created

  ### 1. `quiz_questions`
  Financial literacy quiz questions:
  - `id` (uuid, primary key)
  - `question` (text) - The quiz question
  - `options` (jsonb) - Array of answer options
  - `correct_answer` (text) - The correct answer
  - `explanation` (text) - Explanation of the answer
  - `difficulty` (text) - easy, medium, hard
  - `category` (text) - budgeting, investing, saving, etc.
  - `points` (integer) - Points awarded for correct answer
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 2. `user_quiz_attempts`
  Track user quiz attempts:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `quiz_question_id` (uuid, FK to quiz_questions)
  - `selected_answer` (text)
  - `is_correct` (boolean)
  - `points_earned` (integer)
  - `completed_at` (timestamptz)

  ### 3. `user_streaks`
  Track user learning streaks:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `current_streak` (integer) - Current consecutive days
  - `longest_streak` (integer) - All-time longest streak
  - `last_activity_date` (date)
  - `total_activities` (integer)
  - `created_at`, `updated_at` (timestamptz)

  ### 4. `user_achievements`
  Track user achievements and badges:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `achievement_type` (text) - quiz_master, streak_warrior, etc.
  - `achievement_name` (text)
  - `achievement_description` (text)
  - `badge_icon` (text)
  - `points_awarded` (integer)
  - `earned_at` (timestamptz)

  ### 5. `user_points`
  Track user total points and level:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users, unique)
  - `total_points` (integer)
  - `current_level` (integer)
  - `daily_quizzes_completed` (integer)
  - `weekly_quizzes_completed` (integer)
  - `last_quiz_date` (date)
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Quiz questions are publicly readable
  - Full CRUD policies for user data

  ## Indexes
  - Indexes on user_id for efficient queries
  - Indexes on dates for streak calculations
*/

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL,
  points integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create user_quiz_attempts table
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  points_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
  ON user_quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quiz attempts"
  ON user_quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  total_activities integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text NOT NULL,
  badge_icon text DEFAULT 'award',
  points_awarded integer DEFAULT 0,
  earned_at timestamptz DEFAULT now()
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  current_level integer DEFAULT 1,
  daily_quizzes_completed integer DEFAULT 0,
  weekly_quizzes_completed integer DEFAULT 0,
  last_quiz_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON user_points FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own points"
  ON user_points FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own points"
  ON user_points FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_completed ON user_quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category) WHERE is_active = true;

-- Insert sample quiz questions
INSERT INTO quiz_questions (question, options, correct_answer, explanation, difficulty, category, points) VALUES
  (
    'What is the recommended emergency fund amount?',
    '["1 month of expenses", "3-6 months of expenses", "1 year of expenses", "No emergency fund needed"]',
    '3-6 months of expenses',
    'Financial experts recommend saving 3-6 months of living expenses to cover unexpected costs like job loss or emergencies.',
    'easy',
    'Saving',
    10
  ),
  (
    'What does APR stand for?',
    '["Annual Payment Rate", "Annual Percentage Rate", "Average Price Ratio", "Annual Premium Rate"]',
    'Annual Percentage Rate',
    'APR (Annual Percentage Rate) represents the yearly cost of borrowing money, including interest and fees.',
    'easy',
    'Credit',
    10
  ),
  (
    'Which investment typically has the highest risk?',
    '["Savings Account", "Government Bonds", "Individual Stocks", "Certificates of Deposit"]',
    'Individual Stocks',
    'Individual stocks have the highest potential returns but also carry the highest risk due to market volatility.',
    'medium',
    'Investing',
    20
  ),
  (
    'What is the 50/30/20 budgeting rule?',
    '["50% savings, 30% needs, 20% wants", "50% needs, 30% wants, 20% savings", "50% income, 30% expenses, 20% debt", "50% investments, 30% bills, 20% fun"]',
    '50% needs, 30% wants, 20% savings',
    'The 50/30/20 rule suggests allocating 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.',
    'medium',
    'Budgeting',
    20
  ),
  (
    'What is compound interest?',
    '["Interest paid only on principal", "Interest earned on interest", "Simple interest calculation", "Interest rate comparison"]',
    'Interest earned on interest',
    'Compound interest means you earn interest on both your initial principal and the accumulated interest from previous periods.',
    'medium',
    'Saving',
    20
  ),
  (
    'What is diversification in investing?',
    '["Investing all money in one stock", "Spreading investments across different assets", "Only buying bonds", "Keeping money in savings"]',
    'Spreading investments across different assets',
    'Diversification reduces risk by spreading investments across various asset types, sectors, and geographic regions.',
    'hard',
    'Investing',
    30
  ),
  (
    'What is a good credit score range?',
    '["300-500", "500-600", "700-850", "900-1000"]',
    '700-850',
    'Credit scores range from 300-850, with 700+ considered good and 750+ considered excellent.',
    'easy',
    'Credit',
    10
  ),
  (
    'What is dollar-cost averaging?',
    '["Buying stocks at lowest price", "Investing fixed amounts regularly", "Selling at market peaks", "Timing the market perfectly"]',
    'Investing fixed amounts regularly',
    'Dollar-cost averaging involves investing a fixed amount regularly regardless of market conditions, reducing the impact of volatility.',
    'hard',
    'Investing',
    30
  ),
  (
    'What percentage of income should go to housing?',
    '["10-15%", "28-30%", "50-60%", "70-80%"]',
    '28-30%',
    'Financial advisors typically recommend spending no more than 28-30% of gross income on housing costs.',
    'medium',
    'Budgeting',
    20
  ),
  (
    'What is the difference between a debit and credit card?',
    '["No difference", "Debit uses your money, credit borrows money", "Credit is safer than debit", "Debit has higher interest"]',
    'Debit uses your money, credit borrows money',
    'A debit card draws from your bank account, while a credit card borrows money you must pay back, often with interest.',
    'easy',
    'Credit',
    10
  )
ON CONFLICT DO NOTHING;