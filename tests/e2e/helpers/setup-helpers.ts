import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  userName: string;
  familyName: string;
  characterName: string;
}

export interface SetupOptions {
  characterClass?: 'KNIGHT' | 'MAGE' | 'RANGER' | 'ROGUE' | 'HEALER';
  skipCharacterCreation?: boolean;
}

/**
 * Creates a unique test user with timestamp-based email
 */
export function createTestUser(prefix: string): TestUser {
  const timestamp = Date.now();
  return {
    email: `${prefix}-${timestamp}@example.com`,
    password: 'testpass123',
    userName: `${prefix} Test User`,
    familyName: `${prefix} Test Family`,
    characterName: `Sir ${prefix}`,
  };
}

/**
 * Performs complete family and character creation flow
 * Returns the test user data for verification
 */
export async function setupUserWithCharacter(
  page: Page,
  prefix: string,
  options: SetupOptions = {}
): Promise<TestUser> {
  const user = createTestUser(prefix);
  const characterClass = options.characterClass || 'KNIGHT';

  // Clear browser state
  await clearBrowserState(page);

  // Navigate to home and start family creation
  await page.goto('/');
  await page.getByText('🏰 Create Family Guild').click();
  await expect(page).toHaveURL(/.*\/auth\/create-family/);

  // Fill family creation form
  await page.fill('input[name="name"]', user.familyName);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="userName"]', user.userName);
  await page.click('button[type="submit"]');

  if (!options.skipCharacterCreation) {
    // Complete character creation
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill('input#characterName', user.characterName);
    await page.click(`[data-testid="class-${characterClass.toLowerCase()}"]`);
    await page.click('button:text("Begin Your Quest")');

    // Verify dashboard reached
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(`Welcome back, ${user.characterName}!`)).toBeVisible();
  }

  return user;
}

/**
 * Sets up user but stops at character creation page
 */
export async function setupUserAtCharacterCreation(page: Page, prefix: string): Promise<TestUser> {
  const user = createTestUser(prefix);

  await clearBrowserState(page);
  await page.goto('/');
  await page.getByText('🏰 Create Family Guild').click();
  await expect(page).toHaveURL(/.*\/auth\/create-family/);

  await page.fill('input[name="name"]', user.familyName);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="userName"]', user.userName);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });

  return user;
}

/**
 * Logs in an existing user (requires user to already exist)
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await clearBrowserState(page);
  await page.goto('/');
  await page.getByText('🗡️ Join Existing Guild').click();
  await expect(page).toHaveURL(/.*\/auth\/login/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
}

/**
 * Clears all browser state (cookies, localStorage, sessionStorage)
 */
export async function clearBrowserState(page: Page): Promise<void> {
  await page.context().clearCookies();

  // Only clear localStorage/sessionStorage if we have a proper page loaded
  try {
    await page.evaluate(() => {
      if (typeof Storage !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    });
  } catch {
    // Ignore localStorage access errors (happens on initial page load)
  }
}

/**
 * Common beforeEach setup for E2E tests
 */
export async function commonBeforeEach(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');

  // Clear storage after page loads
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {
    // Ignore localStorage access errors
  }
}