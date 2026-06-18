import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Receipt, PieChart,
  Bell, Crown, ArrowRight, Plus, Wallet, Sparkles, Activity, BarChart3,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency, formatNumber } from '../../lib/currency';
import { useSubscription } from '../../contexts/SubscriptionContext';
import type { Page } from './types';

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
}

interface DashboardHomeProps {
  onNavigate: (page: Page) => void;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
        <SkeletonBlock className="w-20 h-5 rounded-full" />
      </div>
      <SkeletonBlock className="w-24 h-3 mb-2" />
      <SkeletonBlock className="w-32 h-7 mb-1" />
      <SkeletonBlock className="w-20 h-3 mt-1" />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
  valueColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  onClick?: () => void;
}

function MetricCard({ label, value, icon, iconBg, sub, valueColor, trend, trendLabel, onClick }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              trend === 'up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              trend === 'down' ? 'bg-red-500/10 text-red-500 dark:text-red-400' :
              'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              <span>{trendLabel || 'This month'}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
          {label}
        </p>
        <p className={`text-[22px] font-bold tracking-tight ${valueColor || 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
        {sub && <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">{sub}</p>}
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

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { user } = useAuth();
  const { preferences, t } = useAppPreferences();
  const { currentTier } = useSubscription();
  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    activeSavingsGoals: 0,
    transactionCount: 0,
    budgetUtilization: 0,
    upcomingBills: 0,
    netWorth: 0,
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingContent, setPricingContent] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      let txQuery = supabase
        .from('transactions')
        .select('amount, type, currency')
        .eq('user_id', user.id);

      if (selectedMonth !== 'all') {
        const monthStart = `${selectedYear}-${selectedMonth}-01`;
        const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
        const monthEnd = `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
        txQuery = txQuery.gte('transaction_date', monthStart).lte('transaction_date', monthEnd);
      } else {
        txQuery = txQuery.gte('transaction_date', `${selectedYear}-01-01`).lte('transaction_date', `${selectedYear}-12-31`);
      }

      const { data: transactions } = await txQuery;

      const income = transactions
        ?.filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency), 0) || 0;

      const expenses = transactions
        ?.filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency), 0) || 0;

      const { data: goals } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const { data: aiSuggestions } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: budgets } = await supabase
        .from('budgets')
        .select('amount, currency')
        .eq('user_id', user.id);

      const totalBudget = budgets?.reduce((sum, b) => sum + convertCurrency(Number(b.amount), b.currency || 'USD', preferences.currency), 0) || 0;
      const budgetUtilization = totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

      const { data: bills } = await supabase
        .from('bill_reminders')
        .select('id, next_due_date, reminder_days_before')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingBills = bills?.filter((bill) => {
        const dueDate = new Date(bill.next_due_date);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= bill.reminder_days_before && daysUntil >= 0;
      }).length || 0;

      const { data: assets } = await supabase
        .from('assets')
        .select('current_value, currency')
        .eq('user_id', user.id);

      const { data: liabilities } = await supabase
        .from('liabilities')
        .select('current_balance, currency')
        .eq('user_id', user.id);

      const totalAssets = assets?.reduce((sum, a) => sum + convertCurrency(Number(a.current_value), a.currency || 'USD', preferences.currency), 0) || 0;
      const totalLiabilities = liabilities?.reduce((sum, l) => sum + convertCurrency(Number(l.current_balance), l.currency || 'USD', preferences.currency), 0) || 0;
      const netWorth = totalAssets - totalLiabilities;

      setStats({
        monthlyIncome: income,
        monthlyExpenses: expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
        activeSavingsGoals: goals?.length || 0,
        transactionCount: transactions?.length || 0,
        budgetUtilization,
        upcomingBills,
        netWorth,
      });

      setSavingsGoals(goals || []);
      setSuggestions(aiSuggestions || []);

      const { data: homepageContent } = await supabase
        .from('homepage_content')
        .select('*')
        .eq('content_type', 'pricing_section')
        .eq('is_published', true)
        .maybeSingle();

      if (homepageContent) setPricingContent(homepageContent.content_data);

      setLoading(false);
    }

    fetchData();
  }, [user, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-[120px] bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="animate-pulse w-full h-full bg-gradient-to-r from-gray-100 to-gray-50 dark:from-white/[0.04] dark:to-white/[0.02]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const netCashFlow = stats.monthlyIncome - stats.monthlyExpenses;

  const selectedMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || 'All Months';
  const periodLabel = selectedMonth === 'all' ? selectedYear : `${selectedMonthLabel} ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">{t('dashboard')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Showing data for {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1f3d] via-[#0a1628] to-[#061020] dark:from-[#0a1628] dark:via-[#080e1e] dark:to-[#050a14] rounded-2xl border border-blue-900/40 dark:border-blue-800/30 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.08),transparent_60%)] pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] font-medium text-blue-300/80 tracking-wide uppercase">Live Overview</span>
            </div>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight leading-tight mb-1">
              {formatCurrency(stats.netWorth, preferences.currency)}
            </h2>
            <p className="text-[13px] text-blue-200/60">
              Net worth - assets minus liabilities
            </p>
          </div>

          <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 flex-shrink-0">
            <div className="text-center px-5 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl">
              <p className="text-[11px] font-semibold text-blue-300/70 uppercase tracking-wider mb-0.5">Savings Rate</p>
              <p className="text-[18px] font-bold text-white">{stats.savingsRate.toFixed(1)}%</p>
            </div>
            <div className="text-center px-5 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl">
              <p className="text-[11px] font-semibold text-blue-300/70 uppercase tracking-wider mb-0.5">Budget Used</p>
              <p className={`text-[18px] font-bold ${stats.budgetUtilization > 100 ? 'text-red-400' : stats.budgetUtilization > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stats.budgetUtilization.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Income"
          value={formatCurrency(stats.monthlyIncome, preferences.currency)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          iconBg="bg-emerald-500/10"
          trend="up"
          trendLabel={periodLabel}
          onClick={() => onNavigate('transactions')}
        />
        <MetricCard
          label="Total Expenses"
          value={formatCurrency(stats.monthlyExpenses, preferences.currency)}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          iconBg="bg-red-500/10"
          trend="down"
          trendLabel={periodLabel}
          onClick={() => onNavigate('transactions')}
        />
        <MetricCard
          label="Net Cash Flow"
          value={formatCurrency(netCashFlow, preferences.currency)}
          icon={<DollarSign className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          valueColor={netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          trend={netCashFlow >= 0 ? 'up' : 'down'}
          trendLabel={periodLabel}
        />
        <MetricCard
          label="Transactions"
          value={formatNumber(stats.transactionCount)}
          icon={<Receipt className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          sub={periodLabel}
          onClick={() => onNavigate('transactions')}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Usage */}
        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden cursor-pointer" onClick={() => onNavigate('budget')}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-orange-500" />
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              stats.budgetUtilization > 100 ? 'bg-red-500/10 text-red-500 dark:text-red-400' :
              stats.budgetUtilization > 80 ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400' :
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              {stats.budgetUtilization > 100 ? 'Over budget' : stats.budgetUtilization > 80 ? 'Near limit' : 'On track'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">Budget Usage</p>
          <p className={`text-[22px] font-bold tracking-tight ${stats.budgetUtilization > 100 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {stats.budgetUtilization.toFixed(0)}%
          </p>
          <div className="mt-2.5">
            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  stats.budgetUtilization > 100 ? 'bg-red-500' :
                  stats.budgetUtilization > 80 ? 'bg-amber-500' :
                  'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Upcoming Bills */}
        <div
          className={`group bg-white dark:bg-white/[0.03] border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 cursor-pointer ${
            stats.upcomingBills > 0 ? 'border-amber-200/80 dark:border-amber-500/20' : 'border-gray-200/80 dark:border-white/[0.07]'
          }`}
          onClick={() => onNavigate('bills')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.upcomingBills > 0 ? 'bg-amber-500/10' : 'bg-yellow-500/10'}`}>
              <Bell className={`w-5 h-5 ${stats.upcomingBills > 0 ? 'text-amber-500' : 'text-yellow-500'}`} />
            </div>
            {stats.upcomingBills > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400">
                Due soon
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">Upcoming Bills</p>
          <p className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">{formatNumber(stats.upcomingBills)}</p>
          <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
            {stats.upcomingBills === 0 ? 'All clear' : stats.upcomingBills === 1 ? '1 due soon' : `${stats.upcomingBills} due soon`}
          </p>
        </div>

        {/* Savings Goals */}
        <div
          className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('savings')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">Savings Goals</p>
          <p className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">{stats.activeSavingsGoals}</p>
          <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">Active goals</p>
        </div>

        {/* Net Worth Card */}
        <div
          className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('networth')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              stats.netWorth >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'
            }`}>
              {stats.netWorth >= 0 ? 'Positive' : 'Negative'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">Net Worth</p>
          <p className={`text-[22px] font-bold tracking-tight ${stats.netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(stats.netWorth, preferences.currency)}
          </p>
          <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">Assets minus liabilities</p>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-white/[0.03] border border-blue-200/60 dark:border-blue-500/[0.15] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles style={{ width: '16px', height: '16px' }} className="text-white" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">AI Insights</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">Powered by FinanceFlow AI</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-4 bg-blue-50/50 dark:bg-blue-500/[0.05] border border-blue-100 dark:border-blue-500/[0.10] rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-1">{suggestion.title}</h5>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{suggestion.description}</p>
                  </div>
                  {suggestion.potential_savings > 0 && (
                    <div className="flex-shrink-0 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{formatCurrency(suggestion.potential_savings, preferences.currency)}/mo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity style={{ width: '15px', height: '15px' }} className="text-white" />
            </div>
            <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Quick Actions</h4>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('transactions')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-[13px] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0 transition-all duration-150"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4" />
                <span>Add Transaction</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </button>
            <button
              onClick={() => onNavigate('budget')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[13px] hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Manage Budget</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[13px] hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>View Reports</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[13px] hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Ask AI Assistant</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </button>
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Target style={{ width: '15px', height: '15px' }} className="text-white" />
              </div>
              <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">Savings Goals</h4>
            </div>
            {savingsGoals.length > 0 && (
              <button
                onClick={() => onNavigate('savings')}
                className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {savingsGoals.length > 0 ? (
            <div className="space-y-3">
              {savingsGoals.slice(0, 4).map((goal) => {
                const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                const remaining = goal.target_amount - goal.current_amount;
                const isOnTrack = progress >= 50;

                return (
                  <div key={goal.id} className="p-4 bg-gray-50/60 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-xl hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isOnTrack ? 'bg-gradient-to-br from-emerald-500 to-teal-400' : 'bg-gradient-to-br from-amber-500 to-orange-400'}`}>
                          <Target className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{goal.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-500">{formatCurrency(goal.target_amount, preferences.currency)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isOnTrack
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {isOnTrack ? 'On Track' : 'Focus'}
                        </span>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isOnTrack ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-500">{formatCurrency(goal.current_amount, preferences.currency)} saved</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-600">{formatCurrency(remaining, preferences.currency)} to go</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1">No savings goals yet</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-600 mb-4">Create a goal to start tracking progress</p>
              <button
                onClick={() => onNavigate('savings')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-[13px] font-semibold hover:shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-150"
              >
                Create Goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Upgrade Section (free users) */}
      {pricingContent && currentTier === 'free' && (
        <div className="bg-gradient-to-br from-blue-50 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/10 rounded-2xl border border-blue-200/60 dark:border-blue-500/[0.15] p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-full text-[12px] font-medium text-blue-600 dark:text-blue-400 mb-4">
              <Crown className="w-3.5 h-3.5" />
              Upgrade your plan
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {pricingContent.heading || "Choose the plan that's right for you"}
            </h3>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">
              {pricingContent.subheading || 'Start free and upgrade as you grow'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6 border border-gray-200/80 dark:border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Free</h4>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  Current
                </span>
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-500 mb-4 leading-relaxed">{pricingContent.tiers?.free?.description}</p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">$0</div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-5">forever</p>
              <button disabled className="w-full py-2.5 bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 rounded-xl text-[13px] font-semibold cursor-not-allowed">
                Current Plan
              </button>
            </div>

            <div className="bg-white dark:bg-[#0B1628] rounded-xl p-6 border-2 border-blue-500 shadow-xl shadow-blue-500/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold rounded-full shadow-lg">
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Pro</h4>
                <Crown className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{pricingContent.tiers?.paid?.description}</p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">$9</div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-5">per month</p>
              <button
                onClick={() => onNavigate('subscription')}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[13px] font-semibold hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              >
                {pricingContent.tiers?.paid?.cta_text || 'Get Started'}
              </button>
            </div>

            <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6 border border-gray-200/80 dark:border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Premium</h4>
                <Crown className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-500 mb-4 leading-relaxed">{pricingContent.tiers?.premium?.description}</p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">$19</div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-5">per month</p>
              <button
                onClick={() => onNavigate('subscription')}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl text-[13px] font-semibold hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              >
                {pricingContent.tiers?.premium?.cta_text || 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
