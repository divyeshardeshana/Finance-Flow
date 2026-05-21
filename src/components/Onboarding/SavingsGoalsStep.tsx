import { useState } from 'react';
import { Target, Plus, X, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SavingsGoalsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Goal {
  name: string;
  amount: string;
}

export function SavingsGoalsStep({ onComplete, onBack }: SavingsGoalsStepProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([{ name: '', amount: '' }]);
  const [loading, setLoading] = useState(false);

  const addGoal = () => {
    setGoals([...goals, { name: '', amount: '' }]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...goals];
    updated[index][field] = value;
    setGoals(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const validGoals = goals.filter((g) => g.name && g.amount);
    if (validGoals.length > 0) {
      await supabase.from('savings_goals').insert(
        validGoals.map((goal, index) => ({
          user_id: user.id,
          goal_name: goal.name,
          target_amount: parseFloat(goal.amount),
          current_amount: 0,
          priority: index + 1,
          status: 'active',
        }))
      );
    }

    setLoading(false);
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Savings Goals</h2>
      <p className="text-gray-600 mb-8">
        What are you saving for? You can add or modify these later
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {goals.map((goal, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={goal.name}
                  onChange={(e) => updateGoal(index, 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Goal name (e.g., Emergency Fund)"
                />
              </div>
              <div className="w-40">
                <input
                  type="number"
                  value={goal.amount}
                  onChange={(e) => updateGoal(index, 'amount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Amount"
                  min="0"
                  step="100"
                />
              </div>
              {goals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="p-3 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addGoal}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Another Goal
        </button>

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
        <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Pro Tip</p>
          <p className="text-blue-700">
            Experts recommend having 3-6 months of expenses saved as an emergency fund before
            focusing on other goals
          </p>
        </div>
      </div>
    </div>
  );
}
