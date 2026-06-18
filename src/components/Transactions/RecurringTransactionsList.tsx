import { useState, useEffect } from 'react';
import { Repeat, Pause, Play, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency } from '../../lib/currency';

interface RecurringTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
}

export function RecurringTransactionsList() {
  const { user } = useAuth();
  const { preferences } = useAppPreferences();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const loadRecurringTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('next_occurrence', { ascending: true });

      if (error) throw error;
      setRecurringTransactions(data || []);
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadRecurringTransactions();
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
    }
  };

  const deleteRecurring = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction? Past transactions will not be affected.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRecurringTransactions();
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Every 2 Weeks',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeCount = recurringTransactions.filter((t) => t.is_active).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Repeat className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Recurring Transactions</h3>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
              <div className="w-10 h-10 bg-gray-200 dark:bg-white/[0.06] rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-white/[0.06] rounded-lg w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-white/[0.06] rounded-lg w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recurringTransactions.length === 0) {
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-16 text-center">
        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Repeat className="w-7 h-7 text-blue-500" />
        </div>
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">
          No Recurring Transactions
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
          Set up recurring transactions for bills, subscriptions, or regular income to automate your tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Repeat className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Recurring Transactions</h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
          {activeCount} active
        </span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
        {recurringTransactions.map((recurring) => (
          <div
            key={recurring.id}
            className={`px-6 py-5 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors ${
              !recurring.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                    recurring.type === 'expense'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {recurring.type === 'expense' ? '−' : '+'}
                    {formatCurrency(recurring.amount, preferences.currency)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium border border-blue-500/20">
                    {getFrequencyLabel(recurring.frequency)}
                  </span>
                  {!recurring.is_active && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-500 text-[11px] font-medium">
                      Paused
                    </span>
                  )}
                </div>

                <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {recurring.description || recurring.category}
                </h4>
                {recurring.description && (
                  <p className="text-[12px] text-gray-500 dark:text-gray-500 mb-2">{recurring.category}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Next: <span className="text-gray-600 dark:text-gray-400 font-medium">{formatDate(recurring.next_occurrence)}</span></span>
                  </div>
                  {recurring.end_date && (
                    <div className="flex items-center gap-1.5">
                      <span>Until: <span className="text-gray-600 dark:text-gray-400 font-medium">{formatDate(recurring.end_date)}</span></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(recurring.id, recurring.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    recurring.is_active
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                  title={recurring.is_active ? 'Pause' : 'Resume'}
                >
                  {recurring.is_active ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteRecurring(recurring.id)}
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/[0.08] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
