"use client";

import { Button } from "@/components/ui";
import type { AdminCategory } from "./useAchievementCategoryAdmin";

interface DeleteCategoryDialogProps {
  category: AdminCategory;
  isOpen: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCategoryDialog({
  category,
  isOpen,
  isLoading,
  onCancel,
  onConfirm,
}: DeleteCategoryDialogProps) {
  if (!isOpen) return null;

  const hasAchievements = category.achievement_count > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="fantasy-card p-6 max-w-md w-full"
        data-testid="delete-category-dialog"
      >
        <h3 className="text-xl font-fantasy text-red-400 mb-4">
          Delete Category?
        </h3>
        {hasAchievements ? (
          <>
            <p className="text-gray-300 mb-4">
              Cannot delete{" "}
              <span className="font-semibold text-gray-100">
                &ldquo;{category.name}&rdquo;
              </span>{" "}
              because it has{" "}
              <span className="font-semibold text-gold-400">
                {category.achievement_count}
              </span>{" "}
              achievement{category.achievement_count !== 1 ? "s" : ""} assigned.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Remove or reassign achievements before deleting this category.
            </p>
            <Button onClick={onCancel} variant="secondary" size="sm" fullWidth>
              Close
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-100">
                &ldquo;{category.name}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Button
                  onClick={onCancel}
                  disabled={isLoading}
                  variant="secondary"
                  size="sm"
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  onClick={onConfirm}
                  isLoading={isLoading}
                  variant="destructive"
                  size="sm"
                  fullWidth
                  data-testid="confirm-delete-category"
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
