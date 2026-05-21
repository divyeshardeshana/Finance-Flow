// Hook for fetching and paginating the authenticated user's order history

import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '../api/payments';
import type { Order } from '../types/payment';

interface UseOrdersState {
  orders: Order[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

interface UseOrdersReturn extends UseOrdersState {
  goToPage: (page: number) => void;
  refresh: () => void;
}

const LIMIT = 10;

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchOrders = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrders({ page: currentPage, limit: LIMIT });
      setOrders(result.orders);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders.';
      setError(message);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, refreshKey, fetchOrders]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return { orders, total, loading, error, page, totalPages, goToPage, refresh };
}
