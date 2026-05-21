import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  BarChart3,
  Activity,
  AlertCircle,
  Info,
  Globe,
  Target,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { getCurrencySymbol } from '../../lib/currency';

interface StockData {
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  prediction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  targetPrice: number;
  volume: number;
  marketCap: string;
  pe_ratio: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
  technicalIndicators: {
    rsi: number;
    macd: string;
    movingAvg50: number;
    movingAvg200: number;
    bollingerBands: { upper: number; middle: number; lower: number };
  };
  analystRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  priceTarget: { low: number; average: number; high: number };
}

interface Exchange {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />
  );
}

function SkeletonResultCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <SkeletonBlock className="w-32 h-7" />
          <SkeletonBlock className="w-48 h-4 rounded-full" />
        </div>
        <div className="text-right space-y-2">
          <SkeletonBlock className="w-36 h-9" />
          <SkeletonBlock className="w-28 h-4 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function StockPredictionPage() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('NYSE');
  const [timeframe, setTimeframe] = useState('1M');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState('');

  const exchanges: Exchange[] = [
    { id: 'NYSE', name: 'New York Stock Exchange (USA)', country: 'USA', timezone: 'EST' },
    { id: 'NASDAQ', name: 'NASDAQ (USA)', country: 'USA', timezone: 'EST' },
    { id: 'LSE', name: 'London Stock Exchange (UK)', country: 'UK', timezone: 'GMT' },
    { id: 'TSE', name: 'Tokyo Stock Exchange (Japan)', country: 'Japan', timezone: 'JST' },
    { id: 'BSE', name: 'Bombay Stock Exchange (India)', country: 'India', timezone: 'IST' },
    { id: 'SSE', name: 'Shanghai Stock Exchange (China)', country: 'China', timezone: 'CST' },
    { id: 'NSE', name: 'National Stock Exchange India', country: 'India', timezone: 'IST' },
    { id: 'HKEX', name: 'Hong Kong Stock Exchange', country: 'Hong Kong', timezone: 'HKT' },
    { id: 'ASX', name: 'Australian Securities Exchange', country: 'Australia', timezone: 'AEST' },
    { id: 'TSX', name: 'Toronto Stock Exchange', country: 'Canada', timezone: 'EST' },
    { id: 'FRA', name: 'Frankfurt Stock Exchange', country: 'Germany', timezone: 'CET' },
    { id: 'EURONEXT', name: 'Euronext', country: 'Europe', timezone: 'CET' },
  ];

  const mockStockData: Record<string, StockData> = {
    AAPL: {
      symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ',
      currentPrice: 182.50, change: 2.35, changePercent: 1.31,
      prediction: 'bullish', confidence: 78, targetPrice: 195.00,
      volume: 52487900, marketCap: '$2.85T', pe_ratio: 29.8,
      week52High: 199.62, week52Low: 164.08, avgVolume: 58234000,
      technicalIndicators: { rsi: 62.5, macd: 'Bullish', movingAvg50: 178.90, movingAvg200: 175.20, bollingerBands: { upper: 188.50, middle: 182.50, lower: 176.50 } },
      analystRating: 'Buy', priceTarget: { low: 175.00, average: 195.00, high: 220.00 },
    },
    GOOGL: {
      symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ',
      currentPrice: 140.25, change: -1.50, changePercent: -1.06,
      prediction: 'neutral', confidence: 65, targetPrice: 145.00,
      volume: 24582100, marketCap: '$1.76T', pe_ratio: 26.3,
      week52High: 155.30, week52Low: 129.40, avgVolume: 28745000,
      technicalIndicators: { rsi: 48.3, macd: 'Neutral', movingAvg50: 141.80, movingAvg200: 138.90, bollingerBands: { upper: 146.20, middle: 140.25, lower: 134.30 } },
      analystRating: 'Hold', priceTarget: { low: 135.00, average: 145.00, high: 160.00 },
    },
    MSFT: {
      symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ',
      currentPrice: 378.90, change: 5.20, changePercent: 1.39,
      prediction: 'bullish', confidence: 82, targetPrice: 400.00,
      volume: 19843200, marketCap: '$2.82T', pe_ratio: 35.6,
      week52High: 384.30, week52Low: 324.39, avgVolume: 23456000,
      technicalIndicators: { rsi: 67.8, macd: 'Bullish', movingAvg50: 368.40, movingAvg200: 355.80, bollingerBands: { upper: 390.50, middle: 378.90, lower: 367.30 } },
      analystRating: 'Strong Buy', priceTarget: { low: 385.00, average: 400.00, high: 425.00 },
    },
    TSLA: {
      symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ',
      currentPrice: 242.80, change: -8.15, changePercent: -3.25,
      prediction: 'bearish', confidence: 70, targetPrice: 220.00,
      volume: 98736500, marketCap: '$771.4B', pe_ratio: 75.2,
      week52High: 299.29, week52Low: 206.48, avgVolume: 110234000,
      technicalIndicators: { rsi: 38.2, macd: 'Bearish', movingAvg50: 258.30, movingAvg200: 245.60, bollingerBands: { upper: 268.40, middle: 242.80, lower: 217.20 } },
      analystRating: 'Hold', priceTarget: { low: 180.00, average: 220.00, high: 250.00 },
    },
    JPM: {
      symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE',
      currentPrice: 158.75, change: 1.85, changePercent: 1.18,
      prediction: 'bullish', confidence: 74, targetPrice: 168.00,
      volume: 11234500, marketCap: '$462B', pe_ratio: 11.2,
      week52High: 165.30, week52Low: 135.40, avgVolume: 12456000,
      technicalIndicators: { rsi: 58.3, macd: 'Bullish', movingAvg50: 155.20, movingAvg200: 148.90, bollingerBands: { upper: 162.50, middle: 158.75, lower: 155.00 } },
      analystRating: 'Buy', priceTarget: { low: 160.00, average: 168.00, high: 180.00 },
    },
    BAC: {
      symbol: 'BAC', name: 'Bank of America Corp', exchange: 'NYSE',
      currentPrice: 34.85, change: 0.55, changePercent: 1.60,
      prediction: 'neutral', confidence: 62, targetPrice: 36.00,
      volume: 45234100, marketCap: '$265B', pe_ratio: 12.8,
      week52High: 38.20, week52Low: 29.30, avgVolume: 48756000,
      technicalIndicators: { rsi: 51.2, macd: 'Neutral', movingAvg50: 34.40, movingAvg200: 32.90, bollingerBands: { upper: 36.20, middle: 34.85, lower: 33.50 } },
      analystRating: 'Hold', priceTarget: { low: 32.00, average: 36.00, high: 40.00 },
    },
    V: {
      symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE',
      currentPrice: 278.40, change: 3.20, changePercent: 1.16,
      prediction: 'bullish', confidence: 80, targetPrice: 295.00,
      volume: 5234100, marketCap: '$575B', pe_ratio: 32.5,
      week52High: 290.30, week52Low: 245.20, avgVolume: 6456000,
      technicalIndicators: { rsi: 64.8, macd: 'Bullish', movingAvg50: 272.30, movingAvg200: 265.80, bollingerBands: { upper: 285.20, middle: 278.40, lower: 271.60 } },
      analystRating: 'Strong Buy', priceTarget: { low: 280.00, average: 295.00, high: 310.00 },
    },
    WMT: {
      symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE',
      currentPrice: 168.25, change: -0.85, changePercent: -0.50,
      prediction: 'neutral', confidence: 58, targetPrice: 170.00,
      volume: 7234500, marketCap: '$457B', pe_ratio: 28.3,
      week52High: 175.50, week52Low: 148.30, avgVolume: 8456000,
      technicalIndicators: { rsi: 48.5, macd: 'Neutral', movingAvg50: 169.20, movingAvg200: 162.80, bollingerBands: { upper: 172.50, middle: 168.25, lower: 164.00 } },
      analystRating: 'Hold', priceTarget: { low: 165.00, average: 170.00, high: 180.00 },
    },
    HSBA: {
      symbol: 'HSBA', name: 'HSBC Holdings plc', exchange: 'LSE',
      currentPrice: 645.20, change: 8.40, changePercent: 1.32,
      prediction: 'bullish', confidence: 68, targetPrice: 680.00,
      volume: 32456700, marketCap: '£120B', pe_ratio: 9.5,
      week52High: 680.50, week52Low: 558.30, avgVolume: 35234000,
      technicalIndicators: { rsi: 59.7, macd: 'Bullish', movingAvg50: 632.40, movingAvg200: 615.20, bollingerBands: { upper: 658.30, middle: 645.20, lower: 632.10 } },
      analystRating: 'Buy', priceTarget: { low: 650.00, average: 680.00, high: 720.00 },
    },
    BP: {
      symbol: 'BP', name: 'BP plc', exchange: 'LSE',
      currentPrice: 485.60, change: -3.20, changePercent: -0.65,
      prediction: 'neutral', confidence: 55, targetPrice: 490.00,
      volume: 28345600, marketCap: '£85B', pe_ratio: 7.8,
      week52High: 525.40, week52Low: 425.30, avgVolume: 31234000,
      technicalIndicators: { rsi: 46.2, macd: 'Neutral', movingAvg50: 492.30, movingAvg200: 478.90, bollingerBands: { upper: 498.20, middle: 485.60, lower: 473.00 } },
      analystRating: 'Hold', priceTarget: { low: 470.00, average: 490.00, high: 520.00 },
    },
    '7203': {
      symbol: '7203', name: 'Toyota Motor Corporation', exchange: 'TSE',
      currentPrice: 2845.00, change: 35.50, changePercent: 1.26,
      prediction: 'bullish', confidence: 76, targetPrice: 3000.00,
      volume: 8234500, marketCap: '¥42T', pe_ratio: 10.5,
      week52High: 2980.00, week52Low: 2420.00, avgVolume: 9123000,
      technicalIndicators: { rsi: 63.2, macd: 'Bullish', movingAvg50: 2785.30, movingAvg200: 2698.20, bollingerBands: { upper: 2920.50, middle: 2845.00, lower: 2769.50 } },
      analystRating: 'Buy', priceTarget: { low: 2850.00, average: 3000.00, high: 3200.00 },
    },
    RELIANCE: {
      symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'BSE',
      currentPrice: 2845.30, change: 42.50, changePercent: 1.52,
      prediction: 'bullish', confidence: 79, targetPrice: 3050.00,
      volume: 12345600, marketCap: '₹19.2T', pe_ratio: 27.8,
      week52High: 3025.50, week52Low: 2320.40, avgVolume: 14234000,
      technicalIndicators: { rsi: 66.5, macd: 'Bullish', movingAvg50: 2765.80, movingAvg200: 2598.40, bollingerBands: { upper: 2925.40, middle: 2845.30, lower: 2765.20 } },
      analystRating: 'Strong Buy', priceTarget: { low: 2900.00, average: 3050.00, high: 3200.00 },
    },
    TCS: {
      symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'BSE',
      currentPrice: 3845.60, change: 28.40, changePercent: 0.74,
      prediction: 'bullish', confidence: 72, targetPrice: 4050.00,
      volume: 2345600, marketCap: '₹14.1T', pe_ratio: 29.5,
      week52High: 4125.80, week52Low: 3250.30, avgVolume: 2823000,
      technicalIndicators: { rsi: 60.8, macd: 'Bullish', movingAvg50: 3785.30, movingAvg200: 3642.80, bollingerBands: { upper: 3945.80, middle: 3845.60, lower: 3745.40 } },
      analystRating: 'Buy', priceTarget: { low: 3900.00, average: 4050.00, high: 4300.00 },
    },
    INFY: {
      symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE',
      currentPrice: 1542.80, change: 18.30, changePercent: 1.20,
      prediction: 'bullish', confidence: 69, targetPrice: 1650.00,
      volume: 8234500, marketCap: '₹6.4T', pe_ratio: 26.8,
      week52High: 1685.50, week52Low: 1325.40, avgVolume: 9123000,
      technicalIndicators: { rsi: 58.4, macd: 'Bullish', movingAvg50: 1518.60, movingAvg200: 1465.30, bollingerBands: { upper: 1598.40, middle: 1542.80, lower: 1487.20 } },
      analystRating: 'Buy', priceTarget: { low: 1580.00, average: 1650.00, high: 1750.00 },
    },
    '0700': {
      symbol: '0700', name: 'Tencent Holdings Ltd', exchange: 'HKEX',
      currentPrice: 385.60, change: 4.80, changePercent: 1.26,
      prediction: 'bullish', confidence: 75, targetPrice: 420.00,
      volume: 18234500, marketCap: 'HK$3.7T', pe_ratio: 22.8,
      week52High: 425.80, week52Low: 298.40, avgVolume: 21234000,
      technicalIndicators: { rsi: 62.3, macd: 'Bullish', movingAvg50: 372.40, movingAvg200: 348.80, bollingerBands: { upper: 398.20, middle: 385.60, lower: 373.00 } },
      analystRating: 'Buy', priceTarget: { low: 390.00, average: 420.00, high: 450.00 },
    },
  };

  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y'];

  const getExchangeStocks = (exchangeId: string): string[] => {
    return Object.entries(mockStockData)
      .filter(([, data]) => data.exchange === exchangeId)
      .map(([symbol]) => symbol);
  };

  const handleSearch = () => {
    if (!searchSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      const symbol = searchSymbol.toUpperCase();
      const data = mockStockData[symbol];
      if (!data) {
        const exchangeStocks = getExchangeStocks(selectedExchange);
        const exchangeName = exchanges.find(e => e.id === selectedExchange)?.name || selectedExchange;
        setStockData(null);
        setError(`Symbol "${symbol}" not found on ${exchangeName}. Try: ${exchangeStocks.slice(0, 4).join(', ')}`);
      } else if (data.exchange !== selectedExchange) {
        const exchangeStocks = getExchangeStocks(selectedExchange);
        const exchangeName = exchanges.find(e => e.id === selectedExchange)?.name || selectedExchange;
        const actualExchange = exchanges.find(e => e.id === data.exchange)?.name || data.exchange;
        setStockData(null);
        setError(`${symbol} trades on ${actualExchange}, not ${exchangeName}. Try: ${exchangeStocks.slice(0, 4).join(', ')}`);
      } else {
        setStockData(data);
        setError('');
      }
      setLoading(false);
    }, 1200);
  };

  const getExchangeCurrency = (exchangeId: string): string => {
    const map: Record<string, string> = {
      NYSE: 'USD', NASDAQ: 'USD', LSE: 'GBP', TSE: 'JPY',
      HKEX: 'HKD', SSE: 'CNY', NSE: 'INR', BSE: 'INR',
      ASX: 'AUD', TSX: 'CAD', FRA: 'EUR', EURONEXT: 'EUR',
    };
    return map[exchangeId] || 'USD';
  };

  const formatPrice = (price: number, exchangeId: string): string => {
    const currency = getExchangeCurrency(exchangeId);
    const symbol = getCurrencySymbol(currency);
    if (currency === 'JPY' || currency === 'KRW') return `${symbol}${price.toFixed(0)}`;
    return `${symbol}${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toString();
  };

  const getPredictionStyle = (prediction: string) => {
    switch (prediction) {
      case 'bullish': return 'bg-emerald-500/[0.06] border border-emerald-500/[0.15] text-emerald-700 dark:text-emerald-400';
      case 'bearish': return 'bg-red-500/[0.06] border border-red-500/[0.15] text-red-700 dark:text-red-400';
      default: return 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] text-gray-700 dark:text-gray-300';
    }
  };

  const getPredictionBarColor = (prediction: string) => {
    switch (prediction) {
      case 'bullish': return 'bg-emerald-500';
      case 'bearish': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'bullish': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'bearish': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRatingStyle = (rating: string) => {
    if (rating.includes('Buy')) return 'bg-emerald-500/[0.08] border border-emerald-500/[0.15] text-emerald-700 dark:text-emerald-400';
    if (rating.includes('Sell')) return 'bg-red-500/[0.08] border border-red-500/[0.15] text-red-700 dark:text-red-400';
    return 'bg-amber-500/[0.08] border border-amber-500/[0.15] text-amber-700 dark:text-amber-400';
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'Overbought', color: 'text-red-500', bg: 'bg-red-500' };
    if (rsi < 30) return { status: 'Oversold', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    return { status: 'Neutral', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-blue-500' };
  };

  const getMACDStyle = (macd: string) => {
    if (macd === 'Bullish') return 'text-emerald-600 dark:text-emerald-400';
    if (macd === 'Bearish') return 'text-red-500 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-300';
  };

  const popularNYSE = ['JPM', 'BAC', 'V', 'WMT'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
          Global Stock Price Prediction
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
          Advanced AI-powered stock analysis with real-time data from global exchanges
        </p>
      </div>

      <div className="bg-blue-500/[0.06] border border-blue-500/[0.12] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Advanced Prediction System
            </p>
            <p className="text-[12px] text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
              This system uses machine learning models trained on historical data, technical indicators, and market
              sentiment to provide comprehensive stock predictions. Demo version uses simulated real-time data from
              global exchanges.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white">Search Global Markets</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Select exchange, timeframe, and enter a ticker symbol</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Stock Exchange
              </label>
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200/80 dark:border-white/[0.07] rounded-xl bg-white dark:bg-white/[0.04] text-[13px] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
              >
                {exchanges.map((exchange) => (
                  <option key={exchange.id} value={exchange.id}>
                    {exchange.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Timeframe
              </label>
              <div className="flex gap-1.5">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`flex-1 px-2 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                      timeframe === tf
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter stock symbol (e.g., AAPL, GOOGL, MSFT, TSLA)"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200/80 dark:border-white/[0.07] rounded-xl bg-white dark:bg-white/[0.04] text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-3.5 h-3.5" />
                  Analyze Stock
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-500/[0.06] border border-red-500/[0.15] rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 dark:text-red-400 leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonResultCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 space-y-3">
              <SkeletonBlock className="w-32 h-5 mb-2" />
              <SkeletonBlock className="w-full h-20 rounded-xl" />
              <SkeletonBlock className="w-full h-12 rounded-xl" />
              <SkeletonBlock className="w-full h-12 rounded-xl" />
            </div>
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 space-y-3">
              <SkeletonBlock className="w-32 h-5 mb-2" />
              <SkeletonBlock className="w-full h-20 rounded-xl" />
              <SkeletonBlock className="w-full h-12 rounded-xl" />
              <SkeletonBlock className="w-full h-12 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {stockData && !loading && (
        <>
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
                    {stockData.symbol}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 rounded-full text-[11px] font-semibold border border-gray-200/60 dark:border-white/[0.08]">
                    {stockData.exchange}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">{stockData.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-bold tracking-tight text-gray-900 dark:text-white leading-none mb-1.5">
                  {formatPrice(stockData.currentPrice, stockData.exchange)}
                </p>
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                  stockData.change >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-500 dark:text-red-400'
                }`}>
                  {stockData.change >= 0
                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                    : <ArrowDownRight className="w-3.5 h-3.5" />
                  }
                  {formatPrice(Math.abs(stockData.change), stockData.exchange)}
                  {' '}({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Market Cap', value: stockData.marketCap },
                { label: 'P/E Ratio', value: stockData.pe_ratio.toString() },
                { label: 'Volume', value: formatVolume(stockData.volume) },
                { label: 'Avg Volume', value: formatVolume(stockData.avgVolume) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3.5 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[16px] font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">AI Prediction</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">ML-powered directional signal</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className={`p-4 rounded-xl ${getPredictionStyle(stockData.prediction)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPredictionIcon(stockData.prediction)}
                      <span className="text-[18px] font-bold capitalize">{stockData.prediction}</span>
                    </div>
                    <span className="text-[12px] font-semibold opacity-80">{stockData.confidence}% confidence</span>
                  </div>
                  <div className="h-1.5 bg-white/40 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getPredictionBarColor(stockData.prediction)} transition-all duration-700`}
                      style={{ width: `${stockData.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Target Price</span>
                  <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                    {formatPrice(stockData.targetPrice, stockData.exchange)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Potential Return</span>
                  <span className={`text-[15px] font-bold ${
                    stockData.targetPrice > stockData.currentPrice
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {((stockData.targetPrice - stockData.currentPrice) / stockData.currentPrice * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Analyst Ratings</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Wall Street consensus & price targets</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className={`p-4 rounded-xl text-center ${getRatingStyle(stockData.analystRating)}`}>
                  <p className="text-[20px] font-bold mb-0.5">{stockData.analystRating}</p>
                  <p className="text-[11px] font-semibold opacity-70 uppercase tracking-wide">Consensus Rating</p>
                </div>

                <div className="px-4 py-3 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
                    Price Target Range
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Low', value: stockData.priceTarget.low, color: 'text-gray-700 dark:text-gray-300' },
                      { label: 'Average', value: stockData.priceTarget.average, color: 'text-blue-600 dark:text-blue-400' },
                      { label: 'High', value: stockData.priceTarget.high, color: 'text-gray-700 dark:text-gray-300' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                        <p className={`text-[13px] font-bold ${color}`}>{formatPrice(value, stockData.exchange)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">52-Week Range</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                    {formatPrice(stockData.week52Low, stockData.exchange)} — {formatPrice(stockData.week52High, stockData.exchange)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <LineChart className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Technical Indicators</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">RSI, MACD, moving averages & Bollinger Bands</p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">RSI (14)</span>
                    <span className={`text-[11px] font-semibold ${getRSIStatus(stockData.technicalIndicators.rsi).color}`}>
                      {getRSIStatus(stockData.technicalIndicators.rsi).status}
                    </span>
                  </div>
                  <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                    {stockData.technicalIndicators.rsi}
                  </p>
                  <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getRSIStatus(stockData.technicalIndicators.rsi).bg} transition-all duration-700`}
                      style={{ width: `${stockData.technicalIndicators.rsi}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">MACD Signal</p>
                  <p className={`text-[22px] font-bold tracking-tight mb-1 ${getMACDStyle(stockData.technicalIndicators.macd)}`}>
                    {stockData.technicalIndicators.macd}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600">12, 26, 9 configuration</p>
                </div>

                <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Moving Averages</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">MA 50</span>
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                        {formatPrice(stockData.technicalIndicators.movingAvg50, stockData.exchange)}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">MA 200</span>
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white">
                        {formatPrice(stockData.technicalIndicators.movingAvg200, stockData.exchange)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Bollinger Bands (20, 2)
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Upper Band</p>
                    <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                      {formatPrice(stockData.technicalIndicators.bollingerBands.upper, stockData.exchange)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Middle Band</p>
                    <p className="text-[15px] font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(stockData.technicalIndicators.bollingerBands.middle, stockData.exchange)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Lower Band</p>
                    <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                      {formatPrice(stockData.technicalIndicators.bollingerBands.lower, stockData.exchange)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Analysis Summary</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">AI-generated key insights for {stockData.symbol}</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                Based on comprehensive technical analysis, market sentiment, and machine learning predictions,{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{stockData.symbol}</span> shows a{' '}
                <span className={`font-semibold ${
                  stockData.prediction === 'bullish' ? 'text-emerald-600 dark:text-emerald-400' :
                  stockData.prediction === 'bearish' ? 'text-red-500 dark:text-red-400' :
                  'text-gray-700 dark:text-gray-300'
                }`}>{stockData.prediction}</span> trend with{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{stockData.confidence}% confidence</span>.
              </p>

              <div className="bg-blue-500/[0.06] border border-blue-500/[0.12] rounded-xl p-4">
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-3">Key Insights</p>
                <div className="space-y-2.5">
                  {stockData.prediction === 'bullish' && (
                    <>
                      {[
                        'Strong upward momentum detected with price above both 50-day and 200-day moving averages',
                        'Positive MACD crossover signals continued bullish momentum in the near term',
                        'Analyst consensus supports buy rating with favorable price targets ahead',
                        'Trading volume exceeds average, indicating strong institutional investor interest',
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {stockData.prediction === 'bearish' && (
                    <>
                      {[
                        'Downward pressure observed with price trending below key support levels',
                        'Bearish MACD signal indicates potential for further short-term decline',
                        'Consider implementing stop-loss orders and active risk management strategies',
                        'Monitor for potential reversal signals at lower structural support levels',
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {stockData.prediction === 'neutral' && (
                    <>
                      {[
                        'Market showing consolidation patterns with mixed technical indicator signals',
                        'Price oscillating between defined support and resistance levels',
                        'Recommended to await clearer directional signals before taking new positions',
                        'Watch for breakout above resistance or breakdown below support for confirmation',
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/80 dark:bg-amber-500/[0.06] border border-amber-200/80 dark:border-amber-500/[0.15] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-amber-900 dark:text-amber-300 mb-0.5">Disclaimer</p>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                      This analysis is for educational and informational purposes only and should not be considered
                      financial advice. Stock investments carry inherent risks. Always conduct your own research and
                      consult a qualified financial advisor before making investment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!stockData && !loading && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-14 text-center">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-blue-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">No Stock Selected</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-7 max-w-sm mx-auto">
            Enter a stock symbol above to get comprehensive AI-powered analysis and price predictions.
          </p>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              Popular NYSE Stocks
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularNYSE.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => {
                    setSelectedExchange('NYSE');
                    setSearchSymbol(symbol);
                    setTimeout(() => {
                      setStockData(mockStockData[symbol]);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-blue-500/[0.08] hover:bg-blue-500/[0.14] text-blue-600 dark:text-blue-400 border border-blue-500/[0.15] rounded-xl text-[12px] font-semibold transition-all"
                >
                  Try {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
