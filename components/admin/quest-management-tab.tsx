'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuests } from '@/hooks/useQuests';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/lib/auth-context';
import QuestCard from '@/components/quests/quest-card';
import {
  filterPendingApprovalQuests,
  filterUnassignedActiveQuests,
  filterInProgressQuests,
  getAssignedHeroName,
} from '@/components/quests/quest-dashboard/quest-helpers';
import { staggerContainer } from '@/lib/animations/variants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { questInstanceApiService } from '@/lib/quest-instance-api-service';

interface QuestSection {
  title: string;
  questIds: string[];
  emptyMessage: string;
  count: number;
}

export function QuestManagementTab() {
  const { quests, loading, error, reload } = useQuests();
  const { familyMembers } = useFamilyMembers();
  useAuth();
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});

  // Action handlers with error handling
  const handleAssignQuest = useCallback(
    async (questId: string, userId: string) => {
      if (!userId) return;
      try {
        await questInstanceApiService.assignQuest(questId, userId);
        setSelectedAssignee((prev) => ({ ...prev, [questId]: '' }));
        await reload();
      } catch (err) {
        console.error('Failed to assign quest:', err);
        alert('Failed to assign quest. Please try again.');
      }
    },
    [reload]
  );

  const handleApproveQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.approveQuest(questId);
        await reload();
      } catch (err) {
        console.error('Failed to approve quest:', err);
        alert('Failed to approve quest. Please try again.');
      }
    },
    [reload]
  );

  const handleCancelQuest = useCallback(
    async (questId: string) => {
      if (!window.confirm('Are you sure you want to cancel this quest?')) {
        return;
      }
      try {
        await questInstanceApiService.cancelQuest(questId);
        await reload();
      } catch (err) {
        console.error('Failed to cancel quest:', err);
        alert('Failed to cancel quest. Please try again.');
      }
    },
    [reload]
  );

  const handleTogglePause = useCallback(
    async (questId: string, isPaused: boolean) => {
      try {
        await questInstanceApiService.togglePauseQuest(questId, isPaused);
        await reload();
      } catch (err) {
        console.error('Failed to toggle pause:', err);
        alert('Failed to toggle pause. Please try again.');
      }
    },
    [reload]
  );

  const handleAssigneeChange = useCallback((questId: string, userId: string) => {
    setSelectedAssignee((prev) => ({ ...prev, [questId]: userId }));
  }, []);

  // Memoized quest grouping
  const questSections = useMemo(() => {
    const pendingApproval = filterPendingApprovalQuests(quests);
    const unassigned = filterUnassignedActiveQuests(quests);
    const inProgress = filterInProgressQuests(quests);

    return {
      pendingApproval: {
        title: 'Pending Approval',
        questIds: pendingApproval.map((q) => q.id),
        emptyMessage: 'No quests awaiting approval',
        count: pendingApproval.length,
      },
      unassigned: {
        title: 'Unassigned',
        questIds: unassigned.map((q) => q.id),
        emptyMessage: 'All quests have been assigned',
        count: unassigned.length,
      },
      inProgress: {
        title: 'In Progress',
        questIds: inProgress.map((q) => q.id),
        emptyMessage: 'No quests currently in progress',
        count: inProgress.length,
      },
    };
  }, [quests]);

  // Create a map for quick quest lookup
  const questMap = useMemo(() => {
    const map = new Map(quests.map((q) => [q.id, q]));
    return map;
  }, [quests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
        <h3 className="text-red-200 font-semibold mb-2">Error Loading Quests</h3>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  // Section renderer
  const renderSection = (section: QuestSection) => {
    const sectionQuests = section.questIds
      .map((id) => questMap.get(id))
      .filter((q) => q !== undefined);

    return (
      <motion.div key={section.title} className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-100">{section.title}</h3>
          <span className="px-3 py-1 rounded-full bg-gold-600/20 text-gold-200 text-sm font-medium">
            {section.count}
          </span>
        </div>

        {/* Section Content */}
        {sectionQuests.length === 0 ? (
          <div className="p-6 bg-dark-700/50 border border-dark-600 rounded-lg text-center">
            <p className="text-gray-400">{section.emptyMessage}</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4"
          >
            {sectionQuests.map((quest) => (
              <QuestCard
                key={quest!.id}
                quest={quest!}
                viewMode="gm"
                familyMembers={familyMembers}
                assignedHeroName={getAssignedHeroName(quest!, familyMembers)}
                selectedAssignee={selectedAssignee[quest!.id] || ''}
                onAssigneeChange={handleAssigneeChange}
                onAssign={handleAssignQuest}
                onApprove={handleApproveQuest}
                onCancel={handleCancelQuest}
                onTogglePause={handleTogglePause}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-8" data-testid="quest-management-tab">
      {/* Pending Approval Section */}
      {renderSection(questSections.pendingApproval)}

      <hr className="border-dark-600" />

      {/* Unassigned Section */}
      {renderSection(questSections.unassigned)}

      <hr className="border-dark-600" />

      {/* In Progress Section */}
      {renderSection(questSections.inProgress)}
    </div>
  );
}

