type BadgeVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'premium'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  neutral: 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]',
  premium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  inactive: 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-white/[0.06]',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
  premium: 'bg-amber-500',
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
};

export function StatusBadge({
  variant = 'neutral',
  children,
  size = 'sm',
  dot = false,
}: StatusBadgeProps) {
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${VARIANT_STYLES[variant]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[variant]}`} />}
      {children}
    </span>
  );
}
