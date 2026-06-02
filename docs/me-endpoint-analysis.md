# `GET /api/v1/me/` — Identity Endpoint Analysis

Status: Analysis / design rationale (implementation tracked separately).
Date: 2026-06-02

References:
- Auth decision: [`adr-001-session-vs-jwt-authentication.md`](adr-001-session-vs-jwt-authentication.md)
- Platform-staff check: `backend/apps/platform/permissions.py` (`IsPlatformStaff`)
- Tenant role: `TableSched/backend/apps/memberships/models.py` (`StaffMembership`)
- Tenant directory (existing): `TableSched/backend/apps/tenants/views/public.py` (`tenant_directory`)
- Core architecture: `TableSched/docs/ARCHITECTURE_OVERVIEW.md`

---

## Context

The SaaS `frontend/app/index.tsx` owns the post-login routing decision for the
combined Core+SaaS deployment:

- platform staff      → `/platform/tenants`
- restaurant staff    → `/(staff)/dashboard` (then restaurant selection)
- unauthenticated     → `/login`

To route, the frontend needs one authenticated fact — *"is this user a platform
operator?"* — **before any restaurant (tenant) is chosen**. That fact must therefore
be answerable with no tenant in the URL. `GET /api/v1/me/` provides it.

## What the endpoint returns

```json
{
  "email": "staff@example.com",
  "platformAdmin": true,
  "role": "manager"   // manager | staff | viewer | null
}
```

| Field | Source | Schema | Notes |
|---|---|---|---|
| `email` | `request.user.email` | public (global) | identity |
| `platformAdmin` | `IsPlatformStaff` → `platform_staff` group | public (global) | drives routing |
| `role` | `StaffMembership.role` for the active tenant | per-tenant | `null` when called without a tenant context |

## Two senses of "public" (disambiguation)

The word "public" is overloaded; only the second sense applies here.

1. **Authentication sense** — public = *no login required*. **NOT this.**
   `/me/` is authenticated (session auth, `IsAuthenticated`); anonymous → 401/403.
2. **Schema sense (django-tenants)** — public = the *shared, tenant-independent*
   DB schema (where `User` and groups live), vs a per-restaurant tenant schema.
   **This** is what "public `/me/`" means.

`/me/` is therefore **authenticated AND public-schema** at the same time.

## Why it must be answerable without a tenant (chicken-and-egg)

```
   To call the TENANT /me/ you need a <slug> in the URL ──┐
                                                          │  but...
   choosing the <slug> is the decision you haven't  ◀─────┘
   made yet — it's what you're calling /me/ to decide
```

`platformAdmin` and `email` are global, public-schema data. The routing decision
happens at the app root (`/`) with no `/restaurants/<slug>/` prefix, so the flag has
to live on a public-schema endpoint. `role` is per-restaurant and only meaningful
once a tenant is selected — hence the optional tenant-scoped variant.

## Post-login flow

```
                         ┌─────────────────────────────────────────────┐
                         │  STAFF LOGS IN                               │
                         │  POST /_allauth/app/v1/auth/login            │
                         │  → authenticated (session); no slug, no role │
                         └───────────────────────┬─────────────────────┘
                                                 │  URL is just "/"
                                                 ▼
                         ┌─────────────────────────────────────────────┐
                         │  app/index.tsx  (router)                     │
                         │  ❓ where do I send this user?               │
                         └───────────────────────┬─────────────────────┘
                                                 ▼
                         ┌─────────────────────────────────────────────┐
                         │  GET /api/v1/me/        ◀── PUBLIC schema    │
                         │  → { email, platformAdmin, role: null }      │
                         └───────────────┬─────────────────────────────┘
                                         │
                  platformAdmin === true │ else (restaurant staff)
                  ┌──────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌──────────────────────────────┐         ┌──────────────────────────────────────┐
   │ Redirect → /platform/tenants │         │ GET /api/tenants/  (EXISTING)          │
   │ (operator sees ALL tenants;  │         │ → list of accessible restaurants/slugs │
   │  no slug needed)             │         │   1 → auto-redirect                    │
   └──────────────────────────────┘         │   N → user selects one → <slug>        │
                                            └───────────────────┬────────────────────┘
                                                                ▼
                                            ┌───────────────────────────────────────┐
                                            │ /api/v1/restaurants/<slug>/...         │
                                            │ middleware sets schema = <slug>        │
                                            │ (optional) GET .../<slug>/me/          │
                                            │   → role: manager|staff|viewer         │
                                            │     (TENANT schema)                    │
                                            └───────────────────────────────────────┘
```

### The slug does NOT come from `/me/`

Three separate responsibilities — keep them separate (KISS/DRY):

| Call | Returns | Purpose |
|---|---|---|
| `POST /_allauth/.../login` | session (global user) | authenticate — no slug |
| `GET /api/v1/me/` | `email`, `platformAdmin` | which audience → which area |
| `GET /api/tenants/` (exists) | accessible `{name, schema, api_prefix}` | which slug(s) |

`/me/` is a thin identity flag; the existing tenant directory supplies slugs (with
its own per-tenant access filtering). No duplication.

## Schema split (why one view, two mounts)

```
  public schema             │  tenant schema "<slug>"
  ┌───────────────────┐     │  ┌────────────────────────┐
  │ User (email)      │     │  │ StaffMembership.role   │
  │ group platform_   │     │  │  manager/staff/viewer  │
  │   staff → platform│     │  │  (one per tenant)      │
  │   Admin           │     │  └────────────────────────┘
  └───────────────────┘     │
   global, tenant-free      │   per-restaurant
        ▲                   │        ▲
        └── /api/v1/me/     │        └── /api/v1/restaurants/<slug>/me/
            (PUBLIC schema) │            (TENANT schema)
```

Same `MeView`, mounted in both urlconfs. `StaffMembership.objects.filter(user=...)`
returns the role in whatever schema is active → `null` in public, the role in a
tenant. The split follows the schema boundary exactly.

## Why not embed `platformAdmin` in the login response/JWT?

Rejected. Login is **core's** allauth endpoint; `platformAdmin`/`platform_staff` is a
**SaaS** concept. Embedding it would couple core to SaaS (or force SaaS to override
core's allauth response) and conflate authentication with authorization. Since the
app already makes a post-login call (`/api/tenants/`), no round-trip is saved.
(Under sessions the token-staleness objection is moot, but the layering objection is
decisive.) See ADR-001.

## Authentication

`/me/` uses **`SessionAuthentication`**, matching the existing SaaS platform API
(`apps/platform/views.py`). Authenticated but public-schema. `GET` only → no CSRF
concern. See ADR-001 for the sessions-vs-JWT rationale.

## Routing prerequisite

A public-schema endpoint in SaaS currently has no valid home: SaaS has no
`config/urls_public.py`, so `PUBLIC_SCHEMA_URLCONF` falls through to core's file and
SaaS public routes 404. The `/me/` public mount depends on adding a SaaS
`config/urls_public.py` (tracked in the implementation plan), which also fixes the
existing platform/billing/SMS public-routing gap.
