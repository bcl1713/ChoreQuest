import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { QuestTemplate } from '@/lib/types/database';

interface DeleteModalProps {
  template: QuestTemplate;
  onConfirm: (templateId: string, cleanup: boolean) => void;
  onCancel: () => void;
}

/**
 * DeleteModal component - Confirmation dialog for deleting quest templates
 *
 * Provides options to:
 * - Delete the template (stops future quest generation)
 * - Optionally cleanup existing quest instances from the template
 */
export const DeleteModal = React.memo<DeleteModalProps>(({ template, onConfirm, onCancel }) => {
  const [cleanup, setCleanup] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-md border border-red-500">
        <div className="flex items-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-500 mr-3" />
          <h2 className="text-2xl font-bold">Delete Quest Template</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Are you sure you want to delete the template &ldquo;
          <span className="font-bold">{template.title}</span>&rdquo;? This will stop all future
          quests from being generated.
        </p>
        <div className="bg-gray-900 p-4 rounded-md mb-6">
          <label htmlFor="cleanup" className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="cleanup"
              checked={cleanup}
              onChange={(e) => setCleanup(e.target.checked)}
              className="h-4 w-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm">
              Also delete all current pending/active quest instances from this template.
            </span>
          </label>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(template.id, cleanup)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteModal.displayName = 'DeleteModal';
