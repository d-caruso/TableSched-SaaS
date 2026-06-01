# Implementation Plan — SaaS Backend: Test Coverage, Tiering & Integration

References:
- Core precedent (template): `TableSched/docs/backend-plan/31-integration-e2e-tests.md`
- Core strategy overview: `TableSched/docs/integration-e2e-test-strategy.md`
- Repo: [`../../README.md`](../../README.md)

---

## Context

`tablesched-saas` is the proprietary SaaS add-on layer over the core `tablesched` package,
with backend apps `billing`, `platform`, `api_access`, and `sms`. Current test state
(verified):

- **Only `sms` is tested** — `backend/tests/sms/` (4 files: `test_adapters.py`,
  `test_router.py`, `test_dlr_webhooks.py`, `test_delivery_rate_task.py`).
- **`billing`, `platform`, `api_access` have zero backend tests** despite carrying the core
  revenue/admin/enterprise logic (subscriptions, plan limits, impersonation, API keys, rate
  limiting, usage tracking).
- **No pytest markers registered** (`pyproject.toml [tool.pytest.ini_options]` sets
  `DJANGO_SETTINGS_MODULE` + `python_files/classes/functions` only). No `tests/integration/`
  dir, no `conftest.py`, no `*_e2e.py` files.
- CI `.github/workflows/backend.yml` exists and is solid (clones core, installs core editable +
  SaaS, `migrate_schemas`, ruff/mypy/check), **but its test matrix runs only `folder: [sms]`** —
  so even if other apps had tests, CI wouldn't run them.

This plan closes the coverage hole (billing/platform/api_access), introduces an
integration/e2e tier consistent with core, and expands CI to actually run it. It changes no
production code.

> Unlike core (which was "organize existing broad coverage"), the SaaS backend needs **net-new
> unit/endpoint coverage** for three apps before/alongside the tiering work.

---

## Branch

`feature/saas-backend-test-tiering`

---

## Task Summary

| Task | Title | Files |
|---|---|---|
| 1 | Register markers + tiering rules + conftest | `backend/pyproject.toml`, `backend/tests/README.md` (new), `backend/tests/conftest.py` (new) |
| 2 | Net-new unit/endpoint tests for billing, platform, api_access | `backend/tests/{billing,platform,api_access}/test_*.py` (new) |
| 3 | Expand CI matrix + add integration/e2e gates | `.github/workflows/backend.yml` |
| 4 | Integration journey tests (G4–G7) | `backend/tests/integration/test_*.py` (new) |

---

## Task 1 — Register markers + tiering rules + conftest

Add registered markers so `pytest -m integration` / `-m e2e` / `-m "not e2e"` work, document
the tiers, and add a shared `conftest.py` (none exists today) with SaaS fixtures (test
subscription/billing-account/platform-staff/api-key factories, tenant schema helpers — reuse
core fixtures where importable).

In `backend/pyproject.toml` under `[tool.pytest.ini_options]`:

```toml
markers = [
  "integration: cross-component tests through DRF/services against the DB",
  "e2e: full user-journey tests spanning multiple endpoints/services",
]
```

**Files:**
- `backend/pyproject.toml` — `markers` list.
- `backend/tests/README.md` — new; tier rules (unit = default; `integration`; `e2e`).
- `backend/tests/conftest.py` — new; shared SaaS fixtures.

**Commit:** `[TASK] 1 register pytest markers, tiers, and shared conftest`

---

## Task 2 — Net-new unit/endpoint tests for billing, platform, api_access

These three apps have **no backend tests**. Add a test package per app under
`backend/tests/<app>/` covering models, services, and DRF endpoints. English-only data; reuse
the `sms` tests as a style reference and any importable core fixtures.

| Gap | App | Coverage to add | Files |
|---|---|---|---|
| G1 | `billing` | subscription model + state, plan-limit checks, SMS-quota accounting, Stripe billing webhook handling (mocked), subscription endpoints | `backend/tests/billing/test_models.py`, `test_subscription_service.py`, `test_plan_limits.py`, `test_webhooks.py`, `test_subscription_endpoint.py` |
| G2 | `platform` | platform-staff permission, admin API (tenant list/detail/actions), impersonation issue/consume, action log | `backend/tests/platform/test_permissions.py`, `test_admin_api.py`, `test_impersonation.py`, `test_action_log.py` |
| G3 | `api_access` | API-key model + hashing, key auth, rate limiting, usage tracking | `backend/tests/api_access/test_models.py`, `test_api_keys.py`, `test_rate_limiting.py`, `test_usage_tracking.py` |

Endpoint tests are tagged `integration` per the tier rules (Task 1); pure model/service tests
stay untagged (unit).

**Commit:** `[TASK] 2 add backend tests for billing, platform, api_access`

---

## Task 3 — Expand CI matrix + add integration/e2e gates

In `.github/workflows/backend.yml`:
- Expand the `test` job matrix from `folder: [sms]` to
  `folder: [sms, billing, platform, api_access]`.
- Add an **`integration`** job (`pytest -q -m integration`) and an **`e2e`** job
  (`pytest -q -m e2e`), reusing the existing core-checkout + install + postgres + migrate
  steps (factor the shared steps; keep `needs: lint`).

**Files:**
- `.github/workflows/backend.yml`.

**Commit:** `[TASK] 3 expand backend CI matrix and add integration/e2e gates`

---

## Task 4 — Integration journey tests (G4–G7)

New cross-component journeys under `backend/tests/integration/`, marked `integration`,
mocked Stripe (no real keys). English-only; files < 500 lines.

| # | Integration test target | Why it's a gap | New file |
|---|---|---|---|
| G4 | Subscription lifecycle: create subscription → mocked Stripe billing webhook → plan limits become active and queryable | billing units (G1) test pieces; the create→webhook→limit-active journey isn't chained | `tests/integration/test_subscription_lifecycle.py` |
| G5 | Plan-limit enforcement through a core action: a core booking/SMS operation is blocked once the tenant is over its plan quota | limits tested in isolation; enforcement against a real core flow not asserted | `tests/integration/test_plan_limit_enforcement.py` |
| G6 | Platform impersonation end-to-end: platform staff → issue impersonation → act within the target tenant → action logged; non-staff forbidden | impersonation pieces only (G2); full admin→impersonate→act→audit journey missing | `tests/integration/test_platform_impersonation.py` |
| G7 | Enterprise API access journey: issue key → authenticated request succeeds → exceed rate limit (429) → usage recorded | api_access units (G3) cover keys/rate/usage separately, not the journey | `tests/integration/test_api_access_journey.py` |

**Commit:** `[TASK] 4 add SaaS cross-component integration tests`

---

## Verification

```bash
# from backend/ (core tablesched installed editable; Postgres up; config.settings.test)
ruff check .
mypy .
pytest -m "not e2e"        # unit + integration
pytest -m integration
pytest -m e2e
pytest                     # full suite
```

Plus:
- CI `test` matrix now runs billing/platform/api_access/sms; new `integration` + `e2e` jobs go
  green on a PR.
- G4–G7 run without Stripe secrets (mocked), so they execute in CI.
- billing/platform/api_access go from 0 → meaningful coverage (confirm with
  `pytest --cov=apps -m "not e2e"`).
