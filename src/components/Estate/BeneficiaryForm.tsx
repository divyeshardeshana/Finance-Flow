import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface BeneficiaryFormProps {
  beneficiary?: any;
  onSave: () => void;
  onCancel: () => void;
}

const RELATIONSHIPS = [
  { value: 'spouse',  label: 'Spouse' },
  { value: 'child',   label: 'Child' },
  { value: 'parent',  label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend',  label: 'Friend' },
  { value: 'trust',   label: 'Trust' },
  { value: 'charity', label: 'Charity' },
  { value: 'other',   label: 'Other' },
];

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export function BeneficiaryForm({ beneficiary, onSave, onCancel }: BeneficiaryFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name:             beneficiary?.full_name || '',
    relationship:          beneficiary?.relationship || 'other',
    allocation_percentage: beneficiary?.allocation_percentage?.toString() || '',
    contact_email:         beneficiary?.contact_email || '',
    contact_phone:         beneficiary?.contact_phone || '',
    date_of_birth:         beneficiary?.date_of_birth || '',
    notes:                 beneficiary?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);

    try {
      const payload = {
        full_name:             formData.full_name.trim(),
        relationship:          formData.relationship,
        allocation_percentage: parseFloat(formData.allocation_percentage) || 0,
        contact_email:         formData.contact_email.trim(),
        contact_phone:         formData.contact_phone.trim(),
        date_of_birth:         formData.date_of_birth || null,
        notes:                 formData.notes.trim(),
        user_id:               user.id,
      };

      if (beneficiary?.id) {
        const { error: err } = await supabase
          .from('beneficiaries')
          .update(payload)
          .eq('id', beneficiary.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('beneficiaries').insert(payload);
        if (err) throw err;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving beneficiary:', err);
      setError(err?.message || 'Failed to save beneficiary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {beneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}
        </h4>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={inputClass}
            placeholder="Enter full legal name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Relationship <span className="text-red-500">*</span></label>
            <select
              required
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className={inputClass}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Allocation % <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              max="100"
              value={formData.allocation_percentage}
              onChange={(e) => setFormData({ ...formData, allocation_percentage: e.target.value })}
              className={inputClass}
              placeholder="e.g. 50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className={inputClass}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className={inputClass}
              placeholder="+1 555 000 0000"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Date of Birth</label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={inputClass}
            placeholder="Any additional information..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Saving…' : 'Save Beneficiary'}
          </button>
        </div>
      </form>
    </div>
  );
}
