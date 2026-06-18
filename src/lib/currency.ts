const fallbackRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
  JPY: 149.50,
  CNY: 7.24,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  AED: 3.67,
  SGD: 1.34,
  HKD: 7.82,
  KRW: 1325.0,
  BRL: 4.97,
  ZAR: 18.63,
  SAR: 3.75,
  TRY: 32.10,
  RUB: 91.50,
  MXN: 17.15,
  THB: 35.10,
  NGN: 1580.0,
  PKR: 278.0,
  EGP: 48.60,
  PLN: 3.98,
  SEK: 10.42,
  NOK: 10.55,
  DKK: 6.88,
  NZD: 1.63,
  ARS: 870.0,
  BDT: 110.0,
  CLP: 950.0,
  COP: 3900.0,
  CZK: 22.85,
  IDR: 15750.0,
  ILS: 3.70,
  KES: 130.0,
  MYR: 4.72,
  PEN: 3.72,
  PHP: 55.80,
  VND: 24800.0,
  VES: 36.50,
};

const liveRateCache: Record<string, { rate: number; fetchedAt: number }> = {};

export async function fetchLiveRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = liveRateCache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) {
    return cached.rate;
  }

  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${fromCurrency}`
    );
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    if (data.result !== 'success' || !data.rates) throw new Error('Invalid response');

    const rate = data.rates[toCurrency];
    if (!rate) throw new Error('Currency not found');

    liveRateCache[cacheKey] = { rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    const fromRate = fallbackRates[fromCurrency] || 1;
    const toRate = fallbackRates[toCurrency] || 1;
    return toRate / fromRate;
  }
}

const currencyConfig: Record<string, { symbol: string; locale: string; decimals: number }> = {
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
  INR: { symbol: '₹', locale: 'en-IN', decimals: 2 },
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 },
  CNY: { symbol: '¥', locale: 'zh-CN', decimals: 2 },
  AUD: { symbol: 'A$', locale: 'en-AU', decimals: 2 },
  CAD: { symbol: 'C$', locale: 'en-CA', decimals: 2 },
  CHF: { symbol: 'Fr', locale: 'de-CH', decimals: 2 },
  AED: { symbol: 'د.إ', locale: 'en-US', decimals: 2 },
  SGD: { symbol: 'S$', locale: 'en-SG', decimals: 2 },
  HKD: { symbol: 'HK$', locale: 'zh-HK', decimals: 2 },
  KRW: { symbol: '₩', locale: 'ko-KR', decimals: 0 },
  BRL: { symbol: 'R$', locale: 'pt-BR', decimals: 2 },
  ZAR: { symbol: 'R', locale: 'en-ZA', decimals: 2 },
  SAR: { symbol: 'SR', locale: 'en-US', decimals: 2 },
  TRY: { symbol: '₺', locale: 'tr-TR', decimals: 2 },
  RUB: { symbol: '₽', locale: 'ru-RU', decimals: 2 },
  MXN: { symbol: 'MX$', locale: 'es-MX', decimals: 2 },
  THB: { symbol: '฿', locale: 'th-TH', decimals: 2 },
  NGN: { symbol: '₦', locale: 'en-NG', decimals: 2 },
  PKR: { symbol: '₨', locale: 'ur-PK', decimals: 2 },
  EGP: { symbol: 'E£', locale: 'en-US', decimals: 2 },
  PLN: { symbol: 'zł', locale: 'pl-PL', decimals: 2 },
  SEK: { symbol: 'kr', locale: 'sv-SE', decimals: 2 },
  NOK: { symbol: 'kr', locale: 'nb-NO', decimals: 2 },
  DKK: { symbol: 'kr', locale: 'da-DK', decimals: 2 },
  NZD: { symbol: 'NZ$', locale: 'en-NZ', decimals: 2 },
  ARS: { symbol: '$', locale: 'es-AR', decimals: 2 },
  BDT: { symbol: '৳', locale: 'bn-BD', decimals: 2 },
  CLP: { symbol: 'CL$', locale: 'es-CL', decimals: 0 },
  COP: { symbol: 'CO$', locale: 'es-CO', decimals: 0 },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', decimals: 2 },
  IDR: { symbol: 'Rp', locale: 'id-ID', decimals: 0 },
  ILS: { symbol: '₪', locale: 'he-IL', decimals: 2 },
  KES: { symbol: 'KSh', locale: 'sw-KE', decimals: 2 },
  MYR: { symbol: 'RM', locale: 'ms-MY', decimals: 2 },
  PEN: { symbol: 'S/', locale: 'es-PE', decimals: 2 },
  PHP: { symbol: '₱', locale: 'fil-PH', decimals: 2 },
  VND: { symbol: '₫', locale: 'vi-VN', decimals: 0 },
  VES: { symbol: 'Bs.', locale: 'es-VE', decimals: 2 },
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = fallbackRates[fromCurrency] || 1;
  const toRate = fallbackRates[toCurrency] || 1;

  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export function formatCurrency(amount: number, currency: string): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  const safeCurrency = currency || 'USD';
  const config = currencyConfig[safeCurrency] || { symbol: '$', locale: 'en-US', decimals: 2 };

  const formatted = amount.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  });

  // ‎ is LTR mark — prevents bidi algorithm from flipping RTL currency symbols (e.g. AED د.إ)
  return `‎${config.symbol}${formatted}`;
}

export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString();
}

export function getCurrencySymbol(currency: string): string {
  const config = currencyConfig[currency];
  return config ? config.symbol : currency;
}
