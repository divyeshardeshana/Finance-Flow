import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Globe, Eye, EyeOff } from 'lucide-react';
import { getAllQuizQuestions, getAllFAQs, createQuizQuestion, updateQuizQuestion, createFAQ, updateFAQ, deleteQuizQuestion, deleteFAQ } from '../../lib/adminHelpers';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'faqs' | 'website'>('quizzes');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [faqs, setFAQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const { logActivity, hasPermission } = useAdmin();
  const { user } = useAuth();
  const canManage = hasPermission(activeTab === 'quizzes' ? 'manage_quizzes' : 'manage_faqs');

  useEffect(() => {
    // always load FAQs when switching to faqs or website tab
    if (activeTab === 'quizzes') {
      loadContent();
    } else {
      loadContent();
    }
  }, [activeTab]);

  const loadContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'quizzes') {
        const { data } = await getAllQuizQuestions();
        setQuizzes(data || []);
      } else {
        // load FAQs for both 'faqs' and 'website' tabs
        const { data } = await getAllFAQs();
        setFAQs(data || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWebsitePublish = async (faqId: string, current: boolean) => {
    await supabase
      .from('faq_articles')
      .update({ show_on_website: !current })
      .eq('id', faqId);
    setFAQs(prev => prev.map(f => f.id === faqId ? { ...f, show_on_website: !current } : f));
  };

  const startCreate = () => {
    if (activeTab === 'quizzes') {
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'easy',
        category: 'Budgeting',
        points: 10,
        is_active: true,
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'getting_started',
        order_index: faqs.length,
        is_published: true,
        show_on_website: false,
      });
    }
    setShowCreateForm(true);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    setFormData(null);
  };

  const saveContent = async () => {
    if (!formData || !user) return;

    try {
      if (activeTab === 'quizzes') {
        if (editingId) {
          await updateQuizQuestion(editingId, formData, user.id);
          await logActivity('update_quiz_question', 'quiz_question', editingId);
        } else {
          await createQuizQuestion(formData, user.id);
          await logActivity('create_quiz_question', 'quiz_question');
        }
      } else {
        if (editingId) {
          const faqUpdates = {
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            order_index: formData.order_index,
            is_published: formData.is_published,
            show_on_website: formData.show_on_website,
          };
          await updateFAQ(editingId, faqUpdates, user.id);
          await logActivity('update_faq', 'faq_article', editingId);
        } else {
          const faqCreate = {
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            order_index: formData.order_index,
            is_published: formData.is_published,
            show_on_website: formData.show_on_website,
          };
          await createFAQ(faqCreate, user.id);
          await logActivity('create_faq', 'faq_article');
        }
      }

      await loadContent();
      cancelEdit();
    } catch (error: any) {
      console.error('Error saving content:', error);
      alert(`Error saving: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (activeTab === 'quizzes') {
        await deleteQuizQuestion(id);
        await logActivity('delete_quiz_question', 'quiz_question', id);
      } else {
        await deleteFAQ(id);
        await logActivity('delete_faq', 'faq_article', id);
      }

      await loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Error deleting. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-slate-200 dark:border-gray-700">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'quizzes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              Quiz Questions
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'faqs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              FAQ Articles
            </button>
            <button
              onClick={() => setActiveTab('website')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
                activeTab === 'website'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
              }`}
            >
              <Globe size={14} />
              Website
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {activeTab === 'quizzes' ? 'Quiz Questions' : 'FAQ Articles'}
            </h2>
            {canManage && (
              <button
                onClick={startCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add New</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-600 dark:text-gray-400">Loading...</div>
          ) : activeTab === 'website' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                <Globe size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Toggle which FAQ articles appear on the public <strong>/faq</strong> page. Only published FAQs can be shown.
                </p>
              </div>
              {faqs.length === 0 && (
                <p className="text-center py-8 text-slate-500 dark:text-gray-400">No FAQ articles yet. Create some in the FAQ Articles tab first.</p>
              )}
              {faqs.map((faq) => (
                <div key={faq.id} className="flex items-start justify-between border border-slate-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        {faq.category?.replace('_', ' ')}
                      </span>
                      {!faq.is_published && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{faq.question}</p>
                  </div>
                  <button
                    onClick={() => toggleWebsitePublish(faq.id, !!faq.show_on_website)}
                    disabled={!faq.is_published}
                    title={!faq.is_published ? 'Publish the FAQ first before showing on website' : faq.show_on_website ? 'Remove from website' : 'Show on website'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                      faq.show_on_website
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {faq.show_on_website ? <Eye size={13} /> : <EyeOff size={13} />}
                    {faq.show_on_website ? 'Published' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          ) : activeTab === 'quizzes' ? (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900">
                  {editingId === quiz.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="Question"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {formData.options.map((opt: string, idx: number) => (
                          <input
                            key={idx}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[idx] = e.target.value;
                              setFormData({ ...formData, options: newOptions });
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        value={formData.correct_answer}
                        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                        placeholder="Correct Answer"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <textarea
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        placeholder="Explanation"
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <div className="flex space-x-2">
                        <button onClick={saveContent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <Save size={18} className="inline mr-2" />Save
                        </button>
                        <button onClick={cancelEdit} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 dark:text-white">
                          <X size={18} className="inline mr-2" />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                              {quiz.difficulty}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">{quiz.category}</span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">{quiz.points} points</span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">
                              {quiz.usage_count} attempts | {quiz.success_rate}% success
                            </span>
                          </div>
                          <h3 className="font-medium text-slate-900 dark:text-white mb-2">{quiz.question}</h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{quiz.explanation}</p>
                        </div>
                        {canManage && (
                          <div className="flex space-x-2 ml-4">
                            <button onClick={() => startEdit(quiz)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => deleteContent(quiz.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-900">
                  {editingId === faq.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Category</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="getting_started">Getting Started</option>
                            <option value="account">Account</option>
                            <option value="billing">Billing</option>
                            <option value="features">Features</option>
                            <option value="troubleshooting">Troubleshooting</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Order</label>
                          <input
                            type="number"
                            value={formData.order_index}
                            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Question</label>
                        <input
                          type="text"
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          placeholder="Question"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Answer</label>
                        <textarea
                          value={formData.answer}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                          placeholder="Answer"
                          rows={5}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formData.is_published}
                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-300">Published</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formData.show_on_website}
                            onChange={(e) => setFormData({ ...formData, show_on_website: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-300">Show on Website</span>
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={saveContent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          <Save size={15} className="inline mr-1.5" />Save
                        </button>
                        <button onClick={cancelEdit} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 dark:text-white text-sm">
                          <X size={15} className="inline mr-1.5" />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                              {faq.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">
                              {faq.view_count} views | {faq.helpful_count} helpful
                            </span>
                          </div>
                          <h3 className="font-medium text-slate-900 dark:text-white mb-2">{faq.question}</h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">{faq.answer}</p>
                        </div>
                        {canManage && (
                          <div className="flex space-x-2 ml-4">
                            <button onClick={() => startEdit(faq)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => deleteContent(faq.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateForm && formData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Create New {activeTab === 'quizzes' ? 'Quiz Question' : 'FAQ Article'}
            </h3>
            <div className="space-y-3">
              {activeTab === 'quizzes' ? (
                <>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Question"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {formData.options.map((opt: string, idx: number) => (
                      <input
                        key={idx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[idx] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    placeholder="Correct Answer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Explanation"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="getting_started">Getting Started</option>
                        <option value="account">Account</option>
                        <option value="billing">Billing</option>
                        <option value="features">Features</option>
                        <option value="troubleshooting">Troubleshooting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Order Index</label>
                      <input
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Question</label>
                    <input
                      type="text"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="e.g. How do I reset my password?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Answer</label>
                    <textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Write a clear, helpful answer..."
                      rows={5}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.show_on_website}
                        onChange={(e) => setFormData({ ...formData, show_on_website: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                      />
                      <span className="text-sm text-slate-700">Show on Website</span>
                    </label>
                  </div>
                </>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={saveContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 dark:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
