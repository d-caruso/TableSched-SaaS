# Branching Strategy — SaaS Backend: Test Coverage, Tiering & Integration

References:
- Implementation plan: [`01-integration-e2e-tests.md`](./01-integration-e2e-tests.md)
- Core precedent: `TableSched/docs/backend-plan/31-integration-e2e-tests-branching-strategy.md`

---

## Global Rules

- **No production code changes.** This feature adds markers, tests, conftest, and CI only. If
  a new test reveals a real bug in billing/platform/api_access, fix it on a separate `fix/*`
  branch — do not bundle it here.
- **Core must be installed.** The suite requires the core `tablesched` package (editable or
  tarball) plus Postgres and `config.settings.test`, exactly as `backend.yml` sets up.
- **English-only test data** (e.g. "Restaurant X", never "Ristorante X").
- **Each task branch lifecycle:** create from parent → implement → commit → pre-merge checks →
  push → merge into parent.
- **Files < 500 lines**; split an app's tests across modules as needed.
- **Progress markers:** ❌ not done · ✅ done. Update in place as work completes.

## Pre-Merge Checks (Django backend — run in this order, one at a time)

```bash
# 1. Lint
ruff check .

# 2. Type check
mypy .

# 3. Tests — the specific tier/file(s) for the change
pytest tests/<app>/            # or pytest -m integration
pytest -m e2e

# 4. Full suite — only if step 3 passes
pytest
```

All checks must pass (0 errors, 0 failures) before merging.

---

## Branch Hierarchy

```
develop
└── feature/saas-backend-test-tiering
    ├── task/saas-backend-test-tiering-Task1-markers
    ├── task/saas-backend-test-tiering-Task2-app-tests
    ├── task/saas-backend-test-tiering-Task3-ci
    └── task/saas-backend-test-tiering-Task4-integration-tests
```

---

## ❌ Feature — SaaS Backend Test Coverage & Tiering

Register markers + conftest, add net-new tests for billing/platform/api_access, expand CI, and
add cross-component integration journeys (G4–G7).

**Branch:** `feature/saas-backend-test-tiering` — created from `develop`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/saas-backend-test-tiering
git push -u origin feature/saas-backend-test-tiering
```

---

### ❌ Task 1 — Register markers + tiering rules + conftest

**Branch:** `task/saas-backend-test-tiering-Task1-markers` — from `feature/saas-backend-test-tiering`

```bash
git checkout feature/saas-backend-test-tiering
git pull origin feature/saas-backend-test-tiering
git checkout -b task/saas-backend-test-tiering-Task1-markers
```

See [`01-integration-e2e-tests.md`](./01-integration-e2e-tests.md) §Task 1.

**Commit:**
```bash
git add backend/pyproject.toml backend/tests/README.md backend/tests/conftest.py
git commit -m "[TASK] 1 register pytest markers, tiers, and shared conftest"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-backend-test-tiering-Task1-markers
git checkout feature/saas-backend-test-tiering
git merge task/saas-backend-test-tiering-Task1-markers
git push origin feature/saas-backend-test-tiering
```

---

### ❌ Task 2 — Net-new tests for billing, platform, api_access

**Branch:** `task/saas-backend-test-tiering-Task2-app-tests` — from `feature/saas-backend-test-tiering`

**⚠️ Create only after Task 1 is merged** (markers + conftest available).

```bash
git checkout feature/saas-backend-test-tiering
git pull origin feature/saas-backend-test-tiering
git checkout -b task/saas-backend-test-tiering-Task2-app-tests
```

See [`01-integration-e2e-tests.md`](./01-integration-e2e-tests.md) §Task 2 (G1–G3 per-app
coverage tables).

**Commit:**
```bash
git add backend/tests/billing backend/tests/platform backend/tests/api_access
git commit -m "[TASK] 2 add backend tests for billing, platform, api_access"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest tests/billing/ tests/platform/ tests/api_access/ -q
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-backend-test-tiering-Task2-app-tests
git checkout feature/saas-backend-test-tiering
git merge task/saas-backend-test-tiering-Task2-app-tests
git push origin feature/saas-backend-test-tiering
```

---

### ❌ Task 3 — Expand CI matrix + integration/e2e gates

**Branch:** `task/saas-backend-test-tiering-Task3-ci` — from `feature/saas-backend-test-tiering`

**⚠️ Create only after Task 2 is merged** (the matrix folders must contain tests).

```bash
git checkout feature/saas-backend-test-tiering
git pull origin feature/saas-backend-test-tiering
git checkout -b task/saas-backend-test-tiering-Task3-ci
```

See [`01-integration-e2e-tests.md`](./01-integration-e2e-tests.md) §Task 3 (matrix →
`[sms, billing, platform, api_access]`; add `integration` + `e2e` jobs).

**Commit:**
```bash
git add .github/workflows/backend.yml
git commit -m "[TASK] 3 expand backend CI matrix and add integration/e2e gates"
```

**Pre-merge checks:**
```bash
pytest -m integration -q
pytest -m e2e -q
```
(Confirm the workflow YAML parses — push and watch the PR checks.)

**Push & merge:**
```bash
git push origin task/saas-backend-test-tiering-Task3-ci
git checkout feature/saas-backend-test-tiering
git merge task/saas-backend-test-tiering-Task3-ci
git push origin feature/saas-backend-test-tiering
```

---

### ❌ Task 4 — Integration journey tests (G4–G7)

**Branch:** `task/saas-backend-test-tiering-Task4-integration-tests` — from `feature/saas-backend-test-tiering`

**⚠️ Create only after Task 2 is merged** (journeys build on the app-level coverage).

```bash
git checkout feature/saas-backend-test-tiering
git pull origin feature/saas-backend-test-tiering
git checkout -b task/saas-backend-test-tiering-Task4-integration-tests
```

See [`01-integration-e2e-tests.md`](./01-integration-e2e-tests.md) §Task 4 (G4–G7).

**Commit:**
```bash
git add backend/tests/integration/
git commit -m "[TASK] 4 add SaaS cross-component integration tests"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest tests/integration/ -q
pytest -m integration -q
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-backend-test-tiering-Task4-integration-tests
git checkout feature/saas-backend-test-tiering
git merge task/saas-backend-test-tiering-Task4-integration-tests
git push origin feature/saas-backend-test-tiering
```

---

### ❌ Feature complete — merge into develop

All tasks (1–4) complete. Run the full checklist one final time:

```bash
ruff check .
mypy .
pytest
```

All checks must pass. Then — with explicit confirmation:

```bash
git checkout develop
git merge feature/saas-backend-test-tiering
git push origin develop
```
