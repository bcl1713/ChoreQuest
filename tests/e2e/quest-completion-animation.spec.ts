import { test, expect } from "./helpers/family-fixture";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";
import { navigateToDashboard, dismissLevelUpModalIfVisible } from "./helpers/navigation-helpers";

function uniqueQuestName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

test.describe("Quest Completion Animation", () => {
  test("shows celebration overlay when quest is approved with rewards", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to dashboard
    await navigateToDashboard(gmPage);

    // Create a custom quest with rewards
    const questTitle = uniqueQuestName("Animation Test Quest");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Quest to test completion animation",
      difficulty: "MEDIUM",
      xpReward: 100,
      goldReward: 50,
    });

    // Complete the quest workflow
    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);

    // Approve the quest - this should trigger the overlay
    // Skip auto-dismiss so we can verify the overlay appears
    await approveQuest(gmPage, questTitle, { skipQuestCompleteDismiss: true });

    // Dismiss level up modal if it appeared (GM may have leveled up)
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for the overlay to appear
    const overlay = gmPage.getByRole('dialog', { name: questTitle });
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // Verify rewards are displayed
    // XP reward: MEDIUM difficulty with 100 XP base = 100 * 1.57 = 157 XP
    // Gold reward: MEDIUM difficulty with 50 Gold base = 50 * 1.57 = 78.5 -> 78 Gold
    // Scope the search to the overlay to avoid matching dashboard stats
    await expect(overlay.getByText(/157.*XP/)).toBeVisible();
    await expect(overlay.getByText(/78.*Gold/)).toBeVisible();

    // Verify "Rewards Earned:" text is shown
    await expect(gmPage.getByText("Rewards Earned:")).toBeVisible();

    // Verify the continue button is visible
    await expect(
      gmPage.getByRole("button", { name: /Continue Adventure/i })
    ).toBeVisible();

    // Verify the close button (X) is visible
    await expect(gmPage.getByRole("button", { name: /Close/i })).toBeVisible();

    // Dismiss overlay to clean up for next test
    await gmPage.getByRole("button", { name: /Continue Adventure/i }).click();
    await expect(overlay).not.toBeVisible({ timeout: 2000 });
    await dismissLevelUpModalIfVisible(gmPage);
  });

  test("overlay auto-dismisses after 5 seconds", async ({ workerFamily }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    // Create and complete a quest
    const questTitle = uniqueQuestName("Auto Dismiss Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing auto-dismiss",
      difficulty: "EASY",
      xpReward: 50,
      goldReward: 25,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip auto-dismiss so we can verify auto-dismiss behavior
    await approveQuest(gmPage, questTitle, { skipQuestCompleteDismiss: true });

    // Dismiss any level-up modal that might appear and block the quest complete overlay
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for overlay to appear - use dialog with specific aria-labelledby
    const overlay = gmPage.getByRole('dialog', { name: questTitle });
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // Wait for auto-dismiss (5 seconds + buffer)
    // The overlay should disappear
    await expect(overlay).not.toBeVisible({
      timeout: 8000,
    });

    // Verify the overlay is completely gone
    await expect(gmPage.getByText("Rewards Earned:")).not.toBeVisible();

    // After auto-dismiss, a level-up modal might appear
    // Dismiss it to ensure it doesn't block subsequent tests
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait a bit for the exit animation to complete
    await gmPage.waitForTimeout(500);
  });

  test("overlay can be manually dismissed with Continue button", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const questTitle = uniqueQuestName("Manual Dismiss Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing manual dismiss",
      difficulty: "HARD",
      xpReward: 200,
      goldReward: 100,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip auto-dismiss so we can verify manual dismiss
    await approveQuest(gmPage, questTitle, { skipQuestCompleteDismiss: true });

    // Dismiss any level-up modal that might appear
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for overlay to appear
    const overlay = gmPage.getByRole('dialog', { name: questTitle });
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // Click the "Continue Adventure" button
    await gmPage.getByRole("button", { name: /Continue Adventure/i }).click();

    // Verify the overlay is dismissed immediately
    await expect(overlay).not.toBeVisible({
      timeout: 2000,
    });
    await expect(gmPage.getByText("Rewards Earned:")).not.toBeVisible();

    // After dismissing quest complete overlay, a level-up modal might appear
    // Dismiss it to ensure it doesn't block subsequent tests
    await dismissLevelUpModalIfVisible(gmPage);
  });

  test("overlay can be manually dismissed with close (X) button", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const questTitle = uniqueQuestName("Close Button Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing close button",
      difficulty: "EASY",
      xpReward: 30,
      goldReward: 15,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip auto-dismiss so we can verify close button
    await approveQuest(gmPage, questTitle, { skipQuestCompleteDismiss: true });

    // Dismiss any level-up modal that might appear
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for overlay to appear
    const overlay = gmPage.getByRole('dialog', { name: questTitle });
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // Click the close (X) button
    await gmPage.getByRole("button", { name: /Close/i }).click();

    // Verify the overlay is dismissed immediately
    await expect(overlay).not.toBeVisible({
      timeout: 2000,
    });
    await expect(gmPage.getByText("Rewards Earned:")).not.toBeVisible();

    // After dismissing quest complete overlay, a level-up modal might appear
    // Dismiss it to ensure it doesn't block subsequent tests
    await dismissLevelUpModalIfVisible(gmPage);
  });

  test("overlay can be dismissed by clicking backdrop", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    const questTitle = uniqueQuestName("Backdrop Dismiss Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing backdrop dismiss",
      difficulty: "MEDIUM",
      xpReward: 75,
      goldReward: 40,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip auto-dismiss so we can verify backdrop dismiss
    await approveQuest(gmPage, questTitle, { skipQuestCompleteDismiss: true });

    // Dismiss any level-up modal that might appear
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for overlay to appear
    const overlay = gmPage.getByRole('dialog', { name: questTitle });
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // Click the backdrop by clicking at a position outside the modal content
    // The backdrop is at z-40, but the dialog at z-50 intercepts clicks
    // Use force: true to bypass actionability checks and click the backdrop directly
    const backdrop = gmPage.locator(".fixed.inset-0.z-40");
    await backdrop.click({ position: { x: 10, y: 10 }, force: true });

    // Verify the overlay is dismissed
    await expect(overlay).not.toBeVisible({
      timeout: 2000,
    });
    await expect(gmPage.getByText("Rewards Earned:")).not.toBeVisible();

    // After dismissing quest complete overlay, a level-up modal might appear
    // Dismiss it to ensure it doesn't block subsequent tests
    await dismissLevelUpModalIfVisible(gmPage);
  });

  test("displays correct rewards for different difficulty levels", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    // Test EASY difficulty (1.05x multiplier)
    const easyQuest = uniqueQuestName("Easy Difficulty Test");
    await createCustomQuest(gmPage, {
      title: easyQuest,
      description: "Easy quest",
      difficulty: "EASY",
      xpReward: 100,
      goldReward: 50,
    });

    await pickupQuest(gmPage, easyQuest);
    await startQuest(gmPage, easyQuest);
    await completeQuest(gmPage, easyQuest);
    // Skip auto-dismiss so we can verify rewards
    await approveQuest(gmPage, easyQuest, { skipQuestCompleteDismiss: true });

    // Dismiss any level-up modal that might appear
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for overlay
    const overlay = gmPage.getByRole('dialog', { name: easyQuest });
    await expect(overlay).toBeVisible({ timeout: 10000 });

    // EASY: 100 * 1.05 = 105 XP, 50 * 1.05 = 52.5 -> 52 Gold
    // Scope the search to the overlay to avoid matching dashboard stats
    await expect(overlay.getByText(/105.*XP/)).toBeVisible();
    await expect(overlay.getByText(/52.*Gold/)).toBeVisible();

    // Dismiss overlay
    await gmPage.getByRole("button", { name: /Continue Adventure/i }).click();
    await expect(overlay).not.toBeVisible({ timeout: 2000 });

    // After dismissing, a level-up modal might appear - dismiss it
    await dismissLevelUpModalIfVisible(gmPage);

    // Test HARD difficulty (2.1x multiplier)
    const hardQuest = uniqueQuestName("Hard Difficulty Test");
    await createCustomQuest(gmPage, {
      title: hardQuest,
      description: "Hard quest",
      difficulty: "HARD",
      xpReward: 100,
      goldReward: 50,
    });

    await pickupQuest(gmPage, hardQuest);
    await startQuest(gmPage, hardQuest);
    await completeQuest(gmPage, hardQuest);
    // Skip auto-dismiss so we can verify rewards
    await approveQuest(gmPage, hardQuest, { skipQuestCompleteDismiss: true });

    // Dismiss any level-up modal that might appear
    await dismissLevelUpModalIfVisible(gmPage);

    // Wait for overlay
    const overlay2 = gmPage.getByRole('dialog', { name: hardQuest });
    await expect(overlay2).toBeVisible({ timeout: 10000 });

    // HARD: 100 * 2.1 = 210 XP, 50 * 2.1 = 105 Gold
    // Scope the search to the overlay to avoid matching dashboard stats
    await expect(overlay2.getByText(/210.*XP/)).toBeVisible();
    await expect(overlay2.getByText(/105.*Gold/)).toBeVisible();

    // Dismiss overlay and any level-up modal that appears
    await gmPage.getByRole("button", { name: /Continue Adventure/i }).click();
    await expect(overlay2).not.toBeVisible({ timeout: 2000 });
    await dismissLevelUpModalIfVisible(gmPage);
  });

  test("overlay shows particle effects when displayed", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    await navigateToDashboard(gmPage);

    // Dismiss any lingering overlays from previous tests
    const continueButton = gmPage.getByRole("button", { name: /Continue Adventure/i });
    if (await continueButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await continueButton.click();
      await gmPage.waitForTimeout(500); // Wait for animation
    }

    const questTitle = uniqueQuestName("Particle Effect Test");
    await createCustomQuest(gmPage, {
      title: questTitle,
      description: "Testing particle effects",
      difficulty: "MEDIUM",
      xpReward: 100,
      goldReward: 50,
    });

    await pickupQuest(gmPage, questTitle);
    await startQuest(gmPage, questTitle);
    await completeQuest(gmPage, questTitle);
    // Skip auto-dismiss so we can verify particle effects
    await approveQuest(gmPage, questTitle, { skipQuestCompleteDismiss: true });

    // Wait for overlay to appear
    await expect(gmPage.getByRole('heading', { level: 2, name: questTitle })).toBeVisible({ timeout: 10000 });

    // Verify particle effects container exists
    // ParticleEffect renders particles in a fixed positioned container with aria-hidden
    const particleContainer = gmPage.locator(
      ".fixed.inset-0.pointer-events-none[aria-hidden='true']"
    );
    await expect(particleContainer).toBeVisible();

    // Verify multiple particle elements exist (should be 30 particles)
    const particles = particleContainer.locator("div > div");
    const particleCount = await particles.count();
    expect(particleCount).toBeGreaterThan(0);
  });
});
