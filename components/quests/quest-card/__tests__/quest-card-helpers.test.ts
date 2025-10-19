import { getButtonVisibility, getRecurrenceLabel, getQuestOpacity } from '../quest-card-helpers';
import { QuestStatus } from '@/lib/types/database';

describe('quest-card-helpers', () => {
  describe('getButtonVisibility', () => {
    describe('Hero Mode', () => {
      it('shows Start button for PENDING quest', () => {
        const result = getButtonVisibility('PENDING' as QuestStatus, 'hero');
        expect(result.canStart).toBe(true);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });

      it('shows Start button for AVAILABLE quest', () => {
        const result = getButtonVisibility('AVAILABLE' as QuestStatus, 'hero');
        expect(result.canStart).toBe(true);
        expect(result.canPickup).toBe(true);
      });

      it('does NOT show Start button for CLAIMED quest', () => {
        const result = getButtonVisibility('CLAIMED' as QuestStatus, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
      });

      it('shows Complete button for IN_PROGRESS quest', () => {
        const result = getButtonVisibility('IN_PROGRESS' as QuestStatus, 'hero');
        expect(result.canComplete).toBe(true);
        expect(result.canStart).toBe(false);
      });

      it('does NOT show Complete button for CLAIMED quest', () => {
        const result = getButtonVisibility('CLAIMED' as QuestStatus, 'hero');
        expect(result.canComplete).toBe(false);
      });

      it('hides all buttons for COMPLETED quest', () => {
        const result = getButtonVisibility('COMPLETED' as QuestStatus, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });

      it('hides all buttons for APPROVED quest', () => {
        const result = getButtonVisibility('APPROVED' as QuestStatus, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });

      it('hides all buttons for EXPIRED quest', () => {
        const result = getButtonVisibility('EXPIRED' as QuestStatus, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });

      it('hides all buttons for MISSED quest', () => {
        const result = getButtonVisibility('MISSED' as QuestStatus, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });

      it('handles null status gracefully', () => {
        const result = getButtonVisibility(null, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });

      it('handles undefined status gracefully', () => {
        const result = getButtonVisibility(undefined, 'hero');
        expect(result.canStart).toBe(false);
        expect(result.canComplete).toBe(false);
        expect(result.canPickup).toBe(false);
      });
    });

    describe('GM Mode', () => {
      it('shows Approve button only for COMPLETED quest', () => {
        const result = getButtonVisibility('COMPLETED' as QuestStatus, 'gm');
        expect(result.canApprove).toBe(true);
        expect(result.canCancel).toBe(false);
      });

      it('shows Cancel and Pause buttons for PENDING quest', () => {
        const result = getButtonVisibility('PENDING' as QuestStatus, 'gm');
        expect(result.canCancel).toBe(true);
        expect(result.canTogglePause).toBe(true);
        expect(result.canApprove).toBe(false);
      });

      it('shows Cancel and Pause buttons for IN_PROGRESS quest', () => {
        const result = getButtonVisibility('IN_PROGRESS' as QuestStatus, 'gm');
        expect(result.canCancel).toBe(true);
        expect(result.canTogglePause).toBe(true);
        expect(result.canApprove).toBe(false);
      });

      it('shows Cancel and Pause buttons for AVAILABLE quest', () => {
        const result = getButtonVisibility('AVAILABLE' as QuestStatus, 'gm');
        expect(result.canCancel).toBe(true);
        expect(result.canTogglePause).toBe(true);
      });

      it('shows Cancel and Pause buttons for CLAIMED quest', () => {
        const result = getButtonVisibility('CLAIMED' as QuestStatus, 'gm');
        expect(result.canCancel).toBe(true);
        expect(result.canTogglePause).toBe(true);
      });

      it('hides all action buttons for APPROVED quest', () => {
        const result = getButtonVisibility('APPROVED' as QuestStatus, 'gm');
        expect(result.canApprove).toBe(false);
        expect(result.canCancel).toBe(false);
        expect(result.canTogglePause).toBe(false);
      });

      it('hides all action buttons for EXPIRED quest', () => {
        const result = getButtonVisibility('EXPIRED' as QuestStatus, 'gm');
        expect(result.canApprove).toBe(false);
        expect(result.canCancel).toBe(false);
        expect(result.canTogglePause).toBe(false);
      });

      it('hides all action buttons for MISSED quest', () => {
        const result = getButtonVisibility('MISSED' as QuestStatus, 'gm');
        expect(result.canApprove).toBe(false);
        expect(result.canCancel).toBe(false);
        expect(result.canTogglePause).toBe(false);
      });

      it('shows assignment for PENDING quest', () => {
        const result = getButtonVisibility('PENDING' as QuestStatus, 'gm');
        expect(result.showAssignment).toBe(true);
      });

      it('shows assignment for AVAILABLE quest', () => {
        const result = getButtonVisibility('AVAILABLE' as QuestStatus, 'gm');
        expect(result.showAssignment).toBe(true);
      });

      it('shows assignment for IN_PROGRESS quest', () => {
        const result = getButtonVisibility('IN_PROGRESS' as QuestStatus, 'gm');
        expect(result.showAssignment).toBe(true);
      });

      it('shows assignment for CLAIMED quest', () => {
        const result = getButtonVisibility('CLAIMED' as QuestStatus, 'gm');
        expect(result.showAssignment).toBe(true);
      });

      it('hides assignment for COMPLETED quest', () => {
        const result = getButtonVisibility('COMPLETED' as QuestStatus, 'gm');
        expect(result.showAssignment).toBe(false);
      });

      it('hides assignment for APPROVED quest', () => {
        const result = getButtonVisibility('APPROVED' as QuestStatus, 'gm');
        expect(result.showAssignment).toBe(false);
      });
    });
  });

  describe('getRecurrenceLabel', () => {
    it('returns formatted label for DAILY pattern', () => {
      expect(getRecurrenceLabel('DAILY')).toBe('📅 Daily');
    });

    it('returns formatted label for WEEKLY pattern', () => {
      expect(getRecurrenceLabel('WEEKLY')).toBe('📅 Weekly');
    });

    it('returns formatted label for CUSTOM pattern', () => {
      expect(getRecurrenceLabel('CUSTOM')).toBe('📅 Custom');
    });

    it('returns null for null pattern', () => {
      expect(getRecurrenceLabel(null)).toBeNull();
    });

    it('returns null for undefined pattern', () => {
      expect(getRecurrenceLabel(undefined)).toBeNull();
    });
  });

  describe('getQuestOpacity', () => {
    it('returns reduced opacity for paused quests', () => {
      expect(getQuestOpacity(true, 'PENDING' as QuestStatus)).toBe('opacity-60');
    });

    it('returns reduced opacity for expired quests', () => {
      expect(getQuestOpacity(false, 'EXPIRED' as QuestStatus)).toBe('opacity-75');
    });

    it('returns reduced opacity for missed quests', () => {
      expect(getQuestOpacity(false, 'MISSED' as QuestStatus)).toBe('opacity-75');
    });

    it('returns reduced opacity for approved quests', () => {
      expect(getQuestOpacity(false, 'APPROVED' as QuestStatus)).toBe('opacity-75');
    });

    it('returns full opacity for active quests', () => {
      expect(getQuestOpacity(false, 'PENDING' as QuestStatus)).toBe('opacity-100');
      expect(getQuestOpacity(false, 'IN_PROGRESS' as QuestStatus)).toBe('opacity-100');
      expect(getQuestOpacity(false, 'AVAILABLE' as QuestStatus)).toBe('opacity-100');
      expect(getQuestOpacity(false, 'CLAIMED' as QuestStatus)).toBe('opacity-100');
    });

    it('handles null status', () => {
      expect(getQuestOpacity(false, null)).toBe('opacity-100');
    });

    it('handles undefined status', () => {
      expect(getQuestOpacity(false, undefined)).toBe('opacity-100');
    });

    it('prioritizes paused state over status', () => {
      // Even if expired, paused state should take precedence
      expect(getQuestOpacity(true, 'EXPIRED' as QuestStatus)).toBe('opacity-60');
    });
  });
});
