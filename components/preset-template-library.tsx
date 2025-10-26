import React, { useEffect, useState } from 'react';
import { presetTemplateApiService } from '@/lib/preset-template-api-service';
import { questTemplateApiService } from '@/lib/quest-template-api-service';
import { QuestTemplateForm } from '@/components/quests/quest-template-manager';
import type { TemplateFormData } from '@/lib/types/quest-templates';
import { presetTemplates, type PresetTemplateCollection, type PresetTemplateDefinition } from '@/lib/preset-templates';
import { Button } from '@/components/ui';

interface PresetTemplateLibraryProps {
  onClose: () => void;
}

const mapPresetToFormData = (template: PresetTemplateDefinition): TemplateFormData => ({
  title: template.name,
  description: template.description,
  category: template.category,
  quest_type: template.quest_type,
  recurrence_pattern: template.recurrence_pattern,
  difficulty: template.difficulty,
  xp_reward: template.xp_reward,
  gold_reward: template.gold_reward,
  assigned_character_ids: [],
  class_bonuses: null,
});

const PresetTemplateLibrary: React.FC<PresetTemplateLibraryProps> = ({ onClose }) => {
  const [presets, setPresets] = useState<PresetTemplateCollection>(presetTemplates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<TemplateFormData | null>(null);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const data = await presetTemplateApiService.getPresetTemplates();
        setPresets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load presets');
      } finally {
        setLoading(false);
      }
    };
    void fetchPresets();
  }, []);

  const handleAddClick = (template: PresetTemplateDefinition) => {
    setSelectedPreset(mapPresetToFormData(template));
    setIsFormOpen(true);
  };

  const handleSavePreset = async (formData: TemplateFormData) => {
    try {
      await questTemplateApiService.createTemplate(formData);
      setIsFormOpen(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template from preset');
    }
  };

  if (loading) return <p>Loading presets...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  if (isFormOpen && selectedPreset) {
    return (
      <QuestTemplateForm
        template={selectedPreset}
        onSave={handleSavePreset}
        onCancel={() => setIsFormOpen(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Preset Template Library</h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {Object.entries(presets).map(([category, templates]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-3">{category}</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.name} className="bg-gray-900 p-4 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-bold">{template.name}</p>
                      <p className="text-sm text-gray-400">{template.description}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs">
                        <span className="px-2 py-1 bg-blue-600 text-white rounded-full">{template.quest_type}</span>
                        <span className="px-2 py-1 bg-purple-600 text-white rounded-full">{template.recurrence_pattern}</span>
                        <span className="px-2 py-1 bg-yellow-600 text-white rounded-full">{template.difficulty}</span>
                        <span className="text-gray-300">{template.xp_reward} XP</span>
                        <span className="text-gray-300">{template.gold_reward} Gold</span>
                      </div>
                    </div>
                    <Button onClick={() => handleAddClick(template)}>
                      Add to Family
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PresetTemplateLibrary;
