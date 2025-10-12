import * as dotenv from "dotenv";
import path from "path";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Enable retries locally for stability under high concurrency
  workers: 2,
  timeout: 60000,
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "off",
    // Wait for network idle to ensure page is fully loaded
    navigationTimeout: 60000, // Increased for high-concurrency scenarios
    actionTimeout: 60000, // Increased for high-concurrency scenarios
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Additional safety for localStorage access
        contextOptions: {
          permissions: ["clipboard-read", "clipboard-write"],
        },
      },
    },
  ],
});
