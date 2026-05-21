import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  HelpCircle,
  MessageSquare,
  X,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Page } from '../Dashboard/types';

interface KnowledgeBasePageProps {
  onNavigate: (page: Page) => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  order_index: number;
}

const cardClass =
  'bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl';

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 dark:focus:ring-blue-400/20 dark:focus:border-blue-400/30 transition-all';

const CATEGORY_ORDER = ['account', 'billing', 'features', 'getting_started', 'troubleshooting'];

const CATEGORY_LABELS: Record<string, string> = {
  account: 'ACCOUNT MANAGEMENT',
  billing: 'BILLING & SUBSCRIPTION',
  features: 'FEATURES',
  getting_started: 'GETTING STARTED',
  troubleshooting: 'TROUBLESHOOTING',
};

const STATIC_FAQ: FAQItem[] = [
  {
    id: 'a1',
    question: 'How do I change my currency?',
    answer:
      'Go to your Profile page, scroll to the Preferences section, and select your preferred currency from the dropdown menu. This will update how amounts are displayed throughout the app.',
    category: 'account',
    helpful_count: 2,
    order_index: 1,
  },
  {
    id: 'a2',
    question: 'Can I change my subscription plan?',
    answer:
      'Yes! Navigate to your Profile page and click on "Manage Subscription". From there you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    category: 'account',
    helpful_count: 0,
    order_index: 2,
  },
  {
    id: 'b1',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as payments through Stripe. All transactions are processed securely.',
    category: 'billing',
    helpful_count: 0,
    order_index: 1,
  },
  {
    id: 'b2',
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel your subscription at any time from the Subscription page in your Profile. After cancellation, you will retain access until the end of your current billing period.',
    category: 'billing',
    helpful_count: 0,
    order_index: 2,
  },
  {
    id: 'f1',
    question: 'What is the difference between Free, Paid, and Premium plans?',
    answer:
      'The Free plan gives you access to core features like transaction tracking, budgeting, and savings goals. The Paid plan unlocks advanced tools such as reports, bill reminders, and investment tracking. The Premium plan includes all features including AI-powered tools like the Financial Assistant, expense predictions, and AI recommendations.',
    category: 'features',
    helpful_count: 0,
    order_index: 1,
  },
  {
    id: 'f2',
    question: 'How does the Financial Assistant work?',
    answer:
      'The Financial Assistant is an AI-powered chatbot that analyzes your financial data and provides personalized advice. It can answer questions about your spending, suggest ways to save money, and help you plan for the future. It is powered by OpenAI and requires a Premium subscription.',
    category: 'features',
    helpful_count: 0,
    order_index: 2,
  },
  {
    id: 'g1',
    question: 'How do I add my first transaction?',
    answer:
      'Navigate to the Transactions page from the sidebar. Click the "Add Transaction" button in the top right corner, fill in the details such as amount, category, date, and description, then click Save. Your transaction will appear in the list immediately.',
    category: 'getting_started',
    helpful_count: 0,
    order_index: 1,
  },
  {
    id: 'g2',
    question: 'How do I set up a budget?',
    answer:
      'Go to the Budget page from the sidebar. Click "Add Budget Category" and choose a spending category (e.g., Food, Transport). Set your monthly limit for that category. FinanceFlow will track your spending against your budget and alert you when you are getting close to the limit.',
    category: 'getting_started',
    helpful_count: 0,
    order_index: 2,
  },
  {
    id: 'g3',
    question: 'What are savings goals and how do I create one?',
    answer:
      'Savings goals help you track progress toward a specific financial target, like an emergency fund, vacation, or a new car. Go to Savings Goals in the sidebar, click "New Goal", enter a name, target amount, and optional deadline. You can then add contributions as you save.',
    category: 'getting_started',
    helpful_count: 0,
    order_index: 3,
  },
  {
    id: 't1',
    question: "My transactions aren't showing up. What should I do?",
    answer:
      "First, try refreshing the page. If transactions are still missing, check that you're viewing the correct date range and that no filters are applied. If you recently added a transaction and it's not appearing, log out and log back in. If the problem persists, please contact our support team.",
    category: 'troubleshooting',
    helpful_count: 0,
    order_index: 1,
  },
  {
    id: 't2',
    question: 'I forgot my password. How do I reset it?',
    answer:
      'On the login page, click "Forgot Password". Enter your registered email address and we will send you a password reset link. Check your spam folder if you do not receive the email within a few minutes. The reset link is valid for 24 hours.',
    category: 'troubleshooting',
    helpful_count: 0,
    order_index: 2,
  },
];

export function KnowledgeBasePage({ onNavigate }: KnowledgeBasePageProps) {
  const [articles, setArticles] = useState<FAQItem[]>(STATIC_FAQ);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      const { data, error } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('order_index');

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: FAQItem[] = data.map((d) => ({
          id: d.id,
          question: d.question,
          answer: d.answer || '',
          category: d.category,
          helpful_count: d.helpful_count ?? 0,
          order_index: d.order_index ?? 0,
        }));
        setArticles(mapped);
      }
    } catch {
      // fall back to static
    }
  }

  const filteredArticles = searchQuery.trim()
    ? articles.filter(
        (a) =>
          a.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  const grouped = CATEGORY_ORDER.reduce<Record<string, FAQItem[]>>((acc, cat) => {
    const items = filteredArticles.filter((a) => a.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleHelpful(article: FAQItem) {
    if (helpfulVoted.has(article.id)) return;
    const prev = helpfulCounts[article.id] ?? article.helpful_count;
    setHelpfulCounts((c) => ({ ...c, [article.id]: prev + 1 }));
    setHelpfulVoted((s) => new Set(s).add(article.id));

    supabase
      .from('faq_articles')
      .update({ helpful_count: prev + 1 })
      .eq('id', article.id)
      .then(() => {});
  }

  function getHelpfulCount(article: FAQItem) {
    return helpfulCounts[article.id] ?? article.helpful_count;
  }

  const hasResults = Object.keys(grouped).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onNavigate('support')}
          className="mt-0.5 p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors flex-shrink-0"
          aria-label="Back to Support"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Knowledge Base
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-[42px] -mt-0.5">
            Find answers to common questions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQ..."
          className={`${fieldClass} pl-10 pr-10 py-3 text-[15px] rounded-2xl`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results or Empty State */}
      {!hasResults ? (
        <div className={`${cardClass} p-10 flex flex-col items-center text-center`}>
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <HelpCircle className="w-7 h-7 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
            No results found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Try a different search term or contact our support team.
          </p>
          <button
            onClick={() => onNavigate('support')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all font-medium text-sm shadow-sm shadow-blue-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Support
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-1 mb-2.5">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              <div className={`${cardClass} divide-y divide-gray-100 dark:divide-white/[0.04] overflow-hidden`}>
                {items.map((item) => {
                  const isOpen = expandedId === item.id;
                  const voted = helpfulVoted.has(item.id);
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <span
                          className={`text-[14px] font-medium leading-snug transition-colors ${
                            isOpen
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                          }`}
                        >
                          {item.question}
                        </span>
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.05] group-hover:bg-gray-200 dark:group-hover:bg-white/[0.08] transition-colors">
                          {isOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          )}
                        </span>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-white/[0.04]">
                          <p className="text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                            {item.answer}
                          </p>
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <button
                              onClick={() => handleHelpful(item)}
                              disabled={voted}
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                voted
                                  ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 cursor-default'
                                  : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {voted ? 'Marked as helpful' : `Helpful (${getHelpfulCount(item)})`}
                            </button>
                            <button
                              onClick={() => onNavigate('support')}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              Still need help? Contact us
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      {hasResults && (
        <div className={`${cardClass} p-5 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                Still need help?
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                Our support team is ready to assist you.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('support')}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all font-medium text-sm shadow-sm shadow-blue-500/20 flex-shrink-0"
          >
            Contact Support
          </button>
        </div>
      )}
    </div>
  );
}
