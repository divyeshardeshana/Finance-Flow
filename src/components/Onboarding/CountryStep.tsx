import { useState, useRef, useEffect } from 'react';
import { Globe, Search, ChevronLeft, ChevronDown, Check } from 'lucide-react';
import { countries, countryCurrencyMap, currencies } from '../../lib/countries';

interface CountryStepProps {
  onComplete: (countryCode: string, currency: string) => void;
  onBack: () => void;
}

export function CountryStep({ onComplete, onBack }: CountryStepProps) {
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountryObj = countries.find((c) => c.code === selectedCountry);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    const suggestedCurrency = countryCurrencyMap[code] || 'USD';
    setSelectedCurrency(suggestedCurrency);
    setDropdownOpen(false);
    setSearch('');
  };

  const handleContinue = () => {
    if (selectedCountry) {
      onComplete(selectedCountry, selectedCurrency);
    }
  };

  const currencyObj = currencies.find((c) => c.code === selectedCurrency);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-teal-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Where are you based?</h2>
      </div>
      <p className="text-gray-600 mb-8 ml-13 pl-0">
        We'll suggest investment plans specific to your country — like EPF &amp; PPF for India, 401(k) for the US, and more.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Country</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-left transition-all ${
                dropdownOpen
                  ? 'border-teal-500 bg-teal-50'
                  : selectedCountry
                  ? 'border-teal-400 bg-white'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-teal-500" />
                </div>
                {selectedCountryObj ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedCountryObj.name}</p>
                    <p className="text-xs text-gray-500">{selectedCountryObj.code}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Select your country...</p>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search countries..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/60"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No countries found</p>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c.code)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-teal-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-400 w-6">{c.code}</span>
                          <span className="text-sm font-medium text-gray-800">{c.name}</span>
                        </div>
                        {selectedCountry === c.code && (
                          <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedCountry && (
          <div className="p-4 bg-teal-50 border border-teal-200/60 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-teal-800 mb-0.5">
                  {selectedCountryObj?.name} detected
                </p>
                <p className="text-xs text-teal-600">
                  We'll show you investment plans specific to {selectedCountryObj?.name}, like{' '}
                  {selectedCountry === 'IN'
                    ? 'EPF, PPF, NPS, APY & Mutual Funds'
                    : selectedCountry === 'US'
                    ? '401(k), Roth IRA, HYSA & more'
                    : selectedCountry === 'GB'
                    ? 'ISA, Workplace Pension, SIPP & more'
                    : selectedCountry === 'CA'
                    ? 'TFSA, RRSP, FHSA & more'
                    : selectedCountry === 'AU'
                    ? 'Superannuation, Index ETFs & more'
                    : selectedCountry === 'SG'
                    ? 'CPF, SRS, Singapore Savings Bonds & more'
                    : selectedCountry === 'AE'
                    ? 'National Bonds, REITs, Sukuk & more'
                    : 'locally relevant investment plans'}
                  .
                </p>
                {currencyObj && (
                  <p className="text-xs text-teal-600 mt-1">
                    Default currency set to{' '}
                    <span className="font-semibold">
                      {currencyObj.symbol} {currencyObj.code} — {currencyObj.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => onComplete('', 'USD')}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
        >
          Skip for now
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedCountry}
          className="flex-1 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
