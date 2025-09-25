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

export interface TestUserInfo {
  email: string;
  password: string;
  id: string;
  familyId: string;
  characterId: string;
}

export interface SetupTestUserOptions {
  familyId?: string;
  role?: 'GUILD_MASTER' | 'HERO';
}

/**
 * Creates a test user with full character setup and returns user info including IDs
 * Used specifically for reward store E2E tests that need user/family/character IDs
 */
export async function setupTestUser(page: Page, options?: SetupTestUserOptions): Promise<{ user: TestUserInfo }> {
  const timestamp = Date.now() + Math.random(); // Add randomness to avoid conflicts
  const role = options?.role || 'GUILD_MASTER';
  const prefix = role === 'GUILD_MASTER' ? 'guildmaster' : 'hero';

  const testUser: TestUser = {
    email: `${prefix}-${Math.floor(timestamp)}@example.com`,
    password: 'testpass123',
    userName: `${prefix} User ${Math.floor(timestamp)}`,
    familyName: `${prefix} Family ${Math.floor(timestamp)}`,
    characterName: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${Math.floor(timestamp)}`,
  };

  await clearBrowserState(page);

  // Always create new family and character for simplicity
  // We'll handle multi-user setup differently
  await page.goto('/');
  await page.getByText('🏰 Create Family Guild').click();
  await expect(page).toHaveURL(/.*\/auth\/create-family/);

  await page.fill('input[name="name"]', testUser.familyName);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.fill('input[name="userName"]', testUser.userName);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
  await page.fill('input#characterName', testUser.characterName);
  await page.click(`[data-testid="class-knight"]`);
  await page.click('button:text("Begin Your Quest")');

  await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });

  // Get the created user info from localStorage
  const authData = await page.evaluate(() => {
    const stored = localStorage.getItem('chorequest-auth');
    return stored ? JSON.parse(stored) : {};
  });

  const userInfo = authData.user || {};

  // If we need to update family association for multi-user tests
  if (options?.familyId && options.familyId !== userInfo.familyId) {
    await page.evaluate(async ({ targetFamilyId, userId }) => {
      const response = await fetch('/api/test/user/update-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          familyId: targetFamilyId
        })
      });
      if (!response.ok) throw new Error('Failed to update user family');
    }, { targetFamilyId: options.familyId, userId: userInfo.id });

    // Update the userInfo to reflect the family change
    return {
      user: {
        email: testUser.email,
        password: testUser.password,
        id: userInfo.id,
        familyId: options.familyId,
        characterId: userInfo.characterId
      }
    };
  }

  return {
    user: {
      email: testUser.email,
      password: testUser.password,
      id: userInfo.id,
      familyId: userInfo.familyId || authData.family?.id,
      characterId: userInfo.characterId
    }
  };
}