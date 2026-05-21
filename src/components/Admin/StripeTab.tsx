import { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { getSystemSettings, updateSystemSetting } from '../../lib/adminHelpers';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const STRIPE_KEYS = [
  'stripe_environment',
  'stripe_test_publishable_key',
  'stripe_test_secret_key',
  'stripe_test_webhook_secret',
  'stripe_live_publishable_key',
  'stripe_live_secret_key',
  'stripe_live_webhook_secret',
];

const SENSITIVE_KEYS = new Set([
  'stripe_test_secret_key',
  'stripe_test_webhook_secret',
  'stripe_live_secret_key',
  'stripe_live_webhook_secret',
]);

const KEY_PREFIXES: Record<string, string> = {
  stripe_test_publishable_key: 'pk_test_',
  stripe_test_secret_key: 'sk_test_',
  stripe_test_webhook_secret: 'whsec_',
  stripe_live_publishable_key: 'pk_live_',
  stripe_live_secret_key: 'sk_live_',
  stripe_live_webhook_secret: 'whsec_',
};

function validateKey(key: string, value: string): string | null {
  if (!value) return null;
  const prefix = KEY_PREFIXES[key];
  if (prefix && !value.startsWith(prefix)) {
    return `Must start with "${prefix}"`;
  }
  return null;
}

interface StripeTabProps {
  isSuperAdmin: boolean;
}

export default function StripeTab({ isSuperAdmin }: StripeTabProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const { logActivity } = useAdmin();
  const { user } = useAuth();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getSystemSettings();
      const map: Record<string, string> = {};
      for (const s of data ?? []) {
        if (STRIPE_KEYS.includes(s.setting_key)) {
          map[s.setting_key] = s.setting_value ?? '';
        }
      }
      setValues(map);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    const err = validateKey(key, value);
    setErrors((prev) => ({ ...prev, [key]: err ?? '' }));
  };

  const handleSave = async (key: string) => {
    if (!user || !isSuperAdmin) return;
    const value = (values[key] ?? '').trim();
    const err = validateKey(key, value);
    if (err) {
      setErrors((prev) => ({ ...prev, [key]: err }));
      return;
    }
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await updateSystemSetting(key, value, user.id);
      await logActivity('update_stripe_setting', 'system_setting', key, { key });
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2500);
      await load();
    } catch {
      alert('Error saving. Please try again.');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConnectionStatus({ success: false, message: 'Not authenticated.' });
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-stripe-connection`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await res.json();
      if (result.success) {
        setConnectionStatus({
          success: true,
          message: `Connected to ${result.businessName || 'Stripe Account'} (${result.livemode ? 'Live' : 'Test'} Mode)`,
        });
      } else {
        setConnectionStatus({ success: false, message: result.error || 'Connection failed.' });
      }
    } catch {
      setConnectionStatus({ success: false, message: 'Network error. Could not reach server.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const environment = values['stripe_environment'] ?? 'test';
  const isProduction = environment === 'production';

  const renderKeyField = (key: string, label: string, placeholder: string) => {
    const isSensitive = SENSITIVE_KEYS.has(key);
    const isVisible = visible[key];
    const isSaving = saving[key];
    const isSaved = saved[key];
    const err = errors[key];
    const value = values[key] ?? '';

    return (
      <div key={key} className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">{label}</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={isSensitive && !isVisible ? 'password' : 'text'}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={!isSuperAdmin}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-gray-900 dark:bg-gray-700 dark:text-white text-sm font-mono ${
                err ? 'border-red-400' : 'border-slate-300 dark:border-gray-600'
              }`}
            />
            {isSensitive && (
              <button
                onClick={() => setVisible((p) => ({ ...p, [key]: !p[key] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 transition-colors"
              >
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => handleSave(key)}
              disabled={isSaving || !!err}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isSaved
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : isSaved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {isSaving ? 'Saving' : isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isSuperAdmin && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Only Super Administrators can edit Stripe configuration.
          </p>
        </div>
      )}

      {isProduction && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 rounded-lg">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Production Mode Active</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              Live keys are in use. Real payments will be processed.
            </p>
          </div>
        </div>
      )}

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Active Environment</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
            Select which set of Stripe keys to use for payment processing.
          </p>
          <div className="flex gap-3">
            {(['test', 'production'] as const).map((env) => (
              <button
                key={env}
                disabled={!isSuperAdmin}
                onClick={() => {
                  handleChange('stripe_environment', env);
                  if (isSuperAdmin && user) {
                    updateSystemSetting('stripe_environment', env, user.id).then(load);
                  }
                }}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  environment === env
                    ? env === 'production'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-500'
                } disabled:cursor-not-allowed`}
              >
                {env === 'test' ? 'Test Mode' : 'Production Mode'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Test Mode Keys</h3>
          <span className="text-xs text-slate-400 dark:text-gray-500">Use for development and testing</span>
        </div>
        {renderKeyField('stripe_test_publishable_key', 'Test Publishable Key', 'pk_test_...')}
        {renderKeyField('stripe_test_secret_key', 'Test Secret Key', 'sk_test_...')}
        {renderKeyField('stripe_test_webhook_secret', 'Test Webhook Signing Secret', 'whsec_...')}
      </div>

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Production Keys</h3>
          <span className="text-xs text-slate-400 dark:text-gray-500">Use for live payments only</span>
        </div>
        {renderKeyField('stripe_live_publishable_key', 'Live Publishable Key', 'pk_live_...')}
        {renderKeyField('stripe_live_secret_key', 'Live Secret Key', 'sk_live_...')}
        {renderKeyField('stripe_live_webhook_secret', 'Live Webhook Signing Secret', 'whsec_...')}
      </div>

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Test Connection</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection || !isSuperAdmin}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-all"
          >
            {testingConnection ? (
              <><Loader2 size={15} className="animate-spin" /> Testing...</>
            ) : (
              <><RefreshCw size={15} /> Test Connection</>
            )}
          </button>
          <a
            href="https://dashboard.stripe.com/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={14} />
            Stripe Webhook Dashboard
          </a>
        </div>
        {connectionStatus && (
          <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
            connectionStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200'
          }`}>
            {connectionStatus.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{connectionStatus.message}</span>
          </div>
        )}
      </div>

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-blue-50 dark:bg-blue-900/10">
        <div className="flex items-start gap-3">
          <CreditCard size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-semibold">Webhook Setup</p>
            <p className="text-blue-700 dark:text-blue-400">
              Register the following endpoint in your Stripe Dashboard under Webhooks:
            </p>
            <code className="block mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-mono text-blue-900 dark:text-blue-200 break-all">
              {import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook
            </code>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              Events to listen for: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
