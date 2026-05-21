import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Clock, ArrowRight, Shield, Zap, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface ForgotPasswordPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
  onBackToSignIn: () => void;
}

const COOLDOWN_SECONDS = 60;

export function ForgotPasswordPage({ onNavigate, onSignIn, onBackToSignIn }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resentToast, setResentToast] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validateEmail = useCallback((value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/?view=reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    const redirectTo = `${window.location.origin}/?view=reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setCooldown(COOLDOWN_SECONDS);
      setResentToast(true);
      setTimeout(() => setResentToast(false), 4000);
    }
  };

  const handleTryDifferentEmail = () => {
    setSent(false);
    setEmail('');
    setError('');
    setCooldown(0);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] flex flex-col overflow-x-hidden">
      <PublicNavbar
        currentView="home"
        onNavigate={onNavigate}
        onSignIn={onSignIn}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
          <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-t from-cyan-100/30 to-transparent dark:from-cyan-600/5 dark:to-transparent blur-3xl" />
        </div>

        <div className="relative w-full max-w-[1200px] mx-auto px-6 flex flex-col items-center">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] mb-5"
        >
          <button
            onClick={onBackToSignIn}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Sign In
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-8 shadow-xl shadow-gray-200/60 dark:shadow-black/30">

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Check your inbox
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">
                      We sent a password reset link to
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {email}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl mb-6 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <p>The link will expire in <span className="font-medium text-gray-900 dark:text-white">1 hour</span>.</p>
                      <p>Didn't get the email? Check your spam folder.</p>
                    </div>
                  </div>

                  {resentToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 mb-4"
                    >
                      <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Email resent! Check your inbox.</span>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/[0.08] border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400 mb-4"
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <Clock size={16} />
                        Resend in {cooldown}s
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} />
                        Resend Email
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
                    <span className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wide font-medium">or</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
                  </div>

                  <button
                    onClick={handleTryDifferentEmail}
                    className="mt-4 w-full py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
                  >
                    Try a different email address
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-7">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium mb-4">
                      <div className="w-4 h-4 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-blue-500/30">
                        <Zap className="w-2.5 h-2.5 text-white" />
                      </div>
                      FinanceFlow AI
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Reset your password
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Enter the email address linked to your account and we'll send you a secure reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
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

                    <div>
                      <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                          id="reset-email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(''); }}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
                          placeholder="you@example.com"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Remember your password?{' '}
                      <button
                        onClick={onBackToSignIn}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
      </div>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
