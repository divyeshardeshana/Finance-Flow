import { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, ChevronLeft } from 'lucide-react';
import { IncomeType } from './OnboardingFlow';

interface IncomeStepProps {
  onComplete: (incomeType: IncomeType, monthlyIncome: number) => void;
  onBack: () => void;
}

export function IncomeStep({ onComplete, onBack }: IncomeStepProps) {
  const [incomeType, setIncomeType] = useState<IncomeType | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeType && monthlyIncome) {
      onComplete(incomeType, parseFloat(monthlyIncome));
    }
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

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Income Information</h2>
      <p className="text-gray-600 mb-8">Help us understand your income pattern</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            What type of income do you have?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIncomeType('regular')}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                incomeType === 'regular'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <Calendar className={`w-8 h-8 mb-3 ${incomeType === 'regular' ? 'text-blue-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Regular Income</h3>
              <p className="text-sm text-gray-600">Fixed salary or consistent income</p>
            </button>

            <button
              type="button"
              onClick={() => setIncomeType('irregular')}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                incomeType === 'irregular'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <TrendingUp className={`w-8 h-8 mb-3 ${incomeType === 'irregular' ? 'text-blue-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Irregular Income</h3>
              <p className="text-sm text-gray-600">Variable or project-based income</p>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
            Average Monthly Income
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="monthlyIncome"
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5000"
              required
              min="0"
              step="100"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {incomeType === 'irregular'
              ? 'Estimate your average monthly income over the past 6 months'
              : 'Enter your monthly take-home pay'}
          </p>
        </div>

        <button
          type="submit"
          disabled={!incomeType || !monthlyIncome}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
