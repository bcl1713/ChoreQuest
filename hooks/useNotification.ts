'use client';

import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * Custom hook for managing toast-like notifications
 *
 * @param autoClose - Auto-close timeout in milliseconds (0 = disabled)
 * @returns Object with notification state and control functions
 */
export function useNotification(autoClose = 3000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, type, message };

    setNotifications((prev) => [...prev, notification]);

    // Auto-close if enabled
    if (autoClose > 0) {
      setTimeout(() => {
        dismiss(id);
      }, autoClose);
    }

    return id;
  }, [autoClose, dismiss]);

  const success = useCallback((message: string) => show(message, 'success'), [show]);
  const error = useCallback((message: string) => show(message, 'error'), [show]);
  const info = useCallback((message: string) => show(message, 'info'), [show]);

  return {
    notifications,
    show,
    dismiss,
    success,
    error,
    info,
  };
}
