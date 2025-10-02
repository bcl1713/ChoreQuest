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

    await page.click('button[type="submit"]');

    // After family creation, wait for page to settle and check where we end up
    await page.waitForURL(/.*\/(dashboard|character\/create)/, { timeout: 30000 });

    // Give the page some time to potentially redirect to character creation
    await page.waitForTimeout(2000);

    // Handle character creation if we end up there (Guild Masters need characters too)
    if (page.url().includes('/character/create')) {
      await page.waitForTimeout(1000); // Wait for form to be ready

      // Fill in character name using the ID selector (more reliable)
      await page.fill('input#characterName', familyData.userName);
      await page.waitForTimeout(500);

      // Select Knight class
      await page.click('[data-testid="class-knight"]');
      await page.waitForTimeout(500);

      // Verify button is enabled before clicking
      const submitButton = page.locator('button:text("Begin Your Quest")');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });

      // Click the "Begin Your Quest" button
      await submitButton.click();

      // Wait for navigation with better error handling
      try {
        await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
      } catch (error) {
        throw error;
      }
    }

    // Wait for dashboard to load completely
    await expect(page.getByText('Quest Dashboard')).toBeVisible({ timeout: 10000 });

    // Get the family code from the dashboard - it's displayed as "Guild: Family Name (CODE)"
    const familyCodeElement = await page.locator('text=/Guild:.*\\([A-Z0-9]{6}\\)/')
      .or(page.locator('text=/\\([A-Z0-9]{6}\\)/'))
      .first();

    let familyCode: string;
    try {
      const familyCodeText = await familyCodeElement.textContent();

      // Extract 6-character code from parentheses
      const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
      if (!codeMatch || !codeMatch[1]) {
        throw new Error(`Could not extract family code from: ${familyCodeText}`);
      }
      familyCode = codeMatch[1];
    } catch (error) {
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
        familyCode: familyCode // Use the extracted family code from the first user
      };

      // Fill out registration form
      await newPage.fill('input[placeholder="Sir Galahad"]', newUserData.name);
      await newPage.fill('input[placeholder="hero@example.com"]', newUserData.email);
      await newPage.fill('input[placeholder="••••••••"]', newUserData.password);
      await newPage.fill('input[placeholder="BraveKnights123"]', newUserData.familyCode);

      await newPage.click('button[type="submit"]');

      // Wait for successful registration and redirect to character creation
      await newPage.waitForURL(/.*\/character\/create/, { timeout: 15000 });

      // Verify we're on character creation page using a more specific selector
      await expect(newPage.getByRole('heading', { name: 'Create Your Hero' }).first()).toBeVisible({ timeout: 10000 });

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