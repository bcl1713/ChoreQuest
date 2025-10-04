import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  commonBeforeEach,
} from "./helpers/setup-helpers";
import {
  createCustomQuest,
  createAndCompleteQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { expectInitialCharacterStats } from "./helpers/assertions";

test.describe("Quest Completion Rewards", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("quest creation with rewards", async ({ page }) => {
    await setupUserWithCharacter(page, "RewardTester");

    // Verify initial character stats are zero
    await expectInitialCharacterStats(page);

    // Create quest with rewards
    await createCustomQuest(page, {
      title: "Clean Room Quest",
      description: "Clean your room thoroughly",
      difficulty: "MEDIUM",
      goldReward: 50,
      xpReward: 100,
    });

    // Verify quest appears
    await expect(page.getByText("Clean Room Quest").first()).toBeVisible();
  });

  test("different difficulty multipliers", async ({ page }) => {
    await setupUserWithCharacter(page, "DifficultyTester");
    const timestamp = Date.now();

    // Test EASY quest (base XP with knight bonus: 100 * 1.05 = 105)
    await createAndCompleteQuest(page, {
      title: `Easy Task ${timestamp}`,
      description: "EASY difficulty task",
      difficulty: "EASY",
      xpReward: 100,
    });
    await expect(page.getByText("⚡ 105")).toBeVisible();

    // Test MEDIUM quest (1.5x multiplier: 100 * 1.5 * 1.05 = 157.5 = 157)
    await createAndCompleteQuest(page, {
      title: `Medium Task ${timestamp}`,
      description: "MEDIUM difficulty task",
      difficulty: "MEDIUM",
      xpReward: 100,
    });
    await expect(page.getByText("⚡ 262")).toBeVisible(); // 105 + 157

    // Test HARD quest (2x multiplier: 100 * 2.0 * 1.05 = 210)
    await createAndCompleteQuest(page, {
      title: `Hard Task ${timestamp}`,
      description: "HARD difficulty task",
      difficulty: "HARD",
      xpReward: 100,
    });
    await expect(page.getByText("⚡ 472")).toBeVisible({ timeout: 10000 }); // 262 + 210
  });

  test("character levels up with sufficient XP", async ({ page }) => {
    await setupUserWithCharacter(page, "LevelUpTester");

    await expect(page.getByText("Level 1")).toBeVisible();

    // Create high XP quest to trigger level up
    const timestamp = Date.now();
    await createAndCompleteQuest(page, {
      title: `Epic Level Up Quest ${timestamp}`,
      description: "HARD difficulty task",
      difficulty: "HARD",
      xpReward: 500,
    });

    // 500 * 2.0 * 1.05 = 1050 XP should reach level 5
    await expect(page.getByText("⚡ 1050")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Level 5")).toBeVisible({ timeout: 10000 });
  });

  test("class-specific bonuses apply", async ({ page }) => {
    // MAGE has XP bonus
    await setupUserWithCharacter(page, "ClassTester", {
      characterClass: "MAGE",
    });

    const timestamp = Date.now();
    await createAndCompleteQuest(page, {
      title: `Class Bonus Quest ${timestamp}`,
      description: "EASY difficulty task",
      difficulty: "EASY",
      xpReward: 100,
    });

    // MAGE should get 100 * 1.0 (EASY) * 1.2 (MAGE bonus) = 120 XP
    await expect(page.getByText("⚡ 120")).toBeVisible({ timeout: 10000 });
  });

  test("multi-reward quest updates all stats", async ({ page }) => {
    await setupUserWithCharacter(page, "MultiReward");

    const timestamp = Date.now();
    const questTitle = `Multi-Reward Quest ${timestamp}`;

    // Create quest with both gold and XP rewards
    await createCustomQuest(page, {
      title: questTitle,
      description: "Quest with multiple rewards",
      difficulty: "MEDIUM",
      goldReward: 75,
      xpReward: 150,
    });

    // Complete the quest workflow
    await pickupQuest(page, questTitle);
    await startQuest(page, questTitle);
    await completeQuest(page, questTitle);
    await approveQuest(page, questTitle);

    // Gold: 75 * 1.5 * 1.05 = 118, XP: 150 * 1.5 * 1.05 = 236
    await expect(page.getByText("💰 118")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("⚡ 236")).toBeVisible({ timeout: 10000 });
  });
});

