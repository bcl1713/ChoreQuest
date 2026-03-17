import { readFileSync } from "fs";
import { join } from "path";

export const TEST_USER_FILE = join(__dirname, "../.playwright-test-user.json");

export function getTestCredentials(): { email: string; password: string } {
  const raw = readFileSync(TEST_USER_FILE, "utf-8");
  const { email, password } = JSON.parse(raw);
  return { email, password };
}
