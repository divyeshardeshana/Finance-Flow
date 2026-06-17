import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Eye,
  Pencil,
  Send,
  Trash2,
  Loader2,
  X,
  Calendar,
  Search,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabase';
import {
  type BlogPost,
  type BlogCategory,
  getAllBlogCategories,
  getAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  publishBlogPostNow,
  generateBlogContent,
  checkAndPublishScheduledPosts,
} from '../../lib/adminHelpers';

interface BlogFormData {
  title: string;
  category_id: string;
  target_keywords: string;
  tags: string;
  featured_image_url: string;
  meta_description: string;
  scheduled_publish_at: string;
  auto_publish: boolean;
}

const EMPTY_FORM: BlogFormData = {
  title: '',
  category_id: '',
  target_keywords: '',
  tags: '',
  featured_image_url: '',
  meta_description: '',
  scheduled_publish_at: '',
  auto_publish: false,
};

// UTC ISO string from DB → local datetime string for <input type="datetime-local">
function toLocalDatetimeInput(utcIso: string): string {
  const d = new Date(utcIso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local string (local time, no TZ) → UTC ISO string for DB
function localDatetimeInputToUTC(local: string): string {
  return new Date(local).toISOString();
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function getCategoryBadge(category: BlogCategory | undefined) {
  if (!category) return null;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: category.color }}
    >
      {category.name}
    </span>
  );
}

export default function BlogTab() {
  const { user } = useAuth();
  const { logActivity, hasPermission } = useAdmin();
  const canManage = hasPermission('manage_blog') || hasPermission('manage_settings');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await getAllBlogCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
    try {
      const { data: postsData } = await getAllBlogPosts(filterStatus);
      setPosts(postsData);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const checkScheduled = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const count = await checkAndPublishScheduledPosts(session.access_token);
          if (count > 0) loadData();
        }
      } catch {
        // silent
      }
    };
    checkScheduled();
  }, []);

  const filteredPosts = posts.filter(p =>
    !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      category_id: post.category_id,
      target_keywords: post.target_keywords,
      tags: post.tags.join(', '),
      featured_image_url: post.featured_image_url,
      meta_description: post.meta_description,
      scheduled_publish_at: post.scheduled_publish_at
        ? toLocalDatetimeInput(post.scheduled_publish_at)
        : '',
      auto_publish: post.auto_publish,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.title.trim()) { setFormError('Title is required'); return; }
    if (!formData.category_id) { setFormError('Category is required'); return; }
    if (!formData.target_keywords.trim()) { setFormError('Target keywords are required'); return; }

    setSaving(true);
    setFormError('');

    try {
      const postPayload: Partial<BlogPost> = {
        title: formData.title.trim(),
        category_id: formData.category_id,
        target_keywords: formData.target_keywords.trim(),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        featured_image_url: formData.featured_image_url.trim(),
        meta_description: formData.meta_description.trim(),
        auto_publish: formData.auto_publish,
        scheduled_publish_at: formData.scheduled_publish_at
          ? localDatetimeInputToUTC(formData.scheduled_publish_at)
          : null,
      };

      let savedPost: BlogPost;

      if (editingPost) {
        savedPost = await updateBlogPost(editingPost.id, postPayload, user.id);
        await logActivity('update_blog_post', 'blog_post', editingPost.id);
      } else {
        savedPost = await createBlogPost(postPayload, user.id);
        await logActivity('create_blog_post', 'blog_post', savedPost.id);
      }

      setShowModal(false);
      setSaving(false);
      loadData();

      if (formData.auto_publish) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setGeneratingId(savedPost.id);
          try {
            const result = await generateBlogContent(savedPost.id, session.access_token);
            await updateBlogPost(savedPost.id, {
              content: result.content,
              excerpt: result.excerpt,
              meta_description: result.meta_description || formData.meta_description,
              status: 'published',
              published_at: new Date().toISOString(),
            } as Partial<BlogPost>, user.id);
            await loadData();
          } catch (genErr: any) {
            setGeneratingId(null);
            alert(`Blog post created successfully, but AI content generation failed: ${genErr.message || 'Unknown error'}. You can retry using the AI generate button.`);
          } finally {
            setGeneratingId(null);
          }
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save blog post');
      setSaving(false);
    }
  };

  const handleGenerate = async (post: BlogPost) => {
    if (!user) return;
    setGeneratingId(post.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const result = await generateBlogContent(post.id, session.access_token);
      await updateBlogPost(post.id, {
        content: result.content,
        excerpt: result.excerpt,
        meta_description: result.meta_description || post.meta_description,
      } as Partial<BlogPost>, user.id);
      await logActivity('generate_blog_content', 'blog_post', post.id);
      loadData();
    } catch (err: any) {
      console.error('Error generating content:', err);
      alert(`Failed to generate blog content: ${err?.message || String(err)}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublish = async (post: BlogPost) => {
    if (!user) return;
    if (!post.content) {
      alert('Generate content first before publishing.');
      return;
    }
    setPublishingId(post.id);
    try {
      await publishBlogPostNow(post.id, user.id);
      await logActivity('publish_blog_post', 'blog_post', post.id);
      loadData();
    } catch (err) {
      console.error('Error publishing:', err);
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post.id);
    try {
      await deleteBlogPost(post.id);
      await logActivity('delete_blog_post', 'blog_post', post.id);
      loadData();
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage AI-generated blog posts</p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Create Blog Post
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Blog Posts</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your AI-generated blog posts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar size={40} className="mb-3 opacity-50" />
            <p className="font-medium text-gray-500 dark:text-gray-400">No blog posts found</p>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Create your first blog post to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Published</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{post.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      {getCategoryBadge(post.blog_categories)}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
                        : post.scheduled_publish_at
                          ? `Scheduled: ${new Date(post.scheduled_publish_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}`
                          : '-'
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewPost(post)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => openEditModal(post)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            {!post.content && (
                              <button
                                onClick={() => handleGenerate(post)}
                                disabled={generatingId === post.id}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-yellow-900/20 rounded-md transition-colors disabled:opacity-50"
                                title="Generate content with AI"
                              >
                                {generatingId === post.id
                                  ? <Loader2 size={16} className="animate-spin" />
                                  : <Sparkles size={16} />
                                }
                              </button>
                            )}
                            {post.status !== 'published' && (
                              <button
                                onClick={() => handlePublish(post)}
                                disabled={publishingId === post.id}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
                                title="Publish now"
                              >
                                {publishingId === post.id
                                  ? <Loader2 size={16} className="animate-spin" />
                                  : <Send size={16} />
                                }
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(post)}
                              disabled={deletingId === post.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === post.id
                                ? <Loader2 size={16} className="animate-spin" />
                                : <Trash2 size={16} />
                              }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-md">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
                  placeholder="Enter blog post title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={e => setFormData(d => ({ ...d, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Keywords (SEO) *</label>
                <input
                  type="text"
                  value={formData.target_keywords}
                  onChange={e => setFormData(d => ({ ...d, target_keywords: e.target.value }))}
                  placeholder="budgeting tips, saving money, financial planning"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData(d => ({ ...d, tags: e.target.value }))}
                  placeholder="planning, tips, guide"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Featured Image URL</label>
                <input
                  type="text"
                  value={formData.featured_image_url}
                  onChange={e => setFormData(d => ({ ...d, featured_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description (SEO)</label>
                <textarea
                  value={formData.meta_description}
                  onChange={e => setFormData(d => ({ ...d, meta_description: e.target.value }))}
                  placeholder="Brief description for search engines (optional - will be auto-generated if left empty)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Date & Time (UAE Time - GMT+4)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_publish_at}
                  onChange={e => setFormData(d => ({ ...d, scheduled_publish_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty for schedule later, or select a future date to schedule publication
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(d => ({ ...d, auto_publish: !d.auto_publish }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.auto_publish ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      formData.auto_publish ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-publish immediately</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingPost ? 'Update Blog Post' : 'Create Blog Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preview: {previewPost.title}</h3>
              <button onClick={() => setPreviewPost(null)} className="p-1 hover:bg-gray-100 rounded-md">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {getCategoryBadge(previewPost.blog_categories)}
                {getStatusBadge(previewPost.status)}
                {previewPost.published_at && (
                  <span className="text-xs text-gray-500">
                    Published: {new Date(previewPost.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {previewPost.featured_image_url && (
                <img
                  src={previewPost.featured_image_url}
                  alt={previewPost.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              {previewPost.meta_description && (
                <p className="text-sm text-gray-500 italic mb-4">{previewPost.meta_description}</p>
              )}
              {previewPost.content ? (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {previewPost.content}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Sparkles size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">No content generated yet</p>
                  <p className="text-xs mt-1">Use the AI generate button to create content</p>
                </div>
              )}
              {previewPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {previewPost.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
