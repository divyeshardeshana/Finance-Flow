import { useState, useEffect } from 'react';
import {
  Shield, Plus, Trash2, Users, FileText, Heart,
  AlertTriangle, Edit2, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency } from '../../lib/currency';
import { BeneficiaryForm } from './BeneficiaryForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Beneficiary {
  id: string;
  full_name: string;
  relationship: string;
  allocation_percentage: number;
  contact_email: string;
  contact_phone: string;
  date_of_birth: string | null;
  notes: string;
}

interface InsurancePolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  policy_number: string;
  provider: string;
  coverage_amount: number;
  premium_amount: number;
  premium_frequency: string;
  start_date: string | null;
  expiry_date: string | null;
  notes: string;
}

interface EstateDocument {
  id: string;
  document_name: string;
  document_type: string;
  last_updated: string | null;
  attorney_name: string;
  attorney_contact: string;
  location: string;
  review_date: string | null;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INSURANCE_TYPES = [
  { value: 'life',           label: 'Life Insurance' },
  { value: 'health',         label: 'Health Insurance' },
  { value: 'disability',     label: 'Disability Insurance' },
  { value: 'long_term_care', label: 'Long-Term Care' },
  { value: 'property',       label: 'Property Insurance' },
  { value: 'auto',           label: 'Auto Insurance' },
  { value: 'umbrella',       label: 'Umbrella Policy' },
  { value: 'other',          label: 'Other' },
];

const PREMIUM_FREQUENCIES = [
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual',    label: 'Annual' },
];

const DOCUMENT_TYPES = [
  { value: 'will',                      label: 'Will' },
  { value: 'trust',                     label: 'Trust' },
  { value: 'power_of_attorney',         label: 'Power of Attorney' },
  { value: 'healthcare_directive',      label: 'Healthcare Directive' },
  { value: 'beneficiary_designation',   label: 'Beneficiary Designation' },
  { value: 'other',                     label: 'Other' },
];

const inputClass =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeLabel(value: string, options: { value: string; label: string }[]) {
  return options.find((o) => o.value === value)?.label ?? value;
}

// ─── Insurance Form ───────────────────────────────────────────────────────────

function InsuranceForm({
  policy,
  currency,
  onSave,
  onCancel,
}: {
  policy?: InsurancePolicy;
  currency: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    policy_name:       policy?.policy_name || '',
    policy_type:       policy?.policy_type || 'life',
    policy_number:     policy?.policy_number || '',
    provider:          policy?.provider || '',
    coverage_amount:   policy?.coverage_amount?.toString() || '',
    premium_amount:    policy?.premium_amount?.toString() || '',
    premium_frequency: policy?.premium_frequency || 'monthly',
    start_date:        policy?.start_date || '',
    expiry_date:       policy?.expiry_date || '',
    notes:             policy?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const payload = {
        policy_name:       form.policy_name.trim(),
        policy_type:       form.policy_type,
        policy_number:     form.policy_number.trim(),
        provider:          form.provider.trim(),
        coverage_amount:   parseFloat(form.coverage_amount) || 0,
        premium_amount:    parseFloat(form.premium_amount) || 0,
        premium_frequency: form.premium_frequency,
        start_date:        form.start_date || null,
        expiry_date:       form.expiry_date || null,
        notes:             form.notes.trim(),
        user_id:           user.id,
      };
      if (policy?.id) {
        const { error: err } = await supabase.from('insurance_policies').update(payload).eq('id', policy.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('insurance_policies').insert(payload);
        if (err) throw err;
      }
      onSave();
    } catch (err: any) {
      setError(err?.message || 'Failed to save policy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {policy ? 'Edit Policy' : 'Add Insurance Policy'}
        </h4>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Policy Name <span className="text-red-500">*</span></label>
            <input required type="text" value={form.policy_name}
              onChange={(e) => setForm({ ...form, policy_name: e.target.value })}
              className={inputClass} placeholder="e.g. Family Life Policy" />
          </div>

          <div>
            <label className={labelClass}>Insurance Type <span className="text-red-500">*</span></label>
            <select required value={form.policy_type}
              onChange={(e) => setForm({ ...form, policy_type: e.target.value })}
              className={inputClass}>
              {INSURANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Provider / Company</label>
            <input type="text" value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className={inputClass} placeholder="e.g. Prudential" />
          </div>

          <div>
            <label className={labelClass}>Policy Number</label>
            <input type="text" value={form.policy_number}
              onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
              className={inputClass} placeholder="e.g. POL-12345" />
          </div>

          <div>
            <label className={labelClass}>Premium Frequency</label>
            <select value={form.premium_frequency}
              onChange={(e) => setForm({ ...form, premium_frequency: e.target.value })}
              className={inputClass}>
              {PREMIUM_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Coverage Amount ({currency})</label>
            <input type="number" min="0" step="0.01" value={form.coverage_amount}
              onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })}
              className={inputClass} placeholder="0" />
          </div>

          <div>
            <label className={labelClass}>Premium Amount ({currency})</label>
            <input type="number" min="0" step="0.01" value={form.premium_amount}
              onChange={(e) => setForm({ ...form, premium_amount: e.target.value })}
              className={inputClass} placeholder="0" />
          </div>

          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Expiry / Renewal Date</label>
            <input type="date" value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              className={inputClass} />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass} placeholder="Any additional details..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
            {loading ? 'Saving…' : 'Save Policy'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Document Form ────────────────────────────────────────────────────────────

function DocumentForm({
  doc,
  onSave,
  onCancel,
}: {
  doc?: EstateDocument;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    document_name:    doc?.document_name || '',
    document_type:    doc?.document_type || 'will',
    last_updated:     doc?.last_updated || '',
    attorney_name:    doc?.attorney_name || '',
    attorney_contact: doc?.attorney_contact || '',
    location:         doc?.location || '',
    review_date:      doc?.review_date || '',
    notes:            doc?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const payload = {
        document_name:    form.document_name.trim(),
        document_type:    form.document_type,
        last_updated:     form.last_updated || null,
        attorney_name:    form.attorney_name.trim(),
        attorney_contact: form.attorney_contact.trim(),
        location:         form.location.trim(),
        review_date:      form.review_date || null,
        notes:            form.notes.trim(),
        user_id:          user.id,
      };
      if (doc?.id) {
        const { error: err } = await supabase.from('estate_documents').update(payload).eq('id', doc.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('estate_documents').insert(payload);
        if (err) throw err;
      }
      onSave();
    } catch (err: any) {
      setError(err?.message || 'Failed to save document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {doc ? 'Edit Document' : 'Add Estate Document'}
        </h4>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Document Name <span className="text-red-500">*</span></label>
            <input required type="text" value={form.document_name}
              onChange={(e) => setForm({ ...form, document_name: e.target.value })}
              className={inputClass} placeholder="e.g. Last Will & Testament" />
          </div>

          <div>
            <label className={labelClass}>Document Type <span className="text-red-500">*</span></label>
            <select required value={form.document_type}
              onChange={(e) => setForm({ ...form, document_type: e.target.value })}
              className={inputClass}>
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Last Updated Date</label>
            <input type="date" value={form.last_updated}
              onChange={(e) => setForm({ ...form, last_updated: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Attorney Name</label>
            <input type="text" value={form.attorney_name}
              onChange={(e) => setForm({ ...form, attorney_name: e.target.value })}
              className={inputClass} placeholder="e.g. John Smith" />
          </div>

          <div>
            <label className={labelClass}>Attorney Contact</label>
            <input type="text" value={form.attorney_contact}
              onChange={(e) => setForm({ ...form, attorney_contact: e.target.value })}
              className={inputClass} placeholder="Email or phone" />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Storage Location</label>
            <input type="text" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass} placeholder="e.g. Safe at home, Bank vault, Attorney's office" />
          </div>

          <div>
            <label className={labelClass}>Next Review Date</label>
            <input type="date" value={form.review_date}
              onChange={(e) => setForm({ ...form, review_date: e.target.value })}
              className={inputClass} />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass} placeholder="Any additional information..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
            {loading ? 'Saving…' : 'Save Document'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EstatePage() {
  const { user } = useAuth();
  const { checkAndLogAccess, hasFeatureAccess } = useSubscription();
  const { currency } = useAppPreferences();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'beneficiaries' | 'insurance' | 'documents'>('beneficiaries');

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [estateDocuments, setEstateDocuments] = useState<EstateDocument[]>([]);

  // beneficiary form state
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  // insurance form state
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsurancePolicy | null>(null);

  // document form state
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EstateDocument | null>(null);

  useEffect(() => {
    (async () => {
      const hasAccess = await checkAndLogAccess('estate_planning');
      if (hasAccess) loadData();
      else setLoading(false);
    })();
  }, []);

  async function loadData() {
    if (!user) return;
    try {
      const [benRes, insRes, docRes] = await Promise.all([
        supabase.from('beneficiaries').select('*').eq('user_id', user.id).order('allocation_percentage', { ascending: false }),
        supabase.from('insurance_policies').select('*').eq('user_id', user.id).order('coverage_amount', { ascending: false }),
        supabase.from('estate_documents').select('*').eq('user_id', user.id).order('review_date'),
      ]);
      setBeneficiaries(benRes.data || []);
      setInsurancePolicies(insRes.data || []);
      setEstateDocuments(docRes.data || []);
    } catch (err) {
      console.error('Estate load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteBeneficiary(id: string) {
    if (!confirm('Delete this beneficiary?')) return;
    await supabase.from('beneficiaries').delete().eq('id', id);
    loadData();
  }

  async function deleteInsurance(id: string) {
    if (!confirm('Delete this insurance policy?')) return;
    await supabase.from('insurance_policies').delete().eq('id', id);
    loadData();
  }

  async function deleteDocument(id: string) {
    if (!confirm('Delete this document record?')) return;
    await supabase.from('estate_documents').delete().eq('id', id);
    loadData();
  }

  const totalCoverage    = insurancePolicies.reduce((s, p) => s + Number(p.coverage_amount), 0);
  const totalAllocation  = beneficiaries.reduce((s, b) => s + Number(b.allocation_percentage), 0);
  const docsNeedReview   = estateDocuments.filter((d) => d.review_date && new Date(d.review_date) <= new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading estate planning data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estate Planning</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Document assets, assign beneficiaries, and record your estate wishes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm">Beneficiaries</span>
            <Users className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-bold">{beneficiaries.length}</div>
          <p className="text-blue-100 text-xs mt-1">{totalAllocation.toFixed(0)}% allocated</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100 text-sm">Insurance Coverage</span>
            <Shield className="w-5 h-5 text-green-200" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalCoverage, currency)}</div>
          <p className="text-green-100 text-xs mt-1">{insurancePolicies.length} policies</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-teal-100 text-sm">Estate Documents</span>
            <FileText className="w-5 h-5 text-teal-200" />
          </div>
          <div className="text-3xl font-bold">{estateDocuments.length}</div>
          <p className="text-teal-100 text-xs mt-1">
            {docsNeedReview.length > 0 ? `${docsNeedReview.length} need review` : 'All up to date'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {docsNeedReview.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm">Documents Need Review</p>
            <p className="text-yellow-800 dark:text-yellow-400 text-xs mt-0.5">
              {docsNeedReview.length} document(s) are due for review. Keep your estate plan current.
            </p>
          </div>
        </div>
      )}

      {totalAllocation > 100 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-300 text-sm">Allocation Over 100%</p>
            <p className="text-red-800 dark:text-red-400 text-xs mt-0.5">
              Total allocation is {totalAllocation.toFixed(0)}%. Adjust beneficiaries to equal 100%.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!hasFeatureAccess('estate_planning') ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Feature Not Available on Your Plan</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Estate Planning is not included in your current plan.
            Upgrade to a higher tier to get access.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {([
              { id: 'beneficiaries', label: 'Beneficiaries', icon: Users, count: beneficiaries.length },
              { id: 'insurance',     label: 'Insurance',     icon: Shield, count: insurancePolicies.length },
              { id: 'documents',     label: 'Documents',     icon: FileText, count: estateDocuments.length },
            ] as const).map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">{count}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Beneficiaries ── */}
            {activeTab === 'beneficiaries' && (
              <div className="space-y-4">
                {showBeneficiaryForm ? (
                  <BeneficiaryForm
                    beneficiary={editingBeneficiary}
                    onSave={() => { setShowBeneficiaryForm(false); setEditingBeneficiary(null); loadData(); }}
                    onCancel={() => { setShowBeneficiaryForm(false); setEditingBeneficiary(null); }}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingBeneficiary(null); setShowBeneficiaryForm(true); }}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Beneficiary
                    </button>

                    {beneficiaries.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No beneficiaries added yet
                      </div>
                    ) : (
                      beneficiaries.map((ben) => (
                        <div key={ben.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{ben.full_name}</h4>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded capitalize">
                                  {ben.relationship}
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                                  {ben.allocation_percentage}%
                                </span>
                              </div>
                              {(ben.contact_email || ben.contact_phone) && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {[ben.contact_email, ben.contact_phone].filter(Boolean).join(' · ')}
                                </p>
                              )}
                              {ben.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ben.notes}</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              <button onClick={() => { setEditingBeneficiary(ben); setShowBeneficiaryForm(true); }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteBeneficiary(ben.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Insurance ── */}
            {activeTab === 'insurance' && (
              <div className="space-y-4">
                {showInsuranceForm ? (
                  <InsuranceForm
                    policy={editingInsurance ?? undefined}
                    currency={currency}
                    onSave={() => { setShowInsuranceForm(false); setEditingInsurance(null); loadData(); }}
                    onCancel={() => { setShowInsuranceForm(false); setEditingInsurance(null); }}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingInsurance(null); setShowInsuranceForm(true); }}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Insurance Policy
                    </button>

                    {insurancePolicies.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No insurance policies added yet
                      </div>
                    ) : (
                      insurancePolicies.map((pol) => (
                        <div key={pol.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{pol.policy_name}</h4>
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                  {typeLabel(pol.policy_type, INSURANCE_TYPES)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-3 mt-2">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Coverage:</span> {formatCurrency(pol.coverage_amount, currency)}
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Premium:</span> {formatCurrency(pol.premium_amount, currency)}/{pol.premium_frequency}
                                </span>
                                {pol.provider && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Provider:</span> {pol.provider}
                                  </span>
                                )}
                                {pol.expiry_date && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Expires:</span> {fmt(pol.expiry_date)}
                                  </span>
                                )}
                              </div>
                              {pol.policy_number && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">#{pol.policy_number}</p>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              <button onClick={() => { setEditingInsurance(pol); setShowInsuranceForm(true); }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteInsurance(pol.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Documents ── */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {showDocumentForm ? (
                  <DocumentForm
                    doc={editingDocument ?? undefined}
                    onSave={() => { setShowDocumentForm(false); setEditingDocument(null); loadData(); }}
                    onCancel={() => { setShowDocumentForm(false); setEditingDocument(null); }}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingDocument(null); setShowDocumentForm(true); }}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Estate Document
                    </button>

                    {estateDocuments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No documents added yet
                      </div>
                    ) : (
                      estateDocuments.map((doc) => {
                        const overdue = doc.review_date && new Date(doc.review_date) <= new Date();
                        return (
                          <div key={doc.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{doc.document_name}</h4>
                                  <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded">
                                    {typeLabel(doc.document_type, DOCUMENT_TYPES)}
                                  </span>
                                  {overdue && (
                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                                      Review overdue
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-2">
                                  {doc.attorney_name && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Attorney:</span> {doc.attorney_name}
                                    </span>
                                  )}
                                  {doc.location && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Location:</span> {doc.location}
                                    </span>
                                  )}
                                  {doc.review_date && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Review by:</span> {fmt(doc.review_date)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 ml-2">
                                <button onClick={() => { setEditingDocument(doc); setShowDocumentForm(true); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteDocument(doc.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Why it matters */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-blue-600" />
          Why Estate Planning Matters
        </h3>
        <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
          {[
            'Ensure your assets are distributed according to your wishes',
            'Protect your loved ones and minimise estate taxes',
            'Designate guardians for minor children',
            'Avoid probate delays and family disputes',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
