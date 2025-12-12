"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui";

type ConfirmRoleModalProps = {
  type: "promote" | "demote";
  userName: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testId: string;
};

export function ConfirmRoleModal({
  type,
  userName,
  isOpen,
  onConfirm,
  onCancel,
  testId,
}: ConfirmRoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        data-testid={testId}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full"
      >
        <h3 className="text-xl font-semibold text-white mb-4">
          {type === "promote" ? "Promote to Guild Master?" : "Demote to Hero?"}
        </h3>
        <p className="text-gray-300 mb-6">
          {type === "promote" ? (
            <>
              Are you sure you want to promote{" "}
              <span className="font-semibold text-gold-400">
                {userName}
              </span>{" "}
              to Guild Master? They will gain full administrative access to
              manage quests, rewards, and family settings.
            </>
          ) : (
            <>
              Are you sure you want to demote{" "}
              <span className="font-semibold text-gold-400">
                {userName}
              </span>{" "}
              to Hero? They will lose administrative privileges but remain a
              family member.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <Button
            data-testid="cancel-confirm-button"
            onClick={onCancel}
            variant="secondary"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            data-testid={
              type === "promote"
                ? "confirm-promote-button"
                : "confirm-demote-button"
            }
            onClick={onConfirm}
            variant={type === "promote" ? "gold" : "destructive"}
            size="sm"
          >
            {type === "promote" ? "Promote" : "Demote"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
