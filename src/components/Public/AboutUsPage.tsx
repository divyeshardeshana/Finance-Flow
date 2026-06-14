import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import {
  ArrowRight,
  Shield,
  Target,
  Globe,
  TrendingUp,
  Heart,
  Users,
  DollarSign,
  Clock,
  Quote,
  ChevronRight,
  Zap,
  Lock,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface AboutUsPageProps {
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

const values = [
  {
    icon: Lock,
    title: 'Security First',
    description: 'Bank-grade 256-bit AES encryption, multi-factor authentication, and regular third-party security audits. Your financial data is sacred. We will never sell it.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Target,
    title: 'Outcomes Over Features',
    description: 'We do not build features for the sake of it. Every tool in FinanceFlow exists because real users faced a real financial problem — and we built the solution.',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Heart,
    title: 'Finance For Everyone',
    description: 'Financial clarity should not cost $400 per hour. FinanceFlow brings advisor-level insight to anyone with a smartphone, regardless of income or background.',
    gradient: 'from-rose-500 to-pink-400',
  },
  {
    icon: Globe,
    title: 'Global By Design',
    description: 'Built from day one to work across 150+ currencies and 50+ countries — for individuals, families, freelancers, and businesses wherever they are.',
    gradient: 'from-amber-500 to-orange-400',
  },
];

const team = [
  {
    name: 'Sarah Mitchell',
    role: 'CEO & Co-Founder',
    bio: 'Former VP of Product at a leading fintech. Sarah built FinanceFlow after watching friends with good incomes struggle to save because they lacked the right tools, not the right intentions.',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
  },
  {
    name: 'James Harrington',
    role: 'CTO & Co-Founder',
    bio: '15 years building financial infrastructure at global banks and startups. James leads the engineering team that keeps your data secure, private, and always available.',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of Design',
    bio: 'UX designer with a background in behavioural economics. Priya ensures complex financial data is presented so clearly that anyone can act on it — not just finance professionals.',
    image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
  },
  {
    name: 'David Chen',
    role: 'Head of Data Science',
    bio: 'PhD in Applied Mathematics. David built the AI models behind expense predictions, stock analysis, and personalised recommendations — the features that set FinanceFlow apart.',
    image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
  },
];

const impactStats = [
  { icon: Users, value: '10,000+', label: 'Active Users Worldwide', detail: 'From solo freelancers to multi-person households', gradient: 'from-blue-500 to-cyan-400' },
  { icon: Globe, value: '50+', label: 'Countries Supported', detail: 'Used on every continent — 150+ currencies', gradient: 'from-emerald-500 to-teal-400' },
  { icon: DollarSign, value: '$50M', label: 'Money Tracked', detail: 'Financial clarity created across all user accounts', gradient: 'from-amber-500 to-orange-400' },
  { icon: Clock, value: '2 min', label: 'Average Setup Time', detail: 'From sign-up to your first financial insight', gradient: 'from-rose-500 to-pink-400' },
];

const problemPoints = [
  'Most people earn enough — they just cannot see where their money goes.',
  'The average person has multiple forgotten subscriptions.',
  'Impulse purchases quietly destroy savings goals.',
  'Financial advisors are expensive and inaccessible.',
];

export default function AboutUsPage({ onNavigate, onSignIn }: AboutUsPageProps) {
  const problemSection = useScrollInView();
  const statsSection = useScrollInView();
  const valuesSection = useScrollInView();
  const teamSection = useScrollInView();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] overflow-x-hidden">
      <SEOHead pageKey="about" />
      <PublicNavbar currentView="about" onNavigate={onNavigate} onSignIn={onSignIn} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
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
            Our Story
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6"
          >
            We built FinanceFlow because{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              financial stress is not your fault
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto"
          >
            FinanceFlow was founded with a simple belief: most people are not bad with money — they just lack the right tools and visibility. We are here to change that.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500 dark:text-gray-500"
          >
            {['Founded 2021', '10,000+ users', '50+ countries'].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <Zap size={13} className="text-blue-500" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── THE PROBLEM WE SOLVE ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <motion.div
          ref={problemSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={problemSection.isInView ? 'visible' : 'hidden'}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                  The Problem
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
                  The problem we set out to fix
                </h2>
              </motion.div>

              <ul className="space-y-5">
                {problemPoints.map((point, i) => (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    custom={i + 1}
                    className="flex items-start gap-4"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold shadow-sm shadow-blue-500/30">
                      {i + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div variants={fadeUp} custom={2}>
              <div className="relative rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-8 md:p-10">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl translate-y-1/2 -translate-x-1/2" />
                  <div className="relative">
                    <Quote className="w-10 h-10 text-blue-300/60 mb-6" />
                    <blockquote className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-6">
                      "Financial security should not be a privilege. It should be a skill."
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
                        <img
                          src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=2"
                          alt="Sarah Mitchell"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">Sarah Mitchell</div>
                        <div className="text-blue-200 text-xs">CEO & Co-Founder</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── FINANCEFLOW BY THE NUMBERS ───────────────────────────────────── */}
      <section className="py-24 px-4">
        <motion.div
          ref={statsSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={statsSection.isInView ? 'visible' : 'hidden'}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                By The Numbers
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                FinanceFlow by the numbers
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The impact we have had so far — and we are just getting started.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 1}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 text-center hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{stat.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{stat.detail}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── WHAT WE STAND FOR ────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50/70 dark:bg-[#0D1220]">
        <motion.div
          ref={valuesSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={valuesSection.isInView ? 'visible' : 'hidden'}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                Our Values
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                What we stand for
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                These are not values on a poster. They are commitments we make to every user.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 1}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-8 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${value.gradient} shadow-sm mb-5`}>
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <motion.div
          ref={teamSection.ref}
          variants={staggerContainer}
          initial="hidden"
          animate={teamSection.isInView ? 'visible' : 'hidden'}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 dark:text-blue-400 mb-3">
                The Team
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                The people behind FinanceFlow
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                A team obsessed with making financial clarity accessible worldwide.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 1}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-6 text-center hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm scale-110" />
                  <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-white/10 group-hover:ring-blue-200 dark:group-hover:ring-blue-500/40 transition-all duration-300">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">{member.role}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              Your financial future starts with one decision.
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of users who stopped guessing and started knowing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={onSignIn}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-base hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/20"
              >
                Get Started Free
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                onClick={() => onNavigate('features')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold text-base hover:bg-white/10 transition-colors"
              >
                See All Features
                <ChevronRight size={18} />
              </motion.button>
            </div>
            <p className="mt-6 text-blue-200/70 text-sm">Setup takes under 2 minutes. No credit card required.</p>
          </motion.div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
