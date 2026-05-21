import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface EnabledFeature {
  feature_name: string;
  display_name: string;
  description: string;
  category: string;
  sort_order: number;
}

// All components exported as a single namespace object to avoid Fast Refresh
// injecting duplicate named exports for PascalCase identifiers.
export const ui = {
  skeleton: ({ className }: { className?: string }) =>
    <div className={clsx('animate-pulse rounded-lg bg-gray-200/70 dark:bg-white/[0.06]', className)} />,

  loadingSkeleton: ({ cardClass }: { cardClass: string }) => (
    <div className="space-y-5">
      <div className={clsx(cardClass, 'p-6 space-y-4')}>
        <ui.skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <ui.skeleton key={i} className="h-20" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={clsx(cardClass, 'p-6 space-y-3')}>
          <ui.skeleton className="h-5 w-32" />
          {[...Array(5)].map((_, i) => <ui.skeleton key={i} className="h-8" />)}
        </div>
        <div className={clsx(cardClass, 'p-6 space-y-3')}>
          <ui.skeleton className="h-5 w-32" />
          {[...Array(3)].map((_, i) => <ui.skeleton key={i} className="h-12" />)}
        </div>
      </div>
    </div>
  ),

  usageBar: ({ used, limit, label, unlimited = false }: {
    used: number; limit: number; label: string; unlimited?: boolean;
  }) => {
    const pct = unlimited ? 0 : Math.min(100, limit > 0 ? Math.round((used / limit) * 100) : 0);
    const color = unlimited ? 'bg-emerald-400' : pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-blue-500';
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600 dark:text-gray-400 font-medium">{label}</span>
          <span className="text-[12px] text-gray-500 dark:text-gray-500 font-mono">
            {unlimited ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Unlimited</span> : `${used} / ${limit}`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: unlimited ? '100%' : `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={clsx('h-full rounded-full', unlimited ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : color)}
          />
        </div>
      </div>
    );
  },

  featureGroup: ({ category, features }: { category: string; features: EnabledFeature[] }) => (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">{category}</p>
      <div className="space-y-1.5">
        {features.map(f => (
          <div key={f.feature_name} className="flex items-start gap-2.5">
            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">{f.display_name}</span>
              {f.description && (
                <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-snug mt-0.5">{f.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  metricTile: ({
    icon: Icon, label, value, highlight = false, valueColor,
  }: {
    icon: React.ElementType; label: string; value: string; highlight?: boolean; valueColor?: string;
  }) => (
    <div className="flex flex-col gap-1.5 bg-gray-50 dark:bg-white/[0.025] rounded-xl p-3.5 border border-gray-100 dark:border-white/[0.05]">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
        <Icon size={11} />
        {label}
      </div>
      <span className={clsx('text-[14px] font-bold leading-tight', valueColor || (highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'))}>
        {value}
      </span>
    </div>
  ),

  paymentTile: ({
    icon: Icon, label, value, mono = false,
  }: {
    icon: React.ElementType; label: string; value: string; mono?: boolean;
  }) => (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.025] rounded-xl p-4 border border-gray-100 dark:border-white/[0.05]">
      <div className="w-9 h-9 rounded-lg bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-gray-500 dark:text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{label}</p>
        <p className={clsx('text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate', mono && 'font-mono')}>{value}</p>
      </div>
    </div>
  ),

  idField: ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[11px] text-gray-400 dark:text-gray-600 font-medium whitespace-nowrap">{label}:</span>
      <span className="text-[11px] font-mono text-gray-500 dark:text-gray-500 truncate">{value}</span>
    </div>
  ),
};
