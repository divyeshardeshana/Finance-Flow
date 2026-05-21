import { useState, useEffect } from 'react';
import { Calculator, Plus, Pencil, Trash2, TrendingUp, DollarSign, Calendar, AlertCircle, CheckCircle, X, Landmark, Briefcase, PiggyBank, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency, formatNumber } from '../../lib/currency';
import { Database } from '../../lib/database.types';
import { MetricCard } from '../ui/MetricCard';
import { getCountryName } from '../../lib/countries';

interface CountryRetirementPlan {
  country_code: string;
  plan_1_name: string;
  plan_1_description: string;
  plan_2_name: string;
  plan_2_description: string;
  plan_3_name: string;
  plan_3_description: string;
  plan_4_name: string;
  plan_4_description: string;
  plan_5_name: string;
  plan_5_description: string;
}

type RetirementAccount = Database['public']['Tables']['retirement_accounts']['Row'];
type RetirementProjection = Database['public']['Tables']['retirement_projections']['Row'];

const accountTypeLabels: Record<string, string> = {
  '401k': '401(k)',
  ira_traditional: 'Traditional IRA',
  ira_roth: 'Roth IRA',
  '403b': '403(b)',
  sep_ira: 'SEP IRA',
  simple_ira: 'SIMPLE IRA',
  pension: 'Pension',
  other: 'Other',
};

const accountTypeIcons: Record<string, React.ElementType> = {
  '401k': Briefcase,
  ira_traditional: Landmark,
  ira_roth: Landmark,
  '403b': Briefcase,
  sep_ira: PiggyBank,
  simple_ira: PiggyBank,
  pension: DollarSign,
  other: TrendingUp,
};

const accountTypeColors: Record<string, string> = {
  '401k': 'bg-blue-500/10 dark:bg-blue-500/[0.15] text-blue-500',
  ira_traditional: 'bg-amber-500/10 dark:bg-amber-500/[0.15] text-amber-500',
  ira_roth: 'bg-emerald-500/10 dark:bg-emerald-500/[0.15] text-emerald-500',
  '403b': 'bg-sky-500/10 dark:bg-sky-500/[0.15] text-sky-500',
  sep_ira: 'bg-orange-500/10 dark:bg-orange-500/[0.15] text-orange-500',
  simple_ira: 'bg-teal-500/10 dark:bg-teal-500/[0.15] text-teal-500',
  pension: 'bg-rose-500/10 dark:bg-rose-500/[0.15] text-rose-500',
  other: 'bg-gray-500/10 dark:bg-gray-500/[0.15] text-gray-500',
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />;
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

function SkeletonAccountCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <SkeletonBlock className="w-40 h-3.5 mb-2" />
          <SkeletonBlock className="w-28 h-2.5 rounded-full" />
        </div>
        <div className="text-right">
          <SkeletonBlock className="w-28 h-4 mb-1.5 ml-auto" />
          <SkeletonBlock className="w-20 h-2.5 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 dark:focus:border-blue-400/60 transition-colors';
const labelClass = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5';

export function RetirementPage() {
  const { user } = useAuth();
  const { checkAndLogAccess } = useSubscription();
  const { preferences } = useAppPreferences();
  const currency = preferences.currency;

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<RetirementAccount[]>([]);
  const [projection, setProjection] = useState<RetirementProjection | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingAccount, setEditingAccount] = useState<RetirementAccount | null>(null);
  const [calculatorError, setCalculatorError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [countryPlan, setCountryPlan] = useState<CountryRetirementPlan | null>(null);
  const [userCountry, setUserCountry] = useState<string>('');

  const [accountFormData, setAccountFormData] = useState({
    account_name: '',
    account_type: '401k' as RetirementAccount['account_type'],
    current_balance: '',
    employer_match: '',
    annual_contribution: '',
    institution: '',
    notes: '',
  });

  const [calculatorData, setCalculatorData] = useState({
    current_age: '30',
    retirement_age: '65',
    life_expectancy: '85',
    current_savings: '',
    annual_contribution: '',
    expected_return_rate: '7',
    inflation_rate: '3',
    desired_annual_income: '',
  });

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + convertCurrency(Number(acc.current_balance), acc.currency || 'USD', currency),
    0
  );
  const totalContributions = accounts.reduce(
    (sum, acc) => sum + convertCurrency(Number(acc.annual_contribution), acc.currency || 'USD', currency),
    0
  );

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  async function checkFeatureAccess() {
    const hasAccess = await checkAndLogAccess('retirement_planning');
    if (hasAccess) {
      loadData();
    }
  }

  async function loadData() {
    if (!user) return;

    try {
      const [accountsRes, projectionRes, profileRes] = await Promise.all([
        supabase
          .from('retirement_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('current_balance', { ascending: false }),
        supabase
          .from('retirement_projections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('user_profiles')
          .select('country')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (projectionRes.error && projectionRes.error.code !== 'PGRST116') throw projectionRes.error;

      setAccounts(accountsRes.data || []);
      setProjection(projectionRes.data);

      const country = profileRes.data?.country || '';
      setUserCountry(country);
      if (country) {
        const { data: planData } = await supabase
          .from('country_retirement_plans')
          .select('*')
          .eq('country_code', country)
          .maybeSingle();
        setCountryPlan(planData || null);
      }

      if (projectionRes.data) {
        setCalculatorData({
          current_age: projectionRes.data.current_age.toString(),
          retirement_age: projectionRes.data.retirement_age.toString(),
          life_expectancy: projectionRes.data.life_expectancy.toString(),
          current_savings: projectionRes.data.current_savings.toString(),
          annual_contribution: projectionRes.data.annual_contribution.toString(),
          expected_return_rate: projectionRes.data.expected_return_rate.toString(),
          inflation_rate: projectionRes.data.inflation_rate.toString(),
          desired_annual_income: projectionRes.data.desired_annual_income.toString(),
        });
      } else {
        const bal = accountsRes.data?.reduce(
          (sum, acc) => sum + convertCurrency(Number(acc.current_balance), acc.currency || 'USD', currency),
          0
        ) ?? 0;
        const contrib = accountsRes.data?.reduce(
          (sum, acc) => sum + convertCurrency(Number(acc.annual_contribution), acc.currency || 'USD', currency),
          0
        ) ?? 0;
        setCalculatorData(prev => ({
          ...prev,
          current_savings: bal.toString(),
          annual_contribution: contrib.toString(),
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const data = {
        user_id: user.id,
        account_name: accountFormData.account_name,
        account_type: accountFormData.account_type,
        current_balance: parseFloat(accountFormData.current_balance),
        employer_match: parseFloat(accountFormData.employer_match) || 0,
        annual_contribution: parseFloat(accountFormData.annual_contribution) || 0,
        institution: accountFormData.institution,
        notes: accountFormData.notes,
        currency,
      };

      if (editingAccount) {
        const { error } = await supabase.from('retirement_accounts').update(data).eq('id', editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('retirement_accounts').insert(data);
        if (error) throw error;
      }

      resetAccountForm();
      loadData();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  }

  async function handleCalculate() {
    if (!user) return;
    setCalculatorError('');

    const currentAge = parseInt(calculatorData.current_age);
    const retirementAge = parseInt(calculatorData.retirement_age);
    const lifeExpectancy = parseInt(calculatorData.life_expectancy);
    const currentSavings = parseFloat(calculatorData.current_savings);
    const annualContribution = parseFloat(calculatorData.annual_contribution);
    const expectedReturn = parseFloat(calculatorData.expected_return_rate);
    const inflationRate = parseFloat(calculatorData.inflation_rate);
    const desiredIncome = parseFloat(calculatorData.desired_annual_income);

    if (
      isNaN(currentAge) || isNaN(retirementAge) || isNaN(lifeExpectancy) ||
      isNaN(currentSavings) || isNaN(annualContribution) || isNaN(expectedReturn) ||
      isNaN(inflationRate) || isNaN(desiredIncome)
    ) {
      setCalculatorError('Please fill in all fields with valid numbers.');
      return;
    }

    if (currentAge >= retirementAge) {
      setCalculatorError('Current age must be less than retirement age.');
      return;
    }

    if (retirementAge >= lifeExpectancy) {
      setCalculatorError('Retirement age must be less than life expectancy.');
      return;
    }

    if (currentSavings < 0 || annualContribution < 0 || desiredIncome < 0) {
      setCalculatorError('Financial values cannot be negative.');
      return;
    }

    setCalculating(true);

    try {
      const { data, error } = await supabase.rpc('calculate_retirement_projection', {
        current_age_param: currentAge,
        retirement_age_param: retirementAge,
        life_expectancy_param: lifeExpectancy,
        current_savings_param: currentSavings,
        annual_contribution_param: annualContribution,
        expected_return_param: expectedReturn,
        inflation_param: inflationRate,
        desired_income_param: desiredIncome,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setCalculatorError('Calculation returned no results. Please check your inputs.');
        return;
      }

      const result = data[0];
      const projectionData = {
        user_id: user.id,
        current_age: currentAge,
        retirement_age: retirementAge,
        life_expectancy: lifeExpectancy,
        current_savings: currentSavings,
        annual_contribution: annualContribution,
        expected_return_rate: expectedReturn,
        inflation_rate: inflationRate,
        desired_annual_income: desiredIncome,
        projected_balance: result.projected_balance,
        monthly_income_at_retirement: result.monthly_income,
        savings_gap: result.savings_gap,
      };

      if (projection) {
        const { error: updateError } = await supabase
          .from('retirement_projections')
          .update(projectionData)
          .eq('id', projection.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('retirement_projections')
          .insert(projectionData);
        if (insertError) throw insertError;
      }

      loadData();
      setShowCalculator(false);
    } catch (error: any) {
      setCalculatorError(error.message || 'Failed to calculate projection. Please try again.');
    } finally {
      setCalculating(false);
    }
  }

  function getDefaultAccountType(): string {
    if (countryPlan) {
      const firstPlan = [1, 2, 3, 4, 5]
        .map((n) => countryPlan[`plan_${n}_name` as keyof CountryRetirementPlan] as string)
        .find(Boolean);
      if (firstPlan) return firstPlan;
    }
    return '401k';
  }

  function resetAccountForm() {
    setAccountFormData({
      account_name: '',
      account_type: getDefaultAccountType() as RetirementAccount['account_type'],
      current_balance: '',
      employer_match: '',
      annual_contribution: '',
      institution: '',
      notes: '',
    });
    setEditingAccount(null);
    setShowAccountForm(false);
  }

  function handleEditAccount(account: RetirementAccount) {
    setEditingAccount(account);
    setAccountFormData({
      account_name: account.account_name,
      account_type: account.account_type,
      current_balance: account.current_balance.toString(),
      employer_match: account.employer_match.toString(),
      annual_contribution: account.annual_contribution.toString(),
      institution: account.institution,
      notes: account.notes,
    });
    setShowAccountForm(true);
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm('Are you sure you want to delete this retirement account?')) return;

    try {
      const { error } = await supabase.from('retirement_accounts').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  }

  const isOnTrack = projection && (projection.savings_gap ?? 0) <= 0;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            Retirement Planning
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Plan and track your retirement readiness
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setCalculatorData(prev => ({
                ...prev,
                current_savings: totalBalance.toString(),
                annual_contribution: totalContributions.toString(),
              }));
              setShowCalculator(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            <Calculator className="w-4 h-4" />
            Calculate Projection
          </button>
          <button
            onClick={() => {
              resetAccountForm();
              setShowAccountForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Retirement Savings"
              value={formatCurrency(totalBalance, currency)}
              icon={<DollarSign className="w-5 h-5 text-blue-500" />}
              iconBg="bg-blue-500/10 dark:bg-blue-500/[0.15]"
              sub={`${formatNumber(accounts.length)} account${accounts.length !== 1 ? 's' : ''}`}
            />
            <MetricCard
              label="Annual Contributions"
              value={formatCurrency(totalContributions, currency)}
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
              iconBg="bg-emerald-500/10 dark:bg-emerald-500/[0.15]"
              sub="Per year"
            />
            <MetricCard
              label="Retirement Age"
              value={String(projection?.retirement_age ?? 65)}
              icon={<Calendar className="w-5 h-5 text-teal-500" />}
              iconBg="bg-teal-500/10 dark:bg-teal-500/[0.15]"
              sub="Target age"
            />
          </>
        )}
      </div>

      {/* Retirement Projection */}
      {!loading && projection && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Retirement Projection</h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Based on your current accounts and settings
                </p>
              </div>
              {isOnTrack ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 dark:bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  On Track
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 dark:bg-orange-500/[0.12] text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Needs Attention
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Projected Balance
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(projection.projected_balance ?? 0, currency)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  At age {projection.retirement_age}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Monthly Income
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(projection.monthly_income_at_retirement ?? 0, currency)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">In retirement</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Years to Retirement
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {projection.retirement_age - projection.current_age}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Remaining</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  {isOnTrack ? 'Surplus' : 'Savings Gap'}
                </p>
                <p className={`text-xl font-bold ${isOnTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatCurrency(Math.abs(projection.savings_gap ?? 0), currency)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Annual income delta</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/[0.05] dark:bg-blue-500/[0.07] border border-blue-500/10 dark:border-blue-500/[0.15]">
              <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                Based on a <span className="font-semibold text-gray-900 dark:text-white">{projection.expected_return_rate}% return rate</span> and{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{projection.inflation_rate}% inflation</span>, you will have approximately{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(projection.projected_balance ?? 0, currency)}</span> at age{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{projection.retirement_age}</span>, providing{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(projection.monthly_income_at_retirement ?? 0, currency)}/month</span> in retirement income.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retirement Accounts */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Retirement Accounts</h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            Track all your retirement savings accounts in one place
          </p>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              <SkeletonAccountCard />
              <SkeletonAccountCard />
              <SkeletonAccountCard />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.12] flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                No retirement accounts yet
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto">
                Start planning for the future by adding your retirement accounts
              </p>
              <button
                onClick={() => {
                  resetAccountForm();
                  setShowAccountForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const Icon = accountTypeIcons[account.account_type] ?? TrendingUp;
                const colorClass = accountTypeColors[account.account_type] ?? accountTypeColors.other;
                return (
                  <div
                    key={account.id}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02] hover:bg-gray-50/60 dark:hover:bg-white/[0.04] hover:border-gray-200 dark:hover:border-white/[0.1] transition-colors duration-150"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                        {account.account_name}
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <span>{accountTypeLabels[account.account_type]}</span>
                        {account.institution && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{account.institution}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          convertCurrency(Number(account.current_balance), account.currency || 'USD', currency),
                          currency
                        )}
                      </p>
                      {account.annual_contribution > 0 && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatCurrency(
                            convertCurrency(Number(account.annual_contribution), account.currency || 'USD', currency),
                            currency
                          )}/year
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Country Retirement Plans */}
      {!loading && countryPlan && (() => {
        const planEntries = [1, 2, 3, 4, 5]
          .map((n) => ({
            name: countryPlan[`plan_${n}_name` as keyof CountryRetirementPlan] as string,
            description: countryPlan[`plan_${n}_description` as keyof CountryRetirementPlan] as string,
          }))
          .filter((p) => p.name);
        if (planEntries.length === 0) return null;
        return (
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                    Retirement Plans in {getCountryName(userCountry)}
                  </h2>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Available retirement plan options for your country
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {planEntries.map((plan, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02] hover:border-amber-200/60 dark:hover:border-amber-500/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center text-[11px] font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug">{plan.name}</p>
                  </div>
                  {plan.description && (
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed pl-8">{plan.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Account Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#0f0f10] border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  {editingAccount ? 'Edit Retirement Account' : 'Add Retirement Account'}
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingAccount
                    ? 'Update your account details'
                    : countryPlan
                    ? `Add a new ${getCountryName(userCountry)} retirement account`
                    : 'Add a new retirement account to track'}
                </p>
              </div>
              <button
                onClick={resetAccountForm}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Account Name *</label>
                <input
                  type="text"
                  required
                  value={accountFormData.account_name}
                  onChange={(e) => setAccountFormData({ ...accountFormData, account_name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Company 401(k)"
                />
              </div>

              <div>
                <label className={labelClass}>Account Type *</label>
                <select
                  value={accountFormData.account_type}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, account_type: e.target.value as RetirementAccount['account_type'] })
                  }
                  className={inputClass}
                  required
                >
                  {countryPlan && (() => {
                    const planOptions = [1, 2, 3, 4, 5]
                      .map((n) => countryPlan[`plan_${n}_name` as keyof CountryRetirementPlan] as string)
                      .filter(Boolean);
                    if (planOptions.length > 0) {
                      return (
                        <>
                          {planOptions.map((planName) => (
                            <option key={planName} value={planName}>{planName}</option>
                          ))}
                          <option value="other">Other</option>
                        </>
                      );
                    }
                    return null;
                  })() || (
                    <>
                      <option value="401k">401(k)</option>
                      <option value="ira_traditional">Traditional IRA</option>
                      <option value="ira_roth">Roth IRA</option>
                      <option value="403b">403(b)</option>
                      <option value="sep_ira">SEP IRA</option>
                      <option value="simple_ira">SIMPLE IRA</option>
                      <option value="pension">Pension</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Current Balance *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={accountFormData.current_balance}
                    onChange={(e) => setAccountFormData({ ...accountFormData, current_balance: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Annual Contribution *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={accountFormData.annual_contribution}
                    onChange={(e) => setAccountFormData({ ...accountFormData, annual_contribution: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Employer Match (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={accountFormData.employer_match}
                    onChange={(e) => setAccountFormData({ ...accountFormData, employer_match: e.target.value })}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Institution</label>
                  <input
                    type="text"
                    value={accountFormData.institution}
                    onChange={(e) => setAccountFormData({ ...accountFormData, institution: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., Fidelity"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={accountFormData.notes}
                  onChange={(e) => setAccountFormData({ ...accountFormData, notes: e.target.value })}
                  rows={3}
                  className={inputClass}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAccountForm}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl max-w-xl w-full my-8">
            <div className="sticky top-0 bg-white dark:bg-[#0f0f10] border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Retirement Calculator</h2>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Calculate your retirement readiness based on your goals
                </p>
              </div>
              <button
                onClick={() => { setShowCalculator(false); setCalculatorError(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Age Inputs */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Age Settings
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Current Age</label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={calculatorData.current_age}
                      onChange={(e) => setCalculatorData({ ...calculatorData, current_age: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Retirement Age</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={calculatorData.retirement_age}
                      onChange={(e) => setCalculatorData({ ...calculatorData, retirement_age: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Life Expectancy</label>
                    <input
                      type="number"
                      min="60"
                      max="120"
                      value={calculatorData.life_expectancy}
                      onChange={(e) => setCalculatorData({ ...calculatorData, life_expectancy: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Inputs */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Financial Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Current Savings</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={calculatorData.current_savings}
                      onChange={(e) => setCalculatorData({ ...calculatorData, current_savings: e.target.value })}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Annual Contribution</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={calculatorData.annual_contribution}
                      onChange={(e) => setCalculatorData({ ...calculatorData, annual_contribution: e.target.value })}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Desired Annual Income in Retirement</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={calculatorData.desired_annual_income}
                      onChange={(e) => setCalculatorData({ ...calculatorData, desired_annual_income: e.target.value })}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Rate Inputs */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Growth Assumptions
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Expected Return Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={calculatorData.expected_return_rate}
                      onChange={(e) => setCalculatorData({ ...calculatorData, expected_return_rate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Inflation Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={calculatorData.inflation_rate}
                      onChange={(e) => setCalculatorData({ ...calculatorData, inflation_rate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {calculatorError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-red-600 dark:text-red-400">{calculatorError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCalculator(false); setCalculatorError(''); }}
                  disabled={calculating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {calculating ? 'Calculating...' : 'Calculate Projection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
