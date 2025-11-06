import { QuestStatus, RecurrencePattern } from '@/lib/types/database';

/**
 * Determines which action buttons should be visible based on quest status and view mode
 *
 * @param status - The quest status
 * @param viewMode - Whether the viewer is a 'hero' or 'gm'
 * @param questType - The quest type ('INDIVIDUAL' or 'FAMILY')
 * @returns Object with boolean flags for button visibility
 */
export const getButtonVisibility = (
  status: QuestStatus | null | undefined,
  viewMode: 'hero' | 'gm',
  questType?: 'INDIVIDUAL' | 'FAMILY' | null | undefined
) => {
  const buttonVis = {
    // Hero mode buttons
    canStart: false,
    canComplete: false,
    canPickup: false,
    canAbandon: false,

    // GM mode buttons
    canApprove: false,
    canDeny: false,
    canCancel: false,
    canTogglePause: false,
    showAssignment: false,
  };

  if (viewMode === 'hero') {
    // Hero can start quests that are PENDING, CLAIMED, or AVAILABLE
    // PENDING = GM-assigned quest without volunteer bonus
    // CLAIMED = Hero-claimed quest with volunteer bonus
    // AVAILABLE = Unassigned individual quests
    buttonVis.canStart = ['PENDING', 'CLAIMED', 'AVAILABLE'].includes(status as QuestStatus);

    // Hero can complete quests that are IN_PROGRESS
    buttonVis.canComplete = status === 'IN_PROGRESS';

    // Hero can pick up AVAILABLE quests (unassigned quests)
    buttonVis.canPickup = status === 'AVAILABLE';

    // Hero can abandon FAMILY quests that are PENDING, CLAIMED, or IN_PROGRESS
    buttonVis.canAbandon = questType === 'FAMILY' &&
      ['PENDING', 'CLAIMED', 'IN_PROGRESS'].includes(status as QuestStatus);
  } else if (viewMode === 'gm') {
    // GM can approve completed quests
    buttonVis.canApprove = status === 'COMPLETED';

    // GM can deny completed quests to send them back to PENDING
    buttonVis.canDeny = status === 'COMPLETED';

    // GM can cancel quests that are not yet approved or expired
    buttonVis.canCancel = ['PENDING', 'IN_PROGRESS', 'AVAILABLE', 'CLAIMED'].includes(status as QuestStatus);

    // GM can toggle pause on active quests
    buttonVis.canTogglePause = ['PENDING', 'IN_PROGRESS', 'AVAILABLE', 'CLAIMED'].includes(status as QuestStatus);

    // GM can assign unassigned quests or reassign in progress quests
    buttonVis.showAssignment = ['PENDING', 'AVAILABLE', 'IN_PROGRESS', 'CLAIMED'].includes(status as QuestStatus);
  }

  return buttonVis;
};

/**
 * Formats a recurrence pattern into a human-readable label
 *
 * @param pattern - The recurrence pattern enum value
 * @returns Formatted label or null if not provided
 */
export const getRecurrenceLabel = (pattern: RecurrencePattern | null | undefined): string | null => {
  if (!pattern) return null;

  switch (pattern) {
    case 'DAILY':
      return 'Daily';
    case 'WEEKLY':
      return 'Weekly';
    case 'CUSTOM':
      return 'Custom';
    default:
      return null;
  }
};

/**
 * Determines if a quest should be displayed in a disabled/grayed state
 *
 * @param isPaused - Whether the quest is paused
 * @param status - The quest status
 * @returns CSS opacity value
 */
export const getQuestOpacity = (isPaused: boolean, status: QuestStatus | null | undefined): string => {
  if (isPaused) {
    return 'opacity-60';
  }

  if (status === 'EXPIRED' || status === 'MISSED' || status === 'APPROVED') {
    return 'opacity-75';
  }

  return 'opacity-100';
};
