'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Notification } from '@/hooks/useNotification';
import { Check, AlertCircle, Info, X } from 'lucide-react';

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

/**
 * Container component for displaying notifications with animations
 * Replaces alert() for a seamless, non-blocking user experience
 */
export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <AnimatePresence>
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : notification.type === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}
          >
            {notification.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}

            <span className="flex-1 text-sm font-medium">{notification.message}</span>

            <button
              onClick={() => onDismiss(notification.id)}
              className="ml-2 p-1 hover:bg-black/10 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
