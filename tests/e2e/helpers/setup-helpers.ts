import { Page, expect } from "@playwright/test";
import { clearBrowserState } from "./auth-helpers";
import {
  createCustomQuest,
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./quest-helpers";

// Type declarations for window objects used in tests
declare global {
  interface Window {
    __authContext?: {
      user?: {
        id: string;
      };
      profile?: {
        family_id: string;
        character_id: string;
      };
    };
  }
}

export interface TestUser {
  email: string;
  password: string;
  userName: string;
  familyName: string;
  characterName: string;
}

export interface SetupOptions {
  characterClass?: "KNIGHT" | "MAGE" | "RANGER" | "ROGUE" | "HEALER";
  skipCharacterCreation?: boolean;
  email?: string;
  password?: string;
  userName?: string;
}

/**
 * Creates a unique test user with timestamp-based email
 */
export function createTestUser(prefix: string): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000); // Add randomness for sub-millisecond uniqueness
  const uniqueId = `${timestamp}-${random}`;
  return {
    email: `${prefix}-${uniqueId}@example.com`,
    password: "testpass123",
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
  options: SetupOptions = {},
): Promise<TestUser> {
  const user =
    options.email && options.password
      ? {
          email: options.email,
          password: options.password,
          userName: options.userName || `${prefix} User`,
          familyName: `${prefix} Family`,
          characterName: `${prefix} Character`,
        }
      : createTestUser(prefix);
  const characterClass = options.characterClass || "KNIGHT";

  // Clear browser state
  await clearBrowserState(page);

  // Navigate to home and start family creation
  await page.goto("/");
  await page.click('[data-testid="create-family-button"]');
  await expect(page).toHaveURL(/.*\/auth\/create-family/);

  // Fill family creation form
  await page.fill('input[name="name"]', user.familyName);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="userName"]', user.userName);

  await page.click('button[type="submit"]');

  if (!options.skipCharacterCreation) {
    // Complete character creation - wait longer for Supabase auth
    await page.waitForURL(/.*\/character\/create/, { timeout: 25000 });
    await page.fill("input#characterName", user.characterName);
    await page.click(`[data-testid="class-${characterClass.toLowerCase()}"]`);

    // Add a small delay before clicking the submit button to ensure state is ready

    await page.click('button:text("Begin Your Quest")');

    // Wait for either dashboard or any error states - be more flexible
    try {
      await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
      await expect(
        page.locator('[data-testid="welcome-message"]'),
      ).toContainText(`Welcome back, ${user.characterName}!`, {
        timeout: 10000,
      });
    } catch (error) {
      throw error;
    }
  }

  return user;
}

/**
 * Sets up user but stops at character creation page
 * Character name should be pre-filled from family creation
 */
export async function setupUserAtCharacterCreation(
  page: Page,
  prefix: string,
): Promise<TestUser> {
  const user = createTestUser(prefix);

  await clearBrowserState(page);
  await page.goto("/");
  await page.click('[data-testid="create-family-button"]');
  await expect(page).toHaveURL(/.*\/auth\/create-family/);

  await page.fill('input[name="name"]', user.familyName);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="userName"]', user.userName);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*\/character\/create/, { timeout: 15000 });

  // Wait for character creation form to be ready

  return user;
}

/**
 * Logs in an existing user (requires user to already exist)
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await clearBrowserState(page);
  await page.goto("/", { waitUntil: "networkidle" }); // Wait for page to fully load

  // Check if "Enter the Realm" link exists (for already logged in users)
  const enterRealmLink = page.locator('text="🏰 Enter Your Realm"');
  if (await enterRealmLink.isVisible({ timeout: 1000 })) {
    await enterRealmLink.click();
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    return;
  }

  // Navigate to login page - wait for element to be stable and attached
  await page.waitForSelector('[data-testid="login-link"]', {
    state: "attached",
  });
  await page.locator('[data-testid="login-link"]').waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
  await page.locator('[data-testid="login-link"]').click();
  await expect(page).toHaveURL(/.*\/auth\/login/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for Supabase auth to complete and navigation to dashboard
  await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
}

// clearBrowserState has been moved to auth-helpers.ts and is imported above

/**
 * Common beforeEach setup for E2E tests
 */
export async function commonBeforeEach(page: Page): Promise<void> {
  await clearBrowserState(page);
  await page.goto("/");
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
  role?: "GUILD_MASTER" | "HERO";
}

/**
 * Creates a test user with full character setup and returns user info including IDs
 * Used specifically for reward store E2E tests that need user/family/character IDs
 */
export async function setupTestUser(
  page: Page,
  options?: SetupTestUserOptions,
): Promise<{ user: TestUserInfo }> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000); // Add randomness to avoid conflicts
  const uniqueId = `${timestamp}-${random}`;
  const role = options?.role || "GUILD_MASTER";
  const prefix = role === "GUILD_MASTER" ? "guildmaster" : "hero";

  const testUser: TestUser = {
    email: `${prefix}-${uniqueId}@example.com`,
    password: "testpass123",
    userName: `${prefix} User ${uniqueId}`,
    familyName: `${prefix} Family ${uniqueId}`,
    characterName: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${uniqueId}`,
  };

  await clearBrowserState(page);

  // Always create new family and character for simplicity
  // We'll handle multi-user setup differently
  await page.goto("/");
  await page.click('[data-testid="create-family-button"]');
  await expect(page).toHaveURL(/.*\/auth\/create-family/);

  await page.fill('input[name="name"]', testUser.familyName);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.fill('input[name="userName"]', testUser.userName);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*\/character\/create/, { timeout: 15000 });
  await page.fill("input#characterName", testUser.characterName);
  await page.click(`[data-testid="class-knight"]`);
  await page.click('button:text("Begin Your Quest")');

  await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

  // Get the created user info from Supabase session
  const authData = await page.evaluate(async () => {
    // Wait a bit for auth state to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the user ID and profile from the page's auth context
    const authDiv = document.querySelector("[data-auth-user]");
    if (authDiv) {
      return {
        user: {
          id: authDiv.getAttribute("data-auth-user"),
          familyId: authDiv.getAttribute("data-auth-family"),
          characterId: authDiv.getAttribute("data-auth-character"),
        },
      };
    }

    // Fallback: try to get from window object if auth context exposes it
    if (window.__authContext) {
      const ctx = window.__authContext;
      return {
        user: {
          id: ctx.user?.id,
          familyId: ctx.profile?.family_id,
          characterId: ctx.profile?.character_id,
        },
      };
    }

    return { user: {} };
  });

  const userInfo = authData.user || {};

  // If we need to update family association for multi-user tests
  if (options?.familyId && options.familyId !== userInfo.familyId) {
    await page.evaluate(
      async ({ targetFamilyId, userId }) => {
        const response = await fetch("/api/test/user/update-family", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            familyId: targetFamilyId,
          }),
        });
        if (!response.ok) throw new Error("Failed to update user family");
      },
      { targetFamilyId: options.familyId, userId: userInfo.id },
    );

    // Update the userInfo to reflect the family change
    return {
      user: {
        email: testUser.email,
        password: testUser.password,
        id: userInfo.id || "",
        familyId: options.familyId,
        characterId: userInfo.characterId || "",
      },
    };
  }

  return {
    user: {
      email: testUser.email,
      password: testUser.password,
      id: userInfo.id || "",
      familyId: userInfo.familyId || "",
      characterId: userInfo.characterId || "",
    },
  };
}

/**
 * Awards gold to the current character by creating and completing a quest
 * This uses the actual game mechanics to award gold naturally
 * @param page - Playwright page object
 * @param goldAmount - Amount of gold to award (before difficulty multipliers)
 */
export async function giveCharacterGoldViaQuest(
  page: Page,
  goldAmount: number,
): Promise<void> {
  const timestamp = Date.now();
  const questTitle = `Test Gold Award ${timestamp}`;

  // Create a quest with specified gold reward (using EASY difficulty for 1.0x multiplier)
  // Skip visibility check here since we'll verify after switching to Quests tab
  await createCustomQuest(page, {
    title: questTitle,
    description: "Automated test quest for gold award",
    difficulty: "EASY",
    xpReward: 1,
    goldReward: goldAmount,
    skipVisibilityCheck: true,
  });

  // Switch to Quests tab to see the created quest
  await page.click('button:has-text("⚔️ Quests & Adventures")');

  // Wait for tab transition to complete
  await page.waitForLoadState("networkidle");

  // Wait for quest to appear (generous timeout for parallel runs)
  await expect(page.getByText(questTitle).first()).toBeVisible({
    timeout: 10000,
  });

  // Complete the quest workflow: pickup -> start -> complete -> approve
  await pickupQuest(page);
  await startQuest(page);
  await completeQuest(page);
  await approveQuest(page);
}
