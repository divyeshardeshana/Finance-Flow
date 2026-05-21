// Component displaying the authenticated user's paginated order history

import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ChevronLeft, ChevronRight, RefreshCw,
  Clock, CheckCircle2, XCircle, RotateCcw, Package,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types/payment';
import { useOrders } from '../../hooks/useOrders';

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; Icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
    Icon: Clock,
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
    Icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
    Icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]',
    Icon: RotateCcw,
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-white/[0.05] animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 dark:bg-white/[0.05] rounded w-2/3" />
        <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded w-1/3" />
      </div>
      <div className="h-6 w-16 bg-gray-100 dark:bg-white/[0.05] rounded-full" />
      <div className="h-4 w-16 bg-gray-100 dark:bg-white/[0.05] rounded" />
    </div>
  );
}

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const itemCount = order.order_items?.length ?? 0;
  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-white/[0.05] last:border-0"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatDate(order.created_at)}
          {itemCount > 0 && <span className="ml-1.5">· {itemLabel}</span>}
        </p>
      </div>

      <StatusBadge status={order.status} />

      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums flex-shrink-0">
        {formatPrice(order.amount_total, order.currency)}
      </span>
    </motion.div>
  );
}

export function OrderHistory() {
  const { orders, total, loading, error, page, totalPages, goToPage, refresh } = useOrders();

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Order History</h2>
            {!loading && !error && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {total} {total === 1 ? 'order' : 'orders'} total
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6">
        {error && (
          <div className="py-8 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Failed to load orders</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !error && (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No orders yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your completed purchases will appear here.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!loading && !error && orders.length > 0 && (
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {orders.map(order => (
                <OrderRow key={order.id} order={order} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
