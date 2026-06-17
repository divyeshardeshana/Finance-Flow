import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Search, HelpCircle, MessageSquare, Zap,
  BookOpen, CreditCard, Settings, Wrench, Star, ArrowRight, X,
} from 'lucide-react';
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

const CATEGORIES: { key: string; label: string; icon: React.ElementType; gradient: string; iconColor: string; bg: string }[] = [
  { key: 'getting_started', label: 'Getting Started',      icon: BookOpen,      gradient: 'from-blue-500 to-cyan-400',    iconColor: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'account',         label: 'Account',              icon: Settings,      gradient: 'from-violet-500 to-purple-400', iconColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { key: 'billing',         label: 'Billing',              icon: CreditCard,    gradient: 'from-emerald-500 to-teal-400',  iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'features',        label: 'Features',             icon: Star,          gradient: 'from-amber-500 to-orange-400',  iconColor: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'troubleshooting', label: 'Troubleshooting',      icon: Wrench,        gradient: 'from-rose-500 to-pink-400',     iconColor: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10' },
];

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

function AccordionItem({ faq, isOpen, onToggle, accentGradient }: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  accentGradient: string;
}) {
  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isOpen
        ? 'border-blue-200 dark:border-blue-500/30 shadow-md shadow-blue-500/5'
        : 'border-gray-200 dark:border-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.12]'
    } bg-white dark:bg-white/[0.02]`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between px-6 py-5 text-left gap-4 group"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-b ${accentGradient} mt-2.5 flex-shrink-0 transition-all ${isOpen ? 'scale-125' : ''}`} />
          <span className={`font-medium text-sm sm:text-base leading-snug transition-colors ${
            isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
          }`}>
            {faq.question}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={`flex-shrink-0 mt-0.5 transition-colors ${isOpen ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-6 pb-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4 ml-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage({ onNavigate, onSignIn }: FAQPageProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    supabase
      .from('faq_articles')
      .select('id, question, answer, category, helpful_count, order_index')
      .eq('show_on_website', true)
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .then(({ data }) => { setFaqs(data || []); setLoading(false); });
  }, []);

  const presentCategories = CATEGORIES.filter(c => faqs.some(f => f.category === c.key));

  const filtered = faqs.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory;
    const matchSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = CATEGORIES.reduce<{ cat: typeof CATEGORIES[0]; items: FAQItem[] }[]>((acc, cat) => {
    const items = filtered.filter(f => f.category === cat.key);
    if (items.length) acc.push({ cat, items });
    return acc;
  }, []);

  const activeCatMeta = CATEGORIES.find(c => c.key === activeCategory);

  return (
    <>
      <SEOHead
        title="FAQ - FinanceFlow AI | Common Questions Answered"
        description="Find answers to common questions about FinanceFlow AI - budgeting, account management, billing, AI assistant, investment tracking, and troubleshooting."
        keywords="FinanceFlow FAQ, personal finance app help, budgeting app questions, FinanceFlow AI assistant help, subscription billing FAQ"
        canonical="https://financeflow.ai/faq"
        breadcrumbs={[
          { name: 'Home', url: 'https://financeflow.ai' },
          { name: 'FAQ', url: 'https://financeflow.ai/faq' },
        ]}
      />
      {faqs.length > 0 && <FAQSchemaScript faqs={faqs} />}

      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e]">
        <PublicNavbar currentView="faq" onNavigate={onNavigate} onSignIn={onSignIn} />

        {/* Hero */}
        <section className="pt-28 pb-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <HelpCircle size={14} />
              Help Centre
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
              How can we{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">help you?</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
              {faqs.length > 0 ? `${faqs.length} answers across ${presentCategories.length} topics.` : 'Common questions about FinanceFlow AI.'}{' '}
              Can't find what you need?{' '}
              <button onClick={() => onNavigate('contact')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Contact us
              </button>
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
                placeholder="Search questions - e.g. 'how to reset password'…"
                className="w-full pl-11 pr-10 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all shadow-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </section>

        {/* Main layout */}
        <section className="pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* Sidebar - category list */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-3">Topics</p>

                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    activeCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeCategory === 'all' ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <HelpCircle size={14} className={activeCategory === 'all' ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <span>All Topics</span>
                  {activeCategory === 'all' && (
                    <span className="ml-auto text-xs bg-white/20 rounded-full px-2 py-0.5">{faqs.length}</span>
                  )}
                </button>

                {CATEGORIES.map(cat => {
                  const count = faqs.filter(f => f.category === cat.key).length;
                  if (!count) return null;
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive
                          ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md`
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : cat.bg}`}>
                        <Icon size={14} className={isActive ? 'text-white' : cat.iconColor} />
                      </div>
                      <span>{cat.label}</span>
                      <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Mobile horizontal pills - hidden on lg */}
                <div className="lg:hidden pt-4">
                  <div className="flex flex-wrap gap-2">
                    {/* already rendered above as sidebar on mobile too */}
                  </div>
                </div>

                {/* Contact card */}
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-100 dark:border-blue-500/20">
                  <MessageSquare size={18} className="text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">Still stuck?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Our team replies within 24 hours.</p>
                  <button
                    onClick={() => onNavigate('contact')}
                    className="w-full py-2 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </aside>

            {/* FAQ content */}
            <div className="flex-1 min-w-0">
              {/* Category header */}
              {activeCatMeta && (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeCatMeta.gradient} flex items-center justify-center shadow-md`}>
                    <activeCatMeta.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{activeCatMeta.label}</h2>
                    <p className="text-xs text-gray-500">{filtered.length} question{filtered.length !== 1 ? 's' : ''}</p>
                  </div>
                </motion.div>
              )}

              {/* Search result label */}
              {search && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {filtered.length > 0 ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"` : `No results for "${search}"`}
                </p>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-gray-200 dark:bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200 dark:border-white/[0.07]">
                  <HelpCircle size={40} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">No results found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Try a different search term or browse all topics.</p>
                  <button
                    onClick={() => { setSearch(''); setActiveCategory('all'); }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Clear & show all
                  </button>
                </div>
              ) : activeCategory === 'all' && !search ? (
                /* Grouped by category */
                <div className="space-y-10">
                  {grouped.map(({ cat, items }, gi) => {
                    const Icon = cat.icon;
                    return (
                      <motion.div
                        key={cat.key}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ delay: gi * 0.06 }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                            <Icon size={15} className="text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">{cat.label}</h3>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.07]" />
                          <span className="text-xs text-gray-400">{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map(faq => (
                            <AccordionItem
                              key={faq.id}
                              faq={faq}
                              isOpen={openId === faq.id}
                              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                              accentGradient={cat.gradient}
                            />
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Flat list for filtered/search */
                <motion.div
                  key={activeCategory + search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {filtered.map(faq => {
                    const cat = CATEGORIES.find(c => c.key === faq.category) || CATEGORIES[0];
                    return (
                      <AccordionItem
                        key={faq.id}
                        faq={faq}
                        isOpen={openId === faq.id}
                        onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                        accentGradient={cat.gradient}
                      />
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-20 px-4 bg-white dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/[0.06]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Ready to take control of your finances?
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Free plan. No credit card. No bank connection required.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={onSignIn}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
              >
                <Zap size={15} className="inline mr-1.5" />
                Get Started Free
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 justify-center"
              >
                <MessageSquare size={15} />
                Contact Support <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        <PublicFooter onNavigate={onNavigate} />
      </div>
    </>
  );
}
