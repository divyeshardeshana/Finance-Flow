import { useEffect, useState } from 'react';
import { Save, Eye, CreditCard as Edit2, Plus, Trash2, GripVertical, CheckCircle2, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

interface TierData {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: string;
  annual_price: string;
  description: string;
  cta_text: string;
  features: string[];
  max_goals: number;
  is_active: boolean;
  highlighted: boolean;
}

const DEFAULT_TIERS: TierData[] = [
  {
    id: '',
    tier_name: 'free',
    display_name: 'Free',
    monthly_price: '0',
    annual_price: '0',
    description: 'Perfect for getting started',
    cta_text: 'Get Started',
    features: ['Basic Transactions', 'Basic Budget', 'Basic Reports', 'Learning Challenges', 'Bill Reminders'],
    max_goals: 3,
    is_active: true,
    highlighted: false,
  },
  {
    id: '',
    tier_name: 'paid',
    display_name: 'Pro',
    monthly_price: '9',
    annual_price: '99',
    description: 'For serious financial planning',
    cta_text: 'Get Started',
    features: ['Free Features +', 'AI Recommendations', 'Split Transactions', 'Advanced Goals', 'Advanced Reports', 'Priority Support'],
    max_goals: 10,
    is_active: true,
    highlighted: true,
  },
  {
    id: '',
    tier_name: 'premium',
    display_name: 'Premium',
    monthly_price: '19',
    annual_price: '199',
    description: 'Complete financial management',
    cta_text: 'Get Started',
    features: ['Pro Features +', 'Net Worth Tracker', 'Advanced Investments', 'Retirement Planning', 'Financial Assistant', 'Expense Predictions', 'Stock Predictions'],
    max_goals: 10,
    is_active: true,
    highlighted: false,
  },
];

export default function PricingPage() {
  const { logActivity } = useAdmin();
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TierData[]>(DEFAULT_TIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newFeatureInputs, setNewFeatureInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('monthly_price');

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: TierData[] = data.map((tier) => ({
          id: tier.id,
          tier_name: tier.tier_name,
          display_name: tier.display_name,
          monthly_price: tier.monthly_price,
          annual_price: tier.annual_price,
          description: tier.description || '',
          cta_text: tier.cta_text || 'Get Started',
          features: Array.isArray(tier.features) ? tier.features : [],
          max_goals: tier.max_goals,
          is_active: tier.is_active,
          highlighted: tier.tier_name === 'paid',
        }));
        setTiers(mapped);
      }
    } catch (error) {
      console.error('Error loading tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTierField = (index: number, field: keyof TierData, value: string | number | boolean) => {
    setTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addFeature = (tierIndex: number) => {
    const key = tiers[tierIndex].tier_name;
    const featureText = newFeatureInputs[key]?.trim();
    if (!featureText) return;

    setTiers((prev) => {
      const updated = [...prev];
      updated[tierIndex] = {
        ...updated[tierIndex],
        features: [...updated[tierIndex].features, featureText],
      };
      return updated;
    });
    setNewFeatureInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const removeFeature = (tierIndex: number, featureIndex: number) => {
    setTiers((prev) => {
      const updated = [...prev];
      updated[tierIndex] = {
        ...updated[tierIndex],
        features: updated[tierIndex].features.filter((_, i) => i !== featureIndex),
      };
      return updated;
    });
  };

  const updateFeature = (tierIndex: number, featureIndex: number, value: string) => {
    setTiers((prev) => {
      const updated = [...prev];
      const features = [...updated[tierIndex].features];
      features[featureIndex] = value;
      updated[tierIndex] = { ...updated[tierIndex], features };
      return updated;
    });
  };

  const moveFeature = (tierIndex: number, featureIndex: number, direction: 'up' | 'down') => {
    setTiers((prev) => {
      const updated = [...prev];
      const features = [...updated[tierIndex].features];
      const newIndex = direction === 'up' ? featureIndex - 1 : featureIndex + 1;
      if (newIndex < 0 || newIndex >= features.length) return prev;
      [features[featureIndex], features[newIndex]] = [features[newIndex], features[featureIndex]];
      updated[tierIndex] = { ...updated[tierIndex], features };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      for (const tier of tiers) {
        if (!tier.id) continue;
        const { error } = await supabase
          .from('subscription_tiers')
          .update({
            display_name: tier.display_name,
            monthly_price: Number(tier.monthly_price),
            annual_price: Number(tier.annual_price),
            description: tier.description,
            cta_text: tier.cta_text,
            features: tier.features,
            max_goals: tier.max_goals,
            is_active: tier.is_active,
          })
          .eq('id', tier.id);

        if (error) throw error;
      }

      await logActivity('update_pricing_page', 'subscription_tiers', 'all');
      setSuccessMessage('Pricing page updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadTiers();
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert('Failed to save pricing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayPrice = (tier: TierData) => {
    const price = parseFloat(tier.monthly_price);
    if (price === 0) return '$0';
    return `$${price % 1 === 0 ? price.toFixed(0) : price}`;
  };

  const getDisplayPeriod = (tier: TierData) => {
    const price = parseFloat(tier.monthly_price);
    if (price === 0) return '/forever';
    return '/per month';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading pricing data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pricing Page</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage pricing plans displayed on the homepage
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {previewMode ? <Edit2 size={18} /> : <Eye size={18} />}
              <span>{previewMode ? 'Edit' : 'Preview'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {previewMode ? (
          <PricingPreview tiers={tiers} getDisplayPrice={getDisplayPrice} getDisplayPeriod={getDisplayPeriod} />
        ) : (
          <div className="space-y-8">
            {tiers.map((tier, tierIndex) => (
              <TierEditor
                key={tier.tier_name}
                tier={tier}
                tierIndex={tierIndex}
                newFeatureInput={newFeatureInputs[tier.tier_name] || ''}
                onNewFeatureInputChange={(val) =>
                  setNewFeatureInputs((prev) => ({ ...prev, [tier.tier_name]: val }))
                }
                onUpdateField={updateTierField}
                onAddFeature={addFeature}
                onRemoveFeature={removeFeature}
                onUpdateFeature={updateFeature}
                onMoveFeature={moveFeature}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TierEditor({
  tier,
  tierIndex,
  newFeatureInput,
  onNewFeatureInputChange,
  onUpdateField,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
  onMoveFeature,
}: {
  tier: TierData;
  tierIndex: number;
  newFeatureInput: string;
  onNewFeatureInputChange: (val: string) => void;
  onUpdateField: (index: number, field: keyof TierData, value: string | number | boolean) => void;
  onAddFeature: (tierIndex: number) => void;
  onRemoveFeature: (tierIndex: number, featureIndex: number) => void;
  onUpdateFeature: (tierIndex: number, featureIndex: number, value: string) => void;
  onMoveFeature: (tierIndex: number, featureIndex: number, direction: 'up' | 'down') => void;
}) {
  const tierColors: Record<string, string> = {
    free: 'border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-900',
    paid: 'border-blue-300 bg-blue-50',
    premium: 'border-slate-400 dark:border-gray-600 bg-slate-50 dark:bg-gray-900',
  };

  const tierLabels: Record<string, string> = {
    free: 'Free Tier',
    paid: 'Pro Tier',
    premium: 'Premium Tier',
  };

  return (
    <div className={`border-2 rounded-xl p-6 ${tierColors[tier.tier_name] || 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
          {tierLabels[tier.tier_name] || tier.tier_name}
        </h3>
        {tier.highlighted && (
          <span className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            <Star size={14} />
            <span>Highlighted</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
          <input
            type="text"
            value={tier.display_name}
            onChange={(e) => onUpdateField(tierIndex, 'display_name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Price ($)</label>
          <input
            type="text"
            value={tier.monthly_price}
            onChange={(e) => onUpdateField(tierIndex, 'monthly_price', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Annual Price ($)</label>
          <input
            type="text"
            value={tier.annual_price}
            onChange={(e) => onUpdateField(tierIndex, 'annual_price', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input
            type="text"
            value={tier.description}
            onChange={(e) => onUpdateField(tierIndex, 'description', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="e.g., Perfect for getting started"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
          <input
            type="text"
            value={tier.cta_text}
            onChange={(e) => onUpdateField(tierIndex, 'cta_text', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="e.g., Get Started"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
        <div className="space-y-2 mb-3">
          {tier.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center space-x-2 group">
              <div className="flex flex-col">
                <button
                  onClick={() => onMoveFeature(tierIndex, featureIndex, 'up')}
                  disabled={featureIndex === 0}
                  className="text-slate-400 hover:text-slate-600 disabled:opacity-30 p-0.5"
                >
                  <GripVertical size={12} />
                </button>
                <button
                  onClick={() => onMoveFeature(tierIndex, featureIndex, 'down')}
                  disabled={featureIndex === tier.features.length - 1}
                  className="text-slate-400 hover:text-slate-600 disabled:opacity-30 p-0.5"
                >
                  <GripVertical size={12} />
                </button>
              </div>
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <input
                type="text"
                value={feature}
                onChange={(e) => onUpdateFeature(tierIndex, featureIndex, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              />
              <button
                onClick={() => onRemoveFeature(tierIndex, featureIndex)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newFeatureInput}
            onChange={(e) => onNewFeatureInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddFeature(tierIndex);
              }
            }}
            className="flex-1 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            placeholder="Type a feature and press Enter or click Add"
          />
          <button
            onClick={() => onAddFeature(tierIndex)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingPreview({
  tiers,
  getDisplayPrice,
  getDisplayPeriod,
}: {
  tiers: TierData[];
  getDisplayPrice: (tier: TierData) => string;
  getDisplayPeriod: (tier: TierData) => string;
}) {
  return (
    <div className="py-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Choose the plan that's right for you</h2>
        <p className="text-lg text-slate-600 mt-2">Start free and upgrade as you grow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers
          .filter((t) => t.is_active)
          .map((tier) => {
            const isHighlighted = tier.highlighted;
            return (
              <div
                key={tier.tier_name}
                className={`rounded-2xl p-6 flex flex-col ${
                  isHighlighted
                    ? 'bg-blue-600 text-white shadow-xl scale-105 border-2 border-blue-600'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-3 ${
                    isHighlighted ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {tier.display_name}
                </h3>
                <div className="mb-3">
                  <span
                    className={`text-4xl font-bold ${
                      isHighlighted ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {getDisplayPrice(tier)}
                  </span>
                  <span
                    className={`text-base ml-1 ${
                      isHighlighted ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {getDisplayPeriod(tier)}
                  </span>
                </div>
                <p
                  className={`text-sm mb-5 ${
                    isHighlighted ? 'text-blue-100' : 'text-slate-600'
                  }`}
                >
                  {tier.description}
                </p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className={`flex-shrink-0 mt-0.5 ${
                          isHighlighted ? 'text-blue-200' : 'text-green-500'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isHighlighted ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    isHighlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {tier.cta_text}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
