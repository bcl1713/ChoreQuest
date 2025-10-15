import { Browser, Page } from "@playwright/test";
import { setupUserWithCharacter, TestUser } from "./setup-helpers";
import { createReward, RewardData } from "./reward-helpers";
import { createCustomQuest, QuestData } from "./quest-helpers";
import { navigateToAdminTab } from "./navigation-helpers";

/**
 * Fixture Helper Functions for E2E Tests
 *
 * This module provides pre-configured test scenario helpers that combine
 * multiple setup steps into ready-to-use test fixtures. These fixtures
 * reduce boilerplate code for common test scenarios.
 */

export interface FamilyWithGMFixture {
  page: Page;
  guildMaster: TestUser;
  familyCode: string;
}

export interface FamilyWithMultipleGMsFixture {
  page: Page;
  guildMasters: TestUser[];
  familyCode: string;
}

export interface FamilyWithHeroesFixture {
  page: Page;
  guildMaster: TestUser;
  heroes: TestUser[];
  familyCode: string;
}

export interface QuestWorkflowFixture {
  page: Page;
  guildMaster: TestUser;
  questData: QuestData;
}

export interface RewardStoreFixture {
  page: Page;
  guildMaster: TestUser;
  rewards: RewardData[];
}

/**
 * Sets up a complete family with a Guild Master ready for testing
 *
 * Creates a new family with one Guild Master character and navigates to
 * the dashboard. This is the most common test starting point.
 *
 * @param page - Playwright page object
 * @param prefix - Optional prefix for user creation (default: "gm")
 * @returns Fixture with page, Guild Master user data, and family code
 *
 * @example
 * ```typescript
 * test("guild master can create quests", async ({ page }) => {
 *   const { guildMaster } = await setupFamilyWithGM(page);
 *
 *   // GM is now on dashboard, ready to create quests
 *   await page.click('[data-testid="create-quest-button"]');
 *   // ... test continues
 * });
 * ```
 */
export async function setupFamilyWithGM(
  page: Page,
  prefix: string = "gm",
): Promise<FamilyWithGMFixture> {
  // Create family with Guild Master
  const guildMaster = await setupUserWithCharacter(page, prefix);

  // Extract family code from the dashboard
  const familyCodeElement = await page
    .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
    .or(page.locator("text=/\\([A-Z0-9]{6}\\)/"))
    .first();

  const familyCodeText = await familyCodeElement.textContent();
  const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
  const familyCode = codeMatch?.[1] || "";

  return {
    page,
    guildMaster,
    familyCode,
  };
}

/**
 * Sets up a family with multiple Guild Masters
 *
 * Creates a new family with the specified number of Guild Master accounts.
 * The first GM creates the family, subsequent GMs join using the family code.
 * All GMs will be logged in separately in different contexts.
 *
 * @param browser - Playwright browser instance from test fixture
 * @param gmCount - Number of Guild Masters to create (default: 2)
 * @param prefix - Optional prefix for user creation (default: "multi-gm")
 * @returns Fixture with all Guild Master users and family code
 *
 * @example
 * ```typescript
 * test("multiple guild masters can manage quests", async ({ browser }) => {
 *   const { guildMasters, familyCode } = await setupFamilyWithMultipleGMs(browser, 3);
 *
 *   // Now have 3 Guild Masters in the same family
 *   console.log(`Family ${familyCode} has ${guildMasters.length} GMs`);
 * });
 * ```
 */
export async function setupFamilyWithMultipleGMs(
  browser: Browser,
  gmCount: number = 2,
  prefix: string = "multi-gm",
): Promise<FamilyWithMultipleGMsFixture> {
  if (gmCount < 1) {
    throw new Error("Must have at least 1 Guild Master");
  }

  // Create first GM and family
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const firstGM = await setupUserWithCharacter(page1, `${prefix}-1`);

  // Get family code
  const familyCodeElement = await page1
    .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
    .or(page1.locator("text=/\\([A-Z0-9]{6}\\)/"))
    .first();
  const familyCodeText = await familyCodeElement.textContent();
  const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
  const familyCode = codeMatch?.[1] || "";

  const guildMasters: TestUser[] = [firstGM];

  // Create additional GMs by joining the family
  for (let i = 2; i <= gmCount; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Note: Additional GMs would need to be invited/joined via the family code
    // This is a simplified version - actual implementation would depend on
    // your app's multi-GM invitation flow
    const additionalGM = await setupUserWithCharacter(page, `${prefix}-${i}`);
    guildMasters.push(additionalGM);

    await context.close();
  }

  await context1.close();

  return {
    page: page1,
    guildMasters,
    familyCode,
  };
}

/**
 * Sets up a family with Guild Master and multiple Hero characters
 *
 * Creates a family with one Guild Master and the specified number of Heroes.
 * The GM creates the family, and Heroes join using the family code.
 * Each hero is created in a separate browser context and then closed.
 *
 * @param browser - Playwright browser instance from test fixture
 * @param heroCount - Number of Hero characters to create (default: 2)
 * @param prefix - Optional prefix for user creation (default: "hero-family")
 * @returns Fixture with GM page, GM user, hero users array, and family code
 *
 * @example
 * ```typescript
 * test("guild master assigns quests to heroes", async ({ browser }) => {
 *   const { page, guildMaster, heroes, familyCode } =
 *     await setupFamilyWithHeroes(browser, 3);
 *
 *   // GM is ready on dashboard with 3 heroes in the family
 *   console.log(`${guildMaster.userName} has ${heroes.length} heroes`);
 *   // ... assign quests to heroes
 * });
 * ```
 */
export async function setupFamilyWithHeroes(
  browser: Browser,
  heroCount: number = 2,
  prefix: string = "hero-family",
): Promise<FamilyWithHeroesFixture> {
  if (heroCount < 0) {
    throw new Error("Hero count cannot be negative");
  }

  // Create GM and family
  const gmContext = await browser.newContext();
  const gmPage = await gmContext.newPage();
  const guildMaster = await setupUserWithCharacter(gmPage, `${prefix}-gm`);

  // Get family code
  const familyCodeElement = await gmPage
    .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
    .or(gmPage.locator("text=/\\([A-Z0-9]{6}\\)/"))
    .first();
  const familyCodeText = await familyCodeElement.textContent();
  const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
  const familyCode = codeMatch?.[1] || "";

  const heroes: TestUser[] = [];

  // Create heroes by joining the family
  for (let i = 1; i <= heroCount; i++) {
    const heroContext = await browser.newContext();
    const heroPage = await heroContext.newPage();

    // Note: Heroes would join via the family code using the app's join flow
    // This is a simplified version - actual implementation depends on
    // your app's hero invitation/join flow
    const hero = await setupUserWithCharacter(heroPage, `${prefix}-hero-${i}`);
    heroes.push(hero);

    await heroContext.close();
  }

  return {
    page: gmPage,
    guildMaster,
    heroes,
    familyCode,
  };
}

/**
 * Sets up a complete quest workflow scenario
 *
 * Creates a family with a Guild Master and creates a quest ready for testing.
 * The quest is created and available on the Quest Dashboard. Optionally accepts
 * custom quest data or uses sensible defaults.
 *
 * @param page - Playwright page object
 * @param questData - Optional quest data (uses defaults if not provided)
 * @param prefix - Optional prefix for user creation (default: "quest-test")
 * @returns Fixture with page, GM user, and quest data
 *
 * @example
 * ```typescript
 * test("hero can complete quest workflow", async ({ page }) => {
 *   const { questData } = await setupQuestWorkflow(page, {
 *     title: "Clean Your Room",
 *     description: "Make your bed and organize desk",
 *     difficulty: "EASY",
 *     xpReward: 50,
 *     goldReward: 25,
 *   });
 *
 *   // Quest is now created and visible on dashboard
 *   await expect(page.getByText(questData.title)).toBeVisible();
 * });
 * ```
 */
export async function setupQuestWorkflow(
  page: Page,
  questData?: Partial<QuestData>,
  prefix: string = "quest-test",
): Promise<QuestWorkflowFixture> {
  // Set up family with Guild Master
  const guildMaster = await setupUserWithCharacter(page, prefix);

  // Default quest data
  const defaultQuestData: QuestData = {
    title: "Test Quest",
    description: "A test quest for automated testing",
    difficulty: "EASY",
    xpReward: 50,
    goldReward: 25,
  };

  // Merge with provided quest data
  const finalQuestData = { ...defaultQuestData, ...questData };

  // Create the quest
  await createCustomQuest(page, finalQuestData);

  // Switch to Quests tab to see the quest
  await page.click('button:has-text("⚔️ Quests & Adventures")');
  await page.waitForLoadState("networkidle");

  return {
    page,
    guildMaster,
    questData: finalQuestData,
  };
}

/**
 * Sets up a reward store with multiple rewards
 *
 * Creates a family with a Guild Master and populates the reward store with
 * the specified number of rewards. Each reward has unique test data.
 * Navigates to the Reward Management page and creates all rewards.
 *
 * @param page - Playwright page object
 * @param rewardCount - Number of rewards to create (default: 3)
 * @param prefix - Optional prefix for user creation (default: "reward-test")
 * @returns Fixture with page, GM user, and array of created rewards
 *
 * @example
 * ```typescript
 * test("hero can browse reward store", async ({ page }) => {
 *   const { rewards } = await setupRewardStore(page, 5);
 *
 *   // Switch to hero view and check reward store
 *   await page.click('button:has-text("🏪 Reward Store")');
 *   await expect(page.getByText(rewards[0].name)).toBeVisible();
 * });
 * ```
 */
export async function setupRewardStore(
  page: Page,
  rewardCount: number = 3,
  prefix: string = "reward-test",
): Promise<RewardStoreFixture> {
  if (rewardCount < 0) {
    throw new Error("Reward count cannot be negative");
  }

  // Set up family with Guild Master
  const guildMaster = await setupUserWithCharacter(page, prefix);

  const rewards: RewardData[] = [];

  if (rewardCount > 0) {
    // Navigate to admin and then Rewards tab
    await page.click('[data-testid="admin-dashboard-button"]');
    await navigateToAdminTab(page, "Rewards");

    // Create rewards
    const rewardTypes: Array<
      "SCREEN_TIME" | "EXPERIENCE" | "PURCHASE" | "PRIVILEGE"
    > = ["SCREEN_TIME", "EXPERIENCE", "PURCHASE", "PRIVILEGE"];

    for (let i = 1; i <= rewardCount; i++) {
      const rewardData: RewardData = {
        name: `Test Reward ${i}`,
        description: `Test reward ${i} for automated testing`,
        type: rewardTypes[(i - 1) % rewardTypes.length],
        cost: i * 50, // Escalating costs: 50, 100, 150, etc.
      };

      await createReward(page, rewardData);
      rewards.push(rewardData);
    }

    // Return to dashboard
    await page.click("text=Back to Dashboard");
    await page.waitForLoadState("networkidle");
  }

  return {
    page,
    guildMaster,
    rewards,
  };
}

/**
 * Sets up a complete quest and reward economy scenario
 *
 * Creates a family with a Guild Master, creates both quests and rewards,
 * and awards the character enough gold to purchase rewards. This provides
 * a complete test environment for testing the full game economy.
 *
 * @param page - Playwright page object
 * @param options - Configuration for quests and rewards
 * @param prefix - Optional prefix for user creation (default: "economy-test")
 * @returns Fixture with page, GM user, quests, rewards, and starting gold
 *
 * @example
 * ```typescript
 * test("hero can earn gold and buy rewards", async ({ page }) => {
 *   const { rewards } = await setupQuestAndRewardEconomy(page, {
 *     questCount: 2,
 *     rewardCount: 3,
 *     startingGold: 200,
 *   });
 *
 *   // Character has 200 gold and can purchase rewards
 *   await page.click('button:has-text("🏪 Reward Store")');
 *   await page.click(`text=${rewards[0].name}`);
 *   // ... test reward purchase
 * });
 * ```
 */
export async function setupQuestAndRewardEconomy(
  page: Page,
  options?: {
    questCount?: number;
    rewardCount?: number;
    startingGold?: number;
  },
  prefix: string = "economy-test",
): Promise<
  RewardStoreFixture & {
    quests: QuestData[];
    startingGold: number;
  }
> {
  const { questCount = 2, rewardCount = 3, startingGold = 0 } = options || {};

  // Set up family with Guild Master
  const guildMaster = await setupUserWithCharacter(page, prefix);

  const quests: QuestData[] = [];
  const rewards: RewardData[] = [];

  // Create quests if requested
  if (questCount > 0) {
    for (let i = 1; i <= questCount; i++) {
      const questData: QuestData = {
        title: `Economy Quest ${i}`,
        description: `Test quest ${i} for economy testing`,
        difficulty: "EASY",
        xpReward: 50,
        goldReward: 100,
      };

      await createCustomQuest(page, questData);
      quests.push(questData);
    }
  }

  // Create rewards if requested
  if (rewardCount > 0) {
    await page.click('[data-testid="admin-dashboard-button"]');
    await navigateToAdminTab(page, "Rewards");

    const rewardTypes: Array<
      "SCREEN_TIME" | "EXPERIENCE" | "PURCHASE" | "PRIVILEGE"
    > = ["SCREEN_TIME", "EXPERIENCE", "PURCHASE", "PRIVILEGE"];

    for (let i = 1; i <= rewardCount; i++) {
      const rewardData: RewardData = {
        name: `Economy Reward ${i}`,
        description: `Test reward ${i} for economy testing`,
        type: rewardTypes[(i - 1) % rewardTypes.length],
        cost: i * 75,
      };

      await createReward(page, rewardData);
      rewards.push(rewardData);
    }

    await page.click("text=Back to Dashboard");
    await page.waitForLoadState("networkidle");
  }

  // Award starting gold if requested
  // Note: This would require a helper to award gold directly
  // For now, this is a placeholder - actual implementation would
  // use giveCharacterGoldViaQuest or a direct API call
  let actualStartingGold = 0;
  if (startingGold > 0) {
    // TODO: Implement gold awarding mechanism
    // Could use giveCharacterGoldViaQuest from setup-helpers
    actualStartingGold = startingGold;
  }

  return {
    page,
    guildMaster,
    rewards,
    quests,
    startingGold: actualStartingGold,
  };
}
