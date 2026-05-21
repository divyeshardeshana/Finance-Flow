import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Undo2,
  TrendingUp,
  Banknote,
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';
import type { DashboardAnalytics } from '../../lib/adminHelpers';

interface Props {
  data: DashboardAnalytics['payments'];
}

export default function DashboardPaymentSection({ data }: Props) {
  const totalTransactions = data.successfulCount + data.failedCount + data.refundedCount + data.pendingCount;

  const successPercent = totalTransactions > 0 ? Math.round((data.successfulCount / totalTransactions) * 100) : 0;
  const failedPercent = totalTransactions > 0 ? Math.round((data.failedCount / totalTransactions) * 100) : 0;
  const pendingPercent = totalTransactions > 0 ? Math.round((data.pendingCount / totalTransactions) * 100) : 0;
  const refundedPercent = totalTransactions > 0 ? Math.round((data.refundedCount / totalTransactions) * 100) : 0;

  const statusCards = [
    { label: 'Successful', value: data.successfulCount, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-green-900/20', border: 'border-emerald-200 dark:border-gray-600', dotColor: 'bg-emerald-500' },
    { label: 'Failed', value: data.failedCount, icon: <XCircle size={18} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-gray-600', dotColor: 'bg-red-400' },
    { label: 'Pending', value: data.pendingCount, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-yellow-900/20', border: 'border-amber-200 dark:border-gray-600', dotColor: 'bg-amber-500' },
    { label: 'Refunded', value: data.refundedCount, icon: <Undo2 size={18} />, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-blue-900/30', border: 'border-sky-200 dark:border-gray-600', dotColor: 'bg-sky-500' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-teal-50 dark:bg-green-900/20">
          <CreditCard size={18} className="text-teal-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payments</h2>
        <span className="text-xs text-slate-400 dark:text-gray-400 font-medium ml-auto">{totalTransactions} transactions</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
          <div className="rounded-lg border border-teal-200 dark:border-gray-600 bg-gradient-to-br from-teal-50 to-white dark:from-green-900/20 dark:to-gray-800 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-teal-100 dark:bg-green-900/30 text-teal-600 p-1.5 rounded-md">
                <TrendingUp size={18} />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalRevenue, 'USD')}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">Total Revenue</p>
          </div>
          <div className="rounded-lg border border-emerald-200 dark:border-gray-600 bg-gradient-to-br from-emerald-50 to-white dark:from-green-900/20 dark:to-gray-800 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-emerald-100 dark:bg-green-900/30 text-emerald-600 p-1.5 rounded-md">
                <Banknote size={18} />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.monthlyRevenue, 'USD')}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">Monthly Revenue</p>
          </div>

          {statusCards.map((card, i) => (
            <div key={i} className={`rounded-lg border ${card.border} p-4 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`${card.bg} ${card.color} p-1.5 rounded-md`}>{card.icon}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</p>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${card.dotColor}`} />
                <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {totalTransactions > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-2">Transaction Distribution</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-700">
              {successPercent > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${successPercent}%` }}
                  title={`Successful: ${successPercent}%`}
                />
              )}
              {failedPercent > 0 && (
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${failedPercent}%` }}
                  title={`Failed: ${failedPercent}%`}
                />
              )}
              {pendingPercent > 0 && (
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${pendingPercent}%` }}
                  title={`Pending: ${pendingPercent}%`}
                />
              )}
              {refundedPercent > 0 && (
                <div
                  className="bg-sky-400 transition-all duration-500"
                  style={{ width: `${refundedPercent}%` }}
                  title={`Refunded: ${refundedPercent}%`}
                />
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Successful {successPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Failed {failedPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Pending {pendingPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Refunded {refundedPercent}%</span>
              </span>
            </div>
          </div>
        )}

        {data.totalRefundAmount > 0 && (
          <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 px-4 py-3 flex items-center space-x-3">
            <span className="bg-white dark:bg-gray-700 text-slate-500 dark:text-gray-400 p-1.5 rounded-md border border-slate-200 dark:border-gray-600">
              <DollarSign size={16} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Total Refunds: {formatCurrency(data.totalRefundAmount, 'USD')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
