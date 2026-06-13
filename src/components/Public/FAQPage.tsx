import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronDown, Search, HelpCircle, MessageSquare, Zap } from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import SEOHead from '../SEO/SEOHead';
import { supabase } from '../../lib/supabase';

interface FAQPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  order_index: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  account: 'Account',
  billing: 'Billing & Subscription',
  features: 'Features',
  getting_started: 'Getting Started',
  troubleshooting: 'Troubleshooting',
};

const CATEGORY_ORDER = ['getting_started', 'account', 'billing', 'features', 'troubleshooting'];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

function FAQSchemaScript({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function FAQPage({ onNavigate, onSignIn }: FAQPageProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('faq_articles')
        .select('id, question, answer, category, helpful_count, order_index')
        .eq('show_on_website', true)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      setFaqs(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const categories = ['all', ...CATEGORY_ORDER.filter(c =>
    faqs.some(f => f.category === c)
  )];

  const filtered = faqs.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory;
    const matchSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = CATEGORY_ORDER.reduce<Record<string, FAQItem[]>>((acc, cat) => {
    const items = filtered.filter(f => f.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <>
      <SEOHead
        title="FAQ – FinanceFlow"
        description="Answers to common questions about FinanceFlow — budgeting, subscriptions, features, and account management."
        keywords="FinanceFlow FAQ, personal finance app help, budgeting app questions"
      />
      {faqs.length > 0 && <FAQSchemaScript faqs={faqs} />}

      <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
        <PublicNavbar currentView="faq" onNavigate={onNavigate} onSignIn={onSignIn} />

        {/* Hero */}
        <section ref={heroRef} className="pt-28 pb-16 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl" />
          </div>
          <motion.div
            initial="hidden" animate={heroInView ? 'visible' : 'hidden'}
            variants={fadeUp} className="relative max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <HelpCircle size={14} />
              Help Centre
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Frequently Asked{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                Questions
              </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
              Everything you need to know about FinanceFlow. Can't find an answer?{' '}
              <button
                onClick={() => onNavigate('contact')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Contact us
              </button>
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions…"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all shadow-sm"
              />
            </div>
          </motion.div>
        </section>

        {/* Category filter */}
        <section className="pb-6 px-4">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {cat === 'all' ? 'All Topics' : CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ list */}
        <section className="pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <HelpCircle size={40} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No results found for "{search}"</p>
                <button
                  onClick={() => { setSearch(''); setActiveCategory('all'); }}
                  className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(grouped).map(([cat, items], gi) => (
                  <motion.div
                    key={cat}
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                    variants={fadeUp} custom={gi * 0.5}
                  >
                    {activeCategory === 'all' && (
                      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                        {CATEGORY_LABELS[cat] || cat}
                      </h2>
                    )}
                    <div className="space-y-2">
                      {items.map((faq, i) => (
                        <motion.div
                          key={faq.id}
                          variants={fadeUp} custom={i * 0.05}
                          className="border border-gray-200 dark:border-white/[0.07] rounded-2xl bg-white dark:bg-white/[0.02] overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                            className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                          >
                            <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                              {faq.question}
                            </span>
                            <motion.div
                              animate={{ rotate: openId === faq.id ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                            >
                              <ChevronDown size={18} />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {openId === faq.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                              >
                                <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/5 dark:to-cyan-500/5 border-y border-blue-100 dark:border-blue-500/10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <MessageSquare size={22} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Still have questions?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Our support team is happy to help. Reach out and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                Contact Support
              </button>
              <button
                onClick={onSignIn}
                className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <Zap size={15} className="inline mr-1.5 text-blue-500" />
                Get Started Free
              </button>
            </div>
          </div>
        </section>

        <PublicFooter onNavigate={onNavigate} onSignIn={onSignIn} />
      </div>
    </>
  );
}
