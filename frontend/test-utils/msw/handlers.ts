import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost';

export const fixtureSmsHealth = [
  { provider: 'twilio', delivery_rate: 0.98, total_sent: 1200, status: 'healthy' as const },
  { provider: 'vonage', delivery_rate: 0.95, total_sent: 400, status: 'healthy' as const },
];

export const fixtureDeliveryLog = {
  results: [
    {
      id: 'dl-001',
      sent_at: '2026-06-01T10:00:00Z',
      phone: '+390001110001',
      provider: 'twilio',
      status: 'delivered' as const,
      error_code: '',
    },
  ],
  next: null,
};

export const fixtureRoutingTable = [
  { prefix: '+39', providers: ['twilio', 'vonage'] },
  { prefix: '+44', providers: ['vonage'] },
];

export const fixtureTenant = {
  id: 1,
  slug: 'test-restaurant',
  display_name: 'Test Restaurant',
  owner_email: 'owner@example.com',
  created_at: '2026-01-01T00:00:00Z',
  subscription: {
    plan: { slug: 'premium' },
    status: 'active' as const,
    current_period_end: '2026-07-01T00:00:00Z',
    trial_ends_at: null,
    location_limit_override: null,
    usage: { locations: 1, staff: 3, tables: 10, rooms: 2, bookings_this_month: 50, sms_today: 5 },
    effective_max_locations: null,
  },
};

export const fixtureSubscription = {
  tier: 'premium' as const,
  status: 'active' as const,
  trial_ends_at: null,
  current_period_end: '2026-07-01T00:00:00Z',
  cancelled_at: null,
  limits: {
    max_locations: 3,
    max_staff_per_location: 10,
    max_tables: 20,
    max_rooms: 5,
    max_bookings_per_month: 500,
    sms_daily_quota: 50,
  },
  usage: { bookings_this_month: 50, sms_today: 5, locations: 1, staff: 3, tables: 10, rooms: 2 },
};

export const fixtureApiKeys = [
  {
    id: 'key-001',
    name: 'CI key',
    key_prefix: 'ts_live_abc',
    last_used_at: '2026-05-31T08:00:00Z',
    expires_at: null,
    is_active: true,
  },
];

export const handlers = [
  http.get(`${BASE}/api/v1/config/`, () =>
    HttpResponse.json({ features: { platformAdmin: true } }),
  ),

  http.get(`${BASE}/api/v1/platform/sms/health/`, () =>
    HttpResponse.json(fixtureSmsHealth),
  ),

  http.get(`${BASE}/api/v1/platform/sms/delivery-log/`, () =>
    HttpResponse.json(fixtureDeliveryLog),
  ),

  http.get(`${BASE}/api/v1/platform/sms/routing/`, () =>
    HttpResponse.json(fixtureRoutingTable),
  ),

  http.get(`${BASE}/api/v1/platform/tenants/`, () =>
    HttpResponse.json({ results: [fixtureTenant], next: null }),
  ),

  http.get(`${BASE}/api/v1/platform/tenants/:id/`, () =>
    HttpResponse.json(fixtureTenant),
  ),

  http.patch(`${BASE}/api/v1/platform/tenants/:id/subscription/`, async ({ request }) => {
    const patch = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...fixtureTenant,
      subscription: { ...fixtureTenant.subscription, ...patch },
    });
  }),

  http.post(`${BASE}/api/v1/platform/tenants/:id/suspend/`, () =>
    HttpResponse.json({}),
  ),

  http.post(`${BASE}/api/v1/platform/tenants/:id/reactivate/`, () =>
    HttpResponse.json({}),
  ),

  http.post(`${BASE}/api/v1/platform/tenants/:id/cancel/`, () =>
    HttpResponse.json({}),
  ),

  http.get(`${BASE}/api/v1/platform/tenants/:id/lifecycle-events/`, () =>
    HttpResponse.json({ results: [], next: null }),
  ),

  http.get(`${BASE}/api/v1/billing/subscription/`, () =>
    HttpResponse.json(fixtureSubscription),
  ),

  http.post(`${BASE}/api/v1/billing/checkout-session/`, () =>
    HttpResponse.json({ url: 'https://checkout.example.com' }),
  ),

  http.post(`${BASE}/api/v1/billing/portal-session/`, () =>
    HttpResponse.json({ url: 'https://billing.example.com' }),
  ),

  http.get(`${BASE}/api/v1/platform/api-keys/`, () =>
    HttpResponse.json(fixtureApiKeys),
  ),

  http.get(`${BASE}/api/v1/platform/api-keys/:id/usage/`, () =>
    HttpResponse.json([]),
  ),

  http.get(`${BASE}/api/v1/platform/auth/impersonation-status/`, () =>
    HttpResponse.json({ impersonating: false }),
  ),

  http.post(`${BASE}/api/v1/platform/tenants/:id/impersonate/`, () =>
    HttpResponse.json({ token: 'test-impersonation-token' }),
  ),
];
