import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  DollarSign,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronRight,
  Lock,
  Globe,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import { gtm } from '../../lib/gtm';
import LeadCaptureBar from './LeadCaptureBar';
import { calculateAnnualDiscount, type PricingPlan } from '../../lib/pricingHelpers';
import { useSubscriptionPlans } from '../../hooks/useSubscriptionPlans';

interface PublicPricingPageProps {
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

const roiPoints = [
  {
    icon: DollarSign,
    gradient: 'from-emerald-500 to-teal-400',
    headline: 'Save more than the subscription costs in month one',
    detail: 'Users who budget actively save an average of $400/month more. At $9/mo that is a 44× return on your subscription.',
  },
  {
    icon: TrendingUp,
    gradient: 'from-blue-500 to-cyan-400',
    headline: 'Stop overpaying for forgotten subscriptions',
    detail: 'Recurring transaction tracking surfaces forgotten subscriptions - most users find $30–$60/month in charges they were ready to cancel.',
  },
  {
    icon: Shield,
    gradient: 'from-amber-500 to-orange-400',
    headline: 'Avoid $130+ per year in late fees',
    detail: 'Bill reminders are available on every plan. That alone more than covers the cost of upgrading for the entire year.',
  },
];

const faqs = [
  {
    q: 'Is there really a free plan - no tricks?',
    a: 'Yes. The Free plan is free forever and includes core budgeting, transaction tracking, bill reminders, and goal setting. No credit card is required to sign up and there are no hidden charges.',
  },
  {
    q: 'What do I actually get by upgrading?',
    a: 'Upgrading unlocks AI-powered features that save you the most money: AI Recommendations, Split Transactions, Advanced Goals, Advanced Reports, and Priority Support on Pro - plus Net Worth Tracking, Retirement Planning, Financial Assistant, Expense Predictions, and Stock Predictions on Premium.',
  },
  {
    q: 'Can I change or cancel my plan at any time?',
    a: 'Yes, always. Upgrade, downgrade, or cancel at any time with no cancellation fees. You keep access until the end of your current billing period.',
  },
  {
    q: 'How much money will I actually save?',
    a: 'Users who actively track budgets and use AI recommendations consistently save hundreds of dollars per month. The bill reminder feature alone saves the average person $130+ per year in late fees.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Absolutely. FinanceFlow uses 256-bit AES encryption, multi-factor authentication, and regular third-party security audits. We are GDPR compliant and ISO 27001 certified. We never sell your data to anyone.',
  },
  {
    q: 'Does it work in my country and currency?',
    a: 'Yes. FinanceFlow supports 150+ currencies with automatic conversion and is used by people in 50+ countries. It works for any income type - salary, freelance, business revenue, or mixed.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-500/30">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200/80 dark:bg-white/10 flex items-center justify-center"
        >
          <ChevronDown size={14} className="text-gray-500 dark:text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/[0.06] pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicPricingPage({ onNavigate, onSignIn }: PublicPricingPageProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const { plans: pricingPlans, loading } = useSubscriptionPlans({ activeOnly: true });

  useEffect(() => { gtm.pricingPageView(); }, []);

  const pricingSection = useScrollInView();
  const roiSection = useScrollInView();
  const ctaSection = useScrollInView();
  const faqSection = useScrollInView();

  const maxDiscount = pricingPlans.length > 0
    ? Math.max(...pricingPlans.map(p => calculateAnnualDiscount(p.monthlyPrice, p.annualPrice)))
    : 17;

  const getDisplayPrice = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return '$0';
    return isAnnual ? `$${plan.annualPrice}` : `$${plan.monthlyPrice}`;
  };

  const getDisplayPeriod = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 'forever';
    return isAnnual ? '/year' : '/month';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] overflow-x-hidden">
      <SEOHead
        pageKey="pricing"
        title="Pricing - FinanceFlow AI | Free, Pro & Premium Plans"
        description="FinanceFlow AI pricing: Free plan with core budgeting, Pro at $9.99/month with AI assistant and investments, Premium with full features. No credit card for free plan."
        keywords="FinanceFlow pricing, personal finance app pricing, budgeting app cost, free finance app, Pro plan, Premium plan"
        canonical="https://financeflow.ai/pricing"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Pricing', url: 'https://financeflow.ai/pricing' },
        ]}
      />
      <PublicNavbar currentView="pricing" onNavigate={onNavigate} onSignIn={onSignIn} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
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
            Transparent Pricing - No Surprises
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6"
          >
            An investment that{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              pays for itself immediately
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-5"
          >
            FinanceFlow users typically save more money in their first month than the cost of an annual subscription.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-500 mb-10"
          >
            {['No credit card required', 'Cancel anytime', 'Works in 150+ currencies'].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isAnnual
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isAnnual
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Annual
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Save {maxDiscount > 0 ? maxDiscount : 17}%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING CARDS ─────────────────────────────────────────────────── */}
      <section ref={pricingSection.ref} className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
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
                        ? 'bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/40 ring-1 ring-blue-400/50 scale-[1.03]'
                        : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5'
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
                      onClick={() => {
                        gtm.planSelected(plan.displayName, isAnnual ? plan.annualPrice : plan.monthlyPrice);
                        onSignIn();
                      }}
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={pricingSection.isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-10 text-center text-sm text-gray-500 dark:text-gray-500"
          >
            All paid plans include a{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">14-day free trial</span>.
            {' '}Cancel anytime.
          </motion.p>
        </div>
      </section>

      {/* ── VALUE SECTION ─────────────────────────────────────────────────── */}
      <section ref={roiSection.ref} className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={roiSection.isInView ? 'visible' : 'hidden'}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">ROI</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
              Why FinanceFlow costs less than{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">doing nothing</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Every month you manage money without the right tools, you lose money.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={roiSection.isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {roiPoints.map((point, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-7 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-default"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${point.gradient} shadow-sm mb-5 group-hover:shadow-md transition-shadow`}>
                  <point.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 leading-snug">{point.headline}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">{point.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── VALUE PROOF CTA ───────────────────────────────────────────────── */}
      <section ref={ctaSection.ref} className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ctaSection.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-7">
              <Zap size={14} className="text-cyan-200" />
              The math is simple: FinanceFlow pays for itself.
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
              Cancel one forgotten subscription.
              <br />
              <span className="text-cyan-200">The app already paid for itself.</span>
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
              Avoid a late fee, or cut one week of impulse spending - and FinanceFlow has already paid for the year. Most users break even in week one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={onSignIn}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-base hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/20"
              >
                Start saving today
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                onClick={() => onNavigate('features')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold text-base hover:bg-white/10 transition-colors"
              >
                See all features
                <ChevronRight size={18} />
              </motion.button>
            </div>
            <p className="mt-6 text-blue-200/70 text-sm">No credit card required · Free plan forever · Cancel any time</p>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section ref={faqSection.ref} className="py-24 px-4 bg-white dark:bg-[#0B0F1A]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={faqSection.isInView ? 'visible' : 'hidden'}
            className="text-center mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Questions people ask before signing up
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={faqSection.isInView ? 'visible' : 'hidden'}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <FAQItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={faqSection.isInView ? 'visible' : 'hidden'}
            custom={faqs.length}
            className="text-center mt-12"
          >
            <p className="text-gray-500 dark:text-gray-500 mb-4 text-sm">
              Still have a question we haven't answered?
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
            >
              Ask us directly
              <ChevronRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── LEAD CAPTURE ──────────────────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
        <LeadCaptureBar
          source="pricing_page"
          heading="Get weekly money-saving tips - free."
          subheading="Join 50,000+ readers. No spam. Unsubscribe any time."
        />
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
