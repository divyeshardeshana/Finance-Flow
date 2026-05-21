import { useState, useEffect, useRef } from 'react';
import { Search, Pencil, X, Save, CheckCircle, Globe, TrendingUp, Filter, Upload, Download, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { countries } from '../../lib/countries';

interface CountryPlan {
  id?: string;
  country_code: string;
  plan_1_name: string;
  plan_1_description: string;
  plan_2_name: string;
  plan_2_description: string;
  plan_3_name: string;
  plan_3_description: string;
  plan_4_name: string;
  plan_4_description: string;
  plan_5_name: string;
  plan_5_description: string;
}

interface ImportResult {
  success: number;
  errors: string[];
}

const EMPTY_PLAN: Omit<CountryPlan, 'country_code'> = {
  plan_1_name: '',
  plan_1_description: '',
  plan_2_name: '',
  plan_2_description: '',
  plan_3_name: '',
  plan_3_description: '',
  plan_4_name: '',
  plan_4_description: '',
  plan_5_name: '',
  plan_5_description: '',
};

const PLAN_LABELS = [
  'Plan 1 (Primary / State)',
  'Plan 2 (Occupational / Mandatory)',
  'Plan 3 (Private / Voluntary)',
  'Plan 4',
  'Plan 5',
];

const CSV_HEADERS = [
  'country_code',
  'plan_1_name',
  'plan_1_description',
  'plan_2_name',
  'plan_2_description',
  'plan_3_name',
  'plan_3_description',
  'plan_4_name',
  'plan_4_description',
  'plan_5_name',
  'plan_5_description',
];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let inQuote = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        cols.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current);
    rows.push(cols);
  }
  return rows;
}

export default function InvestmentManagement() {
  const [plans, setPlans] = useState<Record<string, CountryPlan>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'configured' | 'unconfigured'>('all');
  const [editingCountry, setEditingCountry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CountryPlan | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from('country_investment_plans').select('*');
    if (data) {
      const map: Record<string, CountryPlan> = {};
      data.forEach((row: CountryPlan) => {
        map[row.country_code] = row;
      });
      setPlans(map);
    }
    setLoading(false);
  };

  const startEdit = (countryCode: string) => {
    const existing = plans[countryCode];
    setEditForm(
      existing
        ? { ...existing }
        : { country_code: countryCode, ...EMPTY_PLAN }
    );
    setEditingCountry(countryCode);
  };

  const cancelEdit = () => {
    setEditingCountry(null);
    setEditForm(null);
  };

  const updateField = (field: keyof CountryPlan, value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const savePlan = async () => {
    if (!editForm || !user) return;
    setSaving(true);

    const payload = {
      country_code: editForm.country_code,
      plan_1_name: editForm.plan_1_name,
      plan_1_description: editForm.plan_1_description,
      plan_2_name: editForm.plan_2_name,
      plan_2_description: editForm.plan_2_description,
      plan_3_name: editForm.plan_3_name,
      plan_3_description: editForm.plan_3_description,
      plan_4_name: editForm.plan_4_name,
      plan_4_description: editForm.plan_4_description,
      plan_5_name: editForm.plan_5_name,
      plan_5_description: editForm.plan_5_description,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('country_investment_plans')
      .upsert(payload, { onConflict: 'country_code' });

    if (!error) {
      await fetchPlans();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      cancelEdit();
    }
    setSaving(false);
  };

  const getPlanSummary = (plan: CountryPlan) => {
    const names = [
      plan.plan_1_name,
      plan.plan_2_name,
      plan.plan_3_name,
      plan.plan_4_name,
      plan.plan_5_name,
    ].filter(Boolean);
    return names.length;
  };

  const downloadTemplate = () => {
    const header = CSV_HEADERS.join(',');
    const example = [
      'US',
      'Government Bonds / Index Funds',
      'Low-risk government-backed bonds and broad market index funds',
      'Employer-Sponsored Plan',
      'Employer-matched investment accounts',
      'Stocks / ETFs',
      'Higher-risk equity investments for long-term growth',
      'Real Estate Investment Trusts',
      'Diversified property investment funds',
      'Cryptocurrency / Alternative Assets',
      'High-risk digital assets and alternative investments',
    ]
      .map((v) => `"${v}"`)
      .join(',');
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investment_plans_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processCSV = async (text: string) => {
    if (!user) return;
    setImporting(true);
    setImportResult(null);

    const rows = parseCSV(text);
    if (rows.length === 0) {
      setImportResult({ success: 0, errors: ['CSV file is empty.'] });
      setImporting(false);
      return;
    }

    const firstRow = rows[0].map((h) => h.trim().toLowerCase());
    const hasHeader = firstRow[0] === 'country_code';
    const dataRows = hasHeader ? rows.slice(1) : rows;

    const validCountryCodes = new Set(countries.map((c) => c.code.toUpperCase()));
    const errors: string[] = [];
    const payloads: object[] = [];

    dataRows.forEach((cols, idx) => {
      const rowNum = hasHeader ? idx + 2 : idx + 1;
      if (cols.length < 1 || !cols[0].trim()) {
        errors.push(`Row ${rowNum}: Missing country_code.`);
        return;
      }
      const countryCode = cols[0].trim().toUpperCase();
      if (!validCountryCodes.has(countryCode)) {
        errors.push(`Row ${rowNum}: Unknown country code "${countryCode}".`);
        return;
      }
      payloads.push({
        country_code: countryCode,
        plan_1_name: (cols[1] || '').trim(),
        plan_1_description: (cols[2] || '').trim(),
        plan_2_name: (cols[3] || '').trim(),
        plan_2_description: (cols[4] || '').trim(),
        plan_3_name: (cols[5] || '').trim(),
        plan_3_description: (cols[6] || '').trim(),
        plan_4_name: (cols[7] || '').trim(),
        plan_4_description: (cols[8] || '').trim(),
        plan_5_name: (cols[9] || '').trim(),
        plan_5_description: (cols[10] || '').trim(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
    });

    let successCount = 0;
    for (const payload of payloads) {
      const { error } = await supabase
        .from('country_investment_plans')
        .upsert(payload, { onConflict: 'country_code' });
      if (error) {
        errors.push(`Failed to save ${(payload as { country_code: string }).country_code}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    await fetchPlans();
    setImportResult({ success: successCount, errors });
    setImporting(false);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setImportResult({ success: 0, errors: ['Please upload a .csv file.'] });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const openImportModal = () => {
    setImportResult(null);
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportResult(null);
  };

  const configuredCount = Object.keys(plans).length;
  const unconfiguredCount = countries.length - configuredCount;

  const filteredCountries = countries.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const hasPlan = !!plans[c.code] && getPlanSummary(plans[c.code]) > 0;
    if (filter === 'configured') return matchesSearch && hasPlan;
    if (filter === 'unconfigured') return matchesSearch && !hasPlan;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">
            Investment Management
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            Configure up to 5 investment plan options per country. These plans are shown to users based on their country.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {savedSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200/60 dark:border-emerald-500/20 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">Saved successfully</span>
            </div>
          )}
          <button
            onClick={openImportModal}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 rounded-xl shadow-sm shadow-teal-500/25 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-200/80 dark:border-white/[0.07]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.07] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {(['all', 'configured', 'unconfigured'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    filter === f
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {f === 'all'
                    ? `All (${countries.length})`
                    : f === 'configured'
                    ? `Configured (${configuredCount})`
                    : `Unconfigured (${unconfiguredCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/80 dark:border-white/[0.07]">
                  <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 w-[180px]">
                    Country
                  </th>
                  {PLAN_LABELS.map((label) => (
                    <th key={label} className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 min-w-[140px]">
                      {label}
                    </th>
                  ))}
                  <th className="text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3 w-[80px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {filteredCountries.map((country) => {
                  const plan = plans[country.code];
                  const configuredCount = plan ? getPlanSummary(plan) : 0;

                  return (
                    <tr key={country.code} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3.5 h-3.5 text-teal-500" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{country.name}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">{country.code}</p>
                          </div>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const name = plan?.[`plan_${n}_name` as keyof CountryPlan] as string || '';
                        return (
                          <td key={n} className="px-4 py-3.5">
                            {name ? (
                              <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{name}</span>
                            ) : (
                              <span className="text-[12px] text-gray-300 dark:text-gray-700">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {configuredCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                              {configuredCount}/5
                            </span>
                          )}
                          <button
                            onClick={() => startEdit(country.code)}
                            className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/[0.08] text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
                            title="Edit plans"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingCountry && editForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f1219] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200/80 dark:border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5 text-teal-500" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">
                    {countries.find(c => c.code === editingCountry)?.name}
                  </h2>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">Configure investment plan options</p>
                </div>
              </div>
              <button
                onClick={cancelEdit}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.05] rounded-xl p-4 space-y-3">
                  <h3 className="text-[12px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {PLAN_LABELS[n - 1]}
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={editForm[`plan_${n}_name` as keyof CountryPlan] as string}
                        onChange={(e) => updateField(`plan_${n}_name` as keyof CountryPlan, e.target.value)}
                        placeholder={`e.g. ${n === 1 ? 'Government Bonds / Index Funds' : n === 2 ? 'Employer-Sponsored Plan' : n === 3 ? 'Stocks / ETFs' : `Optional Plan ${n}`}`}
                        className="w-full px-3 py-2 text-[13px] bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.07] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/60 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Description</label>
                      <textarea
                        value={editForm[`plan_${n}_description` as keyof CountryPlan] as string}
                        onChange={(e) => updateField(`plan_${n}_description` as keyof CountryPlan, e.target.value)}
                        placeholder="Briefly describe this investment plan option..."
                        rows={2}
                        className="w-full px-3 py-2 text-[13px] bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.07] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/60 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200/80 dark:border-white/[0.07] flex-shrink-0">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/80 dark:border-white/[0.07] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 rounded-xl shadow-sm shadow-teal-500/25 disabled:opacity-50 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Plans'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f1219] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200/80 dark:border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/[0.15] flex items-center justify-center">
                  <Upload className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Import CSV</h2>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">Bulk import investment plans by country</p>
                </div>
              </div>
              <button
                onClick={closeImportModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.05] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Required CSV columns</p>
                    <div className="flex flex-wrap gap-1">
                      {CSV_HEADERS.map((h) => (
                        <span key={h} className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-gray-200/70 dark:bg-white/[0.07] text-gray-600 dark:text-gray-400">
                          {h}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-2">
                      Use valid ISO country codes (e.g. US, GB, IN). Existing records will be updated.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/[0.08] border border-teal-200/60 dark:border-teal-500/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-500/[0.12] transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template CSV
              </button>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/[0.06]'
                    : 'border-gray-200 dark:border-white/[0.08] hover:border-teal-400 dark:hover:border-teal-500/40 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                {importing ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Importing...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                      Drop CSV file here or click to browse
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600">.csv files only</p>
                  </div>
                )}
              </div>

              {importResult && (
                <div className="space-y-3">
                  {importResult.success > 0 && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200/60 dark:border-emerald-500/20 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {importResult.success} {importResult.success === 1 ? 'record' : 'records'} imported successfully
                      </p>
                    </div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-500/[0.08] border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                          {importResult.errors.length} {importResult.errors.length === 1 ? 'error' : 'errors'}
                        </p>
                      </div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <li key={i} className="text-[11px] text-red-600 dark:text-red-400">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200/80 dark:border-white/[0.07]">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/80 dark:border-white/[0.07] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
