import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

interface TransactionListProps {
  transactions: any[];
  loading: boolean;
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/[0.04]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="animate-pulse bg-gray-100 dark:bg-white/[0.05] rounded-lg h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TransactionList({ transactions, loading, onEdit, onDelete, onAdd }: TransactionListProps) {
  const { formatAmount, t } = useAppPreferences();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
              <tr>
                {['Date', 'Description', 'Category', 'Type', 'Amount', 'Actions'].map((col, i) => (
                  <th
                    key={col}
                    className={`px-6 py-3.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest ${i === 4 || i === 5 ? 'text-right' : 'text-left'}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-16 text-center">
        <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-200 dark:border-white/[0.07]">
          <Receipt className="w-7 h-7 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">
          {t('noTransactionsYet') || 'No transactions yet'}
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
          Add your first transaction to start tracking your income and expenses.
        </p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm shadow-blue-500/20"
          >
            Add Transaction
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
            <tr>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {t('date') || 'Date'}
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {t('description') || 'Description'}
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {t('category') || 'Category'}
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {t('type') || 'Type'}
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {t('amount') || 'Amount'}
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {t('actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors last:border-0 group"
              >
                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">
                  {formatDate(transaction.transaction_date)}
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-gray-900 dark:text-white max-w-[220px] truncate">
                  {transaction.description || (
                    <span className="text-gray-400 dark:text-gray-600 italic font-normal">No description</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.category ? (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-gray-200/60 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 text-[11px] font-medium">
                      {transaction.category}
                    </span>
                  ) : (
                    <span className="text-[13px] text-gray-400 dark:text-gray-600">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.type === 'income' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/[0.15] text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                      <ArrowUpCircle className="w-3 h-3" />
                      {t('income') || 'Income'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/[0.08] border border-red-500/[0.15] text-red-600 dark:text-red-400 text-[11px] font-semibold">
                      <ArrowDownCircle className="w-3 h-3" />
                      {t('expense') || 'Expense'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`text-[14px] font-bold tabular-nums ${
                    transaction.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatAmount(Number(transaction.amount), transaction.currency || 'USD')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/[0.08] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
