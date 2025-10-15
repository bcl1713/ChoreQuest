'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRealtime, RealtimeEvent } from '@/lib/realtime-context';
import type {
  QuestTemplate,
  QuestType,
  RecurrencePattern,
  QuestDifficulty,
  ClassBonuses,
  Tables,
} from '@/lib/types/database';
import type { TemplateFormData } from '@/lib/types/quest-templates';
import { User as UserIcon, Users, Repeat, Settings, PlusCircle, Trash2, ShieldAlert } from 'lucide-react';
import { userService } from '@/lib/user-service';
import type { User } from '@/types';

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
            switch(event.action) {
                case 'INSERT':
                    setTemplates(prev => [...prev, event.record as QuestTemplate]);
                    break;
                case 'UPDATE':
                    setTemplates(prev => prev.map(t => t.id === (event.record as QuestTemplate).id ? event.record as QuestTemplate : t));
                    break;
                case 'DELETE': {
                    const deletedRecord = event.old_record as { id?: string } | undefined;
                    if (deletedRecord?.id) {
                        setTemplates(prev => prev.filter(t => t.id !== deletedRecord.id));
                    }
                    break;
                }
            }
        }
    };

    const unsubscribe = onQuestTemplateUpdate(handleRealtimeUpdate);
    return () => unsubscribe();
  }, [onQuestTemplateUpdate]);

  const openCreateModal = () => {
    setSelectedTemplate(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (template: QuestTemplate) => {
    setSelectedTemplate(template);
    setIsFormModalOpen(true);
  };

  const handleFormSave = async (formData: TemplateFormData) => {
    try {
      if (selectedTemplate) {
        // Update
        const { error } = await supabase.from('quest_templates').update(formData).eq('id', selectedTemplate.id);
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
  };

  const handleDeleteTemplate = async (templateId: string, cleanup: boolean) => {
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
  };

  if (loading) return <p>Loading templates...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const individualQuests = templates.filter(t => t.quest_type === 'INDIVIDUAL');
  const familyQuests = templates.filter(t => t.quest_type === 'FAMILY');

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quest Templates</h2>
            <button onClick={openCreateModal} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                <PlusCircle className="mr-2 h-5 w-5" /> Create New
            </button>
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><UserIcon className="mr-2 h-6 w-6 text-purple-400"/> Individual Quests</h3>
                <div className="space-y-4">
                    {individualQuests.map((template) => (
                        <QuestTemplateCard key={template.id} template={template} onEdit={openEditModal} onDelete={setDeleteTarget} />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center"><Users className="mr-2 h-6 w-6 text-green-400"/> Family Quests</h3>
                <div className="space-y-4">
                    {familyQuests.map((template) => (
                        <QuestTemplateCard key={template.id} template={template} onEdit={openEditModal} onDelete={setDeleteTarget} />
                    ))}
                </div>
            </div>
        </div>

        {isFormModalOpen && (
            <QuestTemplateForm 
                template={selectedTemplate} 
                onSave={handleFormSave} 
                onCancel={() => setIsFormModalOpen(false)} 
            />
        )}

        {deleteTarget && (
            <DeleteConfirmationModal 
                template={deleteTarget} 
                onConfirm={handleDeleteTemplate} 
                onCancel={() => setDeleteTarget(null)} 
            />
        )}
    </div>
  );
}

const QuestTemplateCard: React.FC<{ template: QuestTemplate, onEdit: (template: QuestTemplate) => void, onDelete: (template: QuestTemplate) => void }> = ({ template, onEdit, onDelete }) => (
    <div className={`p-4 rounded-lg ${template.is_paused ? 'bg-gray-700 opacity-60' : 'bg-gray-900'}`}>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center space-x-2 mb-2">
                    <Repeat className="h-5 w-5 text-blue-400" />
                    <span className="font-bold text-xl">{template.title}</span>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">{template.recurrence_pattern}</span>
                    {template.quest_type === 'INDIVIDUAL' ? <UserIcon className="h-5 w-5 text-purple-400" /> : <Users className="h-5 w-5 text-green-400" />}
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">{template.quest_type}</span>
                    {template.is_paused && <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">PAUSED</span>}
                </div>
                <p className="text-sm text-gray-400">
                    {template.quest_type === 'INDIVIDUAL'
                        ? `Assigned to: ${(template.assigned_character_ids ?? []).join(', ')}`
                        : 'Claimable by: Any hero'}
                </p>
            </div>
            <button className="text-gray-400 hover:text-white"><Settings className="h-6 w-6" /></button>
        </div>
        <div className="mt-4 flex space-x-2">
            <button onClick={() => onEdit(template)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md">Edit</button>
            <button className={`text-sm text-white py-1 px-3 rounded-md ${template.is_paused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>{template.is_paused ? 'Resume' : 'Pause'}</button>
            <button onClick={() => onDelete(template)} className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md flex items-center"><Trash2 className="h-4 w-4 mr-1"/> Delete</button>
        </div>
    </div>
);

const DeleteConfirmationModal: React.FC<{ template: QuestTemplate, onConfirm: (templateId: string, cleanup: boolean) => void, onCancel: () => void }> = ({ template, onConfirm, onCancel }) => {
    const [cleanup, setCleanup] = useState(false);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-md border border-red-500">
                <div className="flex items-center mb-4"><ShieldAlert className="h-8 w-8 text-red-500 mr-3" /><h2 className="text-2xl font-bold">Delete Quest Template</h2></div>
                <p className="text-gray-300 mb-4">Are you sure you want to delete the template &ldquo;<span className="font-bold">{template.title}</span>&rdquo;? This will stop all future quests from being generated.</p>
                <div className="bg-gray-900 p-4 rounded-md mb-6">
                    <label htmlFor="cleanup" className="flex items-center cursor-pointer">
                        <input type="checkbox" id="cleanup" checked={cleanup} onChange={(e) => setCleanup(e.target.checked)} className="h-4 w-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm">Also delete all current pending/active quest instances from this template.</span>
                    </label>
                </div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Cancel</button>
                    <button onClick={() => onConfirm(template.id, cleanup)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Confirm Delete</button>
                </div>
            </div>
        </div>
    )
}

type QuestTemplateFormTemplate = Partial<TemplateFormData>;

interface QuestTemplateFormProps {
    template?: (QuestTemplate | QuestTemplateFormTemplate) | null;
    onSave: (formData: TemplateFormData) => void;
    onCancel: () => void;
}

const toStringArray = (input: unknown): string[] => {
    if (!Array.isArray(input)) return [];
    return input.filter((value): value is string => typeof value === 'string');
};

export const QuestTemplateForm: React.FC<QuestTemplateFormProps> = ({ template, onSave, onCancel }) => {
    const { profile } = useAuth();
    const [familyMembers, setFamilyMembers] = useState<User[]>([]);
    const [familyCharacters, setFamilyCharacters] = useState<Tables<"characters">[]>([]);
    const [formData, setFormData] = useState<TemplateFormData>({
        title: template?.title ?? '',
        description: template?.description ?? '',
        category: (template?.category as QuestTemplate["category"]) ?? 'DAILY',
        quest_type: (template?.quest_type as QuestType) ?? 'INDIVIDUAL',
        recurrence_pattern: (template?.recurrence_pattern as RecurrencePattern) ?? 'DAILY',
        difficulty: (template?.difficulty as QuestDifficulty) ?? 'MEDIUM',
        xp_reward: template?.xp_reward ?? 50,
        gold_reward: template?.gold_reward ?? 25,
        assigned_character_ids: toStringArray((template as { assigned_character_ids?: unknown })?.assigned_character_ids),
        class_bonuses: (template?.class_bonuses as ClassBonuses | null) ?? null,
    });

    useEffect(() => {
        const loadFamilyMembers = async () => {
            if (!profile?.family_id) return;
            try {
                const members = await userService.getFamilyMembers(profile.family_id);
                setFamilyMembers(members);
                const memberIds = members.map(member => member.id);
                if (memberIds.length > 0) {
                    const { data: charactersData, error: charactersError } = await supabase
                        .from('characters')
                        .select('*')
                        .in('user_id', memberIds);

                    if (charactersError) {
                        throw charactersError;
                    }

                    setFamilyCharacters(charactersData || []);
                } else {
                    setFamilyCharacters([]);
                }
            } catch (err) {
                console.error('Failed to load family members', err);
            }
        };
        loadFamilyMembers();
    }, [profile?.family_id]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => {
            switch (name) {
                case 'title':
                case 'description':
                case 'quest_type':
                case 'difficulty':
                    return { ...prev, [name]: value } as TemplateFormData;
                case 'recurrence_pattern': {
                    const nextCategory = value === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
                    return {
                        ...prev,
                        recurrence_pattern: value as RecurrencePattern,
                        category: nextCategory as QuestTemplate["category"],
                    };
                }
                case 'xp_reward':
                case 'gold_reward':
                    return { ...prev, [name]: Number(value) } as TemplateFormData;
                default:
                    return prev;
            }
        });
    };

    const handleCharacterSelection = (characterId: string) => {
        setFormData(prev => {
            const currentlyAssigned = prev.assigned_character_ids;
            if (currentlyAssigned.includes(characterId)) {
                return { ...prev, assigned_character_ids: currentlyAssigned.filter(id => id !== characterId) };
            } else {
                return { ...prev, assigned_character_ids: [...currentlyAssigned, characterId] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.quest_type === 'INDIVIDUAL' && formData.assigned_character_ids.length === 0) {
            alert('Individual quests must be assigned to at least one character.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">{template ? 'Edit' : 'Create'} Quest Template</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-sm font-semibold uppercase text-gray-300">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Title" className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" required />

                    <label className="block text-sm font-semibold uppercase text-gray-300">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2" rows={3} required></textarea>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold uppercase text-gray-300">Quest Type</label>
                            <select name="quest_type" value={formData.quest_type} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2">
                                <option value="INDIVIDUAL">Individual</option>
                                <option value="FAMILY">Family</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold uppercase text-gray-300">Recurrence</label>
                            <select name="recurrence_pattern" value={formData.recurrence_pattern} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2">
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold uppercase text-gray-300">Difficulty</label>
                            <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2">
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                        <div className="flex items-end text-xs text-gray-400">
                            <p>Category automatically follows the recurrence pattern.</p>
                        </div>
                    </div>

                    <input
                        type="number"
                        name="xp_reward"
                        value={formData.xp_reward}
                        onChange={handleInputChange}
                        placeholder="XP Reward"
                        className="w-full bg-gray-900 border-gray-700 rounded-md"
                        min={0}
                    />
                    <input
                        type="number"
                        name="gold_reward"
                        value={formData.gold_reward}
                        onChange={handleInputChange}
                        placeholder="Gold Reward"
                        className="w-full bg-gray-900 border-gray-700 rounded-md"
                        min={0}
                    />
                    {formData.quest_type === 'INDIVIDUAL' && (
                        <div>
                            <label className="block text-sm font-semibold uppercase text-gray-300 mb-2">Assign to Characters</label>
                            {familyCharacters.length === 0 ? (
                                <p className="text-sm text-gray-400">No characters found for this family.</p>
                            ) : (
                                familyCharacters.map(character => {
                                    const owner = familyMembers.find(member => member.id === character.user_id);
                                    return (
                                        <div key={character.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                id={character.id}
                                                checked={formData.assigned_character_ids.includes(character.id)}
                                                onChange={() => handleCharacterSelection(character.id)}
                                                className="form-checkbox h-4 w-4 text-purple-500"
                                            />
                                            <label htmlFor={character.id}>
                                                {character.name}
                                                {owner ? ` (${owner.name})` : ''}
                                            </label>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Save Template</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
