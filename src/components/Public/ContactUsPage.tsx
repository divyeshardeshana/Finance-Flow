import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface ContactUsPageProps {
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

const contactItems = [
  {
    icon: Mail,
    title: 'Email Us',
    detail: 'support@financeflow.app',
    sub: 'We typically reply within 24 hours',
    gradient: 'from-blue-500 to-cyan-400',
    ring: 'shadow-blue-500/20',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    detail: 'Available in-app',
    sub: 'Mon–Fri, 9am–6pm UAE time',
    gradient: 'from-emerald-500 to-teal-400',
    ring: 'shadow-emerald-500/20',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    detail: 'Available via support ticket',
    sub: 'Available for Premium users',
    gradient: 'from-amber-500 to-orange-400',
    ring: 'shadow-amber-500/20',
  },
  {
    icon: MapPin,
    title: 'Office',
    detail: 'Dubai, UAE',
    sub: 'Dubai Internet City',
    gradient: 'from-rose-500 to-pink-400',
    ring: 'shadow-rose-500/20',
  },
];

const subjects = [
  'General Inquiry',
  'Support Request',
  'Billing Question',
  'Partnership Inquiry',
  'Feature Request',
  'Account Issues',
  'Other',
];

function countCharsNoSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

export default function ContactUsPage({ onNavigate, onSignIn }: ContactUsPageProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const leftCol = useScrollInView();
  const rightCol = useScrollInView();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) return;

    const msgChars = countCharsNoSpaces(form.message);
    if (msgChars < 50) {
      setMessageError(`Message must be at least 50 characters (excluding spaces). (${msgChars}/50)`);
      return;
    }
    setMessageError(null);
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
      } else {
        setError(result.message || 'Failed to send message. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] overflow-x-hidden">
      <SEOHead
        pageKey="contact"
        title="Contact Us — FinanceFlow AI | Support & Help"
        description="Contact FinanceFlow AI support. Get help with your account, billing, or technical issues. We reply within 24 hours."
        keywords="FinanceFlow contact, finance app support, help desk, customer service personal finance"
        canonical="https://financeflow.ai/contact"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'Contact', url: 'https://financeflow.ai/contact' },
        ]}
      />
      <PublicNavbar currentView="contact" onNavigate={onNavigate} onSignIn={onSignIn} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-blue-100/60 to-transparent dark:from-blue-600/10 dark:to-transparent blur-3xl" />
          <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-cyan-100/40 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-48 left-0 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-500/5 blur-3xl" />
        </div>

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
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6"
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
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto"
          >
            Have a question, suggestion, or just want to say hello? Our team is here to help.
          </motion.p>
        </div>
      </section>

      {/* ── CONTACT SECTION ───────────────────────────────────────────────── */}
      <section className="py-8 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 xl:gap-16">

            {/* LEFT – Contact information */}
            <motion.div
              ref={leftCol.ref}
              variants={staggerContainer}
              initial="hidden"
              animate={leftCol.isInView ? 'visible' : 'hidden'}
              className="lg:col-span-2 space-y-5"
            >
              <motion.div variants={fadeUp} custom={0} className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Contact Information
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Choose the contact method that works best for you. We aim to respond to all enquiries promptly.
                </p>
              </motion.div>

              {contactItems.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group flex items-start gap-4 p-5 bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg ${item.ring} flex-shrink-0`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                      {item.title}
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                      {item.detail}
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Business Hours Card */}
              <motion.div
                variants={fadeUp}
                custom={5}
                className="p-5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-sm shadow-blue-500/25">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    Business Hours
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Monday – Friday</span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">9:00 AM – 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Saturday</span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">10:00 AM – 2:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sunday</span>
                    <span className="font-medium text-rose-500 dark:text-rose-400">Closed</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 dark:border-white/[0.07]">
                    <span className="text-xs text-gray-400 dark:text-gray-500">UAE time (GMT+4)</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT – Contact form */}
            <motion.div
              ref={rightCol.ref}
              initial={{ opacity: 0, y: 40 }}
              animate={rightCol.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="lg:col-span-3"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] px-8 shadow-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Message Sent!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center mt-8">
                    <button
                      onClick={() => onNavigate('home')}
                      className="px-6 py-3 border border-gray-200 dark:border-white/[0.12] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      Go to Home
                    </button>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setError(null);
                        setForm({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200"
                    >
                      Send Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white dark:bg-white/[0.03] rounded-2xl p-8 border border-gray-200/80 dark:border-white/[0.08] shadow-sm space-y-6"
                >
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Send us a message
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Fill in the form below and we'll get back to you shortly.
                    </p>
                  </div>

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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-white/[0.05] transition-all duration-200"
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
                      className="w-full px-4 py-3 border border-gray-200 dark:border-white/[0.10] rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-[#111827] transition-all duration-200"
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
                          : 'border-gray-200 dark:border-white/[0.10] bg-white dark:bg-white/[0.05]'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      {messageError ? (
                        <p className="text-xs text-red-600 dark:text-red-400">{messageError}</p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                          Minimum 50 characters required (excluding spaces)
                        </p>
                      )}
                      <span
                        className={`text-xs ml-auto ${
                          countCharsNoSpaces(form.message) >= 50
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {countCharsNoSpaces(form.message)}/50
                      </span>
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
