"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

type RegenerateInviteModalProps = {
  isOpen: boolean;
  regenerating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RegenerateInviteModal({
  isOpen,
  regenerating,
  onCancel,
  onConfirm,
}: RegenerateInviteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="fantasy-card max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-fantasy text-orange-400 mb-3 flex items-center gap-2">
          <AlertTriangle size={20} />
          Regenerate Invite Code?
        </h3>
        <p className="text-gray-300 mb-6">
          This will create a new invite code and invalidate the current
          one. Anyone with the old code will no longer be able to join
          your family. Existing members will not be affected.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={regenerating}
            variant="gold"
            size="sm"
            fullWidth
            startIcon={<RefreshCw className="h-4 w-4" />}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
