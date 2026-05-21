import { useState, useEffect } from 'react';
import { Plus, PiggyBank, TrendingUp, TrendingDown, Wallet, CreditCard as Edit2, Trash2, X, AlertTriangle, CheckCircle, ChevronDown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';

interface Budget {
  id: string;
  category: string;
  amount: number;
  budget_type: string;
  comments?: string;
  spent?: number;
  currency?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />
  );
}

function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
      </div>
      <SkeletonBlock className="w-20 h-3 mb-2" />
      <SkeletonBlock className="w-32 h-7 mb-1" />
    </div>
  );
}

function SkeletonBudgetCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <SkeletonBlock className="w-36 h-4" />
            <SkeletonBlock className="w-24 h-3" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <SkeletonBlock className="w-7 h-7 rounded-lg" />
          <SkeletonBlock className="w-7 h-7 rounded-lg" />
        </div>
      </div>
      <div className="flex justify-between mb-2">
        <SkeletonBlock className="w-20 h-3" />
        <SkeletonBlock className="w-28 h-3" />
      </div>
      <SkeletonBlock className="w-full h-2 rounded-full" />
      <div className="flex justify-between mt-2">
        <SkeletonBlock className="w-16 h-3" />
        <SkeletonBlock className="w-20 h-3" />
      </div>
    </div>
  );
}

const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const BUDGET_TYPE_LABELS: Record<string, string> = {
  fixed_monthly: 'Fixed Monthly',
  rolling_average: 'Rolling Average',
  adaptive: 'Adaptive',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Food & Dining': '🍽',
  'Food Delivery': '🛵',
  Transportation: '🚗',
  Shopping: '🛍',
  Entertainment: '🎬',
  'Bills & Utilities': '⚡',
  Utilities: '⚡',
  Healthcare: '🏥',
  Education: '📚',
  'Personal Care': '💅',
  Travel: '✈',
  Business: '💼',
  'Business Expenses': '💼',
  Other: '📌',
};

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '📦';
}

function getProgressGradient(pct: number) {
  if (pct >= 100) return 'from-red-500 to-red-400';
  if (pct >= 80) return 'from-amber-500 to-amber-400';
  return 'from-emerald-500 to-teal-400';
}

function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = {
    INR: '₹', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
    AUD: 'A$', CAD: 'C$', CHF: 'CHF', AED: 'د.إ', USD: '$',
  };
  return map[currency] ?? '$';
}

export function BudgetPage() {
  const { user } = useAuth();
  const { preferences } = useAppPreferences();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'fixed_monthly',
    comments: '',
  });

  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  const today = new Date();
  const formatDateInput = (d: Date) => d.toISOString().split('T')[0];
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [fromDate, setFromDate] = useState<string>(formatDateInput(firstOfMonth));
  const [toDate, setToDate] = useState<string>(formatDateInput(lastOfMonth));
  const [activePreset, setActivePreset] = useState<string>('this-month');

  const applyPreset = (preset: string) => {
    const now = new Date();
    setActivePreset(preset);
    if (preset === 'this-month') {
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(mo);
      setSelectedYear(now.getFullYear().toString());
      setFromDate(formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
      setToDate(formatDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    } else if (preset === 'last-month') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const mo = String(last.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(mo);
      setSelectedYear(last.getFullYear().toString());
      setFromDate(formatDateInput(new Date(last.getFullYear(), last.getMonth(), 1)));
      setToDate(formatDateInput(new Date(last.getFullYear(), last.getMonth() + 1, 0)));
    } else if (preset === 'last-3-months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      setSelectedMonth('all');
      setSelectedYear(now.getFullYear().toString());
      setFromDate(formatDateInput(start));
      setToDate(formatDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
    } else if (preset === 'this-year') {
      setSelectedMonth('all');
      setSelectedYear(now.getFullYear().toString());
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(`${now.getFullYear()}-12-31`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchCategories();
    }
  }, [user, selectedMonth, selectedYear, fromDate, toDate]);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('categories')
        .select('name')
        .eq('type', 'expense')
        .order('name');
      setCategories(data?.map((c) => c.name) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBudgets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('category');

      let startDate: string;
      let endDate: string;
      if (activePreset === 'last-3-months' || activePreset === 'this-year') {
        startDate = fromDate;
        endDate = toDate;
      } else if (selectedMonth !== 'all') {
        const yr = parseInt(selectedYear);
        const mo = parseInt(selectedMonth);
        const lastDay = new Date(yr, mo, 0).getDate();
        startDate = `${selectedYear}-${selectedMonth}-01`;
        endDate = `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      } else {
        startDate = fromDate || `${selectedYear}-01-01`;
        endDate = toDate || `${selectedYear}-12-31`;
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('category, amount, currency')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      const spendingByCategory = (transactions || []).reduce(
        (acc: Record<string, number>, t) => {
          const converted = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          acc[t.category] = (acc[t.category] || 0) + converted;
          return acc;
        },
        {}
      );

      setBudgets(
        (budgetData || []).map((b) => ({
          ...b,
          spent: spendingByCategory[b.category] || 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingBudget(null);
    setFormData({ category: '', amount: '', period: 'fixed_monthly', comments: '' });
    setShowModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.budget_type,
      comments: budget.comments || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setFormData({ category: '', amount: '', period: 'fixed_monthly', comments: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    setSaving(true);
    try {
      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({
            category: formData.category,
            amount,
            budget_type: formData.period,
            comments: formData.comments,
            currency: preferences.currency,
          })
          .eq('id', editingBudget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budgets').insert({
          user_id: user.id,
          category: formData.category,
          amount,
          budget_type: formData.period,
          comments: formData.comments,
          month: new Date().toISOString().split('T')[0],
          currency: preferences.currency,
        });
        if (error) throw error;
      }
      closeModal();
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + convertCurrency(Number(b.amount), b.currency || 'AUD', preferences.currency), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const fallbackCategories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Personal Care', 'Other',
  ];
  const categoryOptions = categories.length > 0 ? categories : fallbackCategories;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">
            Budget Management
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Set and track your monthly budgets
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Budget
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'this-month', label: 'This Month' },
            { key: 'last-month', label: 'Last Month' },
            { key: 'last-3-months', label: 'Last 3 Months' },
            { key: 'this-year', label: 'This Year' },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => applyPreset(preset.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150 ${
                activePreset === preset.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setActivePreset('custom'); }}
                className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setActivePreset('custom'); }}
                className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">or</span>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">From Date</span>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setActivePreset('custom'); }}
                  className="pl-8 pr-3 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">End Date</span>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setActivePreset('custom'); }}
                  className="pl-8 pr-3 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/[0.15]">
                  <PiggyBank className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                Total Budget
              </p>
              <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
                {formatCurrency(totalBudget, preferences.currency)}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
                {budgets.length} {budgets.length === 1 ? 'category' : 'categories'} &middot; {selectedMonth === 'all' ? selectedYear : `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
              </p>
            </div>
          </div>

          <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 dark:bg-red-500/[0.15]">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                Total Spent
              </p>
              <p className="text-[22px] font-bold tracking-tight text-red-500 dark:text-red-400">
                {formatCurrency(totalSpent, preferences.currency)}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
                {totalBudget > 0 ? `${overallPct.toFixed(1)}% of total budget` : 'No budgets set'}
              </p>
            </div>
          </div>

          <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalRemaining >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/[0.15]' : 'bg-red-500/10 dark:bg-red-500/[0.15]'}`}>
                  {totalRemaining >= 0
                    ? <Wallet className="w-5 h-5 text-emerald-500" />
                    : <TrendingDown className="w-5 h-5 text-red-500" />
                  }
                </div>
              </div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                Remaining
              </p>
              <p className={`text-[22px] font-bold tracking-tight ${totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {formatCurrency(Math.abs(totalRemaining), preferences.currency)}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
                {totalRemaining >= 0 ? 'Available to spend' : 'Over budget'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Category Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonBudgetCard key={i} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/[0.12] flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            No budgets yet
          </p>
          <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-5">
            Create your first budget to start tracking spending by category.
          </p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const spent = budget.spent || 0;
            const budgetAmount = convertCurrency(Number(budget.amount), budget.currency || 'AUD', preferences.currency);
            const pct = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
            const remaining = budgetAmount - spent;
            const isOver = remaining < 0;
            const isWarning = pct >= 80 && !isOver;

            return (
              <div
                key={budget.id}
                className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                        {getCategoryIcon(budget.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight truncate">
                          {budget.category}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400">
                            {BUDGET_TYPE_LABELS[budget.budget_type] || budget.budget_type}
                          </span>
                          {isOver && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              Over budget
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              Near limit
                            </span>
                          )}
                          {!isOver && !isWarning && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              On track
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0 ml-2">
                      <button
                        onClick={() => openEditModal(budget)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/[0.1] dark:hover:text-blue-400 transition-all"
                        title="Edit budget"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/[0.1] dark:hover:text-red-400 transition-all"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-gray-400 dark:text-gray-500">Spent / Budget</span>
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(spent, preferences.currency)}{' '}
                      <span className="text-gray-400 dark:text-gray-500 font-normal">/</span>{' '}
                      {formatCurrency(budgetAmount, preferences.currency)}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(pct)} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[12px] text-gray-400 dark:text-gray-500">
                      {pct.toFixed(1)}% used
                    </span>
                    <span className={`text-[12px] font-semibold ${isOver ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isOver
                        ? `${formatCurrency(Math.abs(remaining), preferences.currency)} over`
                        : `${formatCurrency(remaining, preferences.currency)} left`
                      }
                    </span>
                  </div>

                  {budget.comments && (
                    <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500 italic border-t border-gray-100 dark:border-white/[0.05] pt-3 line-clamp-2">
                      {budget.comments}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0B0F1A] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/[0.06]">
              <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">
                {editingBudget ? 'Edit Budget' : 'New Budget'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Budget Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                    {getCurrencySymbol(preferences.currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 text-[13px] border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all placeholder-gray-300 dark:placeholder-gray-600"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Budget Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="fixed_monthly">Fixed Monthly</option>
                  <option value="rolling_average">Rolling Average</option>
                  <option value="adaptive">Adaptive</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes <span className="text-[12px] text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all placeholder-gray-300 dark:placeholder-gray-600 resize-none"
                  placeholder="Add notes about this budget..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {saving ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
