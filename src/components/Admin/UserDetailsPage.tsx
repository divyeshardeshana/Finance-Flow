import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { countries, currencies, getCountryName, getCurrencyName } from '../../lib/countries';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Globe,
  Shield,
  Pencil,
  Save,
  X,
  Clock,
  Monitor,
  MapPin,
  Activity,
  UserX,
  UserCheck,
  KeyRound,
  LogIn,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  user_type: string;
  is_admin: boolean;
  admin_role: string | null;
  country: string;
  currency: string;
  onboarding_completed: boolean;
  created_at: string;
  stripe_customer_id: string | null;
  payment_method_last4: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

interface UserSubscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  stripe_subscription_id: string | null;
  last_payment_date: string | null;
  next_billing_date: string | null;
  tier: {
    display_name: string;
    monthly_price: number;
  };
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_type: string | null;
  payment_method_last4: string | null;
  created_at: string;
}

interface LoginRecord {
  id: string;
  user_id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  login_method: string;
  success: boolean;
}

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logActivity } = useAdmin();
  const { user: adminUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [togglingActive, setTogglingActive] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    subscription_tier: '',
    user_type: '',
    country: '',
    currency: '',
    is_admin: false,
    admin_role: '' as string,
  });

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name || '',
        subscription_tier: user.subscription_tier || 'free',
        user_type: user.user_type || 'individual',
        country: user.country || '',
        currency: user.currency || 'USD',
        is_admin: user.is_admin || false,
        admin_role: user.admin_role || '',
      });
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) {
        setError('User not found');
        return;
      }

      setUser(userData);

      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          tier:subscription_tiers (
            display_name,
            monthly_price
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (!subError && subscriptionData) {
        setSubscription(subscriptionData as any);
      }

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('billing_history')
        .select('id, amount, currency, status, payment_method_type, payment_method_last4, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }

      try {
        const { data: loginData, error: loginError } = await supabase.rpc('admin_get_login_history', {
          p_user_id: userId,
          p_limit: 20,
        });
        if (!loginError && loginData) {
          setLoginHistory(loginData as LoginRecord[]);
        }
      } catch {
        // login history table may not have data yet
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !user) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updates: Record<string, any> = {
        full_name: editForm.full_name,
        subscription_tier: editForm.subscription_tier,
        user_type: editForm.user_type,
        country: editForm.country,
        currency: editForm.currency,
        is_admin: editForm.is_admin,
        admin_role: editForm.is_admin ? (editForm.admin_role || 'read_only') : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) throw updateError;

      await logActivity('edit_user', 'user', userId, {
        changes: updates,
      });

      setUser({ ...user, ...updates });
      setIsEditing(false);
      setSuccessMsg('User updated successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!userId || !user) return;
    setTogglingActive(true);
    try {
      const newActive = !user.is_active;
      const { error } = await supabase.rpc('admin_toggle_user_active', {
        p_user_id: userId,
        p_is_active: newActive,
      });
      if (error) throw error;
      setUser({ ...user, is_active: newActive });
      setSuccessMsg(newActive ? 'User activated' : 'User deactivated');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/?view=reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
      if (resetError) throw resetError;
      setSuccessMsg(`Password reset email sent to ${user.email}`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        full_name: user.full_name || '',
        subscription_tier: user.subscription_tier || 'free',
        user_type: user.user_type || 'individual',
        country: user.country || '',
        currency: user.currency || 'USD',
        is_admin: user.is_admin || false,
        admin_role: user.admin_role || '',
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      succeeded: 'bg-green-100 text-green-800 border-green-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status] || styles.pending;
  };

  const truncateUserAgent = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (ua.length <= 60) return ua;
    return ua.substring(0, 60) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Users</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error || 'User not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit User' : 'User Details'}
            </h1>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Modify user profile information' : 'Complete user information and subscription'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword || !user.email}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={user.email ? 'Send password reset email to user' : 'No email address on file'}
              >
                {resettingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
              <button
                onClick={handleToggleActive}
                disabled={togglingActive}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  user.is_active !== false
                    ? 'border border-red-300 text-red-600 hover:bg-red-50'
                    : 'border border-green-300 text-green-600 hover:bg-green-50'
                }`}
              >
                {user.is_active !== false ? (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>{togglingActive ? 'Deactivating...' : 'Deactivate User'}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{togglingActive ? 'Activating...' : 'Activate User'}</span>
                  </>
                )}
              </button>
            </>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit User</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed from the admin panel</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                    <select
                      value={editForm.user_type}
                      onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="individual">Individual</option>
                      <option value="family">Family</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="small_business">Small Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                    <select
                      value={editForm.subscription_tier}
                      onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-5 h-5 text-red-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Admin Access</h3>
                  </div>
                  <div className="flex items-center space-x-3 mb-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_admin}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            is_admin: e.target.checked,
                            admin_role: e.target.checked ? (editForm.admin_role || 'read_only') : '',
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Grant Admin Access</span>
                  </div>
                  {editForm.is_admin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Role</label>
                      <select
                        value={editForm.admin_role}
                        onChange={(e) => setEditForm({ ...editForm, admin_role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="read_only">Read Only</option>
                        <option value="support_agent">Support Agent</option>
                        <option value="content_manager">Content Manager</option>
                        <option value="billing_manager">Billing Manager</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-base font-medium text-gray-900">{user.full_name || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="text-base font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Account Created</p>
                    <p className="text-base font-medium text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Country / Currency</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.country ? getCountryName(user.country) : 'Not set'} / {user.currency ? `${user.currency} (${getCurrencyName(user.currency)})` : 'USD'}
                    </p>
                  </div>
                </div>
                {user.is_admin && (
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Admin Role</p>
                      <p className="text-base font-medium text-red-600">
                        {user.admin_role ? user.admin_role.replace('_', ' ').toUpperCase() : 'ADMIN'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
            {subscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="text-base font-medium text-gray-900">{subscription.tier.display_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(subscription.status)}`}>
                      {subscription.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="text-base font-medium text-gray-900">{formatDate(subscription.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Auto Renew</p>
                    <p className="text-base font-medium text-gray-900">
                      {subscription.auto_renew ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-600">
                          <AlertCircle className="w-4 h-4 mr-1" /> Disabled
                        </span>
                      )}
                    </p>
                  </div>
                  {subscription.next_billing_date && (
                    <div>
                      <p className="text-sm text-gray-600">Next Billing</p>
                      <p className="text-base font-medium text-gray-900">{formatDate(subscription.next_billing_date)}</p>
                    </div>
                  )}
                  {subscription.last_payment_date && (
                    <div>
                      <p className="text-sm text-gray-600">Last Payment</p>
                      <p className="text-base font-medium text-gray-900">{formatDate(subscription.last_payment_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No active subscription found</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(payment.created_at)}
                          {payment.payment_method_last4 && ` -- ---- ${payment.payment_method_last4}`}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No payment history found</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
                {loginHistory.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {loginHistory.length} record{loginHistory.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {user.last_login_at && loginHistory.length === 0 && (
                <span className="text-xs text-gray-500">
                  Last seen: {formatDateTime(user.last_login_at)}
                </span>
              )}
            </div>
            {loginHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date / Time</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Browser / Device</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loginHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 whitespace-nowrap text-gray-900 font-medium">
                          {formatDateTime(record.login_at)}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {record.ip_address || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 max-w-[200px] truncate" title={record.user_agent || ''}>
                          {truncateUserAgent(record.user_agent)}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            {record.login_method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <LogIn className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No login history available</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Login activity will appear here once the user signs in to their account.
                </p>
                {user.last_login_at && (
                  <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700">
                      Last login recorded on profile: <span className="font-medium">{formatDateTime(user.last_login_at)}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Key Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Account Created</p>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(user.created_at)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Monitor className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Total Logins</p>
                  <p className="text-sm font-medium text-gray-900">{loginHistory.length}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Country</p>
                  <p className="text-sm font-medium text-gray-900">{user.country ? getCountryName(user.country) : 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Subscription Tier</p>
                <p className="text-2xl font-bold text-blue-900 mt-1 capitalize">{user.subscription_tier}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-600 font-medium">User Type</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1 capitalize">
                  {user.user_type.replace('_', ' ')}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${user.is_active !== false ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-sm font-medium ${user.is_active !== false ? 'text-green-600' : 'text-red-600'}`}>Account Status</p>
                <p className={`text-2xl font-bold mt-1 ${user.is_active !== false ? 'text-green-900' : 'text-red-900'}`}>
                  {user.is_active !== false ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          {user.stripe_customer_id && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Stripe Customer ID</p>
                  <p className="text-xs font-mono text-gray-900 mt-1 break-all">{user.stripe_customer_id}</p>
                </div>
                {user.payment_method_last4 && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-sm text-gray-900 mt-1">---- {user.payment_method_last4}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
