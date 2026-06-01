# Branching Strategy — SaaS Frontend: Integration (MSW) & Web E2E (Playwright)

References:
- Implementation plan: [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md)
- Core precedent: `TableSched/docs/frontend-plan/31-integration-e2e-tests-frontend-branching-strategy.md`

---

## Global Rules

- **No production code changes.** Adds test tooling, helpers, and tests only. If an
  integration/e2e test reveals a real bug, fix it on a separate `fix/*` branch.
- **Two-repo layout.** The SaaS frontend depends on core via
  `file:../../TableSched/frontend`; the core repo must be present (as `frontend.yml` arranges)
  for install/test/build.
- **English-only fixture data**; **Tamagui primitives only** (no RN `View`/`Text`/`Pressable`);
  i18n keys camelCase under the `saas:` namespace.
- **MSW scoped to integration tests** — existing colocated tests + the i18n parity test must
  stay green.
- **Each task branch lifecycle:** create from parent → implement → commit → pre-merge checks →
  push → merge into parent.
- **Progress markers:** ❌ not done · ✅ done. Update in place as work completes.

## Pre-Merge Checks (frontend — run in this order, one at a time)

Run all commands from the `frontend/` directory.

```bash
# 1. Build
npm run build

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Tests — specific file(s) for changed code only
npm test -- <path/to/specific.test.tsx>

# 5. Full suite — only if step 4 passes
npm test
```

All checks must pass (0 errors, 0 failures) before merging.

---

## Branch Hierarchy

```
develop
└── feature/saas-frontend-test-integration
    ├── task/saas-frontend-test-integration-Task1-msw-setup
    ├── task/saas-frontend-test-integration-Task2-render-helper
    ├── task/saas-frontend-test-integration-Task3-integration-tests
    ├── task/saas-frontend-test-integration-Task4-component-gaps
    ├── task/saas-frontend-test-integration-Task5-playwright
    └── task/saas-frontend-test-integration-Task6-ci
```

---

## ❌ Feature branch setup

**⚠️ Create this branch from `develop` before starting any task.**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/saas-frontend-test-integration
git push -u origin feature/saas-frontend-test-integration
```

---

### ❌ Task 1 — MSW setup

Add `msw`; create server + handlers; wire MSW into jest scoped to the integration project.

**Branch:** `task/saas-frontend-test-integration-Task1-msw-setup` — from `feature/saas-frontend-test-integration`

```bash
git checkout feature/saas-frontend-test-integration
git pull origin feature/saas-frontend-test-integration
git checkout -b task/saas-frontend-test-integration-Task1-msw-setup
```

See [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md) §Task 1.

**i18n rule:** Test tooling — no user-facing strings.

**Commit:**
```bash
git add frontend/package.json frontend/package-lock.json \
  frontend/test-utils/msw/ frontend/jest.config.cjs frontend/jest.setup.js
git commit -m "[TASK] 1 add MSW network mocking for integration tests"
```

**Pre-merge checks:**
```bash
npm run build
npm run typecheck
npm run lint
npm test
```

**Push & merge:**
```bash
git push origin task/saas-frontend-test-integration-Task1-msw-setup
git checkout feature/saas-frontend-test-integration
git merge task/saas-frontend-test-integration-Task1-msw-setup
git push origin feature/saas-frontend-test-integration
```

---

### ❌ Task 2 — Integration render helper

`renderIntegration.tsx` with the real Tamagui + `QueryClientProvider` stack (fresh client per test).

**Branch:** `task/saas-frontend-test-integration-Task2-render-helper` — from `feature/saas-frontend-test-integration`

**⚠️ Create only after Task 1 is merged.**

```bash
git checkout feature/saas-frontend-test-integration
git pull origin feature/saas-frontend-test-integration
git checkout -b task/saas-frontend-test-integration-Task2-render-helper
```

See [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md) §Task 2.

**Commit:**
```bash
git add frontend/test-utils/renderIntegration.tsx
git commit -m "[TASK] 2 add integration render helper"
```

**Pre-merge checks:**
```bash
npm run build
npm run typecheck
npm run lint
npm test
```

**Push & merge:**
```bash
git push origin task/saas-frontend-test-integration-Task2-render-helper
git checkout feature/saas-frontend-test-integration
git merge task/saas-frontend-test-integration-Task2-render-helper
git push origin feature/saas-frontend-test-integration
```

---

### ❌ Task 3 — MSW integration tests (platform journeys)

SMS monitoring, tenant management, billing, api-keys journeys as `*.integration.test.tsx`.

**Branch:** `task/saas-frontend-test-integration-Task3-integration-tests` — from `feature/saas-frontend-test-integration`

**⚠️ Create only after Task 2 is merged.**

```bash
git checkout feature/saas-frontend-test-integration
git pull origin feature/saas-frontend-test-integration
git checkout -b task/saas-frontend-test-integration-Task3-integration-tests
```

See [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md) §Task 3.

**i18n rule:** English-only fixture data.

**Commit:**
```bash
git add frontend/__tests__/integration/
git commit -m "[TASK] 3 add MSW integration tests for platform journeys"
```

**Pre-merge checks:**
```bash
npm run build
npm run typecheck
npm run lint
npm test -- integration
npm test
```

**Push & merge:**
```bash
git push origin task/saas-frontend-test-integration-Task3-integration-tests
git checkout feature/saas-frontend-test-integration
git merge task/saas-frontend-test-integration-Task3-integration-tests
git push origin feature/saas-frontend-test-integration
```

---

### ❌ Task 4 — Fill untested-component gaps

Colocated unit tests for platform components lacking a `__tests__` sibling.

**Branch:** `task/saas-frontend-test-integration-Task4-component-gaps` — from `feature/saas-frontend-test-integration`

```bash
git checkout feature/saas-frontend-test-integration
git pull origin feature/saas-frontend-test-integration
git checkout -b task/saas-frontend-test-integration-Task4-component-gaps
```

See [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md) §Task 4.

**i18n rule:** English-only fixture data.

**Commit:**
```bash
git add frontend/components
git commit -m "[TASK] 4 add tests for untested platform components"
```

**Pre-merge checks:**
```bash
npm run build
npm run typecheck
npm run lint
npm test
```

**Push & merge:**
```bash
git push origin task/saas-frontend-test-integration-Task4-component-gaps
git checkout feature/saas-frontend-test-integration
git merge task/saas-frontend-test-integration-Task4-component-gaps
git push origin feature/saas-frontend-test-integration
```

---

### ❌ Task 5 — Playwright web e2e

Add `@playwright/test`, config, MSW browser worker, and two platform journey specs.

**Branch:** `task/saas-frontend-test-integration-Task5-playwright` — from `feature/saas-frontend-test-integration`

**⚠️ Create only after Task 1 is merged** (handlers reused from `test-utils/msw/`).

```bash
git checkout feature/saas-frontend-test-integration
git pull origin feature/saas-frontend-test-integration
git checkout -b task/saas-frontend-test-integration-Task5-playwright
```

See [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md) §Task 5.

**i18n rule:** English-only fixture data.

**Commit:**
```bash
git add frontend/package.json frontend/package-lock.json \
  frontend/playwright.config.ts frontend/e2e/
git commit -m "[TASK] 5 add Playwright web e2e"
```

**Pre-merge checks:**
```bash
npm run build
npm run typecheck
npm run lint
npx playwright install --with-deps
npm run e2e
npm test
```

**Push & merge:**
```bash
git push origin task/saas-frontend-test-integration-Task5-playwright
git checkout feature/saas-frontend-test-integration
git merge task/saas-frontend-test-integration-Task5-playwright
git push origin feature/saas-frontend-test-integration
```

---

### ❌ Task 6 — CI integration + e2e

Add the Integration step and e2e job to `frontend.yml` (keep the two-repo checkout).

**Branch:** `task/saas-frontend-test-integration-Task6-ci` — from `feature/saas-frontend-test-integration`

**⚠️ Create only after Tasks 3 and 5 are merged.**

```bash
git checkout feature/saas-frontend-test-integration
git pull origin feature/saas-frontend-test-integration
git checkout -b task/saas-frontend-test-integration-Task6-ci
```

See [`01-integration-e2e-tests-frontend.md`](./01-integration-e2e-tests-frontend.md) §Task 6.

**Commit:**
```bash
git add .github/workflows/frontend.yml
git commit -m "[TASK] 6 add frontend integration and e2e CI"
```

**Pre-merge checks:**
```bash
npm test -- integration
npm run e2e
```
(Confirm the workflow YAML parses — push and watch the PR checks.)

**Push & merge:**
```bash
git push origin task/saas-frontend-test-integration-Task6-ci
git checkout feature/saas-frontend-test-integration
git merge task/saas-frontend-test-integration-Task6-ci
git push origin feature/saas-frontend-test-integration
```

---

## ❌ Feature complete — merge into develop

All tasks (1–6) complete. Run the full checklist one final time:

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

All checks must pass. Then — with explicit confirmation:

```bash
git checkout develop
git merge feature/saas-frontend-test-integration
git push origin develop
```
