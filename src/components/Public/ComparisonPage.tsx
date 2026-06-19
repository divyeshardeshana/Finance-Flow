import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, X, ArrowRight, Zap, Trophy } from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import SEOHead from '../SEO/SEOHead';

interface Props {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
  onGetStarted?: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

type CellValue = boolean | string;

const FEATURES: { label: string; financeflow: CellValue; mint: CellValue; ynab: CellValue; excel: CellValue }[] = [
  { label: 'Free plan available',           financeflow: true,        mint: true,        ynab: false,       excel: true },
  { label: 'AI financial assistant',        financeflow: true,        mint: false,       ynab: false,       excel: false },
  { label: 'Budget tracking',               financeflow: true,        mint: true,        ynab: true,        excel: 'Manual' },
  { label: 'Investment tracking',           financeflow: true,        mint: true,        ynab: false,       excel: 'Manual' },
  { label: 'Net worth tracker',             financeflow: true,        mint: true,        ynab: false,       excel: 'Manual' },
  { label: 'Savings goals',                 financeflow: true,        mint: false,       ynab: true,        excel: 'Manual' },
  { label: 'Bill reminders',                financeflow: true,        mint: true,        ynab: false,       excel: false },
  { label: 'Retirement planning',           financeflow: true,        mint: false,       ynab: false,       excel: false },
  { label: 'Multi-currency support',        financeflow: true,        mint: false,       ynab: true,        excel: 'Manual' },
  { label: 'Works without bank connection', financeflow: true,        mint: false,       ynab: false,       excel: true },
  { label: 'GDPR compliant',                financeflow: true,        mint: false,       ynab: false,       excel: true },
  { label: 'Available worldwide',           financeflow: true,        mint: 'US only',   ynab: 'Limited',   excel: true },
  { label: 'Mobile + web',                  financeflow: 'Web',       mint: true,        ynab: true,        excel: 'Desktop' },
  { label: 'Data export / portability',     financeflow: true,        mint: 'Limited',   ynab: true,        excel: true },
  { label: 'No ads',                        financeflow: true,        mint: false,       ynab: true,        excel: true },
];

const COLS = [
  { key: 'financeflow', label: 'FinanceFlow AI', highlight: true, price: 'Free / $9.99/mo' },
  { key: 'mint',        label: 'Mint',           highlight: false, price: 'Discontinued' },
  { key: 'ynab',        label: 'YNAB',           highlight: false, price: '$14.99/mo' },
  { key: 'excel',       label: 'Spreadsheet',    highlight: false, price: 'Free (DIY)' },
];

function Cell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (value === true) return <Check size={18} className={highlight ? 'text-emerald-400 mx-auto' : 'text-emerald-500 mx-auto'} />;
  if (value === false) return <X size={18} className="text-red-400 mx-auto" />;
  return <span className={`text-xs font-medium ${highlight ? 'text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>{value}</span>;
}

export default function ComparisonPage({ onNavigate, onSignIn, onGetStarted }: Props) {
  const handleGetStarted = onGetStarted ?? onSignIn;
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white">
      <SEOHead
        title="FinanceFlow AI vs Mint vs YNAB - Personal Finance App Comparison"
        description="Compare FinanceFlow AI vs Mint, YNAB, and spreadsheets. FinanceFlow offers AI assistant, multi-currency, global availability, and GDPR compliance - available free."
        keywords="FinanceFlow vs Mint, FinanceFlow vs YNAB, best personal finance app, budgeting app comparison, Mint alternative, YNAB alternative"
        canonical="https://financeflow.ai/comparison"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Comparison', url: 'https://financeflow.ai/comparison' },
        ]}
      />
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} onGetStarted={handleGetStarted} currentView="comparison" />

      {/* Hero */}
      <section ref={heroRef} className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
            <Trophy size={14} />
            FinanceFlow AI vs alternatives
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Why people choose FinanceFlow AI
            <span className="block bg-gradient-to-r from-violet-500 to-purple-400 bg-clip-text text-transparent">over the alternatives</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 dark:text-gray-300">
            An honest comparison. We included features where competitors genuinely win too.
          </motion.p>
        </motion.div>
      </section>

      {/* Comparison table */}
      <section ref={tableRef} className="pb-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={tableInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto overflow-x-auto"
        >
          <div className="min-w-[640px]">
            {/* Header row */}
            <div className="grid grid-cols-5 gap-0 mb-2">
              <div className="p-4" />
              {COLS.map((col) => (
                <div
                  key={col.key}
                  className={`p-4 rounded-t-2xl text-center ${col.highlight ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white' : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.06]'}`}
                >
                  {col.highlight && (
                    <div className="text-xs font-bold bg-amber-400 text-gray-900 rounded-full px-2 py-0.5 mb-2 inline-block">
                      Best Value
                    </div>
                  )}
                  <p className={`font-bold text-sm ${col.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{col.label}</p>
                  <p className={`text-xs mt-1 ${col.highlight ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{col.price}</p>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {FEATURES.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-5 gap-0 ${i % 2 === 0 ? 'bg-white dark:bg-white/[0.02]' : 'bg-gray-50 dark:bg-transparent'}`}
              >
                <div className="p-4 text-sm text-gray-700 dark:text-gray-300 font-medium border-l border-b border-gray-200 dark:border-white/[0.04]">
                  {row.label}
                </div>
                {COLS.map((col) => (
                  <div
                    key={col.key}
                    className={`p-4 flex items-center justify-center border-b border-r border-gray-200 dark:border-white/[0.04] ${col.highlight ? 'bg-blue-600/5 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : ''}`}
                  >
                    <Cell value={row[col.key as keyof typeof row] as CellValue} highlight={col.highlight} />
                  </div>
                ))}
              </div>
            ))}

            {/* CTA row */}
            <div className="grid grid-cols-5 gap-0">
              <div className="p-4 rounded-bl-2xl bg-white dark:bg-white/[0.02] border-l border-b border-gray-200 dark:border-white/[0.04]" />
              {COLS.map((col) => (
                <div
                  key={col.key}
                  className={`p-4 flex justify-center rounded-b-2xl ${col.highlight ? 'bg-blue-700' : 'bg-white dark:bg-white/5 border border-t-0 border-gray-200 dark:border-white/[0.06]'}`}
                >
                  {col.highlight && (
                    <button
                      onClick={handleGetStarted}
                      className="px-4 py-2 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors"
                    >
                      Start free
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Key differentiators */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why FinanceFlow wins for most people</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'No bank connection needed', desc: 'Mint and most alternatives require linking your bank account. FinanceFlow works with manual entry - keeping your banking credentials completely separate.', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
              { title: 'AI that knows your data', desc: 'No other personal finance tool offers an AI assistant that reads your actual transaction history and answers questions based on your real numbers - not generic advice.', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
              { title: 'Truly global', desc: 'Mint is US-only. YNAB has limited international support. FinanceFlow supports 150+ currencies and works for anyone, anywhere - with GDPR compliance built in.', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                  <Trophy size={20} className={item.color} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Switching is easy */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Switching takes 5 minutes</h2>
            <p className="text-gray-500 dark:text-gray-400">Coming from Mint, YNAB, or a spreadsheet? Here is how easy the move is.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Export your old data', desc: 'Download a CSV from your current app or export your spreadsheet. Most tools support CSV export in under 2 minutes.' },
              { step: '02', title: 'Import into FinanceFlow', desc: 'Use our CSV import to bring in historical transactions. Categories are auto-detected. Review and confirm in one click.' },
              { step: '03', title: 'Set up budgets & goals', desc: 'Recreate your budgets in minutes using our guided setup. Your savings goals and bill reminders are ready the same day.' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]"
              >
                <div className="text-5xl font-black text-gray-100 dark:text-white/5 absolute top-4 right-4 select-none">{s.step}</div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-4">{parseInt(s.step)}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User quotes */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What switchers say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { quote: 'Switched from Mint after it shut down. FinanceFlow has everything Mint had, plus AI insights I never knew I needed. Migration took one afternoon.', name: 'Sarah K.', from: 'Former Mint user' },
              { quote: 'YNAB is great but $180/year is steep when you are just starting. FinanceFlow free plan covers everything I actually use and the Pro upgrade is half the price.', name: 'James T.', from: 'Former YNAB user' },
              { quote: 'I maintained a 400-row Google Sheet for 3 years. FinanceFlow auto-categorises everything and the charts actually update in real time. I wish I switched sooner.', name: 'Meera P.', from: 'Former spreadsheet user' },
              { quote: 'The AI assistant alone made switching worth it. I asked it to analyse my subscriptions and it found two I forgot about - paid for itself in the first week.', name: 'Khalid A.', from: 'Former Mint user' },
            ].map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 2) * 0.1 }}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed mb-4">"{q.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{q.name}</p>
                  <p className="text-xs text-gray-500">{q.from}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Zap size={14} />
            The smarter choice
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Try FinanceFlow AI free</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">No credit card. No bank link required. Switch anytime.</p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105 text-lg"
          >
            Get started free <ArrowRight size={18} className="inline ml-2" />
          </button>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
