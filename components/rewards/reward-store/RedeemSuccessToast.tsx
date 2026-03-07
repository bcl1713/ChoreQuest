"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

type RedeemSuccessToastProps = {
  show: boolean;
  rewardName: string;
  onDismiss: () => void;
};

export function RedeemSuccessToast({ show, rewardName, onDismiss }: RedeemSuccessToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl border border-green-400 flex items-center gap-3"
        >
          <CheckCircle className="h-6 w-6" />
          <div>
            <p className="font-semibold">Reward Redeemed!</p>
            <p className="text-sm text-green-100">
              {rewardName}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-green-50 underline decoration-green-200/70 decoration-2 underline-offset-4"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
