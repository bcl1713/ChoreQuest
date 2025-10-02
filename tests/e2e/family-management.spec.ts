import { test, expect } from '@playwright/test';
import { setupUserWithCharacter } from './helpers/setup-helpers';

test.describe('Family Management', () => {
  test('Guild Master promotes Hero to Guild Master successfully', async ({ page }) => {
    // Create first user (Guild Master)
    const gmEmail = `gm-promote-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'promote-test', {
      characterClass: 'KNIGHT',
      email: gmEmail,
      password: 'testpass123',
    });

    // Get family code from dashboard
    const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
    const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';

    // Logout
    await page.click('text=Logout');

    // Create second user (Hero) and join same family
    const heroEmail = `hero-${Date.now()}@test.com`;
    await page.goto('/auth/register');
    await page.fill('[data-testid="email-input"]', heroEmail);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.fill('[data-testid="name-input"]', 'Hero User');
    await page.fill('[data-testid="family-code-input"]', familyCode);
    await page.click('[data-testid="register-button"]');

    // Create character for Hero
    await expect(page).toHaveURL(/.*character\/create/);
    await page.fill('[data-testid="character-name-input"]', 'Hero Character');
    await page.click('[data-testid="class-MAGE"]');
    await page.click('[data-testid="create-character-button"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout Hero
    await page.click('text=Logout');

    // Login as GM
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', gmEmail);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Family Management tab
    await page.click('[data-testid="tab-family"]');
    await expect(page.getByText('Family Management')).toBeVisible();

    // Verify Hero User is in the list with Hero role
    const heroRow = page.locator('tr').filter({ hasText: 'Hero User' });
    await expect(heroRow).toBeVisible();
    await expect(heroRow.getByText('Hero')).toBeVisible();

    // Click Promote button
    await heroRow.getByRole('button', { name: /Promote to GM/i }).click();

    // Confirm promotion in modal
    await expect(page.getByText('Promote to Guild Master')).toBeVisible();
    await expect(page.getByText(/Are you sure you want to promote/)).toBeVisible();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();

    // Verify Hero User now has Guild Master role
    await expect(heroRow.getByText('Guild Master')).toBeVisible();
    await expect(heroRow.getByText('👑')).toBeVisible();

    // Verify Promote button is gone (no longer a Hero)
    await expect(heroRow.getByRole('button', { name: /Promote to GM/i })).not.toBeVisible();
  });

  test('Guild Master demotes another GM to Hero successfully', async ({ page }) => {
    // Create first GM
    const gm1Email = `gm1-demote-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'demote-test', {
      characterClass: 'KNIGHT',
      email: gm1Email,
      password: 'testpass123',
    });

    const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
    const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';

    // Logout
    await page.click('text=Logout');

    // Create second user and join
    const gm2Email = `gm2-${Date.now()}@test.com`;
    await page.goto('/auth/register');
    await page.fill('[data-testid="email-input"]', gm2Email);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.fill('[data-testid="name-input"]', 'Second GM');
    await page.fill('[data-testid="family-code-input"]', familyCode);
    await page.click('[data-testid="register-button"]');

    await expect(page).toHaveURL(/.*character\/create/);
    await page.fill('[data-testid="character-name-input"]', 'Second Character');
    await page.click('[data-testid="class-RANGER"]');
    await page.click('[data-testid="create-character-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
    await page.click('text=Logout');

    // Login as first GM
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', gm1Email);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Family Management and promote second user
    await page.click('[data-testid="tab-family"]');
    const secondUserRow = page.locator('tr').filter({ hasText: 'Second GM' });
    await secondUserRow.getByRole('button', { name: /Promote to GM/i }).click();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();

    // Wait for promotion to complete
    await expect(secondUserRow.getByText('Guild Master')).toBeVisible();

    // Now demote the second GM back to Hero
    await secondUserRow.getByRole('button', { name: /Demote to Hero/i }).click();

    // Confirm demotion in modal
    await expect(page.getByText('Demote to Hero')).toBeVisible();
    await expect(page.getByText(/Are you sure you want to demote/)).toBeVisible();
    await page.getByRole('button', { name: /Confirm Demotion/i }).click();

    // Verify Second GM is now Hero
    await expect(secondUserRow.getByText('Hero')).toBeVisible();
    await expect(secondUserRow.getByText('🛡️')).toBeVisible();

    // Verify Demote button is gone, Promote button is back
    await expect(secondUserRow.getByRole('button', { name: /Demote to Hero/i })).not.toBeVisible();
    await expect(secondUserRow.getByRole('button', { name: /Promote to GM/i })).toBeVisible();
  });

  test('GM cannot demote last Guild Master (error message shown)', async ({ page }) => {
    // Create GM (will be the only GM)
    const gmEmail = `gm-last-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'last-gm-test', {
      characterClass: 'HEALER',
      email: gmEmail,
      password: 'testpass123',
    });

    const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
    const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';

    // Logout
    await page.click('text=Logout');

    // Create second GM
    const gm2Email = `gm2-last-${Date.now()}@test.com`;
    await page.goto('/auth/register');
    await page.fill('[data-testid="email-input"]', gm2Email);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.fill('[data-testid="name-input"]', 'Second GM');
    await page.fill('[data-testid="family-code-input"]', familyCode);
    await page.click('[data-testid="register-button"]');

    await expect(page).toHaveURL(/.*character\/create/);
    await page.fill('[data-testid="character-name-input"]', 'Second Character');
    await page.click('[data-testid="class-ROGUE"]');
    await page.click('[data-testid="create-character-button"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Promote self to GM (second user needs to be promoted)
    await page.click('text=Logout');
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', gmEmail);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="tab-family"]');
    const secondUserRow = page.locator('tr').filter({ hasText: 'Second GM' });
    await secondUserRow.getByRole('button', { name: /Promote to GM/i }).click();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();
    await expect(secondUserRow.getByText('Guild Master')).toBeVisible();

    // Now try to demote first GM (which would leave only one)
    // Login as second GM
    await page.click('text=Logout');
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', gm2Email);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="tab-family"]');

    // Find first GM's row
    const firstGMRow = page.locator('tr').filter({ hasText: gmEmail.split('@')[0] });
    await expect(firstGMRow.getByText('Guild Master')).toBeVisible();

    // Try to demote
    await firstGMRow.getByRole('button', { name: /Demote to Hero/i }).click();
    await page.getByRole('button', { name: /Confirm Demotion/i }).click();

    // Should see error message about last GM
    await expect(
      page.getByText(/Cannot demote the last Guild Master/i)
    ).toBeVisible();

    // First GM should still be Guild Master
    await expect(firstGMRow.getByText('Guild Master')).toBeVisible();
  });

  test('GM cannot see demote button for themselves', async ({ page }) => {
    // Create GM
    const gmEmail = `gm-self-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'self-demote-test', {
      characterClass: 'KNIGHT',
      email: gmEmail,
      password: 'testpass123',
    });

    // Navigate to Family Management
    await page.click('[data-testid="tab-family"]');
    await expect(page.getByText('Family Management')).toBeVisible();

    // Find own row (should have email in it)
    const ownRow = page.locator('tr').filter({ hasText: gmEmail });
    await expect(ownRow).toBeVisible();
    await expect(ownRow.getByText('Guild Master')).toBeVisible();

    // Verify NO demote button exists for self
    await expect(ownRow.getByRole('button', { name: /Demote/i })).not.toBeVisible();

    // Should see a dash or empty actions
    await expect(ownRow.getByText('-')).toBeVisible();
  });

  test('Non-GM cannot access Family Management tab', async ({ page }) => {
    // Create GM and get family code
    const gmEmail = `gm-access-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'access-test', {
      characterClass: 'KNIGHT',
      email: gmEmail,
      password: 'testpass123',
    });

    const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
    const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';

    // Logout
    await page.click('text=Logout');

    // Create Hero user
    const heroEmail = `hero-access-${Date.now()}@test.com`;
    await page.goto('/auth/register');
    await page.fill('[data-testid="email-input"]', heroEmail);
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.fill('[data-testid="name-input"]', 'Hero User');
    await page.fill('[data-testid="family-code-input"]', familyCode);
    await page.click('[data-testid="register-button"]');

    await expect(page).toHaveURL(/.*character\/create/);
    await page.fill('[data-testid="character-name-input"]', 'Hero Character');
    await page.click('[data-testid="class-MAGE"]');
    await page.click('[data-testid="create-character-button"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify Family Management tab does NOT exist
    await expect(page.getByTestId('tab-family')).not.toBeVisible();

    // Verify Hero only sees Quests and Rewards tabs
    await expect(page.getByTestId('tab-quests')).toBeVisible();
    await expect(page.getByTestId('tab-rewards')).toBeVisible();
    await expect(page.getByTestId('tab-templates')).not.toBeVisible();
    await expect(page.getByTestId('tab-family')).not.toBeVisible();
  });

  test('Role badges display correctly throughout app', async ({ page }) => {
    // Create GM
    const gmEmail = `gm-badges-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'badge-test', {
      characterClass: 'KNIGHT',
      email: gmEmail,
      password: 'testpass123',
      userName: 'Guild Master User',
    });

    // Verify GM badge in header
    await expect(page.getByText('👑 Guild Master')).toBeVisible();

    // Navigate to Family Management
    await page.click('[data-testid="tab-family"]');

    // Verify badge in family list
    const gmRow = page.locator('tr').filter({ hasText: 'Guild Master User' });
    await expect(gmRow.getByText('👑')).toBeVisible();
    await expect(gmRow.getByText('Guild Master')).toBeVisible();
  });
});
