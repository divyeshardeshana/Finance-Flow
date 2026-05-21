import { useEffect, useState, useCallback } from 'react';
import {
  Database,
  Users,
  ArrowDownToLine,
  Receipt,
  Wallet,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SystemOverview {
  users: number;
  transactions: number;
  budgets: number;
  savingsGoals: number;
  settings: number;
  dbSizeEstimate: string;
}

interface BackupRecord {
  id: string;
  backup_name: string;
  backup_type: string;
  status: string;
  file_size_bytes: number;
  record_count: number;
  created_at: string;
  completed_at: string | null;
}

type BackupType = 'full' | 'users' | 'transactions' | 'financial';

const BACKUP_TYPES: { id: BackupType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'full', label: 'Full System', icon: <Database size={22} />, description: 'All data' },
  { id: 'users', label: 'Users Only', icon: <Users size={22} />, description: 'User profiles & settings' },
  { id: 'transactions', label: 'Transactions', icon: <Receipt size={22} />, description: 'Transactions & recurring' },
  { id: 'financial', label: 'Financial Data', icon: <Wallet size={22} />, description: 'Budgets, goals, assets' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function BackupTab() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [selectedType, setSelectedType] = useState<BackupType>('full');
  const [creating, setCreating] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const [
        { count: usersCount },
        { count: txCount },
        { count: budgetsCount },
        { count: goalsCount },
        { count: settingsCount },
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('budgets').select('*', { count: 'exact', head: true }),
        supabase.from('savings_goals').select('*', { count: 'exact', head: true }),
        supabase.from('system_settings').select('*', { count: 'exact', head: true }),
      ]);

      const totalRecords = (usersCount || 0) + (txCount || 0) + (budgetsCount || 0) + (goalsCount || 0) + (settingsCount || 0);
      const estimatedBytes = totalRecords * 512;
      const dbSize = estimatedBytes > 1024 * 1024
        ? (estimatedBytes / (1024 * 1024)).toFixed(1) + ' MB'
        : (estimatedBytes / 1024).toFixed(1) + ' KB';

      setOverview({
        users: usersCount || 0,
        transactions: txCount || 0,
        budgets: budgetsCount || 0,
        savingsGoals: goalsCount || 0,
        settings: settingsCount || 0,
        dbSizeEstimate: dbSize,
      });
    } catch (error) {
      console.error('Error loading overview:', error);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadBackupHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('system_backups')
        .select('id, backup_name, backup_type, status, file_size_bytes, record_count, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(20);
      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadBackupHistory();
  }, [loadOverview, loadBackupHistory]);

  const collectBackupData = async (type: BackupType) => {
    const data: Record<string, unknown[]> = {};

    if (type === 'full' || type === 'users') {
      const { data: profiles } = await supabase.from('user_profiles').select('*');
      data.user_profiles = profiles || [];
    }

    if (type === 'full' || type === 'transactions') {
      const [{ data: txs }, { data: recurring }] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('recurring_transactions').select('*'),
      ]);
      data.transactions = txs || [];
      data.recurring_transactions = recurring || [];
    }

    if (type === 'full' || type === 'financial') {
      const [
        { data: budgets },
        { data: goals },
        { data: assets },
        { data: liabilities },
        { data: categories },
      ] = await Promise.all([
        supabase.from('budgets').select('*'),
        supabase.from('savings_goals').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('liabilities').select('*'),
        supabase.from('categories').select('*'),
      ]);
      data.budgets = budgets || [];
      data.savings_goals = goals || [];
      data.assets = assets || [];
      data.liabilities = liabilities || [];
      data.categories = categories || [];
    }

    if (type === 'full') {
      const [
        { data: settings },
        { data: subscriptions },
        { data: bills },
      ] = await Promise.all([
        supabase.from('system_settings').select('*'),
        supabase.from('user_subscriptions').select('*'),
        supabase.from('bill_reminders').select('*'),
      ]);
      data.system_settings = settings || [];
      data.user_subscriptions = subscriptions || [];
      data.bill_reminders = bills || [];
    }

    return data;
  };

  const handleCreateBackup = async () => {
    if (!user) return;
    setCreating(true);

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const typeLabel = BACKUP_TYPES.find(t => t.id === selectedType)?.label || selectedType;
      const backupName = `${selectedType}_backup_${dateStr}`;

      const { data: record, error: insertError } = await supabase
        .from('system_backups')
        .insert({
          backup_name: backupName,
          backup_type: selectedType,
          status: 'in_progress',
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError || !record) throw insertError;

      const backupData = await collectBackupData(selectedType);
      const jsonString = JSON.stringify(backupData, null, 2);
      const sizeBytes = new Blob([jsonString]).size;
      const totalRecords = Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0);

      await supabase
        .from('system_backups')
        .update({
          status: 'completed',
          backup_data: backupData,
          file_size_bytes: sizeBytes,
          record_count: totalRecords,
          completed_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await loadBackupHistory();
    } catch (error) {
      console.error('Backup creation failed:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (backup: BackupRecord) => {
    supabase
      .from('system_backups')
      .select('backup_data')
      .eq('id', backup.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.backup_data) return;
        const jsonString = JSON.stringify(data.backup_data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${backup.backup_name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from('system_backups').delete().eq('id', id);
      setBackups(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting backup:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const typeLabel = BACKUP_TYPES.find(t => t.id === selectedType)?.label || 'Full';

  const overviewStats = overview
    ? [
        { label: 'Users', value: overview.users, color: 'text-blue-600' },
        { label: 'Transactions', value: overview.transactions, color: 'text-emerald-600' },
        { label: 'Budgets', value: overview.budgets, color: 'text-orange-600' },
        { label: 'Savings Goals', value: overview.savingsGoals, color: 'text-red-500' },
        { label: 'Settings', value: overview.settings, color: 'text-teal-600' },
        { label: 'Est. DB Size', value: overview.dbSizeEstimate, color: 'text-rose-600', isString: true },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database size={18} className="text-slate-600 dark:text-gray-400" />
            <h3 className="text-md font-semibold text-slate-900 dark:text-white">System Overview</h3>
          </div>
          <button
            onClick={loadOverview}
            disabled={loadingOverview}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-gray-300 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors bg-white dark:bg-gray-700"
          >
            <RefreshCw size={12} className={loadingOverview ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
        {loadingOverview ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {overviewStats.map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                <div className={`text-xl font-bold ${stat.color}`}>
                  {stat.isString ? stat.value : Number(stat.value).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800">
        <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-2">Create New Backup</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">Select the type of data you want to back up</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {BACKUP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                selectedType === type.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-500 hover:bg-slate-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className={selectedType === type.id ? 'text-blue-600' : 'text-slate-400'}>
                {type.icon}
              </span>
              <span className="text-sm font-medium mt-2">{type.label}</span>
              <span className="text-xs opacity-70 mt-0.5">{type.description}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm"
        >
          {creating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating Backup...</span>
            </>
          ) : (
            <>
              <ArrowDownToLine size={16} />
              <span>Create {typeLabel} Backup</span>
            </>
          )}
        </button>
      </div>

      <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white">Backup History</h3>
          <button
            onClick={loadBackupHistory}
            disabled={loadingHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-gray-300 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors bg-white dark:bg-gray-700"
          >
            <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <HardDrive size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-gray-400">No backups yet. Create your first backup above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-100 dark:border-gray-700 hover:border-slate-200 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600">
                    <Database size={16} className="text-slate-500 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{backup.backup_name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      {new Date(backup.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {backup.file_size_bytes > 0 && ` \u2022 ${formatBytes(backup.file_size_bytes)}`}
                      {backup.record_count > 0 && ` \u2022 ${backup.record_count} records`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      backup.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : backup.status === 'failed'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {backup.status === 'completed' && <CheckCircle2 size={12} className="inline mr-1" />}
                    {backup.status === 'failed' && <XCircle size={12} className="inline mr-1" />}
                    {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                  </span>
                  {backup.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(backup)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(backup.id)}
                    disabled={deletingId === backup.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === backup.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
