import { useState } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { updateSystemSetting } from '../../lib/adminHelpers';

const OPENAI_MODELS = [
  // GPT-4o family
  { value: 'gpt-4o',                label: 'GPT-4o',                description: 'Latest flagship - fast, intelligent, multimodal' },
  { value: 'gpt-4o-mini',           label: 'GPT-4o Mini',           description: 'Small, fast, and affordable' },
  { value: 'gpt-4o-2024-11-20',     label: 'GPT-4o (Nov 2024)',     description: 'Snapshot: creative writing improvements' },
  { value: 'gpt-4o-2024-08-06',     label: 'GPT-4o (Aug 2024)',     description: 'Snapshot: structured outputs support' },
  { value: 'chatgpt-4o-latest',     label: 'ChatGPT-4o Latest',     description: 'Dynamic model used in ChatGPT' },
  // GPT-4.1 family
  { value: 'gpt-4.1',               label: 'GPT-4.1',               description: 'Latest GPT-4.1 - improved coding & instruction following' },
  { value: 'gpt-4.1-mini',          label: 'GPT-4.1 Mini',          description: 'Fast and cost-efficient GPT-4.1' },
  { value: 'gpt-4.1-nano',          label: 'GPT-4.1 Nano',          description: 'Smallest and fastest GPT-4.1 model' },
  // GPT-4 family
  { value: 'gpt-4-turbo',           label: 'GPT-4 Turbo',           description: 'Previous flagship with vision capabilities' },
  { value: 'gpt-4',                 label: 'GPT-4',                 description: 'Standard GPT-4 model' },
  { value: 'gpt-3.5-turbo',         label: 'GPT-3.5 Turbo',        description: 'Fast and cost-effective' },
  // o3 family
  { value: 'o3',                    label: 'o3',                    description: 'Most powerful reasoning model' },
  { value: 'o3-mini',               label: 'o3-mini',               description: 'Fast, flexible, intelligent reasoning' },
  { value: 'o3-mini-high',          label: 'o3-mini (high)',        description: 'o3-mini with high reasoning effort' },
  // o4 family
  { value: 'o4-mini',               label: 'o4-mini',               description: 'Fast, affordable reasoning model' },
  { value: 'o4-mini-high',          label: 'o4-mini (high)',        description: 'o4-mini with high reasoning effort' },
  // o1 family
  { value: 'o1',                    label: 'o1',                    description: 'Reasoning model for complex tasks' },
  { value: 'o1-mini',               label: 'o1-mini',               description: 'Fast reasoning model' },
  { value: 'o1-preview',            label: 'o1-preview',            description: 'Reasoning model preview' },
];

interface OpenAITabProps {
  settings: any[];
  editingValues: Record<string, string>;
  setEditingValues: (values: Record<string, string>) => void;
  canEdit: boolean;
  onReload: () => void;
}

export default function OpenAITab({ settings, editingValues, setEditingValues, canEdit, onReload }: OpenAITabProps) {
  const { user } = useAuth();
  const { logActivity } = useAdmin();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const getSettingByKey = (key: string) => settings.find((s) => s.setting_key === key);

  const handleSave = async (settingKey: string) => {
    if (!user || !canEdit) return;
    const trimmedValue = (editingValues[settingKey] || '').trim();
    setSavingKey(settingKey);
    try {
      await updateSystemSetting(settingKey, trimmedValue, user.id);
      setEditingValues({ ...editingValues, [settingKey]: trimmedValue });
      await logActivity('update_system_setting', 'system_setting', settingKey, { key: settingKey });
      setSavedKey(settingKey);
      setTimeout(() => setSavedKey(null), 2000);
      onReload();
    } catch (error) {
      console.error('Error saving setting:', error);
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConnectionStatus({ success: false, message: 'Not authenticated. Please log in again.' });
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-openai-connection`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        const detail = result.details ? ` (${result.details})` : '';
        setConnectionStatus({ success: false, message: (result.error || 'Connection test failed.') + detail });
        return;
      }

      setConnectionStatus({ success: result.success, message: result.message });
    } catch (error) {
      setConnectionStatus({ success: false, message: 'Network error. Could not reach the server.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const renderField = (key: string, label: string) => {
    const setting = getSettingByKey(key);
    if (!setting) return null;

    const value = editingValues[key] || '';
    const isVisible = showSensitive[key];
    const isSaving = savingKey === key;
    const isSaved = savedKey === key;

    return (
      <div className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-slate-900 text-sm">{label}</h4>
              {setting.is_sensitive && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
                  Sensitive
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{setting.description}</p>
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap ml-4">
            Updated {new Date(setting.updated_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-3">
          <div className="flex-1 relative">
            {setting.setting_type === 'feature_flag' ? (
              <select
                value={value}
                onChange={(e) => setEditingValues({ ...editingValues, [key]: e.target.value })}
                disabled={!canEdit}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 text-sm bg-white"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            ) : (
              <div className="flex items-center">
                <input
                  type={setting.is_sensitive && !isVisible ? 'password' : 'text'}
                  value={value}
                  onChange={(e) => setEditingValues({ ...editingValues, [key]: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 text-sm font-mono"
                  placeholder={`Enter ${setting.setting_key.replace(/_/g, ' ')}`}
                />
                {setting.is_sensitive && (
                  <button
                    onClick={() => setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="ml-2 p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => handleSave(key)}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderModelField = () => {
    const setting = getSettingByKey('openai_model');
    if (!setting) return null;

    const value = editingValues['openai_model'] || '';
    const isSaving = savingKey === 'openai_model';
    const isSaved = savedKey === 'openai_model';
    const selectedModel = OPENAI_MODELS.find(m => m.value === value);

    return (
      <div className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h4 className="font-medium text-slate-900 text-sm">Model</h4>
            <p className="text-sm text-slate-500 mt-0.5">{setting.description}</p>
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap ml-4">
            Updated {new Date(setting.updated_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-3">
          <div className="flex-1 relative">
            <select
              value={value}
              onChange={(e) => setEditingValues({ ...editingValues, openai_model: e.target.value })}
              disabled={!canEdit}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 text-sm bg-white appearance-none pr-10"
            >
              <option value="">Select a model</option>
              {OPENAI_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.description}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {canEdit && (
            <button
              onClick={() => handleSave('openai_model')}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderField('openai_api_key', 'API Key')}
      {renderModelField()}
      {renderField('openai_temperature', 'Temperature')}

      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Connection Test</h4>
        <p className="text-sm text-slate-500 mb-4">
          Verify your OpenAI API key is valid and the configured model is accessible.
        </p>
        <div className="flex items-center flex-wrap gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection || !canEdit}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm"
          >
            {testingConnection ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Test Connection</span>
              </>
            )}
          </button>
          {connectionStatus && (
            <div className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-lg ${
              connectionStatus.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {connectionStatus.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{connectionStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
