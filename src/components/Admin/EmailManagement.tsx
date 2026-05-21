import { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { sanitizeEmailHtml } from '../../lib/sanitize';
import {
  Mail,
  FileText,
  Save,
  Eye,
  EyeOff,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Copy,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Zap,
  Info,
} from 'lucide-react';
import { getSystemSettings, updateSystemSetting } from '../../lib/adminHelpers';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type TabId = 'configuration' | 'templates';

interface EmailTemplate {
  id: string;
  alert_type: string;
  template_name: string;
  sender_email: string;
  subject: string;
  body_html: string;
  footer: string;
  is_active: boolean;
  variables: string[] | null;
  created_at: string;
  updated_at: string;
}

const ALERT_TYPES: { value: string; label: string; variables: string[]; description: string }[] = [
  {
    value: 'support_ticket_creation',
    label: 'Support Ticket Creation',
    variables: ['{{userName}}', '{{userEmail}}', '{{ticketId}}', '{{ticketSubject}}', '{{ticketPriority}}'],
    description: 'Sent to user when a new support ticket is created.',
  },
  {
    value: 'support_ticket_reply',
    label: 'Support Ticket Reply',
    variables: ['{{userName}}', '{{userEmail}}', '{{ticketId}}', '{{ticketSubject}}', '{{replyContent}}', '{{agentName}}'],
    description: 'Sent to user when admin replies to their support ticket.',
  },
  {
    value: 'ticket_status_update',
    label: 'Ticket Status Update',
    variables: ['{{userName}}', '{{userEmail}}', '{{ticketId}}', '{{ticketSubject}}', '{{oldStatus}}', '{{newStatus}}'],
    description: 'Sent when a ticket status changes (e.g., open → resolved).',
  },
  {
    value: 'generation_complete',
    label: 'Generation Complete',
    variables: ['{{userName}}', '{{userEmail}}', '{{generationType}}', '{{resultUrl}}'],
    description: 'Sent when an AI content generation task finishes.',
  },
  {
    value: 'member_invited',
    label: 'Member Invited',
    variables: ['{{inviteeName}}', '{{inviterName}}', '{{inviteUrl}}', '{{teamName}}', '{{expiresAt}}'],
    description: 'Sent to a user who is invited to join a team or organization.',
  },
  {
    value: 'member_removed',
    label: 'Member Removed',
    variables: ['{{userName}}', '{{userEmail}}', '{{teamName}}', '{{removedBy}}'],
    description: 'Sent to a user who has been removed from a team or organization.',
  },
  {
    value: 'user_registration',
    label: 'User Registration',
    variables: ['{{userName}}', '{{userEmail}}', '{{registrationDate}}', '{{loginUrl}}'],
    description: 'Sent to admin when a new user registers.',
  },
  {
    value: 'password_reset',
    label: 'Password Reset',
    variables: ['{{userName}}', '{{userEmail}}', '{{resetUrl}}', '{{expiresAt}}'],
    description: 'Sent to user with a link to reset their password.',
  },
  {
    value: 'subscription_upgrade',
    label: 'Subscription Upgrade',
    variables: ['{{userName}}', '{{userEmail}}', '{{oldPlan}}', '{{newPlan}}', '{{effectiveDate}}', '{{billingAmount}}'],
    description: 'Sent when a user upgrades their subscription plan.',
  },
  {
    value: 'subscription_downgrade',
    label: 'Subscription Downgrade',
    variables: ['{{userName}}', '{{userEmail}}', '{{oldPlan}}', '{{newPlan}}', '{{effectiveDate}}'],
    description: 'Sent when a user downgrades their subscription plan.',
  },
  {
    value: 'payment_confirmation',
    label: 'Payment Confirmation',
    variables: ['{{userName}}', '{{userEmail}}', '{{amount}}', '{{planName}}', '{{paymentDate}}', '{{transactionId}}', '{{nextBillingDate}}'],
    description: 'Sent after a successful payment is processed.',
  },
  {
    value: 'payment_failed',
    label: 'Payment Failed',
    variables: ['{{userName}}', '{{userEmail}}', '{{amount}}', '{{failedDate}}', '{{failureReason}}', '{{billingUrl}}'],
    description: 'Sent when a payment attempt fails.',
  },
  {
    value: 'account_deactivation',
    label: 'Account Deactivation',
    variables: ['{{userName}}', '{{userEmail}}', '{{deactivationDate}}', '{{reason}}', '{{supportEmail}}'],
    description: 'Sent when an account is deactivated by admin.',
  },
  {
    value: 'welcome_email',
    label: 'Welcome Email',
    variables: ['{{userName}}', '{{userEmail}}', '{{loginUrl}}'],
    description: 'Sent to new users right after registration.',
  },
  {
    value: 'newsletter',
    label: 'Newsletter',
    variables: ['{{userName}}', '{{userEmail}}', '{{unsubscribeUrl}}', '{{newsletterTitle}}'],
    description: 'General newsletter or announcement email.',
  },
  {
    value: 'custom_alert',
    label: 'Custom Alert',
    variables: ['{{userName}}', '{{userEmail}}', '{{customVariable1}}', '{{customVariable2}}'],
    description: 'Custom alert or notification email for any purpose.',
  },
  {
    value: 'budget_threshold_exceeded',
    label: 'Budget Threshold Exceeded',
    variables: ['{{userName}}', '{{userEmail}}', '{{budgetName}}', '{{thresholdPct}}', '{{currentSpend}}', '{{budgetLimit}}', '{{currency}}'],
    description: 'Sent to user when their spending reaches the configured % threshold of a budget.',
  },
  {
    value: 'large_transaction_detected',
    label: 'Large Transaction Detected',
    variables: ['{{userName}}', '{{userEmail}}', '{{transactionAmount}}', '{{currency}}', '{{transactionDate}}', '{{transactionDescription}}', '{{thresholdAmount}}'],
    description: 'Sent when a single transaction exceeds the user-configured amount threshold.',
  },
  {
    value: 'bill_due_reminder',
    label: 'Bill Due Reminder',
    variables: ['{{userName}}', '{{userEmail}}', '{{billName}}', '{{billAmount}}', '{{currency}}', '{{dueDate}}', '{{daysUntilDue}}'],
    description: 'Sent before a bill is due, based on the user-configured days-in-advance setting.',
  },
  {
    value: 'monthly_summary_report',
    label: 'Monthly Summary Report',
    variables: ['{{userName}}', '{{userEmail}}', '{{reportMonth}}', '{{totalIncome}}', '{{totalExpenses}}', '{{netSavings}}', '{{currency}}', '{{topCategory}}'],
    description: 'Monthly breakdown of income, spending, and savings delivered at month end.',
  },
  {
    value: 'weekly_spending_digest',
    label: 'Weekly Spending Digest',
    variables: ['{{userName}}', '{{userEmail}}', '{{weekStart}}', '{{weekEnd}}', '{{totalSpend}}', '{{currency}}', '{{topCategory}}', '{{transactionCount}}'],
    description: 'Weekly snapshot of spending patterns and trends delivered each Monday.',
  },
  {
    value: 'savings_goal_milestone',
    label: 'Savings Goal Milestone',
    variables: ['{{userName}}', '{{userEmail}}', '{{goalName}}', '{{milestonePct}}', '{{currentAmount}}', '{{targetAmount}}', '{{currency}}'],
    description: 'Sent when a savings goal reaches 25%, 50%, 75%, or 100% of its target.',
  },
  {
    value: 'low_balance_warning',
    label: 'Low Balance Warning',
    variables: ['{{userName}}', '{{userEmail}}', '{{currentBalance}}', '{{thresholdAmount}}', '{{currency}}', '{{balanceDate}}'],
    description: 'Sent when the user\'s net balance falls below their configured low-balance threshold.',
  },
  {
    value: 'unusual_spending_pattern',
    label: 'Unusual Spending Pattern',
    variables: ['{{userName}}', '{{userEmail}}', '{{category}}', '{{currentSpend}}', '{{averageSpend}}', '{{percentageIncrease}}', '{{currency}}', '{{periodLabel}}'],
    description: 'Sent when spending in a category spikes significantly compared to the user\'s historical average.',
  },
];

function getAlertTypeMeta(value: string) {
  return ALERT_TYPES.find(a => a.value === value);
}

function AlertTypeBadge({ alertType }: { alertType: string }) {
  const meta = getAlertTypeMeta(alertType);
  const colorMap: Record<string, string> = {
    support_ticket_creation: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    support_ticket_reply: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    ticket_status_update: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    password_reset: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    user_registration: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    welcome_email: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    subscription_upgrade: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    subscription_downgrade: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    payment_confirmation: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    payment_failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    account_deactivation: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
    member_invited: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    member_removed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    generation_complete: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    newsletter: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
    custom_alert: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
    budget_threshold_exceeded: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    large_transaction_detected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    bill_due_reminder: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    monthly_summary_report: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    weekly_spending_digest: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    savings_goal_milestone: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    low_balance_warning: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    unusual_spending_pattern: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[alertType] || 'bg-gray-100 text-gray-600'}`}>
      {meta?.label || alertType}
    </span>
  );
}

export interface RichTextEditorHandle {
  getHTML: () => string;
  insertText: (text: string) => void;
}

interface RichTextEditorProps {
  initialContent?: string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ initialContent = '' }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getHTML: () => editorRef.current?.innerHTML || '',
      insertText: (text: string) => {
        editorRef.current?.focus();
        document.execCommand('insertText', false, text);
      },
    }));

    const exec = (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
    };

    const execBlock = (tag: string) => {
      editorRef.current?.focus();
      document.execCommand('formatBlock', false, tag);
    };

    const [activeCommands, setActiveCommands] = useState<Record<string, boolean>>({});

    const updateActiveState = () => {
      setActiveCommands({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      });
    };

    const btnCls = (key: string) =>
      `p-1.5 rounded text-sm transition-colors ${activeCommands[key] ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200'}`;

    return (
      <div className="border border-gray-200 dark:border-white/[0.1] rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold'); }} className={btnCls('bold')} title="Bold">
            <span className="font-bold text-xs">B</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic'); }} className={btnCls('italic')} title="Italic">
            <span className="italic text-xs">I</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('underline'); }} className={btnCls('underline')} title="Underline">
            <span className="underline text-xs">U</span>
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/[0.1] mx-0.5" />
          <button type="button" onMouseDown={e => { e.preventDefault(); execBlock('h1'); }} className="p-1.5 rounded text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200 transition-colors" title="H1">H1</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); execBlock('h2'); }} className="p-1.5 rounded text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200 transition-colors" title="H2">H2</button>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/[0.1] mx-0.5" />
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} className={btnCls('insertUnorderedList')} title="Bullet List">
            <span className="text-xs">≡</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} className={btnCls('insertOrderedList')} title="Ordered List">
            <span className="text-xs">1.</span>
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/[0.1] mx-0.5" />
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }} className={btnCls('justifyLeft')} title="Align Left">
            <span className="text-xs">⫷</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }} className={btnCls('justifyCenter')} title="Align Center">
            <span className="text-xs">≡</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }} className={btnCls('justifyRight')} title="Align Right">
            <span className="text-xs">⫸</span>
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/[0.1] mx-0.5" />
          <button type="button" onMouseDown={e => { e.preventDefault(); execBlock('blockquote'); }} className="p-1.5 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200 transition-colors" title="Blockquote">
            <span className="text-xs">"</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); execBlock('pre'); }} className="p-1.5 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200 transition-colors" title="Code">
            <span className="text-xs font-mono">{"<>"}</span>
          </button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('removeFormat'); execBlock('p'); }} className="p-1.5 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-gray-200 transition-colors" title="Clear Formatting">
            <span className="text-xs">Tx</span>
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyUp={updateActiveState}
          onMouseUp={updateActiveState}
          onSelect={updateActiveState}
          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(initialContent) }}
          className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-4 py-3 focus:outline-none text-gray-800 dark:text-gray-200 bg-white dark:bg-transparent"
        />
      </div>
    );
  }
);

interface TemplateModalProps {
  template: EmailTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

function TemplateModal({ template, onClose, onSaved }: TemplateModalProps) {
  const { user } = useAuth();
  const [alertType, setAlertType] = useState(template?.alert_type || 'support_ticket_creation');
  const [templateName, setTemplateName] = useState(template?.template_name || '');
  const [senderEmail, setSenderEmail] = useState(template?.sender_email || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [footer, setFooter] = useState(template?.footer || '');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewHtml, setPreviewHtml] = useState(template?.body_html || '');

  const editorRef = useRef<RichTextEditorHandle>(null);

  const alertMeta = getAlertTypeMeta(alertType);

  const handleSave = async () => {
    if (!user) return;
    if (!templateName.trim()) { setError('Template name is required'); return; }
    if (!subject.trim()) { setError('Subject is required'); return; }

    const bodyHtml = editorRef.current?.getHTML() || '';
    if (!bodyHtml || bodyHtml === '<br>' || bodyHtml.trim() === '') { setError('Email body is required'); return; }

    setSaving(true);
    setError('');

    const payload = {
      alert_type: alertType,
      template_name: templateName.trim(),
      sender_email: senderEmail.trim(),
      subject: subject.trim(),
      body_html: bodyHtml,
      footer: footer.trim(),
      is_active: isActive,
      variables: alertMeta?.variables || [],
    };

    const { error: dbError } = template
      ? await supabase.from('email_templates').update(payload).eq('id', template.id)
      : await supabase.from('email_templates').insert(payload);

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      onSaved();
    }
  };

  const insertVariable = (variable: string) => {
    editorRef.current?.insertText(variable);
  };

  const handleTabSwitch = (tab: 'edit' | 'preview') => {
    if (tab === 'preview') {
      setPreviewHtml(editorRef.current?.getHTML() || '');
    }
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#0B0F1A] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col border border-gray-200 dark:border-white/[0.08]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/[0.08]">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {template ? 'Edit Email Template' : 'Create Email Template'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure the email content and settings</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-white/[0.08]">
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-500/20">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Alert Type</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAlertDropdown(!showAlertDropdown)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <span>{alertMeta?.label || alertType}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAlertDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showAlertDropdown && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-[#0D1322] border border-gray-200 dark:border-white/[0.1] rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                      {ALERT_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => { setAlertType(type.value); setShowAlertDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${alertType === type.value ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <span>{type.label}</span>
                          {alertType === type.value && <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {alertMeta?.description && (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Info size={11} />
                    {alertMeta.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g., Support Ticket Confirmation"
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Sender Email
                </label>
                <input
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="Leave empty to use config default"
                  type="email"
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-400">Override the default SMTP from address for this template only.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g., Support ticket #{{ticketId}} received"
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>

              {alertMeta?.variables && alertMeta.variables.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                    <Zap size={11} />
                    Dynamic Variables — click to insert into body
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {alertMeta.variables.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded text-xs font-mono hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">These placeholders will be replaced with actual values when the email is sent.</p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Active</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This template will be used for sending</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="transition-colors"
                >
                  {isActive
                    ? <ToggleRight size={32} className="text-blue-600 dark:text-blue-400" />
                    : <ToggleLeft size={32} className="text-gray-400" />
                  }
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Email Body <span className="text-red-500">*</span>
                </label>
                <div className="flex bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('edit')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'edit' ? 'bg-white dark:bg-white/[0.1] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('preview')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'preview' ? 'bg-white dark:bg-white/[0.1] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {activeTab === 'edit' ? (
                <RichTextEditor ref={editorRef} initialContent={template?.body_html || ''} />
              ) : (
                <div className="border border-gray-200 dark:border-white/[0.1] rounded-xl overflow-hidden bg-white dark:bg-white/[0.03] p-4 min-h-[200px]">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(previewHtml || '<p class="text-gray-400">No content yet</p>') }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                  Footer
                </label>
                <textarea
                  value={footer}
                  onChange={e => setFooter(e.target.value)}
                  rows={3}
                  placeholder="Email footer text (e.g., company info, unsubscribe link)"
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#080C14]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/20"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            <Save size={15} />
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigurationTab() {
  const { user } = useAuth();
  const { hasPermission } = useAdmin();
  const canEdit = hasPermission('manage_settings');

  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSystemSettings();
      setSettings(data || []);
      const vals: Record<string, string> = {};
      data?.forEach((s: any) => { vals[s.setting_key] = s.setting_value; });
      setEditingValues(vals);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async (key: string) => {
    if (!user || !canEdit) return;
    setSavingKey(key);
    try {
      await updateSystemSetting(key, (editingValues[key] || '').trim(), user.id);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2500);
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient?.includes('@')) {
      setTestStatus({ success: false, message: 'Please enter a valid email address.' });
      return;
    }
    setTestingEmail(true);
    setTestStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTestStatus({ success: false, message: 'Not authenticated.' }); return; }
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`;
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });
      const result = await resp.json();
      setTestStatus({ success: result.success, message: result.message || (resp.ok ? 'Test email sent!' : 'Failed to send.') });
    } catch {
      setTestStatus({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setTestingEmail(false);
    }
  };

  const getVal = (key: string) => editingValues[key] || '';
  const getSetting = (key: string) => settings.find((s: any) => s.setting_key === key);

  const renderField = (key: string, label: string, placeholder?: string) => {
    const setting = getSetting(key);
    const isSensitive = setting?.is_sensitive;
    const isVisible = showSensitive[key];
    const isSaving = savingKey === key;
    const isSaved = savedKey === key;

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type={isSensitive && !isVisible ? 'password' : 'text'}
              value={getVal(key)}
              onChange={e => setEditingValues(prev => ({ ...prev, [key]: e.target.value }))}
              disabled={!canEdit}
              placeholder={placeholder || setting?.description || ''}
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:bg-gray-50 dark:disabled:bg-white/[0.02] transition-colors"
            />
            {isSensitive && (
              <button
                type="button"
                onClick={() => setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => handleSave(key)}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isSaved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'}`}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {isSaving ? 'Saving' : isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
        {setting?.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{setting.description}</p>
        )}
      </div>
    );
  };

  const renderSelectField = (key: string, label: string, options: { value: string; label: string }[], helpText?: string) => {
    const isSaving = savingKey === key;
    const isSaved = savedKey === key;

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="flex items-center gap-2">
          <select
            value={getVal(key)}
            onChange={e => setEditingValues(prev => ({ ...prev, [key]: e.target.value }))}
            disabled={!canEdit}
            className="flex-1 px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:bg-gray-50 dark:disabled:bg-white/[0.02] transition-colors"
          >
            <option value="">Select provider</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={() => handleSave(key)}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isSaved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'}`}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {isSaving ? 'Saving' : isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
        {helpText && <p className="text-xs text-gray-400 dark:text-gray-500">{helpText}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-blue-500" size={22} />
      </div>
    );
  }

  const smtpProviders = [
    { value: 'zoho', label: 'Zoho Email' },
    { value: 'gmail', label: 'Gmail / Google Workspace' },
    { value: 'office365', label: 'Office 365 / Outlook' },
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'mailgun', label: 'Mailgun' },
    { value: 'ses', label: 'Amazon SES' },
    { value: 'custom', label: 'Custom SMTP' },
  ];

  const tlsOptions = [
    { value: 'true', label: 'Enabled (TLS/STARTTLS)' },
    { value: 'false', label: 'Disabled' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.01]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">SMTP Configuration</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure your email service provider settings</p>
        </div>
        <div className="p-6 space-y-5">
          {renderSelectField('smtp_provider', 'Email Provider', smtpProviders, 'Email service provider')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {renderField('smtp_host', 'SMTP Host', 'smtp.zoho.com')}
            {renderField('smtp_port', 'SMTP Port', '587')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {renderField('smtp_username', 'SMTP Username', 'you@yourdomain.com')}
            {renderField('smtp_password', 'SMTP Password', '')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {renderField('smtp_from_email', 'From Email', 'noreply@yourdomain.com')}
            {renderField('smtp_from_name', 'From Name', 'FinanceFlow AI')}
          </div>
          {renderSelectField('smtp_use_tls', 'TLS / STARTTLS', tlsOptions)}
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.01]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Send Test Email</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Verify your SMTP configuration by sending a test email</p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={testEmailRecipient}
              onChange={e => setTestEmailRecipient(e.target.value)}
              placeholder="Enter recipient email"
              className="flex-1 px-3.5 py-2.5 border border-gray-300 dark:border-white/[0.1] rounded-lg text-sm bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleTestEmail}
              disabled={testingEmail || !canEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {testingEmail ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {testingEmail ? 'Sending…' : 'Send Test'}
            </button>
          </div>
          {testStatus && (
            <div className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border ${testStatus.success ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
              {testStatus.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {testStatus.message}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.01]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Email Content Configuration</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure default email content, subject templates, and footer text</p>
        </div>
        <div className="p-6 space-y-5">
          {renderField('email_subject_template', 'Default Subject Template', 'Your [EVENT_TYPE] — [EVENT_DATE]')}
          {renderField('email_footer_text', 'Default Footer Text', 'FinanceFlow AI | Unsubscribe')}
          {renderField('email_help_text', 'Default Help Text', 'Need help? Contact support@financeflow.ai')}
          {renderField('admin_email', 'Admin Email (BCC)', 'admin@yourdomain.com')}
        </div>
      </div>
    </div>
  );
}

function TemplatesTab() {
  const { hasPermission } = useAdmin();
  const canManage = hasPermission('manage_settings');

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false });
    setTemplates((data as EmailTemplate[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Delete "${template.template_name}"? This cannot be undone.`)) return;
    setDeletingId(template.id);
    await supabase.from('email_templates').delete().eq('id', template.id);
    await loadTemplates();
    setDeletingId(null);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const { error } = await supabase.from('email_templates').insert({
      alert_type: template.alert_type,
      template_name: `${template.template_name} (Copy)`,
      sender_email: template.sender_email,
      subject: template.subject,
      body_html: template.body_html,
      footer: template.footer,
      is_active: false,
      variables: template.variables,
    });
    if (!error) loadTemplates();
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    await supabase.from('email_templates').update({ is_active: !template.is_active }).eq('id', template.id);
    loadTemplates();
  };

  const filtered = templates.filter(t => {
    const matchSearch = !searchTerm || t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || t.alert_type === filterType;
    return matchSearch && matchType;
  });

  const activeCount = templates.filter(t => t.is_active).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Templates', value: templates.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Active Templates', value: activeCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Alert Types Covered', value: new Set(templates.map(t => t.alert_type)).size, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2.5`}>
              <Mail className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Email Templates</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} templates configured</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search templates…"
                className="w-44 pl-3 pr-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-white/[0.1] rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="all">All Types</option>
              {ALERT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {canManage && (
              <button
                onClick={() => { setEditingTemplate(null); setShowModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-blue-600/20"
              >
                <Plus size={14} />
                Create Template
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-500" size={22} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No templates found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first email template to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/[0.04]">
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Alert Type</th>
                  <th className="px-5 py-3 hidden md:table-cell">Sender</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.template_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{t.subject}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <AlertTypeBadge alertType={t.alert_type} />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {t.sender_email || <span className="italic text-gray-400">default</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${t.is_active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'}`}
                      >
                        {t.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {t.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {canManage && (
                          <>
                            <button
                              onClick={() => { setEditingTemplate(t); setShowModal(true); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(t)}
                              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-md transition-colors"
                              title="Duplicate"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              disabled={deletingId === t.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setShowModal(false); setEditingTemplate(null); }}
          onSaved={() => { setShowModal(false); setEditingTemplate(null); loadTemplates(); }}
        />
      )}
    </div>
  );
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'configuration', label: 'Configuration', icon: Mail },
  { id: 'templates', label: 'Email Templates', icon: FileText },
];

export default function EmailManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('configuration');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Email Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure SMTP settings, email content, and manage notification templates for all system alerts.
        </p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-white/[0.08] gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'configuration' && <ConfigurationTab />}
      {activeTab === 'templates' && <TemplatesTab />}
    </div>
  );
}
