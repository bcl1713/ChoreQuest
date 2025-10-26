import {
  filterPendingApprovalQuests,
  filterUnassignedActiveQuests,
  filterInProgressQuests,
  filterQuestsByUser,
  filterActiveQuests,
  filterHistoricalQuests,
  filterUnassignedIndividualQuests,
  filterUnassignedFamilyQuests,
  filterQuestsAwaitingApproval,
  filterClaimableFamilyQuests,
  filterOtherQuests,
  getAssignedHeroName,
  mapFamilyCharactersToAssignmentDisplay,
} from '../quest-helpers';
import { QuestInstance, QuestStatus, Character } from '@/lib/types/database';

// Helper to create mock quest
const createMockQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: 'quest-1',
  title: 'Test Quest',
  description: 'Test Description',
  difficulty: 'EASY',
  status: 'PENDING' as QuestStatus,
  xp_reward: 100,
  gold_reward: 50,
  category: 'DAILY',
  created_by_id: 'user-1',
  due_date: null,
  created_at: '2025-01-10',
  updated_at: '2025-01-10',
  recurrence_pattern: null,
  assigned_to_id: null,
  completed_at: null,
  approved_at: null,
  streak_bonus: null,
  streak_count: null,
  volunteer_bonus: null,
  volunteered_by: null,
  template_id: null,
  quest_type: null,
  cycle_start_date: null,
  cycle_end_date: null,
  family_id: 'family-1',
  ...overrides,
});

describe('Quest Helpers', () => {
  describe('mapFamilyCharactersToAssignmentDisplay', () => {
    const baseCharacter: Character = {
      id: 'char-1',
      user_id: 'user-1',
      name: 'Knight Nova',
      class: 'KNIGHT',
      level: 1,
      xp: 0,
      gold: 0,
      gems: 0,
      honor_points: 0,
      avatar_url: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      active_family_quest_id: null,
    };

    it('maps characters to id/name pairs preserving names', () => {
      const result = mapFamilyCharactersToAssignmentDisplay([baseCharacter]);

      expect(result).toEqual([
        {
          id: 'char-1',
          name: 'Knight Nova',
        },
      ]);
    });

    it('falls back to shortened id when name is blank', () => {
      const result = mapFamilyCharactersToAssignmentDisplay([
        { ...baseCharacter, id: 'char-2', name: '   ' },
      ]);

      expect(result[0].name).toBe('Hero (char-2)');
    });
  });

  describe('Quest Filtering Helpers', () => {
  describe('filterPendingApprovalQuests', () => {
    it('returns only COMPLETED quests', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', status: 'COMPLETED' as QuestStatus }),
        createMockQuest({ id: 'quest-2', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-3', status: 'COMPLETED' as QuestStatus }),
        createMockQuest({ id: 'quest-4', status: 'IN_PROGRESS' as QuestStatus }),
      ];

      const result = filterPendingApprovalQuests(quests);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('quest-1');
      expect(result[1].id).toBe('quest-3');
    });

    it('returns empty array when no COMPLETED quests', () => {
      const quests = [
        createMockQuest({ status: 'PENDING' as QuestStatus }),
        createMockQuest({ status: 'IN_PROGRESS' as QuestStatus }),
      ];

      const result = filterPendingApprovalQuests(quests);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterUnassignedActiveQuests', () => {
    it('returns unassigned quests with active statuses', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: null, status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-1', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: null, status: 'IN_PROGRESS' as QuestStatus }),
        createMockQuest({ id: 'quest-4', assigned_to_id: null, status: 'AVAILABLE' as QuestStatus }),
      ];

      const result = filterUnassignedActiveQuests(quests);

      expect(result).toHaveLength(3);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-3', 'quest-4']);
    });

    it('excludes unassigned quests with inactive statuses', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: null, status: 'COMPLETED' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: null, status: 'APPROVED' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: null, status: 'EXPIRED' as QuestStatus }),
        createMockQuest({ id: 'quest-4', assigned_to_id: null, status: 'MISSED' as QuestStatus }),
      ];

      const result = filterUnassignedActiveQuests(quests);

      expect(result).toHaveLength(0);
    });

    it('handles CLAIMED status as active', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: null, status: 'CLAIMED' as QuestStatus }),
      ];

      const result = filterUnassignedActiveQuests(quests);

      expect(result).toHaveLength(1);
    });
  });

  describe('filterInProgressQuests', () => {
    it('returns assigned quests with IN_PROGRESS, CLAIMED, or PENDING status', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1', status: 'IN_PROGRESS' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-1', status: 'CLAIMED' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: 'user-2', status: 'IN_PROGRESS' as QuestStatus }),
        createMockQuest({ id: 'quest-4', assigned_to_id: null, status: 'IN_PROGRESS' as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result).toHaveLength(3);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-2', 'quest-3']);
    });

    it('includes assigned PENDING quests (GM-denied quests awaiting hero action)', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-2', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: null, status: 'PENDING' as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-2']);
    });

    it('excludes unassigned quests', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: null, status: 'IN_PROGRESS' as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result).toHaveLength(0);
    });

    it('excludes assigned quests with other statuses (COMPLETED, AVAILABLE, etc)', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1', status: 'COMPLETED' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-1', status: 'AVAILABLE' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: 'user-1', status: 'APPROVED' as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result).toHaveLength(0);
    });

    it('handles mix of PENDING, CLAIMED, and IN_PROGRESS assigned quests', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-1', status: 'CLAIMED' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: 'user-1', status: 'IN_PROGRESS' as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result).toHaveLength(3);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-2', 'quest-3']);
    });
  });

  describe('filterQuestsByUser', () => {
    it('returns only quests assigned to specified user', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1' }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-2' }),
        createMockQuest({ id: 'quest-3', assigned_to_id: 'user-1' }),
      ];

      const result = filterQuestsByUser(quests, 'user-1');

      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-3']);
    });

    it('returns empty array when userId is undefined', () => {
      const quests = [
        createMockQuest({ assigned_to_id: 'user-1' }),
      ];

      const result = filterQuestsByUser(quests, undefined);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterActiveQuests', () => {
    it('returns only quests with active statuses', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-2', status: 'IN_PROGRESS' as QuestStatus }),
        createMockQuest({ id: 'quest-3', status: 'CLAIMED' as QuestStatus }),
        createMockQuest({ id: 'quest-4', status: 'COMPLETED' as QuestStatus }),
      ];

      const result = filterActiveQuests(quests);

      expect(result).toHaveLength(3);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-2', 'quest-3']);
    });

    it('includes quests with null status', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', status: undefined as unknown as QuestStatus }),
      ];

      const result = filterActiveQuests(quests);

      expect(result).toHaveLength(1);
    });
  });

  describe('filterHistoricalQuests', () => {
    it('returns only quests with historical statuses', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', status: 'COMPLETED' as QuestStatus }),
        createMockQuest({ id: 'quest-2', status: 'APPROVED' as QuestStatus }),
        createMockQuest({ id: 'quest-3', status: 'EXPIRED' as QuestStatus }),
        createMockQuest({ id: 'quest-4', status: 'MISSED' as QuestStatus }),
        createMockQuest({ id: 'quest-5', status: 'PENDING' as QuestStatus }),
      ];

      const result = filterHistoricalQuests(quests);

      expect(result).toHaveLength(4);
    });

    it('sorts historical quests by timestamp (newest first)', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', status: 'COMPLETED' as QuestStatus, completed_at: '2025-01-10' }),
        createMockQuest({ id: 'quest-2', status: 'COMPLETED' as QuestStatus, completed_at: '2025-01-15' }),
        createMockQuest({ id: 'quest-3', status: 'COMPLETED' as QuestStatus, completed_at: '2025-01-12' }),
      ];

      const result = filterHistoricalQuests(quests);

      expect(result.map(q => q.id)).toEqual(['quest-2', 'quest-3', 'quest-1']);
    });
  });

  describe('filterUnassignedIndividualQuests', () => {
    it('returns unassigned individual quests', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: null, quest_type: 'INDIVIDUAL' }),
        createMockQuest({ id: 'quest-2', assigned_to_id: null, quest_type: 'FAMILY' }),
        createMockQuest({ id: 'quest-3', assigned_to_id: 'user-1', quest_type: 'INDIVIDUAL' }),
      ];

      const result = filterUnassignedIndividualQuests(quests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('quest-1');
    });
  });

  describe('filterUnassignedFamilyQuests', () => {
    it('returns unassigned family quests excluding MISSED and EXPIRED', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: null, quest_type: 'FAMILY', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-2', assigned_to_id: null, quest_type: 'FAMILY', status: 'MISSED' as QuestStatus }),
        createMockQuest({ id: 'quest-3', assigned_to_id: null, quest_type: 'FAMILY', status: 'EXPIRED' as QuestStatus }),
      ];

      const result = filterUnassignedFamilyQuests(quests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('quest-1');
    });
  });

  describe('filterQuestsAwaitingApproval', () => {
    it('returns only COMPLETED quests', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', status: 'COMPLETED' as QuestStatus }),
        createMockQuest({ id: 'quest-2', status: 'PENDING' as QuestStatus }),
      ];

      const result = filterQuestsAwaitingApproval(quests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('quest-1');
    });
  });

  describe('filterClaimableFamilyQuests', () => {
    it('returns AVAILABLE family quests', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', quest_type: 'FAMILY', status: 'AVAILABLE' as QuestStatus }),
        createMockQuest({ id: 'quest-2', quest_type: 'FAMILY', status: 'PENDING' as QuestStatus }),
        createMockQuest({ id: 'quest-3', quest_type: 'INDIVIDUAL', status: 'AVAILABLE' as QuestStatus }),
      ];

      const result = filterClaimableFamilyQuests(quests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('quest-1');
    });
  });

  describe('filterOtherQuests', () => {
    it('returns quests assigned to other users', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1' }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-2' }),
        createMockQuest({ id: 'quest-3', assigned_to_id: null }),
      ];

      const result = filterOtherQuests(quests, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('quest-2');
    });

    it('returns all assigned quests when userId is undefined', () => {
      const quests = [
        createMockQuest({ id: 'quest-1', assigned_to_id: 'user-1' }),
        createMockQuest({ id: 'quest-2', assigned_to_id: 'user-2' }),
        createMockQuest({ id: 'quest-3', assigned_to_id: null }),
      ];

      const result = filterOtherQuests(quests, undefined);

      expect(result).toHaveLength(2);
      expect(result.map(q => q.id)).toEqual(['quest-1', 'quest-2']);
    });
  });

  describe('getAssignedHeroName', () => {
    it('returns hero name when found', () => {
      const quest = createMockQuest({ assigned_to_id: 'user-1' });
      const familyMembers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com', family_id: 'family-1', role: 'HERO', created_at: null, updated_at: null },
      ];

      const result = getAssignedHeroName(quest, familyMembers);

      expect(result).toBe('Alice');
    });

    it('returns undefined when hero not found', () => {
      const quest = createMockQuest({ assigned_to_id: 'user-unknown' });
      const familyMembers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com', family_id: 'family-1', role: 'HERO', created_at: null, updated_at: null },
      ];

      const result = getAssignedHeroName(quest, familyMembers);

      expect(result).toBeUndefined();
    });

    it('returns undefined when quest has no assigned user', () => {
      const quest = createMockQuest({ assigned_to_id: null });
      const familyMembers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com', family_id: 'family-1', role: 'HERO', created_at: null, updated_at: null },
      ];

      const result = getAssignedHeroName(quest, familyMembers);

      expect(result).toBeUndefined();
    });
  });
});
});
