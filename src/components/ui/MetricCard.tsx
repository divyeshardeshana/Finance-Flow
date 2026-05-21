import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
  valueColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  iconBg,
  sub,
  valueColor,
  trend,
  trendLabel,
  onClick,
  className = '',
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                trend === 'up'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : trend === 'down'
                    ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              <span>{trendLabel || 'This month'}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
          {label}
        </p>
        <p className={`text-[22px] font-bold tracking-tight ${valueColor || 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
        {sub && <p className="text-[12px] text-gray-400 dark:text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
