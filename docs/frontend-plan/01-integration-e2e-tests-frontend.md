# Implementation Plan — SaaS Frontend: Integration (MSW) & Web E2E (Playwright)

References:
- Core precedent (template): `TableSched/docs/frontend-plan/31-integration-e2e-tests-frontend.md`
- Core strategy overview: `TableSched/docs/integration-e2e-test-strategy.md`
- Backend counterpart: [`../backend-plan/01-integration-e2e-tests.md`](../backend-plan/01-integration-e2e-tests.md)

---

## Context

The SaaS frontend (Expo Router, Tamagui) is **not greenfield**: a jest harness
(`jest.config.cjs`, `jest.setup.js`, `__mocks__/`) is in place, and there are ~20 **colocated**
component/route tests (`components/**/__tests__/*.test.tsx`,
`app/(saas)/**/__tests__/*.test.tsx`) plus an i18n parity test
(`__tests__/i18n-saas.test.ts`). CI `frontend.yml` exists (checks out core + SaaS — the SaaS
frontend depends on core via `file:../../TableSched/frontend` — then lint/typecheck/test/build).

Gaps (same as core's frontend gaps):
- Tests fake the network at the **module level**; the real API client + React Query path is
  unexercised. **MSW is not installed.**
- **No web/device e2e** (no Playwright/Detox/Maestro).
- No `test-utils/` integration render helper.
- A few platform components lack any test (e.g. `ImpersonateButton`,
  `ConfirmDestructiveModal`, `ApiKeysUpsellCard`, `NotificationTemplatesSection`).

This plan adds MSW network-boundary integration tests and a small Playwright web-e2e suite for
the platform-admin journeys, and wires both into CI — without disturbing the existing tests.

---

## Branch

`feature/saas-frontend-test-integration`

---

## Task Summary

| Task | Title | Files |
|---|---|---|
| 1 | MSW setup | `frontend/package.json`, `frontend/test-utils/msw/{server,handlers}.ts`, `frontend/jest.setup.js`, `frontend/jest.config.cjs` |
| 2 | Integration render helper | `frontend/test-utils/renderIntegration.tsx` |
| 3 | MSW integration tests (platform journeys) | `frontend/__tests__/integration/*.integration.test.tsx` |
| 4 | Fill untested-component gaps | `frontend/components/**/__tests__/*.test.tsx` (a handful) |
| 5 | Playwright web e2e | `frontend/package.json`, `frontend/playwright.config.ts`, `frontend/e2e/*.spec.ts` |
| 6 | CI integration + e2e | `.github/workflows/frontend.yml` |

---

## Task 1 — MSW setup

Add `msw` (v2) as a dev dependency. Create the server + handlers mirroring the SaaS/core API
endpoints the platform screens call (`@/lib/api/*` from core + SaaS `lib/api/*`: SMS
health/delivery-log/routing, tenants list/detail, subscription, lifecycle, billing,
api-keys). Wire MSW into jest **scoped to integration tests only** (jest `projects`/`testRegex`
so `*.integration.test.tsx` opt in; `beforeAll(listen)`/`afterEach(reset)`/`afterAll(close)`),
leaving the existing colocated module-mock tests untouched.

**Files:**
- `frontend/package.json` — add `msw`.
- `frontend/test-utils/msw/server.ts`, `frontend/test-utils/msw/handlers.ts` — new.
- `frontend/jest.config.cjs`, `frontend/jest.setup.js` — integration project + scoped MSW lifecycle.

**Commit:** `[TASK] 1 add MSW network mocking for integration tests`

---

## Task 2 — Integration render helper

`test-utils/renderIntegration.tsx` providing the real provider stack (Tamagui +
`QueryClientProvider` with a fresh `QueryClient` per test, retries off) so React Query + the
real API client run against MSW. No `jest.mock` of the API layer.

**Files:**
- `frontend/test-utils/renderIntegration.tsx` — new.

**Commit:** `[TASK] 2 add integration render helper`

---

## Task 3 — MSW integration tests (platform journeys)

`*.integration.test.tsx` under `frontend/__tests__/integration/` exercising real request →
parse → cache, asserting requests actually hit MSW handlers. English-only data.

- **SMS monitoring**: provider health loads + auto-refresh; delivery-log pagination + filters;
  routing table render (the `app/(saas)/platform/sms/*` screens).
- **Tenant management**: tenants list → detail → subscription / lifecycle screens load and act.
- **Billing**: billing index + upgrade flow round-trip.
- **API keys**: settings/api-keys list + usage.

**Files:**
- `frontend/__tests__/integration/sms.integration.test.tsx`
- `frontend/__tests__/integration/tenants.integration.test.tsx`
- `frontend/__tests__/integration/billing.integration.test.tsx`
- `frontend/__tests__/integration/apiKeys.integration.test.tsx`

**Commit:** `[TASK] 3 add MSW integration tests for platform journeys`

---

## Task 4 — Fill untested-component gaps

Add colocated unit tests for platform components currently lacking a `__tests__` sibling, e.g.
`ImpersonateButton`, `ConfirmDestructiveModal`, `ApiKeysUpsellCard`,
`NotificationTemplatesSection`. (Audit with: for each `components/**/*.tsx`, confirm a sibling
`__tests__/<name>.test.tsx` exists.)

**Files:**
- `frontend/components/**/__tests__/*.test.tsx` — the missing ones.

**Commit:** `[TASK] 4 add tests for untested platform components`

---

## Task 5 — Playwright web e2e

Add `@playwright/test`. Configure against the Expo web build with an MSW **browser worker** for
deterministic data (reuse `test-utils/msw/handlers.ts`). Two platform journeys only (YAGNI):
- Platform staff opens a tenant and changes its subscription/lifecycle.
- Impersonation: start impersonation → banner shows → act → stop.

**Files:**
- `frontend/package.json` — `@playwright/test` + `"e2e": "playwright test"`.
- `frontend/playwright.config.ts` — new (`webServer` runs the web app).
- `frontend/e2e/tenant-subscription.spec.ts`, `frontend/e2e/impersonation.spec.ts` — new.

**Commit:** `[TASK] 5 add Playwright web e2e`

---

## Task 6 — CI integration + e2e

In `.github/workflows/frontend.yml`, after the existing `Test` step (keep the two-repo
checkout that resolves the `file:../../TableSched/frontend` dependency):
- Add an **Integration** step: `npm test -- integration --ci`.
- Add an **e2e** job: `npx playwright install --with-deps` then `npm run e2e`.

**Files:**
- `.github/workflows/frontend.yml`.

**Commit:** `[TASK] 6 add frontend integration and e2e CI`

---

## Verification

```bash
# from frontend/ (core frontend deps installed; see frontend.yml two-repo layout)
npm run build
npm run typecheck
npm run lint
npm test                 # existing colocated tests + i18n parity unaffected
npm test -- integration  # MSW integration tests; assert requests hit handlers
npm run e2e              # Playwright journeys (after playwright install)
```

Plus:
- Integration tests fail if a handler is removed (proving the real client hits MSW).
- CI shows the new Integration step + e2e job green on a PR.
- Every `components/**/*.tsx` has a sibling test after Task 4.
