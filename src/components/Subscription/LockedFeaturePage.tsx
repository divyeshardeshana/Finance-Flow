import { Lock, Crown, TrendingUp, BarChart2, MessageCircle, Activity, Lightbulb, Bell, Wallet, Calendar, FileText, Shield } from 'lucide-react';

interface LockedFeaturePageProps {
  featureKey: string;
  onUpgrade: () => void;
  onNavigateToSubscription?: () => void;
}

interface FeatureConfig {
  title: string;
  subtitle: string;
  requiredPlan: 'Pro' | 'Premium';
  icon: React.FC<{ className?: string }>;
  preview: React.FC;
}

function ReportsPreview() {
  const rows = [
    { date: 'Jan 15', category: 'Food & Dining', description: 'Lunch at restaurant', amount: '-$25.50', type: 'expense' },
    { date: 'Jan 20', category: 'Salary', description: 'Monthly salary', amount: '+$5,000.00', type: 'income' },
    { date: 'Jan 22', category: 'Transportation', description: 'Uber ride to airport', amount: '-$12.00', type: 'expense' },
    { date: 'Jan 25', category: 'Dining', description: 'Dinner with friends', amount: '-$90.00', type: 'expense' },
    { date: 'Jan 28', category: 'Utilities', description: 'Electricity bill', amount: '-$85.00', type: 'expense' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[['Total Income', '$8,450.00'], ['Total Expenses', '$5,230.75'], ['Net Savings', '$3,219.25']].map(([label, val], i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 dark:border-gray-700">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className="text-lg font-bold text-gray-800 dark:text-white dark:text-white">{val}</div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 dark:border-gray-700 grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Date</span><span>Category</span><span>Description</span><span className="text-right">Amount</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 dark:border-gray-700 last:border-0 grid grid-cols-4 items-center">
            <span className="text-xs text-gray-400">{r.date}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{r.category}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 truncate">{r.description}</span>
            <span className={`text-xs font-semibold text-right ${r.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{r.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvestmentPreview() {
  const holdings = [
    { name: 'Apple Inc.', ticker: 'AAPL', value: '$4,820.00', change: '+2.4%', positive: true },
    { name: 'Tesla', ticker: 'TSLA', value: '$2,150.00', change: '-1.2%', positive: false },
    { name: 'S&P 500 ETF', ticker: 'SPY', value: '$6,300.00', change: '+0.8%', positive: true },
    { name: 'Gold ETF', ticker: 'GLD', value: '$1,750.00', change: '+0.3%', positive: true },
    { name: 'Microsoft', ticker: 'MSFT', value: '$3,410.00', change: '+1.7%', positive: true },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Portfolio Value</div>
          <div className="text-lg font-bold text-gray-800 dark:text-white">$18,430.00</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Total Gain/Loss</div>
          <div className="text-lg font-bold text-green-600">+$2,184.50</div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {holdings.map((h, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{h.ticker[0]}</div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-white">{h.name}</div>
                <div className="text-xs text-gray-400">{h.ticker}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800 dark:text-white">{h.value}</div>
              <div className={`text-xs font-medium ${h.positive ? 'text-green-600' : 'text-red-500'}`}>{h.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetWorthPreview() {
  const assets = [
    { label: 'Checking Account', value: '$12,500.00', positive: true },
    { label: 'Investment Portfolio', value: '$48,200.00', positive: true },
    { label: 'Real Estate', value: '$320,000.00', positive: true },
    { label: 'Vehicle', value: '$18,400.00', positive: true },
    { label: 'Retirement Fund', value: '$65,800.00', positive: true },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 text-center">
        <div className="text-xs text-gray-400 mb-1">Total Net Worth</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">$442,450.00</div>
        <div className="text-xs text-green-600 font-medium mt-1">+$8,200 this month</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {assets.map((a, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">{a.label}</span>
            <span className="text-sm font-semibold text-green-600">{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetirementPreview() {
  const milestones = [
    { age: '35', goal: 'Emergency Fund Complete', status: 'done', amount: '$25,000' },
    { age: '40', goal: '401(k) Max Contribution', status: 'done', amount: '$92,000' },
    { age: '45', goal: 'Mortgage Paid Off', status: 'progress', amount: '$185,000' },
    { age: '55', goal: 'Investment Target', status: 'pending', amount: '$450,000' },
    { age: '65', goal: 'Retirement Goal', status: 'pending', amount: '$850,000' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Projected Retirement Savings Growth</div>
        <div className="flex items-end gap-1 h-28">
          {[20, 30, 45, 55, 65, 70, 80, 88, 93, 97, 100].map((h, i) => (
            <div key={i} className="flex-1 bg-blue-100 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Age 30</span><span>Age 40</span><span>Age 50</span><span>Age 60</span>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${m.status === 'done' ? 'bg-green-100 text-green-700' : m.status === 'progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                {m.age}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{m.goal}</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{m.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssistantPreview() {
  const messages = [
    { role: 'ai', text: 'Based on your spending in January, you could save an extra $320/month by reducing dining and subscription costs.' },
    { role: 'user', text: 'How can I improve my savings rate?' },
    { role: 'ai', text: 'Try automating a transfer of $500 to savings on payday. You\'re currently saving 18% - the target is 20%.' },
    { role: 'user', text: 'Which subscriptions should I cancel?' },
    { role: 'ai', text: 'I found 4 subscriptions you haven\'t used in 60+ days totalling $47/month. Cancelling them could save $564 per year.' },
  ];
  return (
    <div className="space-y-3 max-w-xl">
      {messages.map((m, i) => (
        m.role === 'ai' ? (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 border border-gray-100 dark:border-gray-700 flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">{m.text}</p>
            </div>
          </div>
        ) : (
          <div key={i} className="flex gap-3 justify-end">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl rounded-tr-sm p-4 border border-blue-100 max-w-xs">
              <p className="text-sm text-blue-800">{m.text}</p>
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function ExpensePredictionPreview() {
  const predictions = [
    { month: 'March', category: 'Food & Dining', predicted: '$620', actual: '$598', confidence: '94%' },
    { month: 'March', category: 'Transportation', predicted: '$180', actual: '$172', confidence: '91%' },
    { month: 'April', category: 'Utilities', predicted: '$95', actual: '-', confidence: '88%' },
    { month: 'April', category: 'Entertainment', predicted: '$210', actual: '-', confidence: '82%' },
    { month: 'May', category: 'Groceries', predicted: '$480', actual: '-', confidence: '79%' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Expense Forecast - Next 4 Months</div>
        <div className="flex items-end gap-2 h-32">
          {[55, 70, 60, 85, 65, 90, 75, 80, 70, 95, 65, 88].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t ${i >= 8 ? 'bg-blue-200 border-t-2 border-blue-400 border-dashed' : 'bg-blue-100'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Jan</span><span>Apr</span><span>Jul</span><span className="text-blue-500 font-medium">Oct (predicted)</span><span>Dec</span>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Month</span><span>Category</span><span>Predicted</span><span>Confidence</span>
        </div>
        {predictions.map((p, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 grid grid-cols-4 items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{p.month}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.category}</span>
            <span className="text-xs font-semibold text-gray-800 dark:text-white">{p.predicted}</span>
            <span className="text-xs text-blue-600 font-medium">{p.confidence}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockPredictionPreview() {
  const stocks = [
    { ticker: 'AAPL', name: 'Apple Inc.', current: '$182.50', target7d: '$191.20', target30d: '$198.40', confidence: '84%', trend: 'up' },
    { ticker: 'MSFT', name: 'Microsoft', current: '$415.30', target7d: '$428.00', target30d: '$445.60', confidence: '81%', trend: 'up' },
    { ticker: 'TSLA', name: 'Tesla', current: '$248.80', target7d: '$238.40', target30d: '$255.00', confidence: '73%', trend: 'down' },
    { ticker: 'GOOGL', name: 'Alphabet', current: '$172.60', target7d: '$178.90', target30d: '$185.20', confidence: '79%', trend: 'up' },
    { ticker: 'AMZN', name: 'Amazon', current: '$198.20', target7d: '$205.40', target30d: '$212.80', confidence: '77%', trend: 'up' },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">AAPL - Price Forecast</div>
        <div className="relative h-32">
          <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
            <polyline points="0,80 30,70 60,75 90,55 120,60 150,40 180,45 210,30 240,35 270,20 300,25" fill="none" stroke="#bfdbfe" strokeWidth="2" />
            <polyline points="210,30 240,28 270,18 300,22" fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4,3" />
          </svg>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 grid grid-cols-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Ticker</span><span>Current</span><span>7-Day</span><span>30-Day</span><span>Confidence</span>
        </div>
        {stocks.map((s, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 grid grid-cols-5 items-center">
            <span className="text-xs font-bold text-gray-800 dark:text-white">{s.ticker}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{s.current}</span>
            <span className={`text-xs font-semibold ${s.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>{s.target7d}</span>
            <span className={`text-xs font-semibold ${s.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>{s.target30d}</span>
            <span className="text-xs text-blue-600 font-medium">{s.confidence}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsPreview() {
  const tips = [
    { title: 'Reduce dining expenses', desc: 'You spent 32% more on dining than last month. Consider meal planning to save ~$150.' },
    { title: 'Increase emergency fund', desc: 'Your emergency fund covers 2.1 months. Aim for 3–6 months of expenses.' },
    { title: 'Optimize subscriptions', desc: '4 inactive subscriptions detected totalling $47/month. Review and cancel unused ones.' },
    { title: 'Review investment allocation', desc: 'Your portfolio is 80% cash. Consider diversifying into index funds for better returns.' },
    { title: 'Pay down high-interest debt', desc: 'Your credit card at 22.9% APR costs $84/month in interest. Prioritize paying it off first.' },
  ];
  return (
    <div className="space-y-3">
      {tips.map((tip, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white">{tip.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BillRemindersPreview() {
  const bills = [
    { name: 'Netflix', amount: '$15.99', due: 'Due in 3 days', status: 'upcoming' },
    { name: 'Electricity', amount: '$82.50', due: 'Due in 7 days', status: 'upcoming' },
    { name: 'Internet', amount: '$49.00', due: 'Paid Jan 12', status: 'paid' },
    { name: 'Gym Membership', amount: '$35.00', due: 'Due Jan 28', status: 'upcoming' },
    { name: 'Spotify', amount: '$10.99', due: 'Paid Jan 5', status: 'paid' },
  ];
  return (
    <div className="space-y-3">
      {bills.map((bill, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white">{bill.name}</div>
              <div className="text-xs text-gray-400">{bill.due}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-800 dark:text-white">{bill.amount}</div>
            <div className={`text-xs font-medium ${bill.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
              {bill.status === 'paid' ? 'Paid' : 'Upcoming'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SupportPreview() {
  const tickets = [
    { id: '#1042', subject: 'Export not working correctly', status: 'resolved', priority: 'High', responded: '2h ago' },
    { id: '#1031', subject: 'Recurring transaction missing', status: 'resolved', priority: 'Medium', responded: '4h ago' },
    { id: '#1028', subject: 'PDF import question', status: 'resolved', priority: 'Low', responded: '1d ago' },
    { id: '#1019', subject: 'Budget category not saving', status: 'resolved', priority: 'High', responded: '1d ago' },
    { id: '#1011', subject: 'Currency conversion issue', status: 'resolved', priority: 'Medium', responded: '2d ago' },
  ];
  return (
    <div className="space-y-3">
      {tickets.map((t, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">{t.id} · Priority: {t.priority}</div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white">{t.subject}</div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-xs font-medium text-green-600 mb-0.5">{t.status}</div>
            <div className="text-xs text-gray-400">{t.responded}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriceComparisonPreview() {
  const items = [
    { product: 'iPhone 15 Pro', store: 'Amazon', price: '$999.00', savings: 'Best price' },
    { product: 'AirPods Pro 2', store: 'Apple Store', price: '$249.00', savings: 'Save $30 vs others' },
    { product: 'MacBook Air M3', store: 'B&H Photo', price: '$1,089.00', savings: 'Save $10 vs Amazon' },
    { product: 'Sony WH-1000XM5', store: 'Best Buy', price: '$279.99', savings: 'Save $70 vs retail' },
    { product: 'Samsung 65" QLED', store: 'Costco', price: '$1,199.00', savings: 'Save $300 vs MSRP' },
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white">{item.product}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.store}</div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-sm font-bold text-gray-900 dark:text-white">{item.price}</div>
            <div className="text-xs text-green-600 font-medium">{item.savings}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EstatePlanningPreview() {
  const beneficiaries = [
    { name: 'Sarah Johnson', relation: 'Spouse', allocation: '50%', assets: 'All accounts' },
    { name: 'Michael Johnson', relation: 'Child', allocation: '25%', assets: 'Investment portfolio' },
    { name: 'Emily Johnson', relation: 'Child', allocation: '20%', assets: 'Investment portfolio' },
    { name: 'Red Cross', relation: 'Charity', allocation: '5%', assets: 'Liquid assets' },
    { name: 'Estate Trust', relation: 'Trust', allocation: 'Remainder', assets: 'Real estate' },
  ];
  return (
    <div className="space-y-3">
      {beneficiaries.map((b, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">
              {b.name[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white">{b.name}</div>
              <div className="text-xs text-gray-400">{b.relation} · {b.assets}</div>
            </div>
          </div>
          <div className="text-sm font-bold text-gray-800 dark:text-white flex-shrink-0 ml-4">{b.allocation}</div>
        </div>
      ))}
    </div>
  );
}

const featureConfigs: Record<string, FeatureConfig> = {
  advanced_reports: {
    title: 'Advanced Reports',
    subtitle: 'Deep-dive analytics with visual charts, export options, and custom date ranges.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <FileText className={className} />,
    preview: ReportsPreview,
  },
  advanced_investments: {
    title: 'Advanced Investments',
    subtitle: 'Track your portfolio performance, asset allocation, and real-time gains.',
    requiredPlan: 'Premium',
    icon: ({ className }) => <TrendingUp className={className} />,
    preview: InvestmentPreview,
  },
  net_worth_tracker: {
    title: 'Net Worth Tracker',
    subtitle: 'Monitor all your assets and liabilities in one place with live updates.',
    requiredPlan: 'Premium',
    icon: ({ className }) => <Wallet className={className} />,
    preview: NetWorthPreview,
  },
  retirement_planning: {
    title: 'Retirement Planning',
    subtitle: 'Project your retirement savings with Monte Carlo simulations and smart milestones.',
    requiredPlan: 'Premium',
    icon: ({ className }) => <Calendar className={className} />,
    preview: RetirementPreview,
  },
  expense_prediction: {
    title: 'Expense Prediction',
    subtitle: 'AI-powered forecasting that predicts your future spending patterns.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <Activity className={className} />,
    preview: ExpensePredictionPreview,
  },
  stock_prediction: {
    title: 'Stock Prediction',
    subtitle: 'Machine learning models for short-term stock price forecasting across global exchanges.',
    requiredPlan: 'Premium',
    icon: ({ className }) => <TrendingUp className={className} />,
    preview: StockPredictionPreview,
  },
  financial_assistant: {
    title: 'Financial Assistant',
    subtitle: 'Your personal AI advisor for budgeting, saving, and investment decisions.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <MessageCircle className={className} />,
    preview: AssistantPreview,
  },
  ai_recommendations: {
    title: 'AI Recommendations',
    subtitle: 'Personalized tips and action items based on your actual spending behavior.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <Lightbulb className={className} />,
    preview: RecommendationsPreview,
  },
  bill_reminders: {
    title: 'Bill Reminders',
    subtitle: 'Never miss a payment with smart reminders and automatic tracking.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <Bell className={className} />,
    preview: BillRemindersPreview,
  },
  support_tickets: {
    title: 'Priority Support',
    subtitle: 'Get priority access to our support team with faster response times.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <BarChart2 className={className} />,
    preview: SupportPreview,
  },
  price_comparison: {
    title: 'Price Comparison',
    subtitle: 'Compare prices and find the best deals across products and services.',
    requiredPlan: 'Pro',
    icon: ({ className }) => <BarChart2 className={className} />,
    preview: PriceComparisonPreview,
  },
  estate_planning: {
    title: 'Estate Planning',
    subtitle: 'Manage beneficiaries, documents, and digital assets in one secure place.',
    requiredPlan: 'Premium',
    icon: ({ className }) => <Shield className={className} />,
    preview: EstatePlanningPreview,
  },
};

export function LockedFeaturePage({ featureKey, onUpgrade, onNavigateToSubscription }: LockedFeaturePageProps) {
  const config = featureConfigs[featureKey] ?? {
    title: 'Premium Feature',
    subtitle: 'Upgrade your plan to unlock this feature.',
    requiredPlan: 'Pro' as const,
    icon: ({ className }: { className?: string }) => <Lock className={className} />,
    preview: RecommendationsPreview,
  };

  const PreviewComponent = config.preview;
  const IconComponent = config.icon;
  const isPremium = config.requiredPlan === 'Premium';

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isPremium ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{config.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onNavigateToSubscription ?? onUpgrade}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md bg-blue-600 text-white hover:bg-blue-700"
        >
          <Crown className="w-4 h-4" />
          Upgrade Plan
        </button>
      </div>

      <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-4 border ${isPremium ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100'}`}>
        <div className="flex items-center gap-2">
          <Lock className={`w-4 h-4 ${isPremium ? 'text-amber-500' : 'text-blue-500'}`} />
          <span className={`text-sm font-medium ${isPremium ? 'text-amber-800' : 'text-blue-800'}`}>
            This feature requires the <strong>{config.requiredPlan}</strong> plan. Upgrade to create and manage records.
          </span>
        </div>
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
        >
          <Lock className="w-3 h-3" />
          Add New
        </button>
      </div>

      <div className="pointer-events-none select-none">
        <PreviewComponent />
      </div>
    </div>
  );
}
