import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  User, Briefcase, Users, GraduationCap,
  TrendingUp, PieChart, Target, Bell, Wallet,
  BarChart3, CheckCircle2, ArrowRight, Zap,
  DollarSign, Calendar, Shield, LineChart,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import SEOHead from '../SEO/SEOHead';

interface UseCasesPageProps {
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

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

interface UseCase {
  id: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  pain: string;
  features: { icon: React.ElementType; text: string }[];
  quote: string;
  quoteAuthor: string;
  cta: string;
}

const USE_CASES: UseCase[] = [
  {
    id: 'individual',
    icon: User,
    gradient: 'from-blue-500 to-cyan-400',
    shadowColor: 'shadow-blue-500/25',
    badge: 'Salaried Professional',
    title: 'Take control of your salary',
    subtitle: 'For individuals & salaried employees',
    description:
      'You earn a steady income but money disappears before month-end. FinanceFlow shows exactly where every dirham, dollar, or rupee goes - so you can save more without earning more.',
    pain: 'Tired of wondering where your salary went?',
    features: [
      { icon: PieChart, text: 'Automatic expense categorisation by pay cycle' },
      { icon: Target, text: 'Savings goals with progress tracking' },
      { icon: Bell, text: 'Bill reminders so you never miss a payment' },
      { icon: TrendingUp, text: 'Month-over-month spending trends' },
      { icon: BarChart3, text: 'Budget vs actual reports in one tap' },
      { icon: Wallet, text: 'Net worth tracker across all accounts' },
    ],
    quote: 'I saved AED 1,200 in my first month just by seeing my subscriptions listed in one place.',
    quoteAuthor: 'Marketing Manager, Dubai',
    cta: 'Start tracking your salary',
  },
  {
    id: 'freelancer',
    icon: Briefcase,
    gradient: 'from-violet-500 to-purple-400',
    shadowColor: 'shadow-violet-500/25',
    badge: 'Freelancer / Self-Employed',
    title: 'Manage unpredictable income',
    subtitle: 'For freelancers & self-employed professionals',
    description:
      'Irregular income makes budgeting feel impossible. FinanceFlow adapts to your variable cash flow - helping you separate business from personal, set income targets, and prepare for tax season.',
    pain: 'Irregular income making budgeting feel impossible?',
    features: [
      { icon: Calendar, text: 'Variable income tracking month by month' },
      { icon: DollarSign, text: 'Separate income streams per client or project' },
      { icon: Target, text: 'Emergency fund goal with runway calculator' },
      { icon: TrendingUp, text: 'AI spending predictions based on your patterns' },
      { icon: Bell, text: 'Low-balance alerts before bills hit' },
      { icon: LineChart, text: 'Quarterly income trend analysis' },
    ],
    quote: 'Finally I know my "safe to spend" number even when income varies month to month.',
    quoteAuthor: 'UX Designer, Freelancer',
    cta: 'Start managing irregular income',
  },
  {
    id: 'family',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-400',
    shadowColor: 'shadow-emerald-500/25',
    badge: 'Families & Couples',
    title: 'Budget together, stress less',
    subtitle: 'For families & couples managing shared finances',
    description:
      'Joint finances without visibility cause arguments. FinanceFlow gives your household a single view of income, expenses, and goals - so both partners stay aligned and children learn money habits early.',
    pain: 'Joint finances creating friction at home?',
    features: [
      { icon: Users, text: 'Household expense overview in one dashboard' },
      { icon: Target, text: 'Shared savings goals (holiday, home, education)' },
      { icon: PieChart, text: 'Category budgets for groceries, school, utilities' },
      { icon: Bell, text: 'Recurring bill tracker for rent, insurance, school fees' },
      { icon: Shield, text: 'Estate planning & beneficiary management' },
      { icon: BarChart3, text: 'Monthly family financial report' },
    ],
    quote: 'We stopped arguing about money once we could both see the same numbers.',
    quoteAuthor: 'Parent of 2, Abu Dhabi',
    cta: 'Start your family budget',
  },
  {
    id: 'student',
    icon: GraduationCap,
    gradient: 'from-amber-500 to-orange-400',
    shadowColor: 'shadow-amber-500/25',
    badge: 'Students',
    title: 'Build good money habits early',
    subtitle: 'For students & first-time budgeters',
    description:
      'Limited income, big aspirations. FinanceFlow helps students stretch every dollar further with simple budgeting, financial literacy quizzes, and AI-powered advice - without the complexity of traditional finance apps.',
    pain: 'Running out of money before month-end?',
    features: [
      { icon: Wallet, text: 'Simple income vs expense tracker' },
      { icon: Target, text: 'Savings goals for gadgets, travel, or tuition' },
      { icon: GraduationCap, text: 'Financial literacy quizzes with reward points' },
      { icon: Zap, text: 'AI financial assistant for instant money advice' },
      { icon: Bell, text: 'Overspending alerts before limits are hit' },
      { icon: TrendingUp, text: 'Visualise your net worth grow from zero' },
    ],
    quote: 'The AI assistant explained compound interest better than my finance professor.',
    quoteAuthor: 'University student, India',
    cta: 'Start free as a student',
  },
];

function UseCaseCard({ uc, index, onSignIn }: { uc: UseCase; index: number; onSignIn: () => void; }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center py-16 lg:py-24 border-b border-gray-100 dark:border-white/[0.06] last:border-0`}
    >
      {/* Visual panel */}
      <motion.div variants={fadeUp} custom={0} className="w-full lg:w-5/12 flex-shrink-0">
        <div className={`relative rounded-3xl bg-gradient-to-br ${uc.gradient} p-8 shadow-2xl ${uc.shadowColor}`}>
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              {uc.badge}
            </span>
          </div>
          <uc.icon size={48} className="text-white/90 mb-6" />
          <p className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wide">{uc.pain}</p>
          <h3 className="text-white text-2xl font-bold mb-6">{uc.title}</h3>

          {/* Feature pills */}
          <div className="grid grid-cols-1 gap-2.5">
            {uc.features.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <f.icon size={15} className="text-white flex-shrink-0" />
                <span className="text-white/90 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content panel */}
      <div className="w-full lg:w-7/12">
        <motion.div variants={fadeUp} custom={0.1}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-4">
            <uc.icon size={12} />
            {uc.subtitle}
          </span>
        </motion.div>
        <motion.h2 variants={fadeUp} custom={0.2} className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          {uc.title}
        </motion.h2>
        <motion.p variants={fadeUp} custom={0.3} className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {uc.description}
        </motion.p>

        {/* All features */}
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {uc.features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} custom={i * 0.05} className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{f.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.blockquote variants={fadeUp} custom={0.5} className="border-l-2 border-blue-400 pl-5 mb-8">
          <p className="text-gray-700 dark:text-gray-300 italic text-sm mb-1">"{uc.quote}"</p>
          <cite className="text-xs text-gray-400 dark:text-gray-500 not-italic">- {uc.quoteAuthor}</cite>
        </motion.blockquote>

        <motion.button
          variants={fadeUp} custom={0.6}
          onClick={onSignIn}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${uc.gradient} text-white font-semibold text-sm shadow-lg ${uc.shadowColor} hover:opacity-90 transition-opacity`}
        >
          {uc.cta}
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function UseCasesPage({ onNavigate, onSignIn, onGetStarted }: UseCasesPageProps) {
  const handleGetStarted = onGetStarted ?? onSignIn;
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <>
      <SEOHead
        title="Use Cases - FinanceFlow AI | For Individuals, Freelancers, Families & Students"
        description="See how FinanceFlow AI helps salaried professionals, freelancers, families, and students budget smarter, save more, and reach financial goals faster."
        keywords="personal finance app use cases, budgeting for freelancers, family budget tracker, student money management, salary budgeting app"
        canonical="https://financeflow.ai/use-cases"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Use Cases', url: 'https://financeflow.ai/use-cases' },
        ]}
      />
      <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
        <PublicNavbar currentView="use-cases" onNavigate={onNavigate} onSignIn={onSignIn} onGetStarted={handleGetStarted} />

        {/* Hero */}
        <section ref={heroRef} className="pt-28 pb-12 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-b from-blue-500/8 to-transparent dark:from-blue-500/15 blur-3xl" />
          </div>
          <motion.div
            ref={heroRef}
            initial="hidden" animate={heroInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="relative max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Users size={14} />
              Built for everyone
            </motion.div>
            <motion.h1 variants={fadeUp} custom={0.1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight leading-[1.1]">
              FinanceFlow works for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                your life
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={0.2} className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Whether you're a professional managing a salary, a freelancer juggling variable income, a family budgeting together, or a student starting out - FinanceFlow adapts to you.
            </motion.p>
            <motion.div variants={fadeUp} custom={0.3} className="flex flex-wrap justify-center gap-3">
              {USE_CASES.map(uc => (
                <a
                  key={uc.id}
                  href={`#${uc.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <uc.icon size={14} />
                  {uc.badge}
                </a>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Use case sections */}
        <section className="max-w-6xl mx-auto px-4">
          {USE_CASES.map((uc, i) => (
            <div key={uc.id} id={uc.id}>
              <UseCaseCard uc={uc} index={i} onSignIn={handleGetStarted} />
            </div>
          ))}
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 text-center bg-gradient-to-br from-blue-600 to-cyan-500 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="relative max-w-2xl mx-auto"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to take control of your money?
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.1} className="text-white/80 text-lg mb-8">
              Join thousands of users across the world who manage their finances smarter with FinanceFlow.
            </motion.p>
            <motion.div variants={fadeUp} custom={0.2} className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-3.5 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                View Pricing
              </button>
            </motion.div>
          </motion.div>
        </section>

        <PublicFooter onNavigate={onNavigate} />
      </div>
    </>
  );
}
