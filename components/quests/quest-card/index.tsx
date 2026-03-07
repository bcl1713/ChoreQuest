"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { QuestInstance } from "@/lib/types/database";
import { staggerItem } from "@/lib/animations/variants";
import { formatPercent } from "@/lib/utils/formatting";
import { getButtonVisibility, getRecurrenceLabel } from "./quest-card-helpers";
import { HeroQuestActions } from "./HeroQuestActions";
import { GmQuestActions } from "./GmQuestActions";
import { QuestMeta } from "./QuestMeta";
import { Button } from "@/components/ui";
import { RealtimeUpdateEffect } from "@/components/animations";

export interface QuestCardProps {
  quest: QuestInstance;
  viewMode: "hero" | "gm";

  // GM action callbacks
  onAssign?: (questId: string, assigneeId: string) => void;
  onApprove?: (questId: string) => void;
  onDeny?: (questId: string) => void;
  onCancel?: (questId: string) => void;
  onRelease?: (questId: string) => void;

  // Hero action callbacks
  onStart?: (questId: string) => void;
  onComplete?: (questId: string) => void;
  onPickup?: (quest: QuestInstance) => void;

  // Assignment options (for GM view)
  familyMembers?: Array<{ id: string; name: string }>;

  // Additional display info
  assignedHeroName?: string;
  selectedAssignee?: string;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;

  // Styling options
  isPaused?: boolean;
  hideAssignment?: boolean;

  // Realtime visual feedback
  showRealtimeEffect?: boolean;

  // Template-specific actions (optional)
  isTemplate?: boolean;
  onEditTemplate?: (questId: string) => void;
  onTogglePauseTemplate?: (questId: string) => void;
  onDeleteTemplate?: (questId: string) => void;
}

const QuestCard: React.FC<QuestCardProps> = memo(
  ({
    quest,
    viewMode,
    onAssign,
    onApprove,
    onDeny,
    onCancel,
    onRelease,
    onStart,
    onComplete,
    onPickup,
    familyMembers = [],
    assignedHeroName,
    selectedAssignee = "",
    onAssigneeChange,
    isPaused = false,
    hideAssignment = false,
    showRealtimeEffect = false,
    isTemplate = false,
    onEditTemplate,
    onTogglePauseTemplate,
    onDeleteTemplate,
  }) => {
    const buttonVis = getButtonVisibility(
      quest.status,
      viewMode,
      quest.quest_type,
    );
    const volunteerBonusPercent = formatPercent(quest.volunteer_bonus);
    const streakBonusPercent = formatPercent(quest.streak_bonus);
    const recurrenceLabel = getRecurrenceLabel(quest.recurrence_pattern);

    return (
      <motion.div
        variants={staggerItem}
        className="fantasy-card p-6 transition-opacity duration-200 relative"
      >
        {/* Realtime update glow effect */}
        <RealtimeUpdateEffect type="glow" active={showRealtimeEffect} />

        {/* Paused overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black opacity-25 rounded-lg pointer-events-none" />
        )}

        {/* Content wrapper */}
        <div className="relative z-10">
          {isPaused && (
            <div className="mb-3">
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
                Unavailable
              </span>
            </div>
          )}

          <QuestMeta
            quest={quest}
            recurrenceLabel={recurrenceLabel}
            volunteerBonusPercent={volunteerBonusPercent}
            streakBonusPercent={streakBonusPercent}
            assignedHeroName={assignedHeroName}
          />

          {viewMode === "hero" && (
            <HeroQuestActions
              quest={quest}
              buttonVis={buttonVis}
              onStart={onStart}
              onComplete={onComplete}
              onPickup={onPickup}
              onRelease={onRelease}
            />
          )}

          {viewMode === "gm" && (
            <GmQuestActions
              quest={quest}
              buttonVis={buttonVis}
              familyMembers={familyMembers}
              hideAssignment={hideAssignment}
              selectedAssignee={selectedAssignee}
              onAssigneeChange={onAssigneeChange}
              onAssign={onAssign}
              onApprove={onApprove}
              onDeny={onDeny}
              onCancel={onCancel}
              onRelease={onRelease}
            />
          )}

          {/* Template-specific action buttons */}
          {isTemplate && (
            <div className="flex flex-wrap gap-2 mt-3">
              {onEditTemplate && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onEditTemplate(quest.id)}
                  data-testid="template-edit-button"
                >
                  Edit
                </Button>
              )}

              {onTogglePauseTemplate && (
                <Button
                  type="button"
                  variant={isPaused ? "success" : "gold"}
                  size="sm"
                  onClick={() => onTogglePauseTemplate(quest.id)}
                  data-testid="template-pause-button"
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              )}

              {onDeleteTemplate && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteTemplate(quest.id)}
                  data-testid="template-delete-button"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  },
);

QuestCard.displayName = "QuestCard";

export default QuestCard;
