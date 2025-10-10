import { test, expect } from './helpers/family-fixture';

test.describe.serial('Worker-scoped Fixture Verification', () => {
  let initialGmEmail: string;

  test('Test 1: GM user should persist across tests', async ({ workerFamily }) => {
    initialGmEmail = workerFamily.gmEmail;
    expect(initialGmEmail).toContain('worker');

    // Verify GM is logged in
    await workerFamily.gmPage.goto('/dashboard');
    await expect(workerFamily.gmPage.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(workerFamily.gmPage.locator('body')).toContainText(workerFamily.characterName);
  });

  test('Test 2: GM user is the same as in Test 1', async ({ workerFamily }) => {
    // This test runs in the same worker, so the GM user should be the same
    expect(workerFamily.gmEmail).toBe(initialGmEmail);

    // Verify GM is still logged in
    await workerFamily.gmPage.goto('/dashboard');
    await expect(workerFamily.gmPage.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('Test 3: Can create and use an ephemeral user', async ({ workerFamily }) => {
    const ephemeralUser = await workerFamily.createEphemeralUser('ephemeral-hero');

    // Verify the ephemeral user is logged in and on the dashboard
    await expect(ephemeralUser.page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(ephemeralUser.page.locator('body')).toContainText(ephemeralUser.characterName);

    // Verify the GM is still logged in in their own context
    await workerFamily.gmPage.goto('/dashboard');
    await expect(workerFamily.gmPage.locator('[data-testid="welcome-message"]')).toBeVisible();

    // Close the ephemeral user's context
    await ephemeralUser.context.close();
  });
});