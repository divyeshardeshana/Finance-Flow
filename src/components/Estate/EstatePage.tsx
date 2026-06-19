import { useState, useEffect } from 'react';
import { Shield, Plus, CreditCard as Edit2, Trash2, Users, FileText, Heart, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency } from '../../lib/currency';
import { Database } from '../../lib/database.types';
import { BeneficiaryForm } from './BeneficiaryForm';

type Beneficiary = Database['public']['Tables']['beneficiaries']['Row'];
type InsurancePolicy = Database['public']['Tables']['insurance_policies']['Row'];
type EstateDocument = Database['public']['Tables']['estate_documents']['Row'];

const emptyInsurance = {
  policy_name: '',
  policy_type: 'other' as InsurancePolicy['policy_type'],
  policy_number: '',
  provider: '',
  coverage_amount: '',
  premium_amount: '',
  premium_frequency: 'monthly' as InsurancePolicy['premium_frequency'],
  start_date: '',
  expiry_date: '',
  notes: '',
};

const emptyDocument = {
  document_name: '',
  document_type: 'other' as EstateDocument['document_type'],
  last_updated: '',
  attorney_name: '',
  attorney_contact: '',
  location: '',
  review_date: '',
  notes: '',
};

export function EstatePage() {
  const { user } = useAuth();
  const { checkAndLogAccess, tier } = useSubscription();
  const { preferences } = useAppPreferences();
  const currency = preferences.currency;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'beneficiaries' | 'insurance' | 'documents'>('beneficiaries');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [estateDocuments, setEstateDocuments] = useState<EstateDocument[]>([]);

  // Beneficiary state
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  // Insurance state
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsurancePolicy | null>(null);
  const [insuranceForm, setInsuranceForm] = useState(emptyInsurance);
  const [insuranceLoading, setInsuranceLoading] = useState(false);

  // Document state
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EstateDocument | null>(null);
  const [documentForm, setDocumentForm] = useState(emptyDocument);
  const [documentLoading, setDocumentLoading] = useState(false);

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  async function checkFeatureAccess() {
    const hasAccess = await checkAndLogAccess('estate_planning');
    if (hasAccess) loadData();
  }

  async function loadData() {
    if (!user) return;
    try {
      const [benRes, insRes, docRes] = await Promise.all([
        supabase.from('beneficiaries').select('*').eq('user_id', user.id).order('allocation_percentage', { ascending: false }),
        supabase.from('insurance_policies').select('*').eq('user_id', user.id).order('coverage_amount', { ascending: false }),
        supabase.from('estate_documents').select('*').eq('user_id', user.id).order('review_date'),
      ]);
      if (benRes.error) throw benRes.error;
      if (insRes.error) throw insRes.error;
      if (docRes.error) throw docRes.error;
      setBeneficiaries(benRes.data || []);
      setInsurancePolicies(insRes.data || []);
      setEstateDocuments(docRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteBeneficiary = async (id: string) => {
    if (!confirm('Delete this beneficiary?')) return;
    try {
      const { error } = await supabase.from('beneficiaries').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Failed to delete: ' + (error?.message || 'Unknown error'));
    }
  };

  function openInsuranceAdd() {
    setEditingInsurance(null);
    setInsuranceForm(emptyInsurance);
    setShowInsuranceForm(true);
  }

  function openInsuranceEdit(p: InsurancePolicy) {
    setEditingInsurance(p);
    setInsuranceForm({
      policy_name: p.policy_name,
      policy_type: p.policy_type,
      policy_number: p.policy_number,
      provider: p.provider,
      coverage_amount: String(p.coverage_amount),
      premium_amount: String(p.premium_amount),
      premium_frequency: p.premium_frequency,
      start_date: p.start_date || '',
      expiry_date: p.expiry_date || '',
      notes: p.notes,
    });
    setShowInsuranceForm(true);
  }

  async function handleInsuranceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const coverage = parseFloat(insuranceForm.coverage_amount);
    const premium = parseFloat(insuranceForm.premium_amount);
    if (isNaN(coverage) || coverage < 0) { alert('Coverage amount must be a valid number.'); return; }
    if (isNaN(premium) || premium < 0) { alert('Premium amount must be a valid number.'); return; }
    setInsuranceLoading(true);
    try {
      const data = {
        user_id: user.id,
        policy_name: insuranceForm.policy_name,
        policy_type: insuranceForm.policy_type,
        policy_number: insuranceForm.policy_number,
        provider: insuranceForm.provider,
        coverage_amount: coverage,
        premium_amount: premium,
        premium_frequency: insuranceForm.premium_frequency,
        start_date: insuranceForm.start_date || null,
        expiry_date: insuranceForm.expiry_date || null,
        notes: insuranceForm.notes,
      };
      if (editingInsurance) {
        const { error } = await supabase.from('insurance_policies').update(data).eq('id', editingInsurance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('insurance_policies').insert(data);
        if (error) throw error;
      }
      setShowInsuranceForm(false);
      setEditingInsurance(null);
      loadData();
    } catch (error: any) {
      alert('Failed to save policy: ' + (error?.message || 'Unknown error'));
    } finally {
      setInsuranceLoading(false);
    }
  }

  async function handleDeleteInsurance(id: string) {
    if (!confirm('Delete this insurance policy?')) return;
    try {
      const { error } = await supabase.from('insurance_policies').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Failed to delete: ' + (error?.message || 'Unknown error'));
    }
  }

  function openDocumentAdd() {
    setEditingDocument(null);
    setDocumentForm(emptyDocument);
    setShowDocumentForm(true);
  }

  function openDocumentEdit(doc: EstateDocument) {
    setEditingDocument(doc);
    setDocumentForm({
      document_name: doc.document_name,
      document_type: doc.document_type,
      last_updated: doc.last_updated || '',
      attorney_name: doc.attorney_name,
      attorney_contact: doc.attorney_contact,
      location: doc.location,
      review_date: doc.review_date || '',
      notes: doc.notes,
    });
    setShowDocumentForm(true);
  }

  async function handleDocumentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setDocumentLoading(true);
    try {
      const data = {
        user_id: user.id,
        document_name: documentForm.document_name,
        document_type: documentForm.document_type,
        last_updated: documentForm.last_updated || null,
        attorney_name: documentForm.attorney_name,
        attorney_contact: documentForm.attorney_contact,
        location: documentForm.location,
        review_date: documentForm.review_date || null,
        notes: documentForm.notes,
      };
      if (editingDocument) {
        const { error } = await supabase.from('estate_documents').update(data).eq('id', editingDocument.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('estate_documents').insert(data);
        if (error) throw error;
      }
      setShowDocumentForm(false);
      setEditingDocument(null);
      loadData();
    } catch (error: any) {
      alert('Failed to save document: ' + (error?.message || 'Unknown error'));
    } finally {
      setDocumentLoading(false);
    }
  }

  async function handleDeleteDocument(id: string) {
    if (!confirm('Delete this document?')) return;
    try {
      const { error } = await supabase.from('estate_documents').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Failed to delete: ' + (error?.message || 'Unknown error'));
    }
  }

  const totalCoverage = insurancePolicies.reduce((sum, p) => sum + Number(p.coverage_amount), 0);
  const totalAllocation = beneficiaries.reduce((sum, b) => sum + Number(b.allocation_percentage), 0);
  const documentsNeedingReview = estateDocuments.filter(
    (doc) => doc.review_date && new Date(doc.review_date) <= new Date()
  );

  const inputCls = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading estate planning data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estate Planning</h1>
          <p className="text-gray-600 mt-1">Manage beneficiaries, insurance, and important documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Beneficiaries</span>
            <Users className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold">{beneficiaries.length}</div>
          <p className="text-blue-100 text-sm mt-1">{totalAllocation.toFixed(0)}% allocated</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100">Insurance Coverage</span>
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(totalCoverage, currency)}</div>
          <p className="text-green-100 text-sm mt-1">{insurancePolicies.length} policies</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-teal-100">Estate Documents</span>
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold">{estateDocuments.length}</div>
          <p className="text-teal-100 text-sm mt-1">
            {documentsNeedingReview.length > 0 ? `${documentsNeedingReview.length} need review` : 'All current'}
          </p>
        </div>
      </div>

      {documentsNeedingReview.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Documents Need Review</h3>
              <p className="text-sm text-yellow-800">
                {documentsNeedingReview.length} document(s) need to be reviewed. Keep your estate plan up to date.
              </p>
            </div>
          </div>
        </div>
      )}

      {totalAllocation > 100 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Allocation Over 100%</h3>
              <p className="text-sm text-red-800">
                Your beneficiary allocations total {totalAllocation.toFixed(0)}%. Please adjust to equal 100%.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            {(['beneficiaries', 'insurance', 'documents'] as const).map((tab) => {
              const Icon = tab === 'beneficiaries' ? Users : tab === 'insurance' ? Shield : FileText;
              const count = tab === 'beneficiaries' ? beneficiaries.length : tab === 'insurance' ? insurancePolicies.length : estateDocuments.length;
              const label = tab === 'beneficiaries' ? 'Beneficiaries' : tab === 'insurance' ? 'Insurance' : 'Documents';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    {label} ({count})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* ── Beneficiaries Tab ── */}
          {activeTab === 'beneficiaries' && (
            <>
              {tier === 'premium' ? (
                <>
                  {showBeneficiaryForm ? (
                    <BeneficiaryForm
                      beneficiary={editingBeneficiary}
                      onSave={() => { setShowBeneficiaryForm(false); setEditingBeneficiary(null); loadData(); }}
                      onCancel={() => { setShowBeneficiaryForm(false); setEditingBeneficiary(null); }}
                    />
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowBeneficiaryForm(true)}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Add Beneficiary
                      </button>
                      {beneficiaries.length > 0 ? beneficiaries.map((ben) => (
                        <div key={ben.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{ben.full_name}</h4>
                              <p className="text-sm text-gray-600 mt-1 capitalize">{ben.relationship}</p>
                              {ben.contact_email && <p className="text-sm text-gray-500 mt-1">{ben.contact_email}</p>}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{ben.allocation_percentage}% allocation</span>
                                {(ben as any).contingent && <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">Contingent</span>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingBeneficiary(ben); setShowBeneficiaryForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteBeneficiary(ben.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      )) : <div className="text-center py-8 text-gray-500">No beneficiaries added yet</div>}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-600 mb-4">Estate Planning is available for Premium Plan users.</p>
                </div>
              )}
            </>
          )}

          {/* ── Insurance Tab ── */}
          {activeTab === 'insurance' && (
            <>
              {tier === 'premium' ? (
                <div className="space-y-4">
                  {showInsuranceForm ? (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-900">{editingInsurance ? 'Edit Policy' : 'Add Insurance Policy'}</h4>
                        <button onClick={() => { setShowInsuranceForm(false); setEditingInsurance(null); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-600" /></button>
                      </div>
                      <form onSubmit={handleInsuranceSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>Policy Name <span className="text-red-600">*</span></label>
                            <input required type="text" value={insuranceForm.policy_name} onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_name: e.target.value })} className={inputCls} placeholder="e.g., Term Life Insurance" />
                          </div>
                          <div>
                            <label className={labelCls}>Policy Type</label>
                            <select value={insuranceForm.policy_type} onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_type: e.target.value as InsurancePolicy['policy_type'] })} className={inputCls}>
                              <option value="life">Life</option>
                              <option value="health">Health</option>
                              <option value="disability">Disability</option>
                              <option value="long_term_care">Long Term Care</option>
                              <option value="property">Property</option>
                              <option value="auto">Auto</option>
                              <option value="umbrella">Umbrella</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Policy Number</label>
                            <input type="text" value={insuranceForm.policy_number} onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_number: e.target.value })} className={inputCls} placeholder="Policy #" />
                          </div>
                          <div>
                            <label className={labelCls}>Provider / Insurer</label>
                            <input type="text" value={insuranceForm.provider} onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })} className={inputCls} placeholder="Insurance company" />
                          </div>
                          <div>
                            <label className={labelCls}>Coverage Amount <span className="text-red-600">*</span></label>
                            <input required type="number" min="0" step="0.01" value={insuranceForm.coverage_amount} onChange={(e) => setInsuranceForm({ ...insuranceForm, coverage_amount: e.target.value })} className={inputCls} placeholder="0.00" />
                          </div>
                          <div>
                            <label className={labelCls}>Premium Amount</label>
                            <input type="number" min="0" step="0.01" value={insuranceForm.premium_amount} onChange={(e) => setInsuranceForm({ ...insuranceForm, premium_amount: e.target.value })} className={inputCls} placeholder="0.00" />
                          </div>
                          <div>
                            <label className={labelCls}>Premium Frequency</label>
                            <select value={insuranceForm.premium_frequency} onChange={(e) => setInsuranceForm({ ...insuranceForm, premium_frequency: e.target.value as InsurancePolicy['premium_frequency'] })} className={inputCls}>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="annual">Annual</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Start Date</label>
                            <input type="date" value={insuranceForm.start_date} onChange={(e) => setInsuranceForm({ ...insuranceForm, start_date: e.target.value })} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Expiry Date</label>
                            <input type="date" value={insuranceForm.expiry_date} onChange={(e) => setInsuranceForm({ ...insuranceForm, expiry_date: e.target.value })} className={inputCls} />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Notes</label>
                          <textarea rows={2} value={insuranceForm.notes} onChange={(e) => setInsuranceForm({ ...insuranceForm, notes: e.target.value })} className={inputCls} placeholder="Additional details..." />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => { setShowInsuranceForm(false); setEditingInsurance(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
                          <button type="submit" disabled={insuranceLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                            {insuranceLoading ? 'Saving...' : editingInsurance ? 'Update Policy' : 'Add Policy'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      <button onClick={openInsuranceAdd} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Add Insurance Policy
                      </button>
                      {insurancePolicies.length > 0 ? insurancePolicies.map((p) => (
                        <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900">{p.policy_name}</h4>
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded capitalize">{p.policy_type.replace('_', ' ')}</span>
                              </div>
                              {p.provider && <p className="text-sm text-gray-600 mt-1">{p.provider}{p.policy_number ? ` · #${p.policy_number}` : ''}</p>}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">Coverage: {formatCurrency(Number(p.coverage_amount), currency)}</span>
                                {Number(p.premium_amount) > 0 && <span className="text-sm text-gray-500">Premium: {formatCurrency(Number(p.premium_amount), currency)}/{p.premium_frequency}</span>}
                                {p.expiry_date && <span className="text-sm text-gray-500">Expires: {p.expiry_date}</span>}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <button onClick={() => openInsuranceEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteInsurance(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      )) : <div className="text-center py-8 text-gray-500">No insurance policies added yet</div>}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-600">Insurance Policy Management is available for Premium Plan users.</p>
                </div>
              )}
            </>
          )}

          {/* ── Documents Tab ── */}
          {activeTab === 'documents' && (
            <>
              {tier === 'premium' ? (
                <div className="space-y-4">
                  {showDocumentForm ? (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-900">{editingDocument ? 'Edit Document' : 'Add Estate Document'}</h4>
                        <button onClick={() => { setShowDocumentForm(false); setEditingDocument(null); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-600" /></button>
                      </div>
                      <form onSubmit={handleDocumentSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>Document Name <span className="text-red-600">*</span></label>
                            <input required type="text" value={documentForm.document_name} onChange={(e) => setDocumentForm({ ...documentForm, document_name: e.target.value })} className={inputCls} placeholder="e.g., Last Will and Testament" />
                          </div>
                          <div>
                            <label className={labelCls}>Document Type</label>
                            <select value={documentForm.document_type} onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value as EstateDocument['document_type'] })} className={inputCls}>
                              <option value="will">Will</option>
                              <option value="trust">Trust</option>
                              <option value="power_of_attorney">Power of Attorney</option>
                              <option value="healthcare_directive">Healthcare Directive</option>
                              <option value="beneficiary_designation">Beneficiary Designation</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Last Updated</label>
                            <input type="date" value={documentForm.last_updated} onChange={(e) => setDocumentForm({ ...documentForm, last_updated: e.target.value })} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Review Date</label>
                            <input type="date" value={documentForm.review_date} onChange={(e) => setDocumentForm({ ...documentForm, review_date: e.target.value })} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Attorney Name</label>
                            <input type="text" value={documentForm.attorney_name} onChange={(e) => setDocumentForm({ ...documentForm, attorney_name: e.target.value })} className={inputCls} placeholder="Attorney / Notary name" />
                          </div>
                          <div>
                            <label className={labelCls}>Attorney Contact</label>
                            <input type="text" value={documentForm.attorney_contact} onChange={(e) => setDocumentForm({ ...documentForm, attorney_contact: e.target.value })} className={inputCls} placeholder="Phone or email" />
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelCls}>Document Location</label>
                            <input type="text" value={documentForm.location} onChange={(e) => setDocumentForm({ ...documentForm, location: e.target.value })} className={inputCls} placeholder="Where is the original stored?" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Notes</label>
                          <textarea rows={2} value={documentForm.notes} onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })} className={inputCls} placeholder="Additional details..." />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => { setShowDocumentForm(false); setEditingDocument(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
                          <button type="submit" disabled={documentLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">
                            {documentLoading ? 'Saving...' : editingDocument ? 'Update Document' : 'Add Document'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      <button onClick={openDocumentAdd} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Add Estate Document
                      </button>
                      {estateDocuments.length > 0 ? estateDocuments.map((doc) => {
                        const overdue = doc.review_date && new Date(doc.review_date) <= new Date();
                        return (
                          <div key={doc.id} className={`rounded-lg p-4 border ${overdue ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-gray-900">{doc.document_name}</h4>
                                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs rounded capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                                  {overdue && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Review Due</span>}
                                </div>
                                {doc.location && <p className="text-sm text-gray-600 mt-1">📁 {doc.location}</p>}
                                {doc.attorney_name && <p className="text-sm text-gray-500 mt-1">Attorney: {doc.attorney_name}</p>}
                                <div className="flex gap-3 mt-2 flex-wrap text-xs text-gray-500">
                                  {doc.last_updated && <span>Updated: {doc.last_updated}</span>}
                                  {doc.review_date && <span>Review: {doc.review_date}</span>}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-2">
                                <button onClick={() => openDocumentEdit(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        );
                      }) : <div className="text-center py-8 text-gray-500">No estate documents added yet</div>}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-600">Estate Document Tracking is available for Premium Plan users.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Heart className="w-5 h-5 text-blue-600" />
          Why Estate Planning Matters
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>Ensure your assets are distributed according to your wishes</span></li>
          <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>Protect your loved ones and minimize taxes</span></li>
          <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>Designate guardians for minor children</span></li>
          <li className="flex items-start gap-2"><span className="text-blue-600 mt-1">•</span><span>Avoid probate and family disputes</span></li>
        </ul>
      </div>
    </div>
  );
}
