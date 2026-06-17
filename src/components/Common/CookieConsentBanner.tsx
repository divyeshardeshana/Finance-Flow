import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, CheckCircle } from 'lucide-react';

const CONSENT_KEY = 'ff_cookie_consent';

type ConsentState = {
  analytics: boolean;
  accepted: boolean;
};

function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(state: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
}

export function injectGoogleAnalytics(measurementId: string) {
  if (document.getElementById('ga-script')) return;
  const s = document.createElement('script');
  s.id = 'ga-script';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
  (window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, { anonymize_ip: true });
}

export function CookieConsentBanner({ gaMeasurementId }: { gaMeasurementId?: string }) {
  const [visible, setVisible] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(true);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      setVisible(true);
    } else if (existing.accepted && existing.analytics && gaMeasurementId) {
      injectGoogleAnalytics(gaMeasurementId);
    }
  }, [gaMeasurementId]);

  const acceptAll = () => {
    const state: ConsentState = { analytics: true, accepted: true };
    saveConsent(state);
    if (gaMeasurementId) injectGoogleAnalytics(gaMeasurementId);
    setVisible(false);
  };

  const acceptNecessary = () => {
    saveConsent({ analytics: false, accepted: true });
    setVisible(false);
  };

  const saveCustom = () => {
    const state: ConsentState = { analytics: analyticsChecked, accepted: true };
    saveConsent(state);
    if (analyticsChecked && gaMeasurementId) injectGoogleAnalytics(gaMeasurementId);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[9999] max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                <Cookie size={17} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">We use cookies</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  FinanceFlow uses essential cookies to keep you logged in and optional analytics cookies (Google Analytics) to improve our service. Your financial data is never shared with third parties.{' '}
                  <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
                </p>
              </div>
              <button
                onClick={acceptNecessary}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                title="Accept necessary only"
              >
                <X size={18} />
              </button>
            </div>

            {showCustomise && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/[0.06] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Essential cookies</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Authentication session - always required</p>
                  </div>
                  <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Analytics cookies</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Google Analytics - helps us improve the app</p>
                  </div>
                  <button
                    onClick={() => setAnalyticsChecked(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${analyticsChecked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${analyticsChecked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={acceptAll}
                className="flex-1 min-w-[120px] px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
              >
                Accept All
              </button>
              <button
                onClick={acceptNecessary}
                className="flex-1 min-w-[120px] px-4 py-2.5 border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Necessary Only
              </button>
              <button
                onClick={() => showCustomise ? saveCustom() : setShowCustomise(true)}
                className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
              >
                <Settings size={14} />
                {showCustomise ? 'Save' : 'Customise'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
