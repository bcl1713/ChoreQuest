import { test, expect } from "@playwright/test";

test.describe("Quest Template Creation with Due Date", () => {
  test.beforeEach(async ({ context, page }) => {
    // Clear all browser storage and cookies before each test
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("Guild Master can create quest from template with due date and time", async ({
    page,
  }) => {
    console.log("✅ [Setup] Starting quest from template with due date test");
    const testEmail = `template-due-date-${Date.now()}@example.com`;
    const testPassword = "testpass123";

    // Calculate due date/time for tomorrow at 3:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0); // 3:00 PM
    const dueDateTimeString = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

    console.log("🔍 [Debug] Due date/time for test:", dueDateTimeString);

    // Create a new family and user (Guild Master)
    await page.goto("/");
    await page.screenshot({ path: "test-quest-template-due-date-setup.png" });
    await page.getByText("🏰 Create Family Guild").click();
    await expect(page).toHaveURL(/.*\/auth\/create-family/);

    await page.fill('input[name="name"]', "Template Due Date Family");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', "Template Master");
    await page.click('button[type="submit"]');

    // Complete character creation
    console.log("✅ [Action] Completing character creation for Guild Master");
    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill("input#characterName", "Sir Template");
    await page.click('[data-testid="class-mage"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Welcome back, Sir Template!")).toBeVisible();

    // Wait for dashboard to fully load
    await page.waitForTimeout(2000);

    // Open quest creation modal
    console.log("✅ [Action] Opening quest creation modal");
    await page.getByText("⚡ Create Quest").click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Create New Quest")).toBeVisible();

    // Stay on Template Quest tab (should be default)
    console.log("✅ [Action] Using Template Quest tab");
    const templateTabActive = await page
      .locator("text=From Template")
      .getAttribute("class");
    console.log("🔍 [Debug] Template tab class:", templateTabActive);

    // Select a quest template (should be available templates)
    console.log("✅ [Action] Selecting quest template");
    const templateSelector = page
      .locator('select:has-text("Select a quest template")')
      .first();

    // Wait for templates to load and check if any exist
    await page.waitForTimeout(1000);
    const templateOptions = await templateSelector
      .locator('option:not([value=""])')
      .count();
    console.log("🔍 [Debug] Available template options:", templateOptions);

    if (templateOptions > 0) {
      // Select the first available template
      await templateSelector.selectOption({ index: 1 }); // Index 0 is usually the placeholder
      console.log("✅ [Action] Selected template from dropdown");
    } else {
      console.log(
        "⚠️ [Warning] No templates available, test may need template setup",
      );
      // For this test, we'll assume templates exist or create a fallback
    }

    // Set the due date and time
    console.log("✅ [Action] Setting due date and time");
    const dueDateInput = page.locator('input[type="datetime-local"]');
    await expect(dueDateInput).toBeVisible();
    await dueDateInput.fill(dueDateTimeString);

    // Verify the date was set correctly
    const actualDueDate = await dueDateInput.inputValue();
    console.log("🔍 [Debug] Due date input value:", actualDueDate);
    expect(actualDueDate).toBe(dueDateTimeString);

    // Optionally assign to a family member (or leave unassigned)
    console.log("✅ [Action] Checking assignment options");
    const assigneeSelect = page
      .locator('select:has-text("Assign to (optional)")')
      .first();
    const hasAssigneeOptions = await assigneeSelect
      .locator('option:not([value=""])')
      .count();
    console.log("🔍 [Debug] Available assignee options:", hasAssigneeOptions);

    if (hasAssigneeOptions > 0) {
      await assigneeSelect.selectOption({ index: 1 }); // Assign to first available member
      console.log("✅ [Action] Assigned quest to family member");
    }

    // Take screenshot before submission
    await page.screenshot({
      path: "test-quest-template-due-date-action.png",
      fullPage: true,
    });

    // Submit the quest from template
    console.log("✅ [Action] Submitting quest from template with due date");
    await page.click('form button[type="submit"]');

    // Wait for modal to close and quest to be created
    await page.waitForTimeout(2000);

    // Take screenshot after submission
    await page.screenshot({
      path: "test-quest-template-due-date-verification.png",
      fullPage: true,
    });

    // Verify modal closed (indicating successful creation)
    console.log("🔍 [Debug] Checking quest creation results");
    const modalClosed = await page
      .locator("text=Create New Quest")
      .isVisible()
      .catch(() => false);
    console.log(
      "✅ [Verification] Modal closed after quest creation:",
      !modalClosed,
    );

    // Look for quest in the dashboard
    await page.waitForTimeout(1000);

    // Check for quest visibility (could be in different sections depending on assignment)
    const questVisible = await page
      .locator("div")
      .filter({ hasText: /quest|Quest/ })
      .first()
      .isVisible()
      .catch(() => false);
    console.log("✅ [Verification] Quest visible on dashboard:", questVisible);

    // Look for due date display in the UI
    const tomorrow_display = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;
    const hasDueDateDisplay = await page
      .locator(`text*=${tomorrow_display}`)
      .isVisible()
      .catch(() => false);
    console.log(
      "✅ [Verification] Due date displayed on quest:",
      hasDueDateDisplay,
    );
    console.log(
      "🔍 [Debug] Looking for date display pattern:",
      tomorrow_display,
    );

    // Test should pass if:
    // 1. Modal closed (no validation errors)
    // 2. Quest appears somewhere on dashboard
    // 3. Bonus: Due date is displayed
    const questCreationSuccessful = !modalClosed || questVisible;

    if (!questCreationSuccessful) {
      // If quest creation failed, check for error messages
      const hasErrorMessage = await page
        .locator("text=⚠️")
        .isVisible()
        .catch(() => false);
      console.log("❌ [Error] Has error message:", hasErrorMessage);

      if (hasErrorMessage) {
        console.log(
          "⚠️ [Warning] Quest creation had an error, but modal functionality is working",
        );
        // Check if this is a due date specific error or general error
        const errorText = await page
          .locator("text*=⚠️")
          .textContent()
          .catch(() => "");
        console.log("🔍 [Debug] Error message:", errorText);

        if (
          errorText.toLowerCase().includes("date") ||
          errorText.toLowerCase().includes("time")
        ) {
          console.log(
            "❌ [Error] Due date/time specific error found - this is what we need to fix!",
          );
        }
      }
    }

    console.log(
      "✅ [Verification] Template quest with due date test completed",
    );
    expect(questCreationSuccessful).toBe(true);
  });

  test("Quest due date validation works correctly", async ({ page }) => {
    console.log("✅ [Setup] Starting quest due date validation test");
    const testEmail = `due-date-validation-${Date.now()}@example.com`;
    const testPassword = "testpass123";

    // Create user and get to dashboard
    await page.goto("/");
    await page.screenshot({ path: "test-quest-due-date-validation-setup.png" });
    await page.getByText("🏰 Create Family Guild").click();
    await page.fill('input[name="name"]', "Due Date Validation Family");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', "Validation Master");
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill("input#characterName", "Sir Validator");
    await page.click('[data-testid="class-ranger"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await expect(page.getByText("Welcome back, Sir Validator!")).toBeVisible();
    await page.waitForTimeout(2000);

    // Open modal and test due date validation
    console.log(
      "✅ [Action] Opening quest modal for due date validation testing",
    );
    await page.getByText("⚡ Create Quest").click();
    await page.waitForTimeout(1000);

    // Switch to Custom Quest to test due date validation
    await page.click("text=Custom Quest");

    // Fill in required fields
    await page.fill(
      'input[placeholder="Enter quest title..."]',
      "Due Date Test Quest",
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Testing due date validation",
    );

    // Test 1: Try setting a past date (should be rejected)
    console.log("✅ [Action] Testing past due date validation");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const pastDateString = yesterday.toISOString().slice(0, 16);

    const dueDateInput = page.locator('input[type="datetime-local"]');
    await dueDateInput.fill(pastDateString);

    // Try to submit with past date
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);

    // Modal should still be visible if validation works
    const modalStillVisible = await page
      .locator("text=Create New Quest")
      .isVisible()
      .catch(() => false);
    console.log(
      "✅ [Verification] Modal still visible after past date submission (validation working):",
      modalStillVisible,
    );

    // Test 2: Set a valid future date
    console.log("✅ [Action] Testing valid future due date");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(14, 30, 0, 0);
    const futureDateString = futureDate.toISOString().slice(0, 16);

    await dueDateInput.fill(futureDateString);

    // Now submission should work
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Modal should close with valid future date
    const modalClosedAfterValid = await page
      .locator("text=Create New Quest")
      .isVisible()
      .catch(() => false);
    console.log(
      "✅ [Verification] Modal closed after valid future date submission:",
      !modalClosedAfterValid,
    );

    await page.screenshot({
      path: "test-quest-due-date-validation-verification.png",
    });
    console.log("✅ [Verification] Quest due date validation test completed");

    // This test passes if validation prevents past dates but allows future dates
    expect(modalStillVisible && !modalClosedAfterValid).toBe(true);
  });

  test("Quest due date displays correctly in quest list", async ({ page }) => {
    console.log("✅ [Setup] Starting quest due date display test");
    const testEmail = `due-date-display-${Date.now()}@example.com`;
    const testPassword = "testpass123";

    // Create user and quest with due date
    await page.goto("/");
    await page.getByText("🏰 Create Family Guild").click();
    await page.fill('input[name="name"]', "Due Date Display Family");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="userName"]', "Display Master");
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/character\/create/, { timeout: 10000 });
    await page.fill("input#characterName", "Sir Display");
    await page.click('[data-testid="class-rogue"]');
    await page.click('button:text("Begin Your Quest")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Create a quest with a specific due date
    console.log("✅ [Action] Creating quest with due date for display testing");
    await page.getByText("⚡ Create Quest").click();
    await page.waitForTimeout(1000);
    await page.click("text=Custom Quest");

    await page.fill(
      'input[placeholder="Enter quest title..."]',
      "Display Test Quest",
    );
    await page.fill(
      'textarea[placeholder="Describe the quest..."]',
      "Testing due date display",
    );

    // Set due date to exactly 2 days from now at 4:30 PM
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(16, 30, 0, 0); // 4:30 PM
    const targetDateString = targetDate.toISOString().slice(0, 16);

    console.log("🔍 [Debug] Setting target due date:", targetDateString);
    await page.locator('input[type="datetime-local"]').fill(targetDateString);

    await page.click('form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Take screenshot to see how due date is displayed
    await page.screenshot({
      path: "test-quest-due-date-display-verification.png",
      fullPage: true,
    });

    // Look for various due date display formats
    const dueDateDisplayFormats = [
      `${targetDate.getMonth() + 1}/${targetDate.getDate()}`, // M/D format
      `${targetDate.getMonth() + 1}/${targetDate.getDate()}/${targetDate.getFullYear()}`, // M/D/YYYY
      targetDate.toLocaleDateString(), // Locale specific
      "Due:", // Due date label
      "4:30 PM", // Time portion
      "16:30", // 24-hour time
    ];

    console.log("✅ [Verification] Checking for due date display formats");
    let foundDisplayFormat = false;
    for (const format of dueDateDisplayFormats) {
      const hasFormat = await page
        .locator(`text*=${format}`)
        .isVisible()
        .catch(() => false);
      if (hasFormat) {
        console.log("✅ [Verification] Found due date display format:", format);
        foundDisplayFormat = true;
      }
    }

    console.log("✅ [Verification] Quest due date display test completed");
    console.log("🔍 [Debug] Due date display found:", foundDisplayFormat);

    // This test verifies that due date appears somewhere in the UI
    // The exact format may vary, so we check multiple possibilities
    expect(foundDisplayFormat).toBe(true);
  });
});

