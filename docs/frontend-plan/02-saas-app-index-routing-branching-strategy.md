# Branching Strategy — SaaS Frontend: app/index.tsx Routing Entry Point

References:
- Implementation plan: [`02-saas-app-index-routing.md`](./02-saas-app-index-routing.md)
- Identity endpoint design: [`../me-endpoint-analysis.md`](../me-endpoint-analysis.md)

---

## Global Rules

- **`/api/v1/me/` must be deployed before frontend tasks** — the hook calls a real
  endpoint; backend is a prerequisite tracked separately.
- **English-only fixture data** in tests; **Tamagui primitives only in production code**
  (no RN `View`/`Text`/`Pressable` in components); test mocks may use RN primitives
  directly (required by RNTL — same pattern as existing tests); i18n keys camelCase
  under the `saas:` namespace.
- **Each task branch lifecycle:** create from parent → implement → commit → pre-merge
  checks → push → merge into parent.
- **Progress markers:** ❌ not done · ✅ done. Update in place as work completes.

## Pre-Merge Checks (run from `frontend/`, one at a time)

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
└── feature/saas-app-index-routing
    ├── task/saas-app-index-routing-Task1-use-me-hook
    └── task/saas-app-index-routing-Task2-app-index
```

---

## ✅ Feature branch setup

**⚠️ Create this branch from `develop` before starting any task.**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/saas-app-index-routing
git push -u origin feature/saas-app-index-routing
```

---

### ✅ Task 1 — `useMe` frontend hook

New `lib/api/me.ts` hook. Mirrors `useAppConfig()` pattern; verify `apiRequest` import
path from `lib/api/platform.ts` before writing.

**Branch:** `task/saas-app-index-routing-Task1-use-me-hook` — from `feature/saas-app-index-routing`

```bash
git checkout feature/saas-app-index-routing
git pull origin feature/saas-app-index-routing
git checkout -b task/saas-app-index-routing-Task1-use-me-hook
```

See [`02-saas-app-index-routing.md`](./02-saas-app-index-routing.md) §Task 4.

**i18n rule:** No user-facing strings.

**Commit:**
```bash
git add frontend/lib/api/me.ts
git commit -m "[TASK] 1 add useMe hook"
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
git push origin task/saas-app-index-routing-Task1-use-me-hook
git checkout feature/saas-app-index-routing
git merge task/saas-app-index-routing-Task1-use-me-hook
git push origin feature/saas-app-index-routing
```

---

### ✅ Task 2 — `app/index.tsx` + test

Routing entry point and its colocated test. Verify `Spinner` is in `__mocks__/tamagui.ts`
before writing the loading-state assertion.

**Branch:** `task/saas-app-index-routing-Task2-app-index` — from `feature/saas-app-index-routing`

**⚠️ Create only after Task 1 is merged.**

```bash
git checkout feature/saas-app-index-routing
git pull origin feature/saas-app-index-routing
git checkout -b task/saas-app-index-routing-Task2-app-index
```

See [`02-saas-app-index-routing.md`](./02-saas-app-index-routing.md) §Task 5.

**i18n rule:** No user-facing strings.

**Commit:**
```bash
git add frontend/app/index.tsx frontend/app/__tests__/index.test.tsx
git commit -m "[TASK] 2 add app/index.tsx routing entry point and test"
```

**Pre-merge checks:**
```bash
npm run build
npm run typecheck
npm run lint
npm test -- app/__tests__/index.test.tsx
npm test
```

**Push & merge:**
```bash
git push origin task/saas-app-index-routing-Task2-app-index
git checkout feature/saas-app-index-routing
git merge task/saas-app-index-routing-Task2-app-index
git push origin feature/saas-app-index-routing
```

---

## ❌ Feature complete — merge into develop (pending explicit confirmation)

All tasks (1–2) complete. Run the full checklist one final time:

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

All checks must pass. Then — with explicit confirmation:

```bash
git checkout develop
git merge feature/saas-app-index-routing
git push origin develop
```
