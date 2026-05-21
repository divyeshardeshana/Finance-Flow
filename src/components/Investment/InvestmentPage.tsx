import { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Target,
  Shield,
  Zap,
  CheckCircle2,
  BarChart3,
  PieChart,
  Sparkles,
  Clock,
  Calculator,
  AlertTriangle,
  Info,
  MapPin,
  Globe,
  Landmark,
  Briefcase,
  Building2,
  Coins,
  LineChart,
  ArrowRight,
  Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { countries, getCountryName } from '../../lib/countries';

interface CountryInvestmentPlan {
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

interface InvestmentAdvice {
  id: string;
  type: 'stocks' | 'bonds' | 'etf' | 'crypto' | 'realestate' | 'savings';
  title: string;
  description: string;
  tickers?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
  timeHorizon: string;
  recommendedAllocation: number;
  pros: string[];
  cons: string[];
  icon: any;
  accentColor: 'blue' | 'emerald' | 'amber' | 'orange' | 'red' | 'teal';
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />
  );
}

function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="mb-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
      </div>
      <SkeletonBlock className="w-24 h-3 mb-2" />
      <SkeletonBlock className="w-36 h-7 mb-1" />
      <SkeletonBlock className="w-20 h-3" />
    </div>
  );
}

function SkeletonAdviceCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-6">
      <div className="flex items-start gap-4 mb-5">
        <SkeletonBlock className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="w-64 h-5" />
          <SkeletonBlock className="w-full h-3" />
          <SkeletonBlock className="w-3/4 h-3" />
        </div>
        <SkeletonBlock className="w-16 h-6 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="space-y-1.5">
          <SkeletonBlock className="w-20 h-3" />
          <SkeletonBlock className="w-28 h-4" />
        </div>
        <div className="space-y-1.5">
          <SkeletonBlock className="w-20 h-3" />
          <SkeletonBlock className="w-28 h-4" />
        </div>
        <div className="space-y-1.5">
          <SkeletonBlock className="w-20 h-3" />
          <SkeletonBlock className="w-28 h-4" />
        </div>
      </div>
      <SkeletonBlock className="w-full h-1.5 rounded-full mb-5" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <SkeletonBlock className="w-20 h-3" />
          <SkeletonBlock className="w-full h-3" />
          <SkeletonBlock className="w-full h-3" />
          <SkeletonBlock className="w-3/4 h-3" />
        </div>
        <div className="space-y-1.5">
          <SkeletonBlock className="w-20 h-3" />
          <SkeletonBlock className="w-full h-3" />
          <SkeletonBlock className="w-full h-3" />
        </div>
      </div>
    </div>
  );
}

const ACCENT_CONFIG = {
  blue: {
    icon: 'bg-blue-500/10 dark:bg-blue-500/[0.15]',
    iconText: 'text-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
    bar: 'from-blue-500 to-cyan-400',
    border: 'border-blue-200/60 dark:border-blue-500/[0.12]',
    tickerBg: 'bg-blue-50 dark:bg-blue-500/[0.08] text-blue-700 dark:text-blue-300',
  },
  emerald: {
    icon: 'bg-emerald-500/10 dark:bg-emerald-500/[0.15]',
    iconText: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    bar: 'from-emerald-500 to-teal-400',
    border: 'border-emerald-200/60 dark:border-emerald-500/[0.12]',
    tickerBg: 'bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    icon: 'bg-amber-500/10 dark:bg-amber-500/[0.15]',
    iconText: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    bar: 'from-amber-500 to-orange-400',
    border: 'border-amber-200/60 dark:border-amber-500/[0.12]',
    tickerBg: 'bg-amber-50 dark:bg-amber-500/[0.08] text-amber-700 dark:text-amber-300',
  },
  orange: {
    icon: 'bg-orange-500/10 dark:bg-orange-500/[0.15]',
    iconText: 'text-orange-500',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    value: 'text-orange-600 dark:text-orange-400',
    bar: 'from-orange-500 to-red-400',
    border: 'border-orange-200/60 dark:border-orange-500/[0.12]',
    tickerBg: 'bg-orange-50 dark:bg-orange-500/[0.08] text-orange-700 dark:text-orange-300',
  },
  red: {
    icon: 'bg-red-500/10 dark:bg-red-500/[0.15]',
    iconText: 'text-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    bar: 'from-red-500 to-rose-400',
    border: 'border-red-200/60 dark:border-red-500/[0.12]',
    tickerBg: 'bg-red-50 dark:bg-red-500/[0.08] text-red-700 dark:text-red-300',
  },
  teal: {
    icon: 'bg-teal-500/10 dark:bg-teal-500/[0.15]',
    iconText: 'text-teal-500',
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    value: 'text-teal-600 dark:text-teal-400',
    bar: 'from-teal-500 to-cyan-400',
    border: 'border-teal-200/60 dark:border-teal-500/[0.12]',
    tickerBg: 'bg-teal-50 dark:bg-teal-500/[0.08] text-teal-700 dark:text-teal-300',
  },
};

const RISK_BADGE: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

interface PlanMeta {
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
  timeHorizon: string;
  pros: string[];
  cons: string[];
  icon: any;
  accentColor: keyof typeof ACCENT_CONFIG;
  badge: string;
}

const PLAN_TYPE_LABELS: Record<number, string> = {
  1: 'Primary / State',
  2: 'Occupational / Mandatory',
  3: 'Private / Voluntary',
  4: 'Plan 4',
  5: 'Plan 5',
};

const RISK_ALLOCATION_WEIGHTS: Record<string, number[]> = {
  conservative: [40, 30, 15, 10, 5],
  moderate: [30, 25, 25, 12, 8],
  aggressive: [20, 20, 30, 20, 10],
};

function getCountryPlanAllocations(planCount: number, riskTolerance: string): number[] {
  const riskKey = ['conservative', 'moderate', 'aggressive'].includes(riskTolerance)
    ? riskTolerance
    : 'moderate';
  const weights = RISK_ALLOCATION_WEIGHTS[riskKey].slice(0, planCount);
  const total = weights.reduce((s, w) => s + w, 0);
  const allocations = weights.map((w) => Math.round((w / total) * 100));
  const diff = 100 - allocations.reduce((s, v) => s + v, 0);
  if (allocations.length > 0) allocations[0] += diff;
  return allocations;
}

const PLAN_META_MAP: Record<string, Omit<PlanMeta, 'accentColor'> & { accentColor: string }> = {
  EPF: {
    riskLevel: 'low', expectedReturn: '8–8.5% annually', timeHorizon: 'Long-term (until retirement)',
    pros: ['Government backed', 'Employer matches contribution', 'Tax-free on withdrawal', 'Compound interest'],
    cons: ['Locked until retirement / 5 years', 'Reduced on job change if not transferred'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  PPF: {
    riskLevel: 'low', expectedReturn: '7–7.5% annually (tax-free)', timeHorizon: 'Long-term (15 years+)',
    pros: ['EEE tax status', 'Government guarantee', 'Partial withdrawal after 6 years', 'Loan facility'],
    cons: ['15-year lock-in', '₹1.5 lakh annual cap', 'Rate revised quarterly'],
    icon: Shield, accentColor: 'teal', badge: 'Low Risk',
  },
  NPS: {
    riskLevel: 'medium', expectedReturn: '8–12% annually', timeHorizon: 'Long-term (until 60)',
    pros: ['Extra ₹50k tax deduction', 'Market-linked returns', 'Flexible asset allocation', 'Low fund management charges'],
    cons: ['60% taxable on annuity portion', 'Limited liquidity', 'Mandatory annuity purchase'],
    icon: BarChart3, accentColor: 'blue', badge: 'Medium Risk',
  },
  APY: {
    riskLevel: 'low', expectedReturn: 'Fixed pension ₹1k–₹5k/month', timeHorizon: 'Long-term (until 60)',
    pros: ['Guaranteed pension', 'Government co-contribution eligible', 'Simple fixed outcome', 'Portable across employers'],
    cons: ['Fixed pension cap', 'Benefits lost if premiums missed', 'No market upside'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  ELSS: {
    riskLevel: 'high', expectedReturn: '12–18% annually', timeHorizon: 'Long-term (3+ years)',
    pros: ['Shortest 80C lock-in (3 years)', 'Highest return potential among 80C', 'SIP available', 'Tax deduction up to ₹1.5 lakh'],
    cons: ['Market risk', 'Returns not guaranteed', 'LTCG tax above ₹1 lakh gains'],
    icon: LineChart, accentColor: 'amber', badge: 'High Risk',
  },
  'Mutual Fund': {
    riskLevel: 'medium', expectedReturn: '10–15% annually', timeHorizon: 'Medium to Long-term (3–7+ years)',
    pros: ['Professional management', 'SIP from ₹100/month', 'High diversification', 'Liquidity'],
    cons: ['Market risk', 'Fund management fees (TER)', 'Requires active monitoring'],
    icon: PieChart, accentColor: 'blue', badge: 'Medium Risk',
  },
  '401(k)': {
    riskLevel: 'medium', expectedReturn: '7–10% annually', timeHorizon: 'Long-term (until retirement)',
    pros: ['Employer match (free money)', 'Pre-tax contributions', 'High contribution limits', 'Tax-deferred growth'],
    cons: ['10% penalty for early withdrawal', 'RMDs from age 73', 'Limited to employer plan options'],
    icon: Briefcase, accentColor: 'blue', badge: 'Medium Risk',
  },
  'Roth IRA': {
    riskLevel: 'medium', expectedReturn: '7–10% annually (tax-free)', timeHorizon: 'Long-term (until retirement)',
    pros: ['Tax-free growth & withdrawals', 'No RMDs', 'Flexible contributions can be withdrawn', 'Full investment control'],
    cons: ['Income limits apply', '$7,000 annual cap', 'No immediate tax deduction'],
    icon: Shield, accentColor: 'emerald', badge: 'Medium Risk',
  },
  'S&P 500': {
    riskLevel: 'medium', expectedReturn: '8–10% annually', timeHorizon: 'Long-term (5+ years)',
    pros: ['Ultra-low fees (0.03%)', 'Proven 10%+ historical avg', 'Broad diversification', 'No stock-picking needed'],
    cons: ['No downside protection', 'US market concentration', 'Short-term volatility'],
    icon: LineChart, accentColor: 'amber', badge: 'Medium Risk',
  },
  HYSA: {
    riskLevel: 'low', expectedReturn: '4.5–5.5% annually', timeHorizon: 'Short-term (0–2 years)',
    pros: ['FDIC insured up to $250k', 'Instant liquidity', 'No market risk', 'Compound interest'],
    cons: ['Rate can drop with Fed cuts', 'Lower than market returns long-term', 'Inflation risk'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  'T-Bill': {
    riskLevel: 'low', expectedReturn: '4.5–5.5% annually', timeHorizon: 'Short to Medium-term (4 weeks–1 year)',
    pros: ['US government backed', 'State tax exempt', 'Liquid & accessible', 'Inflation hedge via I-Bonds'],
    cons: ['Lower than equity returns', 'Interest rate fluctuation', 'I-Bond $10k annual limit'],
    icon: Landmark, accentColor: 'teal', badge: 'Low Risk',
  },
  ISA: {
    riskLevel: 'medium', expectedReturn: '7–10% annually (tax-free)', timeHorizon: 'Long-term (5+ years)',
    pros: ['Zero UK income/CGT on growth', '£20,000 annual allowance', 'Flexible access', 'Wide platform choice'],
    cons: ['Limited to UK residents', "Can't carry unused allowance forward", 'Market risk in Stocks & Shares ISA'],
    icon: LineChart, accentColor: 'blue', badge: 'Medium Risk',
  },
  'Workplace Pension': {
    riskLevel: 'medium', expectedReturn: '6–9% annually', timeHorizon: 'Long-term (until retirement)',
    pros: ['Employer contributes 3%+', 'Tax relief on contributions', 'Auto-enrolment convenience', 'Low admin'],
    cons: ['Locked until age 57 (rising to 58)', 'Limited fund choice vs SIPP', 'Default fund may be suboptimal'],
    icon: Briefcase, accentColor: 'teal', badge: 'Medium Risk',
  },
  SIPP: {
    riskLevel: 'medium', expectedReturn: '7–10% annually', timeHorizon: 'Long-term (until retirement)',
    pros: ['Up to 45% tax relief on contributions', 'Full investment control', '£60,000 annual allowance', 'Consolidate old pensions'],
    cons: ['Locked until age 57', 'Annual allowance taper for high earners', 'Requires active management'],
    icon: Briefcase, accentColor: 'amber', badge: 'Medium Risk',
  },
  'Premium Bond': {
    riskLevel: 'low', expectedReturn: '~4.4% equivalent prize rate', timeHorizon: 'Short-term (flexible)',
    pros: ['HM Treasury guarantee', 'Tax-free prizes', 'Instant access', '£50,000 max holding'],
    cons: ['No guaranteed return', 'Variable prize distribution', 'Inflation risk'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  FTSE: {
    riskLevel: 'medium', expectedReturn: '7–10% annually', timeHorizon: 'Long-term (5+ years)',
    pros: ['Ultra-low TER (0.07–0.22%)', 'Global diversification', 'UCITS regulated', 'ISA/SIPP compatible'],
    cons: ['Currency risk (non-GBP holdings)', 'Market risk', 'Short-term volatility'],
    icon: Globe, accentColor: 'blue', badge: 'Medium Risk',
  },
  TFSA: {
    riskLevel: 'medium', expectedReturn: '7–10% annually (tax-free)', timeHorizon: 'Flexible',
    pros: ['All growth 100% tax-free', 'Unlimited withdrawal flexibility', 'Contribution room restored next year', 'Any investment inside'],
    cons: ['$7,000 annual limit', 'Over-contribution penalized 1%/month', 'No tax deduction on contribution'],
    icon: Shield, accentColor: 'emerald', badge: 'Medium Risk',
  },
  RRSP: {
    riskLevel: 'medium', expectedReturn: '7–10% annually (tax-deferred)', timeHorizon: 'Long-term (until retirement)',
    pros: ['Reduces taxable income now', '18% of income contribution limit', 'HBP & LLP withdrawal options', 'Tax-deferred growth'],
    cons: ['Taxable on withdrawal', 'Mandatory conversion to RRIF at 71', 'Contribution room lost if over-contribute'],
    icon: Briefcase, accentColor: 'blue', badge: 'Medium Risk',
  },
  FHSA: {
    riskLevel: 'medium', expectedReturn: '7–10% annually (tax-free)', timeHorizon: 'Short to Medium-term (for home purchase)',
    pros: ['Tax-deductible + tax-free withdrawal combo', '$8,000/year up to $40,000 lifetime', 'TFSA + RRSP hybrid benefits', 'Unused room carried forward 1 year'],
    cons: ['First-time home buyers only', 'Must use within 15 years or convert to RRSP', 'Limited lifetime room'],
    icon: Building2, accentColor: 'teal', badge: 'Medium Risk',
  },
  GIC: {
    riskLevel: 'low', expectedReturn: '4.5–5.5% annually', timeHorizon: 'Short to Medium-term (1–5 years)',
    pros: ['CDIC insured up to $100,000', 'Guaranteed principal', 'Fixed predictable income', 'No management fees'],
    cons: ['Locked-in (non-redeemable types)', 'Lower than equity returns long-term', 'Inflation risk'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  Super: {
    riskLevel: 'medium', expectedReturn: '8–10% annually', timeHorizon: 'Long-term (until retirement)',
    pros: ['15% concessional tax rate', '11% employer SG contributions', 'Tax-free in retirement phase', 'Compulsory discipline'],
    cons: ['Preserved until preservation age (60)', 'Transfer balance cap ($1.9M)', 'Insurance premiums can erode balance'],
    icon: Briefcase, accentColor: 'blue', badge: 'Medium Risk',
  },
  'Term Deposit': {
    riskLevel: 'low', expectedReturn: '4–5.5% annually', timeHorizon: 'Short-term (1 month–5 years)',
    pros: ['Government deposit guarantee up to $250k', 'Predictable returns', 'No market risk', 'Flexible tenors'],
    cons: ['Early exit penalty (31 days notice)', 'Lower than equity long-term', 'Locked in during term'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  REIT: {
    riskLevel: 'medium', expectedReturn: '5–8% annually', timeHorizon: 'Medium-term (3–7 years)',
    pros: ['Diversified property exposure', 'Regular distributions', 'Liquid on exchange', 'Inflation hedge'],
    cons: ['Interest rate sensitive', 'Vacancy & management risk', 'Sector concentration'],
    icon: Building2, accentColor: 'amber', badge: 'Medium Risk',
  },
  CPF: {
    riskLevel: 'low', expectedReturn: '2.5–5% annually (guaranteed)', timeHorizon: 'Long-term (until retirement)',
    pros: ['Government guaranteed returns', 'Employer 17% contribution', 'CPF-SA earns 4–5%', 'Tax relief on voluntary top-up'],
    cons: ['Locked until retirement', 'Monthly salary ceiling ($6,800)', 'Withdrawal rules complex'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  SRS: {
    riskLevel: 'medium', expectedReturn: '7–10% annually', timeHorizon: 'Long-term (until retirement)',
    pros: ['Full tax relief on contributions', 'Only 50% of SRS withdrawal taxable', 'Wide investment choice', 'Flexible investment options'],
    cons: ['5% penalty for pre-retirement withdrawal', 'Must be invested actively', 'Annual limit $15,300 (citizens/PR)'],
    icon: Briefcase, accentColor: 'teal', badge: 'Medium Risk',
  },
  SSB: {
    riskLevel: 'low', expectedReturn: '3–3.5% annually', timeHorizon: 'Short to Medium-term (1–10 years)',
    pros: ['Risk-free (Singapore government)', 'Step-up interest over 10 years', 'Redeem any month penalty-free', 'SDIC protection up to $500k'],
    cons: ['$200,000 per person cap', 'Lower yield than equity', 'Rate varies by tranche'],
    icon: Shield, accentColor: 'teal', badge: 'Low Risk',
  },
  Sukuk: {
    riskLevel: 'low', expectedReturn: '4–7% annually', timeHorizon: 'Medium-term (2–7 years)',
    pros: ['Shariah-compliant', 'Government & investment-grade issuers', 'Regular profit distributions', 'USD/AED denominated'],
    cons: ['Lower liquidity than conventional bonds', 'Complex structure', 'Limited retail access'],
    icon: Shield, accentColor: 'blue', badge: 'Low Risk',
  },
  'National Bond': {
    riskLevel: 'low', expectedReturn: '3.5–5% annually', timeHorizon: 'Short to Medium-term (1–5 years)',
    pros: ['UAE government backed', 'Shariah-compliant', 'AED denominated', 'Easy redemption'],
    cons: ['Lower yield vs equity', 'Currency concentration', 'Limited international diversification'],
    icon: Shield, accentColor: 'emerald', badge: 'Low Risk',
  },
  'Robo-Advisor': {
    riskLevel: 'medium', expectedReturn: '7–10% annually', timeHorizon: 'Medium to Long-term (3–10 years)',
    pros: ['Zero capital gains tax in UAE', 'Automated rebalancing', 'Low fees (0.5–0.85%)', 'Global ETF diversification'],
    cons: ['No direct stock picking', 'Limited customization', 'USD-denominated mainly'],
    icon: LineChart, accentColor: 'blue', badge: 'Medium Risk',
  },
  'Blue-Chip Stock': {
    riskLevel: 'medium', expectedReturn: '8–15% annually', timeHorizon: 'Long-term (5+ years)',
    pros: ['Direct market participation', 'Dividend income', 'Zero UAE capital gains tax', 'Strong governance'],
    cons: ['Company-specific risk', 'Oil price sensitivity', 'Research required'],
    icon: TrendingUp, accentColor: 'amber', badge: 'Medium Risk',
  },
};

function getPlanMeta(planName: string): PlanMeta {
  const name = planName.toLowerCase();
  const defaults: PlanMeta = {
    riskLevel: 'medium', expectedReturn: 'Variable', timeHorizon: 'Medium to Long-term',
    pros: ['Regulated investment vehicle', 'Professional management', 'Diversification'],
    cons: ['Market risk', 'Returns not guaranteed'],
    icon: Coins, accentColor: 'blue', badge: 'Medium Risk',
  };

  const keyMap: Array<[string, string]> = [
    ['epf', 'EPF'], ['provident fund', 'EPF'],
    ['ppf', 'PPF'], ['public provident', 'PPF'],
    ['nps', 'NPS'], ['national pension', 'NPS'],
    ['atal pension', 'APY'], ['apy', 'APY'],
    ['elss', 'ELSS'], ['equity linked', 'ELSS'],
    ['mutual fund', 'Mutual Fund'],
    ['401', '401(k)'],
    ['roth ira', 'Roth IRA'],
    ['s&p 500', 'S&P 500'], ['sp500', 'S&P 500'], ['index etf', 'S&P 500'], ['index fund', 'S&P 500'],
    ['high-yield savings', 'HYSA'], ['hysa', 'HYSA'], ['savings account', 'HYSA'],
    ['t-bill', 'T-Bill'], ['treasury', 'T-Bill'], ['i-bond', 'T-Bill'],
    ['isa', 'ISA'], ['stocks & shares', 'ISA'],
    ['workplace pension', 'Workplace Pension'], ['auto-enrolment', 'Workplace Pension'],
    ['sipp', 'SIPP'], ['self-invested', 'SIPP'],
    ['premium bond', 'Premium Bond'], ['ns&i', 'Premium Bond'],
    ['ftse', 'FTSE'], ['all-world', 'FTSE'],
    ['tfsa', 'TFSA'], ['tax-free savings', 'TFSA'],
    ['rrsp', 'RRSP'],
    ['fhsa', 'FHSA'], ['first home', 'FHSA'],
    ['gic', 'GIC'], ['guaranteed investment certificate', 'GIC'],
    ['superannuation', 'Super'], ['super fund', 'Super'],
    ['term deposit', 'Term Deposit'],
    ['reit', 'REIT'], ['a-reit', 'REIT'],
    ['cpf', 'CPF'], ['central provident', 'CPF'],
    ['srs', 'SRS'], ['supplementary retirement', 'SRS'],
    ['ssb', 'SSB'], ['singapore savings bond', 'SSB'],
    ['sukuk', 'Sukuk'],
    ['national bond', 'National Bond'],
    ['robo', 'Robo-Advisor'], ['sarwa', 'Robo-Advisor'], ['stashaway', 'Robo-Advisor'],
    ['blue-chip', 'Blue-Chip Stock'], ['blue chip', 'Blue-Chip Stock'], ['adx', 'Blue-Chip Stock'], ['dfm', 'Blue-Chip Stock'],
  ];

  for (const [keyword, key] of keyMap) {
    if (name.includes(keyword)) {
      const meta = PLAN_META_MAP[key];
      if (meta) return meta as PlanMeta;
    }
  }

  return defaults;
}

function getCountryRegion(country: string) {
  const c = country.toUpperCase();
  if (['US', 'USA', 'UNITED STATES'].includes(c)) return 'US';
  if (['IN', 'INDIA'].includes(c)) return 'IN';
  if (['GB', 'UK', 'UNITED KINGDOM'].includes(c)) return 'GB';
  if (['CA', 'CANADA'].includes(c)) return 'CA';
  if (['AE', 'SA', 'UNITED ARAB EMIRATES', 'SAUDI ARABIA'].includes(c)) return 'GCC';
  if (['AU', 'NZ', 'AUSTRALIA', 'NEW ZEALAND'].includes(c)) return 'AU';
  if (['DE', 'FR', 'AT', 'BE', 'NL', 'ES', 'PT', 'IT', 'FI', 'DK', 'SE', 'NO', 'CH', 'IE', 'GR', 'PL', 'CZ'].includes(c)) return 'EU';
  if (['SG', 'MY', 'TH', 'ID', 'PH', 'VN'].includes(c)) return 'SEA';
  if (['JP', 'JAPAN'].includes(c)) return 'JP';
  if (['KR', 'SOUTH KOREA'].includes(c)) return 'KR';
  if (['CN', 'CHINA'].includes(c)) return 'CN';
  if (['BR', 'AR', 'CL', 'CO', 'PE', 'MX', 'VE'].includes(c)) return 'LATAM';
  if (['ZA', 'EG', 'NG', 'KE'].includes(c)) return 'AFRICA';
  if (['PK', 'BD'].includes(c)) return 'SOUTHASIA';
  if (['RU', 'TR'].includes(c)) return 'OTHER_EM';
  if (['IL', 'ISRAEL'].includes(c)) return 'IL';
  return 'DEFAULT';
}

export function InvestmentPage() {
  const { user } = useAuth();
  const { preferences } = useAppPreferences();
  const [loading, setLoading] = useState(true);
  const [investmentAdvice, setInvestmentAdvice] = useState<InvestmentAdvice[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [investableAmount, setInvestableAmount] = useState(0);
  const [userCountry, setUserCountry] = useState<string>('');
  const [countryInvestmentPlan, setCountryInvestmentPlan] = useState<CountryInvestmentPlan | null>(null);

  useEffect(() => {
    if (user) {
      analyzeAndGenerateAdvice();
    }
  }, [user]);

  const analyzeAndGenerateAdvice = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('risk_tolerance, country')
        .eq('user_id', user.id)
        .maybeSingle();

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0]);

      const income = (transactions || [])
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          return sum + convertedAmount;
        }, 0) / 3;

      const expenses = (transactions || [])
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = convertCurrency(Number(t.amount), t.currency || 'USD', preferences.currency);
          return sum + convertedAmount;
        }, 0) / 3;

      const surplus = income - expenses;

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setInvestableAmount(Math.max(0, surplus * 0.7));
      setRiskTolerance(profile?.risk_tolerance || 'moderate');
      const country = profile?.country || '';
      setUserCountry(country);

      if (country) {
        const { data: planData } = await supabase
          .from('country_investment_plans')
          .select('*')
          .eq('country_code', country)
          .maybeSingle();
        setCountryInvestmentPlan(planData || null);
      }

      const advice = generateInvestmentAdvice(
        profile?.risk_tolerance || 'moderate',
        profile?.country || '',
        surplus,
        income
      );
      setInvestmentAdvice(advice);
      setLoading(false);
    } catch (error) {
      console.error('Error generating advice:', error);
      setLoading(false);
    }
  };

  const generateInvestmentAdvice = (
    risk: string,
    country: string,
    surplus: number,
    income: number
  ): InvestmentAdvice[] => {
    const advice: InvestmentAdvice[] = [];
    const region = getCountryRegion(country);

    if (risk === 'conservative' || risk === 'low') {
      switch (region) {
        case 'US':
          advice.push({
            id: 'high-yield-savings',
            type: 'savings',
            title: 'High-Yield Savings Account (US)',
            description: 'FDIC-insured savings accounts from online banks like Marcus, Ally, or American Express offering 4-5% APY.',
            riskLevel: 'low',
            expectedReturn: '4–5% annually',
            timeHorizon: 'Short-term (0–2 years)',
            recommendedAllocation: 40,
            pros: ['FDIC insured up to $250k', 'Instant liquidity', 'No fees', 'Compound interest'],
            cons: ['Lower than market returns', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'us-treasuries',
            type: 'bonds',
            title: 'US Treasury Bonds & Bills',
            description: 'Direct purchase of T-Bills, T-Notes, or T-Bonds through TreasuryDirect or brokerage accounts.',
            riskLevel: 'low',
            expectedReturn: '4–6% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Backed by US government', 'Tax-free at state level', 'Highly liquid', 'Predictable'],
            cons: ['Lower growth potential', 'Interest rate risk'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'IN':
          advice.push({
            id: 'india-fixed-deposits',
            type: 'savings',
            title: 'Bank Fixed Deposits (FDs)',
            description: 'Fixed deposits from SBI, HDFC, ICICI offering 6-7.5% returns with deposit insurance up to ₹5 lakhs.',
            riskLevel: 'low',
            expectedReturn: '6–7.5% annually',
            timeHorizon: 'Short to Medium-term (1–5 years)',
            recommendedAllocation: 40,
            pros: ['DICGC insured', 'Guaranteed returns', 'Flexible tenure', 'Tax-saving FDs available'],
            cons: ['Taxable interest', 'Early withdrawal penalty'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'india-govt-bonds',
            type: 'bonds',
            title: 'Government Securities & RBI Bonds',
            description: 'Sovereign Gold Bonds, RBI Floating Rate Bonds, and G-Secs through NSE goBID platform.',
            riskLevel: 'low',
            expectedReturn: '6–8% annually',
            timeHorizon: 'Medium-term (3–7 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'Better than FD returns', 'Tax benefits on SGB', 'Tradeable'],
            cons: ['Lock-in periods', 'Market price fluctuation'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'GB':
          advice.push({
            id: 'uk-premium-bonds',
            type: 'savings',
            title: 'NS&I Premium Bonds & Savings',
            description: 'National Savings & Investments products including Premium Bonds with prize draws and guaranteed savings.',
            riskLevel: 'low',
            expectedReturn: '3–4.5% annually',
            timeHorizon: 'Short-term (1–3 years)',
            recommendedAllocation: 40,
            pros: ['Government backed', 'Tax-free prizes', 'FSCS protected', 'Easy access'],
            cons: ['Variable returns', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'uk-gilts',
            type: 'bonds',
            title: 'UK Gilts (Government Bonds)',
            description: 'British government bonds available through brokers or via the DMO, offering fixed income.',
            riskLevel: 'low',
            expectedReturn: '4–5% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government guarantee', 'Predictable income', 'Liquid market', 'Low default risk'],
            cons: ['Interest rate sensitivity', 'Lower yields'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'CA':
          advice.push({
            id: 'canada-gics',
            type: 'savings',
            title: 'Guaranteed Investment Certificates (GICs)',
            description: 'CDIC-insured GICs from major banks offering 4.5-5.5% with guaranteed principal protection.',
            riskLevel: 'low',
            expectedReturn: '4.5–5.5% annually',
            timeHorizon: 'Short to Medium-term (1–5 years)',
            recommendedAllocation: 40,
            pros: ['CDIC insured up to $100k', 'Guaranteed returns', 'Flexible terms', 'No fees'],
            cons: ['Locked-in funds', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'canada-bonds',
            type: 'bonds',
            title: 'Canada Savings Bonds & Provincial Bonds',
            description: 'Government of Canada bonds and provincial bonds offering stable, predictable returns.',
            riskLevel: 'low',
            expectedReturn: '4–6% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'Tax advantages', 'Steady income', 'Low risk'],
            cons: ['Lower growth', 'Interest rate risk'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'GCC':
          advice.push({
            id: 'uae-national-bonds',
            type: 'savings',
            title: 'UAE National Bonds & Term Deposits',
            description: 'Shariah-compliant savings with UAE National Bonds Corporation and high-yield term deposits from Emirates NBD, ADCB, or FAB.',
            riskLevel: 'low',
            expectedReturn: '3.5–5% annually',
            timeHorizon: 'Short-term (1–3 years)',
            recommendedAllocation: 40,
            pros: ['Government-backed', 'Shariah-compliant options', 'AED-denominated', 'Easy redemption'],
            cons: ['Lower yield vs equity', 'Currency concentration risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'gcc-sukuk',
            type: 'bonds',
            title: 'UAE & GCC Sukuk (Islamic Bonds)',
            description: 'Government and corporate sukuk listed on Nasdaq Dubai and DFM — Shariah-compliant fixed-income instruments from top-rated issuers.',
            riskLevel: 'low',
            expectedReturn: '4–6% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Shariah-compliant', 'Regular profit distributions', 'Government issuers available', 'Diversification'],
            cons: ['Lower liquidity than bonds', 'Complex structure'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'AU':
          advice.push({
            id: 'au-term-deposit',
            type: 'savings',
            title: 'High-Interest Term Deposits',
            description: 'APRA-regulated term deposits from Commonwealth Bank, ANZ, Westpac, or NAB offering competitive rates.',
            riskLevel: 'low',
            expectedReturn: '4–5.5% annually',
            timeHorizon: 'Short to Medium-term (1–3 years)',
            recommendedAllocation: 40,
            pros: ['Government deposit guarantee up to $250k', 'Predictable returns', 'No fees', 'Flexible terms'],
            cons: ['Locked-in capital', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'au-govt-bonds',
            type: 'bonds',
            title: 'Australian Government Bonds (AGBs)',
            description: 'Commonwealth Government Securities listed on ASX, offering stable income backed by the Australian government.',
            tickers: ['GSBU20', 'GSBE47'],
            riskLevel: 'low',
            expectedReturn: '4–5% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'ASX-listed for liquidity', 'Low credit risk', 'Fixed income'],
            cons: ['Interest rate sensitivity', 'Low growth'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'EU':
          advice.push({
            id: 'eu-savings',
            type: 'savings',
            title: 'High-Yield Savings & Fixed-Term Deposits',
            description: 'EU deposit-guarantee-protected accounts (up to €100k) from digital banks like Trade Republic, Bunq, or local government savings schemes.',
            riskLevel: 'low',
            expectedReturn: '3–4.5% annually',
            timeHorizon: 'Short-term (0–2 years)',
            recommendedAllocation: 40,
            pros: ['EU Deposit Guarantee up to €100k', 'Instant or easy access', 'Low risk', 'Euro-denominated'],
            cons: ['Rates vary by country', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'eu-govt-bonds',
            type: 'bonds',
            title: 'European Government Bonds (Bunds/OATs)',
            description: 'German Bunds, French OATs, or EU sovereign bonds offering stable returns with very low credit risk.',
            riskLevel: 'low',
            expectedReturn: '3–5% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Sovereign-backed', 'Euro-denominated', 'Liquid markets', 'Low default risk'],
            cons: ['Lower yields than corporates', 'Rate sensitivity'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'SEA':
          advice.push({
            id: 'sea-savings',
            type: 'savings',
            title: 'Fixed Deposits & Government Savings',
            description: 'High-yield fixed deposits from major local banks. Singapore users can also leverage CPF top-up for guaranteed 2.5–4% returns.',
            riskLevel: 'low',
            expectedReturn: '3–5% annually',
            timeHorizon: 'Short-term (1–3 years)',
            recommendedAllocation: 40,
            pros: ['Insured deposits', 'Stable returns', 'Easy access', 'Local currency'],
            cons: ['Lower yield vs equity', 'Currency risk for non-SGD'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'sea-govt-bonds',
            type: 'bonds',
            title: 'Government Bonds & Treasury Securities',
            description: 'Singapore SGS/T-bills, Malaysian MGS, or Thai government bonds providing predictable, low-risk income.',
            riskLevel: 'low',
            expectedReturn: '3–5.5% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'Regular coupons', 'Low credit risk', 'Diversification'],
            cons: ['Interest rate risk', 'Currency risk'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'JP':
          advice.push({
            id: 'jp-savings',
            type: 'savings',
            title: 'Japan Post Bank & Fixed Deposits',
            description: 'Government-backed deposits at Japan Post Bank (Yucho) and fixed-term deposits at major Japanese banks.',
            riskLevel: 'low',
            expectedReturn: '0.5–1.5% annually',
            timeHorizon: 'Short-term (1–2 years)',
            recommendedAllocation: 35,
            pros: ['Government guaranteed', 'Very stable', 'Wide network', 'JPY-denominated'],
            cons: ['Very low rates due to BOJ policy', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'jp-govt-bonds',
            type: 'bonds',
            title: 'Japanese Government Bonds (JGBs)',
            description: 'JGBs available through securities firms. Individual Investor JGBs (kojin-muke kokusai) offer variable or fixed rates.',
            riskLevel: 'low',
            expectedReturn: '1–2% annually',
            timeHorizon: 'Medium-term (3–5 years)',
            recommendedAllocation: 40,
            pros: ['Government backed', 'Capital protection', 'Accessible via brokers', 'Yen-denominated'],
            cons: ['Very low yields', 'Currency risk if investing globally'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'KR':
          advice.push({
            id: 'kr-savings',
            type: 'savings',
            title: 'Korean Bank Deposits & ISA',
            description: 'High-yield deposits from KB Kookmin, Shinhan, or Kakao Bank, plus Individual Savings Accounts (ISA) for tax advantages.',
            riskLevel: 'low',
            expectedReturn: '3–4.5% annually',
            timeHorizon: 'Short-term (1–3 years)',
            recommendedAllocation: 40,
            pros: ['Deposit guarantee up to ₩50M', 'ISA tax benefits', 'Stable returns', 'Online accessibility'],
            cons: ['Modest yields', 'Withdrawal restrictions on some products'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'kr-govt-bonds',
            type: 'bonds',
            title: 'Korean Treasury Bonds (KTBs)',
            description: 'Government bonds available via KRX. Retail investors can access KTBs through securities firms like Samsung or Mirae Asset.',
            riskLevel: 'low',
            expectedReturn: '3–4% annually',
            timeHorizon: 'Medium-term (3–5 years)',
            recommendedAllocation: 35,
            pros: ['Government guaranteed', 'Liquid market', 'Predictable income', 'Low risk'],
            cons: ['Rate sensitivity', 'Modest returns'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'CN':
          advice.push({
            id: 'cn-savings',
            type: 'savings',
            title: 'Bank Fixed Deposits & Yu\'e Bao',
            description: 'Fixed deposits from ICBC, CCB, Bank of China, or money market funds like Yu\'e Bao (Alipay) for higher liquidity.',
            riskLevel: 'low',
            expectedReturn: '2–3.5% annually',
            timeHorizon: 'Short-term (1–2 years)',
            recommendedAllocation: 40,
            pros: ['Up to ¥500k deposit insurance', 'Accessible via apps', 'Flexible terms', 'Stable returns'],
            cons: ['Capital controls limit international diversification', 'Lower rates recently'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'cn-govt-bonds',
            type: 'bonds',
            title: 'China Government Bonds & Policy Bank Bonds',
            description: 'CGBs and bonds from policy banks (CDB, ADBC) offering higher yields than deposits with near-sovereign credit.',
            riskLevel: 'low',
            expectedReturn: '2.5–4% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Near-sovereign safety', 'RMB-denominated', 'Regular interest payments', 'Tradeable'],
            cons: ['Capital controls', 'Regulatory changes possible'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'LATAM':
          advice.push({
            id: 'latam-govt-bonds',
            type: 'bonds',
            title: 'Government Treasury Securities',
            description: 'Local government treasury instruments — Brazil\'s Tesouro Direto, Mexico\'s CETES, or similar sovereign bonds offering inflation-beating returns.',
            riskLevel: 'low',
            expectedReturn: '5–12% annually (nominal)',
            timeHorizon: 'Short to Medium-term (1–3 years)',
            recommendedAllocation: 45,
            pros: ['Government backed', 'Online platforms available', 'Regular interest', 'Inflation-linked options'],
            cons: ['Currency devaluation risk', 'Political risk', 'Inflation erosion'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'latam-savings',
            type: 'savings',
            title: 'Regulated Bank Fixed-Term Savings',
            description: 'Deposit accounts and CDBs (Brazil) or Pagarés (Mexico) from regulated banks with deposit insurance coverage.',
            riskLevel: 'low',
            expectedReturn: '4–10% annually',
            timeHorizon: 'Short-term (0–2 years)',
            recommendedAllocation: 30,
            pros: ['Deposit insurance', 'Accessible', 'Regular returns', 'Flexible tenor'],
            cons: ['High inflation can erode real returns', 'FX risk if USD-based'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'AFRICA':
          advice.push({
            id: 'africa-govt-bonds',
            type: 'bonds',
            title: 'Government Treasury Bonds & Bills',
            description: 'South Africa RSA Retail Bonds, Kenya T-bills, Nigerian FGN Bonds — high-yielding sovereign instruments.',
            riskLevel: 'low',
            expectedReturn: '8–15% annually (nominal)',
            timeHorizon: 'Short to Medium-term (1–3 years)',
            recommendedAllocation: 45,
            pros: ['Government backed', 'High nominal yields', 'Accessible online', 'Regular income'],
            cons: ['Currency risk', 'Inflation risk', 'Political risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'africa-savings',
            type: 'savings',
            title: 'High-Yield Bank Fixed Deposits',
            description: 'Fixed deposits from leading banks (FNB, Standard Bank ZA, Equity Bank KE) with deposit protection schemes.',
            riskLevel: 'low',
            expectedReturn: '7–12% annually',
            timeHorizon: 'Short-term (0–2 years)',
            recommendedAllocation: 30,
            pros: ['Deposit protection', 'High nominal rates', 'Easy access', 'Flexible terms'],
            cons: ['Currency devaluation risk', 'Inflation erosion possible'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'SOUTHASIA':
          advice.push({
            id: 'southasia-savings',
            type: 'savings',
            title: 'National Savings Certificates & Fixed Deposits',
            description: 'Pakistan NSS schemes (Behbood, Regular Income) or Bangladesh Sanchayapatra offering government-guaranteed returns.',
            riskLevel: 'low',
            expectedReturn: '8–13% annually',
            timeHorizon: 'Short to Medium-term (1–5 years)',
            recommendedAllocation: 45,
            pros: ['Government guaranteed', 'High yields', 'Accessible', 'Flexible tenors'],
            cons: ['FX risk', 'Inflation may erode real returns', 'Liquidity constraints'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'southasia-bonds',
            type: 'bonds',
            title: 'Government T-Bills & PIBs',
            description: 'Pakistan Investment Bonds (PIBs) and Bangladesh Treasury bills providing sovereign backing with competitive rates.',
            riskLevel: 'low',
            expectedReturn: '10–15% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'High nominal returns', 'Primary market access via banks', 'Fixed income'],
            cons: ['Currency depreciation risk', 'Inflation risk'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'OTHER_EM':
          advice.push({
            id: 'em-savings',
            type: 'savings',
            title: 'High-Yield Bank Deposits',
            description: 'Fixed deposits from regulated local banks offering competitive yields in local currency.',
            riskLevel: 'low',
            expectedReturn: '5–15% annually (nominal)',
            timeHorizon: 'Short-term (0–2 years)',
            recommendedAllocation: 40,
            pros: ['Deposit insurance', 'High nominal rates', 'Accessible', 'Flexible terms'],
            cons: ['Currency devaluation risk', 'Political risk', 'Inflation erosion'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'em-bonds',
            type: 'bonds',
            title: 'Government Bonds & Treasury Securities',
            description: 'Local government bonds offering sovereign backing and regular fixed income.',
            riskLevel: 'low',
            expectedReturn: '8–18% annually (nominal)',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'Regular income', 'Diversification', 'Inflation compensation'],
            cons: ['Currency risk', 'Liquidity may be limited', 'Political risk'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        case 'IL':
          advice.push({
            id: 'il-savings',
            type: 'savings',
            title: 'Israel Savings Bonds & Pikdaon',
            description: 'Israeli government savings bonds (Shtarot) and bank Pikdaon term deposits offering competitive rates.',
            riskLevel: 'low',
            expectedReturn: '4–6% annually',
            timeHorizon: 'Short to Medium-term (1–3 years)',
            recommendedAllocation: 40,
            pros: ['Government backed', 'Shekel-denominated', 'CPI-linked options', 'Accessible'],
            cons: ['Currency risk if investing abroad', 'Modest absolute yields'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'il-bonds',
            type: 'bonds',
            title: 'Israel Government Bonds (Makam/Galil)',
            description: 'Short-term Makam treasury bills and long-term Galil CPI-linked bonds available via Israeli brokers.',
            riskLevel: 'low',
            expectedReturn: '4–6% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government guaranteed', 'Inflation protection via CPI linkage', 'Liquid TASE market', 'Stable'],
            cons: ['Local currency exposure', 'Rate sensitivity'],
            icon: Shield,
            accentColor: 'blue',
          });
          break;
        default:
          advice.push({
            id: 'high-yield-savings',
            type: 'savings',
            title: 'High-Yield Savings Account',
            description: 'Park your emergency fund and short-term savings in a high-yield savings account with competitive interest rates.',
            riskLevel: 'low',
            expectedReturn: '3–5% annually',
            timeHorizon: 'Short-term (0–2 years)',
            recommendedAllocation: 40,
            pros: ['Deposit insured', 'Instant liquidity', 'No market risk', 'Guaranteed returns'],
            cons: ['Lower returns than investments', 'Inflation risk'],
            icon: Shield,
            accentColor: 'emerald',
          });
          advice.push({
            id: 'treasury-bonds',
            type: 'bonds',
            title: 'Government Bonds & Treasury Bills',
            description: 'Invest in government-backed securities for stable, predictable returns with minimal risk.',
            riskLevel: 'low',
            expectedReturn: '3–6% annually',
            timeHorizon: 'Medium-term (2–5 years)',
            recommendedAllocation: 35,
            pros: ['Government backed', 'Predictable income', 'Low volatility', 'Tax advantages'],
            cons: ['Lower growth potential', 'Interest rate risk'],
            icon: Shield,
            accentColor: 'blue',
          });
      }

      if (region === 'IN') {
        advice.push({
          id: 'india-dividend-stocks',
          type: 'stocks',
          title: 'Dividend-Paying Blue-Chip Stocks (NSE/BSE)',
          description: 'Invest in dividend aristocrats like ITC, Coal India, HDFC Bank through Zerodha, Groww, or Upstox.',
          riskLevel: 'low',
          expectedReturn: '8–12% annually',
          timeHorizon: 'Long-term (5+ years)',
          recommendedAllocation: 25,
          pros: ['Regular dividends', 'Established companies', 'Tax-efficient', 'Lower volatility'],
          cons: ['Market risk', 'Dividend tax'],
          icon: TrendingUp,
          accentColor: 'teal',
        });
      } else if (region === 'GCC') {
        advice.push({
          id: 'gcc-blue-chips',
          type: 'stocks',
          title: 'UAE & GCC Blue-Chip Dividend Stocks',
          description: 'Dividend-paying stocks on ADX and DFM — ADNOC Distribution, Emirates NBD, Etisalat (e&), and du — for regular, tax-free income.',
          riskLevel: 'low',
          expectedReturn: '5–9% annually',
          timeHorizon: 'Long-term (5+ years)',
          recommendedAllocation: 25,
          pros: ['Zero income tax on dividends', 'Established companies', 'AED-denominated', 'Strong governance'],
          cons: ['Market concentration', 'Oil price sensitivity'],
          icon: TrendingUp,
          accentColor: 'teal',
        });
      } else if (region === 'AU') {
        advice.push({
          id: 'au-dividend-stocks',
          type: 'stocks',
          title: 'ASX Dividend Stocks with Franking Credits',
          description: 'Fully-franked dividend stocks from CBA, BHP, ANZ, and Wesfarmers — benefit from franking credits that offset tax liability.',
          riskLevel: 'low',
          expectedReturn: '6–9% annually',
          timeHorizon: 'Long-term (5+ years)',
          recommendedAllocation: 25,
          pros: ['Franking credits reduce tax', 'High dividend yields', 'Established companies', 'ASX liquidity'],
          cons: ['Market risk', 'Commodity sensitivity for miners'],
          icon: TrendingUp,
          accentColor: 'teal',
        });
      } else {
        advice.push({
          id: 'dividend-stocks',
          type: 'stocks',
          title: 'Dividend Aristocrat Stocks',
          description: 'Invest in established companies with consistent dividend payment history spanning 25+ years.',
          riskLevel: 'low',
          expectedReturn: '6–8% annually',
          timeHorizon: 'Long-term (5+ years)',
          recommendedAllocation: 25,
          pros: ['Regular income', 'Blue-chip companies', 'Dividend growth', 'Tax efficient'],
          cons: ['Market volatility', 'Lower growth potential'],
          icon: TrendingUp,
          accentColor: 'teal',
        });
      }
    } else if (risk === 'moderate') {
      switch (region) {
        case 'IN':
          advice.push({
            id: 'india-index-funds',
            type: 'etf',
            title: 'Nifty 50 & Sensex Index Funds',
            description: 'Low-cost index funds tracking Nifty 50 or Sensex through mutual funds or ETFs from HDFC, ICICI Prudential.',
            tickers: ['NIFTYBEES', 'SETFNIF50', 'SENSEXETF'],
            riskLevel: 'medium',
            expectedReturn: '10–14% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Broad diversification', 'Low expense ratio', 'Market returns', 'Tax efficient after 1 year'],
            cons: ['Market volatility', 'No guaranteed returns'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'US':
          advice.push({
            id: 'us-index-etf',
            type: 'etf',
            title: 'S&P 500 & Total Market Index ETFs',
            description: 'VOO, SPY, or VTI from Vanguard/BlackRock offering complete market exposure with minimal fees (0.03–0.1%).',
            tickers: ['VOO', 'SPY', 'VTI'],
            riskLevel: 'medium',
            expectedReturn: '8–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Ultra-low fees', 'Broad diversification', 'Tax efficient', 'Proven track record'],
            cons: ['Market risk', 'No downside protection'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'GB':
          advice.push({
            id: 'uk-index-etf',
            type: 'etf',
            title: 'FTSE 100 & All-World Index Funds',
            description: 'ISA-wrapped index funds tracking FTSE 100 or Vanguard LifeStrategy via Hargreaves Lansdown, AJ Bell, or Vanguard UK.',
            tickers: ['ISF', 'VWRL', 'VMID'],
            riskLevel: 'medium',
            expectedReturn: '7–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['ISA tax-free growth', 'Low-cost passive investing', 'Broad diversification', 'GBP-denominated'],
            cons: ['Market risk', 'UK market concentration'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'CA':
          advice.push({
            id: 'ca-index-etf',
            type: 'etf',
            title: 'TSX & All-Market Index ETFs (TFSA/RRSP)',
            description: 'Low-cost ETFs from Vanguard Canada, iShares, or BMO tracking TSX or global markets inside TFSA or RRSP.',
            tickers: ['VCN', 'XIC', 'XEQT'],
            riskLevel: 'medium',
            expectedReturn: '7–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['TFSA/RRSP tax benefits', 'Low MER', 'Broad diversification', 'CAD-denominated'],
            cons: ['Market risk', 'CAD/USD FX exposure'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'GCC':
          advice.push({
            id: 'gcc-index-etf',
            type: 'etf',
            title: 'UAE & GCC Equity Funds + Global ETFs',
            description: 'Invest in ADX/DFM-listed ETFs (e.g., NBAD MSCI UAE ETF) plus global ETFs available through Saxo Bank UAE, Sarwa, or StashAway.',
            tickers: ['NBAD-UAE-ETF', 'VOO', 'VWRA'],
            riskLevel: 'medium',
            expectedReturn: '8–12% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Zero capital gains tax in UAE', 'GCC + global diversification', 'Accessible via Sarwa/StashAway', 'USD-denominated options'],
            cons: ['Oil price sensitivity', 'Less developed local ETF market'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'AU':
          advice.push({
            id: 'au-index-etf',
            type: 'etf',
            title: 'ASX & Global Index ETFs (Super/SMSF)',
            description: 'Vanguard Australian Shares (VAS), BetaShares ASX 200 (A200), or VGS for global exposure — held inside superannuation for tax efficiency.',
            tickers: ['VAS', 'A200', 'VGS'],
            riskLevel: 'medium',
            expectedReturn: '8–11% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Super tax concessions (15% tax)', 'Low fees (0.07–0.2%)', 'Franking credits', 'Broad diversification'],
            cons: ['Superannuation access restrictions', 'Market volatility'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'EU':
          advice.push({
            id: 'eu-index-etf',
            type: 'etf',
            title: 'MSCI World & Euro STOXX Index ETFs',
            description: 'UCITS-compliant ETFs from Vanguard, iShares, or Amundi available on Euronext — ideal for ISA/PEA tax wrappers.',
            tickers: ['IWDA', 'VWCE', 'CSP1'],
            riskLevel: 'medium',
            expectedReturn: '7–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['UCITS regulated', 'Euro-denominated', 'PEA/ISA tax advantages', 'Ultra-low TER'],
            cons: ['Market risk', 'EUR/USD FX exposure'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'SEA':
          advice.push({
            id: 'sea-index-etf',
            type: 'etf',
            title: 'SGX & Regional Index ETFs',
            description: 'Nikko AM STI ETF or Lion-OCBC Securities APAC ETFs. Singapore investors can use SRS account for tax deductions.',
            tickers: ['ES3', 'CLR', 'LION-OCBC'],
            riskLevel: 'medium',
            expectedReturn: '7–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Low withholding tax in SG', 'SRS tax benefits', 'Regional diversification', 'Accessible'],
            cons: ['Market risk', 'Smaller local ETF ecosystem'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'JP':
          advice.push({
            id: 'jp-index-etf',
            type: 'etf',
            title: 'Nikkei 225 & TOPIX Index Funds (NISA)',
            description: 'Low-cost index funds from Rakuten or SBI tracking Nikkei 225 or TOPIX, held in NISA (tax-exempt investment account).',
            tickers: ['1321', '1306', '2513'],
            riskLevel: 'medium',
            expectedReturn: '6–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['NISA tax exemption', 'Low fees', 'JPY-denominated', 'Easy to open via app'],
            cons: ['JPY volatility', 'Japan-specific economic risks'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'KR':
          advice.push({
            id: 'kr-index-etf',
            type: 'etf',
            title: 'KOSPI & Global Index ETFs (ISA)',
            description: 'KODEX 200 and TIGER S&P 500 ETFs via KRX, held inside Individual Savings Account (ISA) for tax benefits.',
            tickers: ['069500', '143850', '360750'],
            riskLevel: 'medium',
            expectedReturn: '7–11% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['ISA tax benefits', 'Low fees', 'KRX liquidity', 'Global + local diversification'],
            cons: ['KRW volatility', 'Korea-specific risks'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'CN':
          advice.push({
            id: 'cn-index-etf',
            type: 'etf',
            title: 'CSI 300 & A-Share Index Funds',
            description: 'Index funds tracking CSI 300 from Huaxia, E Fund, or Tianhong — available via Alipay or WeChat Pay investment sections.',
            tickers: ['510300', '510500', '159919'],
            riskLevel: 'medium',
            expectedReturn: '8–12% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Access to China growth', 'Low fees', 'Accessible via apps', 'Government support for markets'],
            cons: ['Regulatory risk', 'Capital controls', 'Market volatility'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'LATAM':
          advice.push({
            id: 'latam-index-etf',
            type: 'etf',
            title: 'Local Stock Market Index Funds',
            description: 'Brazil Bovespa index funds (BOVA11), Mexico IPC ETFs, or USD-denominated LatAm ETFs for broader exposure.',
            tickers: ['BOVA11', 'EWZ', 'ILF'],
            riskLevel: 'medium',
            expectedReturn: '10–16% annually (nominal)',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 35,
            pros: ['Local market access', 'Diversification', 'Commodity exposure', 'High growth potential'],
            cons: ['Currency risk', 'Political volatility', 'High fees in some markets'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'AFRICA':
          advice.push({
            id: 'africa-index-etf',
            type: 'etf',
            title: 'JSE ETFs & Pan-African Equity Funds',
            description: 'Satrix 40 ETF, Ashburton MidCap ETF on JSE, or USD-denominated Africa-focused ETFs for diversified continental exposure.',
            tickers: ['STX40', 'EZA', 'AFK'],
            riskLevel: 'medium',
            expectedReturn: '10–16% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 35,
            pros: ['Access to frontier markets', 'Commodity wealth exposure', 'Growing middle class', 'Diversification'],
            cons: ['Currency risk', 'Political risk', 'Lower liquidity'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'SOUTHASIA':
          advice.push({
            id: 'southasia-equities',
            type: 'etf',
            title: 'Local Stock Exchange Index Funds',
            description: 'Pakistan Stock Exchange (PSX) KSE-30 index funds or Bangladesh DSE Broad Index funds for domestic equity exposure.',
            riskLevel: 'medium',
            expectedReturn: '12–20% annually (nominal)',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 35,
            pros: ['High growth market', 'Undervalued valuations', 'Local currency returns', 'Accessible'],
            cons: ['Currency depreciation risk', 'Political instability', 'Liquidity risk'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        case 'IL':
          advice.push({
            id: 'il-index-etf',
            type: 'etf',
            title: 'TA-35 & Global Index Funds (Keren Hishtalmut)',
            description: 'Tel Aviv 35 index trackers from Meitav or More, plus global index exposure — hold in Keren Hishtalmut for preferential tax treatment.',
            tickers: ['1159242', 'TASE:KSM', 'IWDA'],
            riskLevel: 'medium',
            expectedReturn: '8–12% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Keren Hishtalmut tax benefits', 'Shekel-denominated', 'Local + global diversification', 'Accessible via brokers'],
            cons: ['Geopolitical risk', 'Small market concentration'],
            icon: PieChart,
            accentColor: 'blue',
          });
          break;
        default:
          advice.push({
            id: 'index-etf',
            type: 'etf',
            title: 'Low-Cost Index ETFs',
            description: 'Diversified exposure to the entire market through local or international index funds.',
            riskLevel: 'medium',
            expectedReturn: '7–10% annually',
            timeHorizon: 'Long-term (5+ years)',
            recommendedAllocation: 40,
            pros: ['Broad diversification', 'Low fees', 'Historical performance', 'Easy to manage'],
            cons: ['Market risk', 'Short-term volatility'],
            icon: PieChart,
            accentColor: 'blue',
          });
      }

      advice.push({
        id: 'corporate-bonds',
        type: 'bonds',
        title: region === 'GCC' ? 'Investment-Grade Corporate Sukuk & Bonds' : 'Investment-Grade Corporate Bonds',
        description: region === 'GCC'
          ? 'High-quality corporate sukuk and conventional bonds from UAE blue-chips like Emaar, DP World, and ADNOC on Nasdaq Dubai.'
          : 'Higher yields than government bonds from financially stable corporations.',
        riskLevel: 'medium',
        expectedReturn: region === 'GCC' ? '5–8% annually' : '5–7% annually',
        timeHorizon: 'Medium-term (3–5 years)',
        recommendedAllocation: 30,
        pros: region === 'GCC'
          ? ['Shariah-compliant sukuk available', 'Regular distributions', 'Investment-grade issuers', 'USD/AED denominated']
          : ['Higher yields', 'Regular income', 'Diversification', 'Credit quality'],
        cons: ['Credit risk', 'Interest rate sensitivity'],
        icon: BarChart3,
        accentColor: 'amber',
      });

      advice.push({
        id: 'growth-stocks',
        type: 'stocks',
        title: region === 'GCC' ? 'UAE & International Growth Stocks' : 'Growth Stock Portfolio',
        description: region === 'GCC'
          ? 'Mix of ADX/DFM growth companies and international growth stocks accessible via Saxo Bank, Interactive Brokers, or Sarwa in the UAE.'
          : 'Mix of established tech companies and emerging growth sectors for capital appreciation.',
        riskLevel: 'medium',
        expectedReturn: region === 'GCC' ? '10–18% annually' : '10–15% annually',
        timeHorizon: 'Long-term (7+ years)',
        recommendedAllocation: 30,
        pros: region === 'GCC'
          ? ['No capital gains tax', 'USD stability', 'Access to global growth', 'Emerging market premium']
          : ['High growth potential', 'Sector diversification', 'Innovation exposure'],
        cons: ['Higher volatility', 'No dividends', 'Valuation risk'],
        icon: TrendingUp,
        accentColor: 'emerald',
      });
    } else {
      if (region === 'GCC') {
        advice.push({
          id: 'gcc-growth-etf',
          type: 'etf',
          title: 'Global Growth ETFs & MENA Equity Funds',
          description: 'QQQ, ARKK, and MENA-focused ETFs accessible via Saxo Bank UAE or Interactive Brokers — maximum growth potential with zero capital gains tax in UAE.',
          tickers: ['QQQ', 'VGT', 'MENA-ETF'],
          riskLevel: 'high',
          expectedReturn: '15–25% annually',
          timeHorizon: 'Long-term (10+ years)',
          recommendedAllocation: 45,
          pros: ['Zero capital gains tax in UAE', 'Global tech exposure', 'USD-based returns', 'Access via UAE platforms'],
          cons: ['High volatility', 'USD concentration', 'Geopolitical risk'],
          icon: Zap,
          accentColor: 'orange',
        });
        advice.push({
          id: 'gcc-individual-stocks',
          type: 'stocks',
          title: 'ADX/DFM & Global Individual Stocks',
          description: 'High-conviction positions in UAE growth companies (EMAAR, ALDAR, DEWA) and global tech giants through UAE-licensed brokers.',
          riskLevel: 'high',
          expectedReturn: '15–30% annually',
          timeHorizon: 'Long-term (5–10 years)',
          recommendedAllocation: 35,
          pros: ['No income or capital gains tax', 'Exposure to UAE economy growth', 'USD pegged currency stability', 'Dividend income'],
          cons: ['Concentration risk', 'Oil price sensitivity', 'Geopolitical risk'],
          icon: TrendingUp,
          accentColor: 'red',
        });
        advice.push({
          id: 'gcc-realestate',
          type: 'realestate',
          title: 'UAE Real Estate & REITs',
          description: 'Direct UAE property investment or DFM-listed REIT funds (ENBD REIT) for real estate exposure in one of the world\'s fastest-growing property markets.',
          riskLevel: 'high',
          expectedReturn: '8–15% annually',
          timeHorizon: 'Medium-term (5–7 years)',
          recommendedAllocation: 20,
          pros: ['No property tax in UAE', 'High rental yields (5–8%)', 'Residency visa eligibility', 'Strong demand'],
          cons: ['High entry capital required', 'Illiquid for direct investment', 'Regulatory changes'],
          icon: PieChart,
          accentColor: 'amber',
        });
      } else if (region === 'IN') {
        advice.push({
          id: 'india-growth-etf',
          type: 'etf',
          title: 'Mid & Small Cap Index Funds',
          description: 'Nifty Midcap 150 and Nifty Smallcap 250 index funds from Axis, Mirae Asset for high-growth exposure to India\'s emerging companies.',
          tickers: ['MIDCAPETF', 'JUNIORBEES', 'MAFANG'],
          riskLevel: 'high',
          expectedReturn: '14–20% annually',
          timeHorizon: 'Long-term (7+ years)',
          recommendedAllocation: 45,
          pros: ['India growth story', 'High return potential', 'Tax efficient after 1 year', 'SIP available'],
          cons: ['High volatility', 'Liquidity risk in small caps', 'Requires patience'],
          icon: Zap,
          accentColor: 'orange',
        });
        advice.push({
          id: 'india-individual-stocks',
          type: 'stocks',
          title: 'Direct Equity — Growth Stocks (NSE/BSE)',
          description: 'High-conviction stock picks in India\'s IT, pharma, and consumer sectors. Use platforms like Zerodha, Groww, or Upstox.',
          riskLevel: 'high',
          expectedReturn: '15–25% annually',
          timeHorizon: 'Long-term (5–10 years)',
          recommendedAllocation: 35,
          pros: ['Direct market participation', 'High alpha potential', 'Control over selection', 'Sector concentration possible'],
          cons: ['Research intensive', 'Concentration risk', 'STCG tax (15%)'],
          icon: TrendingUp,
          accentColor: 'red',
        });
        advice.push({
          id: 'india-realestate',
          type: 'realestate',
          title: 'REITs & Real Estate Funds',
          description: 'Embassy REIT, Mindspace REIT, and Brookfield India REIT listed on NSE — professional real estate exposure with regular distributions.',
          tickers: ['EMBASSY', 'MINDSPACE', 'BIRET'],
          riskLevel: 'high',
          expectedReturn: '8–12% annually',
          timeHorizon: 'Medium-term (5–7 years)',
          recommendedAllocation: 20,
          pros: ['Real estate exposure without property purchase', 'Regular distributions', 'Professionally managed', 'Liquid on exchange'],
          cons: ['NAV volatility', 'Interest rate sensitivity', 'Sector concentration'],
          icon: PieChart,
          accentColor: 'amber',
        });
      } else if (region === 'AU') {
        advice.push({
          id: 'au-growth-etf',
          type: 'etf',
          title: 'High-Growth & Global Tech ETFs (ASX)',
          description: 'BetaShares NDQ (Nasdaq-100), ETHI (ethical global), and Spaceship Voyager for aggressive growth with Australian tax efficiency.',
          tickers: ['NDQ', 'ETHI', 'HACK'],
          riskLevel: 'high',
          expectedReturn: '12–18% annually',
          timeHorizon: 'Long-term (10+ years)',
          recommendedAllocation: 50,
          pros: ['Nasdaq-100 tech growth', 'Accessible on ASX', 'Low fees', 'AUD-denominated'],
          cons: ['High volatility', 'USD/AUD FX impact', 'Concentration in tech'],
          icon: Zap,
          accentColor: 'orange',
        });
        advice.push({
          id: 'au-individual-stocks',
          type: 'stocks',
          title: 'ASX Growth Stocks & Small Caps',
          description: 'High-growth ASX-listed companies in mining, tech, and healthcare. Use CommSec, SelfWealth, or Stake for low-cost trading.',
          riskLevel: 'high',
          expectedReturn: '15–25% annually',
          timeHorizon: 'Long-term (7–10 years)',
          recommendedAllocation: 30,
          pros: ['50% CGT discount after 12 months', 'Franking credits on dividends', 'Direct ownership', 'High upside potential'],
          cons: ['Research required', 'Company-specific risk', 'High volatility in small caps'],
          icon: TrendingUp,
          accentColor: 'red',
        });
        advice.push({
          id: 'au-realestate',
          type: 'realestate',
          title: 'A-REITs (Australian Real Estate Investment Trusts)',
          description: 'Diversified exposure to commercial, retail, and industrial property through Goodman Group, Scentre, and Dexus on ASX.',
          tickers: ['GMG', 'SCG', 'DXS'],
          riskLevel: 'high',
          expectedReturn: '8–13% annually',
          timeHorizon: 'Medium-term (5–7 years)',
          recommendedAllocation: 20,
          pros: ['Steady distributions', 'Inflation hedge', 'ASX liquidity', 'Diversified property exposure'],
          cons: ['Interest rate sensitivity', 'Sector risk', 'Dilutive capital raises'],
          icon: PieChart,
          accentColor: 'amber',
        });
      } else {
        advice.push({
          id: 'growth-etf',
          type: 'etf',
          title: 'Aggressive Growth ETFs',
          description: 'Technology, innovation, and emerging market ETFs for maximum growth potential.',
          tickers: ['QQQ', 'ARKK', 'VGT'],
          riskLevel: 'high',
          expectedReturn: '12–18% annually',
          timeHorizon: 'Long-term (10+ years)',
          recommendedAllocation: 50,
          pros: ['Maximum growth potential', 'Sector focus', 'Emerging markets', 'Innovation'],
          cons: ['High volatility', 'Concentration risk', 'Market timing'],
          icon: Zap,
          accentColor: 'orange',
        });

        advice.push({
          id: 'individual-stocks',
          type: 'stocks',
          title: 'Individual Stock Selection',
          description: 'Carefully selected high-growth stocks in technology, healthcare, and emerging sectors.',
          riskLevel: 'high',
          expectedReturn: '15–25% annually',
          timeHorizon: 'Long-term (7–10 years)',
          recommendedAllocation: 30,
          pros: ['High returns', 'Active management', 'Sector selection', 'Tax control'],
          cons: ['Requires research', 'High risk', 'Company-specific risk', 'Time intensive'],
          icon: TrendingUp,
          accentColor: 'red',
        });

        advice.push({
          id: 'alternative-investments',
          type: 'realestate',
          title: 'REITs & Alternative Investments',
          description: 'Real estate investment trusts and alternative assets for portfolio diversification.',
          riskLevel: 'high',
          expectedReturn: '8–12% annually',
          timeHorizon: 'Medium-term (5–7 years)',
          recommendedAllocation: 20,
          pros: ['Diversification', 'Real estate exposure', 'Income generation', 'Inflation hedge'],
          cons: ['Liquidity risk', 'Market cycles', 'Management fees'],
          icon: PieChart,
          accentColor: 'amber',
        });
      }
    }

    return advice;
  };

  const getCountryName = (code: string): string => {
    if (!code) return '';
    const found = countries.find(
      (c) => c.code.toUpperCase() === code.toUpperCase() || c.name.toUpperCase() === code.toUpperCase()
    );
    return found ? found.name : code;
  };

  const surplus = monthlyIncome - monthlyExpenses;
  const countryName = getCountryName(userCountry);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonBlock className="w-48 h-7 mb-2" />
          <SkeletonBlock className="w-80 h-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
        <SkeletonBlock className="w-full h-36 rounded-2xl" />
        <SkeletonBlock className="w-full h-24 rounded-2xl" />
        <div className="space-y-4">
          <SkeletonAdviceCard />
          <SkeletonAdviceCard />
          <SkeletonAdviceCard />
        </div>
      </div>
    );
  }

  if (investableAmount <= 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            Investment Advisory
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            AI-powered investment recommendations based on your risk profile
          </p>
        </div>
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/[0.15] flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            Build your financial foundation first
          </p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Focus on reducing expenses and increasing income to create an investable surplus. Add
            your income and expense transactions to get started.
          </p>
        </div>
      </div>
    );
  }

  const planEntries = countryInvestmentPlan
    ? [1, 2, 3, 4, 5]
        .map((n) => ({
          name: (countryInvestmentPlan[`plan_${n}_name` as keyof CountryInvestmentPlan] as string || '').replace(/^\t+/, '').trim(),
          description: (countryInvestmentPlan[`plan_${n}_description` as keyof CountryInvestmentPlan] as string || '').trim(),
        }))
        .filter((p) => p.name)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            Investment Advisory
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            {countryName && planEntries.length > 0
              ? `Country-specific plans for ${countryName} + AI-powered global strategies`
              : 'AI-powered investment recommendations based on your risk profile'}
          </p>
        </div>
        {countryName && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-teal-500/[0.07] dark:bg-teal-500/[0.1] border border-teal-200/60 dark:border-teal-500/[0.15] rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="text-[12px] font-semibold text-teal-700 dark:text-teal-300">
              {countryName}
            </span>
            {planEntries.length > 0 && (
              <span className="text-[11px] text-teal-500/70 dark:text-teal-400/60">
                — {planEntries.length} local plans
              </span>
            )}
          </div>
        )}
      </div>

      {userCountry && planEntries.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-500/[0.06] dark:to-emerald-500/[0.06] border border-teal-200/60 dark:border-teal-500/[0.15] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center flex-shrink-0">
            <Star className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-teal-800 dark:text-teal-200">
              {planEntries.length} government-regulated investment plans found for {countryName}
            </p>
            <p className="text-[12px] text-teal-600 dark:text-teal-400 mt-0.5">
              {planEntries.map((p) => p.name).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/[0.15] flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
            Monthly Surplus
          </p>
          <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            {formatCurrency(surplus, preferences.currency)}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            Avg. income minus expenses
          </p>
        </div>

        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/[0.15] flex items-center justify-center mb-4">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
            Investable Amount
          </p>
          <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            {formatCurrency(investableAmount, preferences.currency)}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">70% of surplus</p>
        </div>

        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
            Risk Tolerance
          </p>
          <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white capitalize">
            {riskTolerance}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">Your risk profile</p>
        </div>

        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
            Time Horizon
          </p>
          <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            {riskTolerance === 'conservative' ? 'Short-term' : 'Long-term'}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            {riskTolerance === 'conservative' ? '1–3 years' : riskTolerance === 'aggressive' ? '7+ years' : '5+ years'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center flex-shrink-0">
            <Calculator className="w-4.5 h-4.5 text-amber-500" style={{ width: 18, height: 18 }} />
          </div>
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
            How We Calculate Your Investment Capacity
          </h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                Monthly Surplus:{' '}
              </span>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">
                Average Income − Average Expenses (last 3 months)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                Investable Amount:{' '}
              </span>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">
                Monthly Surplus × 70% (keeping 30% as emergency buffer)
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 px-4 py-3 bg-amber-500/[0.07] dark:bg-amber-500/[0.05] rounded-xl border border-amber-200/60 dark:border-amber-500/[0.12]">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-amber-800 dark:text-amber-300">
              All amounts are displayed in your preferred currency ({preferences.currency}). Mixed
              currency transactions are automatically converted using current exchange rates.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/[0.15] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4.5 h-4.5 text-blue-500" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">
              Your Personalized Investment Portfolio
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              Based on your{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                {riskTolerance}
              </span>{' '}
              risk profile{countryName ? (
                <> and <span className="font-semibold text-gray-700 dark:text-gray-300">{countryName}</span> market context</>
              ) : ''}, you can invest{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(investableAmount, preferences.currency)}/month
              </span>{' '}
              across the following options.
              {countryInvestmentPlan && (
                <>{' '}Your portfolio is organized into <span className="font-semibold text-gray-700 dark:text-gray-300">country-specific plans</span> first, followed by <span className="font-semibold text-gray-700 dark:text-gray-300">global diversification strategies</span>.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {planEntries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  {countryName} Investment Plans
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200/50 dark:border-teal-500/20 uppercase tracking-wider">
                  Country-Specific
                </span>
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                Regulated investment vehicles for {countryName} residents — allocations weighted for your <span className="capitalize font-medium">{riskTolerance}</span> risk profile
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {(() => {
              const allocations = getCountryPlanAllocations(planEntries.length, riskTolerance);
              return planEntries.map((plan, idx) => {
                const meta = getPlanMeta(plan.name);
                const cfg = ACCENT_CONFIG[meta.accentColor as keyof typeof ACCENT_CONFIG];
                const allocation = allocations[idx];
                const monthlyInv = (investableAmount * allocation) / 100;
                const PlanIcon = meta.icon;
                const planTypeLabel = PLAN_TYPE_LABELS[idx + 1];
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-xl ${cfg.icon} flex items-center justify-center flex-shrink-0`}>
                        <PlanIcon className={`w-6 h-6 ${cfg.iconText}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-white/[0.06] uppercase tracking-wider">
                                {planTypeLabel}
                              </span>
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                              {plan.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${RISK_BADGE[meta.riskLevel]}`}>
                              {meta.badge}
                            </span>
                            <span className={`text-[22px] font-bold tracking-tight ${cfg.value}`}>
                              {allocation}%
                            </span>
                          </div>
                        </div>
                        {plan.description && (
                          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100 dark:border-white/[0.05]">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Expected Return
                        </p>
                        <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {meta.expectedReturn}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Time Horizon
                        </p>
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                          {meta.timeHorizon}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Monthly Investment
                        </p>
                        <p className={`text-[13px] font-semibold ${cfg.value}`}>
                          {formatCurrency(monthlyInv, preferences.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          Portfolio Allocation
                        </span>
                        <span className={`text-[11px] font-semibold ${cfg.value}`}>{allocation}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`}
                          style={{ width: `${allocation}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
                            Advantages
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {meta.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                            Considerations
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {meta.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                              <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/[0.15] flex items-center justify-center flex-shrink-0">
              <Globe className="w-4.5 h-4.5 text-blue-500" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                AI-Recommended Strategies
              </h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                Personalized recommendations based on your <span className="capitalize font-medium">{riskTolerance}</span> risk profile and {countryName || 'global'} market context
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {investmentAdvice.map((advice) => {
              const cfg = ACCENT_CONFIG[advice.accentColor];
              const monthlyInv = (investableAmount * advice.recommendedAllocation) / 100;

          return (
            <div
              key={advice.id}
              className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className={`w-12 h-12 rounded-xl ${cfg.icon} flex items-center justify-center flex-shrink-0`}
                >
                  <advice.icon className={`w-6 h-6 ${cfg.iconText}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                        {advice.title}
                      </h3>
                      {advice.tickers && advice.tickers.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {advice.tickers.map((ticker) => (
                            <span
                              key={ticker}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${cfg.tickerBg}`}
                            >
                              {ticker}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${RISK_BADGE[advice.riskLevel]}`}
                      >
                        {advice.riskLevel === 'low'
                          ? 'Low Risk'
                          : advice.riskLevel === 'medium'
                          ? 'Medium Risk'
                          : 'High Risk'}
                      </span>
                      <span
                        className={`text-[22px] font-bold tracking-tight ${cfg.value}`}
                      >
                        {advice.recommendedAllocation}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    {advice.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100 dark:border-white/[0.05]">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Expected Return
                  </p>
                  <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {advice.expectedReturn}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Time Horizon
                  </p>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                    {advice.timeHorizon}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Monthly Investment
                  </p>
                  <p className={`text-[13px] font-semibold ${cfg.value}`}>
                    {formatCurrency(monthlyInv, preferences.currency)}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Portfolio Allocation
                  </span>
                  <span className={`text-[11px] font-semibold ${cfg.value}`}>
                    {advice.recommendedAllocation}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`}
                    style={{ width: `${advice.recommendedAllocation}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Advantages
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {advice.pros.map((pro, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-gray-400"
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                      Considerations
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {advice.cons.map((con, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-gray-400"
                      >
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
          </div>
        </>
      )}

      <div className="bg-white dark:bg-white/[0.03] border border-amber-200/60 dark:border-amber-500/[0.15] rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/[0.15] flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-2">
              Investment Disclaimer
            </h3>
            <ul className="space-y-1.5">
              {[
                'These recommendations are AI-generated based on your financial profile and risk tolerance.',
                'Past performance does not guarantee future results.',
                'All investments carry risk, including potential loss of principal.',
                'Consider consulting with a licensed financial advisor before making investment decisions.',
              ].map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
