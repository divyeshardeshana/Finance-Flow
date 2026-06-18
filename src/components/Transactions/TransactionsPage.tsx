import { useState, useEffect, useRef } from 'react';
import {
  Plus, Receipt, Repeat, Download, Upload, FileDown,
  ArrowUp, ArrowDown, TrendingUp, TrendingDown, Activity,
  ChevronLeft, ChevronRight, ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency } from '../../lib/currency';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { RecurringTransactionsList } from './RecurringTransactionsList';

const CSV_HEADERS = ['date', 'type', 'category', 'description', 'amount', 'currency', 'payment_method', 'notes', 'tags', 'is_recurring', 'frequency', 'recurring_start_date', 'recurring_end_date', 'is_split', 'split_count'];

const SAMPLE_ROWS = [
  ['2026-01-15', 'expense', 'Food & Dining', 'Lunch at restaurant', '25.50', 'USD', 'Credit Card', 'Team lunch', 'food;work', 'false', '', '', '', 'false', ''],
  ['2026-01-20', 'income', 'Salary', 'Monthly salary', '5000.00', 'USD', 'Bank Transfer', '', '', 'true', 'monthly', '2026-01-20', '', 'false', ''],
  ['2026-01-22', 'expense', 'Transportation', 'Uber ride', '12.00', 'USD', 'Cash', 'To airport', 'travel', 'false', '', '', '', 'false', ''],
  ['2026-01-25', 'expense', 'Dining', 'Dinner with friends', '90.00', 'USD', 'Credit Card', 'Split among 3', 'social', 'false', '', '', '', 'true', '3'],
  ['2026-01-28', 'expense', 'Utilities', 'Electricity bill', '85.00', 'USD', 'Bank Transfer', '', 'bills', 'true', 'monthly', '2026-01-28', '2026-12-28', 'false', ''],
];

function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  for (const line of lines) {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const SORT_OPTIONS = [
  { value: 'transaction_date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'category', label: 'Category' },
  { value: 'type', label: 'Type' },
];

export function TransactionsPage() {
  const { user } = useAuth();
  const { convertAmount, preferences } = useAppPreferences();
  const [activeTab, setActiveTab] = useState<'all' | 'recurring'>('all');
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const fetchTransactions = async () => {
    if (!user) return;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    if (selectedYear !== 'all') {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('transaction_date', yearStart).lte('transaction_date', yearEnd);

      if (selectedMonth !== 'all') {
        const monthStart = `${selectedYear}-${selectedMonth}-01`;
        const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
        const monthEnd = `${selectedYear}-${selectedMonth}-${lastDay}`;
        query = query.gte('transaction_date', monthStart).lte('transaction_date', monthEnd);
      }
    }

    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user?.id},is_preset.eq.true`);
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, [user, selectedMonth, selectedYear, sortField, sortOrder]);

  const handleTransactionSaved = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await supabase.from('transactions').delete().eq('id', id);
      setCurrentPage(1);
      fetchTransactions();
    }
  };

  const handleDownloadSample = () => {
    downloadCSV('transactions-sample.csv', [CSV_HEADERS, ...SAMPLE_ROWS]);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const rows = transactions.map(t => [
      t.transaction_date || '',
      t.type || '',
      t.category || '',
      t.description || '',
      t.amount != null ? String(t.amount) : '',
      t.currency || '',
      t.payment_method || '',
      t.notes || '',
      Array.isArray(t.tags) ? t.tags.join(';') : (t.tags || ''),
      t.is_recurring ? 'true' : 'false',
      '', '', '',
      t.is_split ? 'true' : 'false',
      t.split_count != null ? String(t.split_count) : '',
    ]);
    const yearPart = selectedYear !== 'all' ? selectedYear : 'all';
    const monthPart = selectedMonth !== 'all' ? `-${selectedMonth}` : '';
    downloadCSV(`transactions-${yearPart}${monthPart}.csv`, [CSV_HEADERS, ...rows]);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setImportStatus('Importing...');

    try {
      const text = await file.text();
      const allRows = parseCSV(text);
      if (allRows.length < 2) {
        setImportStatus('CSV file is empty or has no data rows.');
        return;
      }

      const header = allRows[0].map(h => h.toLowerCase().trim());
      const dataRows = allRows.slice(1);

      const idx = (name: string) => header.indexOf(name);
      const dateIdx = idx('date');
      const typeIdx = idx('type');
      const amountIdx = idx('amount');

      if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1) {
        setImportStatus('CSV must have "date", "type", and "amount" columns.');
        return;
      }

      const records: any[] = [];
      const recurringRecords: any[] = [];

      for (const row of dataRows) {
        const date = row[dateIdx]?.trim();
        const type = row[typeIdx]?.trim().toLowerCase();
        const amountStr = row[amountIdx]?.trim().replace(/[^0-9.-]/g, '');
        const amount = parseFloat(amountStr);

        if (!date || !type || isNaN(amount)) continue;
        if (!['income', 'expense'].includes(type)) continue;

        const tagsRaw = idx('tags') !== -1 ? row[idx('tags')]?.trim() : '';
        const tags = tagsRaw ? tagsRaw.split(';').map((t: string) => t.trim()).filter(Boolean) : [];

        const splitCountRaw = idx('split_count') !== -1 ? row[idx('split_count')]?.trim() : '';
        const splitCount = splitCountRaw ? parseInt(splitCountRaw, 10) : null;

        const isRecurring = idx('is_recurring') !== -1 ? row[idx('is_recurring')]?.trim().toLowerCase() === 'true' : false;
        const frequency = idx('frequency') !== -1 ? row[idx('frequency')]?.trim().toLowerCase() : '';
        const recurringStartDate = idx('recurring_start_date') !== -1 ? row[idx('recurring_start_date')]?.trim() : '';
        const recurringEndDate = idx('recurring_end_date') !== -1 ? row[idx('recurring_end_date')]?.trim() : '';
        const category = idx('category') !== -1 ? row[idx('category')]?.trim() || null : null;
        const description = idx('description') !== -1 ? row[idx('description')]?.trim() || null : null;
        const currency = idx('currency') !== -1 ? row[idx('currency')]?.trim() || null : null;
        const paymentMethod = idx('payment_method') !== -1 ? row[idx('payment_method')]?.trim() || null : null;
        const notes = idx('notes') !== -1 ? row[idx('notes')]?.trim() || null : null;

        if (isRecurring && frequency && recurringStartDate) {
          const calculateNext = (start: string, freq: string) => {
            const d = new Date(start);
            if (freq === 'daily') d.setDate(d.getDate() + 1);
            else if (freq === 'weekly') d.setDate(d.getDate() + 7);
            else if (freq === 'biweekly') d.setDate(d.getDate() + 14);
            else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
            else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
            return d.toISOString().split('T')[0];
          };

          recurringRecords.push({
            user_id: user.id,
            amount, type, category, description,
            payment_method: paymentMethod,
            frequency,
            start_date: recurringStartDate,
            end_date: recurringEndDate || null,
            next_occurrence: calculateNext(recurringStartDate, frequency),
            is_active: true,
          });

          records.push({
            user_id: user.id,
            transaction_date: recurringStartDate,
            type, amount, category, description, currency,
            payment_method: paymentMethod,
            notes,
            tags: tags.length > 0 ? tags : null,
            is_recurring: true,
            is_split: false,
            split_count: null,
          });
        } else {
          records.push({
            user_id: user.id,
            transaction_date: date,
            type, amount, category, description, currency,
            payment_method: paymentMethod,
            notes,
            tags: tags.length > 0 ? tags : null,
            is_recurring: isRecurring,
            is_split: idx('is_split') !== -1 ? row[idx('is_split')]?.trim().toLowerCase() === 'true' : false,
            split_count: splitCount && !isNaN(splitCount) ? splitCount : null,
          });
        }
      }

      if (records.length === 0 && recurringRecords.length === 0) {
        setImportStatus('No valid rows found. Check that date, type, and amount are correct.');
        return;
      }

      let importedCount = 0;

      if (recurringRecords.length > 0) {
        const { data: insertedRecurring, error: recurringError } = await supabase
          .from('recurring_transactions')
          .insert(recurringRecords)
          .select('id');
        if (recurringError) {
          setImportStatus(`Import failed: ${recurringError.message}`);
          setTimeout(() => setImportStatus(null), 5000);
          return;
        }
        if (insertedRecurring) {
          const recurringTransactionRecords = records.filter(r => r.is_recurring);
          recurringTransactionRecords.forEach((r, i) => {
            r.recurring_transaction_id = insertedRecurring[i]?.id ?? null;
          });
        }
      }

      if (records.length > 0) {
        const { error } = await supabase.from('transactions').insert(records);
        if (error) {
          setImportStatus(`Import failed: ${error.message}`);
          setTimeout(() => setImportStatus(null), 5000);
          return;
        }
        importedCount = records.length;
      }

      const recurringNote = recurringRecords.length > 0
        ? ` (${recurringRecords.length} recurring template${recurringRecords.length !== 1 ? 's' : ''} created)`
        : '';
      setImportStatus(`${importedCount} transaction${importedCount !== 1 ? 's' : ''} imported successfully${recurringNote}.`);
      setCurrentPage(1);
      fetchTransactions();
    } catch {
      setImportStatus('Failed to read file. Please check the CSV format.');
    }

    setTimeout(() => setImportStatus(null), 5000);
  };

  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + convertAmount(Number(t.amount), t.currency || 'USD'), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + convertAmount(Number(t.amount), t.currency || 'USD'), 0);
  const netAmount = totalIncome - totalExpenses;

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const isImportError = importStatus && (
    importStatus.startsWith('Import failed') ||
    importStatus.startsWith('CSV') ||
    importStatus.startsWith('No valid') ||
    importStatus.startsWith('Failed')
  );
  const isImporting = importStatus === 'Importing...';

  const selectClass = "px-3 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl text-[13px] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-colors cursor-pointer appearance-none pr-8 bg-no-repeat bg-right";

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl px-6 py-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/[0.15] flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Transactions</h1>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Track your income and expenses</p>
            </div>
          </div>

          {activeTab === 'all' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 rounded-xl text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                Sample CSV
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 rounded-xl text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
              <button
                onClick={handleExportCSV}
                disabled={transactions.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 rounded-xl text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => { setShowForm(true); setEditingTransaction(null); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import status banner */}
      {importStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium ${
          isImportError
            ? 'bg-red-50 dark:bg-red-500/[0.06] border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
            : isImporting
            ? 'bg-blue-50 dark:bg-blue-500/[0.06] border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
            : 'bg-emerald-50 dark:bg-emerald-500/[0.06] border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
        }`}>
          {isImporting && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {importStatus}
        </div>
      )}

      {/* Tab bar + Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-1 inline-flex gap-0.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-white/[0.08] shadow-sm text-blue-600 dark:text-blue-400 border border-gray-200/60 dark:border-white/[0.08]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === 'recurring'
                ? 'bg-white dark:bg-white/[0.08] shadow-sm text-blue-600 dark:text-blue-400 border border-gray-200/60 dark:border-white/[0.08]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Repeat className="w-4 h-4" />
            Recurring
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                className={selectClass}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                className={selectClass}
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="relative flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortField}
                onChange={(e) => { setSortField(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-[13px] text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>Sort by {o.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-xl text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
              )}
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        )}
      </div>

      {/* Summary Metric Cards */}
      {activeTab === 'all' && !loading && transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Income */}
          <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl px-5 py-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Total Income</p>
                <p className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                  +{formatCurrency(totalIncome, preferences.currency)}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1.5">
                  {transactions.filter(t => t.type === 'income').length} transaction{transactions.filter(t => t.type === 'income').length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/[0.15] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl px-5 py-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.04] to-transparent pointer-events-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Total Expenses</p>
                <p className="text-[22px] font-bold text-red-600 dark:text-red-400 tabular-nums leading-none">
                  −{formatCurrency(totalExpenses, preferences.currency)}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1.5">
                  {transactions.filter(t => t.type === 'expense').length} transaction{transactions.filter(t => t.type === 'expense').length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/[0.15] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Net */}
          <div className={`relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl px-5 py-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${netAmount >= 0 ? 'from-blue-500/[0.04]' : 'from-red-500/[0.04]'} to-transparent pointer-events-none`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Net</p>
                <p className={`text-[22px] font-bold tabular-nums leading-none ${netAmount >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netAmount >= 0 ? '+' : '−'}{formatCurrency(Math.abs(netAmount), preferences.currency)}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1.5">
                  {transactions.length} total
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${netAmount >= 0 ? 'bg-blue-500/10 border border-blue-500/[0.15]' : 'bg-red-500/10 border border-red-500/[0.15]'}`}>
                <Activity className={`w-5 h-5 ${netAmount >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Form */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSave={handleTransactionSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {/* Main Content */}
      {activeTab === 'all' ? (
        <>
          <TransactionList
            transactions={paginatedTransactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={() => setShowForm(true)}
          />

          {/* Pagination */}
          {!loading && transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl px-5 py-4">
              <p className="text-[13px] text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                {' '}to{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {Math.min(currentPage * itemsPerPage, transactions.length)}
                </span>
                {' '}of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {transactions.length}
                </span>
                {' '}transactions
              </p>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-white/[0.1] rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-0.5">
                  {getPageNumbers().map((page, i) =>
                    page === '...' ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-gray-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-white/[0.1] rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <RecurringTransactionsList />
      )}
    </div>
  );
}
