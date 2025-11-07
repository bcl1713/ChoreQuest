'use client';

import { useState, useEffect } from 'react';
import { Character } from '@/lib/types/database';
import { ProfileService, ChangeHistoryEntry } from '@/lib/profile-service';
import { LoadingSpinner } from '@/components/ui';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChangeHistoryListProps {
  character: Character;
}

const ITEMS_PER_PAGE = 10;

export default function ChangeHistoryList({ character }: ChangeHistoryListProps) {
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const historyData = await ProfileService.getChangeHistory(
          character.id,
          ITEMS_PER_PAGE,
          currentPage
        );
        setHistory(historyData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load change history';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [character.id, currentPage]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getChangeTypeLabel = (type: string): string => {
    switch (type) {
      case 'name':
        return 'Character Name';
      case 'class':
        return 'Character Class';
      case 'password':
        return 'Password';
      default:
        return type;
    }
  };

  const getChangeDescription = (entry: ChangeHistoryEntry): string => {
    switch (entry.change_type) {
      case 'name':
        return `${entry.old_value} → ${entry.new_value}`;
      case 'class':
        return `${entry.old_value} → ${entry.new_value}`;
      case 'password':
        return 'Password changed (hidden for security)';
      default:
        return `${entry.old_value} → ${entry.new_value}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 font-semibold">Failed to Load History</p>
          <p className="text-red-300/80 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No changes recorded yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Your profile changes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold-700/30">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gold-400">
                Date
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gold-400">
                Type
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gold-400">
                Change
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gold-400">
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-gold-700/10 hover:bg-dark-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-300">
                  {formatDate(entry.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {getChangeTypeLabel(entry.change_type)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {getChangeDescription(entry)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {entry.gold_cost ? (
                    <span className="text-gold-400 font-semibold">
                      -{entry.gold_cost} gold
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-gold-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <span className="text-sm text-gray-400">Page {currentPage}</span>

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={history.length < ITEMS_PER_PAGE}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-gold-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
