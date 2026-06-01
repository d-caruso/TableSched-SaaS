import { test, expect } from '@playwright/test';

const TENANT_ID = 1;

const fixtureTenant = {
  id: TENANT_ID,
  slug: 'test-restaurant',
  display_name: 'Test Restaurant',
  owner_email: 'owner@example.com',
  created_at: '2026-01-01T00:00:00Z',
  subscription: {
    plan: { slug: 'premium' },
    status: 'active',
    current_period_end: '2026-07-01T00:00:00Z',
    trial_ends_at: null,
    location_limit_override: null,
    usage: { locations: 1, staff: 3, tables: 10, rooms: 2, bookings_this_month: 50, sms_today: 5 },
    effective_max_locations: null,
  },
};

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
  // Guard-critical endpoints: stub window.fetch before React mounts so the
  // platform layout's useIsPlatformStaff() resolves via microtask rather than
  // having to wait for page.route() async delivery (which arrives after effects).
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

  // Remaining endpoints via Playwright route interception.
  await page.route(`**/api/v1/platform/tenants/${TENANT_ID}/`, (route) =>
    route.fulfill({ json: fixtureTenant }),
  );
  await page.route(`**/api/v1/platform/tenants/${TENANT_ID}/lifecycle-events/**`, (route) =>
    route.fulfill({ json: { results: [], next: null } }),
  );
  await page.route(`**/api/v1/platform/tenants/${TENANT_ID}/api-keys-summary/`, (route) =>
    route.fulfill({ json: { active_count: 0, most_recent_key_name: null, most_recent_used_at: null } }),
  );
  await page.route('**/api/v1/platform/auth/impersonation-status/', (route) =>
    route.fulfill({ json: { impersonating: false } }),
  );
  await page.route(`**/api/v1/platform/tenants/${TENANT_ID}/subscription/`, (route) =>
    route.fulfill({
      json: { ...fixtureTenant, subscription: { ...fixtureTenant.subscription, plan: { slug: 'enterprise' } } },
    }),
  );
  await page.route('**/_allauth/app/v1/auth/session', (route) =>
    route.fulfill({ json: { organization: null, memberships: [], tenants: [] } }),
  );
});

test('platform staff opens subscription form and changes plan to enterprise', async ({ page }) => {
  await page.goto(`/platform/tenants/${TENANT_ID}/subscription`);

  await expect(page.getByTestId('subscription-overrides-screen')).toBeVisible({ timeout: 30_000 });

  // Current plan is premium — enterprise plan button is in ghost state
  await expect(page.getByTestId('plan-btn-enterprise')).toBeVisible();

  // Select enterprise plan — save button becomes enabled
  await page.getByTestId('plan-btn-enterprise').click();
  await expect(page.getByTestId('save-btn')).toBeEnabled({ timeout: 5_000 });

  // Save triggers PATCH and navigates back via router.back()
  await page.getByTestId('save-btn').click();
});
