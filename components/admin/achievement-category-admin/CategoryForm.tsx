"use client";

import { Button } from "@/components/ui";
import type { CategoryFormData } from "./useAchievementCategoryAdmin";

interface CategoryFormProps {
  mode: "create" | "edit";
  formData: CategoryFormData;
  actionLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (field: keyof CategoryFormData, value: string) => void;
}

export function CategoryForm({
  mode,
  formData,
  actionLoading,
  onSubmit,
  onCancel,
  onChange,
}: CategoryFormProps) {
  const title =
    mode === "create" ? "Create Achievement Category" : "Edit Category";
  const submitText = mode === "create" ? "Create Category" : "Save Changes";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="fantasy-card p-6 max-w-md w-full"
        data-testid="category-form"
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
              placeholder="e.g., Adventurer"
              data-testid="category-name-input"
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
              placeholder="Category description"
              rows={2}
              data-testid="category-description-input"
            />
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
              data-testid="category-icon-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => onChange("display_order", e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
              data-testid="category-order-input"
            />
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
                data-testid="category-submit-button"
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
