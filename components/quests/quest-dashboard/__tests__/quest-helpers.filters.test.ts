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
} from "../quest-helpers";
import { QuestStatus } from "@/lib/types/database";
import { createMockQuest } from "./quest-helpers.fixtures";

describe("Quest Helpers - filters", () => {
  describe("filterPendingApprovalQuests", () => {
    it("returns only COMPLETED quests", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-2", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-3", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-4", status: "IN_PROGRESS" as QuestStatus }),
      ];

      const result = filterPendingApprovalQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-3"]);
    });

    it("returns empty array when no COMPLETED quests", () => {
      const quests = [
        createMockQuest({ status: "PENDING" as QuestStatus }),
        createMockQuest({ status: "IN_PROGRESS" as QuestStatus }),
      ];

      const result = filterPendingApprovalQuests(quests);

      expect(result).toHaveLength(0);
    });
  });

  describe("filterUnassignedActiveQuests", () => {
    it("returns unassigned quests with active statuses", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: null, status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-1", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-3", assigned_to_id: null, status: "IN_PROGRESS" as QuestStatus }),
        createMockQuest({ id: "quest-4", assigned_to_id: null, status: "AVAILABLE" as QuestStatus }),
      ];

      const result = filterUnassignedActiveQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-3", "quest-4"]);
    });

    it("excludes unassigned quests with inactive statuses", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: null, status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-2", assigned_to_id: null, status: "APPROVED" as QuestStatus }),
        createMockQuest({ id: "quest-3", assigned_to_id: null, status: "EXPIRED" as QuestStatus }),
        createMockQuest({ id: "quest-4", assigned_to_id: null, status: "MISSED" as QuestStatus }),
      ];

      const result = filterUnassignedActiveQuests(quests);

      expect(result).toHaveLength(0);
    });

    it("handles CLAIMED status as active", () => {
      const quests = [createMockQuest({ id: "quest-1", assigned_to_id: null, status: "CLAIMED" as QuestStatus })];

      const result = filterUnassignedActiveQuests(quests);

      expect(result).toHaveLength(1);
    });
  });

  describe("filterInProgressQuests", () => {
    it("returns assigned quests with active statuses", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: "user-1", status: "IN_PROGRESS" as QuestStatus }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-1", status: "CLAIMED" as QuestStatus }),
        createMockQuest({ id: "quest-3", assigned_to_id: "user-2", status: "IN_PROGRESS" as QuestStatus }),
        createMockQuest({ id: "quest-4", assigned_to_id: null, status: "IN_PROGRESS" as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-2", "quest-3"]);
    });

    it("includes assigned PENDING quests awaiting hero action", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: "user-1", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-2", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-3", assigned_to_id: null, status: "PENDING" as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-2"]);
    });

    it("excludes unassigned or inactive quests", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: null, status: "IN_PROGRESS" as QuestStatus }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-3", assigned_to_id: "user-1", status: "AVAILABLE" as QuestStatus }),
      ];

      const result = filterInProgressQuests(quests);

      expect(result).toHaveLength(0);
    });
  });

  describe("filterQuestsByUser", () => {
    it("returns only quests assigned to specified user", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: "user-1" }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-2" }),
        createMockQuest({ id: "quest-3", assigned_to_id: "user-1" }),
      ];

      const result = filterQuestsByUser(quests, "user-1");

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-3"]);
    });

    it("returns empty array when userId is undefined", () => {
      const quests = [createMockQuest({ assigned_to_id: "user-1" })];

      const result = filterQuestsByUser(quests, undefined);

      expect(result).toHaveLength(0);
    });
  });

  describe("filterActiveQuests", () => {
    it("returns only quests with active statuses", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-2", status: "IN_PROGRESS" as QuestStatus }),
        createMockQuest({ id: "quest-3", status: "CLAIMED" as QuestStatus }),
        createMockQuest({ id: "quest-4", status: "COMPLETED" as QuestStatus }),
      ];

      const result = filterActiveQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-2", "quest-3"]);
    });

    it("includes quests with null status", () => {
      const quests = [createMockQuest({ id: "quest-1", status: undefined as unknown as QuestStatus })];

      const result = filterActiveQuests(quests);

      expect(result).toHaveLength(1);
    });
  });

  describe("filterHistoricalQuests", () => {
    it("returns only quests with historical statuses", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-2", status: "APPROVED" as QuestStatus }),
        createMockQuest({ id: "quest-3", status: "EXPIRED" as QuestStatus }),
        createMockQuest({ id: "quest-4", status: "MISSED" as QuestStatus }),
        createMockQuest({ id: "quest-5", status: "PENDING" as QuestStatus }),
      ];

      const result = filterHistoricalQuests(quests);

      expect(result).toHaveLength(4);
    });

    it("sorts historical quests by timestamp (newest first)", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus, completed_at: "2025-01-10" }),
        createMockQuest({ id: "quest-2", status: "COMPLETED" as QuestStatus, completed_at: "2025-01-15" }),
        createMockQuest({ id: "quest-3", status: "COMPLETED" as QuestStatus, completed_at: "2025-01-12" }),
      ];

      const result = filterHistoricalQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-2", "quest-3", "quest-1"]);
    });
  });

  describe("filterUnassignedIndividualQuests", () => {
    it("returns unassigned individual quests", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: null, quest_type: "INDIVIDUAL" }),
        createMockQuest({ id: "quest-2", assigned_to_id: null, quest_type: "FAMILY" }),
        createMockQuest({ id: "quest-3", assigned_to_id: "user-1", quest_type: "INDIVIDUAL" }),
      ];

      const result = filterUnassignedIndividualQuests(quests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("quest-1");
    });
  });

  describe("filterUnassignedFamilyQuests", () => {
    it("returns unassigned family quests excluding MISSED and EXPIRED", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: null, quest_type: "FAMILY", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-2", assigned_to_id: null, quest_type: "FAMILY", status: "MISSED" as QuestStatus }),
        createMockQuest({ id: "quest-3", assigned_to_id: null, quest_type: "FAMILY", status: "EXPIRED" as QuestStatus }),
      ];

      const result = filterUnassignedFamilyQuests(quests);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("quest-1");
    });
  });

  describe("filterQuestsAwaitingApproval", () => {
    it("returns only COMPLETED quests", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-2", status: "PENDING" as QuestStatus }),
      ];

      const result = filterQuestsAwaitingApproval(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1"]);
    });
  });

  describe("filterClaimableFamilyQuests", () => {
    it("returns AVAILABLE family quests", () => {
      const quests = [
        createMockQuest({ id: "quest-1", quest_type: "FAMILY", status: "AVAILABLE" as QuestStatus }),
        createMockQuest({ id: "quest-2", quest_type: "FAMILY", status: "PENDING" as QuestStatus }),
        createMockQuest({ id: "quest-3", quest_type: "INDIVIDUAL", status: "AVAILABLE" as QuestStatus }),
      ];

      const result = filterClaimableFamilyQuests(quests);

      expect(result.map((q) => q.id)).toEqual(["quest-1"]);
    });
  });

  describe("filterOtherQuests", () => {
    it("returns quests assigned to other users", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: "user-1" }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-2" }),
        createMockQuest({ id: "quest-3", assigned_to_id: null }),
      ];

      const result = filterOtherQuests(quests, "user-1");

      expect(result.map((q) => q.id)).toEqual(["quest-2"]);
    });

    it("returns all assigned quests when userId is undefined", () => {
      const quests = [
        createMockQuest({ id: "quest-1", assigned_to_id: "user-1" }),
        createMockQuest({ id: "quest-2", assigned_to_id: "user-2" }),
        createMockQuest({ id: "quest-3", assigned_to_id: null }),
      ];

      const result = filterOtherQuests(quests, undefined);

      expect(result.map((q) => q.id)).toEqual(["quest-1", "quest-2"]);
    });
  });
});
