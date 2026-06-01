import { test, expect } from '@playwright/test';

// Tests the impersonation callback page — the final step of the impersonation
// flow where the one-time token is exchanged for a staff session.

const fixtureSubscription = {
  tier: 'premium',
  status: 'active',
  trial_ends_at: null,
  current_period_end: '2026-07-01T00:00:00Z',
  cancelled_at: null,
  limits: { max_locations: 3, max_staff_per_location: 10, max_tables: 20, max_rooms: 5, max_bookings_per_month: 500, sms_daily_quota: 50 },
  usage: { bookings_this_month: 50, sms_today: 5, locations: 1, staff: 3, tables: 10, rooms: 2 },
};

test.beforeEach(async ({ page }) => {
  // Stub guard-critical endpoints synchronously so the platform layout resolves
  // before its redirect useEffect fires (same pattern as tenant-subscription spec).
  await page.addInitScript(({ config, billing }) => {
    const realFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = (input instanceof Request ? input.url : String(input));
      if (url.includes('/api/v1/config/')) {
        return Promise.resolve(new Response(JSON.stringify(config), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (url.includes('/api/v1/billing/subscription/')) {
        return Promise.resolve(new Response(JSON.stringify(billing), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return realFetch(input, init);
    };
  }, { config: { features: { platformAdmin: true } }, billing: fixtureSubscription });

  await page.route('**/_allauth/app/v1/auth/session', (route) =>
    route.fulfill({ json: { organization: null, memberships: [], tenants: [] } }),
  );
});

test('impersonation callback shows error state when token exchange fails', async ({ page }) => {
  await page.route('**/api/v1/platform/auth/impersonate-exchange/', (route) =>
    route.fulfill({ status: 400, json: { detail: 'Invalid or expired token' } }),
  );

  await page.goto('/platform/impersonate/callback?token=bad-token&restaurant_id=rest-001');

  await expect(page.getByTestId('callback-error')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('back-to-admin-btn')).toBeVisible();
});

test('impersonation callback navigates away on successful token exchange', async ({ page }) => {
  // AuthProvider reads auth state from sessionStorage on web (core/lib/auth/AuthContext.tsx).
  // A fresh browser has empty sessionStorage, so the staff layout Guard would redirect to
  // /login (which is unmatched in the SaaS app), causing Expo Router to revert the
  // navigation and leave the URL at /callback. Seed the tokens so the Guard passes.
  await page.addInitScript(() => {
    window.sessionStorage.setItem('tablesched.accessToken', 'test-access-token');
    window.sessionStorage.setItem('tablesched.tenant', 'test-restaurant');
  });

  await page.route('**/api/v1/platform/auth/impersonate-exchange/', (route) =>
    route.fulfill({ status: 200, json: {} }),
  );

  await page.goto('/platform/impersonate/callback?token=valid-token&restaurant_id=rest-001');

  // Successful exchange triggers router.replace('/(staff)/dashboard').
  // The callback page itself disappears — URL no longer contains /callback.
  await expect(page).not.toHaveURL(/\/callback/, { timeout: 30_000 });
});
