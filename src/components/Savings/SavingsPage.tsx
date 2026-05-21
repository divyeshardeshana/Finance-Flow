import { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, PiggyBank, CreditCard as Edit2, Trash2, X, Clock, Calendar, CheckCircle2, Banknote } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  priority: number;
  status: string;
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

function SkeletonGoalCard() {
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
      <div className="flex justify-between mt-3">
        <SkeletonBlock className="w-28 h-3" />
        <SkeletonBlock className="w-20 h-3" />
      </div>
    </div>
  );
}

const GOAL_COLORS: Array<{ bg: string; icon: string; bar: string }> = [
  { bg: 'bg-blue-500/10 dark:bg-blue-500/[0.15]', icon: 'text-blue-600 dark:text-blue-400', bar: 'from-blue-500 to-cyan-400' },
  { bg: 'bg-emerald-500/10 dark:bg-emerald-500/[0.15]', icon: 'text-emerald-600 dark:text-emerald-400', bar: 'from-emerald-500 to-teal-400' },
  { bg: 'bg-amber-500/10 dark:bg-amber-500/[0.15]', icon: 'text-amber-600 dark:text-amber-400', bar: 'from-amber-500 to-orange-400' },
  { bg: 'bg-rose-500/10 dark:bg-rose-500/[0.15]', icon: 'text-rose-600 dark:text-rose-400', bar: 'from-rose-500 to-pink-400' },
  { bg: 'bg-violet-500/10 dark:bg-violet-500/[0.15]', icon: 'text-violet-600 dark:text-violet-400', bar: 'from-violet-500 to-purple-400' },
  { bg: 'bg-cyan-500/10 dark:bg-cyan-500/[0.15]', icon: 'text-cyan-600 dark:text-cyan-400', bar: 'from-cyan-500 to-sky-400' },
];

const PRIORITY_CONFIG: Record<number, { label: string; pill: string }> = {
  1: { label: 'High', pill: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  2: { label: 'Medium', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  3: { label: 'Low', pill: 'bg-gray-500/10 text-gray-500 dark:text-gray-400' },
};

export function SavingsPage() {
  const { user } = useAuth();
  const { formatAmount } = useAppPreferences();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    monthly_contribution: '',
    priority: '1',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority');
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Goal name is required';
    const targetAmount = parseFloat(formData.target_amount);
    if (!formData.target_amount || isNaN(targetAmount) || targetAmount <= 0)
      errors.target_amount = 'Target amount must be greater than 0';
    const currentAmount = parseFloat(formData.current_amount || '0');
    if (formData.current_amount && (isNaN(currentAmount) || currentAmount < 0))
      errors.current_amount = 'Current amount must be 0 or greater';
    const monthlyContribution = parseFloat(formData.monthly_contribution || '0');
    if (formData.monthly_contribution && (isNaN(monthlyContribution) || monthlyContribution < 0))
      errors.monthly_contribution = 'Monthly contribution must be 0 or greater';
    if (!formData.target_date) {
      errors.target_date = 'Target date is required';
    } else {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate < today) errors.target_date = 'Target date cannot be in the past';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;
    setSaving(true);
    const targetAmount = parseFloat(formData.target_amount);
    const currentAmount = parseFloat(formData.current_amount || '0');
    const monthlyContribution = parseFloat(formData.monthly_contribution || '0');
    const priority = parseInt(formData.priority);
    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('savings_goals')
          .update({
            name: formData.name,
            target_amount: targetAmount,
            current_amount: currentAmount,
            target_date: formData.target_date,
            monthly_contribution: monthlyContribution,
            priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGoal.id)
          .eq('user_id', user.id);
        if (error) throw new Error(error.message || 'Failed to update goal');
      } else {
        const { error } = await supabase.from('savings_goals').insert({
          user_id: user.id,
          name: formData.name,
          target_amount: targetAmount,
          current_amount: currentAmount,
          target_date: formData.target_date,
          monthly_contribution: monthlyContribution,
          priority,
          status: 'active',
        });
        if (error) throw new Error(error.message || 'Failed to create goal');
      }
      closeModal();
      fetchGoals();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      alert(error.message || 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openModal = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        target_date: goal.target_date,
        monthly_contribution: goal.monthly_contribution.toString(),
        priority: goal.priority.toString(),
      });
    } else {
      setEditingGoal(null);
      setFormData({ name: '', target_amount: '', current_amount: '', target_date: '', monthly_contribution: '', priority: '1' });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setFormData({ name: '', target_amount: '', current_amount: '', target_date: '', monthly_contribution: '', priority: '1' });
    setFormErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const calcProgress = (current: number, target: number) =>
    target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const calcMonthsToGoal = (current: number, target: number, monthly: number) => {
    if (monthly <= 0 || current >= target) return 0;
    return Math.ceil((target - current) / monthly);
  };

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalCurrent = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalRemaining = totalTarget - totalCurrent;

  const inputClass = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 text-[13px] border rounded-xl bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all ${
      hasError
        ? 'border-red-400 dark:border-red-500/60'
        : 'border-gray-200/80 dark:border-white/[0.1]'
    }`;

  const labelClass = 'block text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Track your progress toward financial milestones
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[13px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/[0.15] flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Total Target
            </p>
            <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
              {formatAmount(totalTarget)}
            </p>
          </div>

          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/[0.15] flex items-center justify-center mb-4">
              <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Current Savings
            </p>
            <p className="text-[22px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatAmount(totalCurrent)}
            </p>
          </div>

          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Remaining
            </p>
            <p className="text-[22px] font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {formatAmount(totalRemaining)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonGoalCard />
          <SkeletonGoalCard />
          <SkeletonGoalCard />
          <SkeletonGoalCard />
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/[0.12] flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            No savings goals yet
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
            Set a financial target and start tracking your progress
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[13px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal, idx) => {
            const colors = GOAL_COLORS[idx % GOAL_COLORS.length];
            const progress = calcProgress(goal.current_amount, goal.target_amount);
            const months = calcMonthsToGoal(goal.current_amount, goal.target_amount, goal.monthly_contribution);
            const priority = PRIORITY_CONFIG[goal.priority] || PRIORITY_CONFIG[3];
            const isComplete = progress >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-150 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Target className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                          {goal.name}
                        </h3>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${priority.pill}`}>
                          {priority.label}
                        </span>
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Target: {formatAmount(Number(goal.target_amount))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(goal)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.1] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.1] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Progress
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {formatAmount(Number(goal.current_amount))} / {formatAmount(Number(goal.target_amount))}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${isComplete ? 'from-emerald-500 to-teal-400' : colors.bar} transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Details Row */}
                <div className="flex items-center gap-4 flex-wrap">
                  {goal.monthly_contribution > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <span className="text-[12px] text-gray-600 dark:text-gray-400">
                        {formatAmount(Number(goal.monthly_contribution))}
                        <span className="text-gray-400 dark:text-gray-500"> / month</span>
                      </span>
                    </div>
                  )}
                  {months > 0 && !isComplete && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <span className="text-[12px] text-gray-600 dark:text-gray-400">
                        {months}
                        <span className="text-gray-400 dark:text-gray-500"> months to goal</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Target Date */}
                {goal.target_date && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.05] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <span className="text-[12px] text-gray-500 dark:text-gray-400">
                      Target Date:{' '}
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {new Date(goal.target_date).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-[#0F1623] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingGoal ? 'Update your goal details' : 'Set a target and start saving'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Goal Name <span className="text-red-500 normal-case">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: '' }); }}
                  className={inputClass(!!formErrors.name)}
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                />
                {formErrors.name && <p className="mt-1 text-[11px] text-red-500">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Target Amount <span className="text-red-500 normal-case">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.target_amount}
                    onChange={(e) => { setFormData({ ...formData, target_amount: e.target.value }); if (formErrors.target_amount) setFormErrors({ ...formErrors, target_amount: '' }); }}
                    className={inputClass(!!formErrors.target_amount)}
                    placeholder="0.00"
                  />
                  {formErrors.target_amount && <p className="mt-1 text-[11px] text-red-500">{formErrors.target_amount}</p>}
                </div>

                <div>
                  <label className={labelClass}>Current Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_amount}
                    onChange={(e) => { setFormData({ ...formData, current_amount: e.target.value }); if (formErrors.current_amount) setFormErrors({ ...formErrors, current_amount: '' }); }}
                    className={inputClass(!!formErrors.current_amount)}
                    placeholder="0.00"
                  />
                  {formErrors.current_amount && <p className="mt-1 text-[11px] text-red-500">{formErrors.current_amount}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Monthly Contribution</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_contribution}
                    onChange={(e) => { setFormData({ ...formData, monthly_contribution: e.target.value }); if (formErrors.monthly_contribution) setFormErrors({ ...formErrors, monthly_contribution: '' }); }}
                    className={inputClass(!!formErrors.monthly_contribution)}
                    placeholder="0.00"
                  />
                  {formErrors.monthly_contribution && <p className="mt-1 text-[11px] text-red-500">{formErrors.monthly_contribution}</p>}
                </div>

                <div>
                  <label className={labelClass}>Target Date <span className="text-red-500 normal-case">*</span></label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => { setFormData({ ...formData, target_date: e.target.value }); if (formErrors.target_date) setFormErrors({ ...formErrors, target_date: '' }); }}
                    className={inputClass(!!formErrors.target_date)}
                  />
                  {formErrors.target_date && <p className="mt-1 text-[11px] text-red-500">{formErrors.target_date}</p>}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className={labelClass}>Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {([1, 2, 3] as const).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const isSelected = formData.priority === String(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: String(p) })}
                        className={`py-2 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
                          isSelected
                            ? `${cfg.pill} border-current`
                            : 'text-gray-500 dark:text-gray-400 border-gray-200/80 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.2] bg-transparent'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200/80 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
