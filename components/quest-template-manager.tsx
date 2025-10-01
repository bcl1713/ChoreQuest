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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null);

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
        const deletedTemplate = event.old_record as QuestTemplate;
        setTemplates((prev) => prev.filter((t) => t.id !== deletedTemplate.id));
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
    if (!selectedTemplate) return;

    const { error: deleteError } = await supabase
      .from('quest_templates')
      .delete()
      .eq('id', selectedTemplate.id);

    if (deleteError) {
      console.error('Error deleting template:', deleteError);
      setError('Failed to delete template');
    } else {
      setIsDeleteConfirmOpen(false);
      setSelectedTemplate(null);
      // Realtime subscription will handle UI update automatically
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
    <div className="p-6" data-testid="quest-template-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quest Templates</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          data-testid="create-template-button"
        >
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12" data-testid="no-templates-message">
          <p className="text-gray-600">No quest templates found</p>
          <p className="text-sm text-gray-500 mt-2">
            Create your first template to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="template-list">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              data-testid={`template-card-${template.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold" data-testid={`template-title-${template.id}`}>{template.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {template.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {template.category}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      {template.difficulty}
                    </span>
                    <span className="text-gray-600">
                      {template.xp_reward} XP
                    </span>
                    <span className="text-yellow-600">
                      {template.gold_reward} gold
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`px-3 py-1 rounded text-sm ${
                      template.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    data-testid={`template-status-${template.id}`}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() =>
                      template.is_active
                        ? handleToggleActive(template)
                        : handleToggleActive(template)
                    }
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                    data-testid={`template-toggle-${template.id}`}
                  >
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                    data-testid={`template-edit-${template.id}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                    data-testid={`template-delete-${template.id}`}
                  >
                    Delete
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create Quest Template</h2>

              <TemplateForm
                formData={formData}
                setFormData={setFormData}
              />

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  data-testid="save-template-button"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Quest Template</h2>

              <TemplateForm
                formData={formData}
                setFormData={setFormData}
              />

              {/* Preview Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded" data-testid="template-preview">
                <h3 className="font-semibold mb-2">Preview</h3>
                <div className="border rounded p-3 bg-white">
                  <h4 className="font-bold">{formData.title || 'Quest Title'}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.description || 'Quest description...'}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {formData.category}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      {formData.difficulty}
                    </span>
                    <span className="text-gray-600">
                      {formData.xp_reward} XP
                    </span>
                    <span className="text-yellow-600">
                      {formData.gold_reward} gold
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUpdateTemplate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  data-testid="update-template-button"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
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
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="delete-confirm-modal">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this template? This action cannot
              be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteTemplate}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                data-testid="confirm-delete-button"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
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
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          data-testid="template-title-input"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          data-testid="template-description-input"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
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
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            data-testid="template-category-select"
          >
            <option value="DAILY">DAILY</option>
            <option value="WEEKLY">WEEKLY</option>
            <option value="BOSS_BATTLE">BOSS_BATTLE</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium mb-1"
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
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            data-testid="template-difficulty-select"
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="xp_reward" className="block text-sm font-medium mb-1">
            XP Reward
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
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            data-testid="template-xp-input"
            min="0"
          />
        </div>

        <div>
          <label
            htmlFor="gold_reward"
            className="block text-sm font-medium mb-1"
          >
            Gold Reward
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
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
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
