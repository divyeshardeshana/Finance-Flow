import { useEffect, useState, useCallback } from 'react';
import { Search, Globe, CreditCard as Edit3, Save, X, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Eye, EyeOff, FileText, Hash, Image, Link, BarChart2, RefreshCw, Info, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SEOPage {
  id: string;
  page_key: string;
  page_name: string;
  page_path: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image_url: string;
  canonical_url: string;
  structured_data: object | null;
  is_indexable: boolean;
  priority: number;
  change_frequency: string;
  updated_at: string;
}

type TabKey = 'basic' | 'opengraph' | 'twitter' | 'technical';

const FREQ_OPTIONS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

function charCount(val: string, min: number, max: number) {
  const len = val.length;
  if (len === 0) return { color: 'text-gray-400', label: `0 / ${max}` };
  if (len < min) return { color: 'text-amber-500', label: `${len} / ${max} (min ${min})` };
  if (len > max) return { color: 'text-red-500', label: `${len} / ${max} (over limit)` };
  return { color: 'text-emerald-600', label: `${len} / ${max}` };
}

interface EditDrawerProps {
  page: SEOPage;
  onClose: () => void;
  onSaved: (updated: SEOPage) => void;
}

function EditDrawer({ page, onClose, onSaved }: EditDrawerProps) {
  const [form, setForm] = useState<SEOPage>({ ...page });
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [structuredDataText, setStructuredDataText] = useState(
    page.structured_data ? JSON.stringify(page.structured_data, null, 2) : ''
  );
  const [jsonError, setJsonError] = useState('');

  const set = (field: keyof SEOPage, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    let parsedStructured: object | null = null;
    if (structuredDataText.trim()) {
      try {
        parsedStructured = JSON.parse(structuredDataText);
        setJsonError('');
      } catch {
        setJsonError('Invalid JSON — please fix before saving.');
        return;
      }
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('seo_pages')
      .update({
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        meta_keywords: form.meta_keywords,
        og_title: form.og_title,
        og_description: form.og_description,
        og_image_url: form.og_image_url,
        twitter_title: form.twitter_title,
        twitter_description: form.twitter_description,
        twitter_image_url: form.twitter_image_url,
        canonical_url: form.canonical_url,
        structured_data: parsedStructured,
        is_indexable: form.is_indexable,
        priority: form.priority,
        change_frequency: form.change_frequency,
      })
      .eq('id', page.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('success');
      onSaved(data as SEOPage);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'basic', label: 'Basic SEO', icon: FileText },
    { key: 'opengraph', label: 'Open Graph', icon: Globe },
    { key: 'twitter', label: 'Twitter Card', icon: Hash },
    { key: 'technical', label: 'Technical', icon: BarChart2 },
  ];

  const titleStats = charCount(form.meta_title, 50, 60);
  const descStats = charCount(form.meta_description, 150, 160);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white dark:bg-[#0B0F1A] border-l border-gray-200 dark:border-white/[0.06] flex flex-col h-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#080C14]">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
              Editing SEO
            </p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{page.page_name}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{page.page_path}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0B0F1A] px-2 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'basic' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Page Title (meta title)
                  </label>
                  <span className={`text-xs font-medium ${titleStats.color}`}>{titleStats.label}</span>
                </div>
                <input
                  value={form.meta_title}
                  onChange={e => set('meta_title', e.target.value)}
                  placeholder="e.g. FinanceFlow AI — Smart Personal Finance App"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Recommended: 50–60 characters. Appears in browser tabs and search results.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Meta Description
                  </label>
                  <span className={`text-xs font-medium ${descStats.color}`}>{descStats.label}</span>
                </div>
                <textarea
                  value={form.meta_description}
                  onChange={e => set('meta_description', e.target.value)}
                  rows={3}
                  placeholder="e.g. Take control of your money with FinanceFlow AI..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Recommended: 150–160 characters. Shown in Google search result snippets.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Keywords
                </label>
                <textarea
                  value={form.meta_keywords}
                  onChange={e => set('meta_keywords', e.target.value)}
                  rows={3}
                  placeholder="personal finance app, budgeting app, AI financial assistant..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Comma-separated. Focus on 5–10 highly relevant keywords per page.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Canonical URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={form.canonical_url}
                    onChange={e => set('canonical_url', e.target.value)}
                    placeholder="https://app.financeflow.ai/about"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors font-mono text-xs"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Prevents duplicate content penalties. Leave blank to use the page's natural URL.</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Google Preview</p>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium leading-tight truncate">
                  {form.meta_title || 'Page Title'}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5 font-mono truncate">
                  {form.canonical_url || `https://app.financeflow.ai${page.page_path}`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {form.meta_description || 'No description set.'}
                </p>
              </div>
            </>
          )}

          {activeTab === 'opengraph' && (
            <>
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">Open Graph tags control how your page appears when shared on Facebook, LinkedIn, WhatsApp, and other platforms. Leave blank to inherit from Basic SEO.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">OG Title</label>
                <input
                  value={form.og_title}
                  onChange={e => set('og_title', e.target.value)}
                  placeholder="Leave blank to use meta title"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">OG Description</label>
                <textarea
                  value={form.og_description}
                  onChange={e => set('og_description', e.target.value)}
                  rows={3}
                  placeholder="Leave blank to use meta description"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">OG Image URL</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={form.og_image_url}
                    onChange={e => set('og_image_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors font-mono text-xs"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Recommended size: 1200×630px. Minimum: 600×315px.</p>
                {form.og_image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-white/[0.08] aspect-video">
                    <img src={form.og_image_url} alt="OG preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'twitter' && (
            <>
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">Twitter Card tags control how your page appears when shared on X (Twitter). Leave blank to inherit from Open Graph tags.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Twitter Title</label>
                <input
                  value={form.twitter_title}
                  onChange={e => set('twitter_title', e.target.value)}
                  placeholder="Leave blank to use OG title"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Twitter Description</label>
                <textarea
                  value={form.twitter_description}
                  onChange={e => set('twitter_description', e.target.value)}
                  rows={3}
                  placeholder="Leave blank to use OG description"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Twitter Image URL</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={form.twitter_image_url}
                    onChange={e => set('twitter_image_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors font-mono text-xs"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Recommended size: 1200×628px for summary_large_image card.</p>
              </div>
            </>
          )}

          {activeTab === 'technical' && (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Search Engine Indexing</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Controls the robots meta tag (index / noindex)</p>
                </div>
                <button
                  onClick={() => set('is_indexable', !form.is_indexable)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_indexable ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_indexable ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {form.is_indexable ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25">
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Visible to search engines — <code className="font-mono">index, follow</code></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25">
                  <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Hidden from search engines — <code className="font-mono">noindex, nofollow</code></span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Sitemap Priority</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={form.priority}
                    onChange={e => set('priority', parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">0.0 (low) to 1.0 (high)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Change Frequency</label>
                  <select
                    value={form.change_frequency}
                    onChange={e => set('change_frequency', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  >
                    {FREQ_OPTIONS.map(f => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">How often content changes</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Structured Data (JSON-LD)
                </label>
                <textarea
                  value={structuredDataText}
                  onChange={e => { setStructuredDataText(e.target.value); setJsonError(''); }}
                  rows={10}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Name"\n}'}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono border rounded-lg bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors resize-none ${jsonError ? 'border-red-400 dark:border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-white/[0.08] focus:border-blue-500 dark:focus:border-blue-400'}`}
                />
                {jsonError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {jsonError}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Schema.org structured data for rich search result snippets. Must be valid JSON.</p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#080C14] flex items-center justify-between gap-3 flex-shrink-0">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Save failed — please try again
            </div>
          )}
          {saveStatus === 'idle' && <div />}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 text-right">{value}/{max}</span>
    </div>
  );
}

function pageSeoScore(page: SEOPage): number {
  let score = 0;
  if (page.meta_title && page.meta_title.length >= 50 && page.meta_title.length <= 60) score += 25;
  else if (page.meta_title) score += 12;
  if (page.meta_description && page.meta_description.length >= 150 && page.meta_description.length <= 160) score += 25;
  else if (page.meta_description) score += 12;
  if (page.meta_keywords && page.meta_keywords.length > 10) score += 15;
  if (page.og_title || page.og_description) score += 15;
  if (page.og_image_url) score += 10;
  if (page.canonical_url) score += 5;
  if (page.structured_data) score += 5;
  return score;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">{score}</span>;
  if (score >= 50) return <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">{score}</span>;
  return <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">{score}</span>;
}

interface AddPageForm {
  page_key: string;
  page_name: string;
  page_path: string;
}

const EMPTY_ADD_FORM: AddPageForm = { page_key: '', page_name: '', page_path: '' };

function AddPageModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<AddPageForm>(EMPTY_ADD_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.page_key.trim()) { setError('Page key is required'); return; }
    if (!form.page_name.trim()) { setError('Page name is required'); return; }
    if (!form.page_path.trim()) { setError('Page path is required'); return; }

    setSaving(true);
    const { error: dbError } = await supabase.from('seo_pages').insert({
      page_key: form.page_key.trim().toLowerCase().replace(/\s+/g, '_'),
      page_name: form.page_name.trim(),
      page_path: form.page_path.trim().startsWith('/') ? form.page_path.trim() : `/${form.page_path.trim()}`,
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image_url: '',
      twitter_title: '',
      twitter_description: '',
      twitter_image_url: '',
      canonical_url: '',
      is_indexable: true,
      priority: 0.5,
      change_frequency: 'monthly',
    });
    setSaving(false);
    if (dbError) {
      setError(dbError.message.includes('unique') ? 'A page with this key already exists.' : dbError.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#0B0F1A] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/[0.08]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/[0.08]">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Register New Page</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add a page to SEO management</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Page Key *</label>
            <input
              value={form.page_key}
              onChange={e => setForm(f => ({ ...f, page_key: e.target.value }))}
              placeholder="e.g., admin_dashboard or my_new_page"
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">Unique identifier, lowercase with underscores.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Page Name *</label>
            <input
              value={form.page_name}
              onChange={e => setForm(f => ({ ...f, page_name: e.target.value }))}
              placeholder="e.g., Admin Dashboard"
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Page Path *</label>
            <input
              value={form.page_path}
              onChange={e => setForm(f => ({ ...f, page_path: e.target.value }))}
              placeholder="e.g., /admin/dashboard"
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">URL path starting with /</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">New admin nav pages are auto-seeded here when added to the codebase. Use this form for any additional custom pages.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#080C14]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SEOManagement() {
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showAddPage, setShowAddPage] = useState(false);

  const loadPages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('seo_pages').select('*').order('page_name');
    setPages((data as SEOPage[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const handleSaved = (updated: SEOPage) => {
    setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const filtered = pages.filter(p =>
    p.page_name.toLowerCase().includes(search.toLowerCase()) ||
    p.page_path.toLowerCase().includes(search.toLowerCase()) ||
    p.page_key.toLowerCase().includes(search.toLowerCase())
  );

  const totalScore = pages.length ? Math.round(pages.reduce((s, p) => s + pageSeoScore(p), 0) / pages.length) : 0;
  const fullyOptimized = pages.filter(p => pageSeoScore(p) >= 80).length;
  const needsWork = pages.filter(p => pageSeoScore(p) < 50).length;
  const indexableCount = pages.filter(p => p.is_indexable).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">SEO Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage page titles, meta descriptions, keywords, Open Graph tags, Twitter Cards, and structured data for every public page.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Average SEO Score', value: `${totalScore}/100`, sub: 'across all pages', icon: BarChart2, color: totalScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Fully Optimized', value: fullyOptimized, sub: `of ${pages.length} pages`, icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Needs Attention', value: needsWork, sub: 'pages below 50', icon: AlertCircle, color: needsWork > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400', bg: needsWork > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-gray-50 dark:bg-white/[0.03]' },
          { label: 'Indexed Pages', value: indexableCount, sub: `of ${pages.length} pages`, icon: Globe, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{card.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Pages SEO Configuration</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} pages — click Edit to configure each page</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-200 dark:border-white/[0.08] rounded-lg bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowAddPage(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(page => {
              const score = pageSeoScore(page);
              const isExpanded = expandedKey === page.page_key;
              const titleLen = page.meta_title.length;
              const descLen = page.meta_description.length;

              return (
                <div key={page.id} className="border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                    onClick={() => setExpandedKey(isExpanded ? null : page.page_key)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{page.page_name}</span>
                        {!page.is_indexable && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            <EyeOff className="w-3 h-3" />noindex
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{page.page_path}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
                      <span className={titleLen >= 50 && titleLen <= 60 ? 'text-emerald-600 dark:text-emerald-400' : titleLen > 0 ? 'text-amber-500' : 'text-gray-400'}>
                        Title: {titleLen}c
                      </span>
                      <span className={descLen >= 150 && descLen <= 160 ? 'text-emerald-600 dark:text-emerald-400' : descLen > 0 ? 'text-amber-500' : 'text-gray-400'}>
                        Desc: {descLen}c
                      </span>
                    </div>

                    <ScoreBadge score={score} />

                    <button
                      onClick={e => { e.stopPropagation(); setEditingPage(page); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 shadow-sm shadow-blue-600/20"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 bg-gray-50 dark:bg-[#080C14] border-t border-gray-100 dark:border-white/[0.04] space-y-4">
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SEO Score Breakdown</p>
                          <ScoreBar label="Title (0–25)" value={page.meta_title && page.meta_title.length >= 50 && page.meta_title.length <= 60 ? 25 : page.meta_title ? 12 : 0} max={25} color="bg-blue-500" />
                          <ScoreBar label="Description" value={page.meta_description && page.meta_description.length >= 150 && page.meta_description.length <= 160 ? 25 : page.meta_description ? 12 : 0} max={25} color="bg-blue-500" />
                          <ScoreBar label="Keywords" value={page.meta_keywords && page.meta_keywords.length > 10 ? 15 : 0} max={15} color="bg-teal-500" />
                          <ScoreBar label="Open Graph" value={(page.og_title || page.og_description) ? 15 : 0} max={15} color="bg-amber-500" />
                          <ScoreBar label="OG Image" value={page.og_image_url ? 10 : 0} max={10} color="bg-amber-500" />
                          <ScoreBar label="Canonical" value={page.canonical_url ? 5 : 0} max={5} color="bg-emerald-500" />
                          <ScoreBar label="Schema" value={page.structured_data ? 5 : 0} max={5} color="bg-emerald-500" />
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Values</p>
                          <div className="space-y-2">
                            {[
                              { label: 'Title', value: page.meta_title },
                              { label: 'Description', value: page.meta_description },
                              { label: 'Keywords', value: page.meta_keywords },
                              { label: 'OG Title', value: page.og_title },
                              { label: 'Canonical', value: page.canonical_url },
                            ].map(row => (
                              <div key={row.label}>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{row.label}: </span>
                                <span className={`text-xs ${row.value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600 italic'}`}>
                                  {row.value || 'Not set'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No pages found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editingPage && (
        <EditDrawer
          page={editingPage}
          onClose={() => setEditingPage(null)}
          onSaved={(updated) => { handleSaved(updated); setEditingPage(null); }}
        />
      )}

      {showAddPage && (
        <AddPageModal
          onClose={() => setShowAddPage(false)}
          onSaved={() => { setShowAddPage(false); loadPages(); }}
        />
      )}
    </div>
  );
}
