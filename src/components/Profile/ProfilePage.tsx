import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Globe,
  DollarSign,
  Camera,
  Bell,
  BellOff,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Tag,
  CheckCircle,
  XCircle,
  Crown,
  Shield,
  AlertCircle,
  CreditCard,
  ChevronDown,
  Calendar,
  ArrowRight,
  History,
  TrendingDown,
  Target,
  Wallet,
  BarChart3,
  Activity,
  Receipt,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getTierDisplayName, getTierBadgeColor } from '../../lib/subscriptionHelpers';
import { countries, currencies as allCurrencies, getCurrencyForCountry } from '../../lib/countries';
import { convertCurrency } from '../../lib/currency';
import { CurrencyChangeModal } from '../Common/CurrencyChangeModal';

interface ProfileData {
  full_name: string;
  email_alerts: 'daily' | 'weekly' | 'none';
  currency: string;
  country: string;
  photo_url: string;
  language: string;
  timezone: string;
  theme: 'light' | 'dark';
  created_at?: string;
  alert_budget_threshold: boolean;
  alert_budget_threshold_pct: number;
  alert_large_transaction: boolean;
  alert_large_transaction_amount: number;
  alert_bill_reminder: boolean;
  alert_bill_reminder_days: number;
  alert_monthly_summary: boolean;
  alert_savings_goal_milestone: boolean;
  alert_low_balance: boolean;
  alert_low_balance_amount: number;
  alert_weekly_digest: boolean;
  alert_unusual_activity: boolean;
}

interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

interface AlertMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ProfilePageProps {
  initialTab?: string;
  onTabChange?: () => void;
}

type ActiveTab = 'profile' | 'security' | 'preferences' | 'categories';

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 dark:focus:ring-blue-400/20 dark:focus:border-blue-400/30 transition-all';

const fieldClassDisabled =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] text-gray-400 dark:text-gray-600 text-sm cursor-not-allowed';

const sectionLabel =
  'text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4';

const inputLabel =
  'block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const cardClass =
  'bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl';

export function ProfilePage({ initialTab, onTabChange }: ProfilePageProps = {}) {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useAppPreferences();
  const { tier, planDisplayName, hasFeatureAccess } = useSubscription();
  const canUseEmailAlerts = hasFeatureAccess('email_alerts');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (initialTab as ActiveTab) || 'profile'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [avatarHover, setAvatarHover] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email_alerts: 'weekly',
    currency: 'USD',
    country: '',
    photo_url: '',
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    alert_budget_threshold: true,
    alert_budget_threshold_pct: 80,
    alert_large_transaction: true,
    alert_large_transaction_amount: 500,
    alert_bill_reminder: true,
    alert_bill_reminder_days: 3,
    alert_monthly_summary: true,
    alert_savings_goal_milestone: true,
    alert_low_balance: false,
    alert_low_balance_amount: 100,
    alert_weekly_digest: true,
    alert_unusual_activity: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: '' as string,
    icon: '',
    color: '#3B82F6',
  });

  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  interface CurrencyHistoryEntry {
    id: string;
    from_currency: string;
    to_currency: string;
    exchange_rate: number;
    changed_at: string;
  }
  const [currencyHistory, setCurrencyHistory] = useState<CurrencyHistoryEntry[]>([]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'es', name: 'Spanish' },
    { code: 'zh', name: 'Chinese' },
  ];

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthMeta = (score: number) => {
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/5' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/5' };
    if (score === 3) return { label: 'Good', color: 'bg-yellow-400', width: 'w-3/5' };
    if (score === 4) return { label: 'Strong', color: 'bg-emerald-400', width: 'w-4/5' };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    loadProfile();
    loadCustomCategories();
    loadCustomTypes();
    loadPaymentMethods();
    loadCurrencyHistory();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as ActiveTab);
      if (onTabChange) {
        onTabChange();
      }
    }
  }, [initialTab]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          email_alerts: data.email_alerts || 'weekly',
          currency: data.currency || 'USD',
          country: data.country || '',
          photo_url: data.photo_url || '',
          language: data.language || 'en',
          timezone: data.timezone || 'UTC',
          theme: data.theme || 'light',
          created_at: data.created_at,
          alert_budget_threshold: data.alert_budget_threshold ?? true,
          alert_budget_threshold_pct: data.alert_budget_threshold_pct ?? 80,
          alert_large_transaction: data.alert_large_transaction ?? true,
          alert_large_transaction_amount: data.alert_large_transaction_amount ?? 500,
          alert_bill_reminder: data.alert_bill_reminder ?? true,
          alert_bill_reminder_days: data.alert_bill_reminder_days ?? 3,
          alert_monthly_summary: data.alert_monthly_summary ?? true,
          alert_savings_goal_milestone: data.alert_savings_goal_milestone ?? true,
          alert_low_balance: data.alert_low_balance ?? false,
          alert_low_balance_amount: data.alert_low_balance_amount ?? 100,
          alert_weekly_digest: data.alert_weekly_digest ?? true,
          alert_unusual_activity: data.alert_unusual_activity ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadCustomCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_preset', false);

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const loadCustomTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_transaction_types')
        .select('type_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setCustomTypes(data?.map(t => t.type_name) || []);
    } catch (error) {
      console.error('Error loading custom types:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_payment_methods')
        .select('method_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error && error.code !== 'PGRST116') throw error;
      setPaymentMethods(data?.map(m => m.method_name) || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadCurrencyHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('currency_change_history')
        .select('id, from_currency, to_currency, exchange_rate, changed_at')
        .eq('user_id', user?.id)
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCurrencyHistory(data || []);
    } catch (error) {
      console.error('Error loading currency history:', error);
    }
  };

  const updateProfile = async () => {
    if (!user?.id) {
      showAlert('error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        full_name: profileData.full_name,
        email_alerts: profileData.email_alerts,
        currency: profileData.currency,
        country: profileData.country,
        photo_url: profileData.photo_url,
        language: profileData.language,
        timezone: profileData.timezone,
        theme: profileData.theme,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(error.message || 'Failed to update profile');
      }

      if (!data) {
        throw new Error('No data returned after update');
      }

      await updatePreferences({
        currency: profileData.currency,
        language: profileData.language,
        theme: profileData.theme,
      });

      showAlert('success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showAlert('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;
      showAlert('success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'File size must be less than 5MB');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      setProfileData({ ...profileData, photo_url: publicUrl });

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      showAlert('success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showAlert('error', 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const addCustomCategory = async () => {
    if (!newCategory.type) {
      showAlert('error', 'Please select a category type');
      return;
    }

    if (!newCategory.name.trim()) {
      showAlert('error', 'Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('categories').insert({
        user_id: user?.id,
        name: newCategory.name,
        type: newCategory.type,
        icon: newCategory.icon || 'tag',
        color: newCategory.color,
        is_preset: false,
      });

      if (error) throw error;
      setNewCategory({ name: '', type: '', icon: '', color: '#3B82F6' });
      loadCustomCategories();
      loadCustomTypes();
      showAlert('success', 'Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      showAlert('error', 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      showAlert('success', 'Category deleted successfully');
      loadCustomCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showAlert('error', 'Failed to delete category');
    }
  };

  const addCustomType = async () => {
    if (!newType.trim()) {
      showAlert('error', 'Please enter a type name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('custom_transaction_types').insert({
        user_id: user?.id,
        type_name: newType,
        is_active: true,
      });

      if (error) throw error;
      setNewType('');
      loadCustomTypes();
      showAlert('success', 'Transaction type added successfully!');
    } catch (error) {
      console.error('Error adding type:', error);
      showAlert('error', 'Failed to add type');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomType = async (typeName: string) => {
    if (!confirm('Are you sure you want to delete this type?')) return;

    try {
      const { error } = await supabase
        .from('custom_transaction_types')
        .delete()
        .eq('user_id', user?.id)
        .eq('type_name', typeName);

      if (error) throw error;
      showAlert('success', 'Type deleted successfully');
      loadCustomTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      showAlert('error', 'Failed to delete type');
    }
  };

  const addPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) {
      showAlert('error', 'Please enter a payment method name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('custom_payment_methods').insert({
        user_id: user?.id,
        method_name: newPaymentMethod,
        is_active: true,
      });

      if (error) throw error;
      setNewPaymentMethod('');
      loadPaymentMethods();
      showAlert('success', 'Payment method added successfully!');
    } catch (error) {
      console.error('Error adding payment method:', error);
      showAlert('error', 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentMethod = async (methodName: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const { error } = await supabase
        .from('custom_payment_methods')
        .delete()
        .eq('user_id', user?.id)
        .eq('method_name', methodName);

      if (error) throw error;
      showAlert('success', 'Payment method deleted successfully');
      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      showAlert('error', 'Failed to delete payment method');
    }
  };

  const displayName = profileData.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = profileData.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  const pwScore = passwordStrength(passwordData.newPassword);
  const pwMeta = strengthMeta(pwScore);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'categories', label: 'Custom Fields', icon: Tag },
  ];

  const handleCurrencyConfirm = async () => {
    if (!pendingCurrency) return;
    const fromCurrency = profileData.currency;
    const toCurrency = pendingCurrency;

    setProfileData((prev) => ({ ...prev, currency: toCurrency }));
    updatePreferences({ currency: toCurrency });
    setPendingCurrency(null);

    if (user?.id && fromCurrency !== toCurrency) {
      try {
        const rate = convertCurrency(1, fromCurrency, toCurrency);
        await supabase.from('currency_change_history').insert({
          user_id: user.id,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          exchange_rate: rate,
          changed_at: new Date().toISOString(),
        });
        loadCurrencyHistory();
      } catch (err) {
        console.error('Error recording currency history:', err);
      }
    }
  };

  const handleCurrencyCancel = () => {
    setPendingCurrency(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {pendingCurrency && (
        <CurrencyChangeModal
          fromCurrency={profileData.currency}
          toCurrency={pendingCurrency}
          onConfirm={handleCurrencyConfirm}
          onCancel={handleCurrencyCancel}
        />
      )}

      {/* Hero Card */}
      <div className="relative rounded-2xl overflow-hidden border border-blue-900/40">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(59,130,246,0.18) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(6,182,212,0.12) 0%, transparent 60%), linear-gradient(135deg, #0f1f3d 0%, #0a1628 50%, #061020 100%)',
          }}
        />
        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div
            className="relative flex-shrink-0 cursor-pointer self-start sm:self-auto"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            <div className="w-20 h-20 rounded-full ring-2 ring-white/20 ring-offset-2 ring-offset-transparent overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-black/40">
              {profileData.photo_url ? (
                <img src={profileData.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold tracking-tight">{initials}</span>
              )}
            </div>
            <label
              className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 cursor-pointer transition-opacity duration-200 ${avatarHover ? 'opacity-100' : 'opacity-0'}`}
            >
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getTierBadgeColor(tier)}`}>
                {planDisplayName && tier !== 'free' ? planDisplayName : getTierDisplayName(tier)}
              </span>
            </div>
            <p className="text-[13px] text-blue-200/70 flex items-center gap-1.5 mb-4">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              {user?.email}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-[12px] font-medium text-white/80">{planDisplayName && tier !== 'free' ? planDisplayName : getTierDisplayName(tier)}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                <Calendar className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                <span className="text-[12px] font-medium text-white/80">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Card */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex border-b border-gray-200/80 dark:border-white/[0.06] overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isEmailAlertsLocked = id === 'email-alerts' && !canUseEmailAlerts;
            return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium transition-all whitespace-nowrap relative ${
                activeTab === id
                  ? 'text-blue-600 dark:text-blue-400'
                  : isEmailAlertsLocked
                  ? 'text-gray-400 dark:text-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {isEmailAlertsLocked && (
                <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
              )}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Alert Banner */}
          {alert && (
            <div
              className={`mb-6 px-4 py-3 rounded-xl border flex items-start gap-3 text-sm ${
                alert.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : alert.type === 'error'
                  ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300'
                  : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : alert.type === 'error' ? (
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <p className="flex-1 leading-snug">{alert.message}</p>
            </div>
          )}

          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <p className={sectionLabel}>Profile Information</p>

              {/* Photo */}
              <div className="flex items-center gap-5 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-md">
                  {profileData.photo_url ? (
                    <img src={profileData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-base font-bold">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-0.5">Profile Photo</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">JPG, PNG or GIF · Max 5MB</p>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] cursor-pointer transition-all shadow-sm">
                    <Camera className="w-3.5 h-3.5" />
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className={inputLabel}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className={`${fieldClass} pl-10`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className={inputLabel}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={`${fieldClassDisabled} pl-10`}
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-700 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">Email address cannot be changed</p>
              </div>

              {/* Country */}
              <div>
                <label className={inputLabel}>Country</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  <select
                    value={profileData.country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      const suggestedCurrency = newCountry ? getCurrencyForCountry(newCountry) : profileData.currency;
                      setProfileData({ ...profileData, country: newCountry });
                      if (suggestedCurrency !== profileData.currency) {
                        setPendingCurrency(suggestedCurrency);
                      }
                    }}
                    className={`${fieldClass} pl-10 pr-9 appearance-none`}
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className={inputLabel}>Language</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  <select
                    value={profileData.language}
                    onChange={(e) => {
                      const newLanguage = e.target.value;
                      setProfileData({ ...profileData, language: newLanguage });
                      updatePreferences({ language: newLanguage });
                    }}
                    className={`${fieldClass} pl-10 pr-9 appearance-none`}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                </div>
              </div>

              {/* Save */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* ─── SECURITY TAB ─── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <p className={sectionLabel}>Change Password</p>

              <div className="space-y-4">
                <div>
                  <label className={inputLabel}>Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={`${fieldClass} pl-10 pr-10`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={inputLabel}>New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`${fieldClass} pl-10 pr-10`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${pwMeta.color} ${pwMeta.width}`} />
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-600">{pwMeta.label} password</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className={inputLabel}>Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`${fieldClass} pl-10 pr-10`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1.5">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={changePassword}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  {loading ? 'Updating…' : 'Change Password'}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400 dark:text-red-500/60 mb-4">Danger Zone</p>
                <div className="rounded-xl border border-red-100 dark:border-red-500/[0.12] bg-red-50/50 dark:bg-red-500/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-1">Delete Account</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <button
                      disabled
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[12px] font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── PREFERENCES TAB ─── */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <p className={sectionLabel}>Regional Settings</p>

              <div className="space-y-4">
                <div>
                  <label className={inputLabel}>Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    <select
                      value={profileData.currency}
                      onChange={(e) => {
                        const newCurrency = e.target.value;
                        if (newCurrency !== profileData.currency) {
                          setPendingCurrency(newCurrency);
                        }
                      }}
                      className={`${fieldClass} pl-10 pr-9 appearance-none`}
                    >
                      {allCurrencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} — {currency.name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                  <p className={sectionLabel} style={{ marginBottom: 0 }}>Currency Change History</p>
                </div>

                {currencyHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mb-3">
                      <History className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1">No history yet</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600">Currency changes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currencyHistory.map((entry) => {
                      const rateDisplay =
                        entry.exchange_rate >= 1000
                          ? entry.exchange_rate.toLocaleString('en-US', { maximumFractionDigits: 2 })
                          : entry.exchange_rate >= 1
                          ? entry.exchange_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                          : entry.exchange_rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

                      const changedAt = new Date(entry.changed_at);
                      const dateStr = changedAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                      const timeStr = changedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] hover:border-blue-100 dark:hover:border-blue-500/[0.15] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/[0.08] text-[12px] font-bold text-gray-700 dark:text-gray-300">
                                {entry.from_currency}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-[12px] font-bold text-white shadow-sm shadow-blue-500/20">
                                {entry.to_currency}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">
                                1 {entry.from_currency} = {rateDisplay} {entry.to_currency}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-600">{dateStr} at {timeStr}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {false && activeTab === 'email-alerts' && (
            <div className="space-y-6">
              {!canUseEmailAlerts ? (
                <div className="rounded-2xl border border-blue-100 dark:border-blue-500/[0.15] bg-gradient-to-br from-blue-50 to-cyan-50/60 dark:from-blue-500/[0.07] dark:to-cyan-500/[0.04] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1.5">Upgrade to Access Email Alerts</h4>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                        Email alert configuration is available for Paid and Premium plan users.
                      </p>
                      <div className="space-y-1.5">
                        {[
                          'Budget threshold exceeded alerts',
                          'Large transaction detection',
                          'Bill due date reminders',
                          'Monthly financial summaries',
                          'Savings goal milestone notifications',
                          'Weekly spending digests',
                        ].map(item => (
                          <div key={item} className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={sectionLabel}>Alert Frequency</p>
                  <p className="text-[12px] text-gray-400 dark:text-gray-600 -mt-2 mb-4">How often you receive email digests</p>
                </div>
              </div>

              <div>
                <label className={inputLabel}>Email Digest Frequency</label>
                <div className="relative">
                  <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  <select
                    value={profileData.email_alerts}
                    onChange={(e) => setProfileData({ ...profileData, email_alerts: e.target.value as any })}
                    className={`${fieldClass} pl-10 pr-9 appearance-none`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">None (disable all digests)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <p className={`${sectionLabel} pt-4`}>Alert Types</p>
                <p className="text-[12px] text-gray-400 dark:text-gray-600 -mt-2 mb-4">Choose which events trigger an email notification</p>

                <div className="space-y-3">
                  {/* Budget Threshold */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/[0.1] border border-amber-100 dark:border-amber-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BarChart3 className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Budget Threshold Exceeded</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Alert when spending reaches a % of your budget</p>
                        {profileData.alert_budget_threshold && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Trigger at</span>
                            <input
                              type="number"
                              min={10}
                              max={100}
                              value={profileData.alert_budget_threshold_pct}
                              onChange={(e) => setProfileData({ ...profileData, alert_budget_threshold_pct: Number(e.target.value) })}
                              className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-[12px] text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">% of budget</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_budget_threshold: !profileData.alert_budget_threshold })}
                      className={`relative w-10 h-5.5 flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_budget_threshold ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_budget_threshold ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Large Transaction */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/[0.1] border border-red-100 dark:border-red-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Receipt className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Large Transaction Detected</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Alert when a single transaction exceeds a set amount</p>
                        {profileData.alert_large_transaction && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Above</span>
                            <input
                              type="number"
                              min={0}
                              value={profileData.alert_large_transaction_amount}
                              onChange={(e) => setProfileData({ ...profileData, alert_large_transaction_amount: Number(e.target.value) })}
                              className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-[12px] text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">{profileData.currency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_large_transaction: !profileData.alert_large_transaction })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_large_transaction ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_large_transaction ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Bill Reminder */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/[0.1] border border-blue-100 dark:border-blue-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Bill Due Reminder</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Remind me before a bill is due</p>
                        {profileData.alert_bill_reminder && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Alert</span>
                            <select
                              value={profileData.alert_bill_reminder_days}
                              onChange={(e) => setProfileData({ ...profileData, alert_bill_reminder_days: Number(e.target.value) })}
                              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-[12px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                              <option value={1}>1 day</option>
                              <option value={3}>3 days</option>
                              <option value={7}>7 days</option>
                              <option value={14}>14 days</option>
                            </select>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">before due date</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_bill_reminder: !profileData.alert_bill_reminder })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_bill_reminder ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_bill_reminder ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Monthly Summary */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/[0.1] border border-cyan-100 dark:border-cyan-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Monthly Summary Report</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Receive a monthly breakdown of income, spending, and savings</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_monthly_summary: !profileData.alert_monthly_summary })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_monthly_summary ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_monthly_summary ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Weekly Digest */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/[0.1] border border-blue-100 dark:border-blue-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Weekly Spending Digest</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">A weekly snapshot of your spending patterns and trends</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_weekly_digest: !profileData.alert_weekly_digest })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_weekly_digest ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_weekly_digest ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Savings Goal Milestone */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/[0.1] border border-emerald-100 dark:border-emerald-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Target className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Savings Goal Milestone</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Notify when a savings goal reaches 25%, 50%, 75%, or 100%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_savings_goal_milestone: !profileData.alert_savings_goal_milestone })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_savings_goal_milestone ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_savings_goal_milestone ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Low Balance */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/[0.1] border border-orange-100 dark:border-orange-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Wallet className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Low Balance Warning</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Alert when net balance falls below a threshold</p>
                        {profileData.alert_low_balance && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Below</span>
                            <input
                              type="number"
                              min={0}
                              value={profileData.alert_low_balance_amount}
                              onChange={(e) => setProfileData({ ...profileData, alert_low_balance_amount: Number(e.target.value) })}
                              className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-[12px] text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">{profileData.currency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_low_balance: !profileData.alert_low_balance })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_low_balance ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_low_balance ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Unusual Activity */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/[0.1] border border-red-100 dark:border-red-500/[0.2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Unusual Spending Pattern</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Alert when spending in a category spikes compared to your average</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileData({ ...profileData, alert_unusual_activity: !profileData.alert_unusual_activity })}
                      className={`relative flex-shrink-0 mt-0.5 rounded-full transition-colors duration-200 focus:outline-none ${profileData.alert_unusual_activity ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profileData.alert_unusual_activity ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 rounded-xl border border-blue-100 dark:border-blue-500/[0.12] bg-blue-50/50 dark:bg-blue-500/[0.05] p-4 flex items-start gap-3">
                <BellOff className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  These preferences will be applied when email notifications are activated. Set your digest frequency above to control how often alerts are batched and delivered.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving…' : 'Save Alert Preferences'}
                </button>
              </div>
              </div>
          )}

          {/* ─── CUSTOM FIELDS TAB ─── */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <p className={sectionLabel}>Custom Fields</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getTierBadgeColor(tier)}`}>
                  {getTierDisplayName(tier)}
                </span>
              </div>

              {tier === 'free' ? (
                <div className="rounded-2xl border border-blue-100 dark:border-blue-500/[0.15] bg-gradient-to-br from-blue-50 to-cyan-50/60 dark:from-blue-500/[0.07] dark:to-cyan-500/[0.04] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1.5">Upgrade to Access Custom Fields</h4>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                        Custom categories and transaction types are available for Paid and Premium plan users.
                      </p>
                      <div className="space-y-1.5">
                        {['Create custom income and expense categories', 'Add custom transaction types', 'Add custom payment methods'].map(item => (
                          <div key={item} className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Custom Categories */}
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02]">
                      <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Custom Categories</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={newCategory.type}
                            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as any })}
                            className={`${fieldClass} pr-9 appearance-none`}
                          >
                            <option value="">Type</option>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            {customTypes.map((type) => (
                              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <input
                          type="text"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="Category name"
                          className={`${fieldClass} flex-1`}
                        />
                        <button
                          onClick={addCustomCategory}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-500 transition-colors disabled:opacity-60 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {customCategories.length > 0 ? (
                        <div className="space-y-1.5">
                          {customCategories.map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
                            >
                              <div>
                                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{category.name}</p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-600 capitalize">{category.type}</p>
                              </div>
                              <button
                                onClick={() => deleteCustomCategory(category.id)}
                                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 text-[12px] text-gray-400 dark:text-gray-600">No custom categories yet</p>
                      )}
                    </div>
                  </div>

                  {/* Custom Transaction Types */}
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02]">
                      <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Custom Transaction Types</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          placeholder="e.g. investment, loan"
                          className={`${fieldClass} flex-1`}
                        />
                        <button
                          onClick={addCustomType}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-500 transition-colors disabled:opacity-60 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {customTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {customTypes.map((type) => (
                            <div
                              key={type}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/[0.06] text-[12px] font-medium text-gray-700 dark:text-gray-300"
                            >
                              <span className="capitalize">{type}</span>
                              <button
                                onClick={() => deleteCustomType(type)}
                                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 text-[12px] text-gray-400 dark:text-gray-600">No custom types yet</p>
                      )}
                    </div>
                  </div>

                  {/* Custom Payment Methods */}
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02]">
                      <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Custom Payment Methods</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                          <input
                            type="text"
                            value={newPaymentMethod}
                            onChange={(e) => setNewPaymentMethod(e.target.value)}
                            placeholder="e.g. PayPal, Venmo, Apple Pay"
                            className={`${fieldClass} pl-10`}
                          />
                        </div>
                        <button
                          onClick={addPaymentMethod}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-500 transition-colors disabled:opacity-60 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {paymentMethods.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {paymentMethods.map((method) => (
                            <div
                              key={method}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/[0.06] text-[12px] font-medium text-gray-700 dark:text-gray-300"
                            >
                              <span className="capitalize">{method}</span>
                              <button
                                onClick={() => deletePaymentMethod(method)}
                                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 text-[12px] text-gray-400 dark:text-gray-600">No custom payment methods yet</p>
                      )}

                      <div className="mt-2 p-3 rounded-xl border border-blue-100 dark:border-blue-500/[0.12] bg-blue-50/50 dark:bg-blue-500/[0.05]">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                          Custom payment methods appear in the transaction form alongside defaults like Cash, Card, and Bank Transfer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
