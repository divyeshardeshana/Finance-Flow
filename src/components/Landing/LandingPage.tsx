import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Target,
  Bell,
  PieChart,
  Zap,
  CheckCircle2,
  BarChart3,
  Wallet,
  Briefcase,
  LineChart,
  Bot,
  Lightbulb,
  DollarSign,
  Lock,
  Globe,
  Cpu,
  Sparkles,
  ChevronRight,
  Star,
  TrendingDown,
  Activity,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { getSubscriptionTiers, calculateAnnualDiscount, type PricingPlan } from '../../lib/pricingHelpers';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';

interface LandingPageProps {
  onGetStarted: () => void;
  onBlogClick?: () => void;
  onNavigate?: (view: PublicView) => void;
}

function useScrollInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return { ref, isInView };
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function HeroDashboard() {
  const [activeBar, setActiveBar] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveBar(p => (p + 1) % 7), 800);
    return () => clearInterval(t);
  }, []);

  const bars = [65, 82, 48, 91, 73, 58, 86];
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/20">
        <div className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10 px-5 py-3.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-1 rounded bg-gray-200/60 dark:bg-white/10 text-xs text-gray-500 dark:text-gray-400 font-mono">
              app.financeflow.ai — Dashboard
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Net Worth</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$84,230<span className="text-sm font-normal text-gray-500 dark:text-gray-400">.00</span></p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <TrendingUp size={12} />
              +12.4% this year
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-end mb-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Spending Analytics</p>
              <p className="text-xs text-gray-400">Last 7 months</p>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      i === activeBar
                        ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-sm shadow-blue-400/40'
                        : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                  <span className="text-[9px] text-gray-400">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Income', value: '$6,800', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { label: 'Expenses', value: '$3,240', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
              { label: 'Saved', value: '$3,560', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute -left-6 bottom-12 lg:-left-16 bg-white dark:bg-[#1a2235] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm max-w-[160px]"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Bot size={12} className="text-white" />
          </div>
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">AI Insight</span>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
          Dining out 34% above budget. Switch to groceries to save <span className="text-emerald-600 dark:text-emerald-400 font-medium">$180/mo</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -right-6 top-16 lg:-right-16 bg-white dark:bg-[#1a2235] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm max-w-[155px]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">Savings Goal</span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">68%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 mb-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '68%' }}
            transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          />
        </div>
        <p className="text-[10px] text-gray-400">Emergency fund · $6,800 of $10,000</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -right-4 bottom-6 lg:-right-12 bg-white dark:bg-[#1a2235] border border-gray-200/80 dark:border-white/10 rounded-xl p-3 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <TrendingUp size={13} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-800 dark:text-white">+18.2%</p>
            <p className="text-[9px] text-gray-400">Portfolio return</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingPage({ onGetStarted, onBlogClick, onNavigate }: LandingPageProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    getSubscriptionTiers().then(plans => {
      setPricingPlans(plans);
      setLoadingPricing(false);
    });
  }, []);

  const maxDiscount = pricingPlans.length > 0
    ? Math.max(...pricingPlans.map(p => calculateAnnualDiscount(p.monthlyPrice, p.annualPrice)))
    : 0;

  const benefitsSection = useScrollInView();
  const featuresSection = useScrollInView();
  const howItWorksSection = useScrollInView();
  const aiSection = useScrollInView();
  const pricingSection = useScrollInView();
  const securitySection = useScrollInView();

  const features = [
    { icon: TrendingUp, title: 'Smart Financial Insights', description: 'AI-powered analysis of your spending patterns and personalized recommendations to save more every month', gradient: 'from-blue-500 to-cyan-400' },
    { icon: Target, title: 'Goal Tracking', description: 'Set savings targets with milestone checkpoints — visualize exactly how close you are to your next big goal', gradient: 'from-emerald-500 to-teal-400' },
    { icon: Bell, title: 'Bill Reminders', description: 'Never pay a late fee again. Smart reminders alert you before every due date across all your bills', gradient: 'from-rose-500 to-pink-400' },
    { icon: PieChart, title: 'Budget Manager', description: 'Build category-based budgets that adapt to your life. Get alerted the moment you approach your limit', gradient: 'from-sky-500 to-blue-400' },
    { icon: BarChart3, title: 'Expense Predictions', description: 'Our AI forecasts upcoming costs from your history so you can prepare — not react — to large expenses', gradient: 'from-amber-500 to-orange-400' },
    { icon: Wallet, title: 'Net Worth Tracking', description: 'See every asset and liability in one dashboard. Watch your net worth climb month over month', gradient: 'from-teal-500 to-emerald-400' },
    { icon: TrendingDown, title: 'Investment Portfolio', description: 'Track all investments in one place with real-time performance analytics and allocation breakdowns', gradient: 'from-cyan-500 to-sky-400' },
    { icon: Briefcase, title: 'Retirement Planning', description: 'Model your retirement with contribution calculators and gap analysis so you retire on your own terms', gradient: 'from-rose-500 to-red-400' },
    { icon: LineChart, title: 'Stock Predictions', description: 'AI-powered market analysis with risk-adjusted recommendations matched to your investment profile', gradient: 'from-violet-500 to-blue-400' },
    { icon: Bot, title: 'Financial Assistant', description: '24/7 AI answers your money questions and gives contextual guidance based on your actual data', gradient: 'from-emerald-500 to-cyan-400' },
    { icon: Lightbulb, title: 'AI Recommendations', description: 'Personalised suggestions for cutting waste, reducing debt, and growing wealth — uniquely yours', gradient: 'from-amber-500 to-yellow-400' },
    { icon: Globe, title: '150+ Currencies', description: 'Whether you earn in USD, EUR, AED, or GBP — every transaction is tracked and converted automatically', gradient: 'from-blue-500 to-sky-400' },
  ];

  const benefits = [
    { icon: DollarSign, stat: '$4,800', label: 'Saved per year on average', detail: 'Users who actively budget save $400 more every month vs. those who track nothing.', gradient: 'from-emerald-500 to-teal-400' },
    { icon: TrendingDown, stat: '27%', label: 'Reduction in unnecessary spending', detail: 'Categorised spending in real time makes people cut impulse purchases within 60 days.', gradient: 'from-blue-500 to-cyan-400' },
    { icon: Bell, stat: '$130', label: 'Avoided in late fees annually', detail: 'The average person pays $130+ in avoidable late fees. Bill reminders eliminate that.', gradient: 'from-amber-500 to-orange-400' },
    { icon: Target, stat: '3× faster', label: 'Progress toward financial goals', detail: 'People tracking milestones reach goals three times faster than those relying on memory.', gradient: 'from-rose-500 to-pink-400' },
    { icon: TrendingUp, stat: '18%', label: 'Higher investment returns', detail: 'Investors with a documented plan consistently outperform reactive investors over 5 years.', gradient: 'from-cyan-500 to-blue-400' },
    { icon: Globe, stat: '150+', label: 'Currencies supported worldwide', detail: 'Multi-currency support for individuals and businesses operating globally.', gradient: 'from-teal-500 to-emerald-400' },
  ];

  const steps = [
    { icon: RefreshCw, step: '01', title: 'Connect Your Accounts', desc: 'Securely link your bank accounts, cards, and investments in minutes.' },
    { icon: Cpu, step: '02', title: 'AI Analyzes Your Finances', desc: 'Our engine maps every transaction, identifies patterns, and builds your financial picture.' },
    { icon: Eye, step: '03', title: 'Receive Insights & Predictions', desc: 'Get personalized recommendations, upcoming expense alerts, and growth forecasts.' },
    { icon: Star, step: '04', title: 'Achieve Your Goals', desc: 'Follow your custom roadmap to hit milestones faster with less stress.' },
  ];

  const getDisplayPrice = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return '$0';
    return isAnnual ? `$${(plan.annualPrice / 12).toFixed(0)}` : `$${plan.monthlyPrice}`;
  };

  const getDisplayPeriod = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 'forever';
    return isAnnual ? '/mo, billed yearly' : '/month';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] overflow-x-hidden">
      <SEOHead pageKey="home" />
      <PublicNavbar
        currentView="home"
        onNavigate={view => {
          if (view === 'blog' && onBlogClick) { onBlogClick(); return; }
          if (onNavigate) onNavigate(view);
        }}
        onSignIn={onGetStarted}
      />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
          <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-7"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                AI-Powered Financial Intelligence
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-6"
              >
                Stop Guessing
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
                  Where Your
                </span>
                <br />
                Money Goes
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-gray-600 dark:text-gray-400 mb-9 max-w-lg leading-relaxed"
              >
                AI-powered financial intelligence for individuals, families, and businesses. Track, predict, and grow your wealth — in any currency, anywhere.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 text-base"
                >
                  Start Free Today
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('features')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-gray-700 dark:text-gray-200 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 text-base"
                >
                  See How It Works
                  <ChevronRight size={18} />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-500"
              >
                {['No credit card required', 'Free plan forever', '150+ currencies'].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative hidden lg:block"
            >
              <HeroDashboard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────── */}
      <section className="py-8 border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-6">
            Trusted worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { icon: Lock, label: 'Bank-Level Security' },
              { icon: Shield, label: '256-bit Encryption' },
              { icon: Cpu, label: 'AI Powered' },
              { icon: Globe, label: '150+ Countries' },
              { icon: CheckCircle2, label: 'GDPR Compliant' },
              { icon: Star, label: '4.9/5 Rating' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                <Icon size={16} className="text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────────── */}
      <section ref={benefitsSection.ref} className="py-24 px-4 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={benefitsSection.isInView ? 'visible' : 'hidden'}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Real Outcomes</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
              What actually changes when you
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400"> use FinanceFlow AI</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Measurable, research-backed outcomes — not just feature lists.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={benefitsSection.isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group relative bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-7 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${b.gradient} mb-5 shadow-md`}>
                  <b.icon size={20} className="text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{b.stat}</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{b.label}</div>
                <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">{b.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────── */}
      <section ref={featuresSection.ref} className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={featuresSection.isInView ? 'visible' : 'hidden'}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Full Platform</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
              Everything you need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400"> succeed financially</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              One platform. Every tool. For every stage of your financial life.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={featuresSection.isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.5}
                className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default"
              >
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${f.gradient} mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                  <f.icon size={18} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section ref={howItWorksSection.ref} className="py-24 px-4 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={howItWorksSection.isInView ? 'visible' : 'hidden'}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
              Up and running
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400"> in minutes</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">From signup to financial clarity in four steps.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-500/30 to-transparent" />

            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                animate={howItWorksSection.isInView ? 'visible' : 'hidden'}
                custom={i}
                className="relative text-center"
              >
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <s.icon size={28} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{i + 1}</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ────────────────────────────────────────────────── */}
      <section ref={aiSection.ref} className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={aiSection.isInView ? 'visible' : 'hidden'}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">AI Engine</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                Your Personal
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">AI CFO</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                The same financial intelligence available to Fortune 500 companies — now in your pocket. Our AI works 24/7, learning your patterns and proactively steering your financial future.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Activity, title: 'Predictive Analytics', desc: 'Forecast your next 90 days of spending before it happens.' },
                  { icon: Eye, title: 'Anomaly Detection', desc: 'Catch unusual spending the moment it occurs, not months later.' },
                  { icon: Sparkles, title: 'Automated Insights', desc: 'Daily AI-generated summaries of what changed in your finances.' },
                  { icon: Lightbulb, title: 'Personalized Recommendations', desc: 'Suggestions built on your unique income, habits, and goals.' },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    custom={i + 1}
                    initial="hidden"
                    animate={aiSection.isInView ? 'visible' : 'hidden'}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={aiSection.isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative flex items-center justify-center"
            >
              <div className="relative w-72 h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 rounded-full border border-blue-200/60 dark:border-blue-500/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-blue-200/40 dark:border-blue-400/15 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-8 rounded-full border border-cyan-200/40 dark:border-cyan-400/15 animate-[spin_10s_linear_infinite]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                    <Bot size={40} className="text-white" />
                  </div>
                </div>

                {[
                  { label: 'Spend Alert', val: '-12%', color: 'text-emerald-600 dark:text-emerald-400', pos: 'top-4 right-4' },
                  { label: 'Goal Progress', val: '68%', color: 'text-blue-600 dark:text-blue-400', pos: 'bottom-8 left-0' },
                  { label: 'AI Score', val: '9.2/10', color: 'text-amber-600 dark:text-amber-400', pos: 'top-12 -left-4' },
                  { label: 'Net Worth', val: '+$842', color: 'text-cyan-600 dark:text-cyan-400', pos: 'bottom-4 right-0' },
                ].map(({ label, val, color, pos }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={aiSection.isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className={`absolute ${pos} bg-white dark:bg-[#1a2235] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg`}
                  >
                    <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{val}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <section ref={pricingSection.ref} className="py-24 px-4 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={pricingSection.isInView ? 'visible' : 'hidden'}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
              A plan for every
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400"> stage of life</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              Start free. Unlock more as you grow. Cancel any time.
            </p>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!isAnnual ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isAnnual ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Annual
                {maxDiscount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    -{maxDiscount}%
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {loadingPricing ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={pricingSection.isInView ? 'visible' : 'hidden'}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start"
            >
              {pricingPlans.map((plan, i) => {
                const savingsPercent = calculateAnnualDiscount(plan.monthlyPrice, plan.annualPrice);
                const showSavings = isAnnual && plan.monthlyPrice > 0 && savingsPercent > 0;

                return (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    custom={i}
                    className={`relative rounded-2xl p-7 transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white shadow-2xl shadow-blue-500/30 ring-1 ring-blue-400/50 scale-[1.03]'
                        : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-lg'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-amber-400 text-amber-900 shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}
                    {showSavings && (
                      <div className="absolute -top-3.5 right-5">
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${plan.highlighted ? 'bg-white text-blue-700' : 'bg-emerald-500 text-white'}`}>
                          Save {savingsPercent}%
                        </span>
                      </div>
                    )}

                    <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.displayName}
                    </h3>
                    <p className={`text-sm mb-5 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500 dark:text-gray-500'}`}>
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className={`text-5xl font-bold tracking-tight ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {getDisplayPrice(plan)}
                      </span>
                      <span className={`ml-2 text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-500 dark:text-gray-500'}`}>
                        {getDisplayPeriod(plan)}
                      </span>
                    </div>

                    <button
                      onClick={onGetStarted}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 mb-7 ${
                        plan.highlighted
                          ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                      }`}
                    >
                      {plan.ctaText || 'Get Started'}
                    </button>

                    <ul className="space-y-3">
                      {plan.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <CheckCircle2
                            size={16}
                            className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-emerald-500'}`}
                          />
                          <span className={`text-sm ${plan.highlighted ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────────────────── */}
      <section ref={securitySection.ref} className="py-24 px-4 bg-gray-900 dark:bg-[#080C14]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={securitySection.isInView ? 'visible' : 'hidden'}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-4">Security First</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Your financial data
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">stays yours — always</span>
              </h2>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                We never sell your financial data. Bank-grade security protects every transaction, goal, and plan you store inside FinanceFlow AI.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  '256-bit AES encryption',
                  'Multi-factor authentication',
                  'GDPR compliant',
                  'ISO 27001 certified',
                  'Regular security audits',
                  'Zero data selling — ever',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-gray-300">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={securitySection.isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4"
            >
              {[
                { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted in transit and at rest using AES-256 and TLS 1.3.' },
                { icon: Shield, title: 'Bank-Level Security', desc: 'The same security infrastructure used by major financial institutions.' },
                { icon: Eye, title: 'Privacy-First Architecture', desc: 'Your data is never shared with third parties or used for advertising.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate={securitySection.isInView ? 'visible' : 'hidden'}
                  custom={i}
                  className="flex items-start gap-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200 mb-5">Get Started Today</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              The best time to take control
              <br />
              of your money was yesterday.
              <br />
              <span className="text-cyan-200">The second best time is now.</span>
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join people from over 50 countries who are saving more, stressing less, and building real financial security with FinanceFlow AI.
            </p>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2.5 px-10 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:-translate-y-0.5"
            >
              Start Free Today
              <ArrowRight size={20} />
            </button>
            <p className="mt-5 text-blue-200 text-sm">No credit card required · Set up in under 2 minutes · Cancel any time</p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 dark:bg-[#060810] text-gray-500 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <button onClick={() => onNavigate && onNavigate('home')} className="flex items-center gap-2.5 mb-4 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Flow AI</span>
                </span>
              </button>
              <p className="text-sm leading-relaxed mb-6 max-w-xs">
                Intelligent financial management for individuals, families, freelancers, and businesses — anywhere in the world.
              </p>
              <div className="flex items-center gap-3">
                {[Globe, Shield, Lock].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Product',
                links: [
                  { label: 'Features', action: () => onNavigate && onNavigate('features') },
                  { label: 'Pricing', action: () => onNavigate && onNavigate('pricing') },
                  { label: 'Blog', action: onBlogClick },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About Us', action: () => onNavigate && onNavigate('about') },
                  { label: 'Contact', action: () => onNavigate && onNavigate('contact') },
                ],
              },
              {
                title: 'Support',
                links: [
                  { label: 'Help Center', action: () => onNavigate && onNavigate('helpcenter' as PublicView) },
                  { label: 'Privacy Policy', action: () => onNavigate && onNavigate('privacy') },
                  { label: 'Security', action: () => onNavigate && onNavigate('privacy') },
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white text-sm font-semibold mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map(({ label, action }) => (
                    <li key={label}>
                      <button onClick={action} className="text-sm hover:text-white transition-colors">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} FinanceFlow AI. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs">
              <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => onNavigate && onNavigate('contact')} className="hover:text-white transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
