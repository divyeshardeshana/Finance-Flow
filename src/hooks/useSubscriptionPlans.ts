import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSubscriptionTiers, type PricingPlan } from '../lib/pricingHelpers';

interface UseSubscriptionPlansOptions {
  activeOnly?: boolean;
}

export function useSubscriptionPlans({ activeOnly = true }: UseSubscriptionPlansOptions = {}) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getSubscriptionTiers();
      setPlans(activeOnly ? data.filter(p => !p.comingSoon) : data);
    } catch (err) {
      console.error('useSubscriptionPlans load error:', err);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('subscription-tiers-public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_tiers' },
        () => { load(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_tier_config' },
        () => { load(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_features' },
        () => { load(); }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { plans, loading, error, reload: load };
}
