import { test, expect } from "@playwright/test";
import {
  setupUserWithCharacter,
  commonBeforeEach,
} from "./helpers/setup-helpers";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";

test.describe("Quest Pickup and Management", () => {
  test.beforeEach(async ({ page }) => {
    await commonBeforeEach(page);
  });

  test("Guild Master can pick up available quests", async ({ page }) => {
    await setupUserWithCharacter(page, "PickupGM");

    // Create unassigned quest
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

  test("quest permissions and state management", async ({ page }) => {
    await setupUserWithCharacter(page, "PermissionTester");

    // Create quest
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

    // Verify quest shows as completed
    await expect(page.getByText("COMPLETED")).toBeVisible();

    // Approve as Guild Master
    await approveQuest(page, "Test Permission Quest");

    // Verify quest shows as approved
    await expect(page.getByText("APPROVED")).toBeVisible();
  });

  test("quest workflow state transitions", async ({ page }) => {
    await setupUserWithCharacter(page, "WorkflowTester");
    const timestamp = Date.now();
    const questTitle = `Workflow Test Quest ${timestamp}`;

    // Create quest
    await createCustomQuest(page, {
      title: questTitle,
      description: "Testing quest state transitions",
      xpReward: 40,
    });

    // Verify quest was created
    await expect(page.getByText(questTitle).first()).toBeVisible();

    // Check if quest is in Available Quests section
    const availableQuestExists = await page
      .locator("text=📋 Available Quests")
      .isVisible()
      .catch(() => false);

    if (availableQuestExists) {
      // Pick up quest if it's in Available Quests
      await pickupQuest(page, questTitle);
    }

    // Find the quest in My Quests
    const myQuestsQuest = page
      .locator("text=🗡️ My Quests")
      .locator("..")
      .getByText(questTitle);
    await expect(myQuestsQuest).toBeVisible();

    // Complete quest workflow
    await startQuest(page, questTitle);
    await completeQuest(page, questTitle);
    await expect(page.getByText("COMPLETED")).toBeVisible();

    await approveQuest(page, questTitle);
    await expect(page.getByText("APPROVED")).toBeVisible();
  });
});

