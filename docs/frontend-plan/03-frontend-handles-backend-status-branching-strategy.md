# Branching Strategy — SaaS Frontend: Global Backend Unavailable / Slow Handling

References:
- Implementation plan: [`03-frontend-handles-backend-status.md`](./03-frontend-handles-backend-status.md)
- Core precedent: `TableSched/docs/frontend-plan/32-frontend-handles-backend-status-branching-strategy.md`
- Branching rules: [`../../BRANCHING_STRATEGY.md`](../../BRANCHING_STRATEGY.md)

---

## Global Rules

- **Core must be merged first.** This branch starts only after
  `feature/frontend-handles-backend-status` is merged into Core `develop` and `npm install` has been
  run in `frontend/` to pick up the updated `tablesched-frontend` package.
- **No logic duplicated from Core.** `BackendStatusProvider`, `useBackendStatus()`, and
  `BackendStatusBanner` are imported from `@core/*` — never re-implemented here.
- **Tamagui primitives only** in any modified component (no RN `View`/`Text`/`Pressable`);
  i18n keys camelCase.
- **English-only test data** (e.g. `"Restaurant X"`, never `"Ristorante X"`).
- **Each task branch lifecycle:** create from parent → implement → commit → pre-merge checks
  → push → merge into parent.
- **Progress markers:** ❌ not done · ✅ done. Update in place as work completes.

## Pre-Merge Checks (run from `frontend/`, one at a time)

```bash
# 0. Install — pick up updated Core package
npm install

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
└── feature/frontend-handles-backend-status
    ├── task/frontend-handles-backend-status-Task1-layout-wiring
    └── task/frontend-handles-backend-status-Task2-write-gate
```

---

## ❌ Feature branch setup

**⚠️ Create this branch from `develop` before starting any task. Ensure Core's
`feature/frontend-handles-backend-status` is already merged to Core `develop` and `npm install`
has been run.**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/frontend-handles-backend-status
git push -u origin feature/frontend-handles-backend-status
```

---

### ❌ Task 1 — Root layout wiring

Wire `BackendStatusProvider` and `BackendStatusBanner` (both imported from `@core`) into
`app/_layout.tsx` so the banner is visible in the SaaS app.

**Branch:** `task/frontend-handles-backend-status-Task1-layout-wiring` — from `feature/frontend-handles-backend-status`

```bash
git checkout feature/frontend-handles-backend-status
git pull origin feature/frontend-handles-backend-status
git checkout -b task/frontend-handles-backend-status-Task1-layout-wiring
```

See [`03-frontend-handles-backend-status.md`](./03-frontend-handles-backend-status.md) §Modified Files — `app/_layout.tsx`.

**i18n rule:** No new strings in this task. Banner text comes from Core locale files.

**Commit:**
```bash
git add frontend/app/_layout.tsx
git commit -m "[TASK] wire BackendStatusProvider and BackendStatusBanner into SaaS root layout"
```

**Pre-merge checks:**
```bash
npm install
npm run build
npm run typecheck
npm run lint
npm test
```

**Push & merge:**
```bash
git push origin task/frontend-handles-backend-status-Task1-layout-wiring
git checkout feature/frontend-handles-backend-status
git merge task/frontend-handles-backend-status-Task1-layout-wiring
git push origin feature/frontend-handles-backend-status
```

---

### ❌ Task 2 — Write-gate extension

Extend `useCanWrite()` in `lib/lifecycle.ts` to return `false` when `!isReachable`. This
propagates the backend-down degrade through the existing SaaS `AppButton` write-gate to every
write surface automatically.

**Branch:** `task/frontend-handles-backend-status-Task2-write-gate` — from `feature/frontend-handles-backend-status`

**⚠️ Create only after Task 1 is merged.**

```bash
git checkout feature/frontend-handles-backend-status
git pull origin feature/frontend-handles-backend-status
git checkout -b task/frontend-handles-backend-status-Task2-write-gate
```

See [`03-frontend-handles-backend-status.md`](./03-frontend-handles-backend-status.md) §Modified Files — `lib/lifecycle.ts`.

**i18n rule:** No new strings in this task.

**Commit:**
```bash
git add frontend/lib/lifecycle.ts
git commit -m "[TASK] extend useCanWrite to return false when backend is unreachable"
```

**Pre-merge checks:**
```bash
npm install
npm run build
npm run typecheck
npm run lint
npm test -- frontend/lib/__tests__/lifecycle.test.ts
npm test
```

**Push & merge:**
```bash
git push origin task/frontend-handles-backend-status-Task2-write-gate
git checkout feature/frontend-handles-backend-status
git merge task/frontend-handles-backend-status-Task2-write-gate
git push origin feature/frontend-handles-backend-status
```

---

## ❌ Feature complete — merge into develop

Both tasks (1–2) complete. Run the full checklist one final time from `frontend/`:

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm test
```

All checks must pass. Then:

```bash
git checkout develop
git merge feature/frontend-handles-backend-status
git push origin develop
```
