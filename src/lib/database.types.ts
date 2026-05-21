export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_type: 'individual' | 'family' | 'freelancer' | 'small_business'
          average_monthly_income: number
          income_type: 'regular' | 'irregular' | null
          risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | null
          onboarding_completed: boolean
          full_name: string
          email_alerts: 'daily' | 'weekly' | 'none'
          currency: string
          country: string
          photo_url: string
          language: 'en' | 'hi' | 'ar' | 'es' | 'zh'
          timezone: string
          theme: 'light' | 'dark'
          subscription_tier: 'free' | 'paid' | 'premium'
          trial_ends_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type: 'individual' | 'family' | 'freelancer' | 'small_business'
          average_monthly_income?: number
          income_type?: 'regular' | 'irregular' | null
          risk_tolerance?: 'conservative' | 'moderate' | 'aggressive' | null
          onboarding_completed?: boolean
          full_name?: string
          email_alerts?: 'daily' | 'weekly' | 'none'
          currency?: string
          country?: string
          photo_url?: string
          language?: 'en' | 'hi' | 'ar' | 'es' | 'zh'
          timezone?: string
          theme?: 'light' | 'dark'
          subscription_tier?: 'free' | 'paid' | 'premium'
          trial_ends_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: 'individual' | 'family' | 'freelancer' | 'small_business'
          average_monthly_income?: number
          income_type?: 'regular' | 'irregular' | null
          risk_tolerance?: 'conservative' | 'moderate' | 'aggressive' | null
          onboarding_completed?: boolean
          full_name?: string
          email_alerts?: 'daily' | 'weekly' | 'none'
          currency?: string
          country?: string
          photo_url?: string
          language?: 'en' | 'hi' | 'ar' | 'es' | 'zh'
          timezone?: string
          theme?: 'light' | 'dark'
          subscription_tier?: 'free' | 'paid' | 'premium'
          trial_ends_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string
          transaction_date: string
          payment_method: string
          tags: string[]
          notes: string
          is_recurring: boolean
          document_id: string | null
          recurring_transaction_id: string | null
          currency: string
          is_split: boolean
          split_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description?: string
          transaction_date: string
          payment_method?: string
          tags?: string[]
          notes?: string
          is_recurring?: boolean
          document_id?: string | null
          recurring_transaction_id?: string | null
          currency?: string
          is_split?: boolean
          split_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string
          transaction_date?: string
          payment_method?: string
          tags?: string[]
          notes?: string
          is_recurring?: boolean
          document_id?: string | null
          recurring_transaction_id?: string | null
          currency?: string
          is_split?: boolean
          split_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          is_preset: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          is_preset?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          is_preset?: boolean
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          budget_type: 'fixed_monthly' | 'rolling_average' | 'adaptive'
          month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          budget_type?: 'fixed_monthly' | 'rolling_average' | 'adaptive'
          month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          amount?: number
          budget_type?: 'fixed_monthly' | 'rolling_average' | 'adaptive'
          month?: string
          created_at?: string
          updated_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          goal_name: string
          target_amount: number
          current_amount: number
          monthly_contribution: number
          target_date: string | null
          priority: number
          status: 'active' | 'completed' | 'paused'
          goal_category: 'emergency_fund' | 'vacation' | 'home' | 'education' | 'retirement' | 'other'
          auto_contribution: number
          contribution_day: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_name: string
          target_amount: number
          current_amount?: number
          monthly_contribution?: number
          target_date?: string | null
          priority?: number
          status?: 'active' | 'completed' | 'paused'
          goal_category?: 'emergency_fund' | 'vacation' | 'home' | 'education' | 'retirement' | 'other'
          auto_contribution?: number
          contribution_day?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_name?: string
          target_amount?: number
          current_amount?: number
          monthly_contribution?: number
          target_date?: string | null
          priority?: number
          status?: 'active' | 'completed' | 'paused'
          goal_category?: 'emergency_fund' | 'vacation' | 'home' | 'education' | 'retirement' | 'other'
          auto_contribution?: number
          contribution_day?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      investment_profiles: {
        Row: {
          id: string
          user_id: string
          risk_score: number
          recommended_stocks_percent: number
          recommended_bonds_percent: number
          recommended_cash_percent: number
          current_portfolio_value: number
          retirement_age: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          risk_score?: number
          recommended_stocks_percent?: number
          recommended_bonds_percent?: number
          recommended_cash_percent?: number
          current_portfolio_value?: number
          retirement_age?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          risk_score?: number
          recommended_stocks_percent?: number
          recommended_bonds_percent?: number
          recommended_cash_percent?: number
          current_portfolio_value?: number
          retirement_age?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_suggestions: {
        Row: {
          id: string
          user_id: string
          suggestion_type: 'overspending' | 'savings' | 'investment' | 'price_comparison'
          category: string | null
          title: string
          description: string
          potential_savings: number
          status: 'new' | 'accepted' | 'dismissed' | 'completed'
          created_at: string
          action_taken_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          suggestion_type: 'overspending' | 'savings' | 'investment' | 'price_comparison'
          category?: string | null
          title: string
          description: string
          potential_savings?: number
          status?: 'new' | 'accepted' | 'dismissed' | 'completed'
          created_at?: string
          action_taken_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          suggestion_type?: 'overspending' | 'savings' | 'investment' | 'price_comparison'
          category?: string | null
          title?: string
          description?: string
          potential_savings?: number
          status?: 'new' | 'accepted' | 'dismissed' | 'completed'
          created_at?: string
          action_taken_at?: string | null
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          store_type: 'grocery' | 'pharmacy' | 'general' | 'utility'
          location: string
          has_api: boolean
          api_config: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          store_type: 'grocery' | 'pharmacy' | 'general' | 'utility'
          location?: string
          has_api?: boolean
          api_config?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          store_type?: 'grocery' | 'pharmacy' | 'general' | 'utility'
          location?: string
          has_api?: boolean
          api_config?: Json | null
          created_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
          parent_category_id: string | null
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_category_id?: string | null
          icon?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_category_id?: string | null
          icon?: string
          created_at?: string
        }
      }
      price_comparisons: {
        Row: {
          id: string
          user_id: string | null
          store_id: string
          product_category_id: string
          product_name: string
          brand: string
          price: number
          unit: string
          data_source: 'api' | 'manual'
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          store_id: string
          product_category_id: string
          product_name: string
          brand?: string
          price: number
          unit?: string
          data_source: 'api' | 'manual'
          location?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          store_id?: string
          product_category_id?: string
          product_name?: string
          brand?: string
          price?: number
          unit?: string
          data_source?: 'api' | 'manual'
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      transaction_documents: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number
          upload_status: 'pending' | 'processing' | 'completed' | 'failed'
          extraction_status: string | null
          transactions_extracted: number
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number
          upload_status?: 'pending' | 'processing' | 'completed' | 'failed'
          extraction_status?: string | null
          transactions_extracted?: number
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          upload_status?: 'pending' | 'processing' | 'completed' | 'failed'
          extraction_status?: string | null
          transactions_extracted?: number
          created_at?: string
          processed_at?: string | null
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string
          payment_method: string
          tags: string[]
          notes: string
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
          start_date: string
          end_date: string | null
          next_occurrence: string
          last_generated: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description?: string
          payment_method?: string
          tags?: string[]
          notes?: string
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
          start_date: string
          end_date?: string | null
          next_occurrence: string
          last_generated?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string
          payment_method?: string
          tags?: string[]
          notes?: string
          frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
          start_date?: string
          end_date?: string | null
          next_occurrence?: string
          last_generated?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assistant_conversations: {
        Row: {
          id: string
          user_id: string
          message: string
          message_type: 'user' | 'assistant'
          context_data: Json | null
          insights: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          message_type: 'user' | 'assistant'
          context_data?: Json | null
          insights?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          message_type?: 'user' | 'assistant'
          context_data?: Json | null
          insights?: Json | null
          created_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          question: string
          options: Json
          correct_answer: string
          explanation: string
          difficulty: 'easy' | 'medium' | 'hard'
          category: string
          points: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          options: Json
          correct_answer: string
          explanation: string
          difficulty: 'easy' | 'medium' | 'hard'
          category: string
          points?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          options?: Json
          correct_answer?: string
          explanation?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string
          points?: number
          is_active?: boolean
          created_at?: string
        }
      }
      user_quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_question_id: string
          selected_answer: string
          is_correct: boolean
          points_earned: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_question_id: string
          selected_answer: string
          is_correct: boolean
          points_earned?: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_question_id?: string
          selected_answer?: string
          is_correct?: boolean
          points_earned?: number
          completed_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          total_activities: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          total_activities?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          total_activities?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_name: string
          achievement_description: string
          badge_icon: string
          points_awarded: number
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_name: string
          achievement_description: string
          badge_icon?: string
          points_awarded?: number
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_name?: string
          achievement_description?: string
          badge_icon?: string
          points_awarded?: number
          earned_at?: string
        }
      }
      user_points: {
        Row: {
          id: string
          user_id: string
          total_points: number
          current_level: number
          daily_quizzes_completed: number
          weekly_quizzes_completed: number
          last_quiz_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_points?: number
          current_level?: number
          daily_quizzes_completed?: number
          weekly_quizzes_completed?: number
          last_quiz_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_points?: number
          current_level?: number
          daily_quizzes_completed?: number
          weekly_quizzes_completed?: number
          last_quiz_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      custom_transaction_types: {
        Row: {
          id: string
          user_id: string
          type_name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type_name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type_name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      subscription_tiers: {
        Row: {
          id: string
          tier_name: 'free' | 'paid' | 'premium'
          display_name: string
          monthly_price: number
          annual_price: number
          features: Json
          max_goals: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tier_name: 'free' | 'paid' | 'premium'
          display_name: string
          monthly_price?: number
          annual_price?: number
          features?: Json
          max_goals?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tier_name?: 'free' | 'paid' | 'premium'
          display_name?: string
          monthly_price?: number
          annual_price?: number
          features?: Json
          max_goals?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          tier_id: string
          status: 'active' | 'cancelled' | 'expired' | 'trial'
          start_date: string
          end_date: string | null
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier_id: string
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          start_date?: string
          end_date?: string | null
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier_id?: string
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          start_date?: string
          end_date?: string | null
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      feature_access_log: {
        Row: {
          id: string
          user_id: string
          feature_name: string
          accessed_at: string
          allowed: boolean
          tier_required: string | null
        }
        Insert: {
          id?: string
          user_id: string
          feature_name: string
          accessed_at?: string
          allowed?: boolean
          tier_required?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          feature_name?: string
          accessed_at?: string
          allowed?: boolean
          tier_required?: string | null
        }
      }
      bill_reminders: {
        Row: {
          id: string
          user_id: string
          bill_name: string
          amount: number
          due_date: string
          category: 'utilities' | 'credit_cards' | 'subscriptions' | 'other'
          frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom'
          reminder_days_before: number
          is_active: boolean
          last_reminded_at: string | null
          next_due_date: string
          auto_pay: boolean
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bill_name: string
          amount: number
          due_date: string
          category?: 'utilities' | 'credit_cards' | 'subscriptions' | 'other'
          frequency?: 'monthly' | 'quarterly' | 'yearly' | 'custom'
          reminder_days_before?: number
          is_active?: boolean
          last_reminded_at?: string | null
          next_due_date: string
          auto_pay?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bill_name?: string
          amount?: number
          due_date?: string
          category?: 'utilities' | 'credit_cards' | 'subscriptions' | 'other'
          frequency?: 'monthly' | 'quarterly' | 'yearly' | 'custom'
          reminder_days_before?: number
          is_active?: boolean
          last_reminded_at?: string | null
          next_due_date?: string
          auto_pay?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          browser_notifications_enabled: boolean
          reminder_time: string
          days_before_reminder: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          browser_notifications_enabled?: boolean
          reminder_time?: string
          days_before_reminder?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          browser_notifications_enabled?: boolean
          reminder_time?: string
          days_before_reminder?: number
          created_at?: string
          updated_at?: string
        }
      }
      transaction_splits: {
        Row: {
          id: string
          transaction_id: string
          category: string
          amount: number
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          category: string
          amount: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          category?: string
          amount?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          description: string
          category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          description: string
          category?: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          description?: string
          category?: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          message: string
          is_staff_reply: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          message: string
          is_staff_reply?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          message?: string
          is_staff_reply?: boolean
          created_at?: string
        }
      }
      faq_articles: {
        Row: {
          id: string
          category: 'getting_started' | 'account' | 'billing' | 'features' | 'troubleshooting'
          question: string
          answer: string
          order_index: number
          view_count: number
          helpful_count: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: 'getting_started' | 'account' | 'billing' | 'features' | 'troubleshooting'
          question: string
          answer: string
          order_index?: number
          view_count?: number
          helpful_count?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: 'getting_started' | 'account' | 'billing' | 'features' | 'troubleshooting'
          question?: string
          answer?: string
          order_index?: number
          view_count?: number
          helpful_count?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goal_milestones: {
        Row: {
          id: string
          goal_id: string
          title: string
          target_amount: number
          target_date: string | null
          is_completed: boolean
          completed_at: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          target_amount?: number
          target_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          title?: string
          target_amount?: number
          target_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          order_index?: number
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          asset_name: string
          asset_type: 'real_estate' | 'investment' | 'cash' | 'retirement' | 'vehicle' | 'business' | 'crypto' | 'other'
          current_value: number
          currency: string
          purchase_date: string | null
          purchase_price: number | null
          notes: string
          is_liquid: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset_name: string
          asset_type?: 'real_estate' | 'investment' | 'cash' | 'retirement' | 'vehicle' | 'business' | 'crypto' | 'other'
          current_value: number
          currency?: string
          purchase_date?: string | null
          purchase_price?: number | null
          notes?: string
          is_liquid?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset_name?: string
          asset_type?: 'real_estate' | 'investment' | 'cash' | 'retirement' | 'vehicle' | 'business' | 'crypto' | 'other'
          current_value?: number
          currency?: string
          purchase_date?: string | null
          purchase_price?: number | null
          notes?: string
          is_liquid?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      liabilities: {
        Row: {
          id: string
          user_id: string
          liability_name: string
          liability_type: 'mortgage' | 'loan' | 'credit_card' | 'student_loan' | 'auto_loan' | 'other'
          current_balance: number
          currency: string
          original_amount: number | null
          interest_rate: number
          monthly_payment: number
          due_date: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          liability_name: string
          liability_type?: 'mortgage' | 'loan' | 'credit_card' | 'student_loan' | 'auto_loan' | 'other'
          current_balance: number
          currency?: string
          original_amount?: number | null
          interest_rate?: number
          monthly_payment?: number
          due_date?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          liability_name?: string
          liability_type?: 'mortgage' | 'loan' | 'credit_card' | 'student_loan' | 'auto_loan' | 'other'
          current_balance?: number
          currency?: string
          original_amount?: number | null
          interest_rate?: number
          monthly_payment?: number
          due_date?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      net_worth_snapshots: {
        Row: {
          id: string
          user_id: string
          snapshot_date: string
          total_assets: number
          total_liabilities: number
          net_worth: number
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          snapshot_date: string
          total_assets?: number
          total_liabilities?: number
          net_worth?: number
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          snapshot_date?: string
          total_assets?: number
          total_liabilities?: number
          net_worth?: number
          notes?: string
          created_at?: string
        }
      }
      retirement_accounts: {
        Row: {
          id: string
          user_id: string
          account_name: string
          account_type: '401k' | 'ira_traditional' | 'ira_roth' | '403b' | 'sep_ira' | 'simple_ira' | 'pension' | 'other'
          current_balance: number
          currency: string
          employer_match: number
          annual_contribution: number
          institution: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_name: string
          account_type?: '401k' | 'ira_traditional' | 'ira_roth' | '403b' | 'sep_ira' | 'simple_ira' | 'pension' | 'other'
          current_balance?: number
          currency?: string
          employer_match?: number
          annual_contribution?: number
          institution?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_name?: string
          account_type?: '401k' | 'ira_traditional' | 'ira_roth' | '403b' | 'sep_ira' | 'simple_ira' | 'pension' | 'other'
          current_balance?: number
          currency?: string
          employer_match?: number
          annual_contribution?: number
          institution?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      retirement_projections: {
        Row: {
          id: string
          user_id: string
          current_age: number
          retirement_age: number
          life_expectancy: number
          current_savings: number
          annual_contribution: number
          expected_return_rate: number
          inflation_rate: number
          desired_annual_income: number
          projected_balance: number | null
          monthly_income_at_retirement: number | null
          savings_gap: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_age: number
          retirement_age: number
          life_expectancy: number
          current_savings?: number
          annual_contribution?: number
          expected_return_rate?: number
          inflation_rate?: number
          desired_annual_income?: number
          projected_balance?: number | null
          monthly_income_at_retirement?: number | null
          savings_gap?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_age?: number
          retirement_age?: number
          life_expectancy?: number
          current_savings?: number
          annual_contribution?: number
          expected_return_rate?: number
          inflation_rate?: number
          desired_annual_income?: number
          projected_balance?: number | null
          monthly_income_at_retirement?: number | null
          savings_gap?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      beneficiaries: {
        Row: {
          id: string
          user_id: string
          full_name: string
          relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'trust' | 'charity' | 'other'
          allocation_percentage: number
          contact_email: string
          contact_phone: string
          date_of_birth: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          relationship?: 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'trust' | 'charity' | 'other'
          allocation_percentage?: number
          contact_email?: string
          contact_phone?: string
          date_of_birth?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          relationship?: 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'trust' | 'charity' | 'other'
          allocation_percentage?: number
          contact_email?: string
          contact_phone?: string
          date_of_birth?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      insurance_policies: {
        Row: {
          id: string
          user_id: string
          policy_name: string
          policy_type: 'life' | 'health' | 'disability' | 'long_term_care' | 'property' | 'auto' | 'umbrella' | 'other'
          policy_number: string
          provider: string
          coverage_amount: number
          premium_amount: number
          premium_frequency: 'monthly' | 'quarterly' | 'annual'
          start_date: string | null
          expiry_date: string | null
          beneficiary_id: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          policy_name: string
          policy_type?: 'life' | 'health' | 'disability' | 'long_term_care' | 'property' | 'auto' | 'umbrella' | 'other'
          policy_number?: string
          provider?: string
          coverage_amount?: number
          premium_amount?: number
          premium_frequency?: 'monthly' | 'quarterly' | 'annual'
          start_date?: string | null
          expiry_date?: string | null
          beneficiary_id?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          policy_name?: string
          policy_type?: 'life' | 'health' | 'disability' | 'long_term_care' | 'property' | 'auto' | 'umbrella' | 'other'
          policy_number?: string
          provider?: string
          coverage_amount?: number
          premium_amount?: number
          premium_frequency?: 'monthly' | 'quarterly' | 'annual'
          start_date?: string | null
          expiry_date?: string | null
          beneficiary_id?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      estate_documents: {
        Row: {
          id: string
          user_id: string
          document_name: string
          document_type: 'will' | 'trust' | 'power_of_attorney' | 'healthcare_directive' | 'beneficiary_designation' | 'other'
          last_updated: string | null
          attorney_name: string
          attorney_contact: string
          location: string
          review_date: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_name: string
          document_type?: 'will' | 'trust' | 'power_of_attorney' | 'healthcare_directive' | 'beneficiary_designation' | 'other'
          last_updated?: string | null
          attorney_name?: string
          attorney_contact?: string
          location?: string
          review_date?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_name?: string
          document_type?: 'will' | 'trust' | 'power_of_attorney' | 'healthcare_directive' | 'beneficiary_designation' | 'other'
          last_updated?: string | null
          attorney_name?: string
          attorney_contact?: string
          location?: string
          review_date?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin_activity_log: {
        Row: {
          id: string
          admin_user_id: string
          action_type: string
          target_type: string | null
          target_id: string | null
          action_details: Record<string, unknown>
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          admin_user_id: string
          action_type: string
          target_type?: string | null
          target_id?: string | null
          action_details?: Record<string, unknown>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          admin_user_id?: string
          action_type?: string
          target_type?: string | null
          target_id?: string | null
          action_details?: Record<string, unknown>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string | null
          setting_type: 'api_key' | 'feature_flag' | 'config' | 'limit'
          description: string | null
          is_sensitive: boolean | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string | null
          setting_type: 'api_key' | 'feature_flag' | 'config' | 'limit'
          description?: string | null
          is_sensitive?: boolean | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string | null
          setting_type?: 'api_key' | 'feature_flag' | 'config' | 'limit'
          description?: string | null
          is_sensitive?: boolean | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      app_features: {
        Row: {
          id: string
          feature_name: string
          display_name: string
          description: string
          category: string
          route_path: string | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          feature_name: string
          display_name: string
          description: string
          category: string
          route_path?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          feature_name?: string
          display_name?: string
          description?: string
          category?: string
          route_path?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      feature_tier_config: {
        Row: {
          id: string
          feature_name: string
          tier_id: string
          is_enabled: boolean | null
          prompt_limit: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          feature_name: string
          tier_id: string
          is_enabled?: boolean | null
          prompt_limit?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          feature_name?: string
          tier_id?: string
          is_enabled?: boolean | null
          prompt_limit?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      homepage_content: {
        Row: {
          id: string
          content_type: 'pricing_section' | 'hero_section' | 'features_section'
          content_data: Record<string, unknown>
          is_published: boolean | null
          version: number | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_type: 'pricing_section' | 'hero_section' | 'features_section'
          content_data?: Record<string, unknown>
          is_published?: boolean | null
          version?: number | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_type?: 'pricing_section' | 'hero_section' | 'features_section'
          content_data?: Record<string, unknown>
          is_published?: boolean | null
          version?: number | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      login_history: {
        Row: {
          id: string
          user_id: string
          login_at: string | null
          ip_address: string | null
          user_agent: string | null
          login_method: string | null
          success: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          login_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          login_method?: string | null
          success?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          login_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          login_method?: string | null
          success?: boolean | null
        }
      }
      system_backups: {
        Row: {
          id: string
          backup_name: string
          backup_type: 'full' | 'users' | 'transactions' | 'financial'
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          file_size_bytes: number | null
          backup_data: Record<string, unknown[]> | null
          record_count: number | null
          created_by: string | null
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          backup_name: string
          backup_type?: 'full' | 'users' | 'transactions' | 'financial'
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          file_size_bytes?: number | null
          backup_data?: Record<string, unknown[]> | null
          record_count?: number | null
          created_by?: string | null
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          backup_name?: string
          backup_type?: 'full' | 'users' | 'transactions' | 'financial'
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          file_size_bytes?: number | null
          backup_data?: Record<string, unknown[]> | null
          record_count?: number | null
          created_by?: string | null
          created_at?: string | null
          completed_at?: string | null
        }
      }
      blog_categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color?: string
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          is_active?: boolean
          created_at?: string | null
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          category_id: string
          target_keywords: string
          tags: string[] | null
          featured_image_url: string | null
          meta_description: string | null
          content: string | null
          excerpt: string | null
          status: 'draft' | 'scheduled' | 'published'
          auto_publish: boolean
          scheduled_publish_at: string | null
          published_at: string | null
          created_by: string | null
          updated_by: string | null
          view_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          category_id: string
          target_keywords?: string
          tags?: string[] | null
          featured_image_url?: string | null
          meta_description?: string | null
          content?: string | null
          excerpt?: string | null
          status?: 'draft' | 'scheduled' | 'published'
          auto_publish?: boolean
          scheduled_publish_at?: string | null
          published_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          view_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          category_id?: string
          target_keywords?: string
          tags?: string[] | null
          featured_image_url?: string | null
          meta_description?: string | null
          content?: string | null
          excerpt?: string | null
          status?: 'draft' | 'scheduled' | 'published'
          auto_publish?: boolean
          scheduled_publish_at?: string | null
          published_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          view_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      country_retirement_plans: {
        Row: {
          id: string
          country_code: string
          plan_1_name: string | null
          plan_1_description: string | null
          plan_2_name: string | null
          plan_2_description: string | null
          plan_3_name: string | null
          plan_3_description: string | null
          plan_4_name: string | null
          plan_4_description: string | null
          plan_5_name: string | null
          plan_5_description: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          country_code: string
          plan_1_name?: string | null
          plan_1_description?: string | null
          plan_2_name?: string | null
          plan_2_description?: string | null
          plan_3_name?: string | null
          plan_3_description?: string | null
          plan_4_name?: string | null
          plan_4_description?: string | null
          plan_5_name?: string | null
          plan_5_description?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          country_code?: string
          plan_1_name?: string | null
          plan_1_description?: string | null
          plan_2_name?: string | null
          plan_2_description?: string | null
          plan_3_name?: string | null
          plan_3_description?: string | null
          plan_4_name?: string | null
          plan_4_description?: string | null
          plan_5_name?: string | null
          plan_5_description?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      country_investment_plans: {
        Row: {
          id: string
          country_code: string
          plan_1_name: string | null
          plan_1_description: string | null
          plan_2_name: string | null
          plan_2_description: string | null
          plan_3_name: string | null
          plan_3_description: string | null
          plan_4_name: string | null
          plan_4_description: string | null
          plan_5_name: string | null
          plan_5_description: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          country_code: string
          plan_1_name?: string | null
          plan_1_description?: string | null
          plan_2_name?: string | null
          plan_2_description?: string | null
          plan_3_name?: string | null
          plan_3_description?: string | null
          plan_4_name?: string | null
          plan_4_description?: string | null
          plan_5_name?: string | null
          plan_5_description?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          country_code?: string
          plan_1_name?: string | null
          plan_1_description?: string | null
          plan_2_name?: string | null
          plan_2_description?: string | null
          plan_3_name?: string | null
          plan_3_description?: string | null
          plan_4_name?: string | null
          plan_4_description?: string | null
          plan_5_name?: string | null
          plan_5_description?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      feature_usage: {
        Row: {
          id: string
          user_id: string
          feature_name: string
          usage_month: string
          usage_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          feature_name: string
          usage_month: string
          usage_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          feature_name?: string
          usage_month?: string
          usage_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      seo_pages: {
        Row: {
          id: string
          page_key: string
          page_name: string
          page_path: string
          meta_title: string
          meta_description: string
          meta_keywords: string
          og_title: string
          og_description: string
          og_image_url: string
          twitter_title: string
          twitter_description: string
          twitter_image_url: string
          canonical_url: string
          structured_data: Record<string, unknown> | null
          is_indexable: boolean
          priority: number
          change_frequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_key: string
          page_name: string
          page_path: string
          meta_title?: string
          meta_description?: string
          meta_keywords?: string
          og_title?: string
          og_description?: string
          og_image_url?: string
          twitter_title?: string
          twitter_description?: string
          twitter_image_url?: string
          canonical_url?: string
          structured_data?: Record<string, unknown> | null
          is_indexable?: boolean
          priority?: number
          change_frequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_key?: string
          page_name?: string
          page_path?: string
          meta_title?: string
          meta_description?: string
          meta_keywords?: string
          og_title?: string
          og_description?: string
          og_image_url?: string
          twitter_title?: string
          twitter_description?: string
          twitter_image_url?: string
          canonical_url?: string
          structured_data?: Record<string, unknown> | null
          is_indexable?: boolean
          priority?: number
          change_frequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          alert_type: string
          template_name: string
          sender_email: string
          subject: string
          body_html: string
          footer: string
          is_active: boolean
          variables: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          alert_type: string
          template_name: string
          sender_email?: string
          subject?: string
          body_html?: string
          footer?: string
          is_active?: boolean
          variables?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          alert_type?: string
          template_name?: string
          sender_email?: string
          subject?: string
          body_html?: string
          footer?: string
          is_active?: boolean
          variables?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      currency_change_history: {
        Row: {
          id: string
          user_id: string
          from_currency: string
          to_currency: string
          exchange_rate: number
          changed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          from_currency: string
          to_currency: string
          exchange_rate?: number
          changed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          from_currency?: string
          to_currency?: string
          exchange_rate?: number
          changed_at?: string | null
        }
      }
      custom_payment_methods: {
        Row: {
          id: string
          user_id: string
          method_name: string
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          method_name: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          method_name?: string
          is_active?: boolean | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
