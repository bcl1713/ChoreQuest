'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation modal component
 * Replaces window.confirm() with a more elegant, themed modal
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fantasy-card max-w-md w-full p-6 bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {isDangerous && (
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDangerous ? 'text-red-400' : 'text-gray-100'
                  }`}
                >
                  {title}
                </h3>
                <p className="text-gray-300 text-sm mb-6">{message}</p>

                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={onCancel}
                    disabled={isLoading}
                    variant="secondary"
                    size="sm"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    variant={isDangerous ? 'destructive' : 'primary'}
                    size="sm"
                  >
                    {isLoading ? '⏳ Processing...' : confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
