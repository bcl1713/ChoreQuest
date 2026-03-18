import type { Page } from "@playwright/test";
import { getTestCredentials } from "../fixtures/test-credentials";

/**
 * Log in via the UI login form and wait for dashboard redirect.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const { email, password } = getTestCredentials();
  await page.goto("/auth/login");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("auth-submit-button").click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}
