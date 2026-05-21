import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  RotateCw,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import type { DashboardAnalytics } from '../../lib/adminHelpers';

interface Props {
  data: DashboardAnalytics['subscriptions'];
}

export default function DashboardSubscriptionSection({ data }: Props) {
  const total = data.active + data.cancelled + data.expired;

  const cards = [
    { label: 'Active', value: data.active, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-green-900/20', border: 'border-emerald-200 dark:border-gray-600' },
    { label: 'Cancelled', value: data.cancelled, icon: <XCircle size={18} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-gray-600' },
    { label: 'Expired', value: data.expired, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-yellow-900/20', border: 'border-amber-200 dark:border-gray-600' },
    { label: 'Trialing', value: data.trialing, icon: <FlaskConical size={18} />, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-blue-900/30', border: 'border-cyan-200 dark:border-gray-600' },
  ];

  const detailCards = [
    { label: 'Auto-Renew On', value: data.autoRenewEnabled, icon: <RotateCw size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-green-900/20' },
    { label: 'Auto-Renew Off', value: data.autoRenewDisabled, icon: <RotateCcw size={16} />, color: 'text-slate-500 dark:text-gray-400', bg: 'bg-slate-50 dark:bg-gray-900' },
    { label: 'Failed Payments', value: data.failedPayments, icon: <AlertTriangle size={16} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  const activePercent = total > 0 ? Math.round((data.active / total) * 100) : 0;
  const cancelledPercent = total > 0 ? Math.round((data.cancelled / total) * 100) : 0;
  const expiredPercent = total > 0 ? Math.round((data.expired / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-green-900/20">
          <TrendingUp size={18} className="text-emerald-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Subscriptions</h2>
        <span className="text-xs text-slate-400 dark:text-gray-400 font-medium ml-auto">{total} total</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {cards.map((card, i) => (
            <div key={i} className={`rounded-lg border ${card.border} p-4 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`${card.bg} ${card.color} p-1.5 rounded-md`}>{card.icon}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {total > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-2">Status Distribution</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-700">
              {activePercent > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${activePercent}%` }}
                  title={`Active: ${activePercent}%`}
                />
              )}
              {cancelledPercent > 0 && (
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${cancelledPercent}%` }}
                  title={`Cancelled: ${cancelledPercent}%`}
                />
              )}
              {expiredPercent > 0 && (
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${expiredPercent}%` }}
                  title={`Expired: ${expiredPercent}%`}
                />
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active {activePercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Cancelled {cancelledPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Expired {expiredPercent}%</span>
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {detailCards.map((card, i) => (
            <div key={i} className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-gray-700 px-4 py-3">
              <span className={`${card.bg} ${card.color} p-1.5 rounded-md`}>{card.icon}</span>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
