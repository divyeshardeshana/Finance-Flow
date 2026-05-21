// Public storefront page listing all active purchasable products

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { getProducts } from '../api/payments';
import type { Product } from '../types/payment';
import { ProductCard } from '../components/payment/ProductCard';
import { useAuth } from '../contexts/AuthContext';

function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100 dark:bg-white/[0.05]" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-100 dark:bg-white/[0.05] rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded w-5/6" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-6 bg-gray-100 dark:bg-white/[0.05] rounded w-16" />
          <div className="h-9 bg-gray-100 dark:bg-white/[0.05] rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080C14]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-md border-b border-gray-200/80 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.1]" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Flow</span>
              </span>
            </div>
          </div>

          {user && (
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/[0.12] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-200"
            >
              <ShoppingBag className="w-4 h-4" />
              My Orders
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
          >
            <ShoppingBag className="w-4 h-4" />
            One-time purchases
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4"
          >
            Supercharge your finances
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto"
          >
            Unlock powerful add-ons and expert services with a single secure payment.
          </motion.p>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{error}</p>
            <button
              onClick={loadProducts}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No products available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Check back soon for new add-ons and services.</p>
          </div>
        )}

        {/* Auth nudge for guests */}
        {!user && !loading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-10 p-6 bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-100 dark:border-blue-500/20 rounded-2xl text-center"
          >
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Sign in to purchase
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
              You need a FinanceFlow account to complete a purchase.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Sign In or Create Account
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
