"use client";
import React from "react";
import { motion } from "framer-motion";
import QuestCard from "@/components/quests/quest-card";
import { staggerContainer } from "@/lib/animations/variants";
import type { QuestInstance } from "@/lib/types/database";

interface AssignmentOption {
  id: string;
  name: string;
}

interface QuestManagementSectionProps {
  title: string;
  count: number;
  quests: QuestInstance[];
  emptyMessage: string;
  familyMembers: AssignmentOption[];
  selectedAssignee: Record<string, string>;
  hideAssignment?: boolean;
  getAssignedHeroName: (quest: QuestInstance) => string | undefined;
  onAssigneeChange: (questId: string, userId: string) => void;
  onAssign: (questId: string, characterId: string) => Promise<void>;
  onApprove: (questId: string) => Promise<void>;
  onDeny: (questId: string) => void;
  onCancel: (questId: string) => void;
  onRelease: (questId: string) => void;
}

export function QuestManagementSection({
  title,
  count,
  quests,
  emptyMessage,
  familyMembers,
  selectedAssignee,
  hideAssignment = false,
  getAssignedHeroName,
  onAssigneeChange,
  onAssign,
  onApprove,
  onDeny,
  onCancel,
  onRelease,
}: QuestManagementSectionProps) {
  return (
    <motion.div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        <span className="px-3 py-1 rounded-full bg-gold-600/20 text-gold-200 text-sm font-medium">
          {count}
        </span>
      </div>

      {quests.length === 0 ? (
        <div className="p-6 bg-dark-700/50 border border-dark-600 rounded-lg text-center">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4"
        >
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              viewMode="gm"
              familyMembers={familyMembers}
              assignedHeroName={getAssignedHeroName(quest)}
              selectedAssignee={selectedAssignee[quest.id] || ""}
              onAssigneeChange={onAssigneeChange}
              onAssign={onAssign}
              onApprove={onApprove}
              onDeny={onDeny}
              onCancel={onCancel}
              onRelease={onRelease}
              hideAssignment={hideAssignment}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
