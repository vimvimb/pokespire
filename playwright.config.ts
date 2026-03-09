import { defineConfig, devices } from '@playwright/test';
// e2e TypeScript compilation uses tsconfig.playwright.json

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  // Per-test timeout (the full campaign test overrides this to 120s via test.setTimeout)
  timeout: 30_000,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:4173',
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
    // Build the production bundle with VITE_E2E_FAST=1 (collapses battle victory
    // animation delays to 0ms) then serve it with vite preview (port 4173).
    // This tests the real production build rather than the dev server.
    command: 'VITE_E2E_FAST=1 npm run build && npm run preview',
    url: 'http://localhost:4173/pokespire/',
    reuseExistingServer: !process.env.CI,
    // Build + asset compression takes longer than dev server startup
    timeout: 120_000,
  },
});
