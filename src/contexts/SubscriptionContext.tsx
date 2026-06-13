import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  SubscriptionTier,
  getRemainingGoalLimit,
  logFeatureAccess,
} from '../lib/subscriptionHelpers';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  planDisplayName: string | null;
  loading: boolean;
  hasFeatureAccess: (featureName: string) => boolean;
  checkAndLogAccess: (featureName: string) => Promise<boolean>;
  getRemainingGoalLimit: () => Promise<{ used: number; limit: number; remaining: number }>;
  showUpgradePrompt: (featureName: string) => void;
  upgradePromptFeature: string | null;
  closeUpgradePrompt: () => void;
  refreshSubscription: () => Promise<void>;
  showAccessDenied: (featureName: string, requiredTier: SubscriptionTier) => void;
  accessDeniedState: { featureName: string; requiredTier: SubscriptionTier } | null;
  closeAccessDenied: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [planDisplayName, setPlanDisplayName] = useState<string | null>(null);
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [upgradePromptFeature, setUpgradePromptFeature] = useState<string | null>(null);
  const [accessDeniedState, setAccessDeniedState] = useState<{ featureName: string; requiredTier: SubscriptionTier } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setTier('free');
      setPlanDisplayName(null);
      setEnabledFeatures(new Set());
      setLoading(false);
      return;
    }

    try {
      // Load tier from active subscription, fall back to user profile
      let resolvedTier: SubscriptionTier = 'free';
      let resolvedDisplayName: string | null = null;
      let resolvedTierId: string | null = null;

      const { data: activeSub } = await supabase
        .from('user_subscriptions')
        .select('tier, tier_id, subscription_tiers!tier_id(tier_name, display_name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeSub) {
        const tierInfo = activeSub.subscription_tiers as { tier_name: string; display_name: string } | null;
        const tierName = tierInfo?.tier_name || activeSub.tier;
        if (tierName && ['free', 'paid', 'premium'].includes(tierName)) {
          resolvedTier = tierName as SubscriptionTier;
          resolvedDisplayName = tierInfo?.display_name || null;
          resolvedTierId = activeSub.tier_id;
        }
      }

      // Fall back to user_profiles when subscription record still shows free
      // (covers the window between webhook firing and DB write completing)
      if (resolvedTier === 'free') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .maybeSingle();

        const profileTier = (profile?.subscription_tier as SubscriptionTier) || 'free';
        if (profileTier !== 'free') {
          resolvedTier = profileTier;
          resolvedTierId = null; // will be resolved below
        }
      }

      // Resolve tier_id if we don't have it yet
      if (!resolvedTierId) {
        const { data: tierRow } = await supabase
          .from('subscription_tiers')
          .select('id, display_name')
          .eq('tier_name', resolvedTier)
          .maybeSingle();
        resolvedTierId = tierRow?.id || null;
        if (!resolvedDisplayName) resolvedDisplayName = tierRow?.display_name || null;
      }

      setTier(resolvedTier);
      setPlanDisplayName(resolvedDisplayName);

      // Load enabled features from feature_tier_config for this tier
      // A feature is accessible if it is enabled for the user's tier OR any lower tier
      // (i.e., free features are also accessible to paid/premium users)
      const tierOrder: Record<SubscriptionTier, number> = { free: 0, paid: 1, premium: 2 };
      const userTierLevel = tierOrder[resolvedTier];

      const { data: allTiers } = await supabase
        .from('subscription_tiers')
        .select('id, tier_name')
        .eq('is_active', true);

      const eligibleTierIds = (allTiers || [])
        .filter(t => tierOrder[t.tier_name as SubscriptionTier] <= userTierLevel)
        .map(t => t.id);

      if (eligibleTierIds.length > 0) {
        const { data: configs } = await supabase
          .from('feature_tier_config')
          .select('feature_name, is_enabled')
          .in('tier_id', eligibleTierIds)
          .eq('is_enabled', true);

        const featureSet = new Set((configs || []).map(c => c.feature_name));
        setEnabledFeatures(featureSet);
      } else {
        setEnabledFeatures(new Set());
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setTier('free');
      setPlanDisplayName(null);
      setEnabledFeatures(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Realtime: re-load whenever subscription tiers or feature config changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`subscription-context-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_tiers' },
        () => { loadSubscription(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_tier_config' },
        () => { loadSubscription(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${user.id}` },
        () => { loadSubscription(); }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, loadSubscription]);

  const hasFeatureAccessCheck = (featureName: string): boolean => {
    if (loading) return false;
    return enabledFeatures.has(featureName);
  };

  const checkAndLogAccess = async (featureName: string): Promise<boolean> => {
    if (!user) return false;
    const hasAccess = enabledFeatures.has(featureName);

    await logFeatureAccess(user.id, featureName, hasAccess, tier);

    if (!hasAccess) {
      setUpgradePromptFeature(featureName);
    }
    return hasAccess;
  };

  const showUpgradePrompt = (featureName: string) => {
    setUpgradePromptFeature(featureName);
  };

  const closeUpgradePrompt = () => {
    setUpgradePromptFeature(null);
  };

  const getGoalLimit = async () => {
    if (!user) return { used: 0, limit: 3, remaining: 3 };
    return await getRemainingGoalLimit(user.id);
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const showAccessDenied = (featureName: string, requiredTier: SubscriptionTier) => {
    setAccessDeniedState({ featureName, requiredTier });
  };

  const closeAccessDenied = () => {
    setAccessDeniedState(null);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        planDisplayName,
        loading,
        hasFeatureAccess: hasFeatureAccessCheck,
        checkAndLogAccess,
        getRemainingGoalLimit: getGoalLimit,
        showUpgradePrompt,
        upgradePromptFeature,
        closeUpgradePrompt,
        refreshSubscription,
        showAccessDenied,
        accessDeniedState,
        closeAccessDenied,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
