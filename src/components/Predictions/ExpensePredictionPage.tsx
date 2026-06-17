import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Star,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Wallet,
  Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';

interface MonthlyPrediction {
  month: string;
  monthYear: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  startingBalance: number;
  endingBalance: number;
  dailyPredictions: DailyPrediction[];
  confidence: number;
}

interface DailyPrediction {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  runningBalance: number;
  confidence: number;
}

interface MonthlyPattern {
  avgIncome: number;
  avgExpense: number;
  categoryPatterns: Record<string, number>;
}

interface InsightItem {
  type: 'success' | 'warning' | 'info' | 'highlight';
  text: string;
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
      <SkeletonBlock className="w-24 h-2.5 mb-3 rounded-full" />
      <SkeletonBlock className="w-36 h-7 mb-2" />
      <SkeletonBlock className="w-20 h-2.5 rounded-full" />
    </div>
  );
}

export function ExpensePredictionPage() {
  const { user } = useAuth();
  const { preferences } = useAppPreferences();
  const formatCurrencyHelper = (amount: number) => formatCurrency(amount, preferences.currency);
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyPredictions, setMonthlyPredictions] = useState<MonthlyPrediction[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [monthlyPattern, setMonthlyPattern] = useState<MonthlyPattern>({
    avgIncome: 0,
    avgExpense: 0,
    categoryPatterns: {},
  });
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (user) {
      generatePredictions();
    }
  }, [user]);

  const toggleMonth = (index: number) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMonths(newExpanded);
  };

  const generatePredictions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: historicalTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (!historicalTransactions || historicalTransactions.length === 0) {
        setLoading(false);
        return;
      }

      const monthlyData = analyzeMonthlyPatterns(historicalTransactions);
      setMonthlyPattern(monthlyData);

      const totalIncome = historicalTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          return sum + convertedAmount;
        }, 0);

      const totalExpense = historicalTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          return sum + convertedAmount;
        }, 0);

      const balance = totalIncome - totalExpense;
      setCurrentBalance(balance);

      const predictions = predictNextThreeMonths(balance, monthlyData);
      setMonthlyPredictions(predictions);

      const generatedInsights = generateInsights(monthlyData, predictions);
      setInsights(generatedInsights);

      setLoading(false);
    } catch (error) {
      console.error('Error generating predictions:', error);
      setLoading(false);
    }
  };

  const analyzeMonthlyPatterns = (transactions: any[]): MonthlyPattern => {
    const monthlyGroups = transactions.reduce((acc: Record<string, any[]>, t) => {
      const month = new Date(t.transaction_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(t);
      return acc;
    }, {});

    const monthCount = Object.keys(monthlyGroups).length || 1;

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => {
        const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
        return sum + convertedAmount;
      }, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => {
        const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
        return sum + convertedAmount;
      }, 0);

    const categoryTotals = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc: Record<string, number>, t) => {
        const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
        acc[t.category] = (acc[t.category] || 0) + convertedAmount;
        return acc;
      }, {});

    const categoryPatterns = Object.fromEntries(
      Object.entries(categoryTotals).map(([cat, total]) => [cat, (total as number) / monthCount])
    );

    return {
      avgIncome: totalIncome / monthCount,
      avgExpense: totalExpense / monthCount,
      categoryPatterns,
    };
  };

  const predictNextThreeMonths = (
    startingBalance: number,
    pattern: MonthlyPattern
  ): MonthlyPrediction[] => {
    const predictions: MonthlyPrediction[] = [];
    let currentBal = startingBalance;
    const today = new Date();

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 1);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' });
      const year = targetDate.getFullYear();

      let startDay = 1;
      const endDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();

      if (monthOffset === 0) {
        startDay = today.getDate();
        targetDate.setDate(startDay);
      }

      const dailyPredictions: DailyPrediction[] = [];
      const dailyIncomeRate = pattern.avgIncome / 30;
      const dailyExpenseRate = pattern.avgExpense / 30;
      let runningBalance = currentBal;

      for (let day = startDay; day <= endDay; day++) {
        const currentDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
        const dayOfWeek = currentDate.getDay();

        let incomeMultiplier = 1.0;
        let expenseMultiplier = 1.0;

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          expenseMultiplier = 1.3;
        }

        if (day === 1 || day === 15 || day === 30) {
          incomeMultiplier = 2.5;
        }

        const predictedIncome = dailyIncomeRate * incomeMultiplier;
        const predictedExpense = dailyExpenseRate * expenseMultiplier;

        runningBalance += predictedIncome - predictedExpense;

        const confidence = Math.max(50, 95 - monthOffset * 15 - (day / endDay) * 10);

        dailyPredictions.push({
          date: currentDate.toISOString().split('T')[0],
          predictedIncome,
          predictedExpense,
          runningBalance,
          confidence,
        });
      }

      const monthIncome = dailyPredictions.reduce((sum, d) => sum + d.predictedIncome, 0);
      const monthExpense = dailyPredictions.reduce((sum, d) => sum + d.predictedExpense, 0);
      const monthNet = monthIncome - monthExpense;
      const endingBalance = runningBalance;

      const monthConfidence = Math.max(50, 95 - monthOffset * 15);

      predictions.push({
        month: monthName,
        monthYear: `${monthShort} ${year}`,
        totalIncome: monthIncome,
        totalExpense: monthExpense,
        netBalance: monthNet,
        startingBalance: currentBal,
        endingBalance,
        dailyPredictions,
        confidence: monthConfidence,
      });

      currentBal = endingBalance;
    }

    return predictions;
  };

  const generateInsights = (
    pattern: MonthlyPattern,
    predictions: MonthlyPrediction[]
  ): InsightItem[] => {
    const items: InsightItem[] = [];

    const thirdMonthBalance = predictions[2]?.endingBalance || 0;

    if (thirdMonthBalance < 0) {
      items.push({
        type: 'warning',
        text: `Critical: Predicted deficit of ${formatCurrency(Math.abs(thirdMonthBalance), preferences.currency)} in 3 months`,
      });
      items.push({
        type: 'warning',
        text: `Immediate action needed: Reduce monthly spending by ${formatCurrencyHelper(Math.abs(thirdMonthBalance / 3))} to avoid deficit`,
      });
    } else if (thirdMonthBalance > pattern.avgIncome) {
      items.push({
        type: 'success',
        text: `Excellent trajectory! Predicted surplus of ${formatCurrencyHelper(thirdMonthBalance)} in 3 months`,
      });
      items.push({
        type: 'info',
        text: `Consider allocating ${formatCurrencyHelper(thirdMonthBalance * 0.5)} to long-term savings`,
      });
    } else {
      items.push({
        type: 'success',
        text: `Stable financial outlook with ${formatCurrencyHelper(thirdMonthBalance)} projected in 3 months`,
      });
    }

    const avgMonthlyNet = predictions.reduce((sum, p) => sum + p.netBalance, 0) / predictions.length;
    if (avgMonthlyNet > 0) {
      items.push({
        type: 'highlight',
        text: `Average monthly savings: ${formatCurrencyHelper(avgMonthlyNet)} over next 3 months`,
      });
    } else {
      items.push({
        type: 'warning',
        text: `Average monthly deficit: ${formatCurrencyHelper(Math.abs(avgMonthlyNet))} - budget review recommended`,
      });
    }

    const topCategory = Object.entries(pattern.categoryPatterns).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0];

    if (topCategory) {
      items.push({
        type: 'info',
        text: `Top spending category: ${topCategory[0]} (${formatCurrencyHelper((topCategory[1] as number) * 3)} projected over 3 months)`,
      });
    }

    if (pattern.avgExpense > pattern.avgIncome * 0.8) {
      items.push({
        type: 'warning',
        text: `High expense ratio: ${((pattern.avgExpense / pattern.avgIncome) * 100).toFixed(1)}% of income - target 70% for sustainable growth`,
      });
    }

    const worstMonth = predictions.reduce((worst, p) =>
      p.netBalance < worst.netBalance ? p : worst
    );
    const bestMonth = predictions.reduce((best, p) =>
      p.netBalance > best.netBalance ? p : best
    );

    if (worstMonth.netBalance < 0) {
      items.push({
        type: 'warning',
        text: `Challenging month ahead: ${worstMonth.monthYear} (${formatCurrencyHelper(worstMonth.netBalance)} deficit)`,
      });
    }

    if (bestMonth.netBalance > pattern.avgIncome * 0.3) {
      items.push({
        type: 'highlight',
        text: `Best opportunity: ${bestMonth.monthYear} (${formatCurrencyHelper(bestMonth.netBalance)} surplus)`,
      });
    }

    return items;
  };

  const insightIcon = (type: InsightItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'highlight':
        return <Star className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Lightbulb className="w-4 h-4 text-sky-500 flex-shrink-0" />;
    }
  };

  const insightRowStyle = (type: InsightItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/[0.06] border border-emerald-500/[0.12]';
      case 'warning':
        return 'bg-amber-500/[0.06] border border-amber-500/[0.12]';
      case 'highlight':
        return 'bg-blue-500/[0.06] border border-blue-500/[0.12]';
      case 'info':
      default:
        return 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonBlock className="w-48 h-6 mb-2" />
          <SkeletonBlock className="w-80 h-4 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 space-y-3">
          <SkeletonBlock className="w-48 h-5 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="w-full h-12 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="w-full h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (monthlyPredictions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            Expense Prediction
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            AI-powered 3-month financial forecasting based on your spending patterns
          </p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-14 text-center">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-blue-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            Not enough data to generate predictions
          </p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Add at least 3 months of transaction history to see AI-powered forecasts
          </p>
        </div>
      </div>
    );
  }

  const threeMonthBalance = monthlyPredictions[2]?.endingBalance || 0;
  const totalChange = threeMonthBalance - currentBalance;
  const isPositiveChange = totalChange >= 0;

  const topCategories = Object.entries(monthlyPattern.categoryPatterns)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const maxCategorySpend = topCategories[0]?.[1] as number || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
          Expense Prediction
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
          AI-powered 3-month financial forecasting based on your spending patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              Current Balance
            </p>
            <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
              {formatCurrencyHelper(currentBalance)}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">As of today</p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              Predicted in 3 Months
            </p>
            <p className={`text-[22px] font-bold tracking-tight ${threeMonthBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {formatCurrencyHelper(threeMonthBalance)}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
              End of {monthlyPredictions[2]?.monthYear}
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${isPositiveChange ? 'from-teal-500/[0.04]' : 'from-red-500/[0.04]'} to-transparent pointer-events-none`} />
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isPositiveChange ? 'bg-teal-500/10' : 'bg-red-500/10'}`}>
              {isPositiveChange ? (
                <TrendingUp className="w-5 h-5 text-teal-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              Total Change
            </p>
            <p className={`text-[22px] font-bold tracking-tight ${isPositiveChange ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'}`}>
              {isPositiveChange ? '+' : ''}{formatCurrencyHelper(totalChange)}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">Over next 3 months</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">AI Insights & Recommendations</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Personalized analysis of your financial trajectory</p>
          </div>
        </div>
        <div className="p-5 space-y-2.5">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl ${insightRowStyle(insight.type)}`}
            >
              <div className="mt-0.5">{insightIcon(insight.type)}</div>
              <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Future Cash Flow Visualization</h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">Month-by-month forecast with daily breakdown</p>
          </div>
        </div>

        {monthlyPredictions.map((month, index) => {
          const isExpanded = expandedMonths.has(index);
          const isMonthPositive = month.netBalance >= 0;
          const confidenceColor =
            month.confidence >= 85
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : month.confidence >= 70
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';

          return (
            <div
              key={index}
              className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden"
            >
              <div
                className="px-5 py-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
                onClick={() => toggleMonth(index)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{month.month}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${confidenceColor}`}>
                        Confidence: {month.confidence.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold ${isMonthPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                      {isMonthPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isMonthPositive ? '+' : ''}{formatCurrencyHelper(month.netBalance)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] rounded-xl border border-emerald-500/[0.12]">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Income</p>
                    <p className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyHelper(month.totalIncome)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/[0.06] dark:bg-red-500/[0.08] rounded-xl border border-red-500/[0.12]">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Expenses</p>
                    <p className="text-[15px] font-bold text-red-500 dark:text-red-400">
                      {formatCurrencyHelper(month.totalExpense)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isMonthPositive ? 'bg-teal-500/[0.06] dark:bg-teal-500/[0.08] border-teal-500/[0.12]' : 'bg-red-500/[0.06] dark:bg-red-500/[0.08] border-red-500/[0.12]'}`}>
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Net Balance</p>
                    <p className={`text-[15px] font-bold ${isMonthPositive ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}`}>
                      {isMonthPositive ? '+' : ''}{formatCurrencyHelper(month.netBalance)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/[0.06] dark:bg-blue-500/[0.08] rounded-xl border border-blue-500/[0.12]">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Ending Balance</p>
                    <p className="text-[15px] font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrencyHelper(month.endingBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-white/[0.06]">
                  <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-4 mb-3">
                    Daily Breakdown
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {month.dailyPredictions.map((day, dayIndex) => {
                      const date = new Date(day.date);
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNum = date.getDate();
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div
                          key={dayIndex}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                            isWeekend
                              ? 'bg-amber-500/[0.04] border-amber-500/[0.12]'
                              : 'bg-gray-50/80 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/[0.06]'
                          }`}
                        >
                          <div className="w-10 text-center flex-shrink-0">
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">{dayName}</p>
                            <p className="text-[16px] font-bold text-gray-900 dark:text-white leading-tight">{dayNum}</p>
                          </div>

                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />

                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">Income</span>
                              <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                                +{formatCurrencyHelper(day.predictedIncome)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">Expense</span>
                              <span className="text-[12px] font-semibold text-red-500 dark:text-red-400">
                                -{formatCurrencyHelper(day.predictedExpense)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">Balance</span>
                              <span className={`text-[12px] font-semibold ${day.runningBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                                {formatCurrencyHelper(day.runningBalance)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">Confidence</span>
                              <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400">
                                {day.confidence.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Monthly Spending Patterns</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Based on your last 3 months of activity</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] rounded-xl border border-emerald-500/[0.12]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-400">Average Monthly Income</p>
              </div>
              <p className="text-[22px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrencyHelper(monthlyPattern.avgIncome)}
              </p>
            </div>
            <div className="p-4 bg-red-500/[0.06] dark:bg-red-500/[0.08] rounded-xl border border-red-500/[0.12]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-400">Average Monthly Expenses</p>
              </div>
              <p className="text-[22px] font-bold tracking-tight text-red-500 dark:text-red-400">
                {formatCurrencyHelper(monthlyPattern.avgExpense)}
              </p>
            </div>
          </div>

          {topCategories.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Top Expense Categories
              </p>
              <div className="space-y-2.5">
                {topCategories.map(([category, amount]) => {
                  const pct = Math.round(((amount as number) / maxCategorySpend) * 100);
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 capitalize">{category}</span>
                          <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                            {formatCurrencyHelper(amount as number)}/mo
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-amber-50/80 dark:bg-amber-500/[0.06] border border-amber-200/80 dark:border-amber-500/[0.15] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-300 mb-1">About These Predictions</p>
            <p className="text-[12px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
              These 3-month forecasts are generated using AI algorithms analyzing your past transaction patterns.
              Predictions become less accurate further into the future. Confidence scores reflect prediction reliability.
              Actual results may vary based on unexpected expenses or income changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
