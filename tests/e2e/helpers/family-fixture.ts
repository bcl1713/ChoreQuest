import { test as base, BrowserContext, Page } from "@playwright/test";
import { setupUserWithCharacter } from "./setup-helpers";
import { joinExistingFamily } from "./auth-helpers";
import { createClient } from "@supabase/supabase-js";

/**
 * Worker-scoped fixture that provides a persistent GM user and family
 * for all tests within a worker. This reduces setup overhead and improves
 * test performance by creating the GM user only once per worker.
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

export interface WorkerFamily {
  gmPage: Page;
  gmEmail: string;
  gmPassword: string;
  gmId: string;
  gmCharacterId: string;
  familyId: string;
  familyCode: string;
  characterName: string;
  gmContext: BrowserContext;
  createEphemeralUser: (
    userName: string,
    options?: CreateFamilyMemberOptions,
  ) => Promise<EphemeralUser>;
  createFamilyMember: (
    options?: CreateFamilyMemberOptions,
  ) => Promise<EphemeralUser>;
}

export interface StoragePaths {
  outputDir: string;
}

export const test = base.extend<{}, { workerFamily: WorkerFamily }>({
  workerFamily: [
    async ({ browser }, use, workerInfo) => {
      const gmContext = await browser.newContext();
      const gmPage = await gmContext.newPage();

      const timestamp = Date.now();
      const workerIndex = workerInfo.workerIndex;
      const gmUser = await setupUserWithCharacter(gmPage, `worker${workerIndex}-gm-${timestamp}`);

      await gmPage.waitForSelector('[data-testid="welcome-message"]', { state: 'visible', timeout: 15000 });

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

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

      const createdUserIds = [authData.userId];
      const createdFamilyIds = [authData.familyId];
      const createdContexts = [gmContext];

      const createEphemeralUser = async (
        userName: string,
        options: CreateFamilyMemberOptions = {},
      ): Promise<EphemeralUser> => {
        const context = await browser.newContext();
        createdContexts.push(context);
        const page = await context.newPage();
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

      const createFamilyMember = async (
        options: CreateFamilyMemberOptions = {},
      ): Promise<EphemeralUser> => {
        const context = await browser.newContext();
        createdContexts.push(context);
        const page = await context.newPage();

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

      for (const context of createdContexts) {
        await context.close();
      }

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
