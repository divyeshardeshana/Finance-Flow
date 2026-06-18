import { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  RefreshCw,
  Settings,
  Clock,
  Zap,
  CreditCard,
  Wifi,
  X,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency, formatNumber } from '../../lib/currency';
import {
  requestNotificationPermission,
  hasNotificationPermission,
} from '../../lib/notifications';
import { Database } from '../../lib/database.types';

type BillReminder = Database['public']['Tables']['bill_reminders']['Row'];
type NotificationPreferences =
  Database['public']['Tables']['notification_preferences']['Row'];

const categoryIcons: Record<string, React.ElementType> = {
  utilities: Zap,
  credit_cards: CreditCard,
  subscriptions: Wifi,
  other: DollarSign,
};

const categoryColors: Record<string, string> = {
  utilities: 'bg-blue-500/10 dark:bg-blue-500/[0.15] text-blue-500',
  credit_cards: 'bg-rose-500/10 dark:bg-rose-500/[0.15] text-rose-500',
  subscriptions: 'bg-amber-500/10 dark:bg-amber-500/[0.15] text-amber-500',
  other: 'bg-gray-500/10 dark:bg-gray-500/[0.15] text-gray-500',
};

const categoryTagColors: Record<string, string> = {
  utilities: 'bg-blue-500/[0.08] text-blue-600 dark:text-blue-400 border-blue-500/20',
  credit_cards: 'bg-rose-500/[0.08] text-rose-600 dark:text-rose-400 border-rose-500/20',
  subscriptions: 'bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border-amber-500/20',
  other: 'bg-gray-500/[0.08] text-gray-600 dark:text-gray-400 border-gray-500/20',
};

const categoryLabels: Record<string, string> = {
  utilities: 'Utilities',
  credit_cards: 'Credit Cards',
  subscriptions: 'Subscriptions',
  other: 'Other',
};

const frequencyLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />;
}

function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
      </div>
      <SkeletonBlock className="w-24 h-2.5 mb-3 rounded-full" />
      <SkeletonBlock className="w-36 h-7 mb-2" />
      <SkeletonBlock className="w-20 h-2.5 rounded-full" />
    </div>
  );
}

function SkeletonBillCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
      <SkeletonBlock className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <SkeletonBlock className="w-40 h-3.5 mb-2" />
        <SkeletonBlock className="w-28 h-2.5 rounded-full" />
      </div>
      <div className="text-right">
        <SkeletonBlock className="w-24 h-4 mb-1.5 ml-auto" />
        <SkeletonBlock className="w-16 h-2.5 rounded-full ml-auto" />
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 dark:focus:border-blue-400/60 transition-colors';
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5';

export function BillRemindersPage() {
  const { user } = useAuth();
  const { checkAndLogAccess } = useSubscription();
  const { t, preferences } = useAppPreferences();
  const currency = preferences.currency;

  const [bills, setBills] = useState<BillReminder[]>([]);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingBill, setEditingBill] = useState<BillReminder | null>(null);
  const [hasPermission, setHasPermission] = useState(hasNotificationPermission());
  const [formData, setFormData] = useState({
    bill_name: '',
    amount: '',
    due_date: '',
    category: 'other' as BillReminder['category'],
    frequency: 'monthly' as BillReminder['frequency'],
    reminder_days_before: '3',
    auto_pay: false,
    notes: '',
  });

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  async function checkFeatureAccess() {
    const hasAccess = await checkAndLogAccess('bill_reminders');
    if (hasAccess) {
      loadBills();
      loadNotificationPreferences();
    }
  }

  async function loadBills() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date');

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotificationPreferences() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setNotificationPrefs(newPrefs);
      } else {
        setNotificationPrefs(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Amount must be a positive number.');
      return;
    }

    try {
      const billData = {
        user_id: user.id,
        bill_name: formData.bill_name,
        amount,
        due_date: formData.due_date,
        category: formData.category,
        frequency: formData.frequency,
        reminder_days_before: parseInt(formData.reminder_days_before),
        auto_pay: formData.auto_pay,
        notes: formData.notes,
        next_due_date: formData.due_date,
        currency,
      };

      if (editingBill) {
        const { error } = await supabase
          .from('bill_reminders')
          .update(billData)
          .eq('id', editingBill.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('bill_reminders').insert(billData);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingBill(null);
      resetForm();
      loadBills();
    } catch (error) {
      console.error('Error saving bill:', error);
    }
  }

  function resetForm() {
    setFormData({
      bill_name: '',
      amount: '',
      due_date: '',
      category: 'other',
      frequency: 'monthly',
      reminder_days_before: '3',
      auto_pay: false,
      notes: '',
    });
  }

  function handleEdit(bill: BillReminder) {
    setEditingBill(bill);
    setFormData({
      bill_name: bill.bill_name,
      amount: bill.amount.toString(),
      due_date: bill.due_date,
      category: bill.category,
      frequency: bill.frequency,
      reminder_days_before: bill.reminder_days_before.toString(),
      auto_pay: bill.auto_pay,
      notes: bill.notes,
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this bill reminder?')) return;

    try {
      const { error } = await supabase
        .from('bill_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  }

  async function handleToggleActive(bill: BillReminder) {
    try {
      const { error } = await supabase
        .from('bill_reminders')
        .update({ is_active: !bill.is_active })
        .eq('id', bill.id);

      if (error) throw error;
      loadBills();
    } catch (error) {
      console.error('Error toggling bill:', error);
    }
  }

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();

    if (granted && user) {
      setHasPermission(true);

      await supabase
        .from('notification_preferences')
        .update({ browser_notifications_enabled: true })
        .eq('user_id', user.id);

      loadNotificationPreferences();
    }
  }

  function getDaysUntilDue(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const dueSoonBills = bills.filter(
    (bill) =>
      bill.is_active &&
      getDaysUntilDue(bill.next_due_date) <= bill.reminder_days_before &&
      getDaysUntilDue(bill.next_due_date) >= 0
  );

  const activeBills = bills.filter((b) => b.is_active);
  const totalMonthly = activeBills.reduce((sum, bill) => {
    const amount = convertCurrency(Number(bill.amount), (bill as any).currency || 'USD', currency);
    if (bill.frequency === 'monthly') return sum + amount;
    if (bill.frequency === 'quarterly') return sum + amount / 3;
    if (bill.frequency === 'yearly') return sum + amount / 12;
    return sum + amount;
  }, 0);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            {t('bill_reminders')}
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Never miss a bill payment with automatic reminders
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => {
              setEditingBill(null);
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Bill
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            <div className="relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] to-transparent dark:from-blue-500/[0.08] pointer-events-none rounded-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/[0.15] flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Monthly Bills
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatCurrency(totalMonthly, currency)}
                </p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">Estimated per month</p>
              </div>
            </div>

            <div className="relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.05] to-transparent dark:from-orange-500/[0.08] pointer-events-none rounded-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/[0.15] flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Due Soon
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(dueSoonBills.length)}
                </p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  {dueSoonBills.length === 1 ? 'Bill needs' : 'Bills need'} attention
                </p>
              </div>
            </div>

            <div className="relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.05] to-transparent dark:from-teal-500/[0.08] pointer-events-none rounded-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-teal-500" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Active Bills
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(activeBills.length)}
                </p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  {formatNumber(bills.length)} total tracked
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enable Notifications Banner */}
      {!loading && !hasPermission && (
        <div className="relative bg-amber-500/[0.06] dark:bg-amber-500/[0.08] border border-amber-500/15 dark:border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
                Enable Browser Notifications
              </h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Get notified when bills are due. You'll need to enable browser notifications to receive reminders.
              </p>
              <button
                onClick={handleEnableNotifications}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                <Bell className="w-4 h-4" />
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bills Due Soon */}
      {!loading && dueSoonBills.length > 0 && (
        <div className="bg-red-500/[0.05] dark:bg-red-500/[0.08] border border-red-500/15 dark:border-red-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-red-500/10 dark:border-red-500/15">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-red-500/[0.15] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                  Bills Due Soon
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  {formatNumber(dueSoonBills.length)} bill{dueSoonBills.length !== 1 ? 's' : ''} require immediate attention
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {dueSoonBills.map((bill) => {
              const daysUntil = getDaysUntilDue(bill.next_due_date);
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between bg-white dark:bg-white/[0.03] border border-red-500/10 dark:border-red-500/[0.12] rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      {(() => {
                        const Icon = categoryIcons[bill.category] ?? DollarSign;
                        return <Icon className="w-4 h-4 text-red-500" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{bill.bill_name}</p>
                      <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                        {daysUntil === 0
                          ? 'Due today'
                          : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-[15px] font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(convertCurrency(Number(bill.amount), (bill as any).currency || 'USD', currency), currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bill List */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Bill Reminders</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                Track all your recurring bills and payment schedules
              </p>
            </div>
            {!loading && bills.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                {formatNumber(bills.length)} bill{bills.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              <SkeletonBillCard />
              <SkeletonBillCard />
              <SkeletonBillCard />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.12] flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                No bill reminders yet
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto">
                Start tracking your bills to never miss a payment
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Bill
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => {
                const daysUntil = getDaysUntilDue(bill.next_due_date);
                const Icon = categoryIcons[bill.category] ?? DollarSign;
                const colorClass = categoryColors[bill.category] ?? categoryColors.other;
                const tagClass = categoryTagColors[bill.category] ?? categoryTagColors.other;
                const isOverdue = daysUntil < 0;
                const isDueSoon = bill.is_active && daysUntil >= 0 && daysUntil <= bill.reminder_days_before;

                return (
                  <div
                    key={bill.id}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 ${
                      isOverdue
                        ? 'border-red-500/20 dark:border-red-500/15 bg-red-500/[0.02] dark:bg-red-500/[0.04]'
                        : isDueSoon
                        ? 'border-orange-500/20 dark:border-orange-500/15 bg-orange-500/[0.02] dark:bg-orange-500/[0.04]'
                        : !bill.is_active
                        ? 'border-gray-100 dark:border-white/[0.04] opacity-60'
                        : 'border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.1]'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                          {bill.bill_name}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${tagClass}`}>
                          {categoryLabels[bill.category]}
                        </span>
                        {bill.auto_pay && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            Auto-Pay
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(bill.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                          <RefreshCw className="w-3.5 h-3.5" />
                          {frequencyLabels[bill.frequency]}
                        </span>
                        <span className={`flex items-center gap-1.5 text-[12px] font-medium ${
                          isOverdue
                            ? 'text-red-500 dark:text-red-400'
                            : isDueSoon
                            ? 'text-orange-500 dark:text-orange-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {isOverdue
                            ? `${Math.abs(daysUntil)}d overdue`
                            : daysUntil === 0
                            ? 'Due today'
                            : `${daysUntil}d remaining`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 mr-1">
                      <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                        {formatCurrency(convertCurrency(Number(bill.amount), (bill as any).currency || 'USD', currency), currency)}
                      </p>
                      <button
                        onClick={() => handleToggleActive(bill)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors mt-1 ${
                          bill.is_active
                            ? 'bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/[0.15]'
                            : 'bg-gray-500/[0.08] text-gray-500 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/[0.15]'
                        }`}
                      >
                        {bill.is_active ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => handleEdit(bill)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Bill Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#0f0f10] border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  {editingBill ? 'Edit Bill Reminder' : 'Add Bill Reminder'}
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingBill ? 'Update your bill details' : 'Track a new recurring bill'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBill(null);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Bill Name *</label>
                <input
                  type="text"
                  required
                  value={formData.bill_name}
                  onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Electric Bill"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Amount *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as BillReminder['category'] })
                    }
                    className={inputClass}
                  >
                    <option value="credit_cards">Credit Cards</option>
                    <option value="other">Other</option>
                    <option value="subscriptions">Subscriptions</option>
                    <option value="utilities">Utilities</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value as BillReminder['frequency'] })
                    }
                    className={inputClass}
                  >
                    <option value="custom">Custom</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Remind me (days before)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.reminder_days_before}
                  onChange={(e) =>
                    setFormData({ ...formData, reminder_days_before: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
                <div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white">Auto-Pay</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">This bill is paid automatically</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, auto_pay: !formData.auto_pay })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    formData.auto_pay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/[0.12]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      formData.auto_pay ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={inputClass}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBill(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  {editingBill ? 'Update Bill' : 'Add Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showSettings && notificationPrefs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Notification Settings
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure how and when you receive reminders
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                    Browser Notifications
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Get notified when bills are due
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !notificationPrefs.browser_notifications_enabled;
                    await supabase
                      .from('notification_preferences')
                      .update({ browser_notifications_enabled: newValue })
                      .eq('id', notificationPrefs.id);
                    loadNotificationPreferences();
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    notificationPrefs.browser_notifications_enabled
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-white/[0.12]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notificationPrefs.browser_notifications_enabled
                        ? 'translate-x-4'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className={labelClass}>Reminder Time</label>
                <input
                  type="time"
                  value={notificationPrefs.reminder_time}
                  onChange={async (e) => {
                    await supabase
                      .from('notification_preferences')
                      .update({ reminder_time: e.target.value })
                      .eq('id', notificationPrefs.id);
                    loadNotificationPreferences();
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Default Reminder (days before)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={notificationPrefs.days_before_reminder}
                  onChange={async (e) => {
                    await supabase
                      .from('notification_preferences')
                      .update({ days_before_reminder: parseInt(e.target.value) })
                      .eq('id', notificationPrefs.id);
                    loadNotificationPreferences();
                  }}
                  className={inputClass}
                />
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
