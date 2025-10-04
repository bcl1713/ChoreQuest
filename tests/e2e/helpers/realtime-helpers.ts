import { Browser, BrowserContext, Page, expect } from "@playwright/test";
import { setupUserWithCharacter, loginUser } from "./setup-helpers";

/**
 * Realtime Helper Functions for E2E Tests
 *
 * This module provides reusable helpers for testing real-time updates
 * across multiple browser contexts/tabs using Supabase realtime subscriptions.
 */

export interface TwoContextTestSetup {
  context1: BrowserContext;
  context2: BrowserContext;
  page1: Page;
  page2: Page;
  testUser: { email: string; password: string };
}

/**
 * Sets up a two-context test scenario for realtime testing
 *
 * Creates two browser contexts, sets up a user in the first context,
 * and logs in as the same user in the second context. This simulates
 * two tabs/windows for the same user to test realtime synchronization.
 *
 * @param browser - Playwright browser instance from test fixture
 * @param prefix - Prefix for user creation (e.g., "guildmaster")
 * @returns Object containing both contexts, pages, and test user credentials
 *
 * @example
 * ```typescript
 * test("realtime updates work", async ({ browser }) => {
 *   const { page1, page2, context1, context2 } = await setupTwoContextTest(browser, "realtime-test");
 *
 *   try {
 *     // Perform action in page1
 *     await page1.click('[data-testid="create-item"]');
 *
 *     // Wait for realtime update in page2
 *     await expect(page2.getByText("New Item")).toBeVisible({ timeout: 5000 });
 *   } finally {
 *     await context1.close();
 *     await context2.close();
 *   }
 * });
 * ```
 */
export async function setupTwoContextTest(
  browser: Browser,
  prefix: string = "realtime",
): Promise<TwoContextTestSetup> {
  // Create two browser contexts to simulate two users/tabs
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Setup family and login as user in first context
  const testUser = await setupUserWithCharacter(page1, prefix);

  // Login as the same user in second context
  await loginUser(page2, testUser.email, testUser.password);

  return {
    context1,
    context2,
    page1,
    page2,
    testUser,
  };
}

/**
 * Navigates both pages in a two-context test to the same location
 *
 * Useful for getting both pages to the same starting point before
 * testing realtime updates.
 *
 * @param page1 - First page
 * @param page2 - Second page
 * @param url - URL to navigate to (e.g., "/dashboard")
 * @param selectorToWait - Optional selector to wait for after navigation
 *
 * @example
 * ```typescript
 * await navigateBothPages(page1, page2, "/dashboard", '[data-testid="quest-manager"]');
 * ```
 */
export async function navigateBothPages(
  page1: Page,
  page2: Page,
  url: string,
  selectorToWait?: string,
): Promise<void> {
  await page1.goto(url);
  await page2.goto(url);

  if (selectorToWait) {
    await page1.waitForSelector(selectorToWait);
    await page2.waitForSelector(selectorToWait);
  }

  await page1.waitForLoadState("networkidle");
  await page2.waitForLoadState("networkidle");
}

/**
 * Waits for a new item to appear in a list via realtime updates
 *
 * This is a common pattern where an action in one page should cause
 * a new item to appear in a list in another page.
 *
 * @param page - The page to wait for changes on
 * @param itemText - The text content to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * // Create item in page1
 * await page1.click('[data-testid="create-quest"]');
 *
 * // Wait for it to appear in page2 via realtime
 * await waitForNewListItem(page2, "New Quest Title");
 * ```
 */
export async function waitForNewListItem(
  page: Page,
  itemText: string,
  timeout: number = 5000,
): Promise<void> {
  await expect(page.getByText(itemText)).toBeVisible({ timeout });
}

/**
 * Waits for an item to be removed from a list via realtime updates
 *
 * Common pattern when deleting items - should disappear from other
 * pages/contexts via realtime subscriptions.
 *
 * @param page - The page to wait for changes on
 * @param itemText - The text content that should disappear
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * // Delete item in page1
 * await page1.click('[data-testid="delete-item"]');
 *
 * // Wait for it to disappear in page2 via realtime
 * await waitForListItemRemoved(page2, "Deleted Item");
 * ```
 */
export async function waitForListItemRemoved(
  page: Page,
  itemText: string,
  timeout: number = 5000,
): Promise<void> {
  await expect(page.getByText(itemText)).not.toBeVisible({ timeout });
}

/**
 * Waits for a text change via realtime updates
 *
 * Useful for when updating an item's name or status should reflect
 * in other pages/contexts.
 *
 * @param page - The page to wait for changes on
 * @param oldText - The current text (optional, for verification)
 * @param newText - The new text to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * // Edit item name in page1
 * await page1.fill('[data-testid="name-input"]', "Updated Name");
 * await page1.click('[data-testid="save"]');
 *
 * // Wait for update in page2
 * await waitForTextChange(page2, "Old Name", "Updated Name");
 * ```
 */
export async function waitForTextChange(
  page: Page,
  oldText: string | null,
  newText: string,
  timeout: number = 5000,
): Promise<void> {
  if (oldText) {
    // Wait for old text to disappear
    await expect(page.getByText(oldText)).not.toBeVisible({ timeout });
  }

  // Wait for new text to appear
  await expect(page.getByText(newText)).toBeVisible({ timeout });
}

/**
 * Waits for a specific element to appear via realtime updates
 *
 * More generic helper for waiting for any element to become visible
 * as a result of realtime updates.
 *
 * @param page - The page to wait for changes on
 * @param selector - The selector to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * await waitForRealtimeElement(page2, '[data-testid="new-reward-card"]');
 * ```
 */
export async function waitForRealtimeElement(
  page: Page,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Waits for a specific element to disappear via realtime updates
 *
 * Generic helper for waiting for any element to be removed as a result
 * of realtime updates.
 *
 * @param page - The page to wait for changes on
 * @param selector - The selector to wait for disappearance
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * await waitForRealtimeElementRemoved(page2, '[data-testid="deleted-item"]');
 * ```
 */
export async function waitForRealtimeElementRemoved(
  page: Page,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await expect(page.locator(selector)).not.toBeVisible({ timeout });
}

/**
 * Waits for a count change via realtime updates
 *
 * Useful for waiting for list item counts to update, like pending
 * redemptions or quest counts.
 *
 * @param page - The page to wait for changes on
 * @param selector - The selector for the elements to count
 * @param expectedCount - The expected count
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * // Approve redemption in page1
 * await page1.click('[data-testid="approve-redemption"]');
 *
 * // Wait for pending count to decrease in page2
 * await waitForCountChange(page2, '[data-testid="pending-redemption-item"]', 0);
 * ```
 */
export async function waitForCountChange(
  page: Page,
  selector: string,
  expectedCount: number,
  timeout: number = 5000,
): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(expectedCount, { timeout });
}

/**
 * Cleans up two-context test resources
 *
 * Convenience helper to close both contexts. Should be called in
 * test cleanup (finally block or afterEach).
 *
 * @param context1 - First browser context
 * @param context2 - Second browser context
 *
 * @example
 * ```typescript
 * test.afterEach(async () => {
 *   await cleanupTwoContextTest(context1, context2);
 * });
 * ```
 */
export async function cleanupTwoContextTest(
  context1: BrowserContext,
  context2: BrowserContext,
): Promise<void> {
  await context1.close();
  await context2.close();
}
