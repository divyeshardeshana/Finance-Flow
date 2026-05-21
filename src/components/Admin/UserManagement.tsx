import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Search, Filter, ChevronDown, Eye, Pencil, UserX, UserCheck, KeyRound } from 'lucide-react';
import { countries, getCountryName } from '../../lib/countries';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  is_admin: boolean;
  created_at: string;
  onboarding_completed: boolean;
  country: string;
  user_type: string;
  is_active: boolean;
  last_login_at: string | null;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [resetNotification, setResetNotification] = useState<{ userId: string; type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, subscription_tier, is_admin, created_at, onboarding_completed, country, user_type, is_active, last_login_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const userCountries = useMemo(() => {
    const unique = new Set(users.map((u) => u.country).filter(Boolean));
    return Array.from(unique).sort();
  }, [users]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active !== false) ||
      (filterStatus === 'inactive' && user.is_active === false);

    const matchesCountry = filterCountry === 'all' || user.country === filterCountry;

    return matchesSearch && matchesTier && matchesStatus && matchesCountry;
  });

  const activeFilterCount = [filterTier, filterStatus, filterCountry].filter((f) => f !== 'all').length;

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setTogglingUser(userId);
    try {
      const { error } = await supabase.rpc('admin_toggle_user_active', {
        p_user_id: userId,
        p_is_active: !currentActive,
      });
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
    } catch (err) {
      console.error('Error toggling user status:', err);
    } finally {
      setTogglingUser(null);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const clearFilters = () => {
    setFilterTier('all');
    setFilterStatus('all');
    setFilterCountry('all');
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!email) {
      setResetNotification({ userId, type: 'error', message: 'No email address on file' });
      setTimeout(() => setResetNotification(null), 4000);
      return;
    }
    setResettingPassword(userId);
    try {
      const redirectTo = `${window.location.origin}/?view=reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setResetNotification({ userId, type: 'success', message: 'Reset email sent' });
    } catch {
      setResetNotification({ userId, type: 'error', message: 'Failed to send reset email' });
    } finally {
      setResettingPassword(null);
      setTimeout(() => setResetNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600">Manage users, subscriptions, and access</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/users/create')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create New User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Countries</option>
                    {userCountries.map((c) => (
                      <option key={c} value={c}>{getCountryName(c)}</option>
                    ))}
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No users found</p>
            {(searchTerm || activeFilterCount > 0) && (
              <button
                onClick={() => { setSearchTerm(''); clearFilters(); }}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${user.is_active === false ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${user.is_active === false ? 'bg-gray-200' : 'bg-blue-100'}`}>
                          <span className={`font-medium ${user.is_active === false ? 'text-gray-500' : 'text-blue-600'}`}>
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Unnamed User'}
                          </div>
                          {user.is_admin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierBadgeColor(user.subscription_tier)}`}>
                        {user.subscription_tier?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {user.user_type || 'Individual'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active === false
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastLogin(user.last_login_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}?edit=true`)}
                          className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          disabled={resettingPassword === user.id || !user.email}
                          className="flex items-center space-x-1 text-amber-600 hover:text-amber-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          title={user.email ? 'Send password reset email' : 'No email address on file'}
                        >
                          {resettingPassword === user.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : resetNotification?.userId === user.id ? (
                            <span className={resetNotification.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                              {resetNotification.message}
                            </span>
                          ) : (
                            <>
                              <KeyRound className="w-4 h-4" />
                              <span>Reset Password</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active !== false)}
                          disabled={togglingUser === user.id}
                          className={`flex items-center space-x-1 font-medium transition-colors ${
                            user.is_active === false
                              ? 'text-green-600 hover:text-green-800'
                              : 'text-red-500 hover:text-red-700'
                          } disabled:opacity-50`}
                          title={user.is_active === false ? 'Activate user' : 'Deactivate user'}
                        >
                          {user.is_active === false ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>Activate</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4" />
                              <span>Deactivate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
            <span className="font-medium">{users.length}</span> users
          </div>
        </div>
      </div>
    </div>
  );
}
