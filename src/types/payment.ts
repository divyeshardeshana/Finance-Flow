// All TypeScript types for the one-time payment / products & orders flow

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Product {
  id: string;
  name: string;
  description: string;
  price_in_cents: number;
  currency: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  active: boolean;
  image_url: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price_in_cents: number;
  product?: Pick<Product, 'id' | 'name' | 'description' | 'image_url'>;
}

export interface Order {
  id: string;
  user_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_total: number;
  currency: string;
  status: OrderStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface CheckoutItem {
  price_id: string;
  quantity: number;
  /** Used to create the pending order_items record before redirecting */
  product_id?: string;
  unit_price_in_cents?: number;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface GetOrdersResponse {
  orders: Order[];
  total: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
}
