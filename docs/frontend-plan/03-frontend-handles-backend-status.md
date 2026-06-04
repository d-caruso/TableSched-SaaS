# Implementation Plan — SaaS Frontend: Global Backend Unavailable / Slow Handling

References:
- Core implementation: [`../../TableSched/docs/frontend-plan/32-frontend-handles-backend-status.md`](../../TableSched/docs/frontend-plan/32-frontend-handles-backend-status.md)
- Architecture: [`../ARCHITECTURE_OVERVIEW.md`](../ARCHITECTURE_OVERVIEW.md)

---

## Context

All detection and recovery logic (`networkStatusStore`, `BackendStatusProvider`, `useBackendStatus()`, `BackendStatusBanner`) is implemented entirely in Core and consumed here via the `@core/*` alias (`"tablesched-frontend": "file:../../TableSched/frontend"` in `package.json`; `"@core/*": ["node_modules/tablesched-frontend/*"]` in `tsconfig.json`).

SaaS has exactly two responsibilities:

1. **Wire the provider and banner** into `app/_layout.tsx`. SaaS composes its own root layout independently — Core's `app/_layout.tsx` is not used here.

2. **Extend `useCanWrite()`** in `lib/lifecycle.ts` to return `false` when the backend is unreachable. SaaS already gates every non-ghost, non-skipped `AppButton` through `useCanWrite()` (see `components/ui/AppButton.tsx:24`). One change here propagates the degrade to all write surfaces automatically.

No logic is duplicated from Core.

---

## Branch

`feature/frontend-handles-backend-status` — start after Core's branch is merged to `develop` and `npm install` has been run in `frontend/` to pick up the updated `tablesched-frontend` package.

---

## Modified Files

### `app/_layout.tsx`

**Current lines 19–21** (i18n + auth imports):
```tsx
import { I18nProvider } from '@core/lib/i18n/I18nProvider';
import { ConsentProvider } from '@core/lib/consent/ConsentContext';
import { AuthProvider } from '@core/lib/auth/AuthContext';
```
Add two imports after:
```tsx
import { BackendStatusProvider } from '@core/lib/backendStatus/BackendStatusContext';
import { BackendStatusBanner } from '@core/components/ui/BackendStatusBanner';
```

**Current lines 43–52** (JSX provider tree):
```tsx
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <I18nProvider>
            <AuthProvider>
              <ConsentProvider>
                <Slot />
              </ConsentProvider>
            </AuthProvider>
          </I18nProvider>
        </TamaguiProvider>
```
**Becomes:**
```tsx
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <I18nProvider>
            <AuthProvider>
              <BackendStatusProvider>
                <ConsentProvider>
                  <BackendStatusBanner />
                  <Slot />
                </ConsentProvider>
              </BackendStatusProvider>
            </AuthProvider>
          </I18nProvider>
        </TamaguiProvider>
```

`BackendStatusProvider` sits inside `I18nProvider` because `BackendStatusBanner` calls `useTranslation()`. It sits inside `AuthProvider` because future write-gate checks may consult auth state.

---

### `lib/lifecycle.ts → useCanWrite()`

**Current file** (full, 5 lines of logic):
```ts
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@saas/lib/api/billing';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

const WRITE_ALLOWED_STATUSES = ['active', 'trialing', 'past_due'] as const;

export function useCanWrite(): boolean {
  const { data } = useSubscription();
  if (!data) return true;
  return (WRITE_ALLOWED_STATUSES as readonly string[]).includes(data.status);
}
```

**Becomes:**
```ts
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@saas/lib/api/billing';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';
import { useBackendStatus } from '@core/lib/backendStatus/BackendStatusContext';

const WRITE_ALLOWED_STATUSES = ['active', 'trialing', 'past_due'] as const;

export function useCanWrite(): boolean {
  const { isReachable } = useBackendStatus();
  const { data } = useSubscription();
  if (!isReachable) return false;
  if (!data) return true;
  return (WRITE_ALLOWED_STATUSES as readonly string[]).includes(data.status);
}
```

`!isReachable` is checked before subscription status so a down backend always wins, regardless of plan state. `installSuspensionErrorHandler` and the rest of the file are unchanged.

---

## Surfaces Covered

`components/ui/AppButton.tsx` in SaaS (line 24) already does:
```ts
const writeGated = !skipWriteGate && !canWrite && variant !== 'ghost';
```

Because `useCanWrite()` now returns `false` when `!isReachable`, every non-ghost, non-skipped `AppButton` in SaaS is disabled automatically. No per-screen edits are needed.

| Surface | Write operations gated |
|---------|------------------------|
| `(saas)/billing/upgrade.tsx` | Plan upgrade |
| `(saas)/settings/api-keys.tsx` | Create key, revoke key |
| `(saas)/platform/tenants/[id]/subscription.tsx` | Subscription plan changes |
| `(saas)/platform/tenants/[id]/lifecycle.tsx` | Suspend, reactivate |
| `(staff)/dashboard/settings/index.tsx` | Save settings |
| `(staff)/onboarding/index.tsx` | Wizard submit |

Buttons already marked `skipWriteGate` (e.g. `api-keys.tsx:69`, `api-keys.tsx:72`, `api-keys.tsx:101`) are navigation or copy actions — correctly excluded.

---

## Pre-Merge Checks (run from `frontend/`, one at a time)

```bash
npm install                  # pick up updated tablesched-frontend from Core
npm run build
npm run typecheck
npm run lint
npm test -- <changed files>
npm test
```
