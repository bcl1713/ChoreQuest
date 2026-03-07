"use client";

import { Button } from "@/components/ui";
import { Reward } from "@/lib/types/database";

type DeleteConfirmationDialogProps = {
  reward: Reward;
  isOpen: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationDialog({
  reward,
  isOpen,
  isLoading,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="fantasy-card p-6 max-w-md w-full"
        data-testid="delete-confirmation-dialog"
      >
        <h3 className="text-xl font-fantasy text-red-400 mb-4">
          ⚠️ Delete Reward?
        </h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-100">
            &ldquo;{reward.name}&rdquo;
          </span>
          ? This action will deactivate the reward.
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
              data-testid="confirm-delete-button"
              variant="destructive"
              size="sm"
              fullWidth
            >
              {isLoading ? "⏳ Deleting..." : "🗑️ Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
