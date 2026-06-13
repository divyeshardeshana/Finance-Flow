import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FinancialData {
  transactions: Array<{
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    transaction_date: string;
  }>;
  budgets: Array<{
    category: string;
    amount: number;
    spent?: number;
  }>;
  savingsGoals: Array<{
    name: string;
    target_amount: number;
    current_amount: number;
  }>;
  userProfile: {
    average_monthly_income: number;
    user_type: string;
  };
}

interface AssistantRequest {
  question: string;
  currency?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

const currencySymbols: Record<string, string> = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', INR: '\u20B9', JPY: '\u00A5',
  CNY: '\u00A5', AUD: 'A$', CAD: 'C$', CHF: 'CHF ', AED: 'AED ',
};

function fmtCur(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function extractAmount(question: string): number | null {
  const cleaned = question.replace(/[,_]/g, '');
  const patterns = [
    /(?:rs\.?|inr|\u20B9)\s*([0-9]+(?:\.[0-9]+)?)/i,
    /\$\s*([0-9]+(?:\.[0-9]+)?)/,
    /€\s*([0-9]+(?:\.[0-9]+)?)/,
    /£\s*([0-9]+(?:\.[0-9]+)?)/,
    /(?:aed|chf|aud|cad|cny|jpy)\s*([0-9]+(?:\.[0-9]+)?)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:rs\.?|inr|rupees?)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:dollars?|usd)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:euros?|eur)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(?:pounds?|gbp)/i,
    /\b([0-9]{2,}(?:\.[0-9]+)?)\b/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}

function buildFinancialContext(data: FinancialData, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const thisMonthExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const thisMonthIncome = data.transactions
    .filter(t => t.type === 'income' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const avgIncome = data.userProfile.average_monthly_income;

  const byCategory = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((acc: Record<string, number>, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += parseFloat(String(t.amount));
      return acc;
    }, {});

  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: ${fmtCur(amt as number, currency)}`)
    .join(', ');

  const goalsInfo = data.savingsGoals.map(g => {
    const pct = g.target_amount > 0 ? ((g.current_amount / g.target_amount) * 100).toFixed(1) : '0';
    return `${g.name} (${pct}% of ${fmtCur(g.target_amount, currency)})`;
  }).join(', ');

  const budgetInfo = data.budgets.map(b => {
    const spent = b.spent || 0;
    const status = spent > b.amount ? 'OVER BUDGET' : 'on track';
    return `${b.category}: spent ${fmtCur(spent, currency)} of ${fmtCur(b.amount, currency)} (${status})`;
  }).join(', ');

  return `User Financial Summary (currency: ${currency}):
- This month income: ${fmtCur(thisMonthIncome, currency)}
- This month expenses: ${fmtCur(thisMonthExpenses, currency)}
- Net this month: ${fmtCur(thisMonthIncome - thisMonthExpenses, currency)}
- Average monthly income: ${fmtCur(avgIncome, currency)}
- Expense categories this month: ${categoryBreakdown || 'none recorded'}
- Budgets: ${budgetInfo || 'none set'}
- Savings goals: ${goalsInfo || 'none set'}
- Recent transactions count: ${data.transactions.length}`;
}

class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIError';
  }
}

class DataAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataAccessError';
  }
}

async function askOpenAI(
  question: string,
  financialContext: string,
  conversationHistory: Array<{ role: string; content: string }>,
  apiKey: string,
  model: string
): Promise<string> {
  const systemPrompt = `You are a helpful personal financial assistant. You have access to the user's real financial data shown below. Use this data to give specific, accurate, and actionable financial advice. Be concise, friendly, and practical. Always reference actual numbers from their data when relevant.

${financialContext}

Guidelines:
- Give specific advice based on their actual financial data
- Be encouraging but honest about their financial situation
- Keep responses concise (2-4 paragraphs max)
- Format numbers clearly with the user's currency symbol
- If you need data that isn't available, say so briefly and suggest what to add`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: question },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new OpenAIError(`OpenAI error (${response.status}): ${errData?.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new OpenAIError('No content returned from OpenAI');
  return content;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', errorCode: 'AUTH_EXPIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    const { question, currency = 'USD', conversationHistory = [] }: AssistantRequest = await req.json();

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new Error('Question is required');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let financialData: FinancialData;
    try {
      financialData = await fetchUserFinancialData(supabaseUser, userId);
    } catch (dataErr) {
      console.error('Failed to fetch financial data:', dataErr);
      throw new DataAccessError('Unable to access current financial data - please check data permissions');
    }

    const [apiKeyRes, modelRes] = await Promise.all([
      supabaseAdmin.from('system_settings').select('setting_value').eq('setting_key', 'openai_api_key').maybeSingle(),
      supabaseAdmin.from('system_settings').select('setting_value').eq('setting_key', 'openai_model').maybeSingle(),
    ]);

    const openaiApiKey = apiKeyRes.data?.setting_value || '';
    const openaiModel = modelRes.data?.setting_value || 'gpt-4o-mini';

    let answer: string;

    if (openaiApiKey && openaiApiKey.startsWith('sk-')) {
      try {
        const financialContext = buildFinancialContext(financialData, currency);
        answer = await askOpenAI(question, financialContext, conversationHistory, openaiApiKey, openaiModel);
      } catch (openaiErr) {
        console.error('OpenAI call failed, falling back to rule-based analysis:', openaiErr);
        answer = analyzeFinancialQuestion(question, financialData, currency);
      }
    } else {
      answer = analyzeFinancialQuestion(question, financialData, currency);
    }

    try {
      await supabaseAdmin.from('assistant_conversations').insert([
        {
          user_id: userId,
          message: question.substring(0, 2000),
          message_type: 'user',
          context_data: null,
        },
        {
          user_id: userId,
          message: answer.substring(0, 5000),
          message_type: 'assistant',
          insights: { analyzed: true },
        },
      ]);
    } catch (saveErr) {
      console.error('Non-fatal: failed to save conversation:', saveErr);
    }

    return new Response(
      JSON.stringify({ answer, data: financialData }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    let errorCode = 'INTERNAL_ERROR';
    let status = 500;
    let message = error instanceof Error ? error.message : 'Internal server error';

    if (error instanceof DataAccessError) {
      errorCode = 'DATA_ERROR';
      status = 503;
    } else if (error instanceof OpenAIError) {
      errorCode = 'OPENAI_ERROR';
      message = 'OpenAI service connection error - please verify API configuration';
      status = 502;
    } else if (message === 'Unauthorized') {
      errorCode = 'AUTH_ERROR';
      status = 401;
    }

    return new Response(
      JSON.stringify({ error: message, errorCode }),
      {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function fetchUserFinancialData(supabase: any, userId: string): Promise<FinancialData> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const [transactionsRes, budgetsRes, savingsRes, profileRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, type, category, description, transaction_date')
      .eq('user_id', userId)
      .gte('transaction_date', new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0])
      .order('transaction_date', { ascending: false })
      .then((r: any) => r)
      .catch(() => ({ data: [] })),
    supabase
      .from('budgets')
      .select('category, amount, month')
      .eq('user_id', userId)
      .gte('month', firstDayOfMonth)
      .then((r: any) => r)
      .catch(() => ({ data: [] })),
    supabase
      .from('savings_goals')
      .select('name, target_amount, current_amount, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .then((r: any) => r)
      .catch(() => ({ data: [] })),
    supabase
      .from('user_profiles')
      .select('average_monthly_income, user_type')
      .eq('id', userId)
      .maybeSingle()
      .then((r: any) => r)
      .catch(() => ({ data: null })),
  ]);

  const transactions = transactionsRes.data || [];
  const budgets = (budgetsRes.data || []).map((b: any) => {
    const spent = transactions
      .filter((t: any) => t.type === 'expense' && t.category === b.category && t.transaction_date >= firstDayOfMonth)
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    return { ...b, spent };
  });

  return {
    transactions,
    budgets,
    savingsGoals: savingsRes.data || [],
    userProfile: profileRes.data || { average_monthly_income: 0, user_type: 'individual' },
  };
}

function analyzeFinancialQuestion(question: string, data: FinancialData, currency: string): string {
  const lowerQuestion = question.toLowerCase();

  const isAffordabilityQuestion =
    lowerQuestion.includes('afford') ||
    lowerQuestion.includes('can i buy') ||
    lowerQuestion.includes('can i purchase') ||
    lowerQuestion.includes('can i spend') ||
    lowerQuestion.includes('should i buy') ||
    lowerQuestion.includes('is it okay to buy') ||
    lowerQuestion.includes('ok to buy') ||
    (lowerQuestion.includes('buy') && extractAmount(question) !== null) ||
    (lowerQuestion.includes('purchase') && extractAmount(question) !== null) ||
    (lowerQuestion.includes('spend') && extractAmount(question) !== null);

  if (isAffordabilityQuestion) {
    return analyzeAffordability(data, question, currency);
  }

  if (lowerQuestion.includes('save') && (lowerQuestion.includes('month') || lowerQuestion.includes('this month'))) {
    return analyzeSavingsPotential(data, lowerQuestion, currency);
  }

  if (lowerQuestion.includes('biggest expense') || lowerQuestion.includes('most expensive')) {
    return analyzeBiggestExpense(data, lowerQuestion, currency);
  }

  if (lowerQuestion.includes('budget') || lowerQuestion.includes('spending')) {
    return analyzeBudgetStatus(data, currency);
  }

  if (lowerQuestion.includes('recurring') || lowerQuestion.includes('subscription')) {
    return analyzeRecurringExpenses(data, currency);
  }

  if (lowerQuestion.includes('category') || lowerQuestion.includes('spending on')) {
    return analyzeCategorySpending(data, lowerQuestion, currency);
  }

  if (lowerQuestion.includes('income') || lowerQuestion.includes('earn')) {
    return analyzeIncome(data, currency);
  }

  if (lowerQuestion.includes('savings goal') || lowerQuestion.includes('goal')) {
    return analyzeSavingsGoals(data, currency);
  }

  if (
    lowerQuestion.includes('how much') ||
    lowerQuestion.includes('spent this month') ||
    lowerQuestion.includes('this month')
  ) {
    return generateMonthSummary(data, currency);
  }

  return generateGeneralInsight(data, currency);
}

function analyzeAffordability(data: FinancialData, question: string, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const thisMonthExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const thisMonthIncome = data.transactions
    .filter(t => t.type === 'income' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const avgMonthlyIncome = data.userProfile.average_monthly_income;
  const effectiveIncome = thisMonthIncome > 0 ? thisMonthIncome : avgMonthlyIncome;

  if (effectiveIncome <= 0) {
    return `I don't have your income information on file. Please update your average monthly income in your profile so I can give you accurate affordability advice. Once set, I can tell you exactly whether you can afford specific purchases based on your real financial data.`;
  }

  const remainingBudget = effectiveIncome - thisMonthExpenses;
  const emergencyBuffer = effectiveIncome * 0.2;
  const safeToSpend = remainingBudget - emergencyBuffer;
  const purchaseAmount = extractAmount(question);

  if (purchaseAmount === null) {
    return `Based on your ${thisMonthIncome > 0 ? 'income' : 'average monthly income'} of ${fmtCur(effectiveIncome, currency)} and expenses so far this month (${fmtCur(thisMonthExpenses, currency)}), you have ${fmtCur(remainingBudget, currency)} remaining. After keeping a 20% emergency buffer (${fmtCur(emergencyBuffer, currency)}), you have ${fmtCur(Math.max(0, safeToSpend), currency)} available to spend comfortably. How much are you thinking of spending?`;
  }

  const canAfford = safeToSpend >= purchaseAmount;
  const canAffordWithoutBuffer = remainingBudget >= purchaseAmount;
  const formattedAmount = fmtCur(purchaseAmount, currency);
  const incomeLabel = thisMonthIncome > 0 ? 'income this month' : 'average monthly income';

  if (canAfford) {
    const remaining = safeToSpend - purchaseAmount;
    return `Yes, you can comfortably afford ${formattedAmount}.\n\nYour ${incomeLabel}: ${fmtCur(effectiveIncome, currency)}\nSpent this month: ${fmtCur(thisMonthExpenses, currency)}\nRemaining: ${fmtCur(remainingBudget, currency)}\nAfter 20% emergency buffer: ${fmtCur(safeToSpend, currency)}\n\nAfter this purchase you would still have ${fmtCur(remaining, currency)} available. Go ahead!`;
  } else if (canAffordWithoutBuffer) {
    const shortfall = purchaseAmount - safeToSpend;
    return `You can technically afford ${formattedAmount}, but it would eat into your emergency buffer.\n\nYour ${incomeLabel}: ${fmtCur(effectiveIncome, currency)}\nSpent this month: ${fmtCur(thisMonthExpenses, currency)}\nRemaining: ${fmtCur(remainingBudget, currency)}\nRecommended safe-to-spend (after 20% buffer): ${fmtCur(Math.max(0, safeToSpend), currency)}\n\nThis purchase would use ${fmtCur(shortfall, currency)} of your emergency buffer. Only proceed if it is a necessary purchase.`;
  } else {
    const shortfall = purchaseAmount - remainingBudget;
    return `No, you cannot afford ${formattedAmount} this month.\n\nYour ${incomeLabel}: ${fmtCur(effectiveIncome, currency)}\nSpent this month: ${fmtCur(thisMonthExpenses, currency)}\nRemaining: ${fmtCur(remainingBudget, currency)}\n\nYou are ${fmtCur(shortfall, currency)} short. Consider waiting until next month or reducing other expenses to make room for this purchase.`;
  }
}

function analyzeSavingsPotential(data: FinancialData, question: string, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const thisMonthExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const subscriptionCategories = ['Subscriptions', 'Entertainment', 'Food Delivery'];
  const subscriptionExpenses = data.transactions
    .filter(t => t.type === 'expense' && subscriptionCategories.includes(t.category) && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  if (question.includes('netflix') || question.includes('subscription')) {
    const subscriptionTotal = data.transactions
      .filter(t => t.type === 'expense' && t.category === 'Subscriptions' && t.transaction_date.startsWith(thisMonth))
      .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

    if (subscriptionTotal > 0) {
      const percentage = thisMonthExpenses > 0 ? ((subscriptionTotal / thisMonthExpenses) * 100).toFixed(1) : '0';
      return `This month, you've spent ${fmtCur(subscriptionTotal, currency)} on subscriptions, which is ${percentage}% of your total expenses (${fmtCur(thisMonthExpenses, currency)}). Cutting unused subscriptions could free up ${fmtCur(subscriptionTotal, currency)} per month — that could go directly toward your savings goals!`;
    }
    return `I don't see any subscription expenses this month. Cutting unnecessary subscriptions typically saves 5-15% of monthly expenses.`;
  }

  if (thisMonthExpenses === 0) {
    return `I don't see any expenses recorded this month yet. Start tracking your spending to get personalized savings insights!`;
  }

  const savingsPotential = subscriptionExpenses * 0.5 + (thisMonthExpenses * 0.1);
  return `Based on your spending this month (${fmtCur(thisMonthExpenses, currency)}), you could potentially save ${fmtCur(savingsPotential, currency)} by reducing discretionary spending like subscriptions (${fmtCur(subscriptionExpenses, currency)}) and optimizing other expenses.`;
}

function analyzeBiggestExpense(data: FinancialData, question: string, currency: string): string {
  const timeframe = question.includes('week') ? 7 : question.includes('month') ? 30 : 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  const expenses = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date >= cutoff)
    .sort((a, b) => parseFloat(String(b.amount)) - parseFloat(String(a.amount)));

  if (expenses.length === 0) {
    return `I don't see any expenses recorded in the last ${timeframe === 7 ? 'week' : 'month'}. Start tracking your expenses to get personalized insights!`;
  }

  const biggest = expenses[0];
  const total = expenses.reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);
  const percentage = ((parseFloat(String(biggest.amount)) / total) * 100).toFixed(1);

  return `Your biggest expense in the last ${timeframe === 7 ? 'week' : 'month'} was ${fmtCur(parseFloat(String(biggest.amount)), currency)} for ${biggest.description || biggest.category} on ${new Date(biggest.transaction_date).toLocaleDateString()}. This represents ${percentage}% of your total expenses (${fmtCur(total, currency)}) during this period.`;
}

function analyzeBudgetStatus(data: FinancialData, currency: string): string {
  if (data.budgets.length === 0) {
    return `You haven't set up any budgets yet. Creating budgets helps you stay on track with your spending goals. I recommend starting with your top expense categories.`;
  }

  const overBudget = data.budgets.filter(b => (b.spent || 0) > b.amount);
  const onTrack = data.budgets.filter(b => (b.spent || 0) <= b.amount * 0.8);

  if (overBudget.length > 0) {
    const worst = overBudget.sort((a, b) => ((b.spent || 0) - b.amount) - ((a.spent || 0) - a.amount))[0];
    const overage = (worst.spent || 0) - worst.amount;
    return `You're over budget in ${overBudget.length} ${overBudget.length === 1 ? 'category' : 'categories'}. The biggest concern is ${worst.category}, where you're ${fmtCur(overage, currency)} over your ${fmtCur(worst.amount, currency)} budget. Consider adjusting your spending or increasing this budget if needed.`;
  }

  return `You're on track with all ${data.budgets.length} budgets. ${onTrack.length} ${onTrack.length === 1 ? 'category is' : 'categories are'} well under budget, giving you flexibility for unexpected expenses.`;
}

function analyzeRecurringExpenses(data: FinancialData, currency: string): string {
  const subscriptionCategories = ['Subscriptions', 'Utilities', 'Rent/Mortgage', 'Insurance'];
  const recurring = data.transactions
    .filter(t => t.type === 'expense' && subscriptionCategories.includes(t.category));

  if (recurring.length === 0) {
    return `I don't see any recurring expenses (subscriptions, utilities, rent/mortgage) in your recent transactions. If you have regular bills, make sure to track them so I can give you a better picture of your fixed costs.`;
  }

  const monthlyRecurring = recurring.reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) / 3;

  const byCategory = recurring.reduce((acc: Record<string, number>, t) => {
    if (!acc[t.category]) acc[t.category] = 0;
    acc[t.category] += parseFloat(String(t.amount));
    return acc;
  }, {});

  const breakdown = Object.entries(byCategory)
    .map(([cat, amt]) => `${cat}: ${fmtCur((amt as number) / 3, currency)}/month`)
    .join(', ');

  return `You have approximately ${fmtCur(monthlyRecurring, currency)} in recurring monthly expenses. Breakdown: ${breakdown}. Review these regularly to identify subscriptions you no longer need.`;
}

function analyzeCategorySpending(data: FinancialData, question: string, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const expenseTransactions = data.transactions.filter(t => t.type === 'expense');

  if (expenseTransactions.length === 0) {
    return `I don't see any expense transactions yet. Start recording your expenses to get category-wise spending insights.`;
  }

  const categories = [...new Set(expenseTransactions.map(t => t.category))];
  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: expenseTransactions
      .filter(t => t.category === cat)
      .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0),
    thisMonth: expenseTransactions
      .filter(t => t.category === cat && t.transaction_date.startsWith(thisMonth))
      .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0),
  })).sort((a, b) => b.thisMonth - a.thisMonth);

  const top3 = categoryTotals.slice(0, 3);
  const breakdown = top3.map(c => `${c.category}: ${fmtCur(c.thisMonth, currency)} this month`).join(', ');

  return `Your top spending categories this month are: ${breakdown}. Would you like tips on reducing spending in any of these categories?`;
}

function analyzeIncome(data: FinancialData, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const thisMonthIncome = data.transactions
    .filter(t => t.type === 'income' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const avgIncome = data.userProfile.average_monthly_income;

  if (avgIncome <= 0 && thisMonthIncome <= 0) {
    return `I don't see any income recorded yet. Add your income transactions and set your average monthly income in your profile to get personalized financial insights.`;
  }

  if (avgIncome <= 0) {
    return `You've recorded ${fmtCur(thisMonthIncome, currency)} in income this month. To compare against your average, please set your average monthly income in your profile settings.`;
  }

  if (thisMonthIncome <= 0) {
    return `Your average monthly income is ${fmtCur(avgIncome, currency)}. I don't see any income recorded this month yet. Make sure to log your income so I can give you an accurate financial picture.`;
  }

  if (thisMonthIncome > avgIncome * 1.1) {
    return `Your income this month (${fmtCur(thisMonthIncome, currency)}) is ${((thisMonthIncome / avgIncome - 1) * 100).toFixed(1)}% higher than your average (${fmtCur(avgIncome, currency)}). Consider putting the extra toward your savings goals.`;
  } else if (thisMonthIncome < avgIncome * 0.9) {
    return `Your income this month (${fmtCur(thisMonthIncome, currency)}) is lower than your average (${fmtCur(avgIncome, currency)}). You might want to review your expenses and prioritize essential spending.`;
  }

  return `Your income this month (${fmtCur(thisMonthIncome, currency)}) is on track with your average monthly income of ${fmtCur(avgIncome, currency)}.`;
}

function analyzeSavingsGoals(data: FinancialData, currency: string): string {
  if (data.savingsGoals.length === 0) {
    return `You haven't set up any savings goals yet. Setting clear savings goals helps you stay motivated and track your progress. What would you like to save for?`;
  }

  const summary = data.savingsGoals.map(g => {
    const progress = g.target_amount > 0 ? ((g.current_amount / g.target_amount) * 100).toFixed(1) : '0';
    const remaining = g.target_amount - g.current_amount;
    return `${g.name}: ${progress}% complete (${fmtCur(g.current_amount, currency)} of ${fmtCur(g.target_amount, currency)}, ${fmtCur(remaining, currency)} remaining)`;
  }).join('. ');

  return `Here's your savings goals progress: ${summary}.`;
}

function generateMonthSummary(data: FinancialData, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const thisMonthExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const thisMonthIncome = data.transactions
    .filter(t => t.type === 'income' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const net = thisMonthIncome - thisMonthExpenses;
  const avgIncome = data.userProfile.average_monthly_income;
  const effectiveIncome = thisMonthIncome > 0 ? thisMonthIncome : avgIncome;

  const byCategory = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((acc: Record<string, number>, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += parseFloat(String(t.amount));
      return acc;
    }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  let response = `This month so far:\n\nIncome: ${fmtCur(thisMonthIncome > 0 ? thisMonthIncome : 0, currency)}\nExpenses: ${fmtCur(thisMonthExpenses, currency)}\nNet: ${fmtCur(net, currency)}`;

  if (topCategory) {
    response += `\n\nTop spending category: ${topCategory[0]} (${fmtCur(topCategory[1], currency)})`;
  }

  if (effectiveIncome > 0) {
    const savingsRate = ((net / effectiveIncome) * 100).toFixed(1);
    response += `\n\nSavings rate: ${savingsRate}%`;
  }

  return response;
}

function generateGeneralInsight(data: FinancialData, currency: string): string {
  const now = new Date();
  const thisMonth = now.toISOString().split('T')[0].substring(0, 7);

  const thisMonthExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  const thisMonthIncome = data.transactions
    .filter(t => t.type === 'income' && t.transaction_date.startsWith(thisMonth))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);

  if (thisMonthIncome === 0 && thisMonthExpenses === 0) {
    return `I don't see any transactions recorded yet for this month. Once you start tracking your income and expenses, I can help you analyze your spending, check if you can afford purchases, find savings opportunities, and more. What would you like to know?`;
  }

  return `This month, you've earned ${fmtCur(thisMonthIncome, currency)} and spent ${fmtCur(thisMonthExpenses, currency)}, leaving you with ${fmtCur(thisMonthIncome - thisMonthExpenses, currency)}. I can help you:\n- Check if you can afford a specific purchase\n- Analyze your spending by category\n- Review your budget status\n- Check progress on your savings goals\n\nWhat would you like to know?`;
}
