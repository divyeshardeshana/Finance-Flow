import { useState } from 'react';
import { UserTypeStep } from './UserTypeStep';
import { IncomeStep } from './IncomeStep';
import { RiskToleranceStep } from './RiskToleranceStep';
import { SavingsGoalsStep } from './SavingsGoalsStep';
import { CountryStep } from './CountryStep';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export type UserType = 'individual' | 'family' | 'freelancer' | 'small_business';
export type IncomeType = 'regular' | 'irregular';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

interface OnboardingData {
  userType?: UserType;
  incomeType?: IncomeType;
  monthlyIncome?: number;
  riskTolerance?: RiskTolerance;
  country?: string;
  currency?: string;
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  const handleUserTypeComplete = (userType: UserType) => {
    setData({ ...data, userType });
    setStep(2);
  };

  const handleCountryComplete = (country: string, currency: string) => {
    setData({ ...data, country, currency });
    setStep(3);
  };

  const handleIncomeComplete = (incomeType: IncomeType, monthlyIncome: number) => {
    setData({ ...data, incomeType, monthlyIncome });
    setStep(4);
  };

  const handleRiskToleranceComplete = (riskTolerance: RiskTolerance) => {
    setData({ ...data, riskTolerance });
    setStep(5);
  };

  const handleSavingsGoalsComplete = async () => {
    if (!user) {
      setError('No user found. Please try logging in again.');
      return;
    }

    if (!data.userType || !data.incomeType || !data.monthlyIncome || !data.riskTolerance) {
      setError('Please complete all onboarding steps.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        id: user.id,
        user_type: data.userType,
        income_type: data.incomeType,
        average_monthly_income: data.monthlyIncome,
        risk_tolerance: data.riskTolerance,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (data.country) payload.country = data.country;
      if (data.currency) payload.currency = data.currency;

      const { error: upsertError } = await supabase.from('user_profiles').upsert(payload);

      if (upsertError) {
        console.error('Error updating profile:', upsertError);
        setError(`Failed to save profile: ${upsertError.message}. Please try again.`);
        setSaving(false);
        return;
      }

      onComplete();
    } catch (err) {
      console.error('Unexpected error during profile save:', err);
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSavingsGoalsComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">Error Saving Profile</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {saving && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-blue-800">Saving your profile...</p>
            </div>
          </div>
        )}

        {step === 1 && <UserTypeStep onComplete={handleUserTypeComplete} />}
        {step === 2 && <CountryStep onComplete={handleCountryComplete} onBack={() => setStep(1)} />}
        {step === 3 && <IncomeStep onComplete={handleIncomeComplete} onBack={() => setStep(2)} />}
        {step === 4 && (
          <RiskToleranceStep onComplete={handleRiskToleranceComplete} onBack={() => setStep(3)} />
        )}
        {step === 5 && (
          <SavingsGoalsStep onComplete={handleSavingsGoalsComplete} onBack={() => setStep(4)} />
        )}
      </div>
    </div>
  );
}
