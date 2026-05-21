// Reusable button component that initiates a Stripe Checkout Session

import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import type { CheckoutItem } from '../../types/payment';
import { useCheckout } from '../../hooks/useCheckout';

interface CheckoutButtonProps {
  items: CheckoutItem[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CheckoutButton({
  items,
  label = 'Buy Now',
  className = '',
  disabled = false,
}: CheckoutButtonProps) {
  const { loading, error, initiateCheckout, clearError } = useCheckout();

  const handleClick = () => {
    clearError();
    initiateCheckout(items);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
          disabled || loading
            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5'
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to checkout...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            {label}
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
