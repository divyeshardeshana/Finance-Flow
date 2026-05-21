import { useState, useEffect } from 'react';
import { Settings, Search, Save, AlertCircle, CheckCircle, Hash, Image, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';

interface Feature {
  id: string;
  feature_name: string;
  display_name: string;
  description: string;
  category: string;
  is_active: boolean;
  image_url: string | null;
}

interface Tier {
  id: string;
  tier_name: string;
  display_name: string;
}

interface TierConfig {
  enabled: boolean;
  prompt_limit: number | null;
}

interface FeatureConfig {
  [featureName: string]: {
    [tierId: string]: TierConfig;
  };
}

export default function FeatureManagement() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig>({});
  const [featureImages, setFeatureImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { logActivity } = useAdmin();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featuresRes, tiersRes, configRes] = await Promise.all([
        supabase
          .from('app_features')
          .select('*')
          .eq('is_active', true)
          .order('category, sort_order'),
        supabase
          .from('subscription_tiers')
          .select('id, tier_name, display_name')
          .eq('is_active', true)
          .order('monthly_price'),
        supabase
          .from('feature_tier_config')
          .select('feature_name, tier_id, is_enabled, prompt_limit')
      ]);

      if (featuresRes.data) {
        setFeatures(featuresRes.data);
        const imgMap: Record<string, string> = {};
        featuresRes.data.forEach(f => {
          if (f.image_url) imgMap[f.feature_name] = f.image_url;
        });
        setFeatureImages(imgMap);
      }
      if (tiersRes.data) setTiers(tiersRes.data);

      if (configRes.data) {
        const configMap: FeatureConfig = {};
        configRes.data.forEach((item) => {
          if (!configMap[item.feature_name]) {
            configMap[item.feature_name] = {};
          }
          configMap[item.feature_name][item.tier_id] = {
            enabled: item.is_enabled,
            prompt_limit: item.prompt_limit ?? null,
          };
        });
        setFeatureConfig(configMap);
      }
    } catch (error) {
      console.error('Error loading feature data:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load feature data' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (featureName: string, tierId: string) => {
    setFeatureConfig(prev => ({
      ...prev,
      [featureName]: {
        ...prev[featureName],
        [tierId]: {
          enabled: !prev[featureName]?.[tierId]?.enabled,
          prompt_limit: prev[featureName]?.[tierId]?.prompt_limit ?? null,
        },
      },
    }));
  };

  const setPromptLimit = (featureName: string, tierId: string, value: string) => {
    const parsed = value === '' ? null : parseInt(value, 10);
    const limit = parsed !== null && !isNaN(parsed) && parsed > 0 ? parsed : null;
    setFeatureConfig(prev => ({
      ...prev,
      [featureName]: {
        ...prev[featureName],
        [tierId]: {
          enabled: prev[featureName]?.[tierId]?.enabled ?? false,
          prompt_limit: limit,
        },
      },
    }));
  };

  const updateImageUrl = (featureName: string, url: string) => {
    setFeatureImages(prev => ({ ...prev, [featureName]: url }));
  };

  const saveChanges = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      // Save tier configs
      const updates = [];
      for (const featureName in featureConfig) {
        for (const tierId in featureConfig[featureName]) {
          const cfg = featureConfig[featureName][tierId];
          updates.push({
            feature_name: featureName,
            tier_id: tierId,
            is_enabled: cfg.enabled,
            prompt_limit: cfg.prompt_limit,
          });
        }
      }

      if (updates.length > 0) {
        const { error: configError } = await supabase
          .from('feature_tier_config')
          .upsert(updates, { onConflict: 'feature_name,tier_id' });
        if (configError) throw configError;
      }

      // Save image URLs for each feature that changed
      for (const feature of features) {
        const newUrl = featureImages[feature.feature_name] ?? null;
        const currentUrl = feature.image_url ?? null;
        const normalizedNew = newUrl === '' ? null : newUrl;
        if (normalizedNew !== currentUrl) {
          const { error: imgError } = await supabase
            .from('app_features')
            .update({ image_url: normalizedNew })
            .eq('feature_name', feature.feature_name);
          if (imgError) throw imgError;
        }
      }

      await logActivity('update_feature_config', 'feature_tier_config', null, {
        updated_count: updates.length
      });

      setSaveMessage({ type: 'success', text: 'Feature configuration saved successfully!' });
      setTimeout(() => setSaveMessage(null), 5000);
      await loadData();
    } catch (error: unknown) {
      console.error('Error saving feature config:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setSaveMessage({ type: 'error', text: `Failed to save: ${msg}` });
    } finally {
      setSaving(false);
    }
  };

  const categories = ['all', ...new Set(features.map(f => f.category))];
  const filteredFeatures = features.filter(f => {
    const matchesSearch = f.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFeatures: Record<string, Feature[]> = {};
  filteredFeatures.forEach(feature => {
    if (!groupedFeatures[feature.category]) {
      groupedFeatures[feature.category] = [];
    }
    groupedFeatures[feature.category].push(feature);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Feature Management</h2>
          <p className="text-slate-600 mt-1">Configure which features are available for each subscription tier</p>
        </div>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          saveMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className={saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {saveMessage.text}
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading features...
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                  {category}
                </h3>
                <div className="space-y-4">
                  {categoryFeatures.map(feature => {
                    const imageUrl = featureImages[feature.feature_name] ?? '';
                    return (
                      <div key={feature.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex gap-4 mb-3">
                          {/* Image preview */}
                          <div className="flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={feature.display_name}
                                className="w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center"
                              style={{ display: imageUrl ? 'none' : 'flex' }}
                            >
                              <Image className="w-6 h-6 text-slate-300" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900">{feature.display_name}</h4>
                            <p className="text-sm text-slate-600 mt-0.5">{feature.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5">ID: {feature.feature_name}</p>
                            {/* Image URL input */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="relative flex-1">
                                <Image className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                  type="url"
                                  placeholder="Image URL (e.g. https://images.pexels.com/...)"
                                  value={imageUrl}
                                  onChange={(e) => updateImageUrl(feature.feature_name, e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                                />
                              </div>
                              {imageUrl && (
                                <a
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Preview image"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-start gap-3">
                          {tiers.map(tier => {
                            const cfg = featureConfig[feature.feature_name]?.[tier.id];
                            const isEnabled = cfg?.enabled ?? false;
                            const promptLimit = cfg?.prompt_limit ?? null;
                            return (
                              <div
                                key={tier.id}
                                className={`flex flex-col gap-2 px-4 py-3 bg-white border rounded-lg transition-colors min-w-[140px] ${
                                  isEnabled ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300'
                                }`}
                              >
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => toggleFeature(feature.feature_name, tier.id)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-slate-700 capitalize">{tier.display_name}</span>
                                </label>
                                {isEnabled && feature.feature_name === 'financial_assistant' && (
                                  <div className="flex items-center gap-1.5">
                                    <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="Unlimited"
                                      value={promptLimit ?? ''}
                                      onChange={(e) => setPromptLimit(feature.feature_name, tier.id, e.target.value)}
                                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none placeholder-slate-400 text-slate-700"
                                      title="Monthly prompt limit (leave blank for unlimited)"
                                    />
                                  </div>
                                )}
                                {isEnabled && feature.feature_name === 'financial_assistant' && (
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    {promptLimit ? `${promptLimit} prompts/month` : 'Unlimited prompts'}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">About Feature Images</p>
            <p className="text-xs text-blue-700 mt-1">
              Images are displayed on the public Features page and in the app. Use direct image URLs from sources like Pexels (https://images.pexels.com/photos/...). Images should be at least 400x400px for best quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
