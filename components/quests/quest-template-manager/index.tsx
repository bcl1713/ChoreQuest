'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRealtime, RealtimeEvent } from '@/lib/realtime-context';
import type { QuestTemplate } from '@/lib/types/database';
import type { TemplateFormData } from '@/lib/types/quest-templates';
import { PlusCircle } from 'lucide-react';
import { TemplateList } from './template-list';
import { TemplateForm, QuestTemplateForm } from './template-form';
import { DeleteModal } from './delete-modal';

// Re-export for backwards compatibility
export { QuestTemplateForm };

/**
 * QuestTemplateManager component - Main orchestrator for quest template management
 *
 * Handles:
 * - Loading and displaying quest templates
 * - Creating and editing templates
 * - Deleting templates (with optional cleanup)
 * - Pausing/resuming templates
 * - Real-time updates via Supabase subscriptions
 */
export function QuestTemplateManager() {
  const { profile } = useAuth();
  const { onQuestTemplateUpdate } = useRealtime();

  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestTemplate | null>(null);

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

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const handleRealtimeUpdate = (event: RealtimeEvent) => {
      if (event.table === 'quest_templates') {
        switch (event.action) {
          case 'INSERT':
            setTemplates((prev) => [...prev, event.record as QuestTemplate]);
            break;
          case 'UPDATE':
            setTemplates((prev) =>
              prev.map((t) =>
                t.id === (event.record as QuestTemplate).id ? (event.record as QuestTemplate) : t
              )
            );
            break;
          case 'DELETE': {
            const deletedRecord = event.old_record as { id?: string } | undefined;
            if (deletedRecord?.id) {
              setTemplates((prev) => prev.filter((t) => t.id !== deletedRecord.id));
            }
            break;
          }
        }
      }
    };

    const unsubscribe = onQuestTemplateUpdate(handleRealtimeUpdate);
    return () => unsubscribe();
  }, [onQuestTemplateUpdate]);

  const openCreateModal = useCallback(() => {
    setSelectedTemplate(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((template: QuestTemplate) => {
    setSelectedTemplate(template);
    setIsFormModalOpen(true);
  }, []);

  const handleFormSave = useCallback(
    async (formData: TemplateFormData) => {
      try {
        if (selectedTemplate) {
          // Update
          const { error } = await supabase
            .from('quest_templates')
            .update(formData)
            .eq('id', selectedTemplate.id);
          if (error) throw error;
        } else {
          // Create
          if (!profile?.family_id) {
            throw new Error('Family context not available');
          }
          const { error } = await supabase
            .from('quest_templates')
            .insert({ ...formData, family_id: profile.family_id });
          if (error) throw error;
        }
        setIsFormModalOpen(false);
        setSelectedTemplate(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save template');
      }
    },
    [selectedTemplate, profile?.family_id]
  );

  const handleDeleteTemplate = useCallback(async (templateId: string, cleanup: boolean) => {
    try {
      if (cleanup) {
        await supabase.from('quest_instances').delete().eq('template_id', templateId);
      }
      await supabase.from('quest_templates').delete().eq('id', templateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeleteTarget(null);
    }
  }, []);

  const handleTogglePause = useCallback(async (template: QuestTemplate) => {
    try {
      const { error } = await supabase
        .from('quest_templates')
        .update({ is_paused: !template.is_paused })
        .eq('id', template.id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pause state');
    }
  }, []);

  if (loading) return <p>Loading templates...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quest Templates</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Create New
        </button>
      </div>

      <TemplateList
        templates={templates}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onTogglePause={handleTogglePause}
      />

      {isFormModalOpen && (
        <TemplateForm
          template={selectedTemplate}
          onSave={handleFormSave}
          onCancel={() => setIsFormModalOpen(false)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          template={deleteTarget}
          onConfirm={handleDeleteTemplate}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
