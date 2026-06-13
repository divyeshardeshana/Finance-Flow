import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: number;
  annual_price: number;
  features: string[];
  max_goals: number;
  is_active: boolean;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_last4: string | null;
  created_at: string;
  invoice_url: string | null;
  user_email?: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_admin_id: string | null;
  admin_notes: string | null;
  sla_response_due: string | null;
  sla_resolution_due: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  assigned_admin_name?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  category: string;
  points: number;
  is_active: boolean;
  usage_count: number;
  success_rate: number;
  created_by_admin_id: string | null;
  last_edited_by: string | null;
  last_edited_at: string | null;
}

export interface FAQArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
  slug: string | null;
  order_index: number;
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  created_by_admin_id: string | null;
  last_edited_by: string | null;
  last_edited_at: string | null;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
  is_sensitive: boolean;
  updated_at: string;
}

export async function updateUserSubscription(
  userId: string,
  newTierId: string,
  adminId: string
) {
  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('tier_name')
    .eq('id', newTierId)
    .maybeSingle();

  if (!tier) throw new Error('Tier not found');

  await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data: newSub, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      tier_id: newTierId,
      status: 'active',
      start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('user_profiles')
    .update({ subscription_tier: tier.tier_name })
    .eq('id', userId);

  return newSub;
}

export async function getAllSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('monthly_price');

  if (error) throw error;
  return data;
}

export async function updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>) {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllPayments() {
  const { data, error } = await supabase.rpc('get_all_payments_for_admin', {
    filter_status: 'all',
    offset_count: 0,
    limit_count: 1000,
  });

  if (error) throw error;

  const mapped = (data || []).map((row: any) => ({
    ...row,
    user_profiles: { full_name: row.user_full_name, email: row.user_email },
  }));

  return { data: mapped, count: mapped.length };
}

export async function processRefund(_paymentId: string, _amount: number, _adminId: string) {
  throw new Error('Refunds must be processed directly in the Stripe Dashboard.');
}

export async function getAllTickets(
  filterStatus?: string,
  filterPriority?: string,
  assignedTo?: string,
  offset = 0,
  limit = 50
) {
  const { data, error } = await supabase.rpc('get_tickets_for_admin', {
    filter_status: filterStatus || 'all',
    filter_priority: filterPriority || 'all',
    assigned_to: assignedTo || null,
    offset_count: offset,
    limit_count: limit
  });

  if (error) throw error;

  const { data: countData, error: countError } = await supabase.rpc('get_tickets_count_for_admin', {
    filter_status: filterStatus || 'all',
    filter_priority: filterPriority || 'all',
    assigned_to: assignedTo || null
  });

  if (countError) throw countError;

  return { data, count: countData || 0 };
}

export async function assignTicket(ticketId: string, adminId: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({
      assigned_admin_id: adminId,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  adminNotes?: string
) {
  console.log('[updateTicketStatus] Updating ticket:', ticketId, 'to status:', status);

  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'resolved' || status === 'closed') {
    updates.resolved_at = new Date().toISOString();
  }

  if (adminNotes) {
    updates.admin_notes = adminNotes;
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('[updateTicketStatus] Error updating ticket:', error);
    throw new Error(`Failed to update ticket status: ${error.message}`);
  }

  console.log('[updateTicketStatus] Ticket updated successfully');
  return data;
}

export async function replyToTicket(ticketId: string, message: string, adminId: string) {
  const { data, error } = await supabase.rpc('admin_reply_to_ticket', {
    p_ticket_id: ticketId,
    p_admin_user_id: adminId,
    p_message: message,
  });

  if (error) {
    throw new Error(`Failed to send reply: ${error.message}`);
  }

  return data;
}

export async function getTicketMessages(ticketId: string) {
  const { data, error } = await supabase.rpc('get_ticket_messages', {
    ticket_id_param: ticketId
  });

  if (error) throw error;
  return data;
}

export async function bulkUpdateTicketStatus(ticketIds: string[], newStatus: string) {
  const { data, error } = await supabase.rpc('bulk_update_ticket_status', {
    ticket_ids: ticketIds,
    new_status: newStatus
  });

  if (error) throw error;
  return data;
}

export async function bulkAssignTickets(ticketIds: string[], adminId: string) {
  const { data, error } = await supabase.rpc('bulk_assign_tickets', {
    ticket_ids: ticketIds,
    admin_id: adminId
  });

  if (error) throw error;
  return data;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'system',
  relatedId?: string
) {
  const { data, error } = await supabase.rpc('create_user_notification', {
    target_user_id: userId,
    notification_title: title,
    notification_message: message,
    notification_type: type,
    notification_related_id: relatedId || null
  });

  if (error) throw error;
  return data;
}

export async function getAllQuizQuestions(
  filterCategory?: string,
  filterDifficulty?: string,
  offset = 0,
  limit = 50
) {
  let query = supabase
    .from('quiz_questions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterCategory && filterCategory !== 'all') {
    query = query.eq('category', filterCategory);
  }

  if (filterDifficulty && filterDifficulty !== 'all') {
    query = query.eq('difficulty', filterDifficulty);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
}

export async function createQuizQuestion(question: QuizQuestion, adminId: string) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      ...question,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateQuizQuestion(
  questionId: string,
  updates: Partial<QuizQuestion>,
  adminId: string
) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .update({
      ...updates,
      last_edited_by: adminId,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', questionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuizQuestion(questionId: string) {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId);

  if (error) throw error;
}

export async function getAllFAQs(
  filterCategory?: string,
  offset = 0,
  limit = 50
) {
  let query = supabase
    .from('faq_articles')
    .select('*', { count: 'exact' })
    .order('category')
    .order('order_index')
    .range(offset, offset + limit - 1);

  if (filterCategory && filterCategory !== 'all') {
    query = query.eq('category', filterCategory);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
}

export async function createFAQ(faq: Partial<FAQArticle>, adminId: string) {
  const slug = faq.question
    ? faq.question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    : '';

  const { data, error } = await supabase
    .from('faq_articles')
    .insert({
      ...faq,
      slug,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFAQ(
  faqId: string,
  updates: Partial<FAQArticle>,
  adminId: string
) {
  const { data, error } = await supabase
    .from('faq_articles')
    .update(updates)
    .eq('id', faqId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFAQ(faqId: string) {
  const { error } = await supabase.from('faq_articles').delete().eq('id', faqId);

  if (error) throw error;
}

export async function getSystemSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('setting_key');

  if (error) throw error;
  return data;
}

export async function updateSystemSetting(
  settingKey: string,
  value: string,
  adminId: string
) {
  const { data, error } = await supabase
    .from('system_settings')
    .update({
      setting_value: value,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('setting_key', settingKey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface DashboardAnalytics {
  users: {
    total: number;
    active: number;
    inactive: number;
    onboarded: number;
    pendingOnboarding: number;
    admins: number;
    newLast30Days: number;
    recentLogins7Days: number;
    byTier: { tier: string; displayName: string; count: number }[];
  };
  subscriptions: {
    active: number;
    cancelled: number;
    expired: number;
    trialing: number;
    autoRenewEnabled: number;
    autoRenewDisabled: number;
    failedPayments: number;
  };
  payments: {
    totalRevenue: number;
    monthlyRevenue: number;
    successfulCount: number;
    failedCount: number;
    refundedCount: number;
    pendingCount: number;
    totalRefundAmount: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    unassigned: number;
    slaBreached: number;
  };
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: inactiveUsers },
    { count: onboardedUsers },
    { count: pendingOnboarding },
    { count: adminUsers },
    { count: newUsers30 },
    { count: recentLogins7 },
    { data: tierData },
    { count: activeSubs },
    { count: cancelledSubs },
    { count: expiredSubs },
    { count: trialingSubs },
    { count: autoRenewOn },
    { count: autoRenewOff },
    { count: failedPaymentSubs },
    { data: allTimeRevenue },
    { data: monthlyRevenue },
    { count: successfulPayments },
    { count: failedPayments },
    { count: refundedPayments },
    { count: pendingPayments },
    { data: refundAmounts },
    { count: totalTickets },
    { count: openTickets },
    { count: inProgressTickets },
    { count: resolvedTickets },
    { count: closedTickets },
    { count: highPriority },
    { count: mediumPriority },
    { count: lowPriority },
    { count: unassignedTickets },
    { count: slaBreached },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('onboarding_completed', true),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('onboarding_completed', false),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', sevenDaysAgo),
    supabase.from('user_profiles').select('subscription_tier'),
    supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gt('trial_ends_at', now),
    supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('auto_renew', true),
    supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('auto_renew', false),
    supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'past_due'),
    supabase.from('billing_history').select('amount').eq('status', 'paid'),
    supabase.from('billing_history').select('amount').eq('status', 'paid').gte('created_at', thirtyDaysAgo),
    supabase.from('billing_history').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('billing_history').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('billing_history').select('*', { count: 'exact', head: true }).eq('status', 'void'),
    supabase.from('billing_history').select('*', { count: 'exact', head: true }).eq('status', 'uncollectible'),
    supabase.from('billing_history').select('amount'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'high'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'medium'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'low'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).is('assigned_admin_id', null).in('status', ['open', 'in_progress']),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).lt('sla_resolution_due', now).in('status', ['open', 'in_progress']),
  ]);

  const tierCounts: Record<string, number> = {};
  tierData?.forEach((row: { subscription_tier: string }) => {
    const t = row.subscription_tier || 'free';
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  });

  const tierDisplayNames: Record<string, string> = { free: 'Free', paid: 'Pro', premium: 'Premium' };
  const byTier = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    displayName: tierDisplayNames[tier] || tier,
    count,
  }));

  return {
    users: {
      total: totalUsers || 0,
      active: activeUsers || 0,
      inactive: inactiveUsers || 0,
      onboarded: onboardedUsers || 0,
      pendingOnboarding: pendingOnboarding || 0,
      admins: adminUsers || 0,
      newLast30Days: newUsers30 || 0,
      recentLogins7Days: recentLogins7 || 0,
      byTier,
    },
    subscriptions: {
      active: activeSubs || 0,
      cancelled: cancelledSubs || 0,
      expired: expiredSubs || 0,
      trialing: trialingSubs || 0,
      autoRenewEnabled: autoRenewOn || 0,
      autoRenewDisabled: autoRenewOff || 0,
      failedPayments: failedPaymentSubs || 0,
    },
    payments: {
      totalRevenue: allTimeRevenue?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0,
      monthlyRevenue: monthlyRevenue?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0,
      successfulCount: successfulPayments || 0,
      failedCount: failedPayments || 0,
      refundedCount: refundedPayments || 0,
      pendingCount: pendingPayments || 0,
      totalRefundAmount: 0,
    },
    tickets: {
      total: totalTickets || 0,
      open: openTickets || 0,
      inProgress: inProgressTickets || 0,
      resolved: resolvedTickets || 0,
      closed: closedTickets || 0,
      highPriority: highPriority || 0,
      mediumPriority: mediumPriority || 0,
      lowPriority: lowPriority || 0,
      unassigned: unassignedTickets || 0,
      slaBreached: slaBreached || 0,
    },
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  target_keywords: string;
  tags: string[];
  featured_image_url: string;
  meta_description: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'scheduled' | 'published';
  auto_publish: boolean;
  scheduled_publish_at: string | null;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  blog_categories?: BlogCategory;
}

export async function getAllBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getAllBlogPosts(
  filterStatus?: string,
  filterCategory?: string,
  offset = 0,
  limit = 50
): Promise<{ data: BlogPost[]; count: number }> {
  let query = supabase
    .from('blog_posts')
    .select('*, blog_categories(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  if (filterCategory && filterCategory !== 'all') {
    query = query.eq('category_id', filterCategory);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function createBlogPost(
  post: Partial<BlogPost>,
  adminId: string
): Promise<BlogPost> {
  const slug = post.title
    ? post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    : `post-${Date.now()}`;

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title: post.title,
      slug,
      category_id: post.category_id,
      target_keywords: post.target_keywords || '',
      tags: post.tags || [],
      featured_image_url: post.featured_image_url || '',
      meta_description: post.meta_description || '',
      status: post.scheduled_publish_at ? 'scheduled' : 'draft',
      auto_publish: post.auto_publish || false,
      scheduled_publish_at: post.scheduled_publish_at || null,
      created_by: adminId,
    })
    .select('*, blog_categories(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlogPost(
  postId: string,
  updates: Partial<BlogPost>,
  adminId: string
): Promise<BlogPost> {
  const updateData: Record<string, unknown> = {
    ...updates,
    updated_by: adminId,
    updated_at: new Date().toISOString(),
  };

  if (updates.title) {
    updateData.slug = updates.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  delete updateData.blog_categories;
  delete updateData.id;
  delete updateData.created_at;

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', postId)
    .select('*, blog_categories(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlogPost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function publishBlogPostNow(postId: string, adminId: string): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select('*, blog_categories(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function generateBlogContent(postId: string, accessToken: string): Promise<{ content: string; excerpt: string; meta_description: string }> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog-post`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ post_id: postId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to generate blog content');
  }

  return response.json();
}

export async function checkAndPublishScheduledPosts(accessToken: string): Promise<number> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog-post`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ check_scheduled: true }),
  });

  if (!response.ok) return 0;

  const result = await response.json();
  return result.published_count || 0;
}

export async function getDashboardStats() {
  const analytics = await getDashboardAnalytics();
  return {
    totalUsers: analytics.users.total,
    activeSubscriptions: analytics.subscriptions.active,
    openTickets: analytics.tickets.open + analytics.tickets.inProgress,
    monthlyRevenue: analytics.payments.monthlyRevenue,
  };
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
