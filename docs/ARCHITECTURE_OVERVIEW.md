# SaaS Architecture Overview

Status: Living document. Last updated: 2026-06-02.

This document describes SaaS-layer architecture that extends the core
`tablesched` package. It currently focuses on the identity endpoint and the
public/tenant URL configuration split introduced with `GET /api/v1/me/`.

References:
- Design rationale: [`me-endpoint-analysis.md`](./me-endpoint-analysis.md)
- Auth decision: [`adr-001-session-vs-jwt-authentication.md`](./adr-001-session-vs-jwt-authentication.md)
- Implementation plan: [`backend-plan/02-me-endpoint.md`](./backend-plan/02-me-endpoint.md)

---

## URL configuration: public vs tenant split

django-tenants subfolder routing uses two urlconfs, selected per request by
`TenantSubfolderMiddleware` (prefix `api/v1/restaurants`):

- **`ROOT_URLCONF = "config.urls"`** — served for tenant requests
  (`/api/v1/restaurants/<slug>/...`) after the subfolder prefix is stripped.
- **`PUBLIC_SCHEMA_URLCONF = "config.urls_public"`** — served for everything
  else (the shared, tenant-independent schema).

The SaaS `config` package shadows core's editable install: submodules SaaS
defines resolve to SaaS; submodules it lacks fall through to core via the
editable-install `MAPPING`. `_load_core_urlconf(filename)` (in `config/urls.py`)
loads a core urlconf module by absolute path through that MAPPING.

### The fix shipped with `/me/`

Previously SaaS had **no** `config/urls_public.py`, so `PUBLIC_SCHEMA_URLCONF`
fell through to core's file — which knows nothing about SaaS routes. As a result
the SaaS public routes (platform admin API, billing subscription webhook, SMS
DLR webhooks) returned 404 on the public schema.

`config/urls_public.py` now exists and:
1. loads core's public patterns via `_load_core_urlconf("urls_public.py")`, then
2. appends the SaaS public routes (`platform`, `api_access`, billing webhook, `sms`)
   and the public `/api/v1/me/` mount.

Because the module now exists locally, `PUBLIC_SCHEMA_URLCONF = "config.urls_public"`
resolves to it. `config/urls.py` (ROOT/tenant) keeps splatting core's public
patterns (`_core_public.urlpatterns`) — those carry the `api/v1/` prefix that
tenant requests arrive with after the subfolder strip — plus the tenant `/me/`
mount.

| URL | urlconf | Schema |
|---|---|---|
| `GET /api/v1/me/` | `config.urls_public` | public |
| `GET /api/v1/platform/...` | `config.urls_public` | public |
| `GET /api/v1/restaurants/<slug>/me/` | `config.urls` | tenant `<slug>` |

---

## `GET /api/v1/me/` identity endpoint

`MeView` (`apps/platform/views_me.py`) returns the one authenticated,
tenant-independent fact the SaaS frontend needs before any restaurant is chosen:
whether the user is a platform operator.

```json
{ "email": "staff@example.com", "platformAdmin": true, "role": "manager" }
```

- **Auth:** `SessionAuthentication` + `IsAuthenticated` (matches the rest of the
  SaaS platform API; see ADR-001). Unauthenticated → 403. Note `/me/` asserts
  *authentication only, not tenant membership*: an authenticated non-member may call
  the tenant mount and receives `role: null` (no other-tenant data is exposed).
- **`platformAdmin`:** `IsPlatformStaff` (the `platform_staff` Django group) —
  global, public-schema data; drives post-login routing.
- **`role`:** the active `StaffMembership.role` (`manager`/`staff`/`viewer`) or
  `null`. `apps.memberships` is a **tenant-only** app, so its table does not
  exist in the public schema; the view short-circuits to `null` when
  `connection.schema_name == get_public_schema_name()` and only queries
  `StaffMembership` inside a tenant schema. This is why the same view is mounted
  twice — public returns `role: null`, the tenant mount returns the real role.

The slug is **not** returned by `/me/`; it comes from the existing
`GET /api/tenants/` directory. See the analysis doc for the full flow.

---

## Developer ergonomics

`backend/Makefile` wraps the shared core virtualenv
(`../../TableSched/.venv/bin/python`) with `run`, `migrate`, `test`, `shell`,
`lint`, and `typecheck` targets so the interpreter path need not be typed by hand.
