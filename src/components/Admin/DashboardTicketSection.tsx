import {
  Ticket,
  CircleDot,
  Loader2,
  CheckCircle2,
  Archive,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  UserX,
  ShieldAlert,
} from 'lucide-react';
import type { DashboardAnalytics } from '../../lib/adminHelpers';

interface Props {
  data: DashboardAnalytics['tickets'];
}

export default function DashboardTicketSection({ data }: Props) {
  const total = data.open + data.inProgress + data.resolved + data.closed;

  const openPercent = total > 0 ? Math.round((data.open / total) * 100) : 0;
  const inProgressPercent = total > 0 ? Math.round((data.inProgress / total) * 100) : 0;
  const resolvedPercent = total > 0 ? Math.round((data.resolved / total) * 100) : 0;
  const closedPercent = total > 0 ? Math.round((data.closed / total) * 100) : 0;

  const statusCards = [
    { label: 'Total', value: data.total, icon: <Ticket size={18} />, color: 'text-slate-700 dark:text-gray-300', bg: 'bg-slate-100 dark:bg-gray-700', border: 'border-slate-200 dark:border-gray-600', dotColor: 'bg-slate-400' },
    { label: 'Open', value: data.open, icon: <CircleDot size={18} />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-gray-600', dotColor: 'bg-blue-500' },
    { label: 'In Progress', value: data.inProgress, icon: <Loader2 size={18} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-yellow-900/20', border: 'border-amber-200 dark:border-gray-600', dotColor: 'bg-amber-500' },
    { label: 'Resolved', value: data.resolved, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-green-900/20', border: 'border-emerald-200 dark:border-gray-600', dotColor: 'bg-emerald-500' },
    { label: 'Closed', value: data.closed, icon: <Archive size={18} />, color: 'text-slate-500 dark:text-gray-400', bg: 'bg-slate-50 dark:bg-gray-900', border: 'border-slate-200 dark:border-gray-600', dotColor: 'bg-slate-400' },
  ];

  const priorityCards = [
    { label: 'High', value: data.highPriority, icon: <ArrowUp size={16} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-gray-600' },
    { label: 'Medium', value: data.mediumPriority, icon: <ArrowRight size={16} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-yellow-900/20', border: 'border-amber-200 dark:border-gray-600' },
    { label: 'Low', value: data.lowPriority, icon: <ArrowDown size={16} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-gray-600' },
  ];

  const alertCards = [
    { label: 'Unassigned', value: data.unassigned, icon: <UserX size={16} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-yellow-900/20' },
    { label: 'SLA Breached', value: data.slaBreached, icon: <ShieldAlert size={16} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-yellow-900/20">
          <Ticket size={18} className="text-orange-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Support Tickets</h2>
        <span className="text-xs text-slate-400 dark:text-gray-400 font-medium ml-auto">{data.total} total</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
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

        {total > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-2">Status Distribution</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-700">
              {openPercent > 0 && (
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${openPercent}%` }}
                  title={`Open: ${openPercent}%`}
                />
              )}
              {inProgressPercent > 0 && (
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${inProgressPercent}%` }}
                  title={`In Progress: ${inProgressPercent}%`}
                />
              )}
              {resolvedPercent > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${resolvedPercent}%` }}
                  title={`Resolved: ${resolvedPercent}%`}
                />
              )}
              {closedPercent > 0 && (
                <div
                  className="bg-slate-400 transition-all duration-500"
                  style={{ width: `${closedPercent}%` }}
                  title={`Closed: ${closedPercent}%`}
                />
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Open {openPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>In Progress {inProgressPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Resolved {resolvedPercent}%</span>
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Closed {closedPercent}%</span>
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {priorityCards.map((card, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg border ${card.border} ${card.bg} px-4 py-3`}>
              <div className="flex items-center space-x-2.5">
                <span className={card.color}>{card.icon}</span>
                <span className={`text-sm font-semibold ${card.color}`}>{card.label}</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</span>
            </div>
          ))}
          {alertCards.map((card, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center space-x-2.5">
                <span className={`${card.bg} ${card.color} p-1.5 rounded-md`}>{card.icon}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{card.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold ${card.value > 0 ? card.color : 'text-slate-900 dark:text-white'}`}>
                  {card.value.toLocaleString()}
                </span>
                {card.value > 0 && (
                  <AlertTriangle size={14} className={card.color} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
