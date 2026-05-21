import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface BeneficiaryFormProps {
  beneficiary?: any;
  onSave: () => void;
  onCancel: () => void;
}

export function BeneficiaryForm({ beneficiary, onSave, onCancel }: BeneficiaryFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: beneficiary?.full_name || '',
    relationship: beneficiary?.relationship || '',
    allocation_percentage: beneficiary?.allocation_percentage || '',
    contact_info: beneficiary?.contact_info || '',
    contingent: beneficiary?.contingent || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        allocation_percentage: parseFloat(formData.allocation_percentage),
        user_id: user.id,
      };

      if (beneficiary) {
        const { error } = await supabase
          .from('beneficiaries')
          .update(data)
          .eq('id', beneficiary.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('beneficiaries').insert(data);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving beneficiary:', error);
      alert('Failed to save beneficiary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900">
          {beneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}
        </h4>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Spouse, Child"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allocation % <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              max="100"
              value={formData.allocation_percentage}
              onChange={(e) => setFormData({ ...formData, allocation_percentage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info</label>
          <input
            type="text"
            value={formData.contact_info}
            onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Email or phone"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="contingent"
            checked={formData.contingent}
            onChange={(e) => setFormData({ ...formData, contingent: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="contingent" className="text-sm text-gray-700">
            Contingent beneficiary (backup)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
