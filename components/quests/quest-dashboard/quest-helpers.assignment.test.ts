import { mapFamilyCharactersToAssignmentDisplay, getAssignedHeroName } from "./quest-helpers";
import { Character } from "@/lib/types/database";
import { baseCharacter, createMockQuest } from "./quest-helpers.fixtures";

describe("Quest Helpers - assignment helpers", () => {
  describe("mapFamilyCharactersToAssignmentDisplay", () => {
    it("maps characters by character.id for quest assignment API call", () => {
      const result = mapFamilyCharactersToAssignmentDisplay([baseCharacter]);

      expect(result).toEqual([{ id: "char-1", name: "Knight Nova" }]);
    });

    it("falls back to shortened id when name is blank", () => {
      const result = mapFamilyCharactersToAssignmentDisplay([{ ...baseCharacter, id: "char-2", name: "   " }]);

      expect(result[0]).toEqual({ id: "char-2", name: "Hero (char-2)" });
    });

    it("handles multiple characters mapping to different character IDs", () => {
      const char1 = { ...baseCharacter, id: "char-1", user_id: "user-1", name: "Knight Nova" };
      const char2 = { ...baseCharacter, id: "char-2", user_id: "user-2", name: "Mage Spark" };

      const result = mapFamilyCharactersToAssignmentDisplay([char1, char2]);

      expect(result).toEqual([
        { id: "char-1", name: "Knight Nova" },
        { id: "char-2", name: "Mage Spark" },
      ]);
    });

    it("always uses character.id for API calls", () => {
      const charWithoutUserId = { ...baseCharacter, id: "char-3", user_id: null };

      const result = mapFamilyCharactersToAssignmentDisplay([charWithoutUserId]);

      expect(result).toEqual([{ id: "char-3", name: "Knight Nova" }]);
    });
  });

  describe("getAssignedHeroName", () => {
    const char1: Character = { ...baseCharacter };
    const char2: Character = { ...baseCharacter, id: "char-2", user_id: "user-2", name: "Mage Spark" };

    it("returns hero name when quest.assigned_to_id matches a character user_id", () => {
      const quest = createMockQuest({ assigned_to_id: "user-1" });

      const result = getAssignedHeroName(quest, [char1, char2]);

      expect(result).toBe("Knight Nova");
    });

    it("returns undefined when quest.assigned_to_id does not match any character", () => {
      const quest = createMockQuest({ assigned_to_id: "user-unknown" });

      const result = getAssignedHeroName(quest, [char1, char2]);

      expect(result).toBeUndefined();
    });

    it("returns undefined when quest.assigned_to_id is null", () => {
      const quest = createMockQuest({ assigned_to_id: null });

      const result = getAssignedHeroName(quest, [char1, char2]);

      expect(result).toBeUndefined();
    });

    it("handles empty characters array", () => {
      const quest = createMockQuest({ assigned_to_id: "user-1" });

      const result = getAssignedHeroName(quest, []);

      expect(result).toBeUndefined();
    });

    it("returns fallback shortened character ID when character name is blank", () => {
      const quest = createMockQuest({ assigned_to_id: "user-1" });
      const charWithBlankName: Character = { ...baseCharacter, id: "char-99", name: "   " };

      const result = getAssignedHeroName(quest, [charWithBlankName]);

      expect(result).toBe("Hero (char-99)");
    });

    it("matches assigned_to_id by user_id using first character match", () => {
      const char1a: Character = { ...baseCharacter, id: "char-1a", user_id: "user-1", name: "Knight Nova" };
      const char1b: Character = { ...baseCharacter, id: "char-1b", user_id: "user-1", name: "Duplicate Hero" };
      const quest = createMockQuest({ assigned_to_id: "user-1" });

      const result = getAssignedHeroName(quest, [char1a, char1b]);

      expect(result).toBe("Knight Nova");
    });
  });
});
