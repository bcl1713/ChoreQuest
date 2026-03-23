"use client";

import { Pencil, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui";
import type {
  AdminAchievement,
  AdminCategoryOption,
} from "./useAchievementAdmin";

interface AchievementListProps {
  achievements: AdminAchievement[];
  categories: AdminCategoryOption[];
  categoryFilter: string;
  onEdit: (achievement: AdminAchievement) => void;
  onCategoryFilterChange: (categoryId: string) => void;
}

export function AchievementList({
  achievements,
  categories,
  categoryFilter,
  onEdit,
  onCategoryFilterChange,
}: AchievementListProps) {
  return (
    <div data-testid="achievement-list">
      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 text-sm focus:border-gold-500 focus:outline-none"
          data-testid="achievement-category-filter"
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
          data-testid="achievement-empty-state"
        >
          <p className="text-lg mb-2">No achievements found</p>
          <p className="text-sm">
            {categoryFilter !== "all"
              ? "No achievements in this category."
              : "Create your first achievement to get started."}
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
                <th className="pb-2 pr-4">XP</th>
                <th className="pb-2 pr-4">Gold</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((achievement) => (
                <tr
                  key={achievement.id}
                  className="border-b border-gray-700/50 text-gray-200"
                  data-testid={`achievement-row-${achievement.id}`}
                >
                  <td className="py-3 pr-4 font-medium">{achievement.name}</td>
                  <td className="py-3 pr-4 text-sm text-gray-400">
                    {achievement.category_name}
                  </td>
                  <td className="py-3 pr-4">
                    {achievement.is_hidden ? (
                      <EyeOff
                        size={16}
                        className="text-yellow-400"
                        data-testid={`hidden-icon-${achievement.id}`}
                      />
                    ) : (
                      <Eye
                        size={16}
                        className="text-gray-500"
                        data-testid={`visible-icon-${achievement.id}`}
                      />
                    )}
                  </td>
                  <td className="py-3 pr-4 text-sm">
                    {achievement.xp_reward ?? 0}
                  </td>
                  <td className="py-3 pr-4 text-sm">
                    {achievement.gold_reward ?? 0}
                  </td>
                  <td className="py-3">
                    <Button
                      onClick={() => onEdit(achievement)}
                      variant="secondary"
                      size="sm"
                      data-testid={`edit-achievement-${achievement.id}`}
                    >
                      <Pencil size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
