import { test, expect } from "./helpers/family-fixture";
import type { Page, BrowserContext } from "@playwright/test";
import { loginUser } from "./helpers/setup-helpers";
import { navigateToDashboard } from "./helpers/navigation-helpers";
import {
  waitForNewListItem,
  waitForListItemRemoved,
  waitForTextChange,
} from "./helpers/realtime-helpers";

function uniqueName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix} ${timestamp}-${random}`;
}

async function ensureTemplatesTab(page: Page): Promise<void> {
  await navigateToDashboard(page);
  const questModal = page.locator("text=Create New Quest");
  if (await questModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    const cancelButton = page.locator('[data-testid="cancel-quest-button"]');
    if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(questModal).not.toBeVisible({ timeout: 5000 });
  }

  await page.getByTestId("tab-templates").click();
  await expect(page.getByTestId("quest-template-manager")).toBeVisible();
  await expect(page.getByTestId("template-list")).toBeVisible();
}

function getTemplateCard(page: Page, templateName: string) {
  return page
    .locator('[data-testid^="template-card-"]')
    .filter({ hasText: templateName })
    .first();
}

async function getTemplateId(page: Page, templateName: string): Promise<string> {
  const card = getTemplateCard(page, templateName);
  await expect(card).toBeVisible({ timeout: 10000 });
  const testId = await card.getAttribute("data-testid");
  if (!testId) {
    throw new Error(`Template card for "${templateName}" missing data-testid`);
  }
  return testId.replace("template-card-", "");
}

test.describe("Quest Template Realtime Updates", () => {
  let context2: BrowserContext | undefined;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ workerFamily, browser }) => {
    page1 = workerFamily.gmPage;
    await ensureTemplatesTab(page1);

    context2 = await browser.newContext();
    page2 = await context2.newPage();
    await loginUser(page2, workerFamily.gmEmail, workerFamily.gmPassword);
    await ensureTemplatesTab(page2);
  });

  test.afterEach(async () => {
    if (context2) {
      await context2.close();
      context2 = undefined;
    }
  });

  test("creating a template in one tab updates the other tab", async () => {
    const templateName = uniqueName("Realtime Test Quest");

    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill(templateName);
    await page1
      .getByTestId("template-description-input")
      .fill("Testing realtime updates");
    await page1.getByTestId("template-category-select").selectOption("DAILY");
    await page1.getByTestId("template-difficulty-select").selectOption("EASY");
    await page1.getByTestId("template-xp-input").fill("100");
    await page1.getByTestId("template-gold-input").fill("20");
    await page1.getByTestId("save-template-button").click();
    await expect(page1.getByTestId("create-template-modal")).not.toBeVisible();

    await waitForNewListItem(page2, templateName);

    const templateCard = getTemplateCard(page2, templateName);
    await expect(templateCard).toContainText("Testing realtime updates");
    await expect(templateCard).toContainText("DAILY");
    await expect(templateCard).toContainText("EASY");
    await expect(templateCard).toContainText("100 XP");
    await expect(templateCard).toContainText("20 gold");
  });

  test("updating a template in one tab updates the other tab", async () => {
    const originalName = uniqueName("Original Title");
    const updatedName = `${originalName} Updated`;

    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill(originalName);
    await page1
      .getByTestId("template-description-input")
      .fill("Original description");
    await page1.getByTestId("template-xp-input").fill("50");
    await page1.getByTestId("save-template-button").click();

    await waitForNewListItem(page2, originalName);
    const templateId = await getTemplateId(page1, originalName);

    await page1.getByTestId(`template-edit-${templateId}`).click();
    await page1.getByTestId("template-title-input").clear();
    await page1.getByTestId("template-title-input").fill(updatedName);
    await page1.getByTestId("template-description-input").clear();
    await page1
      .getByTestId("template-description-input")
      .fill("Updated description");
    await page1.getByTestId("template-xp-input").clear();
    await page1.getByTestId("template-xp-input").fill("150");
    await page1.getByTestId("update-template-button").click();
    await expect(page1.getByTestId("edit-template-modal")).not.toBeVisible();

    await waitForTextChange(page2, originalName, updatedName);
    const updatedCard = getTemplateCard(page2, updatedName);
    await expect(updatedCard).toContainText("Updated description");
    await expect(updatedCard).toContainText("150 XP");
  });

  test("toggling template status in one tab updates the other tab", async () => {
    const templateName = uniqueName("Toggle Test");

    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill(templateName);
    await page1.getByTestId("template-xp-input").fill("75");
    await page1.getByTestId("save-template-button").click();

    await waitForNewListItem(page2, templateName);
    const templateId = await getTemplateId(page1, templateName);

    const statusButton1 = page1.getByTestId(`template-status-${templateId}`);
    const statusButton2 = page2.getByTestId(`template-status-${templateId}`);
    await expect(statusButton1).toContainText("Active");
    await expect(statusButton2).toContainText("Active");

    await page1.getByTestId(`template-toggle-${templateId}`).click();
    await expect(statusButton2).toContainText("Inactive", { timeout: 5000 });

    await page1.getByTestId(`template-toggle-${templateId}`).click();
    await expect(statusButton2).toContainText("Active", { timeout: 5000 });
  });

  test("deleting a template in one tab removes it from the other tab", async () => {
    const templateName = uniqueName("Delete Test");

    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill(templateName);
    await page1.getByTestId("template-xp-input").fill("60");
    await page1.getByTestId("save-template-button").click();

    await waitForNewListItem(page2, templateName);
    const templateId = await getTemplateId(page1, templateName);

    await page1.getByTestId(`template-delete-${templateId}`).click();
    await page1.getByTestId("confirm-delete-button").click();
    await expect(page1.getByTestId("delete-confirm-modal")).not.toBeVisible();

    await waitForListItemRemoved(page2, templateName);
  });

  test("multiple rapid updates sync correctly across tabs", async () => {
    const templateName = uniqueName("Rapid Update Test");

    await page1.getByTestId("create-template-button").click();
    await page1.getByTestId("template-title-input").fill(templateName);
    await page1.getByTestId("template-xp-input").fill("100");
    await page1.getByTestId("save-template-button").click();

    await waitForNewListItem(page2, templateName);
    const templateId = await getTemplateId(page1, templateName);

    for (let i = 1; i <= 3; i++) {
      await page1.getByTestId(`template-edit-${templateId}`).click();
      await page1.getByTestId("template-xp-input").clear();
      await page1.getByTestId("template-xp-input").fill(`${100 + i * 50}`);
      await page1.getByTestId("update-template-button").click();
      await expect(page1.getByTestId("edit-template-modal")).not.toBeVisible();
    }

    const finalCard = getTemplateCard(page2, templateName);
    await expect(finalCard).toContainText("250 XP", { timeout: 5000 });
  });
});
