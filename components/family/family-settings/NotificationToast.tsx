"use client";

import { AnimatePresence, motion } from "framer-motion";

type NotificationToastProps = {
  message: string;
  type: "success" | "error";
};

export function NotificationToast({ message, type }: NotificationToastProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-100 text-green-800 border border-green-300"
            : "bg-red-100 text-red-800 border border-red-300"
        }`}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}
