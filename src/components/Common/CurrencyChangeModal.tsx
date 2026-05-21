import { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, X, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { currencies as allCurrencies } from '../../lib/countries';

interface CurrencyChangeModalProps {
  fromCurrency: string;
  toCurrency: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function getCurrencyName(code: string): string {
  const found = allCurrencies.find((c) => c.code === code);
  return found ? found.name : code;
}

const EXAMPLE_AMOUNTS = [100, 500, 1000];

export function CurrencyChangeModal({
  fromCurrency,
  toCurrency,
  onConfirm,
  onCancel,
}: CurrencyChangeModalProps) {
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLiveRate(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    fetch(`${supabaseUrl}/functions/v1/get-currency-rate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fromCurrency, toCurrency }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setLiveRate(data.liveRate ?? null);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [fromCurrency, toCurrency]);

  const displayRate = liveRate ?? 1;
  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);
  const fromName = getCurrencyName(fromCurrency);
  const toName = getCurrencyName(toCurrency);

  function formatRate(rate: number) {
    if (rate >= 1000)
      return rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (rate >= 1)
      return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200/80 dark:border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm shadow-blue-500/20">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">
                Currency Conversion
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-600">Live exchange rate from open.er-api.com</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 dark:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currency change display */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
            <div className="text-center flex-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] shadow-sm mb-2">
                <span className="text-[15px] font-bold text-gray-700 dark:text-gray-300">{fromSymbol}</span>
              </div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{fromCurrency}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 max-w-[100px] mx-auto leading-tight">{fromName}</p>
            </div>

            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/[0.12] border border-blue-100 dark:border-blue-500/[0.2]">
                <ArrowRight className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
            </div>

            <div className="text-center flex-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-sm shadow-blue-500/20 mb-2">
                <span className="text-[15px] font-bold text-white">{toSymbol}</span>
              </div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{toCurrency}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 max-w-[100px] mx-auto leading-tight">{toName}</p>
            </div>
          </div>

          {/* Live market rate */}
          <div className="mt-3 flex items-center gap-2 py-3 px-4 rounded-xl bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-100 dark:border-blue-500/[0.15]">
            {loading ? (
              <Loader2 className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin flex-shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            )}
            <p className="text-[13px] font-medium text-blue-700 dark:text-blue-300">
              {loading
                ? 'Fetching live rate…'
                : liveRate !== null
                ? `1 ${fromCurrency} = ${formatRate(liveRate)} ${toCurrency}`
                : 'Live rate unavailable'}
            </p>
          </div>

          {/* Example conversions */}
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2.5">
              Example Conversions
            </p>
            <div className="space-y-2">
              {EXAMPLE_AMOUNTS.map((amount) => {
                const converted = loading ? null : amount * displayRate;
                return (
                  <div
                    key={amount}
                    className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]"
                  >
                    <span className="text-[13px] text-gray-600 dark:text-gray-400 font-medium">
                      {formatCurrency(amount, fromCurrency)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-600">=</span>
                      {loading ? (
                        <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-600">...</span>
                      ) : (
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(converted!, toCurrency)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-3 flex items-start gap-2 py-2.5 px-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
              Rate sourced from open.er-api.com. Actual rate at time of conversion may differ. All amounts are converted to {toCurrency} using indicative rates.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01]">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}
