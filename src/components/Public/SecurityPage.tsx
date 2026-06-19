import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Lock, Eye, Server, Key, CheckCircle2,
  ArrowRight, AlertTriangle, FileCheck, Globe, Zap,
} from 'lucide-react';
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

const PILLARS = [
  {
    icon: Lock,
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/25',
    title: 'End-to-end encryption',
    description:
      'All data is encrypted at rest using 256-bit AES encryption and in transit using TLS 1.3. Your financial data is unreadable to anyone without your credentials - including us.',
    points: [
      '256-bit AES encryption at rest',
      'TLS 1.3 for all data in transit',
      'Encrypted database backups',
      'Secure key management via Supabase Vault',
    ],
  },
  {
    icon: Eye,
    gradient: 'from-violet-500 to-purple-400',
    shadow: 'shadow-violet-500/25',
    title: 'Row-level security',
    description:
      'Every database query is restricted at the row level - you can only ever read and write your own data. Even if two users shared a database table, neither could see the other\'s records.',
    points: [
      'RLS policies on every table',
      'No shared data between users',
      'Admin access strictly permission-based',
      'All queries verified server-side',
    ],
  },
  {
    icon: Key,
    gradient: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/25',
    title: 'Secure authentication',
    description:
      'Powered by Supabase Auth - JWT-based session tokens with automatic rotation. Sessions expire and require re-authentication. Passwords are hashed with bcrypt and never stored in plain text.',
    points: [
      'JWT tokens with automatic rotation',
      'bcrypt password hashing',
      'Session expiry & re-authentication',
      'No plain-text credentials ever stored',
    ],
  },
  {
    icon: Server,
    gradient: 'from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/25',
    title: 'Infrastructure security',
    description:
      'Hosted on Supabase infrastructure with SOC 2 Type II compliance. API keys and secrets are stored in environment vaults - never in frontend code or version control.',
    points: [
      'SOC 2 Type II compliant infrastructure',
      'Secrets stored in server-side vaults only',
      'No API keys in frontend code',
      'Automated vulnerability scanning',
    ],
  },
  {
    icon: Globe,
    gradient: 'from-rose-500 to-pink-400',
    shadow: 'shadow-rose-500/25',
    title: 'GDPR & privacy compliance',
    description:
      'You own your data. Export a full copy anytime or delete your account and all associated data permanently. We never sell or share your data with third parties.',
    points: [
      'GDPR Article 17 - right to erasure',
      'GDPR Article 20 - data portability',
      'Cookie consent with granular controls',
      'Privacy Policy written in plain English',
    ],
  },
  {
    icon: FileCheck,
    gradient: 'from-cyan-500 to-blue-400',
    shadow: 'shadow-cyan-500/25',
    title: 'Input validation & XSS protection',
    description:
      'All user input is sanitised using DOMPurify before rendering. SQL injection is prevented by parameterised queries via Supabase. Content Security Policy headers block malicious scripts.',
    points: [
      'DOMPurify sanitisation on all inputs',
      'Parameterised queries (no SQL injection)',
      'X-Frame-Options: DENY',
      'X-Content-Type-Options: nosniff',
    ],
  },
];

const BADGES = [
  { label: 'SOC 2 Type II', sub: 'Infrastructure' },
  { label: 'GDPR', sub: 'Compliant' },
  { label: 'TLS 1.3', sub: 'Encryption' },
  { label: '256-bit AES', sub: 'At rest' },
];

export default function SecurityPage({ onNavigate, onSignIn, onGetStarted }: Props) {
  const handleGetStarted = onGetStarted ?? onSignIn;
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white">
      <SEOHead
        title="Security & Trust - FinanceFlow AI | Bank-Grade Data Protection"
        description="FinanceFlow AI uses 256-bit AES encryption, row-level security, JWT auth, and SOC 2 compliant infrastructure. GDPR compliant. Your financial data is protected."
        keywords="FinanceFlow security, personal finance data protection, encrypted finance app, GDPR finance, bank-grade security, financial data privacy"
        canonical="https://financeflow.ai/security"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Security & Trust', url: 'https://financeflow.ai/security' },
        ]}
      />
      <PublicNavbar onNavigate={onNavigate} onSignIn={onSignIn} onGetStarted={handleGetStarted} currentView="security" />

      {/* Hero */}
      <section ref={heroRef} className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
            <Shield size={14} />
            Security & Trust
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Your financial data deserves
            <span className="block bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">bank-grade protection</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 dark:text-gray-300 mb-10">
            We treat your financial data with the same seriousness as a bank. Here is exactly how we protect it.
          </motion.p>

          {/* Trust badges */}
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
            {BADGES.map((b, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">{b.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Security pillars */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
                className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-5 shadow-lg ${p.shadow}`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{p.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">{p.description}</p>
                <div className="space-y-2">
                  {p.points.map((pt, j) => (
                    <div key={j} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                      {pt}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* We never section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">What we will never do</h2>
            <p className="text-gray-500 dark:text-gray-400">Privacy promises, not just policies.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'Sell your data to third parties',
              'Share your transactions with advertisers',
              'Connect to your bank without permission',
              'Store your password in plain text',
              'Use your data to train AI models',
              'Send marketing emails without consent',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10"
              >
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
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
            Secure from day one
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trust is built, not claimed</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Start for free. Your data is protected from your first transaction.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105 text-lg"
            >
              Get started free <ArrowRight size={18} className="inline ml-2" />
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="px-8 py-4 border border-gray-300 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-lg"
            >
              Read Privacy Policy
            </button>
          </div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
