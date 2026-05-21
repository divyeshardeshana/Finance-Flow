import { useEffect, useState } from 'react';
import { CheckCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionSuccessPageProps {
  onNavigateToDashboard: () => void;
  onNavigateToSubscription: () => void;
}

export default function SubscriptionSuccessPage({
  onNavigateToDashboard,
  onNavigateToSubscription,
}: SubscriptionSuccessPageProps) {
  const { user } = useAuth();
  const [planName, setPlanName] = useState<string | null>(null);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const maxAttempts = 6;
      const delayMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 1000 : delayMs));

        const { data } = await supabase
          .from('user_subscriptions')
          .select('next_billing_date, billing_cycle, subscription_tiers!tier_id(display_name)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (data) {
          const tierInfo = data.subscription_tiers as { display_name: string } | null;
          setPlanName(tierInfo?.display_name ?? null);
          setNextBillingDate(data.next_billing_date ?? null);
          break;
        }
      }

      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Crown className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Welcome aboard!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your subscription has been activated successfully.
        </p>

        {loading ? (
          <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6 mb-8 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-gray-600 dark:text-gray-400 text-sm">Loading your subscription details...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6 mb-8">
            {planName && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/[0.06]">
                <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{planName}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
            {nextBillingDate && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Next billing date</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(nextBillingDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onNavigateToDashboard}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToSubscription}
            className="w-full py-3 border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
          >
            View Subscription Details
          </button>
        </div>
      </div>
    </div>
  );
}
