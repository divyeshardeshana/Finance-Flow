/*
  # Add Financial Assistant Conversations Table

  ## Overview
  Creates a table to store conversations between users and the AI financial assistant,
  enabling conversation history, context awareness, and personalized insights.

  ## New Tables Created

  ### 1. `assistant_conversations`
  Stores all assistant interactions:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `message` (text) - User's question or assistant's response
  - `message_type` (text) - 'user' or 'assistant'
  - `context_data` (jsonb) - Financial data used for analysis
  - `insights` (jsonb) - Structured insights generated
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on assistant_conversations table
  - Users can only access their own conversation history
  - Insert and select policies for authenticated users

  ## Indexes
  - Index on user_id and created_at for efficient conversation retrieval
*/

-- Create assistant_conversations table
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('user', 'assistant')),
  context_data jsonb,
  insights jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation history"
  ON assistant_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON assistant_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON assistant_conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for efficient conversation retrieval
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_date 
  ON assistant_conversations(user_id, created_at DESC);