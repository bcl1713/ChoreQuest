import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/family-fixture";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { navigateToDashboard } from "./helpers/navigation-helpers";

function uniqueQuestTitle(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

async function expectHeroStats(
  page: Page,
  stats: { gold?: number; xp?: number },
): Promise<void> {
  await expect(async () => {
    if (typeof stats.gold === "number") {
      const goldText =
        (await page
          .locator('[data-testid="character-gold"]')
          .textContent())?.trim() || "";
      expect(goldText).toBe(`💰 ${stats.gold}`);
    }

    if (typeof stats.xp === "number") {
      const xpText =
        (await page
          .locator('[data-testid="character-xp"]')
          .textContent())?.trim() || "";
      expect(xpText).toBe(`⚡ ${stats.xp}`);
    }
  }).toPass({ timeout: 15000 });
}

test.describe("Hero Reward Display After GM Approval", () => {
  test("Hero receives XP and gold rewards when GM approves quest (separate users)", async ({
    workerFamily,
  }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    await navigateToDashboard(gmPage);

    const heroUser = await createFamilyMember({
      displayName: "Hero Player",
      characterClass: "MAGE",
    });
    const heroPage = heroUser.page;

    await navigateToDashboard(heroPage);

    await expect(heroPage.locator('[data-testid="character-gold"]')).toHaveText(
      "💰 0",
    );
    await expect(heroPage.locator('[data-testid="character-xp"]')).toHaveText(
      "⚡ 0",
    );
    await expect(
      heroPage.locator('[data-testid="character-level"]'),
    ).toContainText("Level 1");

    const questTitle = uniqueQuestTitle("Hero Test Quest");

    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "A quest for the hero to complete",
      difficulty: "MEDIUM",
      goldReward: 100,
      xpReward: 200,
    });

    await heroPage.reload({ waitUntil: "networkidle" });
    await pickupQuest(heroPage, questTitle);
    await startQuest(heroPage, questTitle);
    await completeQuest(heroPage, questTitle);

    await navigateToDashboard(gmPage);
    await approveQuest(gmPage, questTitle);

    await heroPage.reload({ waitUntil: "networkidle" });
    await expectHeroStats(heroPage, { gold: 150, xp: 360 });
  });

  test("multiple Heroes receive correct individual rewards", async ({
    workerFamily,
  }) => {
    test.setTimeout(90000);

    const { gmPage, createFamilyMember } = workerFamily;
    await navigateToDashboard(gmPage);

    const heroOne = await createFamilyMember({
      displayName: "Hero One",
      characterClass: "RANGER",
    });
    const heroTwo = await createFamilyMember({
      displayName: "Hero Two",
      characterClass: "HEALER",
    });

    await navigateToDashboard(heroOne.page);
    await navigateToDashboard(heroTwo.page);

    const heroOneQuestTitle = uniqueQuestTitle("Hero1 Quest");
    const heroTwoQuestTitle = uniqueQuestTitle("Hero2 Quest");

    await createCustomQuest(gmPage, {
      title: heroOneQuestTitle,
      description: "Quest for hero one",
      difficulty: "HARD",
      goldReward: 80,
      xpReward: 150,
    });

    await createCustomQuest(gmPage, {
      title: heroTwoQuestTitle,
      description: "Quest for hero two",
      difficulty: "EASY",
      goldReward: 50,
      xpReward: 100,
    });

    await heroOne.page.reload({ waitUntil: "networkidle" });
    await heroTwo.page.reload({ waitUntil: "networkidle" });
    await pickupQuest(heroOne.page, heroOneQuestTitle);
    await startQuest(heroOne.page, heroOneQuestTitle);
    await completeQuest(heroOne.page, heroOneQuestTitle);

    await pickupQuest(heroTwo.page, heroTwoQuestTitle);
    await startQuest(heroTwo.page, heroTwoQuestTitle);
    await completeQuest(heroTwo.page, heroTwoQuestTitle);

    await navigateToDashboard(gmPage);
    await approveQuest(gmPage, heroOneQuestTitle);
    await approveQuest(gmPage, heroTwoQuestTitle);

    await heroOne.page.reload({ waitUntil: "networkidle" });
    await heroTwo.page.reload({ waitUntil: "networkidle" });

    await expectHeroStats(heroOne.page, { gold: 160, xp: 300 });
    await expectHeroStats(heroTwo.page, { gold: 50, xp: 110 });
  });
});
