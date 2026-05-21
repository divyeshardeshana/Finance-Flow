import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { countries } from '../../lib/countries';

interface CreateUserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  subscription_tier: string;
  user_type: string;
  country: string;
  currency: string;
  is_admin: boolean;
  admin_role: string;
}

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [refreshingSession, setRefreshingSession] = useState(false);

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    subscription_tier: 'free',
    user_type: 'individual',
    country: 'US',
    currency: 'USD',
    is_admin: false,
    admin_role: '',
  });

  useEffect(() => {
    if (!user) {
      setSessionValid(false);
      setError('Your session has expired. Please refresh your session or log in again.');
    } else {
      setSessionValid(true);
    }
  }, [user]);

  const handleRefreshSession = async () => {
    setRefreshingSession(true);
    setError(null);

    try {
      const token = await refreshSession();

      if (!token) {
        setSessionValid(false);
        setError('Failed to refresh session. Please log in again.');
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setSessionValid(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setSessionValid(false);
      setError('Failed to refresh session. Please log in again.');
    } finally {
      setRefreshingSession(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.full_name) {
      return 'Please fill in all required fields';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const token = await refreshSession();

      if (!token) {
        setSessionValid(false);
        throw new Error('Your session has expired. Please click "Refresh Session" or log in again.');
      }

      setSessionValid(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            subscription_tier: formData.subscription_tier,
            user_type: formData.user_type,
            country: formData.country,
            currency: formData.currency,
            is_admin: formData.is_admin,
            admin_role: formData.is_admin ? formData.admin_role : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Create user failed:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          details: result.details,
        });

        if (response.status === 401) {
          setSessionValid(false);
          throw new Error('Authentication failed. Please click "Refresh Session" and try again. If the problem persists, please log out and log back in.');
        }

        if (response.status === 409) {
          throw new Error('A user with this email address already exists.');
        }

        throw new Error(result.error || 'Failed to create user');
      }

      setSuccess(true);
      setCreatedUserId(result.user_id);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        subscription_tier: 'free',
        user_type: 'individual',
        country: 'US',
        currency: 'USD',
        is_admin: false,
        admin_role: '',
      });
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getCountryCurrency = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    return country?.currency || 'USD';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a new user to the system</p>
          </div>
        </div>
        <button
          onClick={handleRefreshSession}
          disabled={refreshingSession}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingSession ? 'animate-spin' : ''}`} />
          <span>{refreshingSession ? 'Refreshing...' : 'Refresh Session'}</span>
        </button>
      </div>

      {!sessionValid && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Session Expired</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your session has expired. Please click "Refresh Session" to continue, or log out and log back in.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">User Created Successfully</h3>
            <p className="text-sm text-green-700 mt-1">
              The user has been created and can now log in with their credentials.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={() => navigate(`/admin/users/${createdUserId}`)}
                className="text-sm font-medium text-green-700 hover:text-green-800"
              >
                View User Details
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="text-sm font-medium text-green-700 hover:text-green-800"
              >
                Back to User List
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription Tier
                </label>
                <select
                  name="subscription_tier"
                  value={formData.subscription_tier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="premium">Premium</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Select the subscription tier for this user
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Type
                </label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="individual">Individual</option>
                  <option value="family">Family</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="small_business">Small Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={(e) => {
                    handleChange(e);
                    const currency = getCountryCurrency(e.target.value);
                    setFormData((prev) => ({ ...prev, currency }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Access</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-700">
                  Grant admin privileges to this user
                </label>
              </div>

              {formData.is_admin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Role
                  </label>
                  <select
                    name="admin_role"
                    value={formData.admin_role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Role</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="billing_manager">Billing Manager</option>
                    <option value="support_agent">Support Agent</option>
                    <option value="content_manager">Content Manager</option>
                    <option value="read_only">Read Only</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
