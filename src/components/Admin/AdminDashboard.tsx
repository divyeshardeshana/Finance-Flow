import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  Ticket,
} from 'lucide-react';
import { getDashboardAnalytics } from '../../lib/adminHelpers';
import type { DashboardAnalytics } from '../../lib/adminHelpers';
import DashboardUsersSummary from './DashboardUsersSummary';
import DashboardSubscriptionSection from './DashboardSubscriptionSection';
import DashboardPaymentSection from './DashboardPaymentSection';
import DashboardTicketSection from './DashboardTicketSection';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading dashboard analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardUsersSummary data={analytics.users} />
      <DashboardSubscriptionSection data={analytics.subscriptions} />

      <DashboardPaymentSection data={analytics.payments} />
      <DashboardTicketSection data={analytics.tickets} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border-2 border-slate-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-left"
            >
              <Users className="text-blue-500 mb-2" size={24} />
              <h3 className="font-medium text-slate-900 dark:text-white">Manage Users</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">View and edit user accounts</p>
            </button>
            <button
              onClick={() => navigate('/admin/tickets')}
              className="p-4 border-2 border-slate-200 dark:border-gray-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-yellow-900/20 transition-all text-left"
            >
              <Ticket className="text-orange-500 mb-2" size={24} />
              <h3 className="font-medium text-slate-900 dark:text-white">Support Tickets</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                {analytics.tickets.open + analytics.tickets.inProgress} open tickets need attention
              </p>
            </button>
            <button
              onClick={() => navigate('/admin/payments')}
              className="p-4 border-2 border-slate-200 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
            >
              <DollarSign className="text-green-500 mb-2" size={24} />
              <h3 className="font-medium text-slate-900 dark:text-white">View Payments</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Monitor payment transactions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
