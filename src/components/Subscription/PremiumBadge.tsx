import { Crown, Lock } from 'lucide-react';
import { SubscriptionTier, getTierBadgeColor } from '../../lib/subscriptionHelpers';

interface PremiumBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumBadge({ tier, size = 'sm' }: PremiumBadgeProps) {
  if (tier === 'free') return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${getTierBadgeColor(
        tier
      )} ${sizeClasses[size]}`}
    >
      <Crown className={iconSizes[size]} />
      {tier === 'paid' ? 'PAID' : 'PREMIUM'}
    </span>
  );
}

interface LockedFeatureIndicatorProps {
  requiredTier: SubscriptionTier;
  size?: 'sm' | 'md';
}

export function LockedFeatureIndicator({
  requiredTier,
  size = 'sm',
}: LockedFeatureIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <div className="inline-flex items-center gap-1 text-gray-400">
      <Lock className={sizeClasses[size]} />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {requiredTier === 'paid' ? 'Paid' : 'Premium'}
      </span>
    </div>
  );
}
