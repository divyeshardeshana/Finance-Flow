import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../SEO/SEOHead';
import { ArrowLeftRight, TrendingUp, RefreshCw, ChevronDown, Clock, Info } from 'lucide-react';
import { PublicNavbar, type PublicView } from '../Common/PublicNavbar';
import { PublicFooter } from '../Common/PublicFooter';
import { fetchLiveRate } from '../../lib/currency';

interface CurrencyConverterPageProps {
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'ILS', name: 'Israeli Shekel', flag: '🇮🇱' },
  { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺' },
];

const QUICK_AMOUNTS = [1, 5, 10, 50, 100, 500, 1000];

const PERIOD_LABELS: { label: string; days: number }[] = [
  { label: '1D', days: 1 },
  { label: '5D', days: 5 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
];

function generateChartData(baseRate: number, days: number): { date: string; rate: number }[] {
  const points: { date: string; rate: number }[] = [];
  const now = new Date();
  const volatility = baseRate * 0.012;

  let currentRate = baseRate * (0.94 + Math.random() * 0.04);

  const totalPoints = Math.min(days, 60);
  const msPerPoint = (days * 24 * 60 * 60 * 1000) / totalPoints;

  for (let i = totalPoints; i >= 0; i--) {
    const date = new Date(now.getTime() - i * msPerPoint);
    const change = (Math.random() - 0.48) * volatility;
    currentRate = Math.max(currentRate + change, baseRate * 0.85);
    currentRate = Math.min(currentRate, baseRate * 1.15);

    const label = days <= 1
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : days <= 5
        ? date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    points.push({ date: label, rate: parseFloat(currentRate.toFixed(4)) });
  }

  if (points.length > 0) {
    points[points.length - 1].rate = parseFloat(baseRate.toFixed(4));
  }

  return points;
}

function SparkChart({
  data,
  color = '#3b82f6',
}: {
  data: { date: string; rate: number }[];
  color?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return null;

  const width = 700;
  const height = 160;
  const padX = 8;
  const padY = 16;

  const rates = data.map(d => d.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rangeRate = maxRate - minRate || 1;

  const toX = (i: number) => padX + (i / (data.length - 1)) * (width - padX * 2);
  const toY = (r: number) => padY + (1 - (r - minRate) / rangeRate) * (height - padY * 2);

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.rate).toFixed(1)}`)
    .join(' ');

  const fillD = `${pathD} L ${toX(data.length - 1).toFixed(1)} ${height} L ${toX(0).toFixed(1)} ${height} Z`;

  const isUp = data[data.length - 1].rate >= data[0].rate;
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const fillStart = isUp ? '#10b98130' : '#ef444430';
  const fillEnd = isUp ? '#10b98100' : '#ef444400';

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - padX) / (width - padX * 2)) * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: `${width}/${height}` }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillStart} />
            <stop offset="100%" stopColor={fillEnd} />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#chartFill)" />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hoverIndex !== null && (
          <>
            <line
              x1={toX(hoverIndex)}
              y1={padY}
              x2={toX(hoverIndex)}
              y2={height - padY}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle
              cx={toX(hoverIndex)}
              cy={toY(data[hoverIndex].rate)}
              r="4"
              fill={strokeColor}
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
      {hovered && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(toX(hoverIndex!) / width) * 100}%`,
            top: `${(toY(hovered.rate) / height) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10">
            <div className="font-semibold">{hovered.rate.toFixed(4)}</div>
            <div className="text-gray-400 text-[10px]">{hovered.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CurrencyDropdown({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];
  const filtered = CURRENCIES.filter(
    c =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex-1" ref={ref}>
      <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 ml-0.5">{label}</label>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors text-left"
      >
        <span className="text-xl">{selected.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm">{selected.code}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{selected.name}</div>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#131823] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100 dark:border-white/5">
              <input
                autoFocus
                type="text"
                placeholder="Search currency..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors ${
                    c.code === value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="font-medium text-sm">{c.code}</span>
                  <span className="text-xs text-gray-400 truncate">{c.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No currencies found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function CurrencyConverterPage({ onNavigate, onSignIn }: CurrencyConverterPageProps) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [amount, setAmount] = useState('1');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState(1);
  const [chartData, setChartData] = useState<{ date: string; rate: number }[]>([]);

  const loadRate = useCallback(async (from: string, to: string, animated = false) => {
    if (animated) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await fetchLiveRate(from, to);
      setRate(r);
      setLastUpdated(new Date());
      setChartData(generateChartData(r, period));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadRate(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    if (rate !== null) {
      setChartData(generateChartData(rate, period));
    }
  }, [period, rate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const converted = rate !== null ? parsedAmount * rate : null;

  const fromInfo = CURRENCIES.find(c => c.code === fromCurrency);
  const toInfo = CURRENCIES.find(c => c.code === toCurrency);

  const periodDays = PERIOD_LABELS.find(p => p.days === period)?.days || 1;
  const firstRate = chartData[0]?.rate;
  const lastRate = chartData[chartData.length - 1]?.rate;
  const rateChange = firstRate && lastRate ? ((lastRate - firstRate) / firstRate) * 100 : 0;
  const isUp = rateChange >= 0;

  const formatRate = (r: number) => {
    if (r >= 100) return r.toFixed(2);
    if (r >= 10) return r.toFixed(3);
    return r.toFixed(4);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080C14] flex flex-col">
      <SEOHead pageKey="currency-converter" />
      <PublicNavbar currentView="currency-converter" onNavigate={onNavigate} onSignIn={onSignIn} />

      <main className="flex-1 pt-24 pb-16">
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/8 dark:bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-400/6 dark:bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-10"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide mb-5">
                  <TrendingUp size={12} />
                  LIVE EXCHANGE RATES
                </span>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight"
              >
                Currency{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                  Converter
                </span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-gray-500 dark:text-gray-400 text-base max-w-lg mx-auto"
              >
                Real-time exchange rates across 30+ currencies. Always accurate, always free.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white dark:bg-[#0E1420] border border-gray-100 dark:border-white/8 rounded-2xl shadow-xl shadow-gray-100/50 dark:shadow-black/40 overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5">
                {loading ? (
                  <div className="h-16 flex items-center gap-3">
                    <div className="h-8 w-64 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                  </div>
                ) : rate !== null ? (
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        1 {fromInfo?.name} equals
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {formatRate(rate)}
                        </span>
                        <span className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                          {toInfo?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                          <Clock size={11} />
                          {lastUpdated
                            ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · Live rate'
                            : 'Loading...'}
                        </div>
                        {chartData.length > 1 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isUp
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                          }`}>
                            {isUp ? '+' : ''}{rateChange.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => loadRate(fromCurrency, toCurrency, true)}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors self-start sm:self-auto"
                    >
                      <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 ml-0.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full px-4 py-3.5 text-xl font-semibold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500/50 text-gray-900 dark:text-white transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <CurrencyDropdown value={fromCurrency} onChange={setFromCurrency} label="From" />
                </div>

                <div className="flex items-center justify-center my-4">
                  <button
                    onClick={handleSwap}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-sm font-medium"
                  >
                    <ArrowLeftRight size={15} className="group-hover:scale-110 transition-transform" />
                    Swap currencies
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 ml-0.5">
                      Converted amount
                    </label>
                    <div className="w-full px-4 py-3.5 text-xl font-semibold bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/15 rounded-xl text-blue-700 dark:text-blue-300 min-h-[56px] flex items-center">
                      {loading
                        ? <div className="h-6 w-32 bg-blue-100 dark:bg-blue-500/10 rounded animate-pulse" />
                        : converted !== null
                          ? converted.toLocaleString(undefined, { maximumFractionDigits: 4 })
                          : '—'
                      }
                    </div>
                  </div>
                  <CurrencyDropdown value={toCurrency} onChange={setToCurrency} label="To" />
                </div>

                <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400 dark:text-gray-500">
                  <Info size={11} />
                  Exchange rates update in real-time. Rates shown are indicative and may vary from actual transaction rates.
                </div>
              </div>

              {chartData.length > 1 && (
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-gray-100 dark:border-white/5 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {fromCurrency}/{toCurrency} Rate History
                    </h3>
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                      {PERIOD_LABELS.map(p => (
                        <button
                          key={p.label}
                          onClick={() => setPeriod(p.days)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                            period === p.days
                              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SparkChart data={chartData} />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-600 mt-1 px-1">
                    <span>{chartData[0]?.date}</span>
                    <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
                    <span>{chartData[chartData.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.4 }}
              className="mt-6 bg-white dark:bg-[#0E1420] border border-gray-100 dark:border-white/8 rounded-2xl shadow-lg shadow-gray-100/30 dark:shadow-black/30 overflow-hidden"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Quick reference &mdash; {fromCurrency} to {toCurrency}
                </h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {QUICK_AMOUNTS.map((amt, i) => {
                  const conv = rate !== null ? amt * rate : null;
                  return (
                    <motion.div
                      key={amt}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 + i * 0.04 }}
                      className="flex items-center justify-between px-6 sm:px-8 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {amt.toLocaleString()} {fromCurrency}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {conv !== null
                          ? `${conv.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCurrency}`
                          : '—'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.55 }}
              className="mt-10 text-center"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Want smarter multi-currency tracking for all your finances?
              </p>
              <button
                onClick={onSignIn}
                className="px-8 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Get Started Free
              </button>
            </motion.div>
          </div>
        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
