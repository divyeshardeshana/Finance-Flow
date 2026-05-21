import { useEffect, useState } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  Bot,
  Mail,
  Settings as SettingsIcon,
  Key,
  Loader2,
  CheckCircle2,
  Shield,
  FileText,
  Send,
  RefreshCw,
  XCircle,
  HardDrive,
  CreditCard,
} from 'lucide-react';
import { getSystemSettings, updateSystemSetting } from '../../lib/adminHelpers';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BackupTab from './BackupTab';
import OpenAITab from './OpenAITab';
import StripeTab from './StripeTab';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  settingKeys?: string[];
  isCustom?: boolean;
}

const TABS: TabConfig[] = [
  {
    id: 'email',
    label: 'Email',
    icon: <Mail size={18} />,
    description: 'Configure SMTP settings and email templates.',
    isCustom: true,
  },
  {
    id: 'email-content',
    label: 'Email Content',
    icon: <FileText size={18} />,
    description: 'Customize email content and templates sent to users.',
    isCustom: true,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield size={18} />,
    description: 'Configure authentication and access control.',
    isCustom: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    icon: <Bot size={18} />,
    description: 'Configure the OpenAI integration used by the financial assistant.',
    isCustom: true,
  },
  {
    id: 'general',
    label: 'General',
    icon: <SettingsIcon size={18} />,
    description: 'Application-wide settings such as trial periods, maintenance mode, rate limits, and currencies.',
    settingKeys: ['admin_email', 'trial_period_days', 'maintenance_mode', 'currency_api_key', 'max_file_upload_mb', 'rate_limit_per_minute', 'google_analytics_enabled', 'google_analytics_tracking_id', 'google_analytics_measurement_id'],
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: <HardDrive size={18} />,
    description: 'Create, manage, and restore system backups.',
    isCustom: true,
  },
  {
    id: 'stripe',
    label: 'Stripe',
    icon: <CreditCard size={18} />,
    description: 'Configure Stripe API keys, webhook secrets, and active environment for payment processing.',
    isCustom: true,
  },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('email');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  const { logActivity, hasPermission, adminRole } = useAdmin();
  const { user } = useAuth();
  const canEdit = hasPermission('manage_settings');
  const isSuperAdmin = adminRole === 'super_admin' || hasPermission('all');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings();
      setSettings(data || []);
      const initialValues: Record<string, string> = {};
      data?.forEach((setting: any) => {
        initialValues[setting.setting_key] = setting.setting_value;
      });
      setEditingValues(initialValues);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (key: string) => {
    setShowSensitive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async (settingKey: string) => {
    if (!user || !canEdit) return;

    const trimmedValue = (editingValues[settingKey] || '').trim();

    setValidationError(null);
    setSavingKey(settingKey);

    try {
      await updateSystemSetting(settingKey, trimmedValue, user.id);
      setEditingValues((prev) => ({ ...prev, [settingKey]: trimmedValue }));
      await logActivity('update_system_setting', 'system_setting', settingKey, {
        key: settingKey,
      });
      setSavedKey(settingKey);
      setTimeout(() => setSavedKey(null), 2000);
      await loadSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Error saving setting. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const getSettingByKey = (key: string) => {
    return settings.find((s) => s.setting_key === key);
  };

  const handleTestConnection = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      setConnectionStatus({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConnectionStatus({ success: false, message: 'Not authenticated. Please log in again.' });
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });

      const result = await response.json();

      if (!response.ok) {
        const detail = result.details ? ` (${result.details})` : '';
        setConnectionStatus({ success: false, message: (result.error || 'Test failed.') + detail });
        return;
      }

      setConnectionStatus({ success: result.success, message: result.message });
    } catch (error) {
      setConnectionStatus({ success: false, message: 'Network error. Could not reach the server.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const renderSettingField = (key: string, label?: string) => {
    const setting = getSettingByKey(key);
    if (!setting) return null;

    const value = editingValues[key] || '';
    const isVisible = showSensitive[key];
    const isSaving = savingKey === key;
    const isSaved = savedKey === key;
    const displayLabel = label || setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
          {displayLabel}
        </label>
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            {setting.setting_type === 'feature_flag' ? (
              <select
                value={value}
                onChange={(e) => setEditingValues({ ...editingValues, [key]: e.target.value })}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:bg-gray-700 text-sm bg-white dark:bg-gray-800"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            ) : (
              <div className="flex items-center">
                <input
                  type={setting.is_sensitive && !isVisible ? 'password' : 'text'}
                  value={value}
                  onChange={(e) => setEditingValues({ ...editingValues, [key]: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:bg-gray-700 text-sm"
                  placeholder={setting.description}
                />
                {setting.is_sensitive && (
                  <button
                    onClick={() => toggleVisibility(key)}
                    className="ml-2 p-2 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => handleSave(key)}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isSaved
                  ? 'bg-emerald-50 dark:bg-green-900/20 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save</span>
                </>
              )}
            </button>
          )}
        </div>
        {setting.description && (
          <p className="text-xs text-slate-500 dark:text-gray-400">{setting.description}</p>
        )}
      </div>
    );
  };

  const renderEmailTab = () => {
    return (
      <div className="space-y-6">
        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-4">SMTP Configuration</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Configure your email service provider settings (Zoho, Gmail, Office 365, etc.)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              {renderSettingField('smtp_provider', 'Email Provider')}
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {renderSettingField('smtp_host', 'SMTP Host')}
              {renderSettingField('smtp_port', 'SMTP Port')}
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {renderSettingField('smtp_username', 'SMTP Username')}
              {renderSettingField('smtp_password', 'SMTP Password')}
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {renderSettingField('smtp_from_email', 'From Email')}
              {renderSettingField('smtp_from_name', 'From Name')}
            </div>
            <div className="col-span-2">
              {renderSettingField('smtp_use_tls', 'Use TLS/STARTTLS')}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Send Test Email</h4>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Recipient email address"
                className="flex-1 min-w-[240px] px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || !canEdit}
                className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm"
              >
                {testingConnection ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
            {connectionStatus && (
              <div className={`mt-3 flex items-center space-x-2 text-sm px-3 py-2 rounded-lg ${
                connectionStatus.success
                  ? 'bg-emerald-50 dark:bg-green-900/20 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200'
              }`}>
                {connectionStatus.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{connectionStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-slate-50 dark:bg-gray-900">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-2">Email Identity</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Configure how emails appear to recipients
          </p>
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="text-slate-400 mt-1" size={18} />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">From Name</h4>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">{editingValues['smtp_from_name'] || 'YourApp'}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  The sender name that appears in recipient email clients
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailContentTab = () => {
    const subjectTemplate = editingValues['email_subject_template'] || 'Your [EVENT_TYPE] - [EVENT_DATE]';
    const footerText = editingValues['email_footer_text'] || 'Created with ❤️ by YourApp';
    const helpText = editingValues['email_help_text'] || 'Need help? Reply to this email.';

    return (
      <div className="space-y-6">
        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-2">Email Subject Line</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Customize the subject line for event plan emails. Use [EVENT_TYPE] and [EVENT_DATE] as placeholders.
          </p>
          {renderSettingField('email_subject_template', 'Email Subject Template')}
          <div className="mt-3 p-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg">
            <p className="text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">Available placeholders:</p>
            <p className="text-xs text-slate-600 dark:text-gray-400">[EVENT_TYPE], [EVENT_DATE], [USER_NAME], [GUEST_COUNT]</p>
          </div>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-800 mb-1">Preview Example:</p>
            <p className="text-sm text-blue-700">Your Wedding Event Plan - 2024-06-15</p>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-2">Email Footer Text</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Customize the footer text that appears at the bottom of event plan emails.
          </p>
          {renderSettingField('email_footer_text', 'Footer Text')}
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
            This text will appear as the first line in the email footer.
          </p>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-2">Help Text</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Customize the help text that appears in the email footer to guide users on getting support.
          </p>
          {renderSettingField('email_help_text', 'Help Text')}
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
            This text will appear as the second line in the email footer.
          </p>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-slate-50 dark:bg-gray-900">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-2">Email Preview</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Preview how the email footer will appear to users
          </p>
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-700 dark:text-gray-300 mb-1">{footerText}</p>
            <p className="text-sm text-slate-600 dark:text-gray-400">{helpText}</p>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-blue-50 dark:bg-blue-900/30">
          <h3 className="text-md font-semibold text-blue-900 mb-2">Configuration Notes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Placeholders:</strong> Use [EVENT_TYPE], [EVENT_DATE], [USER_NAME], and [GUEST_COUNT] in the subject line for dynamic content.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Instant Updates:</strong> Changes will be applied immediately to all new event plan emails.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Formatting:</strong> Basic HTML formatting is supported in footer text if needed.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Best Practice:</strong> Keep email content professional and helpful for the best user experience.</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderSecurityTab = () => {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-semibold text-red-800">Security Warning</h4>
              <p className="text-sm text-red-700 mt-1">
                Changing security settings will affect all users. Test thoroughly before applying in production.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Authentication Settings</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Configure user authentication and session management
          </p>
          <div className="space-y-4">
            {renderSettingField('enable_2fa', 'Enable Two-Factor Authentication')}
            {renderSettingField('session_timeout_hours', 'Session Timeout (hours)')}
            {renderSettingField('jwt_expiration_days', 'JWT Token Expiration (days)')}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                JWT Secret Key
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  {renderSettingField('jwt_secret_key')}
                </div>
                <button
                  onClick={() => {
                    const secret = generateSecret();
                    setEditingValues({ ...editingValues, jwt_secret_key: secret });
                  }}
                  disabled={!canEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  <RefreshCw size={16} />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Password Requirements</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Set password complexity and security rules
          </p>
          <div className="space-y-4">
            {renderSettingField('min_password_length', 'Minimum Password Length')}
            {renderSettingField('require_special_chars', 'Require Special Characters')}
            {renderSettingField('require_numbers', 'Require Numbers')}
            {renderSettingField('require_uppercase', 'Require Uppercase Letters')}
            {renderSettingField('prevent_password_reuse', 'Prevent Password Reuse')}
            {renderSettingField('password_history_count', 'Password History Count')}
          </div>
        </div>

        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Account Security</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            Configure account protection and lockout policies
          </p>
          <div className="space-y-4">
            {renderSettingField('enable_account_lockout', 'Enable Account Lockout')}
            {renderSettingField('max_login_attempts', 'Max Login Attempts')}
            {renderSettingField('lockout_duration_minutes', 'Lockout Duration (minutes)')}
            {renderSettingField('enable_ip_whitelist', 'Enable IP Whitelist')}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                Allowed IP Addresses
              </label>
              <textarea
                value={editingValues['allowed_ip_addresses'] || ''}
                onChange={(e) => setEditingValues({ ...editingValues, allowed_ip_addresses: e.target.value })}
                disabled={!canEdit}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:bg-gray-700 text-sm font-mono"
                placeholder="192.168.1.1, 10.0.0.1 (comma-separated)"
              />
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Only these IP addresses will be allowed to access admin features
              </p>
              {canEdit && (
                <button
                  onClick={() => handleSave('allowed_ip_addresses')}
                  disabled={savingKey === 'allowed_ip_addresses'}
                  className="mt-2 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {savingKey === 'allowed_ip_addresses' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving</span>
                    </>
                  ) : savedKey === 'allowed_ip_addresses' ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30/50'
                    : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 dark:text-gray-300 hover:border-slate-300 dark:border-gray-600'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{currentTab.label} Configuration</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{currentTab.description}</p>
          </div>

          {currentTab.isCustom ? (
            <>
              {activeTab === 'email' && renderEmailTab()}
              {activeTab === 'email-content' && renderEmailContentTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'openai' && (
                <OpenAITab
                  settings={settings}
                  editingValues={editingValues}
                  setEditingValues={setEditingValues}
                  canEdit={canEdit}
                  onReload={loadSettings}
                />
              )}
              {activeTab === 'backup' && <BackupTab />}
              {activeTab === 'stripe' && <StripeTab isSuperAdmin={isSuperAdmin} />}
            </>
          ) : (
            <div className="space-y-4">
              {currentTab.settingKeys?.map((key) => {
                const setting = getSettingByKey(key);
                if (!setting) return null;

                const value = editingValues[key] || '';
                const isVisible = showSensitive[key];
                const isSaving = savingKey === key;
                const isSaved = savedKey === key;

                return (
                  <div key={key} className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 hover:border-slate-300 dark:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </h4>
                          {setting.is_sensitive && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200">
                              Sensitive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{setting.description}</p>
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap ml-4">
                        Updated {new Date(setting.updated_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex-1 relative">
                        {setting.setting_type === 'feature_flag' ? (
                          <select
                            value={value}
                            onChange={(e) =>
                              setEditingValues({ ...editingValues, [key]: e.target.value })
                            }
                            disabled={!canEdit}
                            className="w-full px-3 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:bg-gray-700 text-sm bg-white dark:bg-gray-800"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        ) : (
                          <div className="flex items-center">
                            <input
                              type={setting.is_sensitive && !isVisible ? 'password' : 'text'}
                              value={value}
                              onChange={(e) =>
                                setEditingValues({ ...editingValues, [key]: e.target.value })
                              }
                              disabled={!canEdit}
                              className="w-full px-3 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:bg-gray-700 text-sm font-mono"
                              placeholder={`Enter ${setting.setting_key.replace(/_/g, ' ')}`}
                            />
                            {setting.is_sensitive && (
                              <button
                                onClick={() => toggleVisibility(key)}
                                className="ml-2 p-2.5 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                              >
                                {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => handleSave(key)}
                          disabled={isSaving}
                          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            isSaved
                              ? 'bg-emerald-50 dark:bg-green-900/20 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                          }`}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Saving</span>
                            </>
                          ) : isSaved ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-yellow-900/20 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Key className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Security Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              API keys and sensitive settings are stored securely. Only super administrators can
              modify these settings. Always keep your API keys confidential and never share them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
