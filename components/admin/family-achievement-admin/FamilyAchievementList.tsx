"use client";

import { Pencil, Trash2, Eye, EyeOff, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import type {
  AdminFamilyAchievement,
  AdminCategoryOption,
} from "./useFamilyAchievementAdmin";

interface FamilyAchievementListProps {
  achievements: AdminFamilyAchievement[];
  categories: AdminCategoryOption[];
  categoryFilter: string;
  onEdit: (achievement: AdminFamilyAchievement) => void;
  onDelete: (id: string) => void;
  onCategoryFilterChange: (categoryId: string) => void;
}

export function FamilyAchievementList({
  achievements,
  categories,
  categoryFilter,
  onEdit,
  onDelete,
  onCategoryFilterChange,
}: FamilyAchievementListProps) {
  return (
    <div data-testid="family-achievement-list">
      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 text-sm focus:border-gold-500 focus:outline-none"
          data-testid="family-achievement-category-filter"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {achievements.length === 0 ? (
        <div
          className="text-center py-8 text-gray-400"
          data-testid="family-achievement-empty-state"
        >
          <p className="text-lg mb-2">No family achievements found</p>
          <p className="text-sm">
            {categoryFilter !== "all"
              ? "No family achievements in this category."
              : "Create your first family achievement to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Hidden</th>
                <th className="pb-2 pr-4">Progress</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((achievement) => {
                const progress = achievement.progress;
                const isUnlocked = !!achievement.unlocked_at;
                return (
                  <tr
                    key={achievement.id}
                    className="border-b border-gray-700/50 text-gray-200"
                    data-testid={`family-achievement-row-${achievement.id}`}
                  >
                    <td className="py-3 pr-4 font-medium">
                      {achievement.name}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-400">
                      {achievement.category_name}
                    </td>
                    <td className="py-3 pr-4">
                      {achievement.is_hidden ? (
                        <EyeOff size={16} className="text-yellow-400" />
                      ) : (
                        <Eye size={16} className="text-gray-500" />
                      )}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-400">
                      {progress
                        ? `${progress.current}/${progress.threshold}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {isUnlocked ? (
                        <CheckCircle
                          size={16}
                          className="text-green-400"
                          data-testid={`unlocked-icon-${achievement.id}`}
                        />
                      ) : (
                        <Clock
                          size={16}
                          className="text-gray-500"
                          data-testid={`locked-icon-${achievement.id}`}
                        />
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button
                          onClick={() => onEdit(achievement)}
                          variant="secondary"
                          size="sm"
                          data-testid={`edit-family-achievement-${achievement.id}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          onClick={() => onDelete(achievement.id)}
                          variant="destructive"
                          size="sm"
                          data-testid={`delete-family-achievement-${achievement.id}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
