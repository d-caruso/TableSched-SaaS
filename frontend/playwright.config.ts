import { defineConfig, devices } from '@playwright/test';

// Port is overridable so e2e can run on a free port when 8081 is busy:
//   E2E_PORT=8090 npm run e2e
const PORT = Number(process.env.E2E_PORT ?? 8081);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
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
    command: `npm run web -- --port ${PORT}`,
    // Root returns 404 (no index route in this SaaS app); use the callback
    // page as the readiness probe since it always returns 200.
    url: `${BASE_URL}/platform/impersonate/callback`,
    // Reuse a server already listening on this port locally (e.g. your running
    // dev server) instead of erroring; always start a fresh one in CI.
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
