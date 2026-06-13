import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getAllPayments } from '../../lib/adminHelpers';
import { formatCurrency } from '../../lib/currency';
import { supabase } from '../../lib/supabase';


type SortField = 'payment_date' | 'user_full_name' | 'plan_name' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES = ['paid', 'open', 'void', 'uncollectible', 'failed', 'pending', 'refunded', 'past_due'];

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={14} className="inline ml-1 text-slate-400" />;
  return sortDir === 'asc'
    ? <ChevronUp size={14} className="inline ml-1 text-blue-600" />
    : <ChevronDown size={14} className="inline ml-1 text-blue-600" />;
}

export default function PaymentManagement() {
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const [sortField, setSortField] = useState<SortField>('payment_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data } = await getAllPayments();
      setAllPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans = useMemo(() => {
    const names = new Set<string>();
    allPayments.forEach(p => {
      const name = p.plan_name || p.description;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [allPayments]);

  const syncFromStripe = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-payments-from-stripe`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSyncMessage(`Synced ${result.synced} new transactions from Stripe.`);
      loadPayments();
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    let rows = [...allPayments];

    if (filterStatus !== 'all') rows = rows.filter(r => r.status === filterStatus);
    if (filterPlan !== 'all') rows = rows.filter(r => r.plan_name === filterPlan || r.description === filterPlan);
    if (startDate) rows = rows.filter(r => new Date(r.payment_date || r.created_at) >= new Date(startDate));
    if (endDate) rows = rows.filter(r => new Date(r.payment_date || r.created_at) <= new Date(endDate + 'T23:59:59'));

    rows.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortField) {
        case 'payment_date': valA = new Date(a.payment_date || a.created_at).getTime(); valB = new Date(b.payment_date || b.created_at).getTime(); break;
        case 'user_full_name': valA = (a.user_profiles?.full_name || '').toLowerCase(); valB = (b.user_profiles?.full_name || '').toLowerCase(); break;
        case 'plan_name': valA = (a.plan_name || a.description || '').toLowerCase(); valB = (b.plan_name || b.description || '').toLowerCase(); break;
        case 'amount': valA = a.amount; valB = b.amount; break;
        case 'status': valA = a.status; valB = b.status; break;
        default: valA = 0; valB = 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [allPayments, filterStatus, filterPlan, startDate, endDate, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const thClass = "text-left py-3 px-4 font-medium text-slate-700 cursor-pointer hover:text-blue-600 select-none whitespace-nowrap";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Payment Transactions</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{filtered.length} of {allPayments.length} transactions</span>
            <button
              onClick={syncFromStripe}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Stripe'}
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${syncMessage.startsWith('Sync failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {syncMessage}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Plan</label>
            <select
              value={filterPlan}
              onChange={(e) => { setFilterPlan(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              {plans.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(filterStatus !== 'all' || filterPlan !== 'all' || startDate || endDate) && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterPlan('all'); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
              className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-600">Loading payments...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="mb-2">No transactions found.</p>
            {allPayments.length === 0 && <p className="text-sm">Click "Sync from Stripe" to import your payment history.</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={thClass} onClick={() => handleSort('payment_date')}>
                      Date <SortIcon field="payment_date" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => handleSort('user_full_name')}>
                      User <SortIcon field="user_full_name" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => handleSort('plan_name')}>
                      Plan <SortIcon field="plan_name" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => handleSort('amount')}>
                      Amount <SortIcon field="amount" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => handleSort('status')}>
                      Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-slate-900">
                          {payment.user_profiles?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500">{payment.user_profiles?.email || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {payment.plan_name || payment.description || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(payment.amount, payment.currency?.toUpperCase())}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-700'
                          : payment.status === 'failed' || payment.status === 'uncollectible' ? 'bg-red-100 text-red-700'
                          : payment.status === 'void' || payment.status === 'refunded' ? 'bg-gray-100 text-gray-700'
                          : payment.status === 'past_due' ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {payment.invoice_url && (
                          <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm">
                            View Invoice
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                  className="p-2 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
