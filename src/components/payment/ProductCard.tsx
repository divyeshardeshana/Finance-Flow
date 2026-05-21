// Card component displaying a single product with price and checkout action

import { motion } from 'framer-motion';
import { Tag, ImageOff } from 'lucide-react';
import type { Product } from '../../types/payment';
import { CheckoutButton } from './CheckoutButton';

interface ProductCardProps {
  product: Product;
  index?: number;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const checkoutItems = product.stripe_price_id
    ? [
        {
          price_id: product.stripe_price_id,
          quantity: 1,
          product_id: product.id,
          unit_price_in_cents: product.price_in_cents,
        },
      ]
    : [];

  const isAvailable = Boolean(product.stripe_price_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group flex flex-col bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
    >
      {/* Product image */}
      <div className="relative h-44 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-blue-300 dark:text-blue-700">
            <ImageOff className="w-10 h-10" />
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#0B0F1A] border border-gray-200/80 dark:border-white/[0.12] text-sm font-bold text-gray-900 dark:text-white shadow-sm">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            {formatPrice(product.price_in_cents, product.currency)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 mb-5">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPrice(product.price_in_cents, product.currency)}
          </span>
          <CheckoutButton
            items={checkoutItems}
            label={isAvailable ? 'Buy Now' : 'Coming Soon'}
            disabled={!isAvailable}
          />
        </div>

        {!isAvailable && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            Purchasing will be available soon.
          </p>
        )}
      </div>
    </motion.div>
  );
}
