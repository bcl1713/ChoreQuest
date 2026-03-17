import { readFileSync } from "fs";
import { join } from "path";

export const TEST_USER_FILE = join(__dirname, "../.playwright-test-user.json");

export function getTestCredentials(): { email: string; password: string } {
  try {
    const raw = readFileSync(TEST_USER_FILE, "utf-8");
    const { email, password } = JSON.parse(raw);
    return { email, password };
  } catch {
    throw new Error(
      `E2E: test credentials file not found at ${TEST_USER_FILE}. ` +
        `Did global setup run? Try: npm run test:e2e`,
    );
  }
}
