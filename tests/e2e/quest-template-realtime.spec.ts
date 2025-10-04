import { test, expect, Page, BrowserContext } from "@playwright/test";
import {
  setupTwoContextTest,
  cleanupTwoContextTest,
  waitForNewListItem,
  waitForListItemRemoved,
  waitForTextChange,
} from "./helpers/realtime-helpers";

test.describe("Quest Template Realtime Updates", () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // Setup two-context test for realtime updates
    const setup = await setupTwoContextTest(browser, "guildmaster");
    context1 = setup.context1;
    context2 = setup.context2;
    page1 = setup.page1;
    page2 = setup.page2;

    // Navigate both pages to Quest Templates tab
    await page1.goto("http://localhost:3000/dashboard");
    await page1.getByTestId("tab-templates").click();
    await page1.waitForSelector('[data-testid="quest-template-manager"]');

    await page2.goto("http://localhost:3000/dashboard");
    await page2.getByTestId("tab-templates").click();
    await page2.waitForSelector('[data-testid="quest-template-manager"]');
  });

  test.afterEach(async () => {
    await cleanupTwoContextTest(context1, context2);
  });

  test("creating a template in one tab updates the other tab", async () => {
    // Page 1: Create a new template
    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill("Realtime Test Quest");
    await page1
      .getByTestId("template-description-input")
      .fill("Testing realtime updates");
    await page1.getByTestId("template-category-select").selectOption("DAILY");
    await page1.getByTestId("template-difficulty-select").selectOption("EASY");
    await page1.getByTestId("template-xp-input").fill("100");
    await page1.getByTestId("template-gold-input").fill("20");
    await page1.getByTestId("save-template-button").click();
    await expect(page1.getByTestId("create-template-modal")).not.toBeVisible();

    // Page 2: Wait for realtime update
    await waitForNewListItem(page2, "Realtime Test Quest");

    // Verify template details
    const templateCard = page2
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(templateCard).toContainText("Testing realtime updates");
    await expect(templateCard).toContainText("DAILY");
    await expect(templateCard).toContainText("EASY");
    await expect(templateCard).toContainText("100 XP");
    await expect(templateCard).toContainText("20 gold");
  });

  test("updating a template in one tab updates the other tab", async () => {
    // Page 1: Create a template first
    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill("Original Title");
    await page1
      .getByTestId("template-description-input")
      .fill("Original description");
    await page1.getByTestId("template-xp-input").fill("50");
    await page1.getByTestId("save-template-button").click();
    await expect(
      page1.getByRole("heading", { name: "Original Title" }),
    ).toBeVisible();
    await waitForNewListItem(page2, "Original Title");

    // Page 1: Edit the template
    await page1.locator('[data-testid^="template-edit-"]').first().click();
    await page1.getByTestId("template-title-input").clear();
    await page1.getByTestId("template-title-input").fill("Updated Title");
    await page1.getByTestId("template-description-input").clear();
    await page1
      .getByTestId("template-description-input")
      .fill("Updated description");
    await page1.getByTestId("template-xp-input").clear();
    await page1.getByTestId("template-xp-input").fill("150");
    await page1.getByTestId("update-template-button").click();
    await expect(page1.getByTestId("edit-template-modal")).not.toBeVisible();

    // Page 2: Wait for realtime update
    await waitForTextChange(page2, "Original Title", "Updated Title");
    const updatedCard = page2
      .locator('[data-testid^="template-card-"]')
      .first();
    await expect(updatedCard).toContainText("Updated description");
    await expect(updatedCard).toContainText("150 XP");
  });

  test("toggling template status in one tab updates the other tab", async () => {
    // Page 1: Create a template
    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill("Toggle Test");
    await page1.getByTestId("template-xp-input").fill("75");
    await page1.getByTestId("save-template-button").click();
    await expect(
      page1.getByRole("heading", { name: "Toggle Test" }),
    ).toBeVisible();
    await waitForNewListItem(page2, "Toggle Test");

    // Verify initial active status on both pages
    const statusButton1 = page1
      .locator('[data-testid^="template-status-"]')
      .first();
    const statusButton2 = page2
      .locator('[data-testid^="template-status-"]')
      .first();
    await expect(statusButton1).toContainText("Active");
    await expect(statusButton2).toContainText("Active");

    // Page 1: Deactivate the template
    await page1.locator('[data-testid^="template-toggle-"]').first().click();
    await expect(statusButton2).toContainText("Inactive", { timeout: 5000 });

    // Page 1: Reactivate the template
    await page1.locator('[data-testid^="template-toggle-"]').first().click();
    await expect(statusButton2).toContainText("Active", { timeout: 5000 });
  });

  test("deleting a template in one tab removes it from the other tab", async () => {
    // Page 1: Create a template
    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill("Delete Test");
    await page1.getByTestId("template-xp-input").fill("60");
    await page1.getByTestId("save-template-button").click();
    await expect(
      page1.getByRole("heading", { name: "Delete Test" }),
    ).toBeVisible();
    await waitForNewListItem(page2, "Delete Test");

    // Page 1: Delete the template
    await page1.locator('[data-testid^="template-delete-"]').first().click();
    await page1.getByTestId("confirm-delete-button").click();
    await expect(page1.getByTestId("delete-confirm-modal")).not.toBeVisible();

    // Page 2: Wait for realtime deletion
    await waitForListItemRemoved(page2, "Delete Test");
  });

  test("multiple rapid updates sync correctly across tabs", async () => {
    // Page 1: Create a template
    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill("Rapid Update Test");
    await page1.getByTestId("template-xp-input").fill("100");
    await page1.getByTestId("save-template-button").click();
    await waitForNewListItem(page2, "Rapid Update Test");

    // Page 1: Perform multiple rapid updates
    for (let i = 1; i <= 3; i++) {
      await page1.locator('[data-testid^="template-edit-"]').first().click();
      await page1.getByTestId("template-xp-input").clear();
      await page1.getByTestId("template-xp-input").fill(`${100 + i * 50}`);
      await page1.getByTestId("update-template-button").click();
    }

    // Page 2: Verify final state via realtime update
    const finalCard = page2.locator('[data-testid^="template-card-"]').first();
    await expect(finalCard).toContainText("250 XP", { timeout: 5000 });
  });
});
