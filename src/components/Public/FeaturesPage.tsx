import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import {
  TrendingUp, Target, Bell, PieChart, BarChart3, Wallet,
  Briefcase, LineChart, Bot, Lightbulb, TrendingDown, ArrowRight,
  Zap, Shield, CheckCircle2, RefreshCw, FileText, CreditCard, Globe,
  DollarSign, Clock, AlertTriangle, ChevronRight, XCircle, GraduationCap,
  Users, Star, Sparkles, SplitSquareHorizontal, BookOpen,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import { supabase } from '../../lib/supabase';
import { useSubscriptionPlans } from '../../hooks/useSubscriptionPlans';
import { calculateAnnualDiscount } from '../../lib/pricingHelpers';

interface FeaturesPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
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

type PlanTier = 'free' | 'pro' | 'premium';

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  benefit: string;
  plan: PlanTier;
  featureKey?: string;
}

const planBadgeStyle: Record<PlanTier, string> = {
  free: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25',
  pro: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/25',
  premium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25',
};

const TIER_ORDER: Record<string, number> = { free: 1, paid: 2, premium: 3 };

const featureGroups: {
  category: string;
  label: string;
  description: string;
  bgClass: string;
  features: FeatureItem[];
}[] = [
  {
    category: 'Track & Manage',
    label: 'Full Visibility',
    description: 'Know exactly where every dollar goes - from your first transaction to your complete financial picture.',
    bgClass: 'bg-white dark:bg-[#0B0F1A]',
    features: [
      {
        icon: FileText,
        title: 'Transaction Tracking',
        description: 'Log, categorise, and search every transaction. Upload PDF bank statements and let FinanceFlow parse them automatically in seconds.',
        gradient: 'from-slate-500 to-gray-500',
        benefit: 'Instant clarity on every transaction',
        plan: 'free',
        featureKey: 'basic_transactions',
      },
      {
        icon: PieChart,
        title: 'Budget Management',
        description: 'Build category budgets, get alerted before you overspend, and finally stop the end-of-month shock at your bank balance.',
        gradient: 'from-blue-500 to-cyan-400',
        benefit: 'Prevent overspending before it happens',
        plan: 'free',
        featureKey: 'basic_budget',
      },
      {
        icon: RefreshCw,
        title: 'Recurring Transactions',
        description: 'Subscriptions, rent, salaries - automatically tracked so you are never blindsided by a charge you forgot about.',
        gradient: 'from-emerald-500 to-teal-400',
        benefit: 'No more forgotten subscription charges',
        plan: 'free',
        featureKey: 'recurring_transactions',
      },
      {
        icon: Wallet,
        title: 'Net Worth Tracker',
        description: 'Every asset and liability in one real-time dashboard. Watch your net worth grow month over month and stay motivated by visible progress.',
        gradient: 'from-teal-500 to-emerald-400',
        benefit: 'See your full financial picture instantly',
        plan: 'premium',
        featureKey: 'net_worth_tracker',
      },
    ],
  },
  {
    category: 'Plan & Grow',
    label: 'Goal Achievement',
    description: 'Turn financial goals into structured, milestone-driven plans that you actually follow through on.',
    bgClass: 'bg-gray-50/70 dark:bg-[#0D1220]',
    features: [
      {
        icon: Target,
        title: 'Goal Tracking',
        description: 'Set savings targets with milestone checkpoints. Research shows goal-trackers reach their targets 3× faster than those relying on willpower alone.',
        gradient: 'from-emerald-500 to-teal-400',
        benefit: 'Reach goals 3× faster with milestones',
        plan: 'free',
        featureKey: 'savings_goals',
      },
      {
        icon: Briefcase,
        title: 'Retirement Planning',
        description: 'Model exactly how much you need to retire comfortably. See projected shortfalls early and fix them - while you still have time.',
        gradient: 'from-rose-500 to-pink-400',
        benefit: 'Retire on your terms, not by accident',
        plan: 'premium',
        featureKey: 'retirement_planning',
      },
      {
        icon: LineChart,
        title: 'Investment Portfolio',
        description: 'Consolidate every investment account in one view. Track performance, rebalancing needs, and allocation across all asset classes.',
        gradient: 'from-cyan-500 to-sky-400',
        benefit: 'Stop guessing if your portfolio is on track',
        plan: 'premium',
        featureKey: 'investment_portfolio',
      },
      {
        icon: Globe,
        title: 'Estate Planning',
        description: 'Document assets, assign beneficiaries, and record your estate wishes. Protect your family from uncertainty with an organised digital record.',
        gradient: 'from-amber-500 to-orange-400',
        benefit: "Protect your family's financial future",
        plan: 'premium',
        featureKey: 'estate_planning',
      },
    ],
  },
  {
    category: 'AI & Insights',
    label: 'Intelligent Analysis',
    description: 'Let AI analyse your finances and guide every decision - from daily spending to long-term wealth.',
    bgClass: 'bg-white dark:bg-[#0B0F1A]',
    features: [
      {
        icon: TrendingUp,
        title: 'Smart Financial Insights',
        description: "AI analyses every transaction and surfaces what matters: where you're overspending, where you're under-saving, and exactly what to do about it.",
        gradient: 'from-blue-500 to-cyan-400',
        benefit: 'Discover hidden savings automatically',
        plan: 'pro',
        featureKey: 'advanced_reports',
      },
      {
        icon: BarChart3,
        title: 'Expense Predictions',
        description: 'Machine learning forecasts upcoming large expenses from your history - so you prepare cash in advance instead of scrambling at the last minute.',
        gradient: 'from-amber-500 to-orange-400',
        benefit: 'Never be caught off guard by big bills',
        plan: 'pro',
        featureKey: 'expense_predictions',
      },
      {
        icon: Bot,
        title: 'Financial Assistant',
        description: '24/7 conversational AI that answers your money questions with context from your actual accounts - not generic advice you could find anywhere.',
        gradient: 'from-emerald-500 to-cyan-400',
        benefit: 'A personal finance advisor, always available',
        plan: 'pro',
        featureKey: 'financial_assistant',
      },
      {
        icon: Lightbulb,
        title: 'AI Recommendations',
        description: 'Personalised suggestions for debt reduction, savings opportunities, and investment moves - built from your unique spending profile, not a template.',
        gradient: 'from-orange-500 to-amber-400',
        benefit: 'Advice that actually fits your life',
        plan: 'pro',
        featureKey: 'recommendations',
      },
    ],
  },
  {
    category: 'Stay in Control',
    label: 'Proactive Protection',
    description: 'Proactive tools that keep your finances protected and your future on track.',
    bgClass: 'bg-gray-50/70 dark:bg-[#0D1220]',
    features: [
      {
        icon: Bell,
        title: 'Bill Reminders',
        description: 'Smart reminders before every due date mean you never pay another late fee. The average person saves $130+ a year just from eliminating these charges.',
        gradient: 'from-rose-500 to-red-400',
        benefit: 'Save $130+ a year in avoidable late fees',
        plan: 'free',
        featureKey: 'bill_reminders',
      },
      {
        icon: TrendingDown,
        title: 'Stock Predictions',
        description: 'AI-powered market analysis and risk-adjusted recommendations matched to your personal investment profile and risk tolerance.',
        gradient: 'from-sky-500 to-blue-400',
        benefit: 'Invest with data, not gut feelings',
        plan: 'premium',
        featureKey: 'stock_predictions',
      },
      {
        icon: SplitSquareHorizontal,
        title: 'Split Transactions',
        description: 'Easily split shared expenses between friends, family, or roommates and track who owes what - no more awkward money conversations.',
        gradient: 'from-sky-500 to-blue-500',
        benefit: 'Split bills without the awkwardness',
        plan: 'pro',
        featureKey: 'split_transactions',
      },
      {
        icon: CreditCard,
        title: 'Multi-Currency Support',
        description: 'Track, convert, and report in 150+ global currencies automatically. Perfect for expats, international freelancers, and global businesses.',
        gradient: 'from-teal-500 to-cyan-400',
        benefit: 'Works wherever you earn or spend',
        plan: 'free',
        featureKey: 'multi_currency',
      },
    ],
  },
  {
    category: 'Learn & Earn',
    label: 'Financial Education',
    description: 'Build the financial knowledge and habits that compound over a lifetime.',
    bgClass: 'bg-white dark:bg-[#0B0F1A]',
    features: [
      {
        icon: GraduationCap,
        title: 'Financial Literacy Challenges',
        description: 'Gamified quizzes and daily challenges that teach real financial skills - compound interest, investing basics, tax planning, and more.',
        gradient: 'from-emerald-500 to-teal-400',
        benefit: 'Learn while you earn points',
        plan: 'free',
        featureKey: 'literacy_gamification',
      },
      {
        icon: BookOpen,
        title: 'Knowledge Base & Help Center',
        description: 'Comprehensive guides, FAQs, and articles covering budgeting, investing, retirement, and estate planning - written by financial experts.',
        gradient: 'from-blue-500 to-cyan-400',
        benefit: 'Expert guidance at your fingertips',
        plan: 'free',
        featureKey: 'knowledge_base',
      },
      {
        icon: Shield,
        title: 'Bank-Level Security',
        description: '256-bit AES encryption, multi-factor authentication, and third-party security audits. Your financial data is as protected as it is at your bank.',
        gradient: 'from-slate-600 to-slate-500',
        benefit: 'Complete peace of mind for your data',
        plan: 'free',
        featureKey: 'security',
      },
    ],
  },
];

const withoutVsWith = [
  {
    without: 'Surprised by overspending at month-end',
    with: 'Real-time budget alerts stop you before you overspend',
    icon: AlertTriangle,
  },
  {
    without: 'Paying $130+ per year in avoidable late fees',
    with: 'Bill reminders eliminate late fees completely',
    icon: DollarSign,
  },
  {
    without: 'Goals you set and forget',
    with: 'Milestone tracking keeps goals on schedule',
    icon: Target,
  },
  {
    without: 'Spreadsheets that take hours to update',
    with: 'Everything updates automatically in real time',
    icon: Clock,
  },
  {
    without: "Generic advice that doesn't fit your situation",
    with: 'AI recommendations built from your actual data',
    icon: Bot,
  },
  {
    without: 'No idea what retirement will actually cost',
    with: 'Retirement gap analysis shows you the exact number',
    icon: Briefcase,
  },
  {
    without: 'Investments scattered across apps and notebooks',
    with: 'Portfolio + net worth in one unified dashboard',
    icon: LineChart,
  },
  {
    without: 'Forgetting to split bills or track shared expenses',
    with: 'Split transactions tracked and resolved automatically',
    icon: Users,
  },
];

const planComparisonRows = [
  { feature: 'Transaction Tracking & Categorisation', free: true, pro: true, premium: true },
  { feature: 'Basic Budget Management', free: true, pro: true, premium: true },
  { feature: 'Recurring Transactions', free: true, pro: true, premium: true },
  { feature: 'Bill Reminders', free: true, pro: true, premium: true },
  { feature: 'Basic Reports', free: true, pro: true, premium: true },
  { feature: 'Financial Literacy Challenges', free: true, pro: true, premium: true },
  { feature: 'Multi-Currency Support', free: true, pro: true, premium: true },
  { feature: 'Savings Goals (up to 3)', free: true, pro: false, premium: false },
  { feature: 'AI Financial Insights', free: false, pro: true, premium: true },
  { feature: 'Expense Predictions', free: false, pro: true, premium: true },
  { feature: 'Financial Assistant (AI Chat)', free: false, pro: true, premium: true },
  { feature: 'AI Recommendations', free: false, pro: true, premium: true },
  { feature: 'Split Transactions', free: false, pro: true, premium: true },
  { feature: 'Advanced Goals (unlimited)', free: false, pro: true, premium: true },
  { feature: 'Advanced Reports & Analytics', free: false, pro: true, premium: true },
  { feature: 'Priority Support', free: false, pro: true, premium: true },
  { feature: 'Net Worth Tracker', free: false, pro: false, premium: true },
  { feature: 'Investment Portfolio', free: false, pro: false, premium: true },
  { feature: 'Retirement Planning', free: false, pro: false, premium: true },
  { feature: 'Estate Planning', free: false, pro: false, premium: true },
  { feature: 'Stock Predictions (AI)', free: false, pro: false, premium: true },
];

function CheckMark({ checked }: { checked: boolean }) {
  if (checked) {
    return <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />;
  }
  return <div className="w-4 h-0.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto" />;
}

export default function FeaturesPage({ onNavigate, onSignIn }: FeaturesPageProps) {
  const [featureImages, setFeatureImages] = useState<Record<string, string>>({});
  const [featureTierMap, setFeatureTierMap] = useState<Record<string, { tierName: string; displayName: string }>>({});
  const [isAnnual, setIsAnnual] = useState(false);

  const { plans } = useSubscriptionPlans({ activeOnly: true });

  // Map tier_name → display_name from loaded plans
  const planDisplayNames: Record<string, string> = {};
  plans.forEach(p => { planDisplayNames[p.name] = p.displayName; });

  // Map tier_name → monthly price for comparison table header
  const planPrices: Record<string, number> = {};
  plans.forEach(p => { planPrices[p.name] = p.monthlyPrice; });

  // Resolve badge label: use DB display name if available, fallback to defaults
  const getBadgeLabel = (feature: FeatureItem): string => {
    // featureKey → tier lookup from feature_tier_config
    if (feature.featureKey && featureTierMap[feature.featureKey]) {
      return featureTierMap[feature.featureKey].displayName;
    }
    // Fall back to plan display names from subscription_tiers
    const tierName = feature.plan === 'pro' ? 'paid' : feature.plan;
    if (planDisplayNames[tierName]) return planDisplayNames[tierName];
    // Hard fallback
    return { free: 'Free', pro: 'Pro', premium: 'Premium' }[feature.plan];
  };

  useEffect(() => {
    // Load feature images
    supabase
      .from('app_features')
      .select('feature_name, image_url')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(f => { if (f.image_url) map[f.feature_name] = f.image_url; });
          setFeatureImages(map);
        }
      });

    // Load feature → tier mapping (lowest tier wins)
    supabase
      .from('feature_tier_config')
      .select('feature_name, is_enabled, subscription_tiers(tier_name, display_name)')
      .eq('is_enabled', true)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { tierName: string; displayName: string }> = {};
        (data as any[]).forEach(item => {
          const tier = item.subscription_tiers;
          if (!tier) return;
          const existing = map[item.feature_name];
          const newOrder = TIER_ORDER[tier.tier_name] ?? 99;
          const existOrder = existing ? TIER_ORDER[existing.tierName] ?? 99 : 99;
          if (!existing || newOrder < existOrder) {
            map[item.feature_name] = { tierName: tier.tier_name, displayName: tier.display_name };
          }
        });
        setFeatureTierMap(map);
      });
  }, []);

  const comparisonSection = useScrollInView();
  const groupSections = [
    useScrollInView(),
    useScrollInView(),
    useScrollInView(),
    useScrollInView(),
    useScrollInView(),
  ];
  const planTableSection = useScrollInView();
  const pricingCardsSection = useScrollInView();
  const ctaSection = useScrollInView();

  // Comparison table column config built dynamically
  const tableColumns = plans.length > 0
    ? plans.map(p => {
        const colorMap: Record<string, { color: string; bg: string }> = {
          free: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          paid: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          premium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        };
        const style = colorMap[p.name] ?? colorMap['paid'];
        const price = p.monthlyPrice === 0 ? '$0' : `$${p.monthlyPrice}/mo`;
        return { label: p.displayName, price, color: style.color, bg: style.bg, tierName: p.name };
      })
    : [
        { label: 'Free', price: '$0', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', tierName: 'free' },
        { label: 'Pro', price: '$9/mo', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', tierName: 'paid' },
        { label: 'Premium', price: '$19/mo', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', tierName: 'premium' },
      ];

  // CTA button colors per tier for comparison table
  const ctaBtnClass: Record<string, string> = {
    free: 'bg-emerald-600 hover:bg-emerald-500',
    paid: 'bg-blue-600 hover:bg-blue-500',
    premium: 'bg-amber-500 hover:bg-amber-400',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] overflow-x-hidden">
      <SEOHead
        pageKey="features"
        title="Features - FinanceFlow AI | AI Budgeting, Investments & More"
        description="Explore all FinanceFlow AI features: AI financial assistant, budget tracking, expense categorisation, investment tracking, savings goals, bill reminders, net worth tracker, and retirement planning."
        keywords="personal finance features, AI budgeting app, expense tracker, investment tracker, savings goals app, bill reminders, net worth calculator, retirement planner"
        canonical="https://financeflow.ai/features"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Features', url: 'https://financeflow.ai/features' },
        ]}
        howToSchema={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to manage your personal finances with FinanceFlow AI',
          description: 'A step-by-step guide to setting up budgets, tracking expenses, and reaching financial goals using FinanceFlow AI.',
          totalTime: 'PT5M',
          step: [
            { '@type': 'HowToStep', position: 1, name: 'Create a free account', text: 'Sign up with your email - no credit card required. Takes under 60 seconds.' },
            { '@type': 'HowToStep', position: 2, name: 'Set your income and currency', text: 'Enter your monthly income and select your preferred currency from 150+ options.' },
            { '@type': 'HowToStep', position: 3, name: 'Add transactions', text: 'Log your income and expenses manually or import via CSV. Categorise automatically or by hand.' },
            { '@type': 'HowToStep', position: 4, name: 'Create budgets', text: 'Set monthly spending limits per category - food, transport, entertainment, and more.' },
            { '@type': 'HowToStep', position: 5, name: 'Set savings goals', text: 'Add a target amount and date. FinanceFlow calculates how much you need to save each month.' },
            { '@type': 'HowToStep', position: 6, name: 'Ask the AI assistant', text: 'On Pro or Premium, ask the AI questions about your finances and get personalised answers based on your data.' },
          ],
        }}
      />
      <PublicNavbar currentView="features" onNavigate={onNavigate} onSignIn={onSignIn} />

      {/* HERO */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
          <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-7"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            {plans.length > 0 ? `${plans.length} Plans. 20+ Features. One Platform.` : '3 Plans. 20+ Features. One Platform.'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6"
          >
            Stop managing money{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              with guesswork
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto mb-10"
          >
            FinanceFlow replaces spreadsheets, sticky notes, and financial stress with an intelligent AI platform that tracks, predicts, and improves your finances automatically.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onSignIn}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 text-base"
            >
              Start for free - no card needed
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-gray-700 dark:text-gray-200 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 text-base"
            >
              Compare plans
              <ChevronRight size={18} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-500"
          >
            {['No credit card required', 'Free plan forever', '150+ currencies supported'].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COMPARISON WITHOUT / WITH */}
      <section className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <motion.div
          ref={comparisonSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={comparisonSection.isInView ? 'visible' : 'hidden'}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                The Difference
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Life without FinanceFlow vs. life with it
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The difference between financial stress and financial confidence
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              variants={fadeUp}
              custom={1}
              className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-5 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                  <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                </div>
                <span className="font-bold text-rose-700 dark:text-rose-300 text-sm uppercase tracking-wide">Without FinanceFlow</span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {withoutVsWith.map((row, i) => (
                  <li key={i} className="px-6 py-4 flex items-start gap-3">
                    <row.icon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{row.without}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-5 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm uppercase tracking-wide">With FinanceFlow</span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {withoutVsWith.map((row, i) => (
                  <li key={i} className="px-6 py-4 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{row.with}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FEATURE GROUPS */}
      {featureGroups.map((group, gi) => (
        <section key={group.category} className={`py-24 px-4 ${group.bgClass}`}>
          <motion.div
            ref={groupSections[gi]?.ref}
            variants={staggerContainer}
            initial="hidden"
            animate={groupSections[gi]?.isInView ? 'visible' : 'hidden'}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                  {group.label}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {group.category}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {group.description}
                </p>
              </motion.div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${group.features.length === 4 ? 'lg:grid-cols-4' : group.features.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-3xl mx-auto'}`}>
              {group.features.map((feature, fi) => {
                const imgUrl = feature.featureKey ? featureImages[feature.featureKey] : undefined;
                const badgeLabel = getBadgeLabel(feature);
                const badgeStyle = planBadgeStyle[feature.plan];
                return (
                  <motion.div
                    key={fi}
                    variants={fadeUp}
                    custom={fi + 1}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-default"
                  >
                    {imgUrl && (
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={feature.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className={`flex items-start ${imgUrl ? 'justify-start mb-4' : 'justify-between mb-5'}`}>
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-sm group-hover:shadow-md transition-shadow ${imgUrl ? 'mr-3' : ''}`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        {!imgUrl && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">
                        {feature.benefit}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      ))}

      {/* PLAN COMPARISON TABLE */}
      <section className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <motion.div
          ref={planTableSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={planTableSection.isInView ? 'visible' : 'hidden'}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                Plan Breakdown
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Which plan is right for you?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Every feature mapped to the plan that unlocks it - no fine print.
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            custom={1}
            className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Table header - dynamic */}
            <div className="grid grid-cols-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="px-5 py-5 col-span-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Feature</span>
              </div>
              {tableColumns.map(col => (
                <div key={col.tierName} className={`px-3 py-5 text-center ${col.bg} border-l border-gray-100 dark:border-white/[0.06]`}>
                  <div className={`text-sm font-bold ${col.color}`}>{col.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{col.price}</div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {planComparisonRows.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 border-b border-gray-50 dark:border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-white/[0.015]'}`}
              >
                <div className="px-5 py-3.5 col-span-1 flex items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{row.feature}</span>
                </div>
                <div className="px-3 py-3.5 flex items-center justify-center border-l border-gray-50 dark:border-white/[0.04]">
                  <CheckMark checked={row.free} />
                </div>
                <div className="px-3 py-3.5 flex items-center justify-center border-l border-gray-50 dark:border-white/[0.04]">
                  <CheckMark checked={row.pro} />
                </div>
                <div className="px-3 py-3.5 flex items-center justify-center border-l border-gray-50 dark:border-white/[0.04]">
                  <CheckMark checked={row.premium} />
                </div>
              </div>
            ))}

            {/* CTA row - dynamic button labels */}
            <div className="grid grid-cols-4 bg-gray-50/80 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.06]">
              <div className="px-5 py-5" />
              {tableColumns.map((col, idx) => (
                <div key={col.tierName} className="px-3 py-5 border-l border-gray-100 dark:border-white/[0.06]">
                  <button
                    onClick={idx === 0 ? onSignIn : () => onNavigate('pricing')}
                    className={`w-full py-2 rounded-lg text-xs font-semibold text-white transition-colors ${ctaBtnClass[col.tierName] ?? 'bg-blue-600 hover:bg-blue-500'}`}
                  >
                    {idx === 0 ? 'Get Started' : `Get ${col.label}`}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6"
          >
            All plans include bank-level security and 150+ currency support. Cancel any time.
          </motion.p>
        </motion.div>
      </section>

      {/* PRICING CARDS - dynamic from admin */}
      <section className="py-24 px-4 bg-white dark:bg-[#0B0F1A]">
        <motion.div
          ref={pricingCardsSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={pricingCardsSection.isInView ? 'visible' : 'hidden'}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                Pricing
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                A plan for every{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">
                  financial journey
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Start free and upgrade as your financial life grows.
              </p>
            </motion.div>

            {/* Annual / Monthly toggle */}
            <motion.div variants={fadeUp} custom={1} className="mt-8 inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08]">
              {(['Monthly', 'Annual'] as const).map(period => {
                const active = (period === 'Annual') === isAnnual;
                const maxDiscount = plans.length > 0
                  ? Math.max(...plans.map(p => calculateAnnualDiscount(p.monthlyPrice, p.annualPrice)))
                  : 13;
                return (
                  <button
                    key={period}
                    onClick={() => setIsAnnual(period === 'Annual')}
                    className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    {period}
                    {period === 'Annual' && maxDiscount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        -{maxDiscount}%
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const savingsPercent = calculateAnnualDiscount(plan.monthlyPrice, plan.annualPrice);
              const showSavings = isAnnual && plan.monthlyPrice > 0 && savingsPercent > 0;
              const displayPrice = plan.monthlyPrice === 0
                ? '$0'
                : isAnnual
                  ? `$${plan.annualPrice}`
                  : `$${plan.monthlyPrice}`;
              const displayPeriod = plan.monthlyPrice === 0 ? 'forever' : isAnnual ? '/year' : '/month';

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeUp}
                  custom={i + 2}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-2xl shadow-blue-500/30 scale-[1.02]'
                      : 'bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold shadow-md whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {showSavings && (
                    <div className="absolute top-4 right-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${plan.highlighted ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
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

                  <div className="flex items-end gap-1 mb-6">
                    <span className={`text-5xl font-bold tracking-tight ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {displayPrice}
                    </span>
                    <span className={`ml-1 text-sm mb-2 ${plan.highlighted ? 'text-blue-200' : 'text-gray-500 dark:text-gray-500'}`}>
                      {displayPeriod}
                    </span>
                  </div>

                  <button
                    onClick={onSignIn}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 mb-7 ${
                      plan.highlighted
                        ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-md'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {plan.ctaText || 'Get Started'}
                  </button>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <CheckCircle2 size={15} className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-200' : 'text-emerald-500'}`} />
                        <span className={`text-sm leading-snug ${plan.highlighted ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}`}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          <motion.div variants={fadeUp} custom={plans.length + 2} className="text-center mt-10">
            <button
              onClick={() => onNavigate('pricing')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              View full pricing details
              <ChevronRight size={16} />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF STATS */}
      <section className="py-20 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { stat: '$4,800', label: 'Avg. savings per year', icon: DollarSign, gradient: 'from-emerald-500 to-teal-400' },
              { stat: '27%', label: 'Reduction in overspending', icon: TrendingDown, gradient: 'from-blue-500 to-cyan-400' },
              { stat: '$130+', label: 'Late fees avoided annually', icon: Bell, gradient: 'from-amber-500 to-orange-400' },
              { stat: '3×', label: 'Faster goal achievement', icon: Star, gradient: 'from-rose-500 to-pink-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} mb-4 shadow-md`}>
                  <item.icon size={20} className="text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{item.stat}</div>
                <div className="text-sm text-gray-500 dark:text-gray-500">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div ref={ctaSection.ref} className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ctaSection.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-7">
              <Zap size={14} className="text-cyan-200" />
              {plans.length > 0 ? `${plans.length} plans starting at $0. Cancel any time.` : '3 plans starting at $0. Cancel any time.'}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
              Everything you need to master your finances.
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
              FinanceFlow replaces budgeting apps, financial advisors, and tracking tools in one intelligent platform - starting at $0.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={onSignIn}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-base hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/20"
              >
                Start for free
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                onClick={() => onNavigate('pricing')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold text-base hover:bg-white/10 transition-colors"
              >
                <Sparkles size={16} />
                Compare plans
              </motion.button>
            </div>
            <p className="mt-6 text-blue-200/70 text-sm">No credit card required · Free plan forever · Cancel any time</p>
          </motion.div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
