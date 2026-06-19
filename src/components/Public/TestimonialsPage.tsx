import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote, ArrowRight, Users, TrendingUp, Target, Zap } from 'lucide-react';
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

const TESTIMONIALS = [
  {
    name: 'Priya M.',
    role: 'Software Engineer',
    location: 'Dubai, UAE',
    avatar: 'PM',
    gradient: 'from-blue-500 to-cyan-400',
    rating: 5,
    headline: 'Finally know where my salary goes',
    body: 'I used to wonder why I had nothing left by the 20th. FinanceFlow showed me I was spending 40% on dining out without realising it. Three months in, I have saved more than the previous year combined.',
    metric: '₹1.2L saved in 3 months',
  },
  {
    name: 'Carlos R.',
    role: 'Freelance Designer',
    location: 'Mexico City, Mexico',
    avatar: 'CR',
    gradient: 'from-violet-500 to-purple-400',
    rating: 5,
    headline: 'Tax season is no longer a nightmare',
    body: 'As a freelancer, tracking income across clients was chaos. FinanceFlow\'s category system and monthly reports give me clean numbers my accountant actually appreciates. The AI assistant saved me hours of manual work.',
    metric: '8 hours saved per tax season',
  },
  {
    name: 'Emma & Tom K.',
    role: 'Family of 4',
    location: 'Manchester, UK',
    avatar: 'ET',
    gradient: 'from-emerald-500 to-teal-400',
    rating: 5,
    headline: 'Our family finally agrees on money',
    body: 'We used to argue about spending because we had no visibility. Now we review FinanceFlow together every Sunday. The budget alerts stop small overspends before they become fights. We\'re on track for our first family holiday in years.',
    metric: '£800 holiday fund in 6 months',
  },
  {
    name: 'Aisha N.',
    role: 'Masters Student',
    location: 'Nairobi, Kenya',
    avatar: 'AN',
    gradient: 'from-amber-500 to-orange-400',
    rating: 5,
    headline: 'Student budget actually works now',
    body: 'Living on a stipend meant every mistake hurt. FinanceFlow\'s free plan has everything I need - budget tracking, savings goal for my laptop, and spending charts that make sense. I wish I had this in undergrad.',
    metric: 'Laptop fund hit target in 4 months',
  },
  {
    name: 'David L.',
    role: 'Operations Manager',
    location: 'Singapore',
    avatar: 'DL',
    gradient: 'from-rose-500 to-pink-400',
    rating: 5,
    headline: 'The AI assistant is genuinely useful',
    body: 'I asked "Should I upgrade my car?" and it pulled my cash flow, existing loan, and savings rate to give me a real answer with numbers. Not generic advice - actual analysis of MY situation. That\'s what separates FinanceFlow.',
    metric: 'SGD 15K emergency fund built',
  },
  {
    name: 'Fatima A.',
    role: 'HR Manager',
    location: 'Riyadh, Saudi Arabia',
    avatar: 'FA',
    gradient: 'from-cyan-500 to-blue-400',
    rating: 5,
    headline: 'Switched from three different apps to one',
    body: 'I had a budgeting app, an investment tracker, and a notes app for goals. FinanceFlow replaced all three. The net worth tracker alone is worth it - seeing everything in one number is incredibly motivating.',
    metric: 'Net worth up 23% in 12 months',
  },
];

const STATS = [
  { icon: Users, value: '10,000+', label: 'Active users worldwide' },
  { icon: TrendingUp, value: '$2.4M+', label: 'Tracked in savings goals' },
  { icon: Target, value: '94%', label: 'Users hit their first goal' },
  { icon: Star, value: '4.9/5', label: 'Average user rating' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

export default function TestimonialsPage({ onNavigate, onSignIn, onGetStarted }: Props) {
  const handleGetStarted = onGetStarted ?? onSignIn;
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white">
      <SEOHead
        title="Testimonials - FinanceFlow AI | Real User Stories"
        description="Read real stories from FinanceFlow AI users worldwide - individuals, freelancers, families, and students who transformed their finances. 10,000+ active users."
        keywords="FinanceFlow reviews, personal finance app testimonials, budgeting app success stories, FinanceFlow AI user reviews"
        canonical="https://financeflow.ai/testimonials"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Testimonials', url: 'https://financeflow.ai/testimonials' },
        ]}
      />
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} onGetStarted={handleGetStarted} currentView="testimonials" />

      {/* Hero */}
      <section ref={heroRef} className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            Real stories from real users
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Thousands of people already
            <span className="block bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">transformed their finances</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            From students to families to freelancers - FinanceFlow AI works for everyone, everywhere.
          </motion.p>
        </motion.div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/[0.06] shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
              className="flex flex-col bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote size={24} className="text-gray-300 dark:text-white/10 mb-4" />
              <StarRating rating={t.rating} />
              <h3 className="font-bold text-gray-900 dark:text-white mt-3 mb-2">"{t.headline}"</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{t.body}</p>

              <div className={`mt-5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${t.gradient} bg-opacity-10`}>
                <p className="text-xs font-bold text-white">{t.metric}</p>
              </div>

              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role} · {t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Zap size={14} />
            Join them today
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Write your own success story</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Free plan. No credit card. Results in the first week.</p>
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
