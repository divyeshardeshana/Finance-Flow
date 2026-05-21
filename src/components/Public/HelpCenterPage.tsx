import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
}

interface HelpCenterPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting Started',
  account: 'Account',
  billing: 'Billing',
  features: 'Features',
  troubleshooting: 'Troubleshooting',
};

const CATEGORY_ORDER = ['getting_started', 'account', 'billing', 'features', 'troubleshooting'];

export default function HelpCenterPage({ onNavigate, onSignIn }: HelpCenterPageProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const loadFAQs = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('faq_articles')
          .select('id, question, answer, category, order_index, created_at')
          .eq('is_published', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true });
        setFaqs(data || []);
      } catch (err) {
        console.error('Error loading FAQs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFAQs();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(faqs.map(f => f.category))];
    return CATEGORY_ORDER.filter(c => cats.includes(c));
  }, [faqs]);

  const filtered = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = !searchTerm ||
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchTerm, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory !== 'all') {
      return { [activeCategory]: filtered };
    }
    return CATEGORY_ORDER.reduce<Record<string, FAQ[]>>((acc, cat) => {
      const items = filtered.filter(f => f.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {});
  }, [filtered, activeCategory]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <PublicNavbar currentView="helpcenter" onNavigate={onNavigate} onSignIn={onSignIn} />

      <section className="pt-28 pb-16 bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <HelpCircle size={14} />
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="text-gray-900 dark:text-white">How can we</span>{' '}
            <span className="text-blue-600 dark:text-blue-400">help you?</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Browse our frequently asked questions or search for a specific topic
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Topics
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Try different search terms or{' '}
                <button onClick={() => onNavigate('contact')} className="text-blue-600 dark:text-blue-400 hover:underline">
                  contact us
                </button>{' '}
                directly
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  {activeCategory === 'all' && (
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                      {CATEGORY_LABELS[cat] || cat}
                    </h2>
                  )}
                  <div className="space-y-3">
                    {items.map(faq => (
                      <div
                        key={faq.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                          {openId === faq.id
                            ? <ChevronUp size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                          }
                        </button>
                        {openId === faq.id && (
                          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed pt-4 text-sm">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="mt-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-8 text-center border border-blue-100 dark:border-blue-900">
              <HelpCircle className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-5">
                Our support team is ready to assist you with any question
              </p>
              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
