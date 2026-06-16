import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Check, Calendar, TrendingUp, Zap, Shield, Target, Clock,
  CheckCircle, XCircle, AlertCircle, BarChart3, Receipt, ArrowRight,
  RefreshCw, Download, Loader2, CreditCard, AlertTriangle, Info,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency } from '../../lib/currency';

interface SubscriptionPlan {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
  is_active: boolean;
  coming_soon: boolean;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
}

interface UserSubscription {
  id: string;
  tier: string;
  tier_name?: string;
  display_name?: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  next_billing_date: string | null;
  billing_cycle: string | null;
  stripe_subscription_id: string | null;
  cancelled_at: string | null;
}

interface BillingRecord {
  id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_url: string | null;
  invoice_pdf: string | null;
  payment_date: string | null;
  plan_name: string | null;
  billing_cycle: string | null;
  created_at: string;
}

interface UsageStats {
  goalsCount: number;
  categoriesCount: number;
  transactionsThisMonth: number;
}

interface StripeEnvironment {
  isTest: boolean;
  loaded: boolean;
  secretKeyConfigured: boolean;
}

interface SubscriptionManagementPageProps {
  defaultSection?: 'overview' | 'plans' | 'billing' | 'usage';
}

const cardClass =
  'bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl';

export function SubscriptionManagementPage({ defaultSection = 'overview' }: SubscriptionManagementPageProps = {}) {
  const { user } = useAuth();
  const { currency } = useAppPreferences();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({ goalsCount: 0, categoriesCount: 0, transactionsThisMonth: 0 });
  const [activeSection, setActiveSection] = useState<'overview' | 'plans' | 'billing' | 'usage'>(defaultSection);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeEnv, setStripeEnv] = useState<StripeEnvironment>({ isTest: true, loaded: false, secretKeyConfigured: false });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [downgradingToFree, setDowngradingToFree] = useState(false);
  const [downgradeError, setDowngradeError] = useState<string | null>(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [plansRes, subRes, billingRes, goalsRes, categoriesRes, transactionsRes, stripeSettingsRes] = await Promise.all([
        supabase.from('subscription_tiers').select('*').eq('is_active', true).order('monthly_price'),
        supabase
          .from('user_subscriptions')
          .select(`
            id, status, start_date, end_date, auto_renew, next_billing_date, billing_cycle,
            stripe_subscription_id, cancelled_at,
            subscription_tiers!tier_id(tier_name, display_name)
          `)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('billing_history')
          .select('*')
          .eq('user_id', user.id)
          .order('payment_date', { ascending: false })
          .limit(50),
        supabase.from('savings_goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('budget_categories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('date', startOfMonth),
        supabase.from('system_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['stripe_environment', 'stripe_configured']),
      ]);

      setPlans(plansRes.data || []);

      if (subRes.data) {
        const tierInfo = subRes.data.subscription_tiers as { tier_name: string; display_name: string } | null;
        setCurrentSubscription({
          ...subRes.data,
          tier: tierInfo?.tier_name || 'free',
          tier_name: tierInfo?.tier_name,
          display_name: tierInfo?.display_name,
        });
      } else {
        setCurrentSubscription(null);
      }

      setBillingHistory(billingRes.data || []);

      setUsageStats({
        goalsCount: goalsRes.count ?? 0,
        categoriesCount: categoriesRes.count ?? 0,
        transactionsThisMonth: transactionsRes.count ?? 0,
      });

      const stripeMap: Record<string, string> = {};
      for (const s of stripeSettingsRes.data ?? []) {
        stripeMap[s.setting_key] = s.setting_value ?? '';
      }
      const envValue = stripeMap['stripe_environment'] ?? 'test';
      const secretKeyConfigured = stripeMap['stripe_configured'] === 'true';
      setStripeEnv({ isTest: envValue !== 'production', loaded: true, secretKeyConfigured });
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`sub-mgmt-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${user.id}` }, () => { loadData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_tiers' }, () => { loadData(); })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription-from-stripe`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({}),
          }
        );
      }
    } catch {
    }
    await loadData();
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!user) return;
    setUpgradeError(null);
    setUpgradingPlanId(plan.id);

    if (!stripeEnv.secretKeyConfigured) {
      setUpgradeError('Payments are not yet enabled. Please contact an administrator to configure Stripe.');
      setUpgradingPlanId(null);
      return;
    }

    const priceId = billingCycle === 'annual' ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;
    if (!priceId) {
      setUpgradeError(`The ${plan.display_name} price has not been configured yet. Please contact support.`);
      setUpgradingPlanId(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUpgradeError('Not authenticated. Please sign in again.');
        setUpgradingPlanId(null);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            planId: plan.id,
            billingCycle,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || !result.url) {
        setUpgradeError(result.error || 'Failed to create checkout session. Please try again.');
        setUpgradingPlanId(null);
        return;
      }

      window.location.href = result.url;
    } catch {
      setUpgradeError('Network error. Please try again.');
      setUpgradingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    setCancelError(null);
    setCancellingSubscription(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCancelError('Not authenticated.');
        setCancellingSubscription(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setCancelError(result.error || 'Failed to cancel subscription.');
        setCancellingSubscription(false);
        return;
      }

      setShowCancelConfirm(false);
      await loadData();
    } catch {
      setCancelError('Network error. Please try again.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!user) return;
    setDowngradeError(null);
    setDowngradingToFree(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDowngradeError('Not authenticated.');
        setDowngradingToFree(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/downgrade-to-free`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setDowngradeError(result.error || 'Failed to downgrade subscription.');
        setDowngradingToFree(false);
        return;
      }

      setShowDowngradeConfirm(false);
      await loadData();
    } catch {
      setDowngradeError('Network error. Please try again.');
    } finally {
      setDowngradingToFree(false);
    }
  };

  const getPlanIcon = (tierName: string) => {
    if (tierName.toLowerCase().includes('premium')) return <Crown className="w-5 h-5" />;
    if (tierName.toLowerCase().includes('pro') || tierName.toLowerCase().includes('paid')) return <Zap className="w-5 h-5" />;
    return <Shield className="w-5 h-5" />;
  };

  const getPlanGradient = (tierName: string) => {
    if (tierName.toLowerCase().includes('premium')) return 'from-amber-500 to-orange-500';
    if (tierName.toLowerCase().includes('pro') || tierName.toLowerCase().includes('paid')) return 'from-blue-500 to-blue-600';
    return 'from-gray-500 to-gray-600';
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
      active: { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-500/15', text: 'text-red-700 dark:text-red-400', icon: XCircle },
      expired: { bg: 'bg-gray-100 dark:bg-white/[0.06]', text: 'text-gray-600 dark:text-gray-400', icon: Clock },
      past_due: { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
      trial: { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400', icon: Clock },
    };
    return map[status] || map.active;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getInvoiceStatusStyle = (status: string) => {
    if (status === 'paid') return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    if (status === 'open') return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400';
    return 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Crown },
    { id: 'plans', label: 'Plans', icon: Target },
    { id: 'billing', label: 'Billing History', icon: Receipt },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
  ] as const;

  const currentTier = currentSubscription?.tier || 'free';
  const currentPlanName = currentSubscription?.display_name
    || plans.find(p => p.tier_name === currentTier)?.display_name
    || currentTier;
  const isPaidSubscription = currentSubscription?.stripe_subscription_id && currentSubscription.status !== 'cancelled';

  const maxAnnualSavingsPct = (() => {
    const paid = plans.filter(p => p.monthly_price > 0);
    if (paid.length === 0) return 15;
    return Math.max(...paid.map(p => {
      const m12 = p.monthly_price * 12;
      return m12 > 0 ? Math.round((m12 - p.annual_price) / m12 * 100) : 0;
    })) || 15;
  })();

  return (
    <div className="space-y-6">
      {stripeEnv.loaded && stripeEnv.isTest && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600/40 rounded-xl">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Test Mode Active</span> — Use test card{' '}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-xs">4242 4242 4242 4242</code>{' '}
            with any future expiry and any 3-digit CVC.
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Subscription</h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">Manage your plan and billing</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.07] rounded-xl hover:border-gray-300 dark:hover:border-white/[0.12] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex border-b border-gray-200/80 dark:border-white/[0.06] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'billing' && billingHistory.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
                    {billingHistory.length}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-5">
              {currentSubscription && currentSubscription.status !== 'cancelled' ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/[0.08] p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-500/10 pointer-events-none" />
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{currentPlanName} Plan</h2>
                          <StatusBadge status={currentSubscription.status} />
                        </div>
                      </div>
                      {isPaidSubscription && currentSubscription.status === 'active' && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setShowDowngradeConfirm(true)}
                            className="px-3 py-1.5 text-[12px] font-medium text-gray-400 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Downgrade to Free
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="px-3 py-1.5 text-[12px] font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            {currentSubscription.auto_renew ? 'Cancel Subscription' : 'Subscription Cancelling'}
                          </button>
                        </div>
                      )}
                    </div>

                    {!currentSubscription.auto_renew && currentSubscription.next_billing_date && (
                      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-[12px] font-medium text-amber-200">
                          Your subscription will end at the end of the billing period ({new Date(currentSubscription.next_billing_date).toLocaleDateString()}).
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/[0.06] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Start Date</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {new Date(currentSubscription.start_date).toLocaleDateString()}
                        </p>
                      </div>

                      {currentSubscription.billing_cycle && (
                        <div className="bg-white/[0.06] rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CreditCard className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Billing</span>
                          </div>
                          <p className="text-sm font-semibold text-white capitalize">
                            {currentSubscription.billing_cycle}
                          </p>
                        </div>
                      )}

                      {currentSubscription.next_billing_date && currentSubscription.auto_renew && (
                        <div className="bg-white/[0.06] rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <RefreshCw className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Next Bill</span>
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="bg-white/[0.06] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Auto-Renew</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {currentSubscription.auto_renew ? 'On' : 'Off'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-1.5">Free Plan</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                    Upgrade to unlock premium features and get the most out of FinanceFlow.
                  </p>
                  <button
                    onClick={() => setActiveSection('plans')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-500/20"
                  >
                    View Plans
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Cancel Subscription?</h3>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-5">
                      Your subscription will end at the end of the billing period. You will retain access until then.
                    </p>
                    {cancelError && (
                      <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700 dark:text-red-400">
                        <XCircle size={15} className="flex-shrink-0 mt-0.5" />
                        {cancelError}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowCancelConfirm(false); setCancelError(null); }}
                        className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Keep Plan
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {cancellingSubscription ? <><Loader2 size={14} className="animate-spin" /> Cancelling...</> : 'Cancel Subscription'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showDowngradeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Downgrade to Free?</h3>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400">You will lose access to premium features.</p>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-5">
                      Your subscription will be cancelled immediately and your plan will revert to Free. This action cannot be undone.
                    </p>
                    {downgradeError && (
                      <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700 dark:text-red-400">
                        <XCircle size={15} className="flex-shrink-0 mt-0.5" />
                        {downgradeError}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDowngradeConfirm(false); setDowngradeError(null); }}
                        className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Keep Plan
                      </button>
                      <button
                        onClick={handleDowngradeToFree}
                        disabled={downgradingToFree}
                        className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {downgradingToFree ? <><Loader2 size={14} className="animate-spin" /> Downgrading...</> : 'Downgrade to Free'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={`${cardClass} p-5`}>
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-4">Plan Features</p>
                {(() => {
                  const activePlan = plans.find(p => p.tier_name === currentTier) || plans.find(p => p.tier_name === 'free');
                  if (!activePlan) return <p className="text-[13px] text-gray-500 dark:text-gray-400">No plan features available.</p>;
                  return (
                    <ul className="space-y-2">
                      {activePlan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-[13px] text-gray-600 dark:text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            </div>
          )}

          {activeSection === 'plans' && (() => {
            const tierOrder: Record<string, number> = { free: 0, paid: 1, premium: 2 };
            const getActionType = (targetTierName: string): 'current' | 'upgrade' | 'downgrade' => {
              const curr = tierOrder[currentTier] ?? 0;
              const tgt = tierOrder[targetTierName] ?? 0;
              if (curr === tgt) return 'current';
              return tgt > curr ? 'upgrade' : 'downgrade';
            };

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-white">Available Plans</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Choose the plan that fits your needs.</p>
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1 gap-1">
                    {(['monthly', 'annual'] as const).map((cycle) => (
                      <button
                        key={cycle}
                        onClick={() => setBillingCycle(cycle)}
                        className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                          billingCycle === cycle
                            ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                        {cycle === 'annual' && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400 text-[10px]">Save {maxAnnualSavingsPct}%</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {upgradeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400"
                    >
                      <XCircle size={15} className="flex-shrink-0 mt-0.5" />
                      <span>{upgradeError}</span>
                      <button onClick={() => setUpgradeError(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100">
                        <XCircle size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {plans.map((plan, planIdx) => {
                    const isCurrentPlan = currentTier === plan.tier_name;
                    const isFree = plan.tier_name.toLowerCase() === 'free';
                    const isPro = plan.tier_name.toLowerCase() === 'paid';
                    const isUpgrading = upgradingPlanId === plan.id;
                    const hasPriceId = billingCycle === 'annual' ? !!plan.stripe_price_id_annual : !!plan.stripe_price_id_monthly;
                    const actionType = getActionType(plan.tier_name);
                    // coming_soon is now a first-class DB flag — not inferred from Stripe config
                    const isComingSoon = !!plan.coming_soon;
                    const price = billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;

                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: planIdx * 0.07 }}
                        className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                          isCurrentPlan
                            ? 'border-emerald-400/60 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/[0.04] shadow-sm'
                            : isPro && !isCurrentPlan
                            ? 'border-blue-400/50 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/[0.03] shadow-sm shadow-blue-500/10'
                            : 'border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]'
                        }`}
                      >
                        {/* Top badges row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
                            plan.tier_name === 'premium'
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                              : plan.tier_name === 'paid'
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                              : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/[0.08]'
                          }`}>
                            <div className={`w-4 h-4 ${
                              plan.tier_name === 'premium' ? 'text-amber-600 dark:text-amber-400'
                              : plan.tier_name === 'paid' ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {getPlanIcon(plan.tier_name)}
                            </div>
                            {plan.display_name}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {isCurrentPlan && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                                ✓ Active
                              </span>
                            )}
                            {isPro && !isCurrentPlan && (
                              <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold rounded-full shadow-sm whitespace-nowrap">
                                Most Popular
                              </span>
                            )}
                            {isComingSoon && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                                Coming Soon
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-1">
                          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            {isFree ? '$0' : formatCurrency(price, currency)}
                          </span>
                          {!isFree && (
                            <span className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">
                              {billingCycle === 'annual' ? '/year' : '/mo'}
                            </span>
                          )}
                        </div>
                        {isFree && (
                          <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-4">Free forever</p>
                        )}
                        {!isFree && billingCycle !== 'annual' && <div className="mb-4" />}

                        {/* Features */}
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 dark:text-gray-400">
                              <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {/* Action button */}
                        {actionType === 'current' ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 cursor-not-allowed"
                          >
                            Current Plan
                          </button>
                        ) : actionType === 'upgrade' ? (
                          isComingSoon ? (
                            // Admin has explicitly marked this plan as coming soon in the DB
                            <div className="space-y-2">
                              <button
                                disabled
                                className={`w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-not-allowed ${
                                  plan.tier_name === 'premium'
                                    ? 'bg-amber-50 dark:bg-amber-500/[0.07] text-amber-400 dark:text-amber-500 border border-amber-200/60 dark:border-amber-500/20'
                                    : 'bg-blue-50 dark:bg-blue-500/[0.07] text-blue-400 dark:text-blue-500 border border-blue-200/60 dark:border-blue-500/20'
                                }`}
                              >
                                <ArrowUp size={14} />
                                Upgrade to {plan.display_name}
                              </button>
                              <p className="text-center text-[11px] text-amber-600 dark:text-amber-500 font-medium">
                                This plan is launching soon — stay tuned!
                              </p>
                            </div>
                          ) : (
                            // Plan is available — attempt checkout (handleUpgrade surfaces any Stripe config issues)
                            <button
                              onClick={() => { setUpgradeError(null); handleUpgrade(plan); }}
                              disabled={isUpgrading}
                              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50"
                            >
                              {isUpgrading ? (
                                <><Loader2 size={14} className="animate-spin" /> Redirecting...</>
                              ) : (
                                <><ArrowUp size={14} /> Upgrade to {plan.display_name}</>
                              )}
                            </button>
                          )
                        ) : (
                          // downgrade
                          isFree ? (
                            <button
                              onClick={() => setShowDowngradeConfirm(true)}
                              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.07] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.1] transition-colors flex items-center justify-center gap-2"
                            >
                              <ArrowDown size={14} />
                              Downgrade to Free
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-600 border border-gray-200/60 dark:border-white/[0.06] cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <ArrowDown size={14} />
                              {plan.display_name}
                            </button>
                          )
                        )}

                        {!isCurrentPlan && (
                          <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-2">
                            {actionType === 'upgrade' ? '⬆ Higher tier' : '⬇ Lower tier'}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {activeSection === 'billing' && (
            <div className="space-y-5">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">Billing History</p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">All invoices and payments</p>
              </div>

              {billingHistory.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">No invoices yet</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    Your billing history will appear here after your first payment.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200/80 dark:border-white/[0.06]">
                        <th className="pb-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Invoice</th>
                        <th className="pb-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plan</th>
                        <th className="pb-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                        <th className="pb-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                        <th className="pb-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                        <th className="pb-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                      {billingHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pr-4">
                            <span className="text-[12px] font-mono text-gray-600 dark:text-gray-400">
                              {record.stripe_invoice_id ? `${record.stripe_invoice_id.slice(0, 18)}...` : record.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div>
                              <span className="text-[13px] text-gray-800 dark:text-gray-200">
                                {record.plan_name || 'Subscription'}
                              </span>
                              {record.billing_cycle && (
                                <span className="ml-1.5 text-[11px] text-gray-400 capitalize">
                                  ({record.billing_cycle})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(record.amount, record.currency.toUpperCase())}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className="text-[13px] text-gray-600 dark:text-gray-400">
                              {record.payment_date
                                ? new Date(record.payment_date).toLocaleDateString()
                                : new Date(record.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${getInvoiceStatusStyle(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3.5">
                            {(record.invoice_pdf || record.invoice_url) && (
                              <a
                                href={record.invoice_pdf || record.invoice_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[12px] text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Download size={13} />
                                PDF
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'usage' && (
            <div className="space-y-5">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">Usage Statistics</p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Track your feature usage</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Savings Goals</p>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500 dark:text-gray-500">Total</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{usageStats.goalsCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (usageStats.goalsCount / 10) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Budget Categories</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500 dark:text-gray-500">Total</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{usageStats.categoriesCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (usageStats.categoriesCount / 20) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Transactions</p>
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500 dark:text-gray-500">This Month</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{usageStats.transactionsThisMonth}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-1.5">
                      <div className="bg-sky-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (usageStats.transactionsThisMonth / 100) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Current Plan</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-gray-900 dark:text-white capitalize">{currentPlanName}</p>
                    {currentSubscription ? (
                      <StatusBadge status={currentSubscription.status} />
                    ) : (
                      <span className="text-[12px] text-gray-500 dark:text-gray-400">Free plan</span>
                    )}
                  </div>
                </div>
              </div>

              {currentTier === 'free' && (
              <div className={`${cardClass} p-5`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">Unlock More Features</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Upgrade your plan to access premium features and unlimited usage.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('plans')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-500/20 flex-shrink-0"
                  >
                    View Plans
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
