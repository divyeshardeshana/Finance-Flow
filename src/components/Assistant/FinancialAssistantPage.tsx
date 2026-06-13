import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Lightbulb,
  Bot,
  CheckCircle,
  PiggyBank,
  Receipt,
  BarChart3,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getCurrencySymbol } from '../../lib/currency';

interface Message {
  id: string;
  message: string;
  message_type: 'user' | 'assistant';
  created_at: string;
}

interface SuggestedQuestion {
  icon: React.ElementType;
  question: string;
  category: string;
  color: string;
  bgColor: string;
}

interface FeatureAccess {
  isEnabled: boolean;
  promptLimit: number | null;
  loaded: boolean;
}

export function FinancialAssistantPage() {
  const { user, refreshSession, forceRefreshSession } = useAuth();
  const { preferences } = useAppPreferences();
  const { tier } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>({ isEnabled: false, promptLimit: null, loaded: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currencySymbol = getCurrencySymbol(preferences.currency || 'USD');

  const suggestedQuestions: SuggestedQuestion[] = [
    {
      icon: PiggyBank,
      question: 'How much can I save this month if I skip Netflix?',
      category: 'Savings',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: Receipt,
      question: 'What was my biggest expense last week?',
      category: 'Spending',
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: BarChart3,
      question: 'Am I staying within my budget?',
      category: 'Budget',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: RefreshCw,
      question: 'How much do I spend on subscriptions?',
      category: 'Recurring',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: ShoppingCart,
      question: `Can I afford a ${currencySymbol}500 purchase?`,
      category: 'Planning',
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10',
    },
    {
      icon: TrendingUp,
      question: 'What are my top spending categories?',
      category: 'Analysis',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/10',
    },
  ];

  const capabilities = [
    'Analyze your spending patterns and identify trends',
    'Track budget performance and suggest optimizations',
    'Calculate savings potential from reducing expenses',
    'Review recurring subscriptions and memberships',
    'Assess affordability for planned purchases',
    'Monitor progress toward savings goals',
  ];

  useEffect(() => {
    loadFeatureAccess();
  }, [tier]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const loadFeatureAccess = async () => {
    if (!user || !tier) return;
    try {
      const { data: tierData } = await supabase
        .from('subscription_tiers')
        .select('id')
        .eq('tier_name', tier)
        .maybeSingle();

      if (!tierData?.id) {
        setFeatureAccess({ isEnabled: false, promptLimit: null, loaded: true });
        return;
      }

      const { data: configData } = await supabase
        .from('feature_tier_config')
        .select('is_enabled, prompt_limit')
        .eq('feature_name', 'financial_assistant')
        .eq('tier_id', tierData.id)
        .maybeSingle();

      setFeatureAccess({
        isEnabled: configData?.is_enabled ?? false,
        promptLimit: configData?.prompt_limit ?? null,
        loaded: true,
      });
    } catch {
      setFeatureAccess({ isEnabled: false, promptLimit: null, loaded: true });
    }
  };

  const isLimitReached = featureAccess.promptLimit !== null && promptsUsed >= featureAccess.promptLimit;

  const getValidToken = async (): Promise<string> => {
    const token = await refreshSession();
    if (!token) {
      throw new Error('AUTH_ERROR: No active session found. Please sign in again.');
    }
    return token;
  };

  const callAssistantApi = async (token: string, messageToSend: string, currentMessages: Message[]): Promise<string> => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-assistant`;

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: messageToSend,
          currency: preferences.currency,
          conversationHistory: currentMessages.map(m => ({
            role: m.message_type === 'user' ? 'user' : 'assistant',
            content: m.message,
          })),
        }),
      });
    } catch (fetchErr) {
      throw new Error('NETWORK_ERROR: Unable to reach the financial assistant service. Please check your internet connection.');
    }

    let result: { answer?: string; error?: string; errorCode?: string };
    let rawText = '';
    try {
      rawText = await response.text();
      result = JSON.parse(rawText);
    } catch {
      throw new Error(`SERVER_ERROR: The server returned an invalid response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      const serverMsg = result?.error || '';
      if (serverMsg.toLowerCase().includes('openai') || result?.errorCode === 'OPENAI_ERROR') {
        throw new Error('OpenAI service connection error - please verify API configuration in Admin › Settings.');
      }
      if (serverMsg.toLowerCase().includes('financial data') || result?.errorCode === 'DATA_ERROR') {
        throw new Error('Unable to access current financial data - please check data permissions.');
      }
      if (response.status === 401 || result?.errorCode === 'AUTH_EXPIRED' || serverMsg.toLowerCase().includes('unauthorized')) {
        throw new Error('AUTH_RETRY');
      }
      throw new Error(serverMsg || `Server error (HTTP ${response.status}). Please try again.`);
    }

    if (!result.answer) {
      throw new Error('The assistant returned an empty response. Please try rephrasing your question.');
    }

    return result.answer;
  };

  const sendMessage = async (questionText?: string) => {
    const messageToSend = questionText || input.trim();
    if (!messageToSend || loading || isLimitReached || !featureAccess.isEnabled) return;

    let token: string;
    try {
      token = await getValidToken();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const displayMessage = raw.startsWith('AUTH_ERROR:') ? raw.replace('AUTH_ERROR:', '').trim() : raw;
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        message: displayMessage,
        message_type: 'assistant',
        created_at: new Date().toISOString(),
      }]);
      return;
    }

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    const userMessageId = crypto.randomUUID();
    const userMessage: Message = {
      id: userMessageId,
      message: messageToSend,
      message_type: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const historySnapshot = [...messages, userMessage];

    try {
      let answer: string;
      try {
        answer = await callAssistantApi(token, messageToSend, historySnapshot.slice(0, -1));
      } catch (firstErr) {
        const raw = firstErr instanceof Error ? firstErr.message : String(firstErr);
        if (raw !== 'AUTH_RETRY') throw firstErr;

        const newToken = await forceRefreshSession();
        if (!newToken) {
          throw new Error('Your session could not be renewed. Please sign out and sign back in.');
        }

        try {
          answer = await callAssistantApi(newToken, messageToSend, historySnapshot.slice(0, -1));
        } catch (retryErr) {
          const retryRaw = retryErr instanceof Error ? retryErr.message : String(retryErr);
          if (retryRaw === 'AUTH_RETRY') {
            throw new Error('Authentication failed after retry. Please sign out and sign back in.');
          }
          throw retryErr;
        }
      }

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        message: answer,
        message_type: 'assistant',
        created_at: new Date().toISOString(),
      }]);
      setPromptsUsed((prev) => prev + 1);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);

      let displayMessage: string;
      if (raw.startsWith('OpenAI service connection error')) {
        displayMessage = raw;
      } else if (raw.startsWith('Unable to access current financial data')) {
        displayMessage = raw;
      } else if (raw.startsWith('NETWORK_ERROR:')) {
        displayMessage = raw.replace('NETWORK_ERROR:', '').trim();
      } else if (raw.startsWith('SERVER_ERROR:')) {
        displayMessage = raw.replace('SERVER_ERROR:', '').trim();
      } else if (raw === 'AUTH_RETRY') {
        displayMessage = 'Your session has expired. Please sign out and sign back in to continue.';
      } else {
        displayMessage = raw || 'An unexpected error occurred. Please try again.';
      }

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        message: displayMessage,
        message_type: 'assistant',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    if (!confirm('Are you sure you want to clear the conversation?')) return;
    setMessages([]);
    setPromptsUsed(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const promptCounterColor = () => {
    if (!featureAccess.promptLimit) return 'text-gray-400 dark:text-gray-500';
    const pct = promptsUsed / featureAccess.promptLimit;
    if (pct >= 1) return 'text-red-500 dark:text-red-400';
    if (pct >= 0.8) return 'text-amber-500 dark:text-amber-400';
    return 'text-gray-400 dark:text-gray-500';
  };

  if (featureAccess.loaded && !featureAccess.isEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
            Financial Assistant
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            AI-powered financial advice and chat.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.05] rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-2">
            Feature Not Available on Your Plan
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
            The Financial Assistant is not included in your current plan. Upgrade to a higher tier to get AI-powered financial insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
          Financial Assistant
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
          Ask me anything about your finances. I analyze your spending, budgets, and savings to provide personalized insights.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden flex flex-col h-[640px]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Chat</h2>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {messages.length > 0 ? `${messages.length} message${messages.length !== 1 ? 's' : ''}` : 'Ready to help'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {featureAccess.loaded && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] ${promptCounterColor()}`}>
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[11px] font-medium tabular-nums">
                      {featureAccess.promptLimit !== null
                        ? `${promptsUsed} / ${featureAccess.promptLimit} prompts`
                        : `${promptsUsed} prompt${promptsUsed !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}
                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-blue-500" />
                  </div>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                    Welcome to Your Financial Assistant
                  </p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                    I'm here to help you understand your finances better. Ask me questions or try one of the suggestions on the right.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.message_type === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                        msg.message_type === 'user'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-gray-50/80 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] text-gray-900 dark:text-white rounded-bl-sm'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <span className={`text-[11px] mt-1.5 block ${msg.message_type === 'user' ? 'text-blue-100/70' : 'text-gray-400 dark:text-gray-600'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="bg-gray-50/80 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-white/[0.06] flex-shrink-0 space-y-3">
              {isLimitReached ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/[0.08] border border-red-200 dark:border-red-500/30 rounded-xl">
                  <MessageSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-[12px] text-red-600 dark:text-red-400 leading-snug">
                    You've used all {featureAccess.promptLimit} prompts for this session. Start a new session to continue.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2.5">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        adjustTextareaHeight();
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about your finances..."
                      rows={1}
                      disabled={loading}
                      className="flex-1 resize-none px-3.5 py-2.5 border border-gray-200/80 dark:border-white/[0.07] rounded-xl bg-white dark:bg-white/[0.04] text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all leading-relaxed overflow-hidden"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 dark:disabled:bg-white/[0.06] disabled:text-gray-400 dark:disabled:text-gray-600 text-white rounded-xl transition-all flex-shrink-0 shadow-sm"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
                    Press Enter to send &middot; Shift+Enter for new line
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Suggested Questions</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Click to ask instantly</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {suggestedQuestions.map((sq, idx) => {
                const Icon = sq.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sq.question)}
                    disabled={loading || isLimitReached}
                    className="w-full text-left p-3.5 rounded-xl border border-gray-200/60 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02] hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:bg-blue-500/[0.04] dark:hover:bg-blue-500/[0.04] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg ${sq.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-3.5 h-3.5 ${sq.color}`} />
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide block mb-0.5 ${sq.color}`}>
                          {sq.category}
                        </span>
                        <span className="text-[12px] text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug">
                          {sq.question}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">What I Can Help With</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">My core capabilities</p>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {capabilities.map((cap, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.10]"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
