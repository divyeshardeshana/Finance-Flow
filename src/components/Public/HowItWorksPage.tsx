import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  UserPlus, LayoutDashboard, TrendingUp, Brain,
  CheckCircle2, ArrowRight, Play, Zap,
  PieChart, Target, Bell, BarChart3, Shield, Sparkles,
} from 'lucide-react';
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

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

const STEPS = [
  {
    number: '01',
    icon: UserPlus,
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/30',
    title: 'Create your free account',
    subtitle: 'Takes 60 seconds - no credit card needed',
    description:
      'Sign up with your email. Set your monthly income, preferred currency, and timezone. FinanceFlow works with 150+ currencies and is available worldwide.',
    details: [
      'Email signup - no Google required',
      'Set income & currency in onboarding',
      'Free plan includes core features forever',
      'Upgrade anytime for AI & investments',
    ],
  },
  {
    number: '02',
    icon: LayoutDashboard,
    gradient: 'from-violet-500 to-purple-400',
    shadow: 'shadow-violet-500/30',
    title: 'Add your transactions & budgets',
    subtitle: 'Manual entry or bulk import via CSV',
    description:
      'Log income and expenses in seconds. Create budgets for each spending category - food, rent, transport, entertainment. FinanceFlow tracks in real time and alerts you before you overspend.',
    details: [
      'Add transactions in under 5 seconds',
      'Categorise automatically or manually',
      'Set monthly budgets per category',
      'Import historical data via CSV',
    ],
  },
  {
    number: '03',
    icon: Target,
    gradient: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/30',
    title: 'Set goals & track your net worth',
    subtitle: 'Savings goals, investments, and net worth in one view',
    description:
      'Create savings goals with target dates. Track investments, assets, and liabilities to see your net worth grow over time. Bill reminders ensure you never miss a payment.',
    details: [
      'Savings goals with progress tracker',
      'Net worth = assets minus liabilities',
      'Investment portfolio tracking (Pro)',
      'Bill reminders with advance notice',
    ],
  },
  {
    number: '04',
    icon: Brain,
    gradient: 'from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/30',
    title: 'Get AI-powered financial insights',
    subtitle: 'Ask anything about your money in plain language',
    description:
      'The AI Financial Assistant analyses your real data and answers questions like "Can I afford a holiday?", "What is my savings rate?", or "Where am I overspending?" Get personalised advice, not generic tips.',
    details: [
      'AI trained on your actual transactions',
      'Ask questions in plain English',
      'Monthly financial health reports',
      'Spending pattern anomaly detection',
    ],
  },
];

const FEATURES = [
  { icon: PieChart, text: 'Expense tracking' },
  { icon: Target, text: 'Savings goals' },
  { icon: Bell, text: 'Bill reminders' },
  { icon: BarChart3, text: 'Financial reports' },
  { icon: Shield, text: 'Bank-grade security' },
  { icon: Brain, text: 'AI assistant' },
  { icon: TrendingUp, text: 'Investment tracking' },
  { icon: Sparkles, text: 'Net worth tracker' },
];

export default function HowItWorksPage({ onNavigate, onSignIn }: Props) {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white">
      <SEOHead
        title="How It Works - FinanceFlow AI | 4 Simple Steps to Financial Clarity"
        description="Learn how FinanceFlow AI works in 4 steps: create an account, track transactions, set goals, and get AI-powered financial insights. Setup takes under 60 seconds."
        keywords="how FinanceFlow works, personal finance app setup, budgeting app guide, AI financial assistant how to use"
        canonical="https://financeflow.ai/how-it-works"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'How It Works', url: 'https://financeflow.ai/how-it-works' },
        ]}
      />
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} currentView="how-it-works" />

      {/* Hero */}
      <section ref={heroRef} className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Play size={14} />
            How FinanceFlow AI works
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            From signup to financial clarity
            <span className="block bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">in 4 simple steps</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            No complex setup. No bank connections required. Just add your income and expenses and let FinanceFlow AI turn your numbers into actionable insights.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
            <button
              onClick={onSignIn}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
            >
              Get started free <ArrowRight size={16} className="inline ml-1" />
            </button>
            <button
              onClick={() => onNavigate('features')}
              className="px-6 py-3 border border-gray-300 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              View all features
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-20">
          {STEPS.map((step, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true, margin: '-80px' });
            const Icon = step.icon;
            const isEven = i % 2 === 0;

            return (
              <motion.div
                key={step.number}
                ref={ref}
                variants={stagger}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 lg:gap-16 items-center`}
              >
                {/* Visual card */}
                <motion.div variants={fadeUp} custom={0} className="flex-1 w-full">
                  <div className={`relative rounded-3xl p-8 bg-gradient-to-br ${step.gradient} shadow-2xl ${step.shadow}`}>
                    <div className="absolute top-4 right-4 text-6xl font-black text-white/10 select-none">{step.number}</div>
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg">
                      <Icon size={32} className="text-white" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {step.details.map((d, j) => (
                        <div key={j} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                          <CheckCircle2 size={16} className="text-white/80 flex-shrink-0" />
                          <span className="text-white text-sm font-medium">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Text */}
                <div className="flex-1">
                  <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold mb-4">
                    Step {step.number}
                  </motion.div>
                  <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold mb-2">{step.title}</motion.h2>
                  <motion.p variants={fadeUp} custom={2} className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">{step.subtitle}</motion.p>
                  <motion.p variants={fadeUp} custom={3} className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</motion.p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Everything included */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Everything you need, nothing you don't</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10">All core features available on the free plan.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const FIcon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/[0.06]"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <FIcon size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{f.text}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
            <Zap size={14} />
            Ready in 60 seconds
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start your financial journey today</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Free plan. No credit card. No bank connections required.</p>
          <button
            onClick={onSignIn}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105 text-lg"
          >
            Create free account <ArrowRight size={18} className="inline ml-2" />
          </button>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
