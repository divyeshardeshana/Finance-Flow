import { useState, useEffect, useRef } from 'react';
import {
  HelpCircle, Plus, MessageSquare, Send, ChevronDown, ChevronUp, ThumbsUp,
  Search, ArrowLeft, Clock, CheckCircle2, Circle, AlertTriangle, RotateCcw,
  X, Loader2, Headphones, BookOpen, LifeBuoy, Mail, User, FileText, Monitor,
  Zap, Bug, CreditCard, Lightbulb, Wrench, BarChart2, Settings, Target,
  LayoutGrid as Layout, ArrowRightCircle, ShieldCheck, ChevronRight, Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Database } from '../../lib/database.types';
import { type PublicView } from '../Common/PublicNavbar';
import type { Page } from '../Dashboard/types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type FAQArticle = Database['public']['Tables']['faq_articles']['Row'];

interface TicketMessageRow {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
}

const STATUS_ORDER = ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  open: { label: 'Open', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: Clock },
  waiting_response: { label: 'Awaiting Reply', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08]', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06]' },
  medium: { label: 'Medium', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' },
  high: { label: 'High', color: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10' },
  urgent: { label: 'Urgent', color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10' },
};

const categoryConfig: Record<string, { label: string; icon: string }> = {
  technical: { label: 'Technical', icon: 'wrench' },
  billing: { label: 'Billing', icon: 'credit-card' },
  feature_request: { label: 'Feature Request', icon: 'lightbulb' },
  bug_report: { label: 'Bug Report', icon: 'bug' },
  other: { label: 'Other', icon: 'help-circle' },
};

const faqCategoryLabels: Record<string, string> = {
  getting_started: 'Getting Started',
  account: 'Account Management',
  billing: 'Billing & Subscription',
  features: 'Features',
  troubleshooting: 'Troubleshooting',
};

const STATIC_ARTICLES = [
  { id: 's1', question: 'How do I change my currency?', category: 'account' },
  { id: 's2', question: 'Can I change my subscription plan?', category: 'account' },
  { id: 's3', question: 'What payment methods do you accept?', category: 'billing' },
  { id: 's4', question: 'How do I cancel my subscription?', category: 'billing' },
];

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 dark:focus:ring-blue-400/20 dark:focus:border-blue-400/30 transition-all';

const fieldClassError =
  'w-full px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all';

const cardClass =
  'bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl';

const backBtnClass =
  'p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors';

const primaryBtnClass =
  'flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all font-medium shadow-sm shadow-blue-500/20 disabled:opacity-50';

const secondaryBtnClass =
  'px-5 py-2.5 border border-gray-200/80 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors font-medium';

function countCharsNoSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

interface SupportPageProps {
  onNavigatePublic?: (view: PublicView) => void;
  onNavigate?: (page: Page) => void;
}

export function SupportPage({ onNavigatePublic: _onNavigatePublic, onNavigate }: SupportPageProps = {}) {
  const { user } = useAuth();
  const { checkAndLogAccess } = useSubscription();
  const [view, setView] = useState<'home' | 'faq' | 'tickets' | 'ticket-detail' | 'new-ticket' | 'contact'>('home');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqArticles, setFAQArticles] = useState<FAQArticle[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessageRow[]>([]);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState<string | null>(null);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketSubmitError, setTicketSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ subject?: string; description?: string }>({});
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '' as string,
    priority: '' as string,
    affectedAreas: [] as string[],
    stepsTaken: '' as string,
    contactPreference: 'email' as string,
    browserOs: '' as string,
  });
  const [showDescTips, setShowDescTips] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactErrors, setContactErrors] = useState<{ subject?: string; message?: string }>({});
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setContactForm((prev) => ({
              ...prev,
              name: data.full_name || prev.name,
              email: data.email || user.email || prev.email,
            }));
          } else if (user.email) {
            setContactForm((prev) => ({ ...prev, email: user.email || prev.email }));
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages]);

  useEffect(() => {
    if (ticketSuccessMessage) {
      const t = setTimeout(() => setTicketSuccessMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [ticketSuccessMessage]);

  async function checkFeatureAccess() {
    const hasAccess = await checkAndLogAccess('support_tickets');
    if (hasAccess) {
      loadFAQ();
      loadTickets();
    }
  }

  async function loadFAQ() {
    try {
      const { data, error } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('order_index');

      if (error) throw error;
      setFAQArticles(data || []);
    } catch (error) {
      console.error('Error loading FAQ:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTickets() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  }

  async function loadTicketMessages(ticketId: string) {
    try {
      const { data, error } = await supabase.rpc('get_user_ticket_messages', {
        p_ticket_id: ticketId,
      });
      if (error) throw error;
      setTicketMessages((data as TicketMessageRow[]) || []);
    } catch (error) {
      console.error('Error loading messages via RPC:', error);
      try {
        const { data, error: fallbackError } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at');
        if (!fallbackError && data) {
          setTicketMessages(data);
        }
      } catch (fallbackErr) {
        console.error('Error loading messages fallback:', fallbackErr);
      }
    }
  }

  function validateTicketForm(): boolean {
    const errors: { subject?: string; description?: string } = {};
    const subjectChars = countCharsNoSpaces(formData.subject);
    const descChars = countCharsNoSpaces(formData.description);

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required.';
    } else if (subjectChars < 20) {
      errors.subject = `Subject must be at least 20 characters (excluding spaces). (${subjectChars}/20)`;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required.';
    } else if (descChars < 50) {
      errors.description = `Description must be at least 50 characters (excluding spaces). (${descChars}/50)`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!validateTicketForm()) return;

    setSubmittingTicket(true);
    setTicketSubmitError(null);

    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          affected_area: formData.affectedAreas.length > 0 ? formData.affectedAreas.join(', ') : null,
          steps_taken: formData.stepsTaken || null,
          contact_preference: formData.contactPreference || 'email',
          browser_os: formData.browserOs || null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Ticket was not created. Please try again.');

      Promise.resolve(
        supabase.rpc('user_reply_to_ticket', {
          p_ticket_id: data.id,
          p_message: formData.description,
        })
      ).catch(() => {
        supabase.from('ticket_messages').insert({
          ticket_id: data.id,
          user_id: user.id,
          message: formData.description,
        });
      });

      const userName = profileData?.full_name || user.email?.split('@')[0] || 'User';
      const userEmail = profileData?.email || user.email || '';

      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          event_type: 'ticket_created',
          ticket_id: data.id,
          ticket_subject: formData.subject,
          ticket_category: formData.category,
          ticket_priority: formData.priority,
          ticket_description: formData.description,
          user_email: userEmail,
          user_name: userName,
        }),
      }).catch((err) => console.error('Ticket notification error:', err));

      setFormData({ subject: '', description: '', category: '', priority: '', affectedAreas: [], stepsTaken: '', contactPreference: 'email', browserOs: '' });
      setFormErrors({});
      loadTickets();
      setTicketSubmitted(true);
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      setTicketSubmitError(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedTicket || !newMessage.trim()) return;
    setSendingMessage(true);

    const msgText = newMessage;
    const optimisticMsg: TicketMessageRow = {
      id: `temp-${Date.now()}`,
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message: msgText,
      is_staff_reply: false,
      created_at: new Date().toISOString(),
    };
    setTicketMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      const { error } = await supabase.rpc('user_reply_to_ticket', {
        p_ticket_id: selectedTicket.id,
        p_message: msgText,
      });

      if (error) throw error;

      await loadTicketMessages(selectedTicket.id);
      await loadTickets();
    } catch (error) {
      console.error('Error sending message:', error);
      setTicketMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(msgText);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleReopenTicket() {
    if (!selectedTicket) return;
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'open', updated_at: new Date().toISOString(), resolved_at: null })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      setSelectedTicket({ ...selectedTicket, status: 'open' });
      await loadTickets();
    } catch (error) {
      console.error('Error reopening ticket:', error);
    }
  }

  async function handleMarkHelpful(articleId: string) {
    try {
      const article = faqArticles.find((a) => a.id === articleId);
      if (!article) return;
      await supabase
        .from('faq_articles')
        .update({ helpful_count: article.helpful_count + 1 })
        .eq('id', articleId);
      loadFAQ();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  }

  function openTicketDetail(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    loadTicketMessages(ticket.id);
    setView('ticket-detail');
  }

  function validateContactForm(): boolean {
    const errors: { subject?: string; message?: string } = {};
    const subjectChars = countCharsNoSpaces(contactForm.subject);
    const messageChars = countCharsNoSpaces(contactForm.message);

    if (!contactForm.subject.trim()) {
      errors.subject = 'Subject is required.';
    } else if (subjectChars < 20) {
      errors.subject = `Subject must be at least 20 characters (excluding spaces). (${subjectChars}/20)`;
    }

    if (!contactForm.message.trim()) {
      errors.message = 'Message is required.';
    } else if (messageChars < 50) {
      errors.message = `Message must be at least 50 characters (excluding spaces). (${messageChars}/50)`;
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!validateContactForm()) return;
    setSendingContact(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
        }),
      });
      setContactSuccess(true);
      setContactForm((prev) => ({ ...prev, subject: '', message: '' }));
      setContactErrors({});
    } catch (err) {
      console.error('Contact send error:', err);
    } finally {
      setSendingContact(false);
    }
  }

  const filteredFAQ = faqArticles.filter(
    (article) =>
      article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFAQ = filteredFAQ.reduce((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, FAQArticle[]>);

  const filteredTickets = tickets.filter(
    (t) => ticketFilter === 'all' || t.status === ticketFilter
  );

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const waitingCount = tickets.filter((t) => t.status === 'waiting_response').length;

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading support center...</p>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    const displayArticles = faqArticles.length > 0 ? faqArticles.slice(0, 4) : STATIC_ARTICLES;

    return (
      <div className="space-y-6">

        {/* Hero Banner — matches DashboardHome exact pattern */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1f3d] via-[#0a1628] to-[#061020] dark:from-[#0a1628] dark:via-[#080e1e] dark:to-[#050a14] rounded-2xl border border-blue-900/40 dark:border-blue-800/30 px-6 sm:px-10 py-10 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.08),transparent_60%)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-5 shadow-lg shadow-blue-500/30">
                <Headphones className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-[28px] sm:text-[34px] font-bold text-white tracking-tight leading-tight mb-2">
                How can we help you?
              </h1>
              <p className="text-blue-200/70 text-[15px] max-w-md">
                Search our knowledge base or get in touch with our support team
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
              <div className="text-center px-5 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl min-w-[100px]">
                <p className="text-[11px] font-semibold text-blue-300/70 uppercase tracking-wider mb-0.5">Articles</p>
                <p className="text-[18px] font-bold text-white">{faqArticles.length || 22}</p>
              </div>
              <div className="text-center px-5 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl min-w-[100px]">
                <p className="text-[11px] font-semibold text-blue-300/70 uppercase tracking-wider mb-0.5">Response</p>
                <p className="text-[18px] font-bold text-white">24h</p>
              </div>
            </div>
          </div>

          {/* Search bar inside hero */}
          <div className="relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) {
                  if (onNavigate) onNavigate('knowledge-base');
                  else setView('faq');
                }
              }}
              className="w-full pl-12 pr-4 py-3.5 border border-white/[0.12] rounded-xl bg-white/[0.08] text-white placeholder-blue-200/40 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/50 transition-all"
            />
          </div>
        </div>

        {/* Action Cards — full width 3-column */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            onClick={() => onNavigate ? onNavigate('knowledge-base') : setView('faq')}
            className={`group ${cardClass} p-6 text-left hover:border-blue-400/50 dark:hover:border-blue-500/30 hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/15 dark:group-hover:bg-blue-500/20 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">Knowledge Base</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Browse FAQ articles and guides</p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {faqArticles.length || 22} articles available
            </p>
          </button>

          <button
            onClick={() => setView('tickets')}
            className={`group ${cardClass} p-6 text-left hover:border-emerald-400/50 dark:hover:border-emerald-500/30 hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/15 dark:group-hover:bg-emerald-500/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors mt-1" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">My Tickets</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">View and track your support requests</p>
            <div className="flex items-center gap-2 flex-wrap">
              {openCount > 0 && (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
                  {openCount} active
                </span>
              )}
              {waitingCount > 0 && (
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-500/20">
                  {waitingCount} awaiting reply
                </span>
              )}
              {openCount === 0 && waitingCount === 0 && (
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                  {tickets.length > 0 ? `${tickets.length} total tickets` : '8 active'}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setView('contact')}
            className={`group ${cardClass} p-6 text-left hover:border-orange-400/50 dark:hover:border-orange-500/30 hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center group-hover:bg-orange-500/15 dark:group-hover:bg-orange-500/20 transition-colors">
                <LifeBuoy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors mt-1" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">Contact Us</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Send us a message directly</p>
            <p className="text-xs text-gray-400 dark:text-gray-600">Average response time: 24 hours</p>
          </button>
        </div>

        {/* Popular Articles — full width 4-column grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
              Popular Articles
            </p>
            <button
              onClick={() => onNavigate ? onNavigate('knowledge-base') : setView('faq')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => {
                  if ('answer' in article) {
                    setExpandedFAQ(article.id);
                  }
                  setView('faq');
                }}
                className={`flex flex-col gap-3 ${cardClass} p-5 text-left hover:border-blue-400/50 dark:hover:border-blue-500/30 hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 group`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/15 dark:group-hover:bg-blue-500/20 transition-colors">
                  <HelpCircle className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.question}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mt-2">
                    {faqCategoryLabels[article.category] || article.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className={`${cardClass} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                Can't find what you're looking for?
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                Our support team is here to help — we typically respond within 24 hours.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setView('new-ticket')}
              className={secondaryBtnClass + ' text-sm'}
            >
              Create Ticket
            </button>
            <button
              onClick={() => setView('contact')}
              className={primaryBtnClass + ' text-sm'}
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'faq') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('home'); setSearchQuery(''); }}
            className={backBtnClass}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Knowledge Base</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Find answers to common questions</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-10 py-3 ${fieldClass.replace('w-full ', '')}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400" />
            </button>
          )}
        </div>

        {Object.entries(groupedFAQ).map(([category, articles]) => (
          <div key={category}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
              {faqCategoryLabels[category] || category}
            </p>
            <div className="space-y-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`${cardClass} overflow-hidden`}
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === article.id ? null : article.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4 text-sm leading-snug">
                      {article.question}
                    </span>
                    {expandedFAQ === article.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === article.id && (
                    <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {article.answer}
                      </p>
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                        <button
                          onClick={() => handleMarkHelpful(article.id)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Helpful ({article.helpful_count})
                        </button>
                        <span className="text-gray-200 dark:text-white/[0.08]">|</span>
                        <button
                          onClick={() => {
                            setFormData({ ...formData, subject: `Question about: ${article.question}` });
                            setView('new-ticket');
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          Still need help? Contact us
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredFAQ.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Try a different search or contact our team</p>
            <button
              onClick={() => setView('new-ticket')}
              className={primaryBtnClass}
            >
              <Plus className="w-4 h-4" />
              Create a Ticket
            </button>
          </div>
        )}
      </div>
    );
  }

  if (view === 'contact') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} className={backBtnClass}>
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Contact Us</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Send us a message and we'll respond within 24 hours</p>
          </div>
        </div>

        {contactSuccess ? (
          <div className={`${cardClass} p-10 text-center`}>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Thank you for reaching out. Our team will get back to you within 24 hours.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setContactSuccess(false); setView('home'); }}
                className={secondaryBtnClass}
              >
                Back to Support
              </button>
              <button
                onClick={() => setContactSuccess(false)}
                className={primaryBtnClass}
              >
                Send Another
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSendContact} className={`lg:col-span-2 ${cardClass} p-6 space-y-5`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Full Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className={fieldClass}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className={fieldClass}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Subject <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, subject: e.target.value });
                    if (contactErrors.subject) setContactErrors((prev) => ({ ...prev, subject: undefined }));
                  }}
                  className={contactErrors.subject ? fieldClassError : fieldClass}
                  placeholder="What is your message about?"
                />
                <div className="flex items-center justify-between mt-1">
                  {contactErrors.subject ? (
                    <p className="text-xs text-red-600 dark:text-red-400">{contactErrors.subject}</p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-xs ml-auto ${countCharsNoSpaces(contactForm.subject) >= 20 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}>
                    {countCharsNoSpaces(contactForm.subject)}/20 chars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message <span className="text-red-500">*</span>
                  </span>
                </label>
                <textarea
                  required
                  rows={7}
                  value={contactForm.message}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, message: e.target.value });
                    if (contactErrors.message) setContactErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  className={`${contactErrors.message ? fieldClassError : fieldClass} resize-none`}
                  placeholder="Please describe your question or issue in detail..."
                />
                <div className="flex items-center justify-between mt-1">
                  {contactErrors.message ? (
                    <p className="text-xs text-red-600 dark:text-red-400">{contactErrors.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-xs ml-auto ${countCharsNoSpaces(contactForm.message) >= 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}>
                    {countCharsNoSpaces(contactForm.message)}/50 chars
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setView('home')} className={`flex-1 ${secondaryBtnClass}`}>
                  Cancel
                </button>
                <button type="submit" disabled={sendingContact} className={`flex-1 ${primaryBtnClass}`}>
                  {sendingContact ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className={`${cardClass} p-5`}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Response Time</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">We typically respond within 24 hours on business days.</p>
              </div>
              <div className={`${cardClass} p-5`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Knowledge Base</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Many questions are answered in our FAQ articles.</p>
                <button
                  onClick={() => onNavigate ? onNavigate('knowledge-base') : setView('faq')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  Browse articles
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className={`${cardClass} p-5`}>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-3">
                  <LifeBuoy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Create a Ticket</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">For technical issues, a support ticket helps us track your request.</p>
                <button
                  onClick={() => setView('new-ticket')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  Open ticket
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'new-ticket') {
    const categoryCards: Array<{ key: string; label: string; icon: React.ReactNode; tip: string }> = [
      { key: 'technical', label: 'Technical', icon: <Wrench className="w-4 h-4" />, tip: 'Include steps to reproduce and any error messages you see.' },
      { key: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" />, tip: 'Have your invoice number or last 4 digits of your card handy.' },
      { key: 'feature_request', label: 'Feature Request', icon: <Lightbulb className="w-4 h-4" />, tip: 'Describe the feature and how it would help your workflow.' },
      { key: 'bug_report', label: 'Bug Report', icon: <Bug className="w-4 h-4" />, tip: 'Include your browser, OS, and exact steps to reproduce the bug.' },
      { key: 'other', label: 'Other', icon: <HelpCircle className="w-4 h-4" />, tip: 'Provide as much context as possible so we can route your request.' },
    ];

    const priorityCards: Array<{ key: string; label: string; desc: string; icon: React.ReactNode; color: string; dotColor: string; bg: string; border: string; activeBg: string; activeBorder: string }> = [
      { key: 'low', label: 'Low', desc: 'No rush', icon: <Circle className="w-3.5 h-3.5" />, color: 'text-gray-600 dark:text-gray-400', dotColor: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-white/[0.03]', border: 'border-gray-200 dark:border-white/[0.07]', activeBg: 'bg-gray-100 dark:bg-white/[0.08]', activeBorder: 'border-gray-400 dark:border-gray-400' },
      { key: 'medium', label: 'Medium', desc: 'When possible', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-500/5', border: 'border-blue-100 dark:border-blue-500/10', activeBg: 'bg-blue-50 dark:bg-blue-500/15', activeBorder: 'border-blue-500 dark:border-blue-400' },
      { key: 'high', label: 'High', desc: 'Blocking work', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-orange-600 dark:text-orange-400', dotColor: 'bg-orange-500', bg: 'bg-orange-50/50 dark:bg-orange-500/5', border: 'border-orange-100 dark:border-orange-500/10', activeBg: 'bg-orange-50 dark:bg-orange-500/15', activeBorder: 'border-orange-500 dark:border-orange-400' },
      { key: 'urgent', label: 'Urgent', desc: 'Critical issue', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500', bg: 'bg-red-50/50 dark:bg-red-500/5', border: 'border-red-100 dark:border-red-500/10', activeBg: 'bg-red-50 dark:bg-red-500/15', activeBorder: 'border-red-500 dark:border-red-400' },
    ];

    const affectedAreaOptions: Array<{ key: string; label: string; icon: React.ReactNode }> = [
      { key: 'dashboard', label: 'Dashboard', icon: <Layout className="w-3.5 h-3.5" /> },
      { key: 'transactions', label: 'Transactions', icon: <ArrowRightCircle className="w-3.5 h-3.5" /> },
      { key: 'budget', label: 'Budget', icon: <Target className="w-3.5 h-3.5" /> },
      { key: 'reports', label: 'Reports', icon: <BarChart2 className="w-3.5 h-3.5" /> },
      { key: 'goals', label: 'Goals', icon: <Zap className="w-3.5 h-3.5" /> },
      { key: 'billing', label: 'Billing', icon: <CreditCard className="w-3.5 h-3.5" /> },
      { key: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
      { key: 'other', label: 'Other', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    ];

    const requiredFields = [formData.subject, formData.description, formData.category, formData.priority];
    const filledCount = requiredFields.filter((v) => v.trim().length > 0).length;

    function toggleAffectedArea(key: string) {
      setFormData((prev) => ({
        ...prev,
        affectedAreas: prev.affectedAreas.includes(key)
          ? prev.affectedAreas.filter((k) => k !== key)
          : [...prev.affectedAreas, key],
      }));
    }
    const progressPct = (filledCount / 4) * 100;

    const selectedCategoryTip = categoryCards.find((c) => c.key === formData.category)?.tip;

    function autoDetectBrowserOs() {
      const ua = navigator.userAgent;
      let os = 'Unknown OS';
      if (ua.includes('Win')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
      let browser = 'Unknown Browser';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
      else if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
      setFormData((prev) => ({ ...prev, browserOs: `${browser} on ${os}` }));
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('tickets'); setTicketSubmitted(false); setTicketSubmitError(null); }}
            className={backBtnClass}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create Support Ticket</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Describe your issue and we will get back to you</p>
          </div>
        </div>

        {ticketSubmitted ? (
          <div className={`${cardClass} p-12 text-center`}>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ticket Submitted!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Thank you for reaching out. Our support team will review your ticket and respond within 24 hours.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setTicketSubmitted(false); setView('tickets'); }}
                className={secondaryBtnClass}
              >
                Back to My Tickets
              </button>
              <button
                onClick={() => setTicketSubmitted(false)}
                className={primaryBtnClass}
              >
                Create Another Ticket
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Main form — 2/3 width */}
            <form onSubmit={handleCreateTicket} className="lg:col-span-2 space-y-5">

              {/* Section 1: About Your Issue */}
              <div className={`${cardClass} p-6 space-y-5`}>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm shadow-blue-500/20">1</div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">About Your Issue</span>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Subject <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      if (formErrors.subject) setFormErrors((prev) => ({ ...prev, subject: undefined }));
                    }}
                    className={formErrors.subject ? fieldClassError : fieldClass}
                    placeholder="Brief summary of your issue (minimum 20 characters)"
                  />
                  <div className="flex items-center justify-between mt-1">
                    {formErrors.subject ? (
                      <p className="text-xs text-red-600 dark:text-red-400">{formErrors.subject}</p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-600">Minimum 20 characters required (excluding spaces)</p>
                    )}
                    <span className={`text-xs ml-auto font-medium ${countCharsNoSpaces(formData.subject) >= 20 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {countCharsNoSpaces(formData.subject)}/20 chars
                    </span>
                  </div>
                </div>

                {/* Category picker */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {categoryCards.map((cat) => {
                      const isSelected = formData.category === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.key })}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl border text-center transition-all duration-150 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 shadow-md shadow-blue-500/15 -translate-y-0.5'
                              : 'border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/40 dark:hover:bg-blue-500/5 hover:-translate-y-0.5 hover:shadow-sm dark:hover:shadow-black/20'
                          }`}
                        >
                          <span className={`${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {cat.icon}
                          </span>
                          <span className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                            {cat.label}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedCategoryTip && (
                    <div className="flex items-start gap-2 mt-2.5 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/15">
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">{selectedCategoryTip}</p>
                    </div>
                  )}
                </div>

                {/* Priority picker */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {priorityCards.map((p) => {
                      const isSelected = formData.priority === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p.key })}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-xl border text-center transition-all duration-150 ${
                            isSelected
                              ? `${p.activeBg} ${p.activeBorder} shadow-sm -translate-y-0.5`
                              : `${p.bg} ${p.border} hover:opacity-80 hover:-translate-y-0.5`
                          }`}
                        >
                          <span className={`${isSelected ? p.color : 'text-gray-400 dark:text-gray-600'} transition-colors`}>{p.icon}</span>
                          <span className={`text-[12px] font-bold ${p.color}`}>{p.label}</span>
                          <span className={`text-[10px] ${isSelected ? p.color : 'text-gray-400 dark:text-gray-600'} leading-tight`}>{p.desc}</span>
                          {isSelected && (
                            <span className={`w-1.5 h-1.5 rounded-full ${p.dotColor}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 2: Description & Context */}
              <div className={`${cardClass} p-6 space-y-5`}>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm shadow-blue-500/20">2</div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Description & Context</span>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDescTips((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <Info className="w-3 h-3" />
                      {showDescTips ? 'Hide tips' : 'Writing tips'}
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDescTips ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {showDescTips && (
                    <div className="mb-2.5 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-lg">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Good descriptions include:</p>
                      <ul className="space-y-1">
                        {['What you were trying to do', 'What happened instead', 'Any error messages shown', 'Steps you already tried', 'How often this happens'].map((tip) => (
                          <li key={tip} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: undefined }));
                    }}
                    className={`${formErrors.description ? fieldClassError : fieldClass} resize-none`}
                    placeholder="Please provide as much detail as possible... (minimum 50 characters)"
                  />
                  <div className="flex items-center justify-between mt-1">
                    {formErrors.description ? (
                      <p className="text-xs text-red-600 dark:text-red-400">{formErrors.description}</p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-600">Minimum 50 characters required (excluding spaces)</p>
                    )}
                    <span className={`text-xs ml-auto font-medium ${countCharsNoSpaces(formData.description) >= 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {countCharsNoSpaces(formData.description)}/50 chars
                    </span>
                  </div>
                </div>

                {/* Affected Area */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Affected Area
                    <span className="ml-1.5 text-[11px] font-normal text-gray-400 dark:text-gray-600">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {affectedAreaOptions.map((area) => {
                      const isSelected = formData.affectedAreas.includes(area.key);
                      return (
                        <button
                          key={area.key}
                          type="button"
                          onClick={() => toggleAffectedArea(area.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                              : 'bg-white dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/[0.07] hover:border-blue-400 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                        >
                          <span className={isSelected ? 'text-white' : ''}>{area.icon}</span>
                          {area.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Steps Taken */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Steps Already Tried
                    <span className="ml-1.5 text-[11px] font-normal text-gray-400 dark:text-gray-600">(optional — helps us skip what you've already done)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.stepsTaken}
                    onChange={(e) => setFormData({ ...formData, stepsTaken: e.target.value })}
                    className={`${fieldClass} resize-none`}
                    placeholder="e.g. Cleared browser cache, tried a different browser, logged out and back in..."
                  />
                </div>
              </div>

              {/* Section 3: Environment & Preferences */}
              <div className={`${cardClass} p-6 space-y-5`}>
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm shadow-blue-500/20">3</div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Environment & Preferences</span>
                </div>

                {/* Browser / OS */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Browser & OS
                    <span className="ml-1.5 text-[11px] font-normal text-gray-400 dark:text-gray-600">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.browserOs}
                      onChange={(e) => setFormData({ ...formData, browserOs: e.target.value })}
                      className={`${fieldClass} flex-1`}
                      placeholder="e.g. Chrome on Windows 11"
                    />
                    <button
                      type="button"
                      onClick={autoDetectBrowserOs}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 text-xs font-medium hover:border-blue-400 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all whitespace-nowrap"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Auto-detect
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Helps our team reproduce the issue in your environment</p>
                </div>

                {/* Contact Preference */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Response Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'email', label: 'Email me back', desc: 'We reply to your account email', icon: <Mail className="w-4 h-4" /> },
                      { key: 'in_app', label: 'In-app only', desc: 'Replies visible here in tickets', icon: <MessageSquare className="w-4 h-4" /> },
                    ].map((opt) => {
                      const isSelected = formData.contactPreference === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, contactPreference: opt.key })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 shadow-sm shadow-blue-500/10'
                              : 'border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] hover:border-blue-300 dark:hover:border-blue-500/30'
                          }`}
                        >
                          <span className={`flex-shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
                            {opt.icon}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                              {opt.label}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-500 dark:text-blue-400/70' : 'text-gray-400 dark:text-gray-600'}`}>
                              {opt.desc}
                            </p>
                          </div>
                          {isSelected && (
                            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {ticketSubmitError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{ticketSubmitError}</p>
                </div>
              )}

              {/* Bottom action bar */}
              <div className={`${cardClass} px-5 py-4 flex items-center justify-between gap-4`}>
                <button type="button" onClick={() => setView('tickets')} className={secondaryBtnClass}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingTicket} className={primaryBtnClass}>
                  {submittingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sticky sidebar — 1/3 width */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {/* Form Completion progress */}
              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Form Completion
                  </span>
                  <span className={`text-xs font-semibold ${filledCount === 4 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {filledCount} of 4
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${filledCount === 4 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Subject', filled: formData.subject.trim().length > 0 },
                    { label: 'Category', filled: formData.category.length > 0 },
                    { label: 'Priority', filled: formData.priority.length > 0 },
                    { label: 'Description', filled: formData.description.trim().length > 0 },
                  ].map((field) => (
                    <div key={field.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${field.filled ? 'bg-green-500' : 'bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08]'}`}>
                        {field.filled && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-xs ${field.filled ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                        {field.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category tip */}
              {selectedCategoryTip && (
                <div className={`${cardClass} p-5`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tip for {categoryConfig[formData.category]?.label || formData.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{selectedCategoryTip}</p>
                </div>
              )}

              {/* Summary card */}
              {(formData.priority || formData.affectedAreas.length > 0) && (
                <div className={`${cardClass} p-5`}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">Summary</p>
                  <div className="space-y-2">
                    {formData.priority && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Priority</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityConfig[formData.priority]?.color || ''}`}>
                          {priorityConfig[formData.priority]?.label}
                        </span>
                      </div>
                    )}
                    {formData.affectedAreas.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Affected areas</span>
                        <div className="flex flex-wrap gap-1">
                          {formData.affectedAreas.map((area) => (
                            <span key={area} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/15">
                              {affectedAreaOptions.find(a => a.key === area)?.label || area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Help text */}
              <div className={`${cardClass} p-5`}>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center mb-3">
                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Need help faster?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">Check our knowledge base — many issues have immediate answers.</p>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('knowledge-base') : setView('faq')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  Browse knowledge base
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'ticket-detail' && selectedTicket) {
    const cfg = statusConfig[selectedTicket.status] || statusConfig.open;
    const StatusIcon = cfg.icon;
    const isClosed = selectedTicket.status === 'closed' || selectedTicket.status === 'resolved';
    const currentStatusIdx = STATUS_ORDER.indexOf(selectedTicket.status);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('tickets')} className={backBtnClass}>
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{selectedTicket.subject}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[selectedTicket.priority]?.color || ''}`}>
                {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {categoryConfig[selectedTicket.category]?.label} &mdash; Created {relativeTime(selectedTicket.created_at)}
              </span>
            </div>
          </div>
          {isClosed && (
            <button
              onClick={handleReopenTicket}
              className={`flex items-center gap-2 px-4 py-2 ${secondaryBtnClass}`}
            >
              <RotateCcw className="w-4 h-4" />
              Reopen
            </button>
          )}
        </div>

        {/* Status Progress */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center">
            {STATUS_ORDER.map((step, i) => {
              const stepCfg = statusConfig[step];
              const isActive = step === selectedTicket.status;
              const isPast = currentStatusIdx >= i;

              const circleClass = isActive
                ? 'w-8 h-8 rounded-full flex items-center justify-center flex-none ring-2 ring-offset-2 dark:ring-offset-[#0B0F1A] bg-blue-600 text-white ring-blue-600'
                : isPast
                ? 'w-8 h-8 rounded-full flex items-center justify-center flex-none bg-green-500 text-white'
                : 'w-8 h-8 rounded-full flex items-center justify-center flex-none bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-white/[0.08]';

              const lineClass = isPast && currentStatusIdx > i
                ? 'flex-1 h-0.5 bg-green-400 dark:bg-green-500/50 mx-1'
                : 'flex-1 h-0.5 bg-gray-100 dark:bg-white/[0.06] mx-1';

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={circleClass}>
                      {isActive ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      ) : isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-semibold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-blue-600 dark:text-blue-400' : isPast ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {stepCfg.label}
                    </span>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={lineClass} style={{ marginBottom: '14px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className={`${cardClass} overflow-hidden`}>
          <div className="max-h-[50vh] overflow-y-auto p-6 space-y-4">
            {ticketMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
              </div>
            ) : (
              ticketMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_staff_reply ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="max-w-[80%]">
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.is_staff_reply
                        ? 'bg-gray-100 dark:bg-white/[0.06] rounded-tl-md'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 rounded-tr-md'
                    }`}>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.is_staff_reply ? 'text-gray-800 dark:text-gray-200' : 'text-white'
                      }`}>
                        {msg.message}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-1 ${msg.is_staff_reply ? '' : 'justify-end'}`}>
                      {msg.is_staff_reply && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Support Team
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-600">{relativeTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isClosed ? (
            <form onSubmit={handleSendMessage} className="border-t border-gray-100 dark:border-white/[0.06] p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={2}
                  className={`flex-1 ${fieldClass} resize-none`}
                  required
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="flex items-center justify-center w-11 h-11 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50 flex-shrink-0 shadow-sm shadow-blue-500/20"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-gray-100 dark:border-white/[0.06] px-6 py-4 bg-gray-50/50 dark:bg-white/[0.02] text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This ticket is {selectedTicket.status}.
                <button onClick={handleReopenTicket} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-1 font-medium">
                  Reopen it
                </button>
                {' '}to continue the conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} className={backBtnClass}>
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Tickets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tickets.length} support requests</p>
          </div>
        </div>
        <button
          onClick={() => setView('new-ticket')}
          className={primaryBtnClass}
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {ticketSuccessMessage && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-4 py-3.5">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">{ticketSuccessMessage}</p>
          </div>
          <button onClick={() => setTicketSuccessMessage(null)} className="text-green-500 hover:text-green-700 dark:text-green-500 dark:hover:text-green-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All', count: tickets.length },
          { key: 'open', label: 'Open', count: tickets.filter((t) => t.status === 'open').length },
          { key: 'in_progress', label: 'In Progress', count: tickets.filter((t) => t.status === 'in_progress').length },
          { key: 'waiting_response', label: 'Awaiting Reply', count: tickets.filter((t) => t.status === 'waiting_response').length },
          { key: 'resolved', label: 'Resolved', count: tickets.filter((t) => t.status === 'resolved').length },
          { key: 'closed', label: 'Closed', count: tickets.filter((t) => t.status === 'closed').length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setTicketFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              ticketFilter === f.key
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-white/[0.07] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                ticketFilter === f.key
                  ? 'bg-blue-500/30 text-white'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredTickets.length === 0 ? (
        <div className={`text-center py-16 ${cardClass}`}>
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            {ticketFilter === 'all' ? 'No tickets yet' : 'No tickets match this filter'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {ticketFilter === 'all'
              ? 'Create a ticket to get help from our support team'
              : 'Try selecting a different filter'}
          </p>
          {ticketFilter === 'all' && (
            <button
              onClick={() => setView('new-ticket')}
              className={primaryBtnClass}
            >
              <Plus className="w-4 h-4" />
              Create Your First Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const tcfg = statusConfig[ticket.status] || statusConfig.open;
            const TIcon = tcfg.icon;
            return (
              <div
                key={ticket.id}
                onClick={() => openTicketDetail(ticket)}
                className={`${cardClass} p-5 hover:border-blue-400/50 dark:hover:border-blue-500/30 hover:shadow-sm dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tcfg.bg} ${tcfg.color}`}>
                        <TIcon className="w-3 h-3" />
                        {tcfg.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[ticket.priority]?.color || ''}`}>
                        {priorityConfig[ticket.priority]?.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">
                        {categoryConfig[ticket.category]?.label}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{ticket.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap flex-shrink-0">
                    {relativeTime(ticket.updated_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
