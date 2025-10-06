import { test as base, Browser, BrowserContext, Page } from "@playwright/test";
import { setupUserWithCharacter, TestUser } from "./setup-helpers";
import { createClient } from "@supabase/supabase-js";

/**
 * Worker-scoped fixture that provides a persistent GM user and family
 * for all tests within a worker. This reduces setup overhead and improves
 * test performance by creating the GM user only once per worker.
 */

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
}

export interface StoragePaths {
  outputDir: string;
}

export const test = base.extend<{}, { workerFamily: WorkerFamily }>({
  workerFamily: [
    async ({ browser }, use, workerInfo) => {
      // Create a persistent browser context for the GM user
      const gmContext = await browser.newContext();
      const gmPage = await gmContext.newPage();

      // Create GM user via UI flow (leveraging existing setup helper)
      const timestamp = Date.now();
      const workerIndex = workerInfo.workerIndex;
      const gmUser = await setupUserWithCharacter(gmPage, `worker${workerIndex}-gm-${timestamp}`);

      // Extract user IDs from database using service role key
      // Wait for user to be fully created
      await gmPage.waitForTimeout(3000);

      // Use Supabase service role to query the user by email
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // First, get all auth users to find the one with matching email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error("Failed to list users:", usersError);
        throw new Error(`Failed to list users: ${usersError.message}`);
      }

      const matchingUser = users?.find(u => u.email === gmUser.email);

      if (!matchingUser) {
        console.error("No auth user found with email:", gmUser.email);
        console.log("Available users:", users?.map(u => u.email));
        throw new Error(`No auth user found with email ${gmUser.email}`);
      }

      // Now query the profile using the user ID
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, family_id")
        .eq("id", matchingUser.id)
        .single();

      if (profileError || !profile) {
        console.error("Failed to fetch GM profile:", profileError);
        console.log("User ID:", matchingUser.id);
        throw new Error(`Failed to fetch GM user profile for user ID ${matchingUser.id}`);
      }

      // Query the character using the user_id
      const { data: character, error: characterError } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", matchingUser.id)
        .single();

      if (characterError || !character) {
        console.error("Failed to fetch GM character:", characterError);
        throw new Error(`Failed to fetch GM character for user ID ${matchingUser.id}`);
      }

      const authData = {
        userId: profile.id,
        familyId: profile.family_id || "",
        characterId: character.id || "",
      };

      // Extract family code from dashboard
      const familyCodeElement = await gmPage
        .locator("text=/Guild:.*\\([A-Z0-9]{6}\\)/")
        .or(gmPage.locator("text=/\\([A-Z0-9]{6}\\)/"))
        .first();

      const familyCodeText = await familyCodeElement.textContent();
      const codeMatch = familyCodeText?.match(/\(([A-Z0-9]{6})\)/);
      const familyCode = codeMatch?.[1] || "";

      // Provide the worker-scoped fixture data
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
      });

      // Cleanup: close the GM context
      await gmContext.close();
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
