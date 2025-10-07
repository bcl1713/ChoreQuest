import { test, expect } from "./helpers/family-fixture";
import type { Page } from "@playwright/test";
import {
  navigateToDashboard,
  openQuestCreationModal,
  closeModal,
} from "./helpers/navigation-helpers";
import {
  pickupQuest,
  startQuest,
  completeQuest,
  approveQuest,
} from "./helpers/quest-helpers";

const CUSTOM_TEMPLATE_NAME = "Epic Cleaning Quest";

async function deleteTemplateIfPresent(page: Page, templateName: string) {
  const templateCard = page
    .locator('[data-testid^="template-card-"]')
    .filter({ hasText: templateName })
    .first();

  if ((await templateCard.count()) === 0) {
    return;
  }

  const templateIdAttr = await templateCard.getAttribute("data-testid");
  if (!templateIdAttr) {
    return;
  }

  const templateId = templateIdAttr.replace("template-card-", "");

  await templateCard.locator(`[data-testid="template-delete-${templateId}"]`).click();
  await expect(page.getByTestId("delete-confirm-modal")).toBeVisible();
  await page.click('[data-testid="confirm-delete-button"]');
  await expect(page.getByTestId("delete-confirm-modal")).not.toBeVisible();
  await expect(page.getByText(templateName)).not.toBeVisible();
}

/**
 * Quest Template Full Workflow Integration Test
 *
 * This comprehensive test verifies the complete quest template system:
 * - New families receive default templates
 * - Guild Masters can create custom templates
 * - Quests can be created from templates
 * - Heroes can complete template-based quests
 * - Class bonuses are applied correctly
 * - Template deletion doesn't break existing quests
 * - Family isolation is maintained
 */

test.describe("Quest Template Full Workflow Integration", () => {
  test("complete quest template lifecycle with class bonuses and deletion safety", async ({
    workerFamily,
  }) => {
    test.setTimeout(120000); // 2 minutes for comprehensive test

    const { gmPage } = workerFamily;

    // ============================================================
    // STEP 1: Create family and verify default templates exist
    // ============================================================
    await navigateToDashboard(gmPage);

    // Navigate to Quest Templates
    await gmPage.getByTestId("tab-templates").click();
    await expect(gmPage.getByTestId("quest-template-manager")).toBeVisible();
    await deleteTemplateIfPresent(gmPage, CUSTOM_TEMPLATE_NAME);

    // Verify default templates from migration exist
    const templateList = gmPage.getByTestId("template-list");
    await expect(templateList).toBeVisible();

    // Should have at least 8 default templates from migration 013
    const defaultTemplates = gmPage.locator('[data-testid^="template-card-"]');
    const defaultCount = await defaultTemplates.count();
    expect(defaultCount).toBeGreaterThanOrEqual(8);

    // ============================================================
    // STEP 2: Guild Master creates custom template with high XP
    // ============================================================
    await gmPage.click('[data-testid="create-template-button"]');
    await expect(gmPage.getByTestId("create-template-modal")).toBeVisible();

    // Create a template with specific rewards to test class bonuses
    await gmPage.fill(
      '[data-testid="template-title-input"]',
      CUSTOM_TEMPLATE_NAME,
    );
    await gmPage.fill(
      '[data-testid="template-description-input"]',
      "A challenging cleaning task that rewards mastery",
    );
    await gmPage.selectOption(
      '[data-testid="template-category-select"]',
      "WEEKLY",
    );
    await gmPage.selectOption(
      '[data-testid="template-difficulty-select"]',
      "HARD",
    );
    await gmPage.fill('[data-testid="template-xp-input"]', "200"); // Base XP
    await gmPage.fill('[data-testid="template-gold-input"]', "100"); // Base Gold

    await gmPage.click('[data-testid="save-template-button"]');
    await expect(gmPage.getByTestId("create-template-modal")).not.toBeVisible();

    // Verify template appears in list
    const customTemplate = gmPage
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: CUSTOM_TEMPLATE_NAME,
      });
    await expect(customTemplate).toBeVisible();
    await expect(customTemplate).toContainText("200 XP");
    await expect(customTemplate).toContainText("100 gold");
    await expect(customTemplate).toContainText("HARD");

    // ============================================================
    // STEP 3: Create quest instance from custom template
    // ============================================================
    await gmPage.getByTestId("tab-quests").click();
    await openQuestCreationModal(gmPage);

    // Switch to template mode
    await gmPage.click('[data-testid="template-mode-button"]');

    // Select our custom template
    const templateSelect = gmPage.locator('[data-testid="template-select"]');
    const templateOption = await templateSelect
      .locator("option", { hasText: CUSTOM_TEMPLATE_NAME })
      .getAttribute("value");
    await templateSelect.selectOption(templateOption!);

    // Verify preview shows template details
    await expect(
      gmPage.locator('[data-testid="template-preview"]'),
    ).toContainText(CUSTOM_TEMPLATE_NAME);
    await expect(
      gmPage.locator('[data-testid="template-preview"]'),
    ).toContainText("200 XP");
    await expect(
      gmPage.locator('[data-testid="template-preview"]'),
    ).toContainText("100");

    // Submit quest without assignment (available for pickup)
    await gmPage.click('[data-testid="submit-quest-button"]');
    await expect(gmPage.locator("text=Create New Quest")).not.toBeVisible();

    // Verify quest appears in available quests
    await expect(
      gmPage.getByRole("heading", { name: CUSTOM_TEMPLATE_NAME }).first(),
    ).toBeVisible();

    // ============================================================
    // STEP 4: Guild Master picks up the quest themselves
    // ============================================================
    // Quest should be in "Available Quests" section
    const questCard = gmPage
      .locator(".fantasy-card")
      .filter({ hasText: CUSTOM_TEMPLATE_NAME });
    await expect(questCard).toBeVisible();

    // Pick up and complete the quest using helpers
    await pickupQuest(gmPage, CUSTOM_TEMPLATE_NAME);

    // ============================================================
    // STEP 5: Guild Master starts and completes the quest
    // ============================================================
    await startQuest(gmPage, CUSTOM_TEMPLATE_NAME);
    await completeQuest(gmPage, CUSTOM_TEMPLATE_NAME);

    // ============================================================
    // STEP 6: Guild Master approves quest and rewards are applied
    // ============================================================
    // Capture current character stats before approval
    const currentXPText = await gmPage
      .locator('[data-testid="character-xp"]')
      .textContent();
    const currentGoldText = await gmPage
      .locator('[data-testid="character-gold"]')
      .textContent();
    const currentXP = parseInt(currentXPText?.match(/\d+/)?.[0] || "0");
    const currentGold = parseInt(currentGoldText?.match(/\d+/)?.[0] || "0");

    // Approve the quest
    await approveQuest(gmPage, CUSTOM_TEMPLATE_NAME);

    // ============================================================
    // STEP 7: Verify class bonuses applied correctly
    // ============================================================
    // Expected rewards for MAGE character with HARD difficulty template:
    // - Base XP: 200
    // - Difficulty multiplier: 2.0 (HARD)
    // - Class bonus: 1.2 (MAGE gets 20% bonus)
    // - Total XP: 200 * 2.0 * 1.2 = 480
    //
    // - Base Gold: 100
    // - Difficulty multiplier: 2.0 (HARD)
    // - No class bonus for gold
    // - Total Gold: 100 * 2.0 = 200

    const parseStatValue = async (testId: string): Promise<number> => {
      const text =
        (await gmPage.locator(`[data-testid="${testId}"]`).textContent()) || "";
      const numeric = text.replace(/\D/g, "");
      return parseInt(numeric || "0", 10);
    };

    let xpAfterApproval = currentXP;
    await expect(async () => {
      xpAfterApproval = await parseStatValue("character-xp");
      expect(xpAfterApproval).toBeGreaterThan(currentXP + 400);
    }).toPass({ timeout: 7000 });

    let goldAfterApproval = currentGold;
    await expect(async () => {
      goldAfterApproval = await parseStatValue("character-gold");
      expect(goldAfterApproval).toBeGreaterThanOrEqual(currentGold + 200);
    }).toPass({ timeout: 7000 });

    // ============================================================
    // STEP 8: Delete template and verify existing quest still works
    // ============================================================
    // Navigate back to Quest Templates
    await gmPage.getByTestId("tab-templates").click();
    await expect(gmPage.getByTestId("quest-template-manager")).toBeVisible();

    // Find the custom template
    const templateToDelete = gmPage
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: CUSTOM_TEMPLATE_NAME,
      });
    const templateId = (
      await templateToDelete.getAttribute("data-testid")
    )?.replace("template-card-", "");

    // Delete the template
    await templateToDelete
      .locator(`[data-testid="template-delete-${templateId}"]`)
      .click();
    await expect(gmPage.getByTestId("delete-confirm-modal")).toBeVisible();
    await gmPage.click('[data-testid="confirm-delete-button"]');
    await expect(gmPage.getByTestId("delete-confirm-modal")).not.toBeVisible();

    // Verify template is deleted
    await expect(gmPage.getByText(CUSTOM_TEMPLATE_NAME)).not.toBeVisible();

    // Navigate back to quests and verify we can still create new quests
    await gmPage.getByTestId("tab-quests").click();

    // Create another quest from a different (default) template to verify system still works
    await openQuestCreationModal(gmPage);
    await gmPage.click('[data-testid="template-mode-button"]');

    // Select first available template (should be a default template)
    const newTemplateSelect = gmPage.locator('[data-testid="template-select"]');
    const firstAvailableTemplate = await newTemplateSelect
      .locator("option")
      .nth(1);
    const firstTemplateValue =
      await firstAvailableTemplate.getAttribute("value");
    await newTemplateSelect.selectOption(firstTemplateValue!);

    // Verify we can still create quests (template deletion didn't break the system)
    await expect(
      gmPage.locator('[data-testid="template-preview"]'),
    ).toBeVisible();
    await closeModal(gmPage, "quest");

    // Verify character stats persisted (rewards from deleted template quest are permanent)
    await expect(async () => {
      const xpAfter = await parseStatValue("character-xp");
      expect(xpAfter).toBeGreaterThanOrEqual(xpAfterApproval);
    }).toPass({ timeout: 7000 });
    await expect(async () => {
      const goldAfter = await parseStatValue("character-gold");
      expect(goldAfter).toBeGreaterThanOrEqual(goldAfterApproval);
    }).toPass({ timeout: 7000 });
  });

  test("family isolation - templates are family-scoped", async ({
    workerFamily,
  }) => {
    test.setTimeout(90000);

    // Create first family
    const familyOne = await workerFamily.createEphemeralUser(
      "family1-isolation",
    );
    const family1Page = familyOne.page;
    await navigateToDashboard(family1Page);

    // Navigate to templates and create custom template for family 1
    await family1Page.getByTestId("tab-templates").click();
    await family1Page.click('[data-testid="create-template-button"]');
    await family1Page.fill(
      '[data-testid="template-title-input"]',
      "Family 1 Private Quest",
    );
    await family1Page.fill(
      '[data-testid="template-description-input"]',
      "This should only be visible to Family 1",
    );
    await family1Page.click('[data-testid="save-template-button"]');

    // Verify template appears for family 1
    await expect(family1Page.getByText("Family 1 Private Quest")).toBeVisible();

    // Create second family
    const familyTwo = await workerFamily.createEphemeralUser(
      "family2-isolation",
    );
    const family2Page = familyTwo.page;
    await navigateToDashboard(family2Page);

    // Navigate to templates for family 2
    await family2Page.getByTestId("tab-templates").click();
    await expect(
      family2Page.getByTestId("quest-template-manager"),
    ).toBeVisible();

    // Verify family 2 CANNOT see family 1's custom template
    await expect(
      family2Page.getByText("Family 1 Private Quest"),
    ).not.toBeVisible();

    // Verify family 2 has their own default templates (from migration)
    const family2Templates = family2Page.locator(
      '[data-testid^="template-card-"]',
    );
    const family2Count = await family2Templates.count();
    expect(family2Count).toBeGreaterThanOrEqual(8); // Should have default templates

    // Create custom template for family 2
    await family2Page.click('[data-testid="create-template-button"]');
    await family2Page.fill(
      '[data-testid="template-title-input"]',
      "Family 2 Private Quest",
    );
    await family2Page.fill(
      '[data-testid="template-description-input"]',
      "This should only be visible to Family 2",
    );
    await family2Page.click('[data-testid="save-template-button"]');

    // Verify family 2 can see their template
    await expect(family2Page.getByText("Family 2 Private Quest")).toBeVisible();

    // Verify family 1 CANNOT see family 2's template
    await expect(
      family1Page.getByText("Family 2 Private Quest"),
    ).not.toBeVisible();

    // Verify family 1 can still see their own template
    await expect(family1Page.getByText("Family 1 Private Quest")).toBeVisible();
  });
});
