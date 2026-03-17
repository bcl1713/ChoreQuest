import { test, expect } from "@playwright/test";
import { getTestCredentials } from "./fixtures/test-credentials";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Auth smoke tests", () => {
  test("login success redirects to dashboard", async ({ page }) => {
    const { email, password } = getTestCredentials();
    await page.goto("/auth/login");

    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-password").fill(password);
    await page.getByTestId("auth-submit-button").click();

    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login failure shows error feedback", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByTestId("input-email").fill("nobody@example.com");
    await page.getByTestId("input-password").fill("wrong-password");
    await page.getByTestId("auth-submit-button").click();

    await expect(page.locator("p.text-red-400")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("authenticated user can load dashboard", async ({ page }) => {
    await loginAsTestUser(page);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("tab-quests")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("authenticated user can switch to rewards tab", async ({ page }) => {
    await loginAsTestUser(page);

    const rewardsTab = page.getByTestId("tab-rewards");
    await expect(rewardsTab).toBeVisible({ timeout: 10_000 });
    await rewardsTab.click();

    await expect(
      page.getByText(/reward store/i).or(page.getByText(/store/i)),
    ).toBeVisible({ timeout: 10_000 });
  });
});
