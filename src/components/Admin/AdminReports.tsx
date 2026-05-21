import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Target, Download } from 'lucide-react';
import { getDashboardStats } from '../../lib/adminHelpers';
import { formatCurrency } from '../../lib/currency';

export default function AdminReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600 dark:text-gray-400">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.totalUsers?.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.activeSubscriptions?.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.openTickets?.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <Target className="text-orange-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {formatCurrency(stats?.monthlyRevenue || 0, 'USD')}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <DollarSign className="text-purple-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analytics Overview</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">User Growth</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">New Users (30 days)</span>
                <span className="font-medium text-slate-900 dark:text-white">Coming Soon</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Active Users</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats?.totalUsers}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Revenue Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">MRR (Monthly)</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(stats?.monthlyRevenue || 0, 'USD')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">ARR (Annual)</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency((stats?.monthlyRevenue || 0) * 12, 'USD')}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Support Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Open Tickets</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats?.openTickets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Avg Response Time</span>
                <span className="font-medium text-slate-900 dark:text-white">Coming Soon</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Subscription Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Free Tier</span>
                <span className="font-medium text-slate-900 dark:text-white">Coming Soon</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Paid Plans</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats?.activeSubscriptions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Advanced Analytics</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              <p>
                More detailed analytics including user cohorts, retention analysis, and custom
                reports will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
