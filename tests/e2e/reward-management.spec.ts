import { test, expect } from '@playwright/test';
import { setupUserWithCharacter } from './helpers/setup-helpers';

test.describe('Reward Management', () => {
  test('Guild Master creates a new reward', async ({ page }) => {
    // Create family and character as Guild Master
    await setupUserWithCharacter(page, 'reward-test', { characterClass: 'KNIGHT' });

    // Should already be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Reward Management tab
    await page.click('text=Reward Management');
    await expect(page.getByTestId('reward-manager')).toBeVisible();

    // Click Create Reward button
    await page.click('[data-testid="create-reward-button"]');
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Fill in reward details
    await page.fill('[data-testid="reward-name-input"]', 'Extra Screen Time');
    await page.fill(
      '[data-testid="reward-description-input"]',
      '30 minutes of extra screen time'
    );
    await page.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
    await page.fill('[data-testid="reward-cost-input"]', '100');

    // Save the reward
    await page.click('[data-testid="save-reward-button"]');

    // Wait for modal to close and reward to appear in list
    await expect(page.getByTestId('create-reward-modal')).not.toBeVisible();

    // Find the newly created reward card
    const newRewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Extra Screen Time',
    });

    // Verify the new reward appears with correct details
    await expect(newRewardCard).toBeVisible();
    await expect(newRewardCard.getByText('30 minutes of extra screen time')).toBeVisible();
    await expect(newRewardCard.getByText('100 gold')).toBeVisible();
  });

  test('Guild Master edits an existing reward', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-edit', { characterClass: 'MAGE' });

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Reward Management
    await page.click('text=Reward Management');
    await expect(page.getByTestId('reward-manager')).toBeVisible();

    // Create a reward first
    await page.click('[data-testid="create-reward-button"]');
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    await page.fill('[data-testid="reward-name-input"]', 'Movie Night');
    await page.fill('[data-testid="reward-description-input"]', 'Watch a movie with the family');
    await page.selectOption('[data-testid="reward-type-select"]', 'EXPERIENCE');
    await page.fill('[data-testid="reward-cost-input"]', '200');
    await page.click('[data-testid="save-reward-button"]');

    await expect(page.getByTestId('create-reward-modal')).not.toBeVisible();

    // Find the reward card
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Movie Night',
    });
    await expect(rewardCard).toBeVisible();

    // Click edit button
    await rewardCard.locator('[data-testid="edit-reward-button"]').click();
    await expect(page.getByTestId('edit-reward-modal')).toBeVisible();

    // Modify reward details
    await page.fill('[data-testid="reward-name-input"]', 'Family Movie Night');
    await page.fill('[data-testid="reward-cost-input"]', '150');

    // Save changes
    await page.click('[data-testid="save-reward-button"]');
    await expect(page.getByTestId('edit-reward-modal')).not.toBeVisible();

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
    await page.click('text=Reward Management');
    await expect(page.getByTestId('reward-manager')).toBeVisible();

    // Create a reward
    await page.click('[data-testid="create-reward-button"]');
    await page.fill('[data-testid="reward-name-input"]', 'Pizza Party');
    await page.fill('[data-testid="reward-description-input"]', 'Order pizza for dinner');
    await page.selectOption('[data-testid="reward-type-select"]', 'PURCHASE');
    await page.fill('[data-testid="reward-cost-input"]', '300');
    await page.click('[data-testid="save-reward-button"]');

    await expect(page.getByTestId('create-reward-modal')).not.toBeVisible();

    // Find the reward card
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Pizza Party',
    });
    await expect(rewardCard).toBeVisible();

    // Deactivate the reward
    await rewardCard.locator('[data-testid="toggle-reward-active"]').click();

    // Verify reward is marked as inactive
    await expect(rewardCard.locator('text=Inactive')).toBeVisible();

    // Reactivate the reward
    await rewardCard.locator('[data-testid="toggle-reward-active"]').click();

    // Verify reward is active again
    await expect(rewardCard.locator('text=Inactive')).not.toBeVisible();
  });

  test('Guild Master deletes a reward', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-delete', { characterClass: 'HEALER' });

    // Navigate to Reward Management
    await page.click('text=Reward Management');
    await expect(page.getByTestId('reward-manager')).toBeVisible();

    // Create a reward
    await page.click('[data-testid="create-reward-button"]');
    await page.fill('[data-testid="reward-name-input"]', 'Temporary Reward');
    await page.fill('[data-testid="reward-description-input"]', 'This will be deleted');
    await page.selectOption('[data-testid="reward-type-select"]', 'PRIVILEGE');
    await page.fill('[data-testid="reward-cost-input"]', '50');
    await page.click('[data-testid="save-reward-button"]');

    await expect(page.getByTestId('create-reward-modal')).not.toBeVisible();

    // Find the reward card
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Temporary Reward',
    });
    await expect(rewardCard).toBeVisible();

    // Click delete button
    await rewardCard.locator('[data-testid="delete-reward-button"]').click();

    // Confirm deletion in dialog
    await expect(page.getByTestId('delete-confirmation-dialog')).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify reward is permanently deleted (removed from UI entirely)
    await expect(rewardCard).not.toBeVisible();
  });

  test('Validates reward form inputs', async ({ page }) => {
    // Create family and character
    await setupUserWithCharacter(page, 'reward-validation', { characterClass: 'KNIGHT' });

    // Navigate to Reward Management
    await page.click('text=Reward Management');
    await expect(page.getByTestId('reward-manager')).toBeVisible();

    // Open create reward modal
    await page.click('[data-testid="create-reward-button"]');
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Try to save without filling required fields
    await page.click('[data-testid="save-reward-button"]');

    // Save button should still be visible (form didn't submit)
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Fill in name but leave other required fields empty
    await page.fill('[data-testid="reward-name-input"]', 'Test Reward');

    // Try to save again
    await page.click('[data-testid="save-reward-button"]');

    // Modal should still be visible
    await expect(page.getByTestId('create-reward-modal')).toBeVisible();

    // Complete the form properly
    await page.fill('[data-testid="reward-description-input"]', 'Test description');
    await page.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
    await page.fill('[data-testid="reward-cost-input"]', '100');

    // Now save should work
    await page.click('[data-testid="save-reward-button"]');

    // Modal should close
    await expect(page.getByTestId('create-reward-modal')).not.toBeVisible();

    // Reward should appear
    const rewardCard = page.locator('[data-testid^="reward-card-"]').filter({
      hasText: 'Test Reward',
    });
    await expect(rewardCard).toBeVisible();
  });
});
