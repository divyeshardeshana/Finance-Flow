import { supabase } from './supabase';

export interface SubscriptionTier {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: string;
  annual_price: string;
  features: string[];
  max_goals: number;
  is_active: boolean;
  coming_soon: boolean;
  description?: string;
  cta_text?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  maxGoals: number;
  highlighted?: boolean;
  comingSoon: boolean;
  description: string;
  ctaText: string;
}

const FEATURE_DISPLAY_MAP: Record<string, string> = {
  'basic_transactions': 'Basic transaction tracking',
  'basic_budget': 'Budget management',
  'basic_reports': 'Monthly reports',
  'basic_investment': 'Basic investment tracking',
  'financial_assistant': 'AI financial assistant',
  'literacy_gamification': 'Financial literacy quiz',
  'bill_reminders': 'Bill Reminders',
  'split_transactions': 'Split transactions',
  'support_tickets': 'Priority support',
  'advanced_goals': 'Unlimited savings goals',
  'advanced_reports': 'Advanced analytics',
  'net_worth_tracker': 'Net worth tracking',
  'advanced_investments': 'Investment tracking',
  'retirement_planning': 'Retirement planning',
  'estate_planning': 'Estate planning tools',
};

const TIER_ORDER: Record<string, number> = {
  'free': 1,
  'paid': 2,
  'premium': 3,
};

const FREE_FEATURES = [
  'Basic Transactions',
  'Basic Budget',
  'Basic Reports',
  'Learning Challenges',
  'Bill Reminders',
];

const PAID_FEATURES = [
  'Free Features +',
  'AI Recommendations',
  'Split Transactions',
  'Advanced Goals',
  'Advanced Reports',
  'Priority Support',
];

const PREMIUM_FEATURES = [
  'Pro Features +',
  'Net Worth Tracker',
  'Advanced Investments',
  'Retirement Planning',
  'Financial Assistant',
  'Expense Predictions',
  'Stock Predictions',
];

export function mapFeaturesToDisplayNames(features: string[]): string[] {
  return features
    .map(feature => FEATURE_DISPLAY_MAP[feature] || feature)
    .filter(Boolean);
}

export function getDefaultFeaturesForTier(tierName: string): string[] {
  switch (tierName.toLowerCase()) {
    case 'free':
      return FREE_FEATURES;
    case 'paid':
      return PAID_FEATURES;
    case 'premium':
      return PREMIUM_FEATURES;
    default:
      return [];
  }
}

export async function getFeaturesForTier(tierId: string, tierName: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('feature_tier_config')
      .select(`
        feature_name,
        is_enabled,
        app_features (
          display_name,
          description,
          sort_order,
          category
        )
      `)
      .eq('tier_id', tierId)
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching features for tier:', error);
      return getDefaultFeaturesForTier(tierName);
    }

    if (!data || data.length === 0) {
      return getDefaultFeaturesForTier(tierName);
    }

    const features = data
      .filter(item => item.app_features)
      .map(item => {
        const feature = item.app_features as any;
        return {
          name: feature.display_name,
          sort_order: feature.sort_order,
          category: feature.category
        };
      })
      .sort((a, b) => {
        const categoryOrder: Record<string, number> = {
          'Core Features': 1,
          'AI Features': 2,
          'Premium Tools': 3,
          'Reports': 4,
          'Advanced Planning': 5,
          'Learning': 6,
          'Shopping Tools': 7,
          'Support': 8
        };

        const catCompare = (categoryOrder[a.category] || 999) - (categoryOrder[b.category] || 999);
        if (catCompare !== 0) return catCompare;

        return a.sort_order - b.sort_order;
      })
      .map(item => item.name);

    return features.length > 0 ? features : getDefaultFeaturesForTier(tierName);
  } catch (error) {
    console.error('Exception fetching features for tier:', error);
    return getDefaultFeaturesForTier(tierName);
  }
}

export function calculateAnnualDiscount(monthlyPrice: number, annualPrice: number): number {
  if (monthlyPrice === 0 || annualPrice === 0) return 0;
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - annualPrice;
  return Math.round((savings / monthlyTotal) * 100);
}

export function calculateMonthlySavings(monthlyPrice: number, annualPrice: number): number {
  if (monthlyPrice === 0 || annualPrice === 0) return 0;
  const monthlyTotal = monthlyPrice * 12;
  return monthlyTotal - annualPrice;
}

export async function getSubscriptionTiers(): Promise<PricingPlan[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price');

    if (error) {
      console.error('Error fetching subscription tiers:', error);
      return getDefaultPricingPlans();
    }

    if (!data || data.length === 0) {
      return getDefaultPricingPlans();
    }

    const sortedTiers = data.sort((a, b) => TIER_ORDER[a.tier_name] - TIER_ORDER[b.tier_name]);

    const defaultDescriptions: Record<string, string> = {
      free: 'Perfect for getting started',
      paid: 'For serious financial planning',
      premium: 'Complete financial management',
    };

    const plansWithFeatures = await Promise.all(
      sortedTiers.map(async (tier) => {
        const features = tier.features && tier.features.length > 0 && typeof tier.features[0] !== 'object'
          ? tier.features as string[]
          : await getFeaturesForTier(tier.id, tier.tier_name);
        return {
          id: tier.id,
          name: tier.tier_name,
          displayName: tier.display_name,
          monthlyPrice: parseFloat(tier.monthly_price),
          annualPrice: parseFloat(tier.annual_price),
          features,
          maxGoals: tier.max_goals,
          highlighted: tier.tier_name === 'paid',
          comingSoon: !!tier.coming_soon,
          description: tier.description || defaultDescriptions[tier.tier_name] || '',
          ctaText: tier.cta_text || 'Get Started',
        };
      })
    );

    return plansWithFeatures;
  } catch (error) {
    console.error('Exception fetching subscription tiers:', error);
    return getDefaultPricingPlans();
  }
}

export function getDefaultPricingPlans(): PricingPlan[] {
  return [
    {
      id: 'free',
      name: 'free',
      displayName: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: FREE_FEATURES,
      maxGoals: 3,
      comingSoon: false,
      description: 'Perfect for getting started',
      ctaText: 'Get Started',
    },
    {
      id: 'paid',
      name: 'paid',
      displayName: 'Pro',
      monthlyPrice: 9,
      annualPrice: 99,
      features: PAID_FEATURES,
      maxGoals: 10,
      highlighted: true,
      comingSoon: false,
      description: 'For serious financial planning',
      ctaText: 'Get Started',
    },
    {
      id: 'premium',
      name: 'premium',
      displayName: 'Premium',
      monthlyPrice: 19,
      annualPrice: 199,
      features: PREMIUM_FEATURES,
      maxGoals: 10,
      comingSoon: false,
      description: 'Complete financial management',
      ctaText: 'Get Started',
    },
  ];
}
