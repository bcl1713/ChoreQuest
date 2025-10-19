'use client';

import React, { useMemo } from 'react';
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

interface QuestSection {
  title: string;
  questIds: string[];
  emptyMessage: string;
  count: number;
}

export function QuestManagementTab() {
  const { quests, loading, error } = useQuests();
  const { familyMembers } = useFamilyMembers();
  useAuth();

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
                // Callbacks will be implemented in subsequent tasks
                // onAssign, onApprove, onCancel, onTogglePause
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

export default QuestManagementTab;
