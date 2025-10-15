import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  createCustomQuest,
  createAndCompleteQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { navigateToDashboard } from "./helpers/navigation-helpers";
import { expectQuestStatus } from "./helpers/assertions";
import type {
  WorkerFamily,
  EphemeralUser,
  CreateFamilyMemberOptions,
} from "./helpers/family-fixture";

function uniqueQuestName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

async function createFamilyMemberWithRetry(
  workerFamily: WorkerFamily,
  options: CreateFamilyMemberOptions,
): Promise<EphemeralUser> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await workerFamily.createFamilyMember(options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function getNumericStat(page: Page, testId: string): Promise<number> {
  const text =
    (await page.locator(`[data-testid="${testId}"]`).textContent()) || "";
  const numeric = text.replace(/\D/g, "");
  return parseInt(numeric || "0", 10);
}

async function expectStatDelta(
  page: Page,
  testId: string,
  baseline: number,
  expectedDelta: number,
  timeout = 10000,
): Promise<number> {
  let currentValue = baseline;
  await expect(async () => {
    currentValue = await getNumericStat(page, testId);
    expect(currentValue - baseline).toBe(expectedDelta);
  }).toPass({ timeout });
  return currentValue;
}

test.describe("Quest Completion Rewards", () => {
  test("quest creation with rewards", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);

    const questTitle = uniqueQuestName("Clean Room Quest");

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Clean your room thoroughly",
      difficulty: "MEDIUM",
      goldReward: 50,
      xpReward: 100,
    });

    await expect(gmPage.getByText(questTitle).first()).toBeVisible();
  });

  test("different difficulty multipliers", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    let baselineXP = await getNumericStat(gmPage, "character-xp");
    const timestamp = Date.now();

    await createAndCompleteQuest(gmPage, {
      title: `Easy Task ${timestamp}`,
      description: "EASY difficulty task",
      difficulty: "EASY",
      xpReward: 100,
    });
    baselineXP = await expectStatDelta(gmPage, "character-xp", baselineXP, 105);

    await createAndCompleteQuest(gmPage, {
      title: `Medium Task ${timestamp}`,
      description: "MEDIUM difficulty task",
      difficulty: "MEDIUM",
      xpReward: 100,
    });
    baselineXP = await expectStatDelta(
      gmPage,
      "character-xp",
      baselineXP,
      157,
    );

    await createAndCompleteQuest(gmPage, {
      title: `Hard Task ${timestamp}`,
      description: "HARD difficulty task",
      difficulty: "HARD",
      xpReward: 100,
    });
    await expectStatDelta(
      gmPage,
      "character-xp",
      baselineXP,
      210,
    );
  });

  test("character levels up with sufficient XP", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    const baselineXP = await getNumericStat(gmPage, "character-xp");

    const timestamp = Date.now();
    await createAndCompleteQuest(gmPage, {
      title: `Epic Level Up Quest ${timestamp}`,
      description: "HARD difficulty task",
      difficulty: "HARD",
      xpReward: 500,
    });

    await expectStatDelta(gmPage, "character-xp", baselineXP, 1050);
    await expect(gmPage.getByText(/Level \d+/)).toBeVisible();
  });

  test("class-specific bonuses apply", async ({ workerFamily }) => {
    const mageUser = await createFamilyMemberWithRetry(workerFamily, {
      displayName: "Mage Tester",
      characterClass: "MAGE",
    });
    const { gmPage } = workerFamily;
    const { page: magePage } = mageUser;

    await navigateToDashboard(gmPage);
    await navigateToDashboard(magePage);

    const baselineXP = await getNumericStat(magePage, "character-xp");
    const questTitle = uniqueQuestName("Class Bonus Quest");

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "EASY difficulty task",
      difficulty: "EASY",
      xpReward: 100,
    });

    await pickupQuest(magePage, questTitle);
    await startQuest(magePage, questTitle);
    await completeQuest(magePage, questTitle);
    await navigateToDashboard(gmPage);
    await expectQuestStatus(gmPage, questTitle, "COMPLETED");
    await approveQuest(gmPage, questTitle);

    await expectStatDelta(magePage, "character-xp", baselineXP, 120);
  });

  test("multi-reward quest updates all stats", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);

    const baselineXP = await getNumericStat(gmPage, "character-xp");
    const baselineGold = await getNumericStat(gmPage, "character-gold");

    const questTitle = uniqueQuestName("Multi-Reward Quest");

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest with multiple rewards",
      difficulty: "MEDIUM",
      goldReward: 75,
      xpReward: 150,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    await approveQuest(gmPage, questTitle);

    await expectStatDelta(
      gmPage,
      "character-gold",
      baselineGold,
      118,
    );
    await expectStatDelta(
      gmPage,
      "character-xp",
      baselineXP,
      236,
    );
  });
});
