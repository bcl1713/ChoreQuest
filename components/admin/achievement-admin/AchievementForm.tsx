"use client";

import { Button } from "@/components/ui";
import type {
  AchievementFormData,
  AdminCategoryOption,
} from "./useAchievementAdmin";

interface AchievementFormProps {
  mode: "create" | "edit";
  formData: AchievementFormData;
  categories: AdminCategoryOption[];
  actionLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (field: keyof AchievementFormData, value: string | boolean) => void;
}

export function AchievementForm({
  mode,
  formData,
  categories,
  actionLoading,
  onSubmit,
  onCancel,
  onChange,
}: AchievementFormProps) {
  const title = mode === "create" ? "Create Achievement" : "Edit Achievement";
  const submitText = mode === "create" ? "Create Achievement" : "Save Changes";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isValid =
    formData.name.trim().length > 0 &&
    formData.category_id.length > 0 &&
    formData.criteria_type.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="fantasy-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        data-testid="achievement-form"
      >
        <h3 className="text-xl font-fantasy text-gold-400 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
              placeholder="e.g., First Quest"
              data-testid="achievement-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
              placeholder="Achievement description"
              rows={2}
              data-testid="achievement-description-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => onChange("category_id", e.target.value)}
                className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                data-testid="achievement-category-select"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => onChange("icon", e.target.value)}
                className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                placeholder="e.g., sword"
                data-testid="achievement-icon-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                XP Reward
              </label>
              <input
                type="number"
                value={formData.xp_reward}
                onChange={(e) => onChange("xp_reward", e.target.value)}
                className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                data-testid="achievement-xp-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Gold Reward
              </label>
              <input
                type="number"
                value={formData.gold_reward}
                onChange={(e) => onChange("gold_reward", e.target.value)}
                className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                data-testid="achievement-gold-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Criteria Type <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.criteria_type}
              onChange={(e) => onChange("criteria_type", e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
              placeholder="e.g., quest_complete"
              data-testid="achievement-criteria-type-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Criteria Config (JSON)
            </label>
            <textarea
              value={formData.criteria_config}
              onChange={(e) => onChange("criteria_config", e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 font-mono text-sm focus:border-gold-500 focus:outline-none"
              placeholder='{"count": 1}'
              rows={3}
              data-testid="achievement-criteria-config-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_hidden"
              checked={formData.is_hidden}
              onChange={(e) => onChange("is_hidden", e.target.checked)}
              className="rounded border-gray-600 bg-dark-700 text-gold-500 focus:ring-gold-500"
              data-testid="achievement-hidden-toggle"
            />
            <label htmlFor="is_hidden" className="text-sm text-gray-300">
              Hidden achievement (shows as &ldquo;???&rdquo; until unlocked)
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <div className="flex-1">
              <Button
                onClick={onCancel}
                disabled={actionLoading}
                variant="secondary"
                size="sm"
                fullWidth
                type="button"
              >
                Cancel
              </Button>
            </div>
            <div className="flex-1">
              <Button
                type="submit"
                disabled={!isValid || actionLoading}
                isLoading={actionLoading}
                variant="gold"
                size="sm"
                fullWidth
                data-testid="achievement-submit-button"
              >
                {submitText}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
