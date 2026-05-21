/*
  # Products, Orders, and Order Items Schema

  ## New Tables
  - `products` — Purchasable items with Stripe price/product IDs
  - `orders` — One-time payment orders linked to a Stripe Checkout Session
  - `order_items` — Individual line items within an order

  ## Security
  - RLS enabled on all three tables
  - Active products are publicly readable
  - Users can only read/insert their own orders and order_items
  - Service role manages everything via Edge Functions

  ## Indexes
  - orders: user_id, stripe_session_id, stripe_payment_intent_id, status
  - order_items: order_id, product_id
*/

-- ─── order_status enum ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── products ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  description       text        NOT NULL DEFAULT '',
  price_in_cents    integer     NOT NULL CHECK (price_in_cents >= 0),
  currency          text        NOT NULL DEFAULT 'usd',
  stripe_price_id   text        UNIQUE,
  stripe_product_id text        UNIQUE,
  active            boolean     NOT NULL DEFAULT true,
  image_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are publicly readable"
  ON products FOR SELECT
  USING (active = true);

CREATE POLICY "Service role can insert products"
  ON products FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update products"
  ON products FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete products"
  ON products FOR DELETE
  TO service_role
  USING (true);

-- ─── orders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                        uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id         text         UNIQUE,
  stripe_payment_intent_id  text         UNIQUE,
  amount_total              integer      NOT NULL CHECK (amount_total >= 0),
  currency                  text         NOT NULL DEFAULT 'usd',
  status                    order_status NOT NULL DEFAULT 'pending',
  metadata                  jsonb        NOT NULL DEFAULT '{}',
  created_at                timestamptz  NOT NULL DEFAULT now(),
  updated_at                timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert orders"
  ON orders FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update orders"
  ON orders FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── order_items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id          uuid    REFERENCES products(id) ON DELETE SET NULL,
  quantity            integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_in_cents integer NOT NULL CHECK (unit_price_in_cents >= 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert order items"
  ON order_items FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update order items"
  ON order_items FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id               ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id     ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at            ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id         ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id       ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_active              ON products(active);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- ─── seed sample products ────────────────────────────────────────────────────
INSERT INTO products (name, description, price_in_cents, currency, active) VALUES
  (
    'Finance Report Export',
    'Export your complete financial history as a beautifully formatted PDF report — 12 months of transactions, charts, and insights.',
    499,
    'usd',
    true
  ),
  (
    'Budget Template Pack',
    'A collection of 10 professionally designed budget templates tailored for freelancers, families, and small businesses.',
    999,
    'usd',
    true
  ),
  (
    'One-on-One Financial Review',
    'A 30-minute personalised session with a certified financial coach to review your FinanceFlow data and provide tailored advice.',
    4999,
    'usd',
    true
  )
ON CONFLICT DO NOTHING;
