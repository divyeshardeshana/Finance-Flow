import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calculator, ArrowRight, TrendingUp, Target, DollarSign, Zap, PieChart } from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface Props {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED — UAE Dirham' },
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee' },
  { code: 'SAR', symbol: '﷼', label: 'SAR — Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', label: 'SGD — Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD — Australian Dollar' },
];

function fmt(n: number, symbol: string) {
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)}K`;
  return `${symbol}${Math.round(n).toLocaleString()}`;
}

export default function ROICalculatorPage({ onNavigate, onSignIn }: Props) {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  const [income, setIncome] = useState(5000);
  const [savingsPct, setSavingsPct] = useState(10);
  const [overspendPct, setOverspendPct] = useState(15);
  const [years, setYears] = useState(3);
  const [currency, setCurrency] = useState(CURRENCIES[0]);

  // Calculations
  const currentSavings = (income * savingsPct) / 100;
  const overspend = (income * overspendPct) / 100;
  // With FinanceFlow: recover 60% of overspend and increase savings by 5%
  const recoveredSpend = overspend * 0.6;
  const improvedSavingsPct = Math.min(savingsPct + 5, 40);
  const improvedSavings = (income * improvedSavingsPct) / 100;
  const extraMonthly = improvedSavings - currentSavings + recoveredSpend;
  const totalSaved = extraMonthly * 12 * years;
  const currentTotal = currentSavings * 12 * years;
  const withFFTotal = currentTotal + totalSaved;
  const proMonthlyFee = 9.99;
  const totalFee = proMonthlyFee * 12 * years;
  const netBenefit = totalSaved - totalFee;
  const roi = totalFee > 0 ? Math.round((netBenefit / totalFee) * 100) : 0;

  const sym = currency.symbol;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white">
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} currentView="roi-calculator" />

      {/* Hero */}
      <section ref={heroRef} className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Calculator size={14} />
            ROI Calculator
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            How much could you save
            <span className="block bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">with FinanceFlow AI?</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 dark:text-gray-300">
            Enter your numbers. See your potential savings in seconds.
          </motion.p>
        </motion.div>
      </section>

      {/* Calculator */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm space-y-6"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your current situation</h2>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
              <select
                value={currency.code}
                onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>

            {/* Monthly income */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly income</label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{sym}{income.toLocaleString()}</span>
              </div>
              <input
                type="range" min="500" max="50000" step="500"
                value={income}
                onChange={e => setIncome(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{sym}500</span><span>{sym}50,000</span>
              </div>
            </div>

            {/* Current savings rate */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current savings rate</label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{savingsPct}%</span>
              </div>
              <input
                type="range" min="0" max="35" step="1"
                value={savingsPct}
                onChange={e => setSavingsPct(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>35%</span>
              </div>
            </div>

            {/* Overspend estimate */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated monthly overspend</label>
                <span className="text-sm font-bold text-orange-500">{overspendPct}%</span>
              </div>
              <input
                type="range" min="0" max="40" step="1"
                value={overspendPct}
                onChange={e => setOverspendPct(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>40%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Most people overspend 10–20% monthly without realising it. FinanceFlow shows you exactly where.
              </p>
            </div>

            {/* Time horizon */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time horizon</label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{years} year{years > 1 ? 's' : ''}</span>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 yr</span><span>10 yrs</span>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Main result */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/25">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Extra savings in {years} year{years > 1 ? 's' : ''}</span>
              </div>
              <div className="text-5xl font-black mb-2">{fmt(totalSaved, sym)}</div>
              <p className="text-blue-100 text-sm">
                {fmt(extraMonthly, sym)}/month more than you save today
              </p>
            </div>

            {/* Breakdown cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Target size={18} className="text-emerald-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Savings with FinanceFlow</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(withFFTotal, sym)}</p>
                <p className="text-xs text-emerald-500 mt-1">vs {fmt(currentTotal, sym)} today</p>
              </div>
              <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                  <PieChart size={18} className="text-violet-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recovered overspend</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(recoveredSpend * 12 * years, sym)}</p>
                <p className="text-xs text-gray-500 mt-1">{fmt(recoveredSpend, sym)}/month</p>
              </div>
              <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <DollarSign size={18} className="text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pro plan cost ({years}yr)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalFee, sym)}</p>
                <p className="text-xs text-gray-500 mt-1">{sym}9.99/month</p>
              </div>
              <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <Zap size={18} className="text-amber-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Return on investment</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{roi}%</p>
                <p className="text-xs text-emerald-500 mt-1">Net benefit: {fmt(Math.max(0, netBenefit), sym)}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center px-2">
              Estimates based on typical FinanceFlow users recovering 60% of overspend and increasing savings rate by 5 percentage points. Your results may vary.
            </p>

            <button
              onClick={onSignIn}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] text-base"
            >
              Start saving — it's free <ArrowRight size={16} className="inline ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
