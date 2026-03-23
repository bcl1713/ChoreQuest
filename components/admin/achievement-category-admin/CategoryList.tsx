"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { AdminCategory } from "./useAchievementCategoryAdmin";

interface CategoryListProps {
  categories: AdminCategory[];
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div
        className="text-center py-8 text-gray-400"
        data-testid="category-empty-state"
      >
        <p className="text-lg mb-2">No achievement categories yet</p>
        <p className="text-sm">
          Create your first category to organize achievements.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="category-list">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
            <th className="pb-2 pr-4">Order</th>
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Description</th>
            <th className="pb-2 pr-4">Icon</th>
            <th className="pb-2 pr-4">Achievements</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr
              key={category.id}
              className="border-b border-gray-700/50 text-gray-200"
              data-testid={`category-row-${category.id}`}
            >
              <td className="py-3 pr-4 text-sm text-gray-400">
                {category.display_order ?? 0}
              </td>
              <td className="py-3 pr-4 font-medium">{category.name}</td>
              <td className="py-3 pr-4 text-sm text-gray-400">
                {category.description || "—"}
              </td>
              <td className="py-3 pr-4 text-sm">{category.icon || "—"}</td>
              <td className="py-3 pr-4 text-sm">
                {category.achievement_count}
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => onEdit(category)}
                    variant="secondary"
                    size="sm"
                    data-testid={`edit-category-${category.id}`}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    onClick={() => onDelete(category)}
                    variant="destructive"
                    size="sm"
                    data-testid={`delete-category-${category.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
