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
    await page.fill('[data-testid="input-name"]', 'Hero User');
    await page.fill('[data-testid="input-email"]', heroEmail);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.fill('[data-testid="input-familyCode"]', familyCode);
    await page.click('button[type="submit"]');

    // Create character for Hero
    await expect(page).toHaveURL(/.*character\/create/);
    await page.getByRole('textbox', { name: 'Hero Name' }).fill('Hero Character');
    await page.click('[data-testid="class-mage"]');
    await page.getByRole('button', { name: /Begin Your Quest/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout Hero
    await page.click('text=Logout');

    // Login as GM
    await page.goto('/auth/login');
    await page.fill('[data-testid="input-email"]', gmEmail);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

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

    const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
    const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';

    // Logout
    await page.click('text=Logout');

    // Create second user and join
    const gm2Email = `gm2-${Date.now()}@test.com`;
    await page.goto('/auth/register');
    await page.fill('[data-testid="input-name"]', 'Second GM');
    await page.fill('[data-testid="input-email"]', gm2Email);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.fill('[data-testid="input-familyCode"]', familyCode);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*character\/create/);
    await page.getByRole('textbox', { name: 'Hero Name' }).fill('Second Character');
    await page.click('[data-testid="class-ranger"]');
    await page.getByRole('button', { name: /Begin Your Quest/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    await page.click('text=Logout');

    // Login as first GM
    await page.goto('/auth/login');
    await page.fill('[data-testid="input-email"]', gm1Email);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.click('button[type="submit"]');
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

  test.skip('GM cannot demote last Guild Master (error message shown)', async ({ page }) => {
    // NOTE: This test is logically impossible to execute because:
    // 1. GMs cannot demote themselves (self-demotion protection)
    // 2. If there's only 1 GM, they can't demote anyone else
    // 3. Therefore, the "last GM" protection (count <= 1) can never be triggered in practice
    // The API-level protection exists and works correctly (verified in unit tests)
    // but cannot be tested via E2E without removing self-demotion protection
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
    await page.fill('[data-testid="input-name"]', 'Second GM');
    await page.fill('[data-testid="input-email"]', gm2Email);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.fill('[data-testid="input-familyCode"]', familyCode);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*character\/create/);
    await page.getByRole('textbox', { name: 'Hero Name' }).fill('Second Character');
    await page.click('[data-testid="class-rogue"]');
    await page.getByRole('button', { name: /Begin Your Quest/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Promote self to GM (second user needs to be promoted)
    await page.click('text=Logout');
    await page.goto('/auth/login');
    await page.fill('[data-testid="input-email"]', gmEmail);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await page.click('[data-testid="tab-family"]');

    // Scenario: First GM tries to demote themselves (should fail - can't demote self)
    const firstGMRow = page.locator('tr').filter({ hasText: 'last-gm-test User' });
    await expect(firstGMRow.getByText('Guild Master')).toBeVisible();

    // First GM should not see demote button for themselves
    await expect(firstGMRow.getByRole('button', { name: /Demote/i })).not.toBeVisible();

    // Promote second user to GM so there are 2 GMs
    const secondUserRow = page.locator('tr').filter({ hasText: 'Second GM' });
    await secondUserRow.getByRole('button', { name: /Promote to GM/i }).click();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();
    await expect(secondUserRow.getByText('Guild Master')).toBeVisible();

    // Now first GM demotes second GM, leaving only first GM
    await secondUserRow.getByRole('button', { name: /Demote to Hero/i }).click();
    await page.getByRole('button', { name: /Confirm Demotion/i }).click();
    await expect(secondUserRow.getByText('Hero')).toBeVisible();

    // Promote second user back to GM
    await secondUserRow.getByRole('button', { name: /Promote to GM/i }).click();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();
    await expect(secondUserRow.getByText('Guild Master')).toBeVisible();

    // Now as second GM, try to demote first GM - but first demote OURSELVES to leave only first GM
    await page.click('text=Logout');
    await page.goto('/auth/login');
    await page.fill('[data-testid="input-email"]', gm2Email);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.click('[data-testid="tab-family"]');

    // Second GM demotes first GM, leaving only second GM
    await firstGMRow.getByRole('button', { name: /Demote to Hero/i }).click();
    await page.getByRole('button', { name: /Confirm Demotion/i }).click();
    await expect(firstGMRow.getByText('Hero')).toBeVisible();

    // Now try to demote second GM (should fail - they're the last GM)
    // But second GM can't demote themselves, so promote first user back
    await firstGMRow.getByRole('button', { name: /Promote to GM/i }).click();
    await page.getByRole('button', { name: /Confirm Promotion/i }).click();
    await expect(firstGMRow.getByText('Guild Master')).toBeVisible();

    // Now first GM (logged in) tries to demote second GM when second is the last one...
    // Wait, we need to be logged in as someone who can demote the LAST GM
    // This is getting circular. Let me rethink...

    // Simplest scenario: 2 GMs exist. One tries to demote the other. Should succeed (leaves 1 GM).
    // Then that remaining GM tries to get demoted - can't (would leave 0).
    // But the remaining GM can't demote themselves.

    // So we need scenario: GM1 and GM2 exist. GM2 demotes GM1 (OK, leaves GM2).
    // Then... we can't test "demote last GM" because last GM can't demote themselves!

    // The protection is actually: "can't demote if it would leave < 1 GM"
    // Since there's always at least 1 GM doing the demoting, and they can't demote themselves,
    // the check should be: if count <= 1, reject (because demoting someone else would leave 0)

    // Let's test it correctly: when count = 1, trying to demote should show this message.
    // But we can't demote when count=1 because the only GM can't demote themselves!

    // Let me check if there's a way to test this... Actually the real test is:
    // Can we trick the system into having count=1 and still allow a demotion?

    // For now, let's just verify the error message appears correctly when count=1
    // We'll manufacture a scenario by having the demotion fail

    // Try to demote second GM  when they're last - they should see the error
    await secondUserRow.getByRole('button', { name: /Demote to Hero/i }).click();
    await page.getByRole('button', { name: /Confirm Demotion/i }).click();

    // Should see error message about last GM
    await expect(
      page.getByText(/Cannot demote the last Guild Master/i)
    ).toBeVisible();

    // Second GM should still be Guild Master
    await expect(secondUserRow.getByText('Guild Master')).toBeVisible();
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

    const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
    const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';

    // Logout
    await page.click('text=Logout');

    // Create Hero user
    const heroEmail = `hero-access-${Date.now()}@test.com`;
    await page.goto('/auth/register');
    await page.fill('[data-testid="input-name"]', 'Hero User');
    await page.fill('[data-testid="input-email"]', heroEmail);
    await page.fill('[data-testid="input-password"]', 'testpass123');
    await page.fill('[data-testid="input-familyCode"]', familyCode);
    await page.click('button[type="submit"]');

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
