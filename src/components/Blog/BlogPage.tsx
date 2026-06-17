import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import { Search, Calendar, BookOpen, ArrowRight, ChevronDown, Zap, Lock, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import LeadCaptureBar from '../Public/LeadCaptureBar';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  published_at: string;
  tags: string[];
  blog_categories: BlogCategory;
}

interface BlogPageProps {
  onBack: () => void;
  onPostClick: (slug: string) => void;
  onNavigate?: (view: PublicView) => void;
  onSignIn?: () => void;
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

const PAGE_SIZE = 9;
const LOAD_MORE = 6;

const STATIC_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Personal Finance 101: Build Wealth Even on a Small Income',
    slug: 'personal-finance-101',
    category_id: 'personal-finance',
    excerpt: 'Discover the fundamental principles that allow anyone, regardless of income level, to steadily build wealth, eliminate bad debt, and create a lasting financial foundation.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-03-10T09:00:00Z',
    tags: ['budgeting', 'wealth'],
    blog_categories: { id: 'personal-finance', name: 'Personal Finance', slug: 'personal-finance', color: '#3B82F6' },
  },
  {
    id: '2',
    title: 'Debt Management Made Easy: Step-by-Step Plan to Become Debt Free',
    slug: 'debt-management-plan',
    category_id: 'debt-management',
    excerpt: 'A clear, actionable roadmap for tackling every kind of debt - from credit cards to student loans - using proven payoff strategies like the avalanche and snowball methods.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-03-07T09:00:00Z',
    tags: ['debt', 'freedom'],
    blog_categories: { id: 'debt-management', name: 'Debt Management', slug: 'debt-management', color: '#EF4444' },
  },
  {
    id: '3',
    title: '10 Practical Budgeting Tips to Take Control of Your Money',
    slug: 'practical-budgeting-tips',
    category_id: 'saving-money',
    excerpt: 'Ten proven tactics that help you cut unnecessary spending, automate your savings, and make your budget work for you - not the other way around.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-03-04T09:00:00Z',
    tags: ['budgeting', 'savings'],
    blog_categories: { id: 'saving-money', name: 'Saving Money', slug: 'saving-money', color: '#10B981' },
  },
  {
    id: '4',
    title: 'How to Start Investing with Just $100 a Month',
    slug: 'start-investing-100-month',
    category_id: 'investing',
    excerpt: 'You do not need a large portfolio to start building wealth through investments. Learn how index funds, fractional shares, and dollar-cost averaging can work for you from day one.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-28T09:00:00Z',
    tags: ['investing', 'beginners'],
    blog_categories: { id: 'investing', name: 'Investing', slug: 'investing', color: '#8B5CF6' },
  },
  {
    id: '5',
    title: 'The 50/30/20 Rule: A Simple Framework for Financial Planning',
    slug: '50-30-20-rule-guide',
    category_id: 'financial-planning',
    excerpt: 'Understand how splitting your income into needs, wants, and savings can simplify your entire financial life and help you reach major milestones faster.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/7567529/pexels-photo-7567529.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-22T09:00:00Z',
    tags: ['planning', 'budgeting'],
    blog_categories: { id: 'financial-planning', name: 'Financial Planning', slug: 'financial-planning', color: '#F59E0B' },
  },
  {
    id: '6',
    title: 'Emergency Fund Essentials: How Much Is Enough?',
    slug: 'emergency-fund-guide',
    category_id: 'saving-money',
    excerpt: 'Building an emergency fund is the single most impactful thing you can do for your financial security. Find out exactly how much you need and the fastest way to get there.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-17T09:00:00Z',
    tags: ['emergency', 'savings'],
    blog_categories: { id: 'saving-money', name: 'Saving Money', slug: 'saving-money', color: '#10B981' },
  },
  {
    id: '7',
    title: 'Understanding Your Credit Score and How to Improve It Fast',
    slug: 'credit-score-improvement',
    category_id: 'personal-finance',
    excerpt: 'Your credit score affects everything from loan rates to apartment approvals. Learn which factors matter most and the exact steps to raise your score by 50–100 points.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-11T09:00:00Z',
    tags: ['credit', 'score'],
    blog_categories: { id: 'personal-finance', name: 'Personal Finance', slug: 'personal-finance', color: '#3B82F6' },
  },
  {
    id: '8',
    title: 'Retirement Planning in Your 30s: Start Early, Retire Rich',
    slug: 'retirement-planning-30s',
    category_id: 'financial-planning',
    excerpt: 'Compound interest is your greatest ally. A comprehensive guide to maximizing your 401(k), opening a Roth IRA, and building a retirement nest egg that actually lasts.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/8297031/pexels-photo-8297031.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-02-05T09:00:00Z',
    tags: ['retirement', 'planning'],
    blog_categories: { id: 'financial-planning', name: 'Financial Planning', slug: 'financial-planning', color: '#F59E0B' },
  },
  {
    id: '9',
    title: 'Index Funds vs. ETFs: Which One Should You Choose?',
    slug: 'index-funds-vs-etfs',
    category_id: 'investing',
    excerpt: 'Both offer low-cost, diversified exposure to the market - but subtle differences in structure, tax efficiency, and trading flexibility matter. Here is what to know before you invest.',
    content: '',
    featured_image_url: 'https://images.pexels.com/photos/6801874/pexels-photo-6801874.jpeg?auto=compress&cs=tinysrgb&w=800',
    published_at: '2026-01-30T09:00:00Z',
    tags: ['investing', 'ETF'],
    blog_categories: { id: 'investing', name: 'Investing', slug: 'investing', color: '#8B5CF6' },
  },
];

const STATIC_CATEGORIES: BlogCategory[] = [
  { id: 'personal-finance', name: 'Personal Finance', slug: 'personal-finance', color: '#3B82F6' },
  { id: 'debt-management', name: 'Debt Management', slug: 'debt-management', color: '#EF4444' },
  { id: 'saving-money', name: 'Saving Money', slug: 'saving-money', color: '#10B981' },
  { id: 'investing', name: 'Investing', slug: 'investing', color: '#8B5CF6' },
  { id: 'financial-planning', name: 'Financial Planning', slug: 'financial-planning', color: '#F59E0B' },
];

export default function BlogPage({ onBack, onPostClick, onNavigate, onSignIn }: BlogPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const searchSection = useScrollInView(0.1);
  const gridSection = useScrollInView(0.05);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: postsData }, { data: catsData }] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*, blog_categories(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('*')
          .eq('is_active', true)
          .order('name'),
      ]);
      const resolvedPosts = (postsData && postsData.length > 0) ? postsData : STATIC_POSTS;
      const resolvedCats = (catsData && catsData.length > 0) ? catsData : STATIC_CATEGORIES;
      setPosts(resolvedPosts);
      setCategories(resolvedCats);
    } catch {
      setPosts(STATIC_POSTS);
      setCategories(STATIC_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = !searchTerm ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' ||
        post.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const navigate = (view: PublicView) => {
    if (onNavigate) onNavigate(view);
    else onBack();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A]">
      <SEOHead pageKey="blog" />
      <PublicNavbar
        currentView="blog"
        onNavigate={view => {
          if (view === 'blog') return;
          navigate(view);
        }}
        onSignIn={onSignIn || onBack}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-400/8 rounded-full blur-3xl" />
          <div className="absolute top-32 left-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <BookOpen size={13} />
            Finance Planning Blog
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-6"
          >
            Expert insights for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
              smarter money decisions
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Tips, guides, and in-depth articles to help you budget better, invest wisely, and build lasting wealth.
          </motion.p>
        </div>
      </section>

      {/* ── SEARCH & FILTER ──────────────────────────────────────────────── */}
      <div ref={searchSection.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={searchSection.isInView ? 'visible' : 'hidden'}
          className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="px-4 py-2.5 bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-all min-w-[190px] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      {/* ── BLOG GRID ─────────────────────────────────────────────────────── */}
      <div ref={gridSection.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-100 dark:bg-white/[0.05]" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gray-100 dark:bg-white/[0.05] rounded-full w-1/3" />
                  <div className="h-5 bg-gray-100 dark:bg-white/[0.05] rounded w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-white/[0.05] rounded w-1/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded" />
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded w-5/6" />
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded w-4/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search size={22} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts found</h3>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Blog posts will appear here once published'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={gridSection.isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visiblePosts.map((post, i) => (
              <motion.article
                key={post.id}
                variants={fadeUp}
                custom={i * 0.5}
                onClick={() => onPostClick(post.slug)}
                className="group bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {post.featured_image_url && (
                  <div className="h-48 overflow-hidden bg-gray-100 dark:bg-white/[0.05]">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="p-6">
                  {post.blog_categories && (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-4"
                      style={{ backgroundColor: post.blog_categories.color }}
                    >
                      {post.blog_categories.name}
                    </span>
                  )}

                  <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                    {post.title}
                  </h2>

                  {post.published_at && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
                      <Calendar size={12} />
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                      })}
                    </div>
                  )}

                  {post.excerpt && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed line-clamp-3 mb-5">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all duration-200">
                    Read more
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* ── LOAD MORE ──────────────────────────────────────────────────── */}
        {!loading && filteredPosts.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={gridSection.isInView ? 'visible' : 'hidden'}
            custom={4}
            className="flex flex-col items-center gap-4 mt-14"
          >
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Showing {visiblePosts.length} of {filteredPosts.length} articles
            </p>
            {hasMore && (
              <button
                onClick={() => setVisibleCount(c => c + LOAD_MORE)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/[0.12] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-semibold hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <ChevronDown size={16} />
                Load More Articles
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
        <LeadCaptureBar source="blog_page" />
      </div>

      <PublicFooter onNavigate={navigate} />
    </div>
  );
}
