import { test, expect } from "./helpers/family-fixture";
import {
  createReward,
  editReward,
  toggleRewardActive,
  deleteReward,
} from "./helpers/reward-helpers";
import { navigateToDashboard, navigateToHeroTab } from "./helpers/navigation-helpers";

function uniqueRewardName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

test.describe('Reward Management', () => {
  test.beforeEach(async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    await navigateToDashboard(gmPage);
    await navigateToHeroTab(gmPage, "Reward Management");
    await expect(gmPage.getByTestId("reward-manager")).toBeVisible({
      timeout: 15000,
    });
  });

  test('Guild Master creates a new reward', async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Extra Screen Time");

    await createReward(gmPage, {
      name: rewardName,
      description: '30 minutes of extra screen time',
      type: 'SCREEN_TIME',
      cost: 100,
    });

    // Verify the reward appears with correct details
    const rewardCard = gmPage.locator('[data-testid^="reward-card-"]').filter({
      hasText: rewardName,
    });
    await expect(rewardCard.getByText('30 minutes of extra screen time')).toBeVisible();
    await expect(rewardCard.getByText('100 gold')).toBeVisible();
  });

  test('Guild Master edits an existing reward', async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const originalName = uniqueRewardName("Movie Night");
    const updatedName = `${originalName} Updated`;

    await createReward(gmPage, {
      name: originalName,
      description: 'Watch a movie with the family',
      type: 'EXPERIENCE',
      cost: 200,
    });

    // Edit the reward using helper
    await editReward(gmPage, originalName, {
      name: updatedName,
      cost: 150,
    });

    // Verify updated reward appears with new details
    const updatedRewardCard = gmPage.locator('[data-testid^="reward-card-"]').filter({
      hasText: updatedName,
    });
    await expect(updatedRewardCard).toBeVisible();
    await expect(updatedRewardCard.getByText('150 gold')).toBeVisible();
  });

  test('Guild Master deactivates and reactivates a reward', async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Pizza Party");

    await createReward(gmPage, {
      name: rewardName,
      description: 'Order pizza for dinner',
      type: 'PURCHASE',
      cost: 300,
    });

    // Find the reward card
    const rewardCard = gmPage.locator('[data-testid^="reward-card-"]').filter({
      hasText: rewardName,
    });

    // Deactivate the reward
    await toggleRewardActive(gmPage, rewardName);
    await expect(rewardCard.locator('text=Inactive')).toBeVisible();

    // Reactivate the reward
    await toggleRewardActive(gmPage, rewardName);
    await expect(rewardCard.locator('text=Inactive')).not.toBeVisible();
  });

  test('Guild Master deletes a reward', async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Temporary Reward");

    // Create a reward
    await createReward(gmPage, {
      name: rewardName,
      description: 'This will be deleted',
      type: 'PRIVILEGE',
      cost: 50,
    });

    // Delete the reward using helper
    await deleteReward(gmPage, rewardName);
  });

  test('Validates reward form inputs', async ({ workerFamily }) => {
    const { gmPage } = workerFamily;
    const rewardName = uniqueRewardName("Test Reward");

    // Open create reward modal
    await gmPage.click('[data-testid="create-reward-button"]');
    await expect(gmPage.getByTestId('create-reward-modal')).toBeVisible();

    // Try to save without filling required fields
    await gmPage.click('[data-testid="save-reward-button"]');
    await expect(gmPage.getByTestId('create-reward-modal')).toBeVisible();

    // Fill in name but leave other required fields empty
    await gmPage.fill('[data-testid="reward-name-input"]', rewardName);
    await gmPage.click('[data-testid="save-reward-button"]');
    await expect(gmPage.getByTestId('create-reward-modal')).toBeVisible();

    // Complete the form properly
    await gmPage.fill('[data-testid="reward-description-input"]', 'Test description');
    await gmPage.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
    await gmPage.fill('[data-testid="reward-cost-input"]', '100');
    await gmPage.click('[data-testid="save-reward-button"]');

    // Modal should close and reward should appear
    await expect(gmPage.getByTestId('create-reward-modal')).not.toBeVisible();
    const rewardCard = gmPage.locator('[data-testid^="reward-card-"]').filter({
      hasText: rewardName,
    });
    await expect(rewardCard).toBeVisible();
  });
});
