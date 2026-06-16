import { useState, useEffect } from 'react';
import { X, Repeat, Plus, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

interface TransactionFormProps {
  transaction?: any;
  categories: any[];
  onSave: () => void;
  onCancel: () => void;
}

const fieldClass = "w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white rounded-xl text-[13px] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all";
const labelClass = "block text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

export function TransactionForm({ transaction, categories, onSave, onCancel }: TransactionFormProps) {
  const { user } = useAuth();
  const { preferences } = useAppPreferences();
  const [formData, setFormData] = useState({
    amount: transaction?.amount || '',
    type: transaction?.type || 'expense',
    category: transaction?.category || '',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
    payment_method: transaction?.payment_method || '',
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringData, setRecurringData] = useState({
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    loadCustomTypes();
    loadCustomPaymentMethods();
  }, []);

  const loadCustomTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_transaction_types')
        .select('type_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setCustomTypes(data?.map(t => t.type_name) || []);
    } catch (error) {
      console.error('Error loading custom types:', error);
    }
  };

  const loadCustomPaymentMethods = async () => {
    try {
      const { data } = await supabase
        .from('custom_payment_methods')
        .select('method_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);
      setCustomPaymentMethods(data?.map(m => m.method_name) || []);
    } catch {
      // silently skip
    }
  };

  const expenseCategories = categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => a.name.localeCompare(b.name));
  const incomeCategories = categories
    .filter((c) => c.type === 'income')
    .sort((a, b) => a.name.localeCompare(b.name));
  const currentCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  const calculateNextOccurrence = (startDate: string, frequency: string): string => {
    const date = new Date(startDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Amount must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      if (isRecurring && !transaction) {
        const recurringTemplate = {
          user_id: user.id,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          payment_method: formData.payment_method,
          frequency: recurringData.frequency,
          start_date: recurringData.start_date,
          end_date: recurringData.end_date || null,
          next_occurrence: calculateNextOccurrence(recurringData.start_date, recurringData.frequency),
          is_active: true,
        };

        const { data: recurringResult, error: recurringError } = await supabase
          .from('recurring_transactions')
          .insert(recurringTemplate)
          .select()
          .single();

        if (recurringError) throw recurringError;

        const initialTransaction = {
          user_id: user.id,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
          transaction_date: recurringData.start_date,
          payment_method: formData.payment_method,
          is_recurring: true,
          recurring_transaction_id: recurringResult.id,
          currency: preferences.currency,
        };

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(initialTransaction);

        if (transactionError) throw transactionError;
      } else {
        const data = {
          ...formData,
          amount: parseFloat(formData.amount),
          user_id: user.id,
          is_recurring: false,
          currency: transaction?.currency || preferences.currency,
        };

        if (transaction) {
          const { error } = await supabase.from('transactions').update(data).eq('id', transaction.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('transactions').insert(data);
          if (error) throw error;
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Form Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/[0.15] flex items-center justify-center">
            <Plus className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h4>
        </div>
        <button
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className={labelClass}>
              Type <span className="text-red-500 normal-case tracking-normal font-normal">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
              className={fieldClass}
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              {customTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className={labelClass}>
              Amount <span className="text-red-500 normal-case tracking-normal font-normal">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={fieldClass}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>
              Category <span className="text-red-500 normal-case tracking-normal font-normal">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={fieldClass}
              required
            >
              <option value="">Select a category</option>
              {currentCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={fieldClass}
              placeholder="Enter description"
            />
          </div>
        </div>

        {/* Recurring toggle */}
        {!transaction && (
          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.07] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-9 h-5 rounded-full transition-colors ${isRecurring ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/[0.15]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
              <Repeat className={`w-4 h-4 flex-shrink-0 ${isRecurring ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Make this a recurring transaction
              </span>
            </label>
          </div>
        )}

        {isRecurring ? (
          <div className="mt-4 space-y-4 p-4 bg-blue-500/[0.04] border border-blue-500/[0.12] rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Repeat className="w-4 h-4" />
              <span className="text-[13px] font-semibold">Recurring Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Frequency</label>
                <select
                  value={recurringData.frequency}
                  onChange={(e) => setRecurringData({ ...recurringData, frequency: e.target.value })}
                  className={fieldClass}
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  value={recurringData.start_date}
                  onChange={(e) => setRecurringData({ ...recurringData, start_date: e.target.value })}
                  className={fieldClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>End Date <span className="normal-case tracking-normal font-normal text-gray-400">(Optional)</span></label>
                <input
                  type="date"
                  value={recurringData.end_date}
                  onChange={(e) => setRecurringData({ ...recurringData, end_date: e.target.value })}
                  min={recurringData.start_date}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className={fieldClass}
              >
                <option value="">Select method</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Digital Wallet">Digital Wallet</option>
                <option value="Check">Check</option>
                <option value="Mobile Payment">Mobile Payment</option>
                <option value="Other">Other</option>
                {customPaymentMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-blue-500/[0.06] border border-blue-500/[0.12] rounded-xl text-[12px] text-blue-700 dark:text-blue-300">
              <Repeat className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>The first transaction is created on the start date. Future transactions will auto-generate based on frequency.</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Date <span className="text-red-500 normal-case tracking-normal font-normal">*</span>
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  Payment Method
                </div>
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className={fieldClass}
              >
                <option value="">Select method</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Digital Wallet">Digital Wallet</option>
                <option value="Check">Check</option>
                <option value="Mobile Payment">Mobile Payment</option>
                <option value="Other">Other</option>
                {customPaymentMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 rounded-xl text-[13px] font-medium hover:bg-gray-200 dark:hover:bg-white/[0.09] transition-colors border border-gray-200 dark:border-white/[0.07]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
          >
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
