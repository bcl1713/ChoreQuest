import { test, expect } from '@playwright/test';
import { setupUserWithCharacter, loginUser } from './helpers/setup-helpers';
import { logout, getFamilyCode, joinExistingFamily } from './helpers/auth-helpers';

test.describe('Family Management', () => {
  test('Guild Master promotes Hero to Guild Master successfully', async ({ page }) => {
    // Create first user (Guild Master)
    const gmEmail = `gm-promote-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'promote-test', {
      characterClass: 'KNIGHT',
      email: gmEmail,
      password: 'testpass123',
    });

    const familyCode = await getFamilyCode(page);
    await logout(page);

    // Create second user (Hero) and join same family
    const heroEmail = `hero-${Date.now()}@test.com`;
    await joinExistingFamily(page, familyCode, {
      name: 'Hero User',
      email: heroEmail,
      password: 'testpass123',
    });

    // Create character for Hero
    await expect(page).toHaveURL(/.*character\/create/);
    await page.getByRole('textbox', { name: 'Hero Name' }).fill('Hero Character');
    await page.click('[data-testid="class-mage"]');
    await page.getByRole('button', { name: /Begin Your Quest/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    await logout(page);

    // Login as GM
    await loginUser(page, gmEmail, 'testpass123');

    // Navigate to Family Management tab
    await page.click('[data-testid="tab-family"]');
    await expect(page.getByText('Family Management')).toBeVisible();

    // Verify Hero User is in the list with Young Hero role (default for new family members)
    const heroRow = page.locator('tr').filter({ hasText: 'Hero User' });
    await expect(heroRow).toBeVisible();
    await expect(heroRow.getByText('Young Hero')).toBeVisible();

    // Click Promote button (Young Heroes can now be promoted to GM)
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

    const familyCode = await getFamilyCode(page);
    await logout(page);

    // Create second user and join
    const gm2Email = `gm2-${Date.now()}@test.com`;
    await joinExistingFamily(page, familyCode, {
      name: 'Second GM',
      email: gm2Email,
      password: 'testpass123',
    });

    await expect(page).toHaveURL(/.*character\/create/);
    await page.getByRole('textbox', { name: 'Hero Name' }).fill('Second Character');
    await page.click('[data-testid="class-ranger"]');
    await page.getByRole('button', { name: /Begin Your Quest/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    await logout(page);

    // Login as first GM
    await loginUser(page, gm1Email, 'testpass123');

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
    await expect(page.getByRole('heading', { name: 'Demote to Hero' })).toBeVisible();
    await expect(page.getByText(/Are you sure you want to demote/)).toBeVisible();
    await page.getByRole('button', { name: /Confirm Demotion/i }).click();

    // Verify Second GM is now Hero
    await expect(secondUserRow.getByText('Hero')).toBeVisible();
    await expect(secondUserRow.getByText('🛡️')).toBeVisible();

    // Verify Demote button is gone, Promote button is back
    await expect(secondUserRow.getByRole('button', { name: /Demote to Hero/i })).not.toBeVisible();
    await expect(secondUserRow.getByRole('button', { name: /Promote to GM/i })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Family Management' })).toBeVisible();

    // Find own row (should have email in it)
    const ownRow = page.locator('tr').filter({ hasText: gmEmail });
    await expect(ownRow).toBeVisible();
    await expect(ownRow.getByText('Guild Master')).toBeVisible();

    // Verify NO demote button exists for self
    await expect(ownRow.getByRole('button', { name: /Demote/i })).not.toBeVisible();

    // Should see a dash in the actions cell
    const actionsCell = ownRow.locator('td').last();
    await expect(actionsCell).toContainText('-');
  });

  test('Non-GM cannot access Family Management tab', async ({ page }) => {
    // Create GM and get family code
    const gmEmail = `gm-access-${Date.now()}@test.com`;
    await setupUserWithCharacter(page, 'access-test', {
      characterClass: 'KNIGHT',
      email: gmEmail,
      password: 'testpass123',
    });

    const familyCode = await getFamilyCode(page);
    await logout(page);

    // Create Hero user
    const heroEmail = `hero-access-${Date.now()}@test.com`;
    await joinExistingFamily(page, familyCode, {
      name: 'Hero User',
      email: heroEmail,
      password: 'testpass123',
    });

    await expect(page).toHaveURL(/.*character\/create/);
    await page.getByRole('textbox', { name: 'Hero Name' }).fill('Hero Character');
    await page.click('[data-testid="class-mage"]');
    await page.getByRole('button', { name: /Begin Your Quest/i }).click();
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
    // Check for role badge with crown emoji and text (no space between emoji and text)
    await expect(gmRow.locator('td').nth(2)).toContainText('👑Guild Master');
  });
});
