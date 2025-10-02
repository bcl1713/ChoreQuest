import { RewardCalculator } from "@/lib/reward-calculator";
import { CharacterClass } from "@/lib/types/database";
import {
  CHARACTER_CLASSES,
  formatBonusPercentage,
  getCharacterClassInfo,
} from "./character-classes";

describe("CHARACTER_CLASSES", () => {
  it("should have all five character classes defined", () => {
    expect(CHARACTER_CLASSES).toHaveLength(5);

    const classIds = CHARACTER_CLASSES.map(c => c.id);
    expect(classIds).toContain("MAGE");
    expect(classIds).toContain("ROGUE");
    expect(classIds).toContain("KNIGHT");
    expect(classIds).toContain("HEALER");
    expect(classIds).toContain("RANGER");
  });

  it("should have all required fields for each class", () => {
    CHARACTER_CLASSES.forEach(classInfo => {
      expect(classInfo.id).toBeDefined();
      expect(classInfo.name).toBeDefined();
      expect(classInfo.description).toBeDefined();
      expect(classInfo.icon).toBeDefined();
      expect(classInfo.bonuses).toBeDefined();
      expect(classInfo.bonuses.xp).toBeDefined();
      expect(classInfo.bonuses.gold).toBeDefined();
      expect(classInfo.bonuses.honor).toBeDefined();
      expect(classInfo.bonuses.gems).toBeDefined();
    });
  });

  describe("bonus multipliers should match RewardCalculator.getClassBonus() exactly", () => {
    const testCases: CharacterClass[] = ["MAGE", "ROGUE", "KNIGHT", "HEALER", "RANGER"];

    testCases.forEach(classId => {
      it(`should have correct bonuses for ${classId}`, () => {
        const classInfo = CHARACTER_CLASSES.find(c => c.id === classId);
        const rewardCalculatorBonus = RewardCalculator.getClassBonus(classId);

        expect(classInfo).toBeDefined();
        expect(classInfo!.bonuses.xp).toBe(rewardCalculatorBonus.xpBonus);
        expect(classInfo!.bonuses.gold).toBe(rewardCalculatorBonus.goldBonus);
        expect(classInfo!.bonuses.honor).toBe(rewardCalculatorBonus.honorBonus);
        expect(classInfo!.bonuses.gems).toBe(rewardCalculatorBonus.gemsBonus);
      });
    });
  });

  describe("specific class bonuses", () => {
    it("MAGE should have +20% XP bonus", () => {
      const mage = CHARACTER_CLASSES.find(c => c.id === "MAGE");
      expect(mage?.bonuses.xp).toBe(1.2);
      expect(mage?.bonuses.gold).toBe(1.0);
      expect(mage?.bonuses.honor).toBe(1.0);
      expect(mage?.bonuses.gems).toBe(1.0);
    });

    it("ROGUE should have +15% Gold bonus", () => {
      const rogue = CHARACTER_CLASSES.find(c => c.id === "ROGUE");
      expect(rogue?.bonuses.xp).toBe(1.0);
      expect(rogue?.bonuses.gold).toBe(1.15);
      expect(rogue?.bonuses.honor).toBe(1.0);
      expect(rogue?.bonuses.gems).toBe(1.0);
    });

    it("KNIGHT should have +5% XP and +5% Gold bonuses", () => {
      const knight = CHARACTER_CLASSES.find(c => c.id === "KNIGHT");
      expect(knight?.bonuses.xp).toBe(1.05);
      expect(knight?.bonuses.gold).toBe(1.05);
      expect(knight?.bonuses.honor).toBe(1.0);
      expect(knight?.bonuses.gems).toBe(1.0);
    });

    it("HEALER should have +10% XP and +25% Honor bonuses", () => {
      const healer = CHARACTER_CLASSES.find(c => c.id === "HEALER");
      expect(healer?.bonuses.xp).toBe(1.1);
      expect(healer?.bonuses.gold).toBe(1.0);
      expect(healer?.bonuses.honor).toBe(1.25);
      expect(healer?.bonuses.gems).toBe(1.0);
    });

    it("RANGER should have +30% Gems bonus", () => {
      const ranger = CHARACTER_CLASSES.find(c => c.id === "RANGER");
      expect(ranger?.bonuses.xp).toBe(1.0);
      expect(ranger?.bonuses.gold).toBe(1.0);
      expect(ranger?.bonuses.honor).toBe(1.0);
      expect(ranger?.bonuses.gems).toBe(1.3);
    });
  });
});

describe("formatBonusPercentage", () => {
  it("should format 1.0 as +0%", () => {
    expect(formatBonusPercentage(1.0)).toBe("+0%");
  });

  it("should format 1.2 as +20%", () => {
    expect(formatBonusPercentage(1.2)).toBe("+20%");
  });

  it("should format 1.15 as +15%", () => {
    expect(formatBonusPercentage(1.15)).toBe("+15%");
  });

  it("should format 1.05 as +5%", () => {
    expect(formatBonusPercentage(1.05)).toBe("+5%");
  });

  it("should format 1.1 as +10%", () => {
    expect(formatBonusPercentage(1.1)).toBe("+10%");
  });

  it("should format 1.25 as +25%", () => {
    expect(formatBonusPercentage(1.25)).toBe("+25%");
  });

  it("should format 1.3 as +30%", () => {
    expect(formatBonusPercentage(1.3)).toBe("+30%");
  });
});

describe("getCharacterClassInfo", () => {
  it("should return class info for MAGE", () => {
    const mage = getCharacterClassInfo("MAGE");
    expect(mage).toBeDefined();
    expect(mage?.id).toBe("MAGE");
    expect(mage?.name).toBe("Mage");
  });

  it("should return class info for ROGUE", () => {
    const rogue = getCharacterClassInfo("ROGUE");
    expect(rogue).toBeDefined();
    expect(rogue?.id).toBe("ROGUE");
    expect(rogue?.name).toBe("Rogue");
  });

  it("should return class info for KNIGHT", () => {
    const knight = getCharacterClassInfo("KNIGHT");
    expect(knight).toBeDefined();
    expect(knight?.id).toBe("KNIGHT");
    expect(knight?.name).toBe("Knight");
  });

  it("should return class info for HEALER", () => {
    const healer = getCharacterClassInfo("HEALER");
    expect(healer).toBeDefined();
    expect(healer?.id).toBe("HEALER");
    expect(healer?.name).toBe("Healer");
  });

  it("should return class info for RANGER", () => {
    const ranger = getCharacterClassInfo("RANGER");
    expect(ranger).toBeDefined();
    expect(ranger?.id).toBe("RANGER");
    expect(ranger?.name).toBe("Ranger");
  });
});
