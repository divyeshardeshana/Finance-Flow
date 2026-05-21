import { useState } from 'react';
import { Shield, TrendingUp, Zap, ChevronLeft } from 'lucide-react';
import { RiskTolerance } from './OnboardingFlow';

interface RiskToleranceStepProps {
  onComplete: (riskTolerance: RiskTolerance) => void;
  onBack: () => void;
}

export function RiskToleranceStep({ onComplete, onBack }: RiskToleranceStepProps) {
  const [selected, setSelected] = useState<RiskTolerance | null>(null);

  const options = [
    {
      type: 'conservative' as RiskTolerance,
      icon: Shield,
      title: 'Conservative',
      description: 'Prefer stability and low risk, even with lower returns',
      color: 'green',
    },
    {
      type: 'moderate' as RiskTolerance,
      icon: TrendingUp,
      title: 'Moderate',
      description: 'Balance between risk and return, willing to accept some fluctuation',
      color: 'blue',
    },
    {
      type: 'aggressive' as RiskTolerance,
      icon: Zap,
      title: 'Aggressive',
      description: 'Seek maximum returns and comfortable with high risk',
      color: 'orange',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Investment Risk Profile</h2>
      <p className="text-gray-600 mb-8">
        This helps us provide personalized investment recommendations
      </p>

      <div className="space-y-4 mb-6">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.type;

          return (
            <button
              key={option.type}
              onClick={() => setSelected(option.type)}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                isSelected
                  ? `border-${option.color}-500 bg-${option.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    isSelected ? `bg-${option.color}-200` : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? `text-${option.color}-600` : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? `border-${option.color}-500` : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className={`w-3 h-3 rounded-full bg-${option.color}-500`} />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
