// Frontend API layer for one-time payment checkout sessions and order history

import { supabase } from '../lib/supabase';
import type {
  CheckoutItem,
  CheckoutSessionResponse,
  GetOrdersParams,
  GetOrdersResponse,
  Product,
} from '../types/payment';

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** Returns the current session's access token or throws if not authenticated. */
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be signed in to complete this action.');
  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * Creates a Stripe Checkout Session for one-time payment.
 * Redirects the browser to Stripe Checkout on success.
 */
export async function createCheckoutSession(
  items: CheckoutItem[],
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResponse> {
  const headers = await getAuthHeader();

  const response = await fetch(`${FUNCTIONS_BASE}/create-payment-checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ items, success_url: successUrl, cancel_url: cancelUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<CheckoutSessionResponse>;
}

/**
 * Fetches the authenticated user's paginated order history from the edge function.
 */
export async function getOrders({
  page = 1,
  limit = 10,
}: GetOrdersParams = {}): Promise<GetOrdersResponse> {
  const headers = await getAuthHeader();

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(`${FUNCTIONS_BASE}/get-orders?${params}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<GetOrdersResponse>;
}

/**
 * Fetches all active products directly from Supabase (products are publicly readable).
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('price_in_cents', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}
