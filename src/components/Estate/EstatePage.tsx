import { useState, useEffect } from 'react';
import { Shield, Plus, CreditCard as Edit2, Trash2, Users, FileText, Heart, Calendar, AlertTriangle } from 'lucide-react';
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

export function EstatePage() {
  const { user } = useAuth();
  const { checkAndLogAccess, tier } = useSubscription();
  const { currency } = useAppPreferences();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'beneficiaries' | 'insurance' | 'documents'>('beneficiaries');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [estateDocuments, setEstateDocuments] = useState<EstateDocument[]>([]);
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  async function checkFeatureAccess() {
    const hasAccess = await checkAndLogAccess('estate_planning');
    if (hasAccess) {
      loadData();
    }
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
    if (!confirm('Are you sure you want to delete this beneficiary?')) return;

    try {
      const { error } = await supabase.from('beneficiaries').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      alert('Failed to delete beneficiary');
    }
  };

  const totalCoverage = insurancePolicies.reduce((sum, p) => sum + Number(p.coverage_amount), 0);
  const totalAllocation = beneficiaries.reduce((sum, b) => sum + Number(b.allocation_percentage), 0);
  const documentsNeedingReview = estateDocuments.filter(
    (doc) => doc.review_date && new Date(doc.review_date) <= new Date()
  );

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
    <div className="max-w-7xl mx-auto space-y-6">
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
            {documentsNeedingReview.length > 0 && `${documentsNeedingReview.length} need review`}
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
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'beneficiaries'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Beneficiaries ({beneficiaries.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'insurance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Insurance ({insurancePolicies.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Documents ({estateDocuments.length})
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'beneficiaries' && (
            <>
              {tier === 'premium' ? (
                <>
                  {showBeneficiaryForm ? (
                    <BeneficiaryForm
                      beneficiary={editingBeneficiary}
                      onSave={() => {
                        setShowBeneficiaryForm(false);
                        setEditingBeneficiary(null);
                        loadData();
                      }}
                      onCancel={() => {
                        setShowBeneficiaryForm(false);
                        setEditingBeneficiary(null);
                      }}
                    />
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowBeneficiaryForm(true)}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add Beneficiary
                      </button>

                      {beneficiaries.length > 0 ? (
                        beneficiaries.map((ben) => (
                          <div
                            key={ben.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{ben.full_name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{ben.relationship}</p>
                                {ben.contact_info && (
                                  <p className="text-sm text-gray-500 mt-1">{ben.contact_info}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {ben.allocation_percentage}% allocation
                                  </span>
                                  {ben.contingent && (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                      Contingent
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingBeneficiary(ben);
                                    setShowBeneficiaryForm(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBeneficiary(ben.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No beneficiaries added yet
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-600 mb-4">
                    Estate Planning with full CRUD capabilities is available for Premium Plan users.
                  </p>
                  <p className="text-sm text-gray-500">
                    Upgrade to Premium to manage beneficiaries, insurance policies, and estate documents.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'insurance' && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Insurance Policy Management</h3>
              <p className="text-gray-600">
                Keep track of all your insurance policies in one place. Full management features coming soon.
              </p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Estate Document Tracking</h3>
              <p className="text-gray-600">
                Track important documents like wills, trusts, and powers of attorney. Coming soon.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Heart className="w-5 h-5 text-blue-600" />
          Why Estate Planning Matters
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Ensure your assets are distributed according to your wishes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Protect your loved ones and minimize taxes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Designate guardians for minor children</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Avoid probate and family disputes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
