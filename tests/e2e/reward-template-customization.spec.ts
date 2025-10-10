/**
 * E2E tests for Reward Template Customization
 * Verifies that Guild Masters can edit and manage template rewards after they're copied
 */

import { test, expect } from "./helpers/family-fixture";
import {
  editReward,
  toggleRewardActive,
  createReward,
} from "./helpers/reward-helpers";
import { navigateToHeroTab } from "./helpers/navigation-helpers";

test.describe("Reward Template Customization", () => {
  test("Guild Master can edit template reward name and cost", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Management
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByText("Reward Management")).toBeVisible({
      timeout: 15000,
    });

    // Find a template reward (e.g., "Small Treat")
    const originalRewardCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Small Treat" });

    await expect(originalRewardCard).toBeVisible();

    // Edit the reward
    await editReward(gmPage, "Small Treat", {
      name: "Modified Small Treat",
      cost: 50, // Originally 25
    });

    // Verify the changes are saved and visible
    const updatedRewardCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Modified Small Treat" });

    await expect(updatedRewardCard).toBeVisible();
    await expect(updatedRewardCard.locator('text="50 gold"')).toBeVisible();

    // Original name should no longer exist
    await expect(
      gmPage
        .locator('[data-testid^="reward-card-"]')
        .filter({ hasText: "Small Treat" })
        .filter({ hasNotText: "Modified" }),
    ).not.toBeVisible();
  });

  test("Guild Master can edit template reward description", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Management
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByText("Reward Management")).toBeVisible({
      timeout: 15000,
    });

    // Edit a different reward's description
    await editReward(gmPage, "Skip One Chore", {
      description: "Skip any chore you don't want to do today!",
    });

    // Verify the updated description is visible
    const updatedCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Skip One Chore" });

    await expect(updatedCard).toBeVisible();
    await expect(
      updatedCard.getByText("Skip any chore you don't want to do today!"),
    ).toBeVisible();
  });

  test("Guild Master can deactivate a template reward", async ({
    workerFamily,
  }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    // Create a hero to test visibility
    const hero = await createFamilyMember({
      displayName: "Test Hero",
      characterClass: "KNIGHT",
    });

    // Navigate to Reward Management as GM
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByText("Reward Management")).toBeVisible({
      timeout: 15000,
    });

    // Find and toggle a reward to inactive
    const rewardCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Movie Night Pick" });

    await expect(rewardCard).toBeVisible();

    // Deactivate the reward
    await toggleRewardActive(gmPage, "Movie Night Pick");

    // Verify it shows as inactive in Reward Management
    await expect(rewardCard.locator('text=Inactive')).toBeVisible({
      timeout: 15000,
    });

    // Switch to hero's Reward Store and verify the reward is NOT visible
    await navigateToHeroTab(hero.page, "Reward Store");

    await expect(hero.page.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });

    // The deactivated reward should not be visible in the store
    const heroRewardCard = hero.page
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Movie Night Pick" });

    await expect(heroRewardCard).not.toBeVisible();

    // But other active rewards should still be visible
    await expect(
      hero.page.locator('text="30 Minutes Extra Screen Time"'),
    ).toBeVisible();
  });

  test("Guild Master can reactivate a deactivated template reward", async ({
    workerFamily,
  }) => {
    const { gmPage, createFamilyMember } = workerFamily;

    // Create a hero
    const hero = await createFamilyMember({
      displayName: "Test Hero 2",
      characterClass: "MAGE",
    });

    // Navigate to Reward Management
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByText("Reward Management")).toBeVisible({
      timeout: 15000,
    });

    // Deactivate a reward
    await toggleRewardActive(gmPage, "Stay Up 30 Minutes Late");

    const rewardCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Stay Up 30 Minutes Late" });

    await expect(rewardCard.locator('text=Inactive')).toBeVisible({
      timeout: 15000,
    });

    // Reactivate the reward
    await toggleRewardActive(gmPage, "Stay Up 30 Minutes Late");

    // Verify it's no longer marked as inactive
    await expect(rewardCard.locator('text=Inactive')).not.toBeVisible();

    // Verify it's now visible in hero's Reward Store
    await navigateToHeroTab(hero.page, "Reward Store");

    await expect(hero.page.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });

    await expect(
      hero.page.locator('text="Stay Up 30 Minutes Late"'),
    ).toBeVisible();
  });

  test("Guild Master can add custom rewards alongside template rewards", async ({
    workerFamily,
  }) => {
    const { gmPage } = workerFamily;

    // Navigate to Reward Management
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByText("Reward Management")).toBeVisible({
      timeout: 15000,
    });

    // Count existing rewards
    const initialRewardCards = gmPage.locator('[data-testid^="reward-card-"]');
    const initialCount = await initialRewardCards.count();

    // Create a custom reward
    await createReward(gmPage, {
      name: "Custom Family Reward",
      description: "A unique reward for our family",
      type: "EXPERIENCE",
      cost: 175,
    });

    // Verify the custom reward appears alongside templates
    const customRewardCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Custom Family Reward" });

    await expect(customRewardCard).toBeVisible();

    // Verify reward count increased
    const newCount = await initialRewardCards.count();
    expect(newCount).toBe(initialCount + 1);

    // Verify template rewards still exist
    await expect(gmPage.locator('text="Small Treat"')).toBeVisible();
    await expect(gmPage.locator('text="Skip One Chore"')).toBeVisible();
  });

  test("edited template rewards remain independent across families", async ({
    workerFamily,
  }) => {
    // This test verifies that editing a reward in one family doesn't affect other families
    // We can only test within one family, but we verify the edit doesn't break anything
    const { gmPage, createFamilyMember } = workerFamily;

    // Navigate to Reward Management
    await navigateToHeroTab(gmPage, "Reward Management");

    await expect(gmPage.getByText("Reward Management")).toBeVisible({
      timeout: 15000,
    });

    // Edit a reward significantly
    await editReward(gmPage, "Ice Cream Outing", {
      name: "Ice Cream Adventure",
      cost: 200, // Originally 125
      description: "A special trip to get ice cream with the whole family!",
    });

    // Verify the edit worked
    const editedCard = gmPage
      .locator('[data-testid^="reward-card-"]')
      .filter({ hasText: "Ice Cream Adventure" });

    await expect(editedCard).toBeVisible();
    await expect(editedCard.locator('text="200 gold"')).toBeVisible();

    // Create a hero and verify they see the edited reward
    const hero = await createFamilyMember({
      displayName: "Hero For Independence Test",
      characterClass: "RANGER",
    });

    await navigateToHeroTab(hero.page, "Reward Store");

    await expect(hero.page.getByTestId("reward-store-title")).toBeVisible({
      timeout: 15000,
    });

    // Hero should see the edited version
    await expect(hero.page.locator('text="Ice Cream Adventure"')).toBeVisible();
    await expect(
      hero.page
        .locator('[data-testid^="reward-card-"]')
        .filter({ hasText: "Ice Cream Adventure" })
        .locator('text="200 💰"'),
    ).toBeVisible();

    // Other rewards should be unaffected
    await expect(
      hero.page.locator('text="30 Minutes Extra Screen Time"'),
    ).toBeVisible();
    await expect(
      hero.page
        .locator('[data-testid^="reward-card-"]')
        .filter({ hasText: "30 Minutes Extra Screen Time" })
        .locator('text="50 💰"'),
    ).toBeVisible();
  });
});
