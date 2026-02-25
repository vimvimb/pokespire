import { defineConfig, devices } from '@playwright/test';
// e2e TypeScript compilation uses tsconfig.playwright.json

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    // Uncomment to see the browser during test runs:
    // headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/pokespire/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
