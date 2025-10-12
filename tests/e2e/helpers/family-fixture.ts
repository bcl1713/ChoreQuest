import { test as base, BrowserContext, Page } from "@playwright/test";
import { setupUserWithCharacter } from "./setup-helpers";
import { joinExistingFamily } from "./auth-helpers";
import { createClient } from "@supabase/supabase-js";

/**
 * Sets up console logging for a Playwright page.
 * Logs browser console errors and warnings to the terminal for easier debugging.
 * Filters out known noisy warnings that don't indicate actual problems.
 *
 * This is automatically called for all pages created via the workerFamily fixture,
 * but can be manually called for pages created outside the fixture.
 *
 * @example
 * ```typescript
 * const context = await browser.newContext();
 * const page = await context.newPage();
 * setupConsoleLogging(page); // Enable console logging for this page
 * ```
 */
export function setupConsoleLogging(page: Page): void {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    // Log errors and warnings, but filter out known noisy messages
    if ((type === 'error' || type === 'warning') &&
        !text.startsWith('#setScale') &&
        !text.startsWith('offsetParent is not set')) {
      console.log(`BROWSER ${type.toUpperCase()}:`, text);
    }
  });
}

/**
 * Worker-scoped fixture that provides a persistent GM user and family
 * for all tests within a worker. This reduces setup overhead and improves
 * test performance by creating the GM user only once per worker.
 *
 * HOW IT WORKS:
 * - When a Playwright worker starts, it creates ONE GM user with a new family
 * - This GM user and family persist across ALL tests in that worker
 * - Each test gets access to the same gmPage, gmEmail, familyCode, etc.
 * - Tests can create additional ephemeral users via createEphemeralUser() or createFamilyMember()
 * - When the worker finishes, cleanup automatically removes all created users and data
 *
 * WHY WORKER-SCOPED:
 * - Much faster than creating a new family for every test
 * - Tests still run in parallel safely (each worker has its own isolated family)
 * - More realistic: users persist across multiple operations just like in production
 * - Reduces database load and test flakiness from repeated setup/teardown
 *
 * USAGE:
 * Import test and expect from this file instead of @playwright/test:
 *   import { test, expect } from './helpers/family-fixture';
 *
 * Access the fixture in your test:
 *   test('my test', async ({ workerFamily }) => {
 *     const { gmPage, familyCode, createFamilyMember } = workerFamily;
 *     // Your test code here
 *   });
 */

export interface EphemeralUser {
  page: Page;
  email: string;
  password: string;
  userId: string;
  characterId: string;
  characterName: string;
  context: BrowserContext;
}

type CharacterClass = "KNIGHT" | "MAGE" | "RANGER" | "ROGUE" | "HEALER";

export interface CreateFamilyMemberOptions {
  displayName?: string;
  email?: string;
  password?: string;
  characterName?: string;
  characterClass?: CharacterClass;
}

/**
 * The WorkerFamily fixture provides access to a persistent Guild Master user and helper functions.
 * This interface defines what's available to your tests via the workerFamily fixture.
 */
export interface WorkerFamily {
  /** The persistent Guild Master's page (logged in and ready to use) */
  gmPage: Page;
  /** The GM user's email address */
  gmEmail: string;
  /** The GM user's password */
  gmPassword: string;
  /** The GM user's database ID */
  gmId: string;
  /** The GM user's character ID */
  gmCharacterId: string;
  /** The family/guild ID created by the GM */
  familyId: string;
  /** The 6-character family code for joining this family */
  familyCode: string;
  /** The GM character's name */
  characterName: string;
  /** The GM's browser context (for advanced use cases) */
  gmContext: BrowserContext;
  /** Create a new ephemeral user in their own family (not part of GM's family) */
  createEphemeralUser: (
    userName: string,
    options?: CreateFamilyMemberOptions,
  ) => Promise<EphemeralUser>;
  /** Create a new family member who joins the GM's family */
  createFamilyMember: (
    options?: CreateFamilyMemberOptions,
  ) => Promise<EphemeralUser>;
}

export interface StoragePaths {
  outputDir: string;
}

/**
 * Extended test object with worker-scoped fixture.
 * This is exported as 'test' so you import it instead of @playwright/test.
 *
 * The fixture setup runs ONCE per worker (not per test), and the teardown
 * runs ONCE when the worker finishes all its tests.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, { workerFamily: WorkerFamily }>({
  workerFamily: [
    async ({ browser }, use, workerInfo) => {
      // SETUP PHASE: Create the persistent GM user and family for this worker
      const gmContext = await browser.newContext();
      const gmPage = await gmContext.newPage();
      setupConsoleLogging(gmPage);

      // Create unique GM user for this worker (worker0, worker1, etc.)
      const timestamp = Date.now();
      const workerIndex = workerInfo.workerIndex;
      const gmUser = await setupUserWithCharacter(gmPage, `worker${workerIndex}-gm-${timestamp}`);

      await gmPage.waitForSelector('[data-testid="welcome-message"]', { state: 'visible', timeout: 15000 });

      // Use Supabase admin client to fetch user IDs after UI-based creation
      // This is necessary because the UI signup flow doesn't return user IDs
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Look up the user by email to get their auth user ID
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw new Error(`Failed to list users: ${usersError.message}`);

      const matchingUser = users?.find(u => u.email === gmUser.email);
      if (!matchingUser) throw new Error(`No auth user found with email ${gmUser.email}`);

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, family_id")
        .eq("id", matchingUser.id)
        .single();
      if (profileError || !profile) throw new Error(`Failed to fetch GM user profile for user ID ${matchingUser.id}`);

      const { data: character, error: characterError } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", matchingUser.id)
        .single();
      if (characterError || !character) throw new Error(`Failed to fetch GM character for user ID ${matchingUser.id}`);

      const authData = {
        userId: profile.id,
        familyId: profile.family_id || "",
        characterId: character.id || "",
      };

      const familyCodeElement = await gmPage.locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/").first();
      const familyCodeText = await familyCodeElement.textContent();
      const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
      const familyCode = codeMatch?.[1] || "";

      // Track all created resources for cleanup during teardown
      const createdUserIds = [authData.userId];
      const createdFamilyIds = [authData.familyId];
      const createdContexts = [gmContext];

      /**
       * Helper function: Create an ephemeral user in their OWN family (not GM's family).
       * Use this when you need an independent user for testing cross-family scenarios.
       */
      const createEphemeralUser = async (
        userName: string,
        options: CreateFamilyMemberOptions = {},
      ): Promise<EphemeralUser> => {
        const context = await browser.newContext();
        createdContexts.push(context);
        const page = await context.newPage();
        setupConsoleLogging(page);
        const user = await setupUserWithCharacter(page, userName, {
          characterClass: options.characterClass,
        });

        await page.waitForSelector('[data-testid="welcome-message"]', { state: 'visible', timeout: 15000 });

        let newUserAuth;
        for (let i = 0; i < 5; i++) {
          const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) throw new Error(`Failed to list users: ${listError.message}`);
          newUserAuth = allUsers?.find(u => u.email === user.email);
          if (newUserAuth) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!newUserAuth) throw new Error(`Could not find ephemeral user with email ${user.email}`);

        const { data: userProfile, error: profileErr } = await supabase
          .from("user_profiles")
          .select("id, family_id")
          .eq("id", newUserAuth.id)
          .single();
        if (profileErr) throw new Error(`Failed to fetch ephemeral user profile: ${profileErr.message}`);

        const { data: userChar, error: charErr } = await supabase
          .from("characters")
          .select("id")
          .eq("user_id", newUserAuth.id)
          .single();
        if (charErr) throw new Error(`Failed to fetch ephemeral user character: ${charErr.message}`);

        createdUserIds.push(newUserAuth.id);
        if (userProfile.family_id) {
          createdFamilyIds.push(userProfile.family_id);
        }

        return {
          page,
          email: user.email,
          password: user.password,
          userId: newUserAuth.id,
          characterId: userChar.id,
          characterName: user.characterName,
          context,
        };
      };

      /**
       * Helper function: Create a family member who JOINS the GM's family.
       * Use this for testing multi-user scenarios within the same family.
       */
      const createFamilyMember = async (
        options: CreateFamilyMemberOptions = {},
      ): Promise<EphemeralUser> => {
        const context = await browser.newContext();
        createdContexts.push(context);
        const page = await context.newPage();
        setupConsoleLogging(page);

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const uniqueId = `${timestamp}-${random}`;

        const displayName = options.displayName ?? `Family Member ${uniqueId}`;
        const email = options.email ?? `family-member-${uniqueId}@example.com`;
        const password = options.password ?? "password123";
        const characterName =
          options.characterName ?? `${displayName} Character`;
        const characterClass = (options.characterClass ?? "ROGUE").toLowerCase();

        await joinExistingFamily(page, familyCode, {
          name: displayName,
          email,
          password,
        });

        await page.fill("input#characterName", characterName);
        await page.click(`[data-testid="class-${characterClass}"]`);
        await page.click('button:text("Begin Your Quest")');
        await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });

        let memberAuth;
        for (let i = 0; i < 5; i++) {
          const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) throw new Error(`Failed to list users: ${listError.message}`);
          memberAuth = allUsers?.find(u => u.email === email);
          if (memberAuth) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!memberAuth) {
          throw new Error(`Could not find family member user with email ${email}`);
        }

        const { data: memberProfile, error: memberProfileErr } = await supabase
          .from("user_profiles")
          .select("id, family_id")
          .eq("id", memberAuth.id)
          .single();
        if (memberProfileErr) {
          throw new Error(`Failed to fetch family member profile: ${memberProfileErr.message}`);
        }

        const { data: memberCharacter, error: memberCharacterErr } = await supabase
          .from("characters")
          .select("id")
          .eq("user_id", memberAuth.id)
          .single();
        if (memberCharacterErr) {
          throw new Error(`Failed to fetch family member character: ${memberCharacterErr.message}`);
        }

        createdUserIds.push(memberAuth.id);
        if (memberProfile.family_id) {
          createdFamilyIds.push(memberProfile.family_id);
        }

        return {
          page,
          email,
          password,
          userId: memberAuth.id,
          characterId: memberCharacter.id,
          characterName,
          context,
        };
      };

      // YIELD PHASE: Provide the fixture to all tests in this worker
      // All tests will share this same GM user and can create additional users as needed
      await use({
        gmPage,
        gmEmail: gmUser.email,
        gmPassword: gmUser.password,
        gmId: authData.userId,
        gmCharacterId: authData.characterId,
        familyId: authData.familyId,
        familyCode,
        characterName: gmUser.characterName,
        gmContext,
        createEphemeralUser,
        createFamilyMember,
      });

      // TEARDOWN PHASE: Cleanup all resources created during this worker's lifetime
      // Close all browser contexts first
      for (const context of createdContexts) {
        await context.close();
      }

      // Delete all users from the database (cascading deletes handle families, characters, etc.)
      console.log(`[Worker ${workerIndex}] Starting cleanup...`);
      try {
        for (const userId of createdUserIds) {
          await supabase.auth.admin.deleteUser(userId);
        }
        console.log(`[Worker ${workerIndex}] Cleanup completed successfully`);
      } catch (error) {
        console.error(`[Worker ${workerIndex}] Cleanup failed with error:`, error);
      }
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
