import { execFileSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

// Find the first free TCP port at/after `start`. Run in a short child process
// so the lookup is synchronous here (the config is evaluated before Playwright
// launches its web server). Binds WITHOUT a host (dual-stack `::`) so an IPv6
// listener — e.g. a running Metro/Expo dev server — is correctly seen as busy;
// an IPv4-only (127.0.0.1) probe would falsely report it free on macOS.
function findFreePort(start: number): number {
  const script =
    'const net=require("net");(async()=>{for(let p=' +
    start +
    ';p<' +
    start +
    '+50;p++){const free=await new Promise(r=>{const s=net.createServer();' +
    's.once("error",()=>r(false));s.once("listening",()=>s.close(()=>r(true)));' +
    's.listen(p);});if(free){console.log(p);return;}}process.exit(1);})();';
  return Number(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }).trim());
}

// Always start our OWN server (never reuse a foreign one). E2E_PORT pins the
// port; otherwise pick a free one so a busy default doesn't collide or error.
// Playwright evaluates this config multiple times (web-server launch + each
// worker), so memoise the chosen port in the env — set once, then inherited by
// the forked workers — or they'd each pick a different port and mismatch the
// server's baseURL.
function resolvePort(): number {
  if (process.env.E2E_PORT) return Number(process.env.E2E_PORT);
  if (process.env.PW_RESOLVED_PORT) return Number(process.env.PW_RESOLVED_PORT);
  const port = findFreePort(8081);
  process.env.PW_RESOLVED_PORT = String(port);
  return port;
}

const PORT = resolvePort();
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
    // Never reuse an existing server: the port is guaranteed free (above), so
    // always start our own app rather than risk binding to a stale or unrelated
    // server (e.g. the other repo's dev server on the same default port).
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
