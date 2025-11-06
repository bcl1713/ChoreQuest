import { getButtonVisibility, getRecurrenceLabel, getQuestOpacity } from './quest-card-helpers';

describe('getButtonVisibility', () => {
  describe('Hero view - canAbandon button', () => {
    it('should allow abandoning FAMILY quest with PENDING status', () => {
      const result = getButtonVisibility('PENDING', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(true);
    });

    it('should allow abandoning FAMILY quest with CLAIMED status', () => {
      const result = getButtonVisibility('CLAIMED', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(true);
    });

    it('should allow abandoning FAMILY quest with IN_PROGRESS status', () => {
      const result = getButtonVisibility('IN_PROGRESS', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(true);
    });

    it('should NOT allow abandoning FAMILY quest with COMPLETED status', () => {
      const result = getButtonVisibility('COMPLETED', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow abandoning FAMILY quest with APPROVED status', () => {
      const result = getButtonVisibility('APPROVED', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow abandoning FAMILY quest with AVAILABLE status', () => {
      const result = getButtonVisibility('AVAILABLE', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow abandoning FAMILY quest with EXPIRED status', () => {
      const result = getButtonVisibility('EXPIRED', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow abandoning FAMILY quest with MISSED status', () => {
      const result = getButtonVisibility('MISSED', 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow abandoning INDIVIDUAL quest in any status', () => {
      const statuses = ['PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED'] as const;
      statuses.forEach((status) => {
        const result = getButtonVisibility(status, 'hero', 'INDIVIDUAL');
        expect(result.canAbandon).toBe(false);
      });
    });

    it('should NOT allow abandoning quest when no questType provided (undefined)', () => {
      const result = getButtonVisibility('PENDING', 'hero', undefined);
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow abandoning quest when questType is null', () => {
      const result = getButtonVisibility('PENDING', 'hero', null);
      expect(result.canAbandon).toBe(false);
    });
  });

  describe('GM view - canAbandon button', () => {
    it('should NOT allow GM to abandon FAMILY quest in PENDING status', () => {
      const result = getButtonVisibility('PENDING', 'gm', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow GM to abandon FAMILY quest in CLAIMED status', () => {
      const result = getButtonVisibility('CLAIMED', 'gm', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow GM to abandon FAMILY quest in IN_PROGRESS status', () => {
      const result = getButtonVisibility('IN_PROGRESS', 'gm', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow GM to abandon FAMILY quest in COMPLETED status', () => {
      const result = getButtonVisibility('COMPLETED', 'gm', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should NOT allow GM to abandon INDIVIDUAL quest in any status', () => {
      const statuses = ['PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED'] as const;
      statuses.forEach((status) => {
        const result = getButtonVisibility(status, 'gm', 'INDIVIDUAL');
        expect(result.canAbandon).toBe(false);
      });
    });
  });

  describe('Hero view - other buttons (existing functionality)', () => {
    it('should allow starting PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'hero');
      expect(result.canStart).toBe(true);
    });

    it('should allow starting CLAIMED quest', () => {
      const result = getButtonVisibility('CLAIMED', 'hero');
      expect(result.canStart).toBe(true);
    });

    it('should allow starting AVAILABLE quest', () => {
      const result = getButtonVisibility('AVAILABLE', 'hero');
      expect(result.canStart).toBe(true);
    });

    it('should NOT allow starting COMPLETED quest', () => {
      const result = getButtonVisibility('COMPLETED', 'hero');
      expect(result.canStart).toBe(false);
    });

    it('should allow completing IN_PROGRESS quest', () => {
      const result = getButtonVisibility('IN_PROGRESS', 'hero');
      expect(result.canComplete).toBe(true);
    });

    it('should NOT allow completing PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'hero');
      expect(result.canComplete).toBe(false);
    });

    it('should allow picking up AVAILABLE quest', () => {
      const result = getButtonVisibility('AVAILABLE', 'hero');
      expect(result.canPickup).toBe(true);
    });

    it('should NOT allow picking up PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'hero');
      expect(result.canPickup).toBe(false);
    });
  });

  describe('GM view - other buttons (existing functionality)', () => {
    it('should allow approving COMPLETED quest', () => {
      const result = getButtonVisibility('COMPLETED', 'gm');
      expect(result.canApprove).toBe(true);
    });

    it('should NOT allow approving PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'gm');
      expect(result.canApprove).toBe(false);
    });

    it('should allow denying COMPLETED quest', () => {
      const result = getButtonVisibility('COMPLETED', 'gm');
      expect(result.canDeny).toBe(true);
    });

    it('should NOT allow denying PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'gm');
      expect(result.canDeny).toBe(false);
    });

    it('should allow canceling PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'gm');
      expect(result.canCancel).toBe(true);
    });

    it('should allow canceling IN_PROGRESS quest', () => {
      const result = getButtonVisibility('IN_PROGRESS', 'gm');
      expect(result.canCancel).toBe(true);
    });

    it('should allow canceling AVAILABLE quest', () => {
      const result = getButtonVisibility('AVAILABLE', 'gm');
      expect(result.canCancel).toBe(true);
    });

    it('should allow canceling CLAIMED quest', () => {
      const result = getButtonVisibility('CLAIMED', 'gm');
      expect(result.canCancel).toBe(true);
    });

    it('should NOT allow canceling COMPLETED quest', () => {
      const result = getButtonVisibility('COMPLETED', 'gm');
      expect(result.canCancel).toBe(false);
    });

    it('should show assignment for PENDING quest', () => {
      const result = getButtonVisibility('PENDING', 'gm');
      expect(result.showAssignment).toBe(true);
    });

    it('should show assignment for AVAILABLE quest', () => {
      const result = getButtonVisibility('AVAILABLE', 'gm');
      expect(result.showAssignment).toBe(true);
    });

    it('should show assignment for IN_PROGRESS quest', () => {
      const result = getButtonVisibility('IN_PROGRESS', 'gm');
      expect(result.showAssignment).toBe(true);
    });

    it('should show assignment for CLAIMED quest', () => {
      const result = getButtonVisibility('CLAIMED', 'gm');
      expect(result.showAssignment).toBe(true);
    });

    it('should NOT show assignment for COMPLETED quest', () => {
      const result = getButtonVisibility('COMPLETED', 'gm');
      expect(result.showAssignment).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null status', () => {
      const result = getButtonVisibility(null, 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should handle undefined status', () => {
      const result = getButtonVisibility(undefined, 'hero', 'FAMILY');
      expect(result.canAbandon).toBe(false);
    });

    it('should return all buttons in object', () => {
      const result = getButtonVisibility('PENDING', 'hero', 'FAMILY');
      expect(result).toHaveProperty('canStart');
      expect(result).toHaveProperty('canComplete');
      expect(result).toHaveProperty('canPickup');
      expect(result).toHaveProperty('canAbandon');
      expect(result).toHaveProperty('canApprove');
      expect(result).toHaveProperty('canDeny');
      expect(result).toHaveProperty('canCancel');
      expect(result).toHaveProperty('canTogglePause');
      expect(result).toHaveProperty('showAssignment');
    });
  });
});

describe('getRecurrenceLabel', () => {
  it('should return "Daily" for DAILY pattern', () => {
    const result = getRecurrenceLabel('DAILY');
    expect(result).toBe('Daily');
  });

  it('should return "Weekly" for WEEKLY pattern', () => {
    const result = getRecurrenceLabel('WEEKLY');
    expect(result).toBe('Weekly');
  });

  it('should return "Custom" for CUSTOM pattern', () => {
    const result = getRecurrenceLabel('CUSTOM');
    expect(result).toBe('Custom');
  });

  it('should return null for undefined pattern', () => {
    const result = getRecurrenceLabel(undefined);
    expect(result).toBeNull();
  });

  it('should return null for null pattern', () => {
    const result = getRecurrenceLabel(null);
    expect(result).toBeNull();
  });
});

describe('getQuestOpacity', () => {
  it('should return opacity-60 for paused quest', () => {
    const result = getQuestOpacity(true, 'PENDING');
    expect(result).toBe('opacity-60');
  });

  it('should return opacity-75 for EXPIRED quest', () => {
    const result = getQuestOpacity(false, 'EXPIRED');
    expect(result).toBe('opacity-75');
  });

  it('should return opacity-75 for MISSED quest', () => {
    const result = getQuestOpacity(false, 'MISSED');
    expect(result).toBe('opacity-75');
  });

  it('should return opacity-75 for APPROVED quest', () => {
    const result = getQuestOpacity(false, 'APPROVED');
    expect(result).toBe('opacity-75');
  });

  it('should return opacity-100 for active quest', () => {
    const result = getQuestOpacity(false, 'PENDING');
    expect(result).toBe('opacity-100');
  });

  it('should return opacity-100 for IN_PROGRESS quest', () => {
    const result = getQuestOpacity(false, 'IN_PROGRESS');
    expect(result).toBe('opacity-100');
  });
});
