import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mail,
  Lock,
  AlertCircle,
  TrendingUp,
  Shield,
  PieChart,
  CheckCircle,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface SignInProps {
  onToggle: () => void;
  onBackToHome?: () => void;
  onNavigate?: (view: PublicView) => void;
  onForgotPassword?: () => void;
  showPasswordResetSuccess?: boolean;
}

const features = [
  {
    icon: TrendingUp,
    label: 'Track spending',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
  },
  {
    icon: PieChart,
    label: 'Budget smarter',
    gradient: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/20',
  },
  {
    icon: Shield,
    label: 'Bank-level security',
    gradient: 'from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/20',
  },
];

export function SignIn({ onToggle, onBackToHome, onNavigate, onForgotPassword, showPasswordResetSuccess }: SignInProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(!!showPasswordResetSuccess);

  useEffect(() => {
    if (!showSuccessBanner) return;
    const timer = setTimeout(() => setShowSuccessBanner(false), 10000);
    return () => clearTimeout(timer);
  }, [showSuccessBanner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setError(error.message);
    }
  };

  const handleNavigate = (view: PublicView) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (view === 'home' && onBackToHome) {
      onBackToHome();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] flex flex-col overflow-x-hidden">
      <SEOHead pageKey="signin" />
      <PublicNavbar
        currentView="home"
        onNavigate={handleNavigate}
        onSignIn={() => {}}
      />

      <section className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden">
        {/* ── BACKGROUND BLOBS ─────────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
          <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-t from-cyan-100/30 to-transparent dark:from-cyan-600/5 dark:to-transparent blur-3xl" />
        </div>

        <div className="relative w-full max-w-[1200px] mx-auto px-6 flex flex-col items-center">

        {/* ── HERO INTRO ────────────────────────────────────────────────────── */}
        <div className="w-full max-w-[420px] text-center mb-10">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-7"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Zap className="w-3 h-3 text-white" />
            </div>
            FinanceFlow AI
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-4"
          >
            Take control of your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              financial future
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8"
          >
            Smart budgeting, real-time insights, and AI-powered recommendations - all in one place.
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center flex-wrap gap-4"
          >
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${f.gradient} shadow-md ${f.shadow} flex-shrink-0`}>
                  <f.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── LOGIN CARD ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-8 shadow-xl shadow-gray-200/60 dark:shadow-black/30">

            {/* Card header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Success banner */}
              {showSuccessBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" size={16} />
                  <span>Password updated successfully. Please sign in with your new password.</span>
                </motion.div>
              )}

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/[0.08] border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up CTA */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Don't have an account?{' '}
                <button
                  onClick={onToggle}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1.5"
          >
            <Shield size={11} />
            Bank-level encryption · Your data is always protected
          </motion.p>
        </motion.div>
        </div>
      </section>

      <PublicFooter onNavigate={handleNavigate} />
    </div>
  );
}
