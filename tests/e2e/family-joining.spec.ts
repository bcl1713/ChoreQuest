import { test, expect } from "./helpers/family-fixture";
import { joinExistingFamily } from "./helpers/auth-helpers";

test.describe("Family Joining", () => {
  test("new user can join existing family with valid family code", async ({
    workerFamily,
    browser,
  }) => {
    // Step 1: Get the existing family code from the worker fixture
    const timestamp = Date.now();
    const { familyCode } = workerFamily;

    // Step 2: Join family in a new browser context
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    try {
      const newUserData = {
        name: `Hero ${timestamp}`,
        email: `hero-${timestamp}@example.com`,
        password: "testpass123",
      };

      await joinExistingFamily(newPage, familyCode, newUserData);

      // Verify character name is pre-filled from registration
      const nameInput = newPage.locator("input#characterName");
      await expect(nameInput).toHaveValue(newUserData.name);
    } finally {
      await newContext.close();
    }
  });

  test("character name pre-fills from family join and is editable", async ({
    workerFamily,
    browser,
  }) => {
    // Step 1: Get the existing family code from the worker fixture
    const timestamp = Date.now();
    const { familyCode } = workerFamily;

    // Step 2: Join family in a new browser context
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    try {
      const newUserData = {
        name: `Hero ${timestamp}`,
        email: `hero-${timestamp}@example.com`,
        password: "testpass123",
      };

      await joinExistingFamily(newPage, familyCode, newUserData);

      // Verify character name is pre-filled from registration
      const nameInput = newPage.locator("input#characterName");
      await expect(nameInput).toHaveValue(newUserData.name);

      // Edit the pre-filled name
      const editedName = "Edited Hero Name";
      await nameInput.fill(editedName);
      await expect(nameInput).toHaveValue(editedName);

      // Select class and complete character creation
      await newPage.click('[data-testid="class-rogue"]');
      await newPage.click('button:text("Begin Your Quest")');

      // Verify character was created with edited name
      await newPage.waitForURL(/.*\/dashboard/, { timeout: 20000 });
      await expect(
        newPage.getByText(`Welcome back, ${editedName}!`),
      ).toBeVisible();
    } finally {
      await newContext.close();
    }
  });

  test("registration fails with invalid family code", async ({ page }) => {
    await page.goto("/auth/register");

    const timestamp = Date.now();
    const userData = {
      name: `Test User ${timestamp}`,
      email: `test-${timestamp}@example.com`,
      password: "testpass123",
      familyCode: "INVALID",
    };

    // Fill out registration form with invalid family code
    await page.fill('input[placeholder="Sir Galahad"]', userData.name);
    await page.fill('input[placeholder="hero@example.com"]', userData.email);
    await page.fill('input[placeholder="••••••••"]', userData.password);
    await page.fill(
      'input[placeholder="BraveKnights123"]',
      userData.familyCode,
    );

    await page.click('button[type="submit"]');

    // Should show error message about invalid family code
    await expect(page.getByText("Invalid family code")).toBeVisible({
      timeout: 10000,
    });
  });
});
