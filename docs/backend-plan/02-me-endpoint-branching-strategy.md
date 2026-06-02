# Branching Strategy — SaaS Backend: `GET /api/v1/me/` Identity Endpoint

References:
- Implementation plan: [`02-me-endpoint.md`](./02-me-endpoint.md)
- Design rationale: [`../me-endpoint-analysis.md`](../me-endpoint-analysis.md)

---

## Global Rules

- **Scoped production change.** This feature adds a public urlconf, one endpoint, a
  Makefile, tests, and docs. If a test reveals an unrelated bug (e.g. in platform/
  billing routing), fix it on a separate `fix/*` branch — do not bundle it here.
- **Core must be installed.** Requires the core `tablesched` package (editable or
  tarball) + Postgres + `config.settings.test`, as `backend.yml` sets up.
- **English-only test data** ("Restaurant X", never "Ristorante X").
- **Each task branch lifecycle:** create from parent → implement → commit → pre-merge
  checks → push → merge into parent.
- **Files < 500 lines**; the view stays < 50 lines.
- **Progress markers:** ❌ not done · ✅ done. Update in place as work completes.

## Pre-Merge Checks (Django backend — run in this order, one at a time)

```bash
# 1. Lint
ruff check .

# 2. Type check
mypy .

# 3. Tests — the specific file(s) for the change
pytest tests/platform/test_me.py

# 4. Full suite — only if step 3 passes
pytest
```

All checks must pass (0 errors, 0 failures) before merging.

---

## Branch Hierarchy

```
develop
└── feature/saas-me-endpoint
    ├── task/saas-me-endpoint-Task1-public-urlconf
    ├── task/saas-me-endpoint-Task2-meview
    ├── task/saas-me-endpoint-Task3-tests
    └── task/saas-me-endpoint-Task4-makefile-docs
```

---

## ❌ Feature — `/me/` Identity Endpoint

Add the SaaS public urlconf, `MeView` (public + tenant mounts), tests, Makefile, docs.

**Branch:** `feature/saas-me-endpoint` — created from `develop`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/saas-me-endpoint
git push -u origin feature/saas-me-endpoint
```

---

### ❌ Task 1 — SaaS public urlconf foundation

**Branch:** `task/saas-me-endpoint-Task1-public-urlconf` — from `feature/saas-me-endpoint`

```bash
git checkout feature/saas-me-endpoint
git pull origin feature/saas-me-endpoint
git checkout -b task/saas-me-endpoint-Task1-public-urlconf
```

See [`02-me-endpoint.md`](./02-me-endpoint.md) §Task 1.

**Commit:**
```bash
git add backend/config/urls_public.py backend/config/urls.py
git commit -m "[TASK] 1 add SaaS public urlconf and fix public route exposure"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-me-endpoint-Task1-public-urlconf
git checkout feature/saas-me-endpoint
git merge task/saas-me-endpoint-Task1-public-urlconf
git push origin feature/saas-me-endpoint
```

---

### ❌ Task 2 — `MeView` + dual mount

**Branch:** `task/saas-me-endpoint-Task2-meview` — from `feature/saas-me-endpoint`

**⚠️ Create only after Task 1 is merged** (the public urlconf must exist).

```bash
git checkout feature/saas-me-endpoint
git pull origin feature/saas-me-endpoint
git checkout -b task/saas-me-endpoint-Task2-meview
```

See [`02-me-endpoint.md`](./02-me-endpoint.md) §Task 2.

**Commit:**
```bash
git add backend/apps/platform/views_me.py backend/config/urls_public.py backend/config/urls.py
git commit -m "[TASK] 2 add MeView with public and tenant mounts"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-me-endpoint-Task2-meview
git checkout feature/saas-me-endpoint
git merge task/saas-me-endpoint-Task2-meview
git push origin feature/saas-me-endpoint
```

---

### ❌ Task 3 — Tests

**Branch:** `task/saas-me-endpoint-Task3-tests` — from `feature/saas-me-endpoint`

**⚠️ Create only after Task 2 is merged** (the endpoint must exist).

```bash
git checkout feature/saas-me-endpoint
git pull origin feature/saas-me-endpoint
git checkout -b task/saas-me-endpoint-Task3-tests
```

See [`02-me-endpoint.md`](./02-me-endpoint.md) §Task 3.

**Commit:**
```bash
git add backend/tests/platform/
git commit -m "[TEST] 3 add tests for /me/ and public-routing regression"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest tests/platform/test_me.py -q
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-me-endpoint-Task3-tests
git checkout feature/saas-me-endpoint
git merge task/saas-me-endpoint-Task3-tests
git push origin feature/saas-me-endpoint
```

---

### ❌ Task 4 — Dev ergonomics + docs

**Branch:** `task/saas-me-endpoint-Task4-makefile-docs` — from `feature/saas-me-endpoint`

```bash
git checkout feature/saas-me-endpoint
git pull origin feature/saas-me-endpoint
git checkout -b task/saas-me-endpoint-Task4-makefile-docs
```

See [`02-me-endpoint.md`](./02-me-endpoint.md) §Task 4.

**Commit:**
```bash
git add backend/Makefile
git commit -m "[TASK] 4 add Makefile and document /me/ endpoint"
```

**Pre-merge checks:**
```bash
ruff check .
mypy .
pytest -q
```

**Push & merge:**
```bash
git push origin task/saas-me-endpoint-Task4-makefile-docs
git checkout feature/saas-me-endpoint
git merge task/saas-me-endpoint-Task4-makefile-docs
git push origin feature/saas-me-endpoint
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
git merge feature/saas-me-endpoint
git push origin develop
```
