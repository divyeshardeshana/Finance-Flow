import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { gtm } from '../../lib/gtm';

interface LeadCaptureBarProps {
  source?: string;
  heading?: string;
  subheading?: string;
  placeholder?: string;
  ctaText?: string;
  className?: string;
}

export default function LeadCaptureBar({
  source = 'unknown',
  heading = 'Get free personal finance tips — weekly.',
  subheading = 'No spam. Unsubscribe any time.',
  placeholder = 'Enter your email',
  ctaText = 'Send me tips',
  className = '',
}: LeadCaptureBarProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-email-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email, source }),
        }
      );
      const data = await res.json();
      if (data.success) {
        gtm.emailCaptured(source);
        setStatus('success');
      } else {
        setErrorMsg(data.message || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className={`py-16 px-4 ${className}`}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <Mail size={14} />
          Free Finance Tips
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {heading}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{subheading}</p>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400 font-semibold text-lg"
            >
              <CheckCircle2 size={24} />
              You're in! Check your inbox for your first tip.
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder={placeholder}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-colors ${
                  status === 'error'
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
                }`}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap"
              >
                {status === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {ctaText}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {status === 'error' && errorMsg && (
          <p className="mt-3 text-sm text-red-500">{errorMsg}</p>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Trusted by 50,000+ readers. No spam, ever.
        </p>
      </div>
    </section>
  );
}
