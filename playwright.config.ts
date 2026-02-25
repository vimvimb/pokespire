import { defineConfig, devices } from '@playwright/test';
// e2e TypeScript compilation uses tsconfig.playwright.json

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['html'], ['list']],
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
    // VITE_E2E_FAST=1 collapses battle victory animation delays to 0ms so the
    // full-campaign test runs in ~15s instead of ~50s.  This env var is never
    // set in normal development or production builds.
    command: 'VITE_E2E_FAST=1 npm run dev',
    url: 'http://localhost:5173/pokespire/',
    // reuseExistingServer: if a dev server is already running locally it is
    // reused (potentially without VITE_E2E_FAST, so the test takes longer but
    // still passes).  In CI a fresh server always starts with the flag set.
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
