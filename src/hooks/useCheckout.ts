// Hook for initiating a Stripe Checkout Session and redirecting the browser

import { useState, useCallback } from 'react';
import { createCheckoutSession } from '../api/payments';
import type { CheckoutItem } from '../types/payment';

interface UseCheckoutState {
  loading: boolean;
  error: string | null;
}

interface UseCheckoutReturn extends UseCheckoutState {
  initiateCheckout: (items: CheckoutItem[]) => Promise<void>;
  clearError: () => void;
}

export function useCheckout(): UseCheckoutReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(async (items: CheckoutItem[]) => {
    if (items.length === 0) {
      setError('No items selected for checkout.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/checkout/cancel`;

      const { url } = await createCheckoutSession(items, successUrl, cancelUrl);

      // Hard redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout. Please try again.';
      setError(message);
      setLoading(false);
    }
    // Note: we intentionally do NOT setLoading(false) on success because
    // the page is being redirected away — resetting the state would cause a flash.
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, initiateCheckout, clearError };
}
