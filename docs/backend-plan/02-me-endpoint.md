# Implementation Plan — SaaS Backend: `GET /api/v1/me/` Identity Endpoint

References:
- Design rationale: [`../me-endpoint-analysis.md`](../me-endpoint-analysis.md)
- Auth decision: [`../adr-001-session-vs-jwt-authentication.md`](../adr-001-session-vs-jwt-authentication.md)
- Repo: [`../../README.md`](../../README.md)

---

## Context

The SaaS `frontend/app/index.tsx` routes staff after login: platform operators →
`/platform/tenants`, restaurant staff → `/(staff)/dashboard`. That decision needs one
authenticated fact — `platformAdmin` — readable **before any tenant is chosen**. No
such endpoint exists. This plan adds `GET /api/v1/me/` returning
`{email, platformAdmin, role}`.

Verified preconditions:
- **Login already exists** (`POST /_allauth/app/v1/auth/login`, core, inherited). No change.
- **No `/me/` endpoint** in core or SaaS.
- **SaaS has no public urlconf.** `PUBLIC_SCHEMA_URLCONF="config.urls_public"` falls
  through to core's file (SaaS has none), so SaaS public routes (`platform`, `billing`
  webhook, `sms`) 404 on the public path — verified by driving the real
  `TenantSubfolderMiddleware`. The public `/me/` mount depends on fixing this, and the
  fix also restores those endpoints.
- **Auth is session-based** on the SaaS side (every `apps/platform/views.py` view uses
  `SessionAuthentication`); `/me/` matches.

Reused, not rebuilt: `IsPlatformStaff` (`apps/platform/permissions.py`) for
`platformAdmin`; `StaffMembership` (`TableSched/.../apps/memberships/models.py`) for
`role`; the existing `GET /api/tenants/` directory supplies slugs (not `/me/`).

> Changes production routing/adds an endpoint (unlike the test-only plan 01). Keep
> scope tight; unrelated bugs go on separate `fix/*` branches.

---

## Branch

`feature/saas-me-endpoint`

---

## Task Summary

| Task | Title | Files |
|---|---|---|
| 1 | SaaS public urlconf foundation | `backend/config/urls_public.py` (new), `backend/config/urls.py` |
| 2 | `MeView` + dual (public/tenant) mount | `backend/apps/platform/views_me.py` (new), `backend/config/urls_public.py`, `backend/config/urls.py` |
| 3 | Tests (auth, public, tenant role, routing regression) | `backend/tests/platform/test_me.py`, `conftest.py`, `__init__.py` (new) |
| 4 | Dev ergonomics + docs | `backend/Makefile` (new), `docs/ARCHITECTURE_OVERVIEW.md` |

---

## Task 1 — SaaS public urlconf foundation

Create `backend/config/urls_public.py`, mirroring the loader pattern already in
`config/urls.py`: reuse `_load_core_urlconf("urls_public.py")` to pull core's public
patterns, then append the SaaS public routes (`platform`, `api_access`, billing
subscription webhook, `sms`). Because SaaS now *has* this module,
`PUBLIC_SCHEMA_URLCONF="config.urls_public"` resolves to it (local submodule shadows
the editable fall-through) — **no settings change**. Relocate the misplaced SaaS public
routes out of `config/urls.py` (the tenant/ROOT urlconf): before this work they lived
*only* there, where public-schema requests never reach them. The tenant urlconf keeps
reusing core's public patterns (`*_core_public.urlpatterns`, which carry the `api/v1/`
prefix that tenant requests arrive with after the subfolder strip), so tenant routing
still resolves after the move.

This both fixes the platform/billing/SMS public-routing 404 and gives `/me/` a home
(its public mount is added in Task 2).

**Files:** `backend/config/urls_public.py` (new), `backend/config/urls.py`.

**Commit:** `[TASK] 1 add SaaS public urlconf and fix public route exposure`

---

## Task 2 — `MeView` + dual mount

New `backend/apps/platform/views_me.py`:
- `class MeView(APIView)` — `authentication_classes = [SessionAuthentication]`,
  `permission_classes = [IsAuthenticated]` (NOT `IsPlatformStaff`; restaurant staff
  must get `platformAdmin: false`).
- `get()` returns `{ "email": request.user.email,
  "platformAdmin": IsPlatformStaff().has_permission(request, self),
  "role": <active StaffMembership.role or None> }`.
  `role` is resolved by a helper: **because `apps.memberships` is a tenant-only app,
  the `StaffMembership` table does not exist in the public schema** — querying it
  there raises `ProgrammingError`. The helper therefore short-circuits to `None` when
  `connection.schema_name == get_public_schema_name()` (django-tenants), and only
  otherwise runs
  `StaffMembership.objects.filter(user=request.user, is_active=True).first()` →
  `.role` or `None`. `connection.schema_name` is injected at runtime by
  django-tenants, so it carries a targeted `# type: ignore[attr-defined]`.
  View < 50 lines.

Mount the same view twice:
- public: `path("api/v1/me/", MeView.as_view(), name="me")` in `config/urls_public.py`.
- tenant: `path("me/", MeView.as_view(), name="me")` in `config/urls.py` → serves
  `/api/v1/restaurants/<slug>/me/` (real `role`).

**Files:** `backend/apps/platform/views_me.py` (new), `backend/config/urls_public.py`,
`backend/config/urls.py`.

**Commit:** `[TASK] 2 add MeView with public and tenant mounts`

---

## Task 3 — Tests

New `backend/tests/platform/test_me.py` (+ `backend/tests/platform/__init__.py` and
`backend/tests/platform/conftest.py`, which holds the `public_tenant` / `staff_user` /
`platform_user` fixtures); session auth via `client.force_login`; English-only data. Cases:
1. Unauthenticated → 403.
2. Restaurant staff (not in `platform_staff`), public context → 200,
   `platformAdmin=false`, `role=null`.
3. `platform_staff` member → 200, `platformAdmin=true`.
4. Tenant-scoped call within a tenant schema → `role` = membership role
   (create `StaffMembership` via `schema_context`).
5. Routing regression: `/api/v1/me/` and `/api/v1/platform/tenants/` resolve under the
   new public urlconf (guards the 404 gap from returning).

**Files:** `backend/tests/platform/test_me.py` (new), `backend/tests/platform/conftest.py` (new),
`backend/tests/platform/__init__.py` (new).

**Commit:** `[TEST] 3 add tests for /me/ and public-routing regression`

---

## Task 4 — Dev ergonomics + docs

`backend/Makefile` so the shared core venv isn't typed by hand:

```makefile
PY = ../../TableSched/.venv/bin/python

.PHONY: run migrate test shell lint typecheck

run:
	$(PY) manage.py runserver
migrate:
	$(PY) manage.py migrate_schemas
test:
	$(PY) -m pytest
shell:
	$(PY) manage.py shell
lint:
	$(PY) -m ruff check .
typecheck:
	$(PY) -m mypy .
```

Update architecture docs for the new endpoint + the public/tenant urlconf split, and
cross-link `../me-endpoint-analysis.md` and `../adr-001-session-vs-jwt-authentication.md`.

**Files:** `backend/Makefile` (new), `docs/ARCHITECTURE_OVERVIEW.md`.

**Commit:** `[TASK] 4 add Makefile for SaaS backend dev shortcuts`

---

## Verification

```bash
# from backend/ (core tablesched installed editable; Postgres up; config.settings.test)
ruff check .
mypy .
pytest tests/platform/test_me.py
pytest
```

Plus a live check (`make run`, Postgres up, `make migrate` first):

```bash
curl -i --cookie "<session>" http://localhost:8000/api/v1/me/
# → 200 { "email", "platformAdmin", "role": null }
curl -i http://localhost:8000/api/v1/platform/tenants/   # no longer 404 (auth-gated)
```

Confirm `platformAdmin` flips with `platform_staff` membership, and a tenant-scoped
`/api/v1/restaurants/<slug>/me/` returns the real `role`.
