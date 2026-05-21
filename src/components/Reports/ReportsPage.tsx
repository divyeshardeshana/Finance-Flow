import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Hash,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CreditCard,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
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
      <SkeletonBlock className="w-20 h-3 mb-2 rounded" />
      <SkeletonBlock className="w-32 h-7 mb-1 rounded" />
    </div>
  );
}

function SkeletonContentCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
        <SkeletonBlock className="w-40 h-4 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1.5">
              <SkeletonBlock className="w-28 h-3 rounded" />
              <SkeletonBlock className="w-20 h-3 rounded" />
            </div>
            <SkeletonBlock className="w-full h-2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

const CATEGORY_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#84CC16',
  '#A855F7',
];

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

type Preset = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';

function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return String(lastDay).padStart(2, '0');
}

export function ReportsPage() {
  const { user } = useAuth();
  const { preferences, t } = useAppPreferences();
  const { hasFeatureAccess, checkAndLogAccess } = useSubscription();
  const fmt = (amount: number) => formatCurrency(amount, preferences.currency);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [fromDate, setFromDate] = useState<string>(`${currentYear}-${currentMonthNum}-01`);
  const [toDate, setToDate] = useState<string>(`${currentYear}-${currentMonthNum}-${getLastDayOfMonth(currentYear, parseInt(currentMonthNum))}`);
  const [activePreset, setActivePreset] = useState<Preset>('this_month');

  const canExport = hasFeatureAccess('advanced_reports');

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    transactionCount: 0,
  });

  const [categoryBreakdown, setCategoryBreakdown] = useState<{
    income: CategoryData[];
    expense: CategoryData[];
  }>({ income: [], expense: [] });

  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [topExpenseCategories, setTopExpenseCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [user, fromDate, toDate]);

  const applyPreset = (preset: Preset) => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = now.getMonth() + 1;

    setActivePreset(preset);

    if (preset === 'this_month') {
      const m = String(mo).padStart(2, '0');
      setFromDate(`${yr}-${m}-01`);
      setToDate(`${yr}-${m}-${getLastDayOfMonth(yr, mo)}`);
      setSelectedMonth(m);
      setSelectedYear(String(yr));
    } else if (preset === 'last_month') {
      const lastMo = mo === 1 ? 12 : mo - 1;
      const lastYr = mo === 1 ? yr - 1 : yr;
      const m = String(lastMo).padStart(2, '0');
      setFromDate(`${lastYr}-${m}-01`);
      setToDate(`${lastYr}-${m}-${getLastDayOfMonth(lastYr, lastMo)}`);
      setSelectedMonth(m);
      setSelectedYear(String(lastYr));
    } else if (preset === 'last_3_months') {
      const threeMonthsAgo = new Date(yr, mo - 4, 1);
      const fromYr = threeMonthsAgo.getFullYear();
      const fromMo = threeMonthsAgo.getMonth() + 1;
      const fm = String(fromMo).padStart(2, '0');
      const tm = String(mo).padStart(2, '0');
      setFromDate(`${fromYr}-${fm}-01`);
      setToDate(`${yr}-${tm}-${getLastDayOfMonth(yr, mo)}`);
      setSelectedMonth('all');
      setSelectedYear(String(yr));
    } else if (preset === 'this_year') {
      setFromDate(`${yr}-01-01`);
      setToDate(`${yr}-12-31`);
      setSelectedMonth('all');
      setSelectedYear(String(yr));
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setActivePreset('custom');
    const yr = parseInt(selectedYear);
    if (month === 'all') {
      setFromDate(`${yr}-01-01`);
      setToDate(`${yr}-12-31`);
    } else {
      const mo = parseInt(month);
      setFromDate(`${yr}-${month}-01`);
      setToDate(`${yr}-${month}-${getLastDayOfMonth(yr, mo)}`);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setActivePreset('custom');
    const yr = parseInt(year);
    if (selectedMonth === 'all') {
      setFromDate(`${yr}-01-01`);
      setToDate(`${yr}-12-31`);
    } else {
      const mo = parseInt(selectedMonth);
      setFromDate(`${yr}-${selectedMonth}-01`);
      setToDate(`${yr}-${selectedMonth}-${getLastDayOfMonth(yr, mo)}`);
    }
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setActivePreset('custom');
    setSelectedMonth('all');
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setActivePreset('custom');
    setSelectedMonth('all');
  };

  const fetchReportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', fromDate)
        .lte('transaction_date', toDate)
        .order('transaction_date', { ascending: true });

      if (!transactions) { setLoading(false); return; }

      const income = transactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency), 0);

      const expenses = transactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency), 0);

      setSummary({ totalIncome: income, totalExpenses: expenses, netSavings: income - expenses, transactionCount: transactions.length });

      const incomeByCategory = transactions
        .filter((tx) => tx.type === 'income')
        .reduce((acc: Record<string, number>, tx) => {
          const amt = convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency);
          acc[tx.category] = (acc[tx.category] || 0) + amt;
          return acc;
        }, {});

      const expenseByCategory = transactions
        .filter((tx) => tx.type === 'expense')
        .reduce((acc: Record<string, number>, tx) => {
          const amt = convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency);
          acc[tx.category] = (acc[tx.category] || 0) + amt;
          return acc;
        }, {});

      const incomeCategoryData: CategoryData[] = Object.entries(incomeByCategory)
        .map(([category, amount], index) => ({
          category,
          amount,
          percentage: income > 0 ? (amount / income) * 100 : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      const expenseCategoryData: CategoryData[] = Object.entries(expenseByCategory)
        .map(([category, amount], index) => ({
          category,
          amount,
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryBreakdown({ income: incomeCategoryData, expense: expenseCategoryData });
      setTopExpenseCategories(expenseCategoryData.slice(0, 5));

      const monthlyMap = transactions.reduce((acc: Record<string, MonthlyData>, tx) => {
        const key = new Date(tx.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!acc[key]) acc[key] = { month: key, income: 0, expense: 0, net: 0 };
        const amt = convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency);
        if (tx.type === 'income') acc[key].income += amt;
        else acc[key].expense += amt;
        acc[key].net = acc[key].income - acc[key].expense;
        return acc;
      }, {});

      setMonthlyTrends(Object.values(monthlyMap));

      const paymentMethodMap = transactions.reduce((acc: Record<string, PaymentMethodData>, tx) => {
        const method = tx.payment_method || 'Other';
        if (!acc[method]) acc[method] = { method, amount: 0, count: 0 };
        const amt = convertCurrency(Number(tx.amount), tx.currency || 'USD', preferences.currency);
        acc[method].amount += amt;
        acc[method].count += 1;
        return acc;
      }, {});

      setPaymentMethods(Object.values(paymentMethodMap).sort((a, b) => b.amount - a.amount));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const periodLabel = fromDate === toDate
    ? fromDate
    : `${fromDate} to ${toDate}`;

  const exportToCSV = async () => {
    const hasAccess = await checkAndLogAccess('advanced_reports');
    if (!hasAccess) return;
    const csvData = [
      ['Financial Report'],
      ['Period:', periodLabel],
      [''],
      ['Summary'],
      ['Total Income', summary.totalIncome.toFixed(2)],
      ['Total Expenses', summary.totalExpenses.toFixed(2)],
      ['Net Savings', summary.netSavings.toFixed(2)],
      ['Total Transactions', summary.transactionCount.toString()],
      [''],
      ['Income by Category'],
      ['Category', 'Amount', 'Percentage'],
      ...categoryBreakdown.income.map((c) => [c.category, c.amount.toFixed(2), c.percentage.toFixed(1) + '%']),
      [''],
      ['Expenses by Category'],
      ['Category', 'Amount', 'Percentage'],
      ...categoryBreakdown.expense.map((c) => [c.category, c.amount.toFixed(2), c.percentage.toFixed(1) + '%']),
    ];
    const csvContent = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPayments = paymentMethods.reduce((sum, p) => sum + p.amount, 0);

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'last_3_months', label: 'Last 3 Months' },
    { key: 'this_year', label: 'This Year' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">{t('reports')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Comprehensive financial analysis and insights</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={exportToCSV}
            disabled={!canExport}
            title={!canExport ? 'Upgrade to export reports' : 'Export as CSV'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              canExport
                ? 'bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.07] hover:shadow-sm'
                : 'bg-gray-100 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.05] text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-4">
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-150 ${
                activePreset === p.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Month dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Month</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Year dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Year</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 pb-[2px] text-gray-300 dark:text-gray-600 text-[12px] font-medium">or</div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="pl-9 pr-3.5 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="pl-9 pr-3.5 py-2 text-[13px] font-medium bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.1] rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Income"
              value={fmt(summary.totalIncome)}
              icon={<ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              valueColor="text-emerald-600 dark:text-emerald-400"
              badge={periodLabel}
            />
            <MetricCard
              label="Total Expenses"
              value={fmt(summary.totalExpenses)}
              icon={<ArrowDownCircle className="w-5 h-5 text-red-500 dark:text-red-400" />}
              iconBg="bg-red-500/10"
              valueColor="text-red-500 dark:text-red-400"
              badge={periodLabel}
            />
            <MetricCard
              label="Net Savings"
              value={fmt(summary.netSavings)}
              icon={<Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-500/10"
              valueColor={summary.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
              badge={periodLabel}
            />
            <MetricCard
              label="Transactions"
              value={String(summary.transactionCount)}
              icon={<Hash className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              iconBg="bg-gray-100 dark:bg-white/[0.06]"
              valueColor="text-gray-900 dark:text-white"
              badge={periodLabel}
            />
          </>
        )}
      </div>

      {/* Category Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <SkeletonContentCard />
            <SkeletonContentCard />
          </>
        ) : (
          <>
            <SectionCard
              icon={<TrendingUp className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              title="Income by Category"
            >
              {categoryBreakdown.income.length > 0 ? (
                <div className="space-y-3">
                  {categoryBreakdown.income.map((cat) => (
                    <CategoryRow key={cat.category} cat={cat} fmt={fmt} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<TrendingUp className="w-8 h-8" />} message="No income data available" />
              )}
            </SectionCard>

            <SectionCard
              icon={<TrendingDown className="w-4.5 h-4.5 text-red-500 dark:text-red-400" />}
              iconBg="bg-red-500/10"
              title="Expenses by Category"
            >
              {categoryBreakdown.expense.length > 0 ? (
                <div className="space-y-3">
                  {categoryBreakdown.expense.map((cat) => (
                    <CategoryRow key={cat.category} cat={cat} fmt={fmt} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<TrendingDown className="w-8 h-8" />} message="No expense data available" />
              )}
            </SectionCard>
          </>
        )}
      </div>

      {/* Monthly Trends */}
      {loading ? (
        <SkeletonContentCard />
      ) : (
        <SectionCard
          icon={<BarChart3 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-500/10"
          title="Monthly Trends"
        >
          {monthlyTrends.length > 0 ? (
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-white/[0.05]">
              {monthlyTrends.map((m) => {
                const total = m.income + m.expense;
                const incomeWidth = total > 0 ? (m.income / total) * 100 : 0;
                const expenseWidth = total > 0 ? (m.expense / total) * 100 : 0;
                return (
                  <div key={m.month} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{m.month}</span>
                      <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${
                        m.net >= 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-500 dark:text-red-400'
                      }`}>
                        Net: {fmt(m.net)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Income</span>
                          <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">{fmt(m.income)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${incomeWidth}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expenses</span>
                          <span className="text-[12px] font-semibold text-red-500 dark:text-red-400">{fmt(m.expense)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                            style={{ width: `${expenseWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<BarChart3 className="w-8 h-8" />} message="No monthly data available" />
          )}
        </SectionCard>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <SkeletonContentCard />
            <SkeletonContentCard />
          </>
        ) : (
          <>
            <SectionCard
              icon={<PieChart className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-500/10"
              title="Top 5 Expense Categories"
            >
              {topExpenseCategories.length > 0 ? (
                <div className="space-y-2.5">
                  {topExpenseCategories.map((cat, index) => (
                    <div key={cat.category} className="flex items-center gap-3 group">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                        style={{ backgroundColor: cat.color + '20', color: cat.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 truncate">{cat.category}</span>
                          <span className="text-[13px] font-semibold text-gray-900 dark:text-white ml-2 flex-shrink-0">{fmt(cat.amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<PieChart className="w-8 h-8" />} message="No expense categories found" />
              )}
            </SectionCard>

            <SectionCard
              icon={<CreditCard className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-500/10"
              title="Payment Methods"
            >
              {paymentMethods.length > 0 ? (
                <div className="space-y-2.5">
                  {paymentMethods.map((p) => {
                    const share = totalPayments > 0 ? (p.amount / totalPayments) * 100 : 0;
                    return (
                      <div key={p.method} className="p-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl hover:bg-gray-100/60 dark:hover:bg-white/[0.05] transition-colors duration-150">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{p.method}</span>
                          <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400">{fmt(p.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {p.count} {p.count === 1 ? 'transaction' : 'transactions'}
                          </span>
                          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{share.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<CreditCard className="w-8 h-8" />} message="No payment method data available" />
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
  badge?: string;
}

function MetricCard({ label, value, icon, iconBg, valueColor, badge }: MetricCardProps) {
  return (
    <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">{label}</p>
        <p className={`text-[22px] font-bold tracking-tight ${valueColor || 'text-gray-900 dark:text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

interface SectionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon, iconBg, title, children }: SectionCardProps) {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface CategoryRowProps {
  cat: CategoryData;
  fmt: (n: number) => string;
}

function CategoryRow({ cat, fmt }: CategoryRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 truncate">{cat.category}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">{cat.percentage.toFixed(1)}%</span>
          <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{fmt(cat.amount)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
        />
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-[13px] font-medium">{message}</p>
    </div>
  );
}
