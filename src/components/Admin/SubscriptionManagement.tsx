import { useEffect, useState, useRef } from 'react';
import { CreditCard as Edit2, Save, X, Tag, ExternalLink } from 'lucide-react';
import { getAllSubscriptionPlans, updateSubscriptionPlan } from '../../lib/adminHelpers';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabase';

export default function SubscriptionManagement() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const { logActivity, hasPermission } = useAdmin();
  const canEdit = hasPermission('manage_subscriptions');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    loadPlans();

    const channel = supabase
      .channel('admin-subscription-tiers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_tiers' },
        () => { loadPlans(); }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadPlans = async () => {
    try {
      const data = await getAllSubscriptionPlans();
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan: any) => {
    setEditingPlan(plan.id);
    setEditForm({ ...plan });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setEditForm(null);
  };

  const savePlan = async () => {
    if (!editForm || !editingPlan) return;

    try {
      await updateSubscriptionPlan(editingPlan, {
        display_name: editForm.display_name,
        monthly_price: Number(editForm.monthly_price),
        annual_price: Number(editForm.annual_price),
        max_goals: Number(editForm.max_goals),
        is_active: editForm.is_active,
        coming_soon: !!editForm.coming_soon,
        stripe_price_id_monthly: editForm.stripe_price_id_monthly || null,
        stripe_price_id_annual: editForm.stripe_price_id_annual || null,
      });

      await logActivity('update_subscription_plan', 'subscription_tier', editingPlan, {
        changes: editForm,
      });

      await loadPlans();
      cancelEdit();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan. Please try again.');
    }
  };

  const tierColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-700',
    paid: 'bg-blue-100 text-blue-700',
    premium: 'bg-amber-100 text-amber-700',
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600 dark:text-gray-400">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription Plans</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Configure plan pricing and Stripe price IDs for checkout.
            </p>
          </div>
          <a
            href="https://dashboard.stripe.com/products"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={14} />
            Stripe Products
          </a>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border border-slate-200 dark:border-gray-700 rounded-lg p-6">
              {editingPlan === plan.id ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Tier Name</label>
                      <input
                        type="text"
                        value={editForm.tier_name}
                        disabled
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.monthly_price}
                        onChange={(e) => setEditForm({ ...editForm, monthly_price: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Annual Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.annual_price}
                        onChange={(e) => setEditForm({ ...editForm, annual_price: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Max Goals</label>
                      <input
                        type="number"
                        value={editForm.max_goals}
                        onChange={(e) => setEditForm({ ...editForm, max_goals: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex items-end pb-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Active</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!editForm.coming_soon}
                          onChange={(e) => setEditForm({ ...editForm, coming_soon: e.target.checked })}
                          className="w-4 h-4 text-amber-500 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Coming Soon</span>
                      </label>
                    </div>
                  </div>

                  {plan.tier_name !== 'free' && (
                    <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 bg-slate-50 dark:bg-gray-900 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag size={14} className="text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Stripe Price IDs</span>
                        <span className="text-xs text-slate-400">From your Stripe Dashboard → Products</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Monthly Price ID</label>
                        <input
                          type="text"
                          value={editForm.stripe_price_id_monthly ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, stripe_price_id_monthly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Annual Price ID</label>
                        <input
                          type="text"
                          value={editForm.stripe_price_id_annual ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, stripe_price_id_annual: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={savePlan}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{plan.display_name}</h3>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full capitalize ${tierColors[plan.tier_name] || 'bg-slate-100 text-slate-700'}`}>
                          {plan.tier_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {plan.coming_soon && (
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          Coming Soon
                        </span>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => startEdit(plan)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-slate-500 dark:text-gray-400 mb-0.5">Monthly</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">${plan.monthly_price}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-slate-500 dark:text-gray-400 mb-0.5">Annual</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">${plan.annual_price}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-slate-500 dark:text-gray-400 mb-0.5">Max Goals</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{plan.max_goals}</div>
                    </div>
                  </div>

                  {plan.tier_name !== 'free' && (
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Tag size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-gray-400">Monthly Price ID</span>
                        </div>
                        <div className="text-xs font-mono text-slate-700 dark:text-gray-300 truncate">
                          {plan.stripe_price_id_monthly || <span className="text-slate-400 italic">Not set</span>}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Tag size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-gray-400">Annual Price ID</span>
                        </div>
                        <div className="text-xs font-mono text-slate-700 dark:text-gray-300 truncate">
                          {plan.stripe_price_id_annual || <span className="text-slate-400 italic">Not set</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">Features</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(plan.features) &&
                        plan.features.map((feature: string, index: number) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                            {feature}
                          </span>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
