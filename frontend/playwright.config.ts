import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    actionTimeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run web -- --port 8081',
    // Root returns 404 (no index route in this SaaS app); use the callback
    // page as the readiness probe since it always returns 200.
    url: 'http://localhost:8081/platform/impersonate/callback',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
