import { test, expect } from "./helpers/family-fixture";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { commonBeforeEach } from "./helpers/setup-helpers";

test.describe("Quest Pickup and Management", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("Guild Master can pick up available quests", async ({
    page,
    workerFamily,
  }) => {
    const { gmId } = workerFamily;

    // Log in as the Guild Master
    await page.goto(`/login`);
    await page.fill('input[name="email"]', `${gmId}@example.com`);
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Create an unassigned quest
    await createCustomQuest(page, {
      title: "Clean the Kitchen",
      description: "Deep clean kitchen counters and dishes",
      difficulty: "MEDIUM",
      goldReward: 25,
      xpReward: 50,
    });

    // Verify quest appears in Available Quests
    await expect(page.getByText("📋 Available Quests")).toBeVisible();

    // Pick up the quest
    await pickupQuest(page, "Clean the Kitchen");

    // Verify quest moved to My Quests
    await expect(page.getByText("🗡️ My Quests")).toBeVisible();
    const myQuestsSection = page.locator("text=🗡️ My Quests").locator("..");
    await expect(myQuestsSection.getByText("Clean the Kitchen")).toBeVisible();
  });

  test("Quest permissions and state management", async ({
    page,
    workerFamily,
  }) => {
    const { gmId } = workerFamily;

    // Log in as GM
    await page.goto(`/login`);
    await page.fill('input[name="email"]', `${gmId}@example.com`);
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Create a quest
    await createCustomQuest(page, {
      title: "Test Permission Quest",
      description: "Testing quest permissions",
      xpReward: 30,
    });

    // Pick up quest
    await pickupQuest(page, "Test Permission Quest");

    // Start the quest
    await startQuest(page, "Test Permission Quest");

    // Complete the quest
    await completeQuest(page, "Test Permission Quest");
    await expect(page.getByText("COMPLETED")).toBeVisible();

    // Approve quest as GM
    await approveQuest(page, "Test Permission Quest");
    await expect(page.getByText("APPROVED")).toBeVisible();
  });

  test("Quest workflow state transitions", async ({ page, workerFamily }) => {
    const { gmId } = workerFamily;
    const timestamp = Date.now();
    const questTitle = `Workflow Test Quest ${timestamp}`;

    // Log in as GM
    await page.goto(`/login`);
    await page.fill('input[name="email"]', `${gmId}@example.com`);
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Create quest
    await createCustomQuest(page, {
      title: questTitle,
      description: "Testing quest state transitions",
      xpReward: 40,
    });

    await expect(page.getByText(questTitle).first()).toBeVisible();

    const availableQuestExists = await page
      .locator("text=📋 Available Quests")
      .isVisible()
      .catch(() => false);

    if (availableQuestExists) {
      await pickupQuest(page, questTitle);
    }

    const myQuestsQuest = page
      .locator("text=🗡️ My Quests")
      .locator("..")
      .getByText(questTitle);
    await expect(myQuestsQuest).toBeVisible();

    await startQuest(page, questTitle);
    await completeQuest(page, questTitle);
    await expect(page.getByText("COMPLETED")).toBeVisible();

    await approveQuest(page, questTitle);
    await expect(page.getByText("APPROVED")).toBeVisible();
  });
});
