import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Clock,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  UserPlus,
  Loader2,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  open: { label: 'Open', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Loader2 },
  waiting_response: { label: 'Awaiting Reply', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-slate-600 dark:text-gray-400', bg: 'bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-slate-500 dark:text-gray-400', bg: 'bg-slate-100 border-slate-300 dark:border-gray-600', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-700', bg: 'bg-red-50 border border-red-200' },
  high: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  medium: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
  low: { label: 'Low', color: 'text-sky-700', bg: 'bg-sky-50 border border-sky-200' },
};

interface TicketDetailPanelProps {
  ticket: any;
  messages: any[];
  loadingMessages: boolean;
  canManage: boolean;
  updatingStatus: boolean;
  userId: string | undefined;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: string) => Promise<void>;
  onAssignToMe: (ticketId: string) => Promise<void>;
  onSendReply: (message: string) => Promise<void>;
}

export default function TicketDetailPanel({
  ticket,
  messages,
  loadingMessages,
  canManage,
  updatingStatus,
  userId,
  onClose,
  onUpdateStatus,
  onAssignToMe,
  onSendReply,
}: TicketDetailPanelProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!replyMessage.trim() || sending) return;
    setSending(true);
    try {
      await onSendReply(replyMessage);
      setReplyMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const status = statusConfig[ticket.status] || statusConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.low;
  const StatusIcon = status.icon;

  const statusSteps = ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'];
  const currentStepIndex = statusSteps.indexOf(ticket.status);

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex-none border-b border-slate-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{ticket.subject}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${status.bg} ${status.color}`}>
                <StatusIcon size={12} />
                {status.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${priority.bg} ${priority.color}`}>
                {ticket.priority === 'urgent' && <AlertTriangle size={12} />}
                {priority.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-gray-400 capitalize">{ticket.category?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6 mt-4 text-xs text-slate-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <User size={14} />
            <span>{ticket.user_profiles?.full_name || ticket.user_name || 'Unknown User'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>Created {formatTime(ticket.created_at)}</span>
          </div>
          {ticket.assigned_admin_id && (
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-blue-500" />
              <span className="text-blue-600">Assigned</span>
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-gray-400">Status:</label>
              <select
                value={ticket.status}
                onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                disabled={updatingStatus}
                className="text-sm px-3 py-1.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 bg-white dark:bg-gray-800"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_response">Awaiting Reply</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {updatingStatus && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </div>
            {!ticket.assigned_admin_id && (
              <button
                onClick={() => onAssignToMe(ticket.id)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <UserPlus size={14} />
                Assign to Me
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
        {statusSteps.map((step, i) => {
          const stepConf = statusConfig[step];
          const isActive = i <= currentStepIndex;
          const isCurrent = step === ticket.status;
          return (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium transition-colors ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-200 text-slate-400 dark:text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden xl:inline ${isCurrent ? 'text-blue-700' : isActive ? 'text-blue-500' : 'text-slate-400 dark:text-gray-500'}`}>
                {stepConf.label}
              </span>
              {i < statusSteps.length - 1 && (
                <ArrowRight size={10} className={`ml-auto ${isActive ? 'text-blue-300' : 'text-slate-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Original Description</p>
          <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {loadingMessages ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-400 dark:text-gray-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 dark:text-gray-500">No messages in this conversation yet</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => {
              const isStaff = msg.is_staff_reply;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] ${isStaff ? 'order-1' : 'order-1'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isStaff
                          ? 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 rounded-tl-md'
                          : 'bg-blue-600 text-white rounded-tr-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-1 ${isStaff ? 'justify-start' : 'justify-end'}`}>
                      {isStaff && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Shield size={9} />
                          Staff
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        {msg.user_name && `${msg.user_name} · `}
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {canManage && ticket.status !== 'closed' && (
        <div className="flex-none border-t border-slate-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-slate-50 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 transition-colors"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!replyMessage.trim() || sending}
              className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
