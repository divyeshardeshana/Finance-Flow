import { useEffect, useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  CreditCard,
  Calendar,
  PieChart,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Info,
  Activity,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';

interface Recommendation {
  id: string;
  type: 'savings' | 'budget' | 'debt' | 'investment' | 'spending' | 'goal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  calculation?: string;
  icon: any;
  color: string;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
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

export function RecommendationsPage() {
  const { user } = useAuth();
  const { preferences } = useAppPreferences();
  const formatAmount = (amount: number) => formatCurrency(amount, preferences.currency);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    if (user) {
      generateRecommendations();
    }
  }, [user]);

  const generateRecommendations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      const { data: savingsGoals } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id);

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          return sum + convertedAmount;
        }, 0);

      const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          return sum + convertedAmount;
        }, 0);

      setTotalIncome(income);
      setTotalExpenses(expenses);

      const recs = analyzeAndGenerateRecommendations(
        transactions,
        income,
        expenses,
        savingsGoals || [],
        budgets || []
      );

      setRecommendations(recs);
      setLoading(false);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setLoading(false);
    }
  };

  const analyzeAndGenerateRecommendations = (
    transactions: any[],
    income: number,
    expenses: number,
    savingsGoals: any[],
    budgets: any[]
  ): Recommendation[] => {
    const recs: Recommendation[] = [];
    const monthCount = 3;
    const avgMonthlyIncome = income / monthCount;
    const avgMonthlyExpenses = expenses / monthCount;

    const categorySpending = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc: Record<string, number>, t) => {
        const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
        acc[t.category] = (acc[t.category] || 0) + convertedAmount;
        return acc;
      }, {});

    const categoryData: CategorySpending[] = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / expenses) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    if (avgMonthlyExpenses > avgMonthlyIncome * 0.9) {
      recs.push({
        id: 'high-expense-ratio',
        type: 'budget',
        priority: 'high',
        title: 'High Expense Ratio Alert',
        description: `You're spending ${((avgMonthlyExpenses / avgMonthlyIncome) * 100).toFixed(1)}% of your income. Financial experts recommend keeping expenses below 70%.`,
        impact: `Reduce expenses by ${formatAmount(avgMonthlyExpenses - avgMonthlyIncome * 0.7)} per month`,
        action: 'Review and cut non-essential expenses',
        icon: AlertTriangle,
        color: 'red',
      });
    }

    if (categoryData.length > 0 && categoryData[0].percentage > 30) {
      const topCategory = categoryData[0];
      const suggestedReduction = topCategory.amount * 0.2;
      const annualSavings = suggestedReduction * 12;

      recs.push({
        id: 'rebalance-category',
        type: 'budget',
        priority: 'high',
        title: `Rebalance ${topCategory.category} Spending`,
        description: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of your expenses. Consider reducing this by 20%.`,
        impact: `Save ${formatAmount(suggestedReduction)} per month, ${formatAmount(annualSavings)} annually`,
        action: `Move ${formatAmount(suggestedReduction)} from ${topCategory.category} to savings`,
        icon: PieChart,
        color: 'red',
      });
    }

    const entertainment = categoryData.find((c) => c.category.toLowerCase().includes('entertainment'));
    const savings = avgMonthlyIncome - avgMonthlyExpenses;
    if (entertainment && entertainment.percentage > 15 && savings < avgMonthlyIncome * 0.2) {
      const reduction = entertainment.amount * 0.3;
      recs.push({
        id: 'entertainment-to-savings',
        type: 'savings',
        priority: 'medium',
        title: 'Entertainment Spending Opportunity',
        description: 'Your entertainment spending is high relative to your savings rate.',
        impact: `Increase monthly savings by ${formatAmount(reduction / monthCount)}`,
        action: `Move ${formatAmount(reduction / monthCount)} from entertainment to savings`,
        icon: Target,
        color: 'green',
      });
    }

    const monthlyNet = avgMonthlyIncome - avgMonthlyExpenses;
    if (monthlyNet > 0) {
      const savingsAmount = monthlyNet * 0.5;
      const oneYear = savingsAmount * 12;
      const threeYears = savingsAmount * 36 * 1.05;
      const fiveYears = savingsAmount * 60 * 1.08;

      recs.push({
        id: 'compound-savings',
        type: 'savings',
        priority: 'medium',
        title: 'Savings Growth Potential',
        description: `With your current surplus of ${formatAmount(monthlyNet)}/month, you could build significant wealth.`,
        impact: `1 year: ${formatAmount(oneYear)} | 3 years: ${formatAmount(threeYears)} | 5 years: ${formatAmount(fiveYears)}`,
        action: `Save ${formatAmount(savingsAmount)} monthly`,
        calculation: 'Assuming 5% annual return for 3 years, 8% for 5 years',
        icon: TrendingUp,
        color: 'green',
      });
    }

    if (savingsGoals && savingsGoals.length > 0) {
      const activeGoals = savingsGoals.filter((g) => Number(g.current_amount) < Number(g.target_amount));
      activeGoals.forEach((goal) => {
        const remaining = Number(goal.target_amount) - Number(goal.current_amount);
        const targetDate = new Date(goal.target_date);
        const monthsRemaining = Math.max(
          1,
          Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
        );
        const monthlyRequired = remaining / monthsRemaining;

        if (monthlyRequired < monthlyNet) {
          recs.push({
            id: `goal-achievable-${goal.id}`,
            type: 'goal',
            priority: 'medium',
            title: `${goal.name} Goal is Achievable`,
            description: `You need ${formatAmount(monthlyRequired)}/month to reach your ${goal.name} goal.`,
            impact: `Achieve ${formatAmount(Number(goal.target_amount))} in ${monthsRemaining} months`,
            action: `Set up automatic transfer of ${formatAmount(monthlyRequired)} monthly`,
            icon: Target,
            color: 'blue',
          });
        } else {
          recs.push({
            id: `goal-adjust-${goal.id}`,
            type: 'goal',
            priority: 'low',
            title: `Adjust ${goal.name} Timeline`,
            description: `Current goal requires ${formatAmount(monthlyRequired)}/month but you have ${formatAmount(monthlyNet)} available.`,
            impact: 'Consider extending deadline or reducing target',
            action: 'Review goal parameters',
            icon: Calendar,
            color: 'amber',
          });
        }
      });
    }

    const subscriptions = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        t.is_recurring &&
        (t.category.toLowerCase().includes('subscription') ||
          t.category.toLowerCase().includes('entertainment'))
    );

    if (subscriptions.length > 3) {
      const totalSubscriptionCost = subscriptions.reduce((sum, s) => {
        const convertedAmount = convertCurrency(Number(s.amount), s.currency || 'USD', preferences.currency);
        return sum + convertedAmount;
      }, 0);
      recs.push({
        id: 'subscription-audit',
        type: 'spending',
        priority: 'medium',
        title: 'Subscription Audit Needed',
        description: `You have ${subscriptions.length} recurring subscriptions costing ${formatAmount(totalSubscriptionCost)} over 3 months.`,
        impact: `Cancel 2-3 unused subscriptions to save up to ${formatAmount(totalSubscriptionCost * 0.3)} quarterly`,
        action: 'Review and cancel unused subscriptions',
        icon: CreditCard,
        color: 'amber',
      });
    }

    const weekendExpenses = transactions.filter((t) => {
      const date = new Date(t.transaction_date);
      const day = date.getDay();
      return t.type === 'expense' && (day === 0 || day === 6);
    });

    const weekendSpending = weekendExpenses.reduce((sum, t) => {
      const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
      return sum + convertedAmount;
    }, 0);
    const weekdaySpending = expenses - weekendSpending;
    const avgWeekendPerDay = weekendSpending / (monthCount * 8);
    const avgWeekdayPerDay = weekdaySpending / (monthCount * 22);

    if (avgWeekendPerDay > avgWeekdayPerDay * 1.5) {
      const reduction = weekendSpending * 0.25;
      recs.push({
        id: 'weekend-spending',
        type: 'spending',
        priority: 'medium',
        title: 'Weekend Spending Pattern',
        description: `Your weekend spending is ${((avgWeekendPerDay / avgWeekdayPerDay - 1) * 100).toFixed(0)}% higher than weekdays.`,
        impact: `Save ${formatAmount(reduction / monthCount)} per month`,
        action: 'Plan budget-friendly weekend activities',
        icon: Calendar,
        color: 'blue',
      });
    }

    if (budgets && budgets.length > 0) {
      budgets.forEach((budget) => {
        const spent = categorySpending[budget.category] || 0;
        const monthlyBudget = convertCurrency(Number(budget.amount), budget.currency || 'AUD', preferences.currency);
        const overBudget = spent / monthCount - monthlyBudget;

        if (overBudget > monthlyBudget * 0.1) {
          recs.push({
            id: `budget-exceeded-${budget.id}`,
            type: 'budget',
            priority: 'high',
            title: `${budget.category} Budget Exceeded`,
            description: `You've exceeded your ${budget.category} budget by ${formatAmount(overBudget)}/month.`,
            impact: `Reduce by ${formatAmount(overBudget)} to stay on budget`,
            action: `Cut ${budget.category} spending by ${((overBudget / (spent / monthCount)) * 100).toFixed(0)}%`,
            icon: AlertTriangle,
            color: 'red',
          });
        }
      });
    }

    const smallSavingsScenarios = [10, 25, 50, 100];
    smallSavingsScenarios.forEach((amount) => {
      const oneYear = amount * 12;
      const fiveYears = amount * 60 * 1.06;
      const tenYears = amount * 120 * 1.13;

      recs.push({
        id: `small-savings-${amount}`,
        type: 'savings',
        priority: 'low',
        title: `Small Savings, Big Impact: ${formatAmount(amount)}/month`,
        description: `See how saving just ${formatAmount(amount)} monthly can grow over time.`,
        impact: `1 year: ${formatAmount(oneYear)} | 5 years: ${formatAmount(fiveYears)} | 10 years: ${formatAmount(tenYears)}`,
        action: `Start with ${formatAmount(amount)} monthly automatic transfer`,
        calculation: 'Assuming 6% return for 5 years, 13% for 10 years (compound)',
        icon: Sparkles,
        color: 'green',
      });
    });

    const emergencyFund = avgMonthlyExpenses * 6;
    const currentSavings = avgMonthlyIncome - avgMonthlyExpenses;
    const monthsToEmergencyFund = emergencyFund / Math.max(currentSavings, 1);

    if (monthsToEmergencyFund < 24) {
      recs.push({
        id: 'emergency-fund',
        type: 'savings',
        priority: 'high',
        title: 'Build Emergency Fund',
        description: `Aim for 6 months of expenses (${formatAmount(emergencyFund)}) in emergency savings.`,
        impact: `Achieve in ${Math.ceil(monthsToEmergencyFund)} months at current savings rate`,
        action: `Save ${formatAmount(currentSavings)} monthly for emergency fund`,
        icon: Target,
        color: 'red',
      });
    }

    const dining = categoryData.find((c) =>
      c.category.toLowerCase().includes('food') ||
      c.category.toLowerCase().includes('dining') ||
      c.category.toLowerCase().includes('restaurant')
    );

    if (dining && dining.percentage > 20) {
      const mealPrepSavings = dining.amount * 0.4;
      recs.push({
        id: 'meal-prep-savings',
        type: 'spending',
        priority: 'medium',
        title: 'Meal Prep Savings Opportunity',
        description: `Dining/food is ${dining.percentage.toFixed(1)}% of expenses. Cooking at home can save 40%.`,
        impact: `Save ${formatAmount(mealPrepSavings / monthCount)}/month`,
        action: 'Meal prep 3-4 days per week',
        icon: DollarSign,
        color: 'green',
      });
    }

    const transportation = categoryData.find((c) =>
      c.category.toLowerCase().includes('transport') ||
      c.category.toLowerCase().includes('gas') ||
      c.category.toLowerCase().includes('fuel')
    );

    if (transportation && transportation.percentage > 15) {
      const carpoolSavings = transportation.amount * 0.25;
      recs.push({
        id: 'transportation-optimization',
        type: 'spending',
        priority: 'low',
        title: 'Transportation Cost Reduction',
        description: 'Consider carpooling, public transit, or route optimization.',
        impact: `Save ${formatAmount(carpoolSavings / monthCount)}/month`,
        action: 'Explore alternative transportation options',
        icon: TrendingDown,
        color: 'blue',
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/[0.08] text-red-600 dark:text-red-400 border-red-500/[0.15]';
      case 'medium':
        return 'bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border-amber-500/[0.15]';
      case 'low':
        return 'bg-blue-500/[0.08] text-blue-600 dark:text-blue-400 border-blue-500/[0.15]';
      default:
        return 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/[0.08]';
    }
  };

  const getCardBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-[3px] border-l-red-500';
      case 'medium':
        return 'border-l-[3px] border-l-amber-500';
      default:
        return '';
    }
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/10';
      case 'green':
        return 'bg-emerald-500/10';
      case 'blue':
        return 'bg-blue-500/10';
      case 'amber':
        return 'bg-amber-500/10';
      default:
        return 'bg-gray-100 dark:bg-white/[0.06]';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'text-red-500';
      case 'green':
        return 'text-emerald-500';
      case 'blue':
        return 'text-blue-500';
      case 'amber':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
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
            <SkeletonBlock key={i} className="w-full h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            AI Recommendations
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Personalized financial advice based on your spending patterns
          </p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-14 text-center">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-blue-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            Not enough data to generate recommendations
          </p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Add more transactions to receive personalized financial advice
          </p>
        </div>
      </div>
    );
  }

  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
          AI Recommendations
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
          Personalized financial advice based on your spending patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Lightbulb className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              Total Recommendations
            </p>
            <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
              {recommendations.length}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">
              {highPriority.length} high priority
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              Monthly Income
            </p>
            <p className="text-[22px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatAmount(totalIncome / 3)}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">3-month average</p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              Monthly Expenses
            </p>
            <p className="text-[22px] font-bold tracking-tight text-red-500">
              {formatAmount(totalExpenses / 3)}
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">3-month average</p>
          </div>
        </div>
      </div>

      {highPriority.length > 0 && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">High Priority Actions</h2>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">Immediate attention recommended</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-500/[0.08] text-red-600 dark:text-red-400 border-red-500/[0.15]">
              {highPriority.length}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {highPriority.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                getPriorityBadge={getPriorityBadge}
                getCardBorder={getCardBorder}
                getIconBg={getIconBg}
                getIconColor={getIconColor}
              />
            ))}
          </div>
        </div>
      )}

      {mediumPriority.length > 0 && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Medium Priority Recommendations</h2>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">Opportunities to improve your finances</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border-amber-500/[0.15]">
              {mediumPriority.length}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {mediumPriority.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                getPriorityBadge={getPriorityBadge}
                getCardBorder={getCardBorder}
                getIconBg={getIconBg}
                getIconColor={getIconColor}
              />
            ))}
          </div>
        </div>
      )}

      {lowPriority.length > 0 && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Additional Opportunities</h2>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">Long-term wealth building suggestions</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-blue-500/[0.08] text-blue-600 dark:text-blue-400 border-blue-500/[0.15]">
              {lowPriority.length}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {lowPriority.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                getPriorityBadge={getPriorityBadge}
                getCardBorder={getCardBorder}
                getIconBg={getIconBg}
                getIconColor={getIconColor}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50/80 dark:bg-amber-500/[0.06] border border-amber-200/80 dark:border-amber-500/[0.15] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-300 mb-2">AI-Powered Insights</p>
            <div className="space-y-1.5">
              <p className="text-[12px] text-amber-800/80 dark:text-amber-300/70">
                These recommendations are generated by analyzing your last 3 months of financial data.
              </p>
              <p className="text-[12px] text-amber-800/80 dark:text-amber-300/70">
                Taking action on high-priority items can significantly improve your financial health.
              </p>
              <p className="text-[12px] text-amber-800/80 dark:text-amber-300/70">
                Recommendations are updated as your spending patterns change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  rec: Recommendation;
  getPriorityBadge: (priority: string) => string;
  getCardBorder: (priority: string) => string;
  getIconBg: (color: string) => string;
  getIconColor: (color: string) => string;
}

function RecommendationCard({
  rec,
  getPriorityBadge,
  getCardBorder,
  getIconBg,
  getIconColor,
}: RecommendationCardProps) {
  return (
    <div
      className={`bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-4 ${getCardBorder(rec.priority)}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(rec.color)}`}>
          <rec.icon className={`w-5 h-5 ${getIconColor(rec.color)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h5 className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">{rec.title}</h5>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(rec.priority)}`}>
              {rec.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{rec.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-start gap-2 bg-blue-500/[0.06] border border-blue-500/[0.12] rounded-lg px-3 py-2">
              <Target className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5 uppercase tracking-wide">Impact</p>
                <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug">{rec.impact}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-emerald-500/[0.06] border border-emerald-500/[0.12] rounded-lg px-3 py-2">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5 uppercase tracking-wide">Action</p>
                <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug">{rec.action}</p>
              </div>
            </div>
          </div>
          {rec.calculation && (
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2.5 pt-2.5 border-t border-gray-200/60 dark:border-white/[0.05]">
              {rec.calculation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
