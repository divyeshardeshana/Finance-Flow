// Protected page showing the authenticated user's full order history

import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Zap } from 'lucide-react';
import { OrderHistory } from '../components/payment/OrderHistory';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function OrdersPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#080C14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080C14]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0B0F1A]/80 backdrop-blur-md border-b border-gray-200/80 dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Products
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

          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/[0.12] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-200"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All your one-time purchases and their current status.
          </p>
        </div>
        <OrderHistory />
      </main>
    </div>
  );
}
