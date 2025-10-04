import { Page, expect } from "@playwright/test";

/**
 * Auth Helper Functions for E2E Tests
 *
 * This module provides reusable authentication and family management helpers
 * to reduce code duplication across E2E tests.
 */

/**
 * Logs out the current user and verifies navigation to login/home page
 *
 * @example
 * ```typescript
 * await logout(page);
 * // User is now logged out and on home/login page
 * ```
 */
export async function logout(page: Page): Promise<void> {
  await page.click("text=Logout");
  await expect(page).toHaveURL(/.*\/(auth\/login)?/);
}

/**
 * Extracts the family invite code from the dashboard
 *
 * The family code is displayed as "Guild: Family Name (CODE)" where CODE is a 6-character alphanumeric string.
 *
 * @param page - Playwright page object (must be on dashboard)
 * @returns The 6-character family invite code
 * @throws Error if family code cannot be found or extracted
 *
 * @example
 * ```typescript
 * await page.goto('/dashboard');
 * const code = await getFamilyCode(page);
 * console.log(code); // e.g., "ABC123"
 * ```
 */
export async function getFamilyCode(page: Page): Promise<string> {
  const familyCodeElement = await page
    .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
    .or(page.locator("text=/\\([A-Z0-9]{6}\\)/"))
    .first();

  const familyCodeText = await familyCodeElement.textContent();

  // Extract 6-character code from parentheses
  const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
  if (!codeMatch || !codeMatch[1]) {
    throw new Error(`Could not extract family code from: ${familyCodeText}`);
  }

  return codeMatch[1];
}

export interface JoinFamilyUserData {
  name: string;
  email: string;
  password: string;
}

/**
 * Registers a new user and joins an existing family using an invite code
 *
 * This helper navigates to the registration page, fills out the form with the provided
 * user data and family code, and waits for navigation to the character creation page.
 *
 * @param page - Playwright page object
 * @param inviteCode - 6-character family invite code
 * @param userData - User registration data (name, email, password)
 *
 * @example
 * ```typescript
 * const familyCode = await getFamilyCode(gmPage);
 * await joinExistingFamily(heroPage, familyCode, {
 *   name: "Hero McHeroface",
 *   email: "hero@example.com",
 *   password: "testpass123"
 * });
 * // heroPage is now on character creation screen
 * ```
 */
export async function joinExistingFamily(
  page: Page,
  inviteCode: string,
  userData: JoinFamilyUserData,
): Promise<void> {
  await page.goto("/auth/register");

  // Fill out registration form
  await page.fill('input[placeholder="Sir Galahad"]', userData.name);
  await page.fill('input[placeholder="hero@example.com"]', userData.email);
  await page.fill('input[placeholder="••••••••"]', userData.password);
  await page.fill('input[placeholder="BraveKnights123"]', inviteCode);

  await page.click('button[type="submit"]');

  // Wait for successful registration and redirect to character creation
  await page.waitForURL(/.*\/character\/create/, { timeout: 15000 });

  // Verify we're on character creation page
  await expect(
    page.getByRole("heading", { name: "Create Your Hero" }).first(),
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Clears all browser state (cookies, localStorage, sessionStorage)
 *
 * This is useful for ensuring a clean slate between tests or when switching users.
 * Already exported from setup-helpers.ts, but re-exported here for convenience
 * in auth-related workflows.
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * await clearBrowserState(page);
 * // Browser state is cleared, ready for fresh login
 * ```
 */
export async function clearBrowserState(page: Page): Promise<void> {
  await page.context().clearCookies();

  // Only clear localStorage/sessionStorage if we have a proper page loaded
  try {
    await page.evaluate(() => {
      if (typeof Storage !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    });
  } catch {
    // Ignore localStorage access errors (happens on initial page load)
  }
}
