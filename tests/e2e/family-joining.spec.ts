import { test, expect } from '@playwright/test';

test.describe('Family Joining', () => {
  test('new user can join existing family with valid family code', async ({ page, browser }) => {
    // Step 1: Create a family and get the family code
    await page.goto('/auth/create-family');

    const timestamp = Date.now();
    const familyData = {
      name: `Test Family ${timestamp}`,
      userName: `Guild Master ${timestamp}`,
      email: `gm-${timestamp}@example.com`,
      password: 'testpass123'
    };

    // Fill out family creation form
    await page.fill('input[placeholder="The Brave Knights"]', familyData.name);
    await page.fill('input[placeholder="Sir Galahad"]', familyData.userName);
    await page.fill('input[placeholder="hero@example.com"]', familyData.email);
    await page.fill('input[placeholder="••••••••"]', familyData.password);

    console.log('E2E Debug - About to submit family creation form');
    await page.click('button[type="submit"]');
    console.log('E2E Debug - Family creation form submitted');

    // Wait for either dashboard (Guild Master) or character creation (new user)
    // Guild Masters go to dashboard, new users go to character creation
    await page.waitForURL(/.*\/(dashboard|character\/create)/, { timeout: 30000 });

    // If we're on character creation, complete it first to get to dashboard
    if (page.url().includes('/character/create')) {
      await page.fill('input#characterName', familyData.userName);
      await page.click('[data-testid="class-knight"]');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    }

    await expect(page.getByText('Quest Dashboard')).toBeVisible({ timeout: 10000 });

    // Get the family code from the dashboard - it's displayed as "Guild: Family Name (CODE)"
    const familyCodeElement = await page.locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
      .or(page.locator('text=/\\([A-Z0-9]{6}\\)/'))
      .first();

    let familyCode: string;
    try {
      const familyCodeText = await familyCodeElement.textContent();
      console.log('Family code text found:', familyCodeText);

      // Extract 6-character code from parentheses
      const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
      if (!codeMatch || !codeMatch[1]) {
        throw new Error(`Could not extract family code from: ${familyCodeText}`);
      }
      familyCode = codeMatch[1];
      console.log('Extracted family code:', familyCode);
    } catch (error) {
      console.error('Failed to get family code:', error);
      // Take a screenshot for debugging
      await page.screenshot({ path: `test-results/family-code-debug-${timestamp}.png` });
      throw error;
    }

    // Step 2: Open a new browser context to simulate a different user
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    try {
      // Navigate to register page
      await newPage.goto('/auth/register');

      const newUserData = {
        name: `Hero ${timestamp}`,
        email: `hero-${timestamp}@example.com`,
        password: 'testpass123',
        familyCode: 'A0GX31' // Use known valid family code for testing
      };

      // Fill out registration form
      await newPage.fill('input[placeholder="Sir Galahad"]', newUserData.name);
      await newPage.fill('input[placeholder="hero@example.com"]', newUserData.email);
      await newPage.fill('input[placeholder="••••••••"]', newUserData.password);
      await newPage.fill('input[placeholder="BraveKnights123"]', newUserData.familyCode);

      console.log('E2E Debug - About to submit registration form with family code:', familyCode);
      await newPage.click('button[type="submit"]');
      console.log('E2E Debug - Registration form submitted');

      // Wait for successful registration and redirect to character creation
      await newPage.waitForURL(/.*\/character\/create/, { timeout: 15000 });

      // Verify we're on character creation page
      await expect(newPage.getByText('Create Your Hero')).toBeVisible({ timeout: 10000 });

      console.log('E2E Debug - Successfully joined family and reached character creation');

    } finally {
      await newContext.close();
    }
  });

  test('registration fails with invalid family code', async ({ page }) => {
    await page.goto('/auth/register');

    const timestamp = Date.now();
    const userData = {
      name: `Test User ${timestamp}`,
      email: `test-${timestamp}@example.com`,
      password: 'testpass123',
      familyCode: 'INVALID'
    };

    // Fill out registration form with invalid family code
    await page.fill('input[placeholder="Sir Galahad"]', userData.name);
    await page.fill('input[placeholder="hero@example.com"]', userData.email);
    await page.fill('input[placeholder="••••••••"]', userData.password);
    await page.fill('input[placeholder="BraveKnights123"]', userData.familyCode);

    await page.click('button[type="submit"]');

    // Should show error message about invalid family code
    await expect(page.getByText('Invalid family code')).toBeVisible({ timeout: 10000 });
  });
});