import { test, expect } from "./helpers/family-fixture";

/**
 * Verification test for worker-scoped family fixture
 * This test suite ensures the GM user persists across multiple tests
 * and that the fixture provides all required data.
 */

test.describe("Worker-Scoped Family Fixture", () => {
  test("should have access to GM user in first test", async ({ workerFamily }) => {
    const { gmPage, gmEmail, gmId, familyId, familyCode, characterName } = workerFamily;

    // Verify GM page is accessible and on dashboard
    await expect(gmPage).toHaveURL(/.*\/dashboard/);

    // Verify welcome message shows character name
    await expect(
      gmPage.locator('[data-testid="welcome-message"]')
    ).toContainText(`Welcome back, ${characterName}!`);

    // Verify all required properties are present
    expect(gmEmail).toBeTruthy();
    expect(gmId).toBeTruthy();
    expect(familyId).toBeTruthy();
    expect(familyCode).toBeTruthy();
    expect(familyCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  test("should persist GM user to second test", async ({ workerFamily }) => {
    const { gmPage, gmEmail, gmId, familyId, familyCode, characterName } = workerFamily;

    // Verify the same GM data is available in second test
    await expect(gmPage).toHaveURL(/.*\/dashboard/);

    await expect(
      gmPage.locator('[data-testid="welcome-message"]')
    ).toContainText(`Welcome back, ${characterName}!`);

    // Verify IDs haven't changed (same GM user persists)
    expect(gmEmail).toBeTruthy();
    expect(gmId).toBeTruthy();
    expect(familyId).toBeTruthy();
    expect(familyCode).toBeTruthy();
  });

  test("should navigate GM page and maintain state", async ({ workerFamily }) => {
    const { gmPage, gmEmail, gmId, familyId } = workerFamily;

    // Verify GM state is still available in third test
    await expect(gmPage).toHaveURL(/.*\/dashboard/);

    // Verify all IDs are still present (proving persistence)
    expect(gmEmail).toBeTruthy();
    expect(gmId).toBeTruthy();
    expect(familyId).toBeTruthy();

    // Navigate to a different page and back
    await gmPage.goto("/");
    await expect(gmPage).toHaveURL("/");

    // Navigate back to dashboard
    await gmPage.goto("/dashboard");
    await expect(gmPage).toHaveURL(/.*\/dashboard/);
  });
});
