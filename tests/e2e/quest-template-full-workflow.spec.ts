import { test, expect } from "@playwright/test";
import { setupUserWithCharacter } from "./helpers/setup-helpers";

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
    page,
  }) => {
    test.setTimeout(120000); // 2 minutes for comprehensive test

    // ============================================================
    // STEP 1: Create family and verify default templates exist
    // ============================================================
    await setupUserWithCharacter(page, "workflow-test", {
      characterClass: "MAGE",
    });
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Quest Templates
    await page.click("text=Quest Templates");
    await expect(page.getByTestId("quest-template-manager")).toBeVisible();

    // Verify default templates from migration exist
    const templateList = page.getByTestId("template-list");
    await expect(templateList).toBeVisible();

    // Should have at least 8 default templates from migration 013
    const defaultTemplates = page.locator('[data-testid^="template-card-"]');
    const defaultCount = await defaultTemplates.count();
    expect(defaultCount).toBeGreaterThanOrEqual(8);

    // ============================================================
    // STEP 2: Guild Master creates custom template with high XP
    // ============================================================
    await page.click('[data-testid="create-template-button"]');
    await expect(page.getByTestId("create-template-modal")).toBeVisible();

    // Create a template with specific rewards to test class bonuses
    await page.fill(
      '[data-testid="template-title-input"]',
      "Epic Cleaning Quest",
    );
    await page.fill(
      '[data-testid="template-description-input"]',
      "A challenging cleaning task that rewards mastery",
    );
    await page.selectOption(
      '[data-testid="template-category-select"]',
      "WEEKLY",
    );
    await page.selectOption(
      '[data-testid="template-difficulty-select"]',
      "HARD",
    );
    await page.fill('[data-testid="template-xp-input"]', "200"); // Base XP
    await page.fill('[data-testid="template-gold-input"]', "100"); // Base Gold

    await page.click('[data-testid="save-template-button"]');
    await expect(page.getByTestId("create-template-modal")).not.toBeVisible();

    // Verify template appears in list
    const customTemplate = page
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: "Epic Cleaning Quest",
      });
    await expect(customTemplate).toBeVisible();
    await expect(customTemplate).toContainText("200 XP");
    await expect(customTemplate).toContainText("100 gold");
    await expect(customTemplate).toContainText("HARD");

    // ============================================================
    // STEP 3: Create quest instance from custom template
    // ============================================================
    await page.click("text=Quests & Adventures");
    await page.click('[data-testid="create-quest-button"]');
    await expect(page.locator("text=Create New Quest")).toBeVisible();

    // Switch to template mode
    await page.click('[data-testid="template-mode-button"]');

    // Select our custom template
    const templateSelect = page.locator('[data-testid="template-select"]');
    const templateOption = await templateSelect
      .locator("option", { hasText: "Epic Cleaning Quest" })
      .getAttribute("value");
    await templateSelect.selectOption(templateOption!);

    // Verify preview shows template details
    await expect(
      page.locator('[data-testid="template-preview"]'),
    ).toContainText("Epic Cleaning Quest");
    await expect(
      page.locator('[data-testid="template-preview"]'),
    ).toContainText("200 XP");
    await expect(
      page.locator('[data-testid="template-preview"]'),
    ).toContainText("100");

    // Submit quest without assignment (available for pickup)
    await page.click('[data-testid="submit-quest-button"]');
    await expect(page.locator("text=Create New Quest")).not.toBeVisible();

    // Verify quest appears in available quests
    await expect(
      page.getByRole("heading", { name: "Epic Cleaning Quest" }).first(),
    ).toBeVisible();

    // ============================================================
    // STEP 4: Guild Master picks up the quest themselves
    // ============================================================
    // Quest should be in "Available Quests" section
    const questCard = page
      .locator(".fantasy-card")
      .filter({ hasText: "Epic Cleaning Quest" });
    await expect(questCard).toBeVisible();

    // Pick up the quest (GM can pick up their own quests)
    await questCard.locator('[data-testid="pick-up-quest-button"]').click();
    // Wait for realtime update

    // Verify quest moved to "Your Active Quests" section
    // After pickup, status should be PENDING, so we need to start it
    const activeQuestCard = page
      .locator(".fantasy-card")
      .filter({ hasText: "Epic Cleaning Quest" });
    await expect(activeQuestCard).toBeVisible();

    // ============================================================
    // STEP 5: Guild Master starts and completes the quest
    // ============================================================
    // Start the quest (PENDING -> IN_PROGRESS)
    const startButton = activeQuestCard.locator(
      '[data-testid="start-quest-button"]',
    );
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Complete the quest (IN_PROGRESS -> COMPLETED)
    const completeButton = activeQuestCard.locator(
      '[data-testid="complete-quest-button"]',
    );
    await expect(completeButton).toBeVisible();
    await completeButton.click();

    // ============================================================
    // STEP 6: Guild Master approves quest and rewards are applied
    // ============================================================
    // Capture current character stats before approval
    const currentXPText = await page
      .locator('[data-testid="character-xp"]')
      .textContent();
    const currentGoldText = await page
      .locator('[data-testid="character-gold"]')
      .textContent();
    const currentXP = parseInt(currentXPText?.match(/\d+/)?.[0] || "0");
    const currentGold = parseInt(currentGoldText?.match(/\d+/)?.[0] || "0");

    // Approve the quest
    const approveButton = activeQuestCard.locator(
      '[data-testid="approve-quest-button"]',
    );
    await expect(approveButton).toBeVisible();
    await approveButton.click();
    // Wait for database update and realtime sync

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

    const expectedXP = currentXP + 480;
    const expectedGold = currentGold + 200;

    await expect(page.locator('[data-testid="character-xp"]')).toContainText(
      expectedXP.toString(),
      { timeout: 5000 },
    );
    await expect(page.locator('[data-testid="character-gold"]')).toContainText(
      expectedGold.toString(),
      { timeout: 5000 },
    );

    // ============================================================
    // STEP 8: Delete template and verify existing quest still works
    // ============================================================
    // Navigate back to Quest Templates
    await page.click("text=Quest Templates");
    await expect(page.getByTestId("quest-template-manager")).toBeVisible();

    // Find the custom template
    const templateToDelete = page
      .locator('[data-testid^="template-card-"]')
      .filter({
        hasText: "Epic Cleaning Quest",
      });
    const templateId = (
      await templateToDelete.getAttribute("data-testid")
    )?.replace("template-card-", "");

    // Delete the template
    await templateToDelete
      .locator(`[data-testid="template-delete-${templateId}"]`)
      .click();
    await expect(page.getByTestId("delete-confirm-modal")).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');
    await expect(page.getByTestId("delete-confirm-modal")).not.toBeVisible();

    // Verify template is deleted
    await expect(page.getByText("Epic Cleaning Quest")).not.toBeVisible();

    // Navigate back to quests and verify we can still create new quests
    await page.click("text=Quests & Adventures");

    // Create another quest from a different (default) template to verify system still works
    await page.click('[data-testid="create-quest-button"]');
    await page.click('[data-testid="template-mode-button"]');

    // Select first available template (should be a default template)
    const newTemplateSelect = page.locator('[data-testid="template-select"]');
    const firstAvailableTemplate = await newTemplateSelect
      .locator("option")
      .nth(1);
    const firstTemplateValue =
      await firstAvailableTemplate.getAttribute("value");
    await newTemplateSelect.selectOption(firstTemplateValue!);

    // Verify we can still create quests (template deletion didn't break the system)
    await expect(
      page.locator('[data-testid="template-preview"]'),
    ).toBeVisible();
    await page.click('[data-testid="cancel-quest-button"]');

    // Verify character stats persisted (rewards from deleted template quest are permanent)
    await expect(page.locator('[data-testid="character-xp"]')).toContainText(
      expectedXP.toString(),
    );
    await expect(page.locator('[data-testid="character-gold"]')).toContainText(
      expectedGold.toString(),
    );
  });

  test("family isolation - templates are family-scoped", async ({
    browser,
  }) => {
    test.setTimeout(90000);

    // Create first family
    const family1Context = await browser.newContext();
    const family1Page = await family1Context.newPage();
    await setupUserWithCharacter(family1Page, "family1-isolation", {
      characterClass: "KNIGHT",
    });
    await expect(family1Page).toHaveURL(/.*dashboard/);

    // Navigate to templates and create custom template for family 1
    await family1Page.click("text=Quest Templates");
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
    const family2Context = await browser.newContext();
    const family2Page = await family2Context.newPage();
    await setupUserWithCharacter(family2Page, "family2-isolation", {
      characterClass: "RANGER",
    });
    await expect(family2Page).toHaveURL(/.*dashboard/);

    // Navigate to templates for family 2
    await family2Page.click("text=Quest Templates");
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

    await family1Context.close();
    await family2Context.close();
  });
});
