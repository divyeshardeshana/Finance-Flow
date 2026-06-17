import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Check, Calendar, Shield, Target, Clock,
  CheckCircle, XCircle, AlertCircle, Zap, CreditCard,
  AlertTriangle, RefreshCw, TrendingUp, BarChart3, Star,
  Layers, Activity, Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency } from '../../lib/currency';
import { clsx } from 'clsx';
import { ui } from './SubscriptionDetailsHelpers';
import type { EnabledFeature } from './SubscriptionDetailsHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionTierData {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
  max_goals: number;
  is_active: boolean;
  coming_soon: boolean;
  description: string | null;
}

interface SubscriptionRecord {
  id: string;
  status: string;
  billing_cycle: string | null;
  start_date: string;
  next_billing_date: string | null;
  cancelled_at: string | null;
  auto_renew: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  tier: SubscriptionTierData | null;
}

interface UsageData {
  goals: { used: number; limit: number };
  transactions: { used: number };
  categories: { used: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_ORDER: Record<string, number> = { free: 0, paid: 1, premium: 2 };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',                 icon: XCircle },
  past_due:  { label: 'Past Due',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',         icon: AlertCircle },
  trialing:  { label: 'Trial',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',             icon: Clock },
  paused:    { label: 'Paused',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',             icon: Clock },
};

const TIER_ICON: Record<string, React.ElementType> = {
  free:    Shield,
  paid:    Zap,
  premium: Crown,
};

const TIER_COLORS: Record<string, { badge: string; accent: string; ring: string }> = {
  free:    { badge: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400 border-gray-200 dark:border-white/[0.08]', accent: 'text-gray-500', ring: 'border-gray-200 dark:border-white/[0.08]' },
  paid:    { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',    accent: 'text-blue-500', ring: 'border-blue-300 dark:border-blue-500/30' },
  premium: { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', accent: 'text-amber-500', ring: 'border-amber-300 dark:border-amber-500/30' },
};

const CATEGORY_ORDER: Record<string, number> = {
  'Core Features':      1,
  'AI Features':        2,
  'Premium Tools':      3,
  'Reports':            4,
  'Advanced Planning':  5,
  'Learning':           6,
  'Shopping Tools':     7,
  'Support':            8,
};

function fmt(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const cardClass = 'bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubscriptionDetailsPage() {
  const { user } = useAuth();
  const { currency } = useAppPreferences();

  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [features, setFeatures] = useState<EnabledFeature[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: subRow, error: subErr } = await supabase
        .from('user_subscriptions')
        .select(`
          id, status, billing_cycle, start_date, next_billing_date,
          cancelled_at, auto_renew, stripe_subscription_id, stripe_customer_id,
          subscription_tiers!tier_id(
            id, tier_name, display_name, monthly_price, annual_price,
            features, max_goals, is_active, coming_soon, description
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (subErr) throw subErr;

      if (subRow) {
        const tierRaw = subRow.subscription_tiers as SubscriptionTierData | null;
        setSubscription({ ...subRow, tier: tierRaw });
      } else {
        const { data: freeTier } = await supabase
          .from('subscription_tiers')
          .select('id, tier_name, display_name, monthly_price, annual_price, features, max_goals, is_active, coming_soon, description')
          .eq('tier_name', 'free')
          .maybeSingle();

        setSubscription({
          id: '',
          status: 'active',
          billing_cycle: null,
          start_date: user.created_at || new Date().toISOString(),
          next_billing_date: null,
          cancelled_at: null,
          auto_renew: false,
          stripe_subscription_id: null,
          stripe_customer_id: null,
          tier: freeTier || null,
        });
      }

      const tierName = (subRow?.subscription_tiers as SubscriptionTierData | null)?.tier_name || 'free';
      const userLevel = TIER_ORDER[tierName] ?? 0;

      const { data: allTiers } = await supabase
        .from('subscription_tiers')
        .select('id, tier_name')
        .eq('is_active', true);

      const eligibleIds = (allTiers || [])
        .filter(t => (TIER_ORDER[t.tier_name] ?? 0) <= userLevel)
        .map(t => t.id);

      if (eligibleIds.length > 0) {
        const { data: configs } = await supabase
          .from('feature_tier_config')
          .select(`
            feature_name, is_enabled,
            app_features!feature_name(display_name, description, category, sort_order)
          `)
          .in('tier_id', eligibleIds)
          .eq('is_enabled', true);

        const seen = new Set<string>();
        const featureList: EnabledFeature[] = [];
        for (const c of (configs || [])) {
          if (seen.has(c.feature_name)) continue;
          seen.add(c.feature_name);
          const af = c.app_features as { display_name: string; description: string; category: string; sort_order: number } | null;
          if (af) {
            featureList.push({
              feature_name: c.feature_name,
              display_name: af.display_name,
              description: af.description,
              category: af.category,
              sort_order: af.sort_order,
            });
          }
        }

        featureList.sort((a, b) => {
          const ca = CATEGORY_ORDER[a.category] ?? 99;
          const cb = CATEGORY_ORDER[b.category] ?? 99;
          return ca !== cb ? ca - cb : a.sort_order - b.sort_order;
        });

        setFeatures(featureList);
      } else {
        setFeatures([]);
      }

      const [goalsRes, categoriesRes, txRes] = await Promise.all([
        supabase.from('savings_goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('budget_categories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('date', startOfMonth),
      ]);

      const maxGoals = (subRow?.subscription_tiers as SubscriptionTierData | null)?.max_goals ?? 3;
      setUsage({
        goals:        { used: goalsRes.count ?? 0,       limit: maxGoals },
        transactions: { used: txRes.count ?? 0 },
        categories:   { used: categoriesRes.count ?? 0 },
      });

      setLastSynced(new Date());
    } catch (err) {
      console.error('SubscriptionDetailsPage load error:', err);
      setError('Failed to load subscription data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`sub-details-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${user.id}` }, () => { loadAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_tiers' }, () => { loadAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_tier_config' }, () => { loadAll(); })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, loadAll]);

  const tier = subscription?.tier;
  const tierName = tier?.tier_name || 'free';
  const tierColors = TIER_COLORS[tierName] || TIER_COLORS.free;
  const TierIcon = TIER_ICON[tierName] || Shield;
  const status = subscription?.status || 'active';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const isFree = tierName === 'free';
  const isPremium = tierName === 'premium';
  const billingCycle = subscription?.billing_cycle;
  const price = billingCycle === 'annual'
    ? (tier?.annual_price ?? 0) / 12
    : (tier?.monthly_price ?? 0);

  const featuresByCategory: Record<string, EnabledFeature[]> = {};
  for (const f of features) {
    (featuresByCategory[f.category] ??= []).push(f);
  }
  const sortedCategories = Object.keys(featuresByCategory).sort(
    (a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99)
  );

  if (loading) return <ui.loadingSkeleton cardClass={cardClass} />;

  if (error) {
    return (
      <div className={clsx(cardClass, 'p-8 flex flex-col items-center gap-3 text-center')}>
        <AlertTriangle size={28} className="text-amber-500" />
        <p className="text-[14px] text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={() => { setLoading(true); loadAll(); }}
          className="mt-1 px-4 py-2 rounded-xl text-[13px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight">
            Subscription Details
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-500 mt-0.5">
            Your current plan and usage - synced live from the admin panel
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-600 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Plan Overview */}
      <div className={clsx(cardClass, 'p-6')}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Plan Overview
          </h2>
          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', statusCfg.color)}>
            <StatusIcon size={11} />
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className={clsx('w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0', tierColors.badge, tierColors.ring)}>
            <TierIcon size={20} className={tierColors.accent} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">
                {tier?.display_name || 'Free Plan'}
              </h3>
              <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize', tierColors.badge)}>
                {tier?.tier_name || 'free'}
              </span>
            </div>
            {tier?.description && (
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{tier.description}</p>
            )}
            <div className="flex items-baseline gap-1 mt-2">
              {isFree ? (
                <span className="text-[22px] font-extrabold text-gray-900 dark:text-white">Free</span>
              ) : (
                <>
                  <span className="text-[22px] font-extrabold text-gray-900 dark:text-white">
                    {formatCurrency(price, currency)}
                  </span>
                  <span className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">/month</span>
                  {billingCycle === 'annual' && tier?.annual_price && (
                    <span className="ml-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ({formatCurrency(tier.annual_price, currency)}/yr)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ui.metricTile icon={Calendar} label="Start Date" value={fmt(subscription?.start_date || null)} />
          <ui.metricTile
            icon={TrendingUp}
            label={subscription?.cancelled_at ? 'Cancelled' : 'Next Renewal'}
            value={subscription?.cancelled_at ? fmt(subscription.cancelled_at) : fmt(subscription?.next_billing_date || null)}
            highlight={!subscription?.cancelled_at && !!subscription?.next_billing_date}
          />
          <ui.metricTile icon={RefreshCw} label="Billing Cycle" value={billingCycle ? (billingCycle === 'annual' ? 'Annual' : 'Monthly') : '-'} />
          <ui.metricTile
            icon={subscription?.auto_renew ? CheckCircle : XCircle}
            label="Auto-Renew"
            value={isFree ? '-' : subscription?.auto_renew ? 'On' : 'Off'}
            valueColor={isFree ? undefined : subscription?.auto_renew ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}
          />
        </div>

        <AnimatePresence>
          {subscription?.cancelled_at && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/[0.07] border border-amber-200 dark:border-amber-500/20 rounded-xl text-[13px] text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Your subscription was cancelled on {fmt(subscription.cancelled_at)}.
                {subscription.next_billing_date && ` Access continues until ${fmt(subscription.next_billing_date)}.`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Usage + Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={clsx(cardClass, 'p-6')}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={15} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Usage Limits</h2>
          </div>
          {usage ? (
            <div className="space-y-5">
              <ui.usageBar label="Savings Goals" used={usage.goals.used} limit={usage.goals.limit} unlimited={isPremium} />
              <ui.usageBar label="Transactions (this month)" used={usage.transactions.used} limit={0} unlimited={true} />
              <ui.usageBar label="Budget Categories" used={usage.categories.used} limit={0} unlimited={true} />
              <div className="pt-3 border-t border-gray-100 dark:border-white/[0.05] space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500 dark:text-gray-400">Max Savings Goals</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{isPremium ? 'Unlimited' : tier?.max_goals ?? 3}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500 dark:text-gray-400">Plan tier level</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{tierName}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <ui.skeleton key={i} className="h-8" />)}</div>
          )}
        </div>

        <div className={clsx(cardClass, 'p-6 flex flex-col')}>
          <div className="flex items-center gap-2 mb-5">
            <Star size={15} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Features Included</h2>
            <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              {features.length} features
            </span>
          </div>
          {features.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2 text-center">
              <Lock size={20} className="text-gray-300 dark:text-gray-600" />
              <p className="text-[13px] text-gray-400 dark:text-gray-600">No features configured for this plan.</p>
            </div>
          ) : (
            <div className="space-y-5 overflow-y-auto max-h-[340px] pr-1">
              {sortedCategories.map(cat => (
                <ui.featureGroup key={cat} category={cat} features={featuresByCategory[cat]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className={clsx(cardClass, 'p-6')}>
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={15} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Payment Method</h2>
        </div>
        {isFree || !subscription?.stripe_subscription_id ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center">
              <CreditCard size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-[14px] text-gray-700 dark:text-gray-300 font-medium">No payment method</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">
                {isFree ? 'Free plan - no billing required.' : 'Payment details managed via Stripe.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ui.paymentTile icon={CreditCard} label="Payment via" value="Stripe" />
            <ui.paymentTile icon={Activity} label="Billing Cycle" value={billingCycle === 'annual' ? 'Annual' : 'Monthly'} />
            <ui.paymentTile icon={Layers} label="Customer ID" value={subscription.stripe_customer_id ? `${subscription.stripe_customer_id.slice(0, 14)}…` : '-'} mono />
          </div>
        )}
        {!isFree && subscription?.stripe_subscription_id && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.05] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-[12px] text-gray-400 dark:text-gray-500">
              Payment details are securely stored and managed by Stripe. To update your card, contact support.
            </p>
          </div>
        )}
      </div>

      {/* Subscription IDs */}
      {subscription?.stripe_subscription_id && (
        <div className={clsx(cardClass, 'px-5 py-3')}>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <ui.idField label="Subscription ID" value={subscription.stripe_subscription_id} />
            {subscription.stripe_customer_id && (
              <ui.idField label="Customer ID" value={subscription.stripe_customer_id} />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
