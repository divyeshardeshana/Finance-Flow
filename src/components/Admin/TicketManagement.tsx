import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Download,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Inbox,
  MessageSquare,
  X,
  User,
  Shield,
} from 'lucide-react';
import {
  getAllTickets,
  assignTicket,
  updateTicketStatus,
  replyToTicket,
  getTicketMessages,
  bulkUpdateTicketStatus,
  bulkAssignTickets,
  exportToCSV,
} from '../../lib/adminHelpers';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import TicketDetailPanel from './TicketDetailPanel';

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  open: { label: 'Open', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200', dotColor: 'bg-blue-50 dark:bg-blue-900/300' },
  waiting_response: { label: 'Awaiting Reply', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dotColor: 'bg-amber-500' },
  resolved: { label: 'Resolved', color: 'text-slate-600 dark:text-gray-400', bg: 'bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700', dotColor: 'bg-slate-400' },
  closed: { label: 'Closed', color: 'text-slate-500 dark:text-gray-400', bg: 'bg-slate-100 border-slate-300', dotColor: 'bg-slate-400' },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-700', bg: 'bg-red-50 border border-red-200' },
  high: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  medium: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
  low: { label: 'Low', color: 'text-sky-700', bg: 'bg-sky-50 border border-sky-200' },
};

export default function TicketManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 20;

  const { logActivity, hasPermission } = useAdmin();
  const { user } = useAuth();
  const canManage = hasPermission('manage_tickets');

  useEffect(() => {
    loadTickets();
  }, [currentPage, filterStatus, filterPriority]);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await getAllTickets(
        filterStatus,
        filterPriority,
        undefined,
        (currentPage - 1) * pageSize,
        pageSize
      );
      setTickets(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
      setTickets([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const all = tickets;
    return {
      open: all.filter((t) => t.status === 'open').length,
      inProgress: all.filter((t) => t.status === 'in_progress').length,
      awaiting: all.filter((t) => t.status === 'waiting_response').length,
      urgent: all.filter((t) => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.subject?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.user_profiles?.full_name?.toLowerCase().includes(q) ||
        t.user_name?.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  const loadTicketMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const messages = await getTicketMessages(ticketId);
      setTicketMessages(messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleTicketClick = async (ticket: any) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
  };

  const handleAssignToMe = async (ticketId: string) => {
    if (!user || !canManage) return;
    try {
      await assignTicket(ticketId, user.id);
      await logActivity('assign_ticket', 'support_ticket', ticketId);
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, assigned_admin_id: user.id });
      }
    } catch (err) {
      console.error('Error assigning ticket:', err);
    }
  };

  const getTicketUserInfo = async (ticket: any): Promise<{ email: string; name: string }> => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', ticket.user_id)
        .maybeSingle();
      return {
        email: data?.email || '',
        name: data?.full_name || ticket.user_profiles?.full_name || ticket.user_name || 'User',
      };
    } catch {
      return { email: '', name: ticket.user_profiles?.full_name || ticket.user_name || 'User' };
    }
  };

  const sendTicketUpdateNotification = (ticket: any, userInfo: { email: string; name: string }, adminMessage?: string) => {
    if (!userInfo.email) return;
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        event_type: 'ticket_updated',
        ticket_id: ticket.id,
        ticket_subject: ticket.subject,
        ticket_category: ticket.category,
        ticket_priority: ticket.priority,
        ticket_status: ticket.status,
        user_email: userInfo.email,
        user_name: userInfo.name,
        admin_message: adminMessage,
      }),
    }).catch((err) => console.error('Ticket update notification error:', err));
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    if (!canManage) return;
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(ticketId, newStatus);
      await logActivity('update_ticket_status', 'support_ticket', ticketId, { status: newStatus });
      await loadTickets();
      const updatedTicket = selectedTicket?.id === ticketId
        ? { ...selectedTicket, status: newStatus }
        : selectedTicket;
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updatedTicket);
      }
      showSuccess(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`);
      if (selectedTicket?.id === ticketId) {
        const userInfo = await getTicketUserInfo(selectedTicket);
        sendTicketUpdateNotification({ ...selectedTicket, status: newStatus }, userInfo);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async (message: string) => {
    if (!selectedTicket || !user) return;
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message,
      is_staff_reply: true,
      created_at: new Date().toISOString(),
      user_name: 'You',
    };
    setTicketMessages((prev) => [...prev, optimisticMsg]);
    try {
      await replyToTicket(selectedTicket.id, message, user.id);
      await logActivity('reply_to_ticket', 'support_ticket', selectedTicket.id);
      await loadTicketMessages(selectedTicket.id);
      await loadTickets();
      showSuccess('Reply sent');
      const { data: updatedTicketData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', selectedTicket.id)
        .maybeSingle();
      const ticketForNotification = updatedTicketData || selectedTicket;
      const userInfo = await getTicketUserInfo(ticketForNotification);
      sendTicketUpdateNotification(ticketForNotification, userInfo, message);
    } catch (err) {
      setTicketMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      showError(err instanceof Error ? err.message : 'Failed to send reply');
      throw err;
    }
  };

  const toggleTicketSelection = (ticketId: string) => {
    const next = new Set(selectedTickets);
    if (next.has(ticketId)) next.delete(ticketId);
    else next.add(ticketId);
    setSelectedTickets(next);
  };

  const toggleSelectAll = () => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(filteredTickets.map((t) => t.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTickets.size === 0 || !canManage) return;
    try {
      const ids = Array.from(selectedTickets);
      await bulkUpdateTicketStatus(ids, newStatus);
      await logActivity('bulk_update_ticket_status', 'support_ticket', undefined, { count: ids.length, status: newStatus });
      setSelectedTickets(new Set());
      await loadTickets();
      showSuccess(`Updated ${ids.length} tickets to ${statusConfig[newStatus]?.label || newStatus}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Bulk update failed');
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTickets.size === 0 || !canManage || !user) return;
    try {
      const ids = Array.from(selectedTickets);
      await bulkAssignTickets(ids, user.id);
      await logActivity('bulk_assign_tickets', 'support_ticket', undefined, { count: ids.length });
      setSelectedTickets(new Set());
      await loadTickets();
      showSuccess(`Assigned ${ids.length} tickets to you`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Bulk assign failed');
    }
  };

  const handleExport = () => {
    const exportData = tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      user: t.user_profiles?.full_name || t.user_name || 'Unknown',
      created_at: new Date(t.created_at).toLocaleDateString(),
      updated_at: new Date(t.updated_at).toLocaleDateString(),
    }));
    exportToCSV(exportData, 'support_tickets');
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-5">
      {successMessage && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open"
          value={stats.open}
          icon={<Circle size={18} />}
          color="emerald"
          onClick={() => { setFilterStatus('open'); setCurrentPage(1); }}
          active={filterStatus === 'open'}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<Loader2 size={18} />}
          color="blue"
          onClick={() => { setFilterStatus('in_progress'); setCurrentPage(1); }}
          active={filterStatus === 'in_progress'}
        />
        <StatCard
          label="Awaiting Reply"
          value={stats.awaiting}
          icon={<Clock size={18} />}
          color="amber"
          onClick={() => { setFilterStatus('waiting_response'); setCurrentPage(1); }}
          active={filterStatus === 'waiting_response'}
        />
        <StatCard
          label="Urgent"
          value={stats.urgent}
          icon={<AlertTriangle size={18} />}
          color="red"
          onClick={() => { setFilterPriority('urgent'); setCurrentPage(1); }}
          active={filterPriority === 'urgent'}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 'calc(100vh - 340px)' }}>
        <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden transition-all ${selectedTicket ? 'lg:w-[420px] flex-none' : 'flex-1'}`}>
          <div className="flex-none px-5 pt-5 pb-4 border-b border-slate-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tickets</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400 dark:text-gray-500" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="text-xs px-2.5 py-1.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_response">Awaiting Reply</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
                className="text-xs px-2.5 py-1.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {(filterStatus !== 'all' || filterPriority !== 'all') && (
                <button
                  onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setCurrentPage(1); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear
                </button>
              )}
              {canManage && filteredTickets.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:text-gray-300"
                >
                  {selectedTickets.size === filteredTickets.length ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
                  {selectedTickets.size > 0 ? `${selectedTickets.size} selected` : 'Select'}
                </button>
              )}
            </div>
          </div>

          {selectedTickets.size > 0 && canManage && (
            <div className="flex-none px-5 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-blue-700">{selectedTickets.size} selected:</span>
              <button onClick={() => handleBulkStatusChange('in_progress')} className="text-xs px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                In Progress
              </button>
              <button onClick={() => handleBulkStatusChange('resolved')} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                Resolve
              </button>
              <button onClick={() => handleBulkStatusChange('closed')} className="text-xs px-2 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700">
                Close
              </button>
              <button onClick={handleBulkAssign} className="text-xs px-2 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                Assign to Me
              </button>
              <button onClick={() => setSelectedTickets(new Set())} className="ml-auto text-xs text-blue-600 hover:text-blue-700">
                Clear
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-slate-400 dark:text-gray-500" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <Inbox size={24} className="text-slate-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-gray-400">No tickets found</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredTickets.map((ticket) => {
                  const st = statusConfig[ticket.status] || statusConfig.open;
                  const pr = priorityConfig[ticket.priority] || priorityConfig.low;
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket)}
                      className={`px-5 py-4 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500' : 'hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-900 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {canManage && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleTicketSelection(ticket.id); }}
                            className="mt-0.5 text-slate-300 hover:text-slate-500 dark:text-gray-400 transition-colors"
                          >
                            {selectedTickets.has(ticket.id) ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full flex-none ${st.dotColor}`} />
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{ticket.subject}</h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-1 mb-2 pl-4">{ticket.description}</p>
                          <div className="flex items-center gap-2 pl-4 flex-wrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${st.bg} ${st.color} border`}>
                              {st.label}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${pr.bg} ${pr.color}`}>
                              {ticket.priority === 'urgent' && <AlertTriangle size={9} className="mr-0.5" />}
                              {pr.label}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 capitalize">{ticket.category?.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 pl-4">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-gray-500">
                              <User size={10} />
                              {ticket.user_profiles?.full_name || ticket.user_name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-gray-500">
                              <Clock size={10} />
                              {formatTime(ticket.created_at)}
                            </span>
                            {ticket.assigned_admin_id && (
                              <span className="flex items-center gap-1 text-[10px] text-blue-500">
                                <Shield size={10} />
                                Assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex-none flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
              <span className="text-xs text-slate-500 dark:text-gray-400">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-600 dark:text-gray-400 px-2">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedTicket ? (
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
            <TicketDetailPanel
              ticket={selectedTicket}
              messages={ticketMessages}
              loadingMessages={loadingMessages}
              canManage={canManage}
              updatingStatus={updatingStatus}
              userId={user?.id}
              onClose={() => { setSelectedTicket(null); setTicketMessages([]); }}
              onUpdateStatus={handleUpdateStatus}
              onAssignToMe={handleAssignToMe}
              onSendReply={handleSendReply}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 items-center justify-center">
            <div className="text-center px-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-slate-400 dark:text-gray-500" />
              </div>
              <p className="text-base font-medium text-slate-600 dark:text-gray-400">Select a ticket</p>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">Choose a ticket from the list to view details and reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  active: boolean;
}) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string; border: string; activeBg: string }> = {
    emerald: { bg: 'bg-white dark:bg-gray-800', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-600', border: 'border-slate-200 dark:border-gray-700', activeBg: 'bg-emerald-50 border-emerald-300' },
    blue: { bg: 'bg-white dark:bg-gray-800', text: 'text-blue-700', iconBg: 'bg-blue-100 text-blue-600', border: 'border-slate-200 dark:border-gray-700', activeBg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300' },
    amber: { bg: 'bg-white dark:bg-gray-800', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600', border: 'border-slate-200 dark:border-gray-700', activeBg: 'bg-amber-50 border-amber-300' },
    red: { bg: 'bg-white dark:bg-gray-800', text: 'text-red-700', iconBg: 'bg-red-100 text-red-600', border: 'border-slate-200 dark:border-gray-700', activeBg: 'bg-red-50 border-red-300' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm ${
        active ? c.activeBg : `${c.bg} ${c.border} hover:border-slate-300`
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}>{icon}</div>
      <div className="text-left">
        <p className={`text-xl font-bold ${c.text}`}>{value}</p>
        <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
      </div>
    </button>
  );
}
