import { test, expect } from "./helpers/family-fixture";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { navigateToDashboard } from "./helpers/navigation-helpers";
import { expectQuestStatus } from "./helpers/assertions";

function uniqueQuestName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

test.describe("Quest Pickup and Management", () => {
  test("Guild Master can pick up available quests", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    const questTitle = uniqueQuestName("Clean the Kitchen");

    // Create an unassigned quest
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Deep clean kitchen counters and dishes",
      difficulty: "MEDIUM",
      goldReward: 25,
      xpReward: 50,
    });

    // Verify quest appears in Available Quests
    await expect(gmPage.getByText("📋 Available Quests")).toBeVisible();

    // Pick up the quest
    await pickupQuest(gmPage, questTitle);

    // Verify quest moved to My Quests
    await expect(gmPage.getByText("🗡️ My Quests")).toBeVisible();
    const myQuestsSection = gmPage.locator("text=🗡️ My Quests").locator("..");
    await expect(myQuestsSection.getByText(questTitle)).toBeVisible();
  });

  test("Quest permissions and state management", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    const questTitle = uniqueQuestName("Test Permission Quest");

    // Create a quest
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing quest permissions",
      xpReward: 30,
    });

    // Pick up quest
    await pickupQuest(gmPage, questTitle);

    // Start the quest
    await startQuest(gmPage, questTitle);

    // Complete the quest
    await completeQuest(gmPage, questTitle);
    await expectQuestStatus(gmPage, questTitle, "COMPLETED");

    // Approve quest as GM
    await approveQuest(gmPage, questTitle);
    await expectQuestStatus(gmPage, questTitle, "APPROVED");
  });

  test("Quest workflow state transitions", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    const timestamp = Date.now();
    const questTitle = `Workflow Test Quest ${timestamp}`;

    // Create quest
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing quest state transitions",
      xpReward: 40,
    });

    await expect(gmPage.getByText(questTitle).first()).toBeVisible();

    const availableQuestExists = await gmPage
      .locator("text=📋 Available Quests")
      .isVisible()
      .catch(() => false);

    if (availableQuestExists) {
      await pickupQuest(gmPage, questTitle);
    }

    const myQuestsQuest = gmPage
      .locator("text=🗡️ My Quests")
      .locator("..")
      .getByText(questTitle);
    await expect(myQuestsQuest).toBeVisible();

    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    await expectQuestStatus(gmPage, questTitle, "COMPLETED");

    await approveQuest(gmPage, questTitle);
    await expectQuestStatus(gmPage, questTitle, "APPROVED");
  });
});
