import { supabase } from './supabase';

export type SubscriptionTier = 'free' | 'paid' | 'premium';

export interface FeatureAccess {
  hasAccess: boolean;
  tier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  featureName: string;
}

const featureTierMap: Record<string, SubscriptionTier> = {
  basic_transactions: 'free',
  basic_budget: 'free',
  basic_reports: 'free',
  basic_investment: 'free',
  literacy_gamification: 'free',

  financial_assistant: 'paid',
  expense_prediction: 'paid',
  ai_recommendations: 'paid',
  price_comparison: 'paid',
  bill_reminders: 'paid',
  split_transactions: 'paid',
  support_tickets: 'paid',
  advanced_goals: 'paid',
  advanced_reports: 'paid',
  email_alerts: 'paid',

  stock_prediction: 'premium',
  net_worth_tracker: 'premium',
  advanced_investments: 'premium',
  retirement_planning: 'premium',
  estate_planning: 'premium',
};

const tierHierarchy: Record<SubscriptionTier, number> = {
  free: 0,
  paid: 1,
  premium: 2,
};

export function hasFeatureAccess(
  userTier: SubscriptionTier,
  featureName: string
): FeatureAccess {
  const requiredTier = featureTierMap[featureName] || 'free';
  const hasAccess = tierHierarchy[userTier] >= tierHierarchy[requiredTier];

  return {
    hasAccess,
    tier: userTier,
    requiredTier,
    featureName,
  };
}

export async function getUserSubscription(userId: string) {
  const { data: activeSub } = await supabase
    .from('user_subscriptions')
    .select('tier, subscription_tiers!tier_id(tier_name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (activeSub) {
    const tierName = activeSub.tier
      || (activeSub.subscription_tiers as { tier_name: string } | null)?.tier_name;
    if (tierName && ['free', 'paid', 'premium'].includes(tierName)) {
      return tierName as SubscriptionTier;
    }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle();

  return (profile?.subscription_tier as SubscriptionTier) || 'free';
}

export async function getSubscriptionTiers() {
  const { data } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price');

  return data || [];
}

export async function logFeatureAccess(
  userId: string,
  featureName: string,
  allowed: boolean,
  tierRequired: SubscriptionTier
) {
  await supabase.from('feature_access_log').insert({
    user_id: userId,
    feature_name: featureName,
    allowed,
    tier_required: tierRequired,
  });
}

export async function getRemainingGoalLimit(userId: string): Promise<{ used: number; limit: number; remaining: number }> {
  const userTier = await getUserSubscription(userId);

  const { data: tierData } = await supabase
    .from('subscription_tiers')
    .select('max_goals')
    .eq('tier_name', userTier)
    .maybeSingle();

  const limit = tierData?.max_goals || 3;

  const { count } = await supabase
    .from('savings_goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  return { used, limit, remaining };
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'Free Plan',
    paid: 'Paid Plan',
    premium: 'Premium Plan',
  };
  return names[tier];
}

export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    free: 'text-gray-600',
    paid: 'text-blue-600',
    premium: 'text-purple-600',
  };
  return colors[tier];
}

export function getTierBadgeColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    free: 'bg-gray-100 text-gray-800',
    paid: 'bg-blue-100 text-blue-800',
    premium: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  };
  return colors[tier];
}
