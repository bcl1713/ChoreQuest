import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Wait for network idle to ensure page is fully loaded
    navigationTimeout: 30000,
    actionTimeout: 10000,
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
