import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, CreditCard as Edit2, Trash2, DollarSign, Home, Car, Briefcase, CreditCard, Calendar, Wallet, Building2, Landmark, Bitcoin, ArrowUpRight, ArrowDownRight, Camera, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { Database } from '../../lib/database.types';

type Asset = Database['public']['Tables']['assets']['Row'];
type Liability = Database['public']['Tables']['liabilities']['Row'];
type NetWorthSnapshot = Database['public']['Tables']['net_worth_snapshots']['Row'];

const assetTypeIcons: Record<string, React.ElementType> = {
  real_estate: Home,
  investment: TrendingUp,
  cash: DollarSign,
  retirement: Landmark,
  vehicle: Car,
  business: Briefcase,
  crypto: Bitcoin,
  other: Wallet,
};

const assetTypeColors: Record<string, string> = {
  real_estate: 'bg-blue-500/10 dark:bg-blue-500/[0.15] text-blue-500',
  investment: 'bg-emerald-500/10 dark:bg-emerald-500/[0.15] text-emerald-500',
  cash: 'bg-teal-500/10 dark:bg-teal-500/[0.15] text-teal-500',
  retirement: 'bg-amber-500/10 dark:bg-amber-500/[0.15] text-amber-500',
  vehicle: 'bg-sky-500/10 dark:bg-sky-500/[0.15] text-sky-500',
  business: 'bg-orange-500/10 dark:bg-orange-500/[0.15] text-orange-500',
  crypto: 'bg-purple-500/10 dark:bg-purple-500/[0.15] text-purple-500',
  other: 'bg-gray-500/10 dark:bg-gray-500/[0.15] text-gray-500',
};

const assetTypeLabels: Record<string, string> = {
  real_estate: 'Real Estate',
  investment: 'Investment',
  cash: 'Cash',
  retirement: 'Retirement Account',
  vehicle: 'Vehicle',
  business: 'Business',
  crypto: 'Cryptocurrency',
  other: 'Other',
};

const liabilityTypeLabels: Record<string, string> = {
  mortgage: 'Mortgage',
  loan: 'Personal Loan',
  credit_card: 'Credit Card',
  student_loan: 'Student Loan',
  auto_loan: 'Auto Loan',
  other: 'Other',
};

const liabilityTypeIcons: Record<string, React.ElementType> = {
  mortgage: Building2,
  loan: DollarSign,
  credit_card: CreditCard,
  student_loan: Landmark,
  auto_loan: Car,
  other: Wallet,
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />;
}

function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
      </div>
      <SkeletonBlock className="w-24 h-2.5 mb-3 rounded-full" />
      <SkeletonBlock className="w-36 h-7 mb-2" />
      <SkeletonBlock className="w-20 h-2.5 rounded-full" />
    </div>
  );
}

function SkeletonItemCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <SkeletonBlock className="w-40 h-3.5 mb-2" />
          <SkeletonBlock className="w-24 h-2.5 rounded-full" />
        </div>
        <div className="text-right">
          <SkeletonBlock className="w-24 h-4 mb-1.5 ml-auto" />
          <SkeletonBlock className="w-16 h-2.5 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function NetWorthPage() {
  const { user } = useAuth();
  const { checkAndLogAccess } = useSubscription();
  const { preferences } = useAppPreferences();
  const currency = preferences.currency;

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities'>('assets');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const [assetFormData, setAssetFormData] = useState({
    asset_name: '',
    asset_type: 'cash' as Asset['asset_type'],
    current_value: '',
    purchase_date: '',
    purchase_price: '',
    is_liquid: true,
    notes: '',
  });

  const [liabilityFormData, setLiabilityFormData] = useState({
    liability_name: '',
    liability_type: 'loan' as Liability['liability_type'],
    current_balance: '',
    original_amount: '',
    interest_rate: '',
    monthly_payment: '',
    due_date: '',
    notes: '',
  });

  const totalAssets = assets.reduce(
    (sum, asset) => sum + convertCurrency(Number(asset.current_value), asset.currency || 'USD', currency),
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + convertCurrency(Number(liability.current_balance), liability.currency || 'USD', currency),
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  const netWorthChange =
    snapshots.length > 1 ? netWorth - Number(snapshots[1]?.net_worth || 0) : 0;

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  async function checkFeatureAccess() {
    const hasAccess = await checkAndLogAccess('net_worth_tracking');
    if (hasAccess) {
      loadData();
    } else {
      setLoading(false);
    }
  }

  async function loadData() {
    if (!user) return;

    try {
      const [assetsRes, liabilitiesRes, snapshotsRes] = await Promise.all([
        supabase.from('assets').select('*').eq('user_id', user.id).order('current_value', { ascending: false }),
        supabase.from('liabilities').select('*').eq('user_id', user.id).order('current_balance', { ascending: false }),
        supabase
          .from('net_worth_snapshots')
          .select('*')
          .eq('user_id', user.id)
          .order('snapshot_date', { ascending: false })
          .limit(12),
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (liabilitiesRes.error) throw liabilitiesRes.error;
      if (snapshotsRes.error) throw snapshotsRes.error;

      setAssets(assetsRes.data || []);
      setLiabilities(liabilitiesRes.data || []);
      setSnapshots(snapshotsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const data = {
        user_id: user.id,
        asset_name: assetFormData.asset_name,
        asset_type: assetFormData.asset_type,
        current_value: parseFloat(assetFormData.current_value),
        purchase_date: assetFormData.purchase_date || null,
        purchase_price: assetFormData.purchase_price ? parseFloat(assetFormData.purchase_price) : null,
        is_liquid: assetFormData.is_liquid,
        notes: assetFormData.notes,
        currency,
      };

      if (editingAsset) {
        const { error } = await supabase.from('assets').update(data).eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assets').insert(data);
        if (error) throw error;
      }

      resetAssetForm();
      loadData();
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  }

  async function handleLiabilitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const data = {
        user_id: user.id,
        liability_name: liabilityFormData.liability_name,
        liability_type: liabilityFormData.liability_type,
        current_balance: parseFloat(liabilityFormData.current_balance),
        original_amount: liabilityFormData.original_amount ? parseFloat(liabilityFormData.original_amount) : null,
        interest_rate: liabilityFormData.interest_rate ? parseFloat(liabilityFormData.interest_rate) : 0,
        monthly_payment: liabilityFormData.monthly_payment ? parseFloat(liabilityFormData.monthly_payment) : 0,
        due_date: liabilityFormData.due_date || null,
        notes: liabilityFormData.notes,
        currency,
      };

      if (editingLiability) {
        const { error } = await supabase.from('liabilities').update(data).eq('id', editingLiability.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('liabilities').insert(data);
        if (error) throw error;
      }

      resetLiabilityForm();
      loadData();
    } catch (error) {
      console.error('Error saving liability:', error);
    }
  }

  function resetAssetForm() {
    setAssetFormData({
      asset_name: '',
      asset_type: 'cash',
      current_value: '',
      purchase_date: '',
      purchase_price: '',
      is_liquid: true,
      notes: '',
    });
    setEditingAsset(null);
    setShowAssetForm(false);
  }

  function resetLiabilityForm() {
    setLiabilityFormData({
      liability_name: '',
      liability_type: 'loan',
      current_balance: '',
      original_amount: '',
      interest_rate: '',
      monthly_payment: '',
      due_date: '',
      notes: '',
    });
    setEditingLiability(null);
    setShowLiabilityForm(false);
  }

  function handleEditAsset(asset: Asset) {
    setEditingAsset(asset);
    setAssetFormData({
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      current_value: asset.current_value.toString(),
      purchase_date: asset.purchase_date || '',
      purchase_price: asset.purchase_price?.toString() || '',
      is_liquid: asset.is_liquid,
      notes: asset.notes,
    });
    setShowAssetForm(true);
  }

  function handleEditLiability(liability: Liability) {
    setEditingLiability(liability);
    setLiabilityFormData({
      liability_name: liability.liability_name,
      liability_type: liability.liability_type,
      current_balance: liability.current_balance.toString(),
      original_amount: liability.original_amount?.toString() || '',
      interest_rate: liability.interest_rate.toString(),
      monthly_payment: liability.monthly_payment.toString(),
      due_date: liability.due_date || '',
      notes: liability.notes,
    });
    setShowLiabilityForm(true);
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  }

  async function handleDeleteLiability(id: string) {
    if (!confirm('Are you sure you want to delete this liability?')) return;
    try {
      const { error } = await supabase.from('liabilities').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting liability:', error);
    }
  }

  async function createSnapshot() {
    if (!user) return;
    setSnapshotLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.rpc('create_net_worth_snapshot', {
        user_id_param: user.id,
        snapshot_date_param: today,
      });
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error creating snapshot:', error);
    } finally {
      setSnapshotLoading(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all';

  const labelClass = 'block text-[12px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">
            Net Worth Tracker
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            Track your assets, liabilities, and total net worth
          </p>
        </div>
        <button
          onClick={createSnapshot}
          disabled={snapshotLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Camera className="w-4 h-4" />
          {snapshotLoading ? 'Saving...' : 'Create Snapshot'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            {/* Total Assets */}
            <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-emerald-50/40 dark:to-emerald-900/[0.05] pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/[0.15]">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                  Total Assets
                </p>
                <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatCurrency(totalAssets, currency)}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
                </p>
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-50/40 dark:to-red-900/[0.05] pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 dark:bg-red-500/[0.15]">
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                  Total Liabilities
                </p>
                <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatCurrency(totalLiabilities, currency)}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {liabilities.length} {liabilities.length === 1 ? 'liability' : 'liabilities'}
                </p>
              </div>
            </div>

            {/* Net Worth */}
            <div className="group relative bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/40 dark:to-blue-900/[0.05] pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/[0.15]">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  {snapshots.length > 1 && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        netWorthChange >= 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      }`}
                    >
                      {netWorthChange >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {netWorthChange >= 0 ? '+' : ''}
                      {formatCurrency(netWorthChange, currency)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
                  Net Worth
                </p>
                <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatCurrency(netWorth, currency)}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {snapshots.length > 1
                    ? `${netWorthChange >= 0 ? '+' : ''}${formatCurrency(netWorthChange, currency)} vs last snapshot`
                    : 'No previous snapshot'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Net Worth History */}
      {(loading || snapshots.length > 0) && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Net Worth History</h2>
            <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">Recent snapshots of your financial position</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <SkeletonBlock className="w-28 h-3.5 mb-2" />
                    <SkeletonBlock className="w-48 h-2.5 rounded-full" />
                  </div>
                  <SkeletonBlock className="w-24 h-5 rounded-lg" />
                </div>
              ))
            ) : (
              snapshots.map((snapshot, index) => {
                const prevSnapshot = snapshots[index + 1];
                const change = prevSnapshot
                  ? Number(snapshot.net_worth) - Number(prevSnapshot.net_worth)
                  : null;

                return (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900 dark:text-white">
                        {new Date(snapshot.snapshot_date + 'T00:00:00').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Assets {formatCurrency(Number(snapshot.total_assets), currency)}
                        <span className="mx-1.5 text-gray-300 dark:text-gray-700">•</span>
                        Liabilities {formatCurrency(Number(snapshot.total_liabilities), currency)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {change !== null && (
                        <span
                          className={`text-[12px] font-semibold ${
                            change >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {change >= 0 ? '+' : ''}
                          {formatCurrency(change, currency)}
                        </span>
                      )}
                      <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                        {formatCurrency(Number(snapshot.net_worth), currency)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Assets & Liabilities Tabs */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        {/* Tab Bar */}
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                activeTab === 'assets'
                  ? 'bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Assets ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab('liabilities')}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                activeTab === 'liabilities'
                  ? 'bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Liabilities ({liabilities.length})
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Your Assets</h3>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Everything you own that holds value
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetAssetForm();
                    setShowAssetForm(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Asset
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => <SkeletonItemCard key={i} />)}
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/[0.1] flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                    No assets yet
                  </h3>
                  <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-5 max-w-xs mx-auto">
                    Start tracking your wealth by adding your properties, investments, and savings
                  </p>
                  <button
                    onClick={() => setShowAssetForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-blue-500/20 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Asset
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => {
                    const Icon = assetTypeIcons[asset.asset_type] || Wallet;
                    const colorClass = assetTypeColors[asset.asset_type] || assetTypeColors.other;
                    const value = convertCurrency(Number(asset.current_value), asset.currency || 'USD', currency);
                    const gain = asset.purchase_price
                      ? convertCurrency(
                          Number(asset.current_value) - Number(asset.purchase_price),
                          asset.currency || 'USD',
                          currency
                        )
                      : null;

                    return (
                      <div
                        key={asset.id}
                        className="group relative bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06] rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                                {asset.asset_name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400">
                                {assetTypeLabels[asset.asset_type]}
                              </span>
                              {asset.is_liquid && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  Liquid
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                              {formatCurrency(value, currency)}
                            </p>
                            {gain !== null && (
                              <p
                                className={`text-[12px] font-semibold mt-0.5 ${
                                  gain >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {gain >= 0 ? '+' : ''}
                                {formatCurrency(gain, currency)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                            <button
                              onClick={() => handleEditAsset(asset)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/[0.1] rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/[0.1] rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Liabilities Tab */}
          {activeTab === 'liabilities' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Your Liabilities</h3>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Outstanding debts and obligations
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetLiabilityForm();
                    setShowLiabilityForm(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Liability
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => <SkeletonItemCard key={i} />)}
                </div>
              ) : liabilities.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/[0.1] flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                    No liabilities yet
                  </h3>
                  <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-5 max-w-xs mx-auto">
                    Track your mortgages, loans, and credit card balances here
                  </p>
                  <button
                    onClick={() => setShowLiabilityForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-blue-500/20 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Liability
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {liabilities.map((liability) => {
                    const Icon = liabilityTypeIcons[liability.liability_type] || Wallet;
                    const balance = convertCurrency(
                      Number(liability.current_balance),
                      liability.currency || 'USD',
                      currency
                    );
                    const monthlyPayment =
                      liability.monthly_payment > 0
                        ? convertCurrency(
                            Number(liability.monthly_payment),
                            liability.currency || 'USD',
                            currency
                          )
                        : null;

                    return (
                      <div
                        key={liability.id}
                        className="group relative bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06] rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/10 dark:bg-red-500/[0.15] text-red-500">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                              {liability.liability_name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400">
                                {liabilityTypeLabels[liability.liability_type]}
                              </span>
                              {liability.interest_rate > 0 && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  {liability.interest_rate}% APR
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                              {formatCurrency(balance, currency)}
                            </p>
                            {monthlyPayment !== null && (
                              <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {formatCurrency(monthlyPayment, currency)}/mo
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                            <button
                              onClick={() => handleEditLiability(liability)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/[0.1] rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLiability(liability.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/[0.1] rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Asset Modal */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f0f10] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#0f0f10] border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">
                {editingAsset ? 'Edit Asset' : 'Add Asset'}
              </h2>
              <button
                onClick={resetAssetForm}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Asset Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={assetFormData.asset_name}
                  onChange={(e) => setAssetFormData({ ...assetFormData, asset_name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Primary Residence"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type <span className="text-red-500">*</span></label>
                  <select
                    value={assetFormData.asset_type}
                    onChange={(e) =>
                      setAssetFormData({ ...assetFormData, asset_type: e.target.value as Asset['asset_type'] })
                    }
                    className={inputClass}
                    required
                  >
                    <option value="real_estate">Real Estate</option>
                    <option value="investment">Investment</option>
                    <option value="cash">Cash</option>
                    <option value="retirement">Retirement</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="business">Business</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Current Value <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={assetFormData.current_value}
                    onChange={(e) => setAssetFormData({ ...assetFormData, current_value: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Purchase Date</label>
                  <input
                    type="date"
                    value={assetFormData.purchase_date}
                    onChange={(e) => setAssetFormData({ ...assetFormData, purchase_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={assetFormData.purchase_price}
                    onChange={(e) => setAssetFormData({ ...assetFormData, purchase_price: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.05]">
                <input
                  type="checkbox"
                  id="is_liquid"
                  checked={assetFormData.is_liquid}
                  onChange={(e) => setAssetFormData({ ...assetFormData, is_liquid: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_liquid" className="text-[13px] text-gray-700 dark:text-gray-300 cursor-pointer">
                  This asset is liquid (easily converted to cash)
                </label>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={assetFormData.notes}
                  onChange={(e) => setAssetFormData({ ...assetFormData, notes: e.target.value })}
                  rows={3}
                  className={inputClass}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAssetForm}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl text-[13px] font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-blue-500/20 transition-all duration-200"
                >
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Liability Modal */}
      {showLiabilityForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f0f10] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#0f0f10] border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">
                {editingLiability ? 'Edit Liability' : 'Add Liability'}
              </h2>
              <button
                onClick={resetLiabilityForm}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLiabilitySubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Liability Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={liabilityFormData.liability_name}
                  onChange={(e) =>
                    setLiabilityFormData({ ...liabilityFormData, liability_name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g., Home Mortgage"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type <span className="text-red-500">*</span></label>
                  <select
                    value={liabilityFormData.liability_type}
                    onChange={(e) =>
                      setLiabilityFormData({
                        ...liabilityFormData,
                        liability_type: e.target.value as Liability['liability_type'],
                      })
                    }
                    className={inputClass}
                    required
                  >
                    <option value="mortgage">Mortgage</option>
                    <option value="loan">Personal Loan</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="auto_loan">Auto Loan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Current Balance <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={liabilityFormData.current_balance}
                    onChange={(e) =>
                      setLiabilityFormData({ ...liabilityFormData, current_balance: e.target.value })
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Original Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={liabilityFormData.original_amount}
                    onChange={(e) =>
                      setLiabilityFormData({ ...liabilityFormData, original_amount: e.target.value })
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={liabilityFormData.interest_rate}
                    onChange={(e) =>
                      setLiabilityFormData({ ...liabilityFormData, interest_rate: e.target.value })
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Monthly Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={liabilityFormData.monthly_payment}
                    onChange={(e) =>
                      setLiabilityFormData({ ...liabilityFormData, monthly_payment: e.target.value })
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Payoff Date</label>
                  <input
                    type="date"
                    value={liabilityFormData.due_date}
                    onChange={(e) =>
                      setLiabilityFormData({ ...liabilityFormData, due_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={liabilityFormData.notes}
                  onChange={(e) =>
                    setLiabilityFormData({ ...liabilityFormData, notes: e.target.value })
                  }
                  rows={3}
                  className={inputClass}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetLiabilityForm}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-xl text-[13px] font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-[13px] font-semibold shadow-md shadow-blue-500/20 transition-all duration-200"
                >
                  {editingLiability ? 'Update Liability' : 'Add Liability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
