import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Zap,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface ContactUsPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

const MIN_CHARS = 25;

const subjects = [
  'General Inquiry',
  'Support Request',
  'Billing Question',
  'Partnership Inquiry',
  'Feature Request',
  'Account Issues',
  'Other',
];

const whyUs = [
  { icon: Clock, label: '< 24h response', sub: 'We reply within one business day' },
  { icon: Shield, label: 'Confidential', sub: 'Your data is never shared' },
  { icon: Zap, label: 'Expert team', sub: 'Finance & tech specialists' },
];

function countCharsNoSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

function generateMathCaptcha(): { a: number; b: number; answer: number } {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export default function ContactUsPage({ onNavigate, onSignIn }: ContactUsPageProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(generateMathCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateMathCaptcha());
    setCaptchaInput('');
    setCaptchaError(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) return;

    const msgChars = countCharsNoSpaces(form.message);
    if (msgChars < MIN_CHARS) {
      setMessageError(`Message too short. (${msgChars}/${MIN_CHARS})`);
      return;
    }
    setMessageError(null);

    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setCaptchaError(true);
      refreshCaptcha();
      return;
    }
    setCaptchaError(false);

    setSubmitting(true);
    setError(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
        refreshCaptcha();
      } else {
        setError(result.message || 'Failed to send message. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = countCharsNoSpaces(form.message);
  const charMet = charCount >= MIN_CHARS;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] overflow-x-hidden">
      <SEOHead
        pageKey="contact"
        title="Contact Us — FinanceFlow | Support & Help"
        description="Contact FinanceFlow support. Get help with your account, billing, or technical issues. We reply within 24 hours."
        keywords="FinanceFlow contact, finance app support, help desk, customer service personal finance"
        canonical="https://financeflow.ai/contact"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Contact', url: 'https://financeflow.ai/contact' },
        ]}
      />
      <PublicNavbar currentView="contact" onNavigate={onNavigate} onSignIn={onSignIn} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center">
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
            Get in Touch
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-5"
          >
            We'd love to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              hear from you
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto mb-10"
          >
            Have a question, suggestion, or need help? Our team typically responds within 24 hours.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {whyUs.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08] shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">{label}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT SECTION ───────────────────────────────────────────────── */}
      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-14">

            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Email card */}
              <div className="relative overflow-hidden rounded-2xl border border-blue-200/60 dark:border-blue-500/20 bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-500/[0.08] dark:to-cyan-500/[0.05] p-6">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-400/10 dark:bg-blue-400/5 blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4 relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25 flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">Email Support</div>
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold">support@financeflow.app</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      Typically replies within 24 hours
                    </div>
                  </div>
                </div>
              </div>

              {/* Live chat card */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg shadow-violet-500/25 flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">In-App Chat</div>
                    <div className="text-gray-700 dark:text-gray-300 text-sm">Available after sign-in</div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">Fastest way to get real-time help</div>
                  </div>
                </div>
              </div>

              {/* What to expect */}
              <div className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">What happens next?</h3>
                <div className="space-y-4">
                  {[
                    { step: '01', text: 'We receive your message instantly' },
                    { step: '02', text: 'A team member reviews it within hours' },
                    { step: '03', text: 'You get a detailed reply within 24 hours' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-[10px] font-bold flex items-center justify-center">
                        {step}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 pt-0.5">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT – Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="lg:col-span-3"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] px-8 shadow-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Message Sent!</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mb-2">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">Check your inbox for a confirmation email.</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => onNavigate('home')}
                      className="px-6 py-3 border border-gray-200 dark:border-white/[0.12] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      Go to Home
                    </button>
                    <button
                      onClick={() => { setSubmitted(false); setError(null); setForm({ name: '', email: '', subject: '', message: '' }); }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200"
                    >
                      Send Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="relative bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden"
                >
                  {/* Form header strip */}
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-5">
                    <h2 className="text-xl font-bold text-white">Send us a message</h2>
                    <p className="text-blue-100/80 text-sm mt-0.5">We read every message and respond promptly.</p>
                  </div>

                  <div className="p-8 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                          placeholder="John Smith"
                          className="w-full px-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-gray-50 dark:bg-white/[0.05] transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          required
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-gray-50 dark:bg-white/[0.05] transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        required
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-gray-50 dark:bg-[#111827] transition-all duration-200"
                      >
                        <option value="">Select a subject...</option>
                        {subjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={e => {
                          setForm(f => ({ ...f, message: e.target.value }));
                          if (messageError) setMessageError(null);
                        }}
                        required
                        rows={6}
                        placeholder="Tell us how we can help..."
                        className={`w-full px-4 py-3 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-200 resize-none ${
                          messageError
                            ? 'border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/5'
                            : 'border-gray-200 dark:border-white/[0.10] bg-gray-50 dark:bg-white/[0.05]'
                        }`}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        {messageError ? (
                          <p className="text-xs text-red-600 dark:text-red-400">{messageError}</p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-600">
                            Minimum {MIN_CHARS} characters required (excluding spaces)
                          </p>
                        )}
                        <span className={`text-xs ml-auto font-medium ${charMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>
                          {charCount}/{MIN_CHARS}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${charMet ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, (charCount / MIN_CHARS) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* ── CAPTCHA ── */}
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${captchaError ? 'border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/5' : 'border-gray-200 dark:border-white/[0.10] bg-gray-50 dark:bg-white/[0.04]'}`}>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Security check
                        </label>
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-2 rounded-lg bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.10] text-gray-900 dark:text-white font-mono font-bold text-lg tracking-widest select-none">
                            {captcha.a} + {captcha.b} = ?
                          </span>
                          <input
                            type="number"
                            value={captchaInput}
                            onChange={e => { setCaptchaInput(e.target.value); setCaptchaError(false); }}
                            placeholder="Answer"
                            className="w-24 px-3 py-2 border border-gray-200 dark:border-white/[0.10] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none bg-white dark:bg-white/[0.05] text-center font-semibold"
                          />
                          <button
                            type="button"
                            onClick={refreshCaptcha}
                            title="New question"
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          >
                            <RefreshCw size={15} />
                          </button>
                        </div>
                        {captchaError && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Incorrect answer. A new question has been generated.
                          </p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/[0.08] border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
