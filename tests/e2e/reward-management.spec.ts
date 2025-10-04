import { test, expect } from '@playwright/test';
import { setupUserWithCharacter } from './helpers/setup-helpers';
import { createReward, editReward, toggleRewardActive, deleteReward } from './helpers/reward-helpers';
import { navigateToHeroTab } from './helpers/navigation-helpers';

test.describe('Reward Management', () => {
  test('Guild Master creates a new reward', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'reward-test', { characterClass: 'KNIGHT' });

    // Navigate to Reward Management tab
    await navigateToHeroTab(page, 'Reward Management');

    // Create reward using helper
    await createReward(page, {
      name: 'Extra Screen Time',
      description: '30 minutes of extra screen time',
      type: 'SCREEN_TIME',
      cost: 100,
    });

    // Verify the reward appears with correct details
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Extra Screen Time',
    });
    await expect(rewardCard.getByText('30 minutes of extra screen time')).toBeVisible();
    await expect(rewardCard.getByText('100 gold')).toBeVisible();
  });

  test('Guild Master edits an existing reward', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-edit', { characterClass: 'MAGE' });

    // Navigate to Reward Management
    await navigateToHeroTab(page, 'Reward Management');

    // Create a reward first
    await createReward(page, {
      name: 'Movie Night',
      description: 'Watch a movie with the family',
      type: 'EXPERIENCE',
      cost: 200,
    });

    // Edit the reward using helper
    await editReward(page, 'Movie Night', {
      name: 'Family Movie Night',
      cost: 150,
    });

    // Verify updated reward appears with new details
    const updatedRewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Family Movie Night',
    });
    await expect(updatedRewardCard).toBeVisible();
    await expect(updatedRewardCard.getByText('150 gold')).toBeVisible();
  });

  test('Guild Master deactivates and reactivates a reward', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-toggle', { characterClass: 'ROGUE' });

    // Navigate to Reward Management
    await navigateToHeroTab(page, 'Reward Management');

    // Create a reward
    await createReward(page, {
      name: 'Pizza Party',
      description: 'Order pizza for dinner',
      type: 'PURCHASE',
      cost: 300,
    });

    // Find the reward card
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Pizza Party',
    });

    // Deactivate the reward
    await toggleRewardActive(page, 'Pizza Party');
    await expect(rewardCard.locator('text=Inactive')).toBeVisible();

    // Reactivate the reward
    await toggleRewardActive(page, 'Pizza Party');
    await expect(rewardCard.locator('text=Inactive')).not.toBeVisible();
  });

  test('Guild Master deletes a reward', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-delete', { characterClass: 'HEALER' });

    // Navigate to Reward Management
    await navigateToHeroTab(page, 'Reward Management');

    // Create a reward
    await createReward(page, {
      name: 'Temporary Reward',
      description: 'This will be deleted',
      type: 'PRIVILEGE',
      cost: 50,
    });

    // Delete the reward using helper
    await deleteReward(page, 'Temporary Reward');
  });

  test('Validates reward form inputs', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-validation', { characterClass: 'KNIGHT' });

    // Navigate to Reward Management
    await navigateToHeroTab(page, 'Reward Management');

    // Open create reward modal
    await page.click('[data-testid="create-reward-button"]');
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Try to save without filling required fields
    await page.click('[data-testid="save-reward-button"]');
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Fill in name but leave other required fields empty
    await page.fill('[data-testid="reward-name-input"]', 'Test Reward');
    await page.click('[data-testid="save-reward-button"]');
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Complete the form properly
    await page.fill('[data-testid="reward-description-input"]', 'Test description');
    await page.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
    await page.fill('[data-testid="reward-cost-input"]', '100');
    await page.click('[data-testid="save-reward-button"]');

    // Modal should close and reward should appear
    await expect(page.getByTestId('create-reward-modal')).not.toBeVisible();
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Test Reward',
    });
    await expect(rewardCard).toBeVisible();
  });
});
