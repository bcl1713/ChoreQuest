'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRealtime } from '@/lib/realtime-context';
import type { QuestTemplate } from '@/lib/types/database';

interface TemplateFormData {
  title: string;
  description: string;
  category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  xp_reward: number;
  gold_reward: number;
}

export function QuestTemplateManager() {
  const { profile } = useAuth();
  const { onQuestTemplateUpdate } = useRealtime();

  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestTemplate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    description: '',
    category: 'DAILY',
    difficulty: 'EASY',
    xp_reward: 50,
    gold_reward: 10,
  });

  const loadTemplates = useCallback(async () => {
    if (!profile?.family_id) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('quest_templates')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Failed to load templates');
      console.error('Error loading templates:', fetchError);
    } else {
      setTemplates(data || []);
    }

    setLoading(false);
  }, [profile?.family_id]);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Realtime subscription for template updates
  useEffect(() => {
    const unsubscribe = onQuestTemplateUpdate((event) => {
      if (event.action === 'INSERT') {
        // Add new template to the list
        const newTemplate = event.record as QuestTemplate;
        setTemplates((prev) => {
          // Prevent duplicates by checking if template already exists
          if (prev.some((t) => t.id === newTemplate.id)) {
            return prev;
          }
          return [newTemplate, ...prev];
        });
      } else if (event.action === 'UPDATE') {
        // Update existing template in the list
        const updatedTemplate = event.record as QuestTemplate;
        setTemplates((prev) =>
          prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        );
      } else if (event.action === 'DELETE') {
        // Remove template from the list
        // Use optional chaining since old_record requires REPLICA IDENTITY FULL
        setTemplates((prev) => prev.filter((t) => t.id !== event.old_record?.id));
      }
    });

    return unsubscribe;
  }, [onQuestTemplateUpdate]);

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      category: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 50,
      gold_reward: 10,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (template: QuestTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || '',
      category: template.category as 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE',
      difficulty: template.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
      xp_reward: template.xp_reward,
      gold_reward: template.gold_reward,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateTemplate = async () => {
    if (!profile?.family_id) return;

    const { error: createError } = await supabase
      .from('quest_templates')
      .insert([
        {
          family_id: profile.family_id,
          ...formData,
          class_bonuses: null, // Class bonuses are character-class intrinsic, not quest-specific
        },
      ])
      .select();

    if (createError) {
      console.error('Error creating template:', createError);
      setError('Failed to create template');
    } else {
      setIsCreateModalOpen(false);
      // Realtime subscription will handle UI update automatically
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    const { error: updateError } = await supabase
      .from('quest_templates')
      .update({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        xp_reward: formData.xp_reward,
        gold_reward: formData.gold_reward,
        class_bonuses: null, // Class bonuses are character-class intrinsic, not quest-specific
      })
      .eq('id', selectedTemplate.id)
      .select();

    if (updateError) {
      console.error('Error updating template:', updateError);
      setError('Failed to update template');
    } else {
      setIsEditModalOpen(false);
      setSelectedTemplate(null);
      // Realtime subscription will handle UI update automatically
    }
  };

  const handleToggleActive = async (template: QuestTemplate) => {
    const { error: updateError } = await supabase
      .from('quest_templates')
      .update({ is_active: !template.is_active })
      .eq('id', template.id);

    if (updateError) {
      console.error('Error toggling template:', updateError);
      setError('Failed to toggle template');
    }
    // Realtime subscription will handle UI update automatically
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);
    setError(null);

    try {
      // Templates are blueprints - they can be safely deleted
      // The template_id in quest_instances is just for tracking, not a foreign key
      const { error: deleteError } = await supabase
        .from('quest_templates')
        .delete()
        .eq('id', deleteTarget.id);

      if (deleteError) {
        console.error('Error deleting template:', deleteError);
        setError(`Failed to delete template: ${deleteError.message || 'Unknown error'}`);
      } else {
        requestAnimationFrame(() => {
          setDeleteTarget(null);
        });
      }
    } catch (err) {
      console.error('Unexpected error deleting template:', err);
      setError('Failed to delete template');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadTemplates}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quest-template-manager">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-fantasy text-gray-100">📜 Quest Templates</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white rounded-lg font-medium transition-all shadow-md"
          data-testid="create-template-button"
        >
          ⚡ Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="fantasy-card text-center py-12" data-testid="no-templates-message">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-300 text-lg">No quest templates found</p>
          <p className="text-sm text-gray-500 mt-2">
            Create your first template to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="template-list">
          {templates.map((template) => (
            <div
              key={template.id}
              className="fantasy-card p-6 hover:border-gold-500/50 transition-all"
              data-testid={`template-card-${template.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-fantasy text-gray-100" data-testid={`template-title-${template.id}`}>{template.title}</h3>
                    {!template.is_active && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-400 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    {template.description}
                  </p>
                  <div className="flex gap-3 mt-3 text-sm flex-wrap">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium">
                      {template.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      template.difficulty === 'EASY'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                        : template.difficulty === 'MEDIUM'
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                    }`}>
                      {template.difficulty}
                    </span>
                    <span className="xp-text font-medium">
                      ⚡ {template.xp_reward} XP
                    </span>
                    <span className="gold-text font-medium">
                      💰 {template.gold_reward} gold
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-wrap justify-end">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      template.is_active
                        ? 'bg-dark-600 text-green-400 border border-green-500/50 hover:bg-dark-500'
                        : 'bg-dark-600 text-gray-400 border border-gray-600 hover:bg-dark-500'
                    }`}
                    data-testid={`template-toggle-${template.id}`}
                  >
                    {template.is_active ? '✓ Active' : '○ Inactive'}
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
                    data-testid={`template-edit-${template.id}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteLoading(false);
                      setDeleteTarget(template);
                    }}
                    className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
                    data-testid={`template-delete-${template.id}`}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="create-template-modal">
          <div className="fantasy-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-fantasy text-gray-100 mb-6">⚡ Create Quest Template</h2>

              <TemplateForm
                formData={formData}
                setFormData={setFormData}
              />

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white rounded-lg font-medium transition-all shadow-md"
                  data-testid="save-template-button"
                >
                  💾 Save Template
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-dark-600 text-gray-300 border border-dark-500 rounded-lg hover:bg-dark-500 transition-colors"
                  data-testid="cancel-template-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="edit-template-modal">
          <div className="fantasy-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-fantasy text-gray-100 mb-6">✏️ Edit Quest Template</h2>

              <TemplateForm
                formData={formData}
                setFormData={setFormData}
              />

              {/* Preview Section */}
              <div className="mt-6 p-4 bg-dark-800 border border-dark-600 rounded-lg" data-testid="template-preview">
                <h3 className="font-semibold text-gray-200 mb-3">📋 Preview</h3>
                <div className="fantasy-card p-4">
                  <h4 className="font-fantasy text-lg text-gray-100">{formData.title || 'Quest Title'}</h4>
                  <p className="text-sm text-gray-400 mt-2">
                    {formData.description || 'Quest description...'}
                  </p>
                  <div className="flex gap-2 mt-3 text-xs flex-wrap">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium">
                      {formData.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      formData.difficulty === 'EASY'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                        : formData.difficulty === 'MEDIUM'
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                    }`}>
                      {formData.difficulty}
                    </span>
                    <span className="xp-text font-medium">
                      ⚡ {formData.xp_reward} XP
                    </span>
                    <span className="gold-text font-medium">
                      💰 {formData.gold_reward} gold
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUpdateTemplate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white rounded-lg font-medium transition-all shadow-md"
                  data-testid="update-template-button"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-dark-600 text-gray-300 border border-dark-500 rounded-lg hover:bg-dark-500 transition-colors"
                  data-testid="cancel-edit-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="delete-confirm-modal">
          <div className="fantasy-card max-w-md w-full p-6">
            <h2 className="text-xl font-fantasy text-red-400 mb-4">⚠️ Confirm Delete</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-100">{deleteTarget.title}</span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteTemplate}
                disabled={deleteLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all ${deleteLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md'}`}
                data-testid="confirm-delete-button"
              >
                {deleteLoading ? '⏳ Deleting...' : '🗑️ Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteLoading(false);
                }}
                className="flex-1 px-4 py-2 bg-dark-600 text-gray-300 border border-dark-500 rounded-lg hover:bg-dark-500 transition-colors"
                data-testid="cancel-delete-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Template Form Component
function TemplateForm({
  formData,
  setFormData,
}: {
  formData: TemplateFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateFormData>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
          Quest Title
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          data-testid="template-title-input"
          placeholder="Enter quest title..."
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-200 mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          data-testid="template-description-input"
          placeholder="Describe the quest..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-200 mb-2">
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value as 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE',
              }))
            }
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            data-testid="template-category-select"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BOSS_BATTLE">Boss Battle</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
            value={formData.difficulty}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD',
              }))
            }
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            data-testid="template-difficulty-select"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="xp_reward" className="block text-sm font-medium text-gray-200 mb-2">
            ⚡ XP Reward
          </label>
          <input
            id="xp_reward"
            type="number"
            value={formData.xp_reward}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                xp_reward: parseInt(e.target.value) || 0,
              }))
            }
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            data-testid="template-xp-input"
            min="0"
          />
        </div>

        <div>
          <label
            htmlFor="gold_reward"
            className="block text-sm font-medium text-gray-200 mb-2"
          >
            💰 Gold Reward
          </label>
          <input
            id="gold_reward"
            type="number"
            value={formData.gold_reward}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                gold_reward: parseInt(e.target.value) || 0,
              }))
            }
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            data-testid="template-gold-input"
            min="0"
          />
        </div>
      </div>

      {/* Note: Class bonuses are intrinsic to character classes (defined in RewardCalculator)
          and not customizable per quest template */}
    </div>
  );
}
