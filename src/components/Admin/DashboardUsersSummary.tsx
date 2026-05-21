import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  UserPlus,
  LogIn,
  ClipboardCheck,
  Clock,
  Crown,
  Star,
  Gem,
} from 'lucide-react';
import type { DashboardAnalytics } from '../../lib/adminHelpers';

interface Props {
  data: DashboardAnalytics['users'];
}

const tierConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  free: {
    icon: <Star size={16} />,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  paid: {
    icon: <Crown size={16} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  premium: {
    icon: <Gem size={16} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

export default function DashboardUsersSummary({ data }: Props) {
  const cards = [
    { label: 'Total Users', value: data.total, icon: <Users size={18} />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Active', value: data.active, icon: <UserCheck size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-green-900/20' },
    { label: 'Inactive', value: data.inactive, icon: <UserX size={18} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Onboarded', value: data.onboarded, icon: <ClipboardCheck size={18} />, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-green-900/20' },
    { label: 'Pending Onboarding', value: data.pendingOnboarding, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-yellow-900/20' },
    { label: 'Admins', value: data.admins, icon: <ShieldCheck size={18} />, color: 'text-slate-700 dark:text-gray-300', bg: 'bg-slate-100 dark:bg-gray-700' },
    { label: 'New (30 Days)', value: data.newLast30Days, icon: <UserPlus size={18} />, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-blue-900/30' },
    { label: 'Logins (7 Days)', value: data.recentLogins7Days, icon: <LogIn size={18} />, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-blue-900/30' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
          <Users size={18} className="text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Users Summary</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="group relative rounded-lg border border-slate-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`${card.bg} ${card.color} p-1.5 rounded-md`}>{card.icon}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-3">By Subscription Tier</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.byTier.map((tier) => {
              const config = tierConfig[tier.tier] || tierConfig.free;
              const percentage = data.total > 0 ? Math.round((tier.count / data.total) * 100) : 0;
              return (
                <div
                  key={tier.tier}
                  className={`flex items-center justify-between rounded-lg border ${config.border} dark:border-gray-600 ${config.bg} px-4 py-3`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={config.color}>{config.icon}</span>
                    <span className={`text-sm font-semibold ${config.color}`}>{tier.displayName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{tier.count}</span>
                    <span className="text-xs text-slate-400 dark:text-gray-400">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
