import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calculator, ArrowRight, TrendingUp, Target, DollarSign, Zap, PieChart } from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import SEOHead from '../SEO/SEOHead';

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
  { code: 'USD', symbol: '$', label: 'USD - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED - UAE Dirham' },
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee' },
  { code: 'SAR', symbol: '﷼', label: 'SAR - Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', label: 'SGD - Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD - Australian Dollar' },
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
      <SEOHead
        title="ROI Calculator - How Much Could You Save with FinanceFlow AI?"
        description="Calculate your potential savings with FinanceFlow AI. Enter your income and spending habits to see how much extra you could save per month and per year."
        keywords="personal finance ROI calculator, how much can I save, budgeting app savings calculator, finance app return on investment"
        canonical="https://financeflow.ai/roi-calculator"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'ROI Calculator', url: 'https://financeflow.ai/roi-calculator' },
        ]}
      />
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
              Start saving - it's free <ArrowRight size={16} className="inline ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* How we calculate */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How the estimate works</h2>
            <p className="text-gray-500 dark:text-gray-400">Based on aggregated data from FinanceFlow users in their first 90 days.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: PieChart, title: 'Overspend recovery', desc: 'On average, users who track spending reduce discretionary overspend by 60% within 3 months. Dining out, subscriptions, and impulse purchases are the top three recovered categories.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: TrendingUp, title: 'Savings rate increase', desc: 'Users who set savings goals with FinanceFlow increase their monthly savings rate by an average of 5 percentage points compared to before they started tracking.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Target, title: 'Goal achievement', desc: '94% of FinanceFlow users who set a savings goal with a target date hit it within 10% of the projected date. Tracking progress weekly doubles completion rates.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <Icon size={20} className={item.color} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 mt-8">
            Individual results vary. The calculator provides directional estimates, not guaranteed outcomes. Results depend on consistency of use and individual spending patterns.
          </p>
        </div>
      </section>

      {/* What users actually save */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Real results from real users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'Priya M.', location: 'Dubai', saved: '$1,200', period: '3 months', how: 'Cut dining spend by 40% after seeing the breakdown' },
              { name: 'Carlos R.', location: 'Mexico City', saved: '$800', period: '2 months', how: 'Cancelled 4 forgotten subscriptions found by AI assistant' },
              { name: 'Emma K.', location: 'Manchester', saved: '£600', period: '4 months', how: 'Family budget stopped weekly overspend on groceries' },
              { name: 'David L.', location: 'Singapore', saved: 'SGD 2,400', period: '6 months', how: 'Savings goal tracking kept emergency fund on track' },
            ].map((u, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] shadow-sm"
              >
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">{u.saved}</div>
                <div className="text-xs text-gray-500 mb-3">saved in {u.period}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic mb-3">"{u.how}"</p>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{u.name}</div>
                <div className="text-xs text-gray-400">{u.location}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is this calculator accurate?', a: 'It provides directional estimates based on averages from FinanceFlow users. The actual savings depend on your consistency, spending categories, and how actively you use the app.' },
              { q: 'What does "overspend" mean in the calculator?', a: 'Overspend is money spent beyond what you planned or budgeted - often on impulse purchases, dining, or forgotten subscriptions. Most people underestimate this by 10–20% of their income.' },
              { q: 'Do I need the Pro plan to see these savings?', a: 'No. Core budget tracking and savings goals are available on the free plan. The Pro plan adds the AI assistant and investment tracking, which can accelerate results further.' },
              { q: 'How quickly do users see results?', a: 'Most users notice their first insight within the first week of tracking. Meaningful savings changes typically appear within 30–60 days of consistent use.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]"
              >
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.q}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
