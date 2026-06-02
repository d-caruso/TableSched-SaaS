# Implementation Plan — SaaS Frontend: app/index.tsx Routing Entry Point

References:
- Identity endpoint design: [`../me-endpoint-analysis.md`](../me-endpoint-analysis.md)
- Existing platform layout guard: `frontend/app/(saas)/platform/_layout.tsx`
- Existing staff layout guard: `frontend/app/(staff)/_layout.tsx` (core)
- Branching strategy: [`02-saas-app-index-routing-branching-strategy.md`](./02-saas-app-index-routing-branching-strategy.md)

---

## Context

The SaaS frontend (`TableSched-SaaS/frontend`) has no `app/index.tsx`. Without it, Expo
Router has no root-level routing decision for the combined Core+SaaS deployment. The
intended post-login flow is:

- platform staff      → `/platform/tenants`
- restaurant staff    → `/(staff)/dashboard` (then restaurant selection)
- unauthenticated     → `/login` (handled by the staff layout guard already in place)

The routing decision requires one authenticated, tenant-free fact — `platformAdmin` — that
must be answerable **before any restaurant slug is chosen**. It is read from
`GET /api/v1/me/` (see `me-endpoint-analysis.md` for the full rationale).

The existing `useAppConfig()` hook (calling `/api/v1/config/`) is a separate concern and
is left untouched. A new `useMe()` hook calls the correct endpoint.

---

## Branch

`feature/saas-app-index-routing`

---

## Task Summary

| Task | Title | Files |
|---|---|---|
| 1 | `useMe` frontend hook | `frontend/lib/api/me.ts` |
| 2 | `app/index.tsx` + test | `frontend/app/index.tsx`, `frontend/app/__tests__/index.test.tsx` |

---

## Task 1 — `useMe` frontend hook

New hook calling `GET /api/v1/me/`. Follows the same pattern as `useAppConfig()` in
`lib/api/platform.ts` (same `apiRequest` utility, same `staleTime`).

**Files:**

- `frontend/lib/api/me.ts` — new:

```ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

export type Me = {
  email: string;
  platformAdmin: boolean;
  role: 'manager' | 'staff' | 'viewer' | null;
};

export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: () => apiRequest<Me>('/api/v1/me/'),
    staleTime: 5 * 60_000,
  });
}
```

**Commit:** `[TASK] 1 add useMe hook`

---

## Task 2 — `app/index.tsx` + test

The routing entry point and its colocated test. Spinner pattern mirrors
`app/(staff)/_layout.tsx` (core). Auth guards remain in their destination layouts —
this file routes only.

**Files:**

- `frontend/app/index.tsx` — new:

```tsx
import { Redirect } from 'expo-router';
import { Spinner, YStack } from 'tamagui';
import { useMe } from '@saas/lib/api/me';

export default function Index() {
  const { data, isPending } = useMe();

  if (isPending) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (data?.platformAdmin === true) {
    return <Redirect href="/platform/tenants" />;
  }

  return <Redirect href="/(staff)/dashboard" />;
}
```

- `frontend/app/__tests__/index.test.tsx` — new. Four cases:
  - `isPending: true` → `Spinner` is rendered
  - `platformAdmin: true` → `Redirect` to `/platform/tenants`
  - `platformAdmin: false` → `Redirect` to `/(staff)/dashboard`
  - `isPending: false`, `data: undefined` (error / unauthenticated) → `Redirect` to
    `/(staff)/dashboard` (staff auth guard then redirects to `/login`)

  Mocks: `expo-router` (`Redirect` as a View with `testID`, rendering the `href` as
  text content); `@saas/lib/api/me` (`useMe` as `jest.fn()`). Pattern mirrors
  `app/(saas)/platform/__tests__/layout.test.tsx`.

  Redirect destination verified with both `getByTestId('redirect')` (presence) and
  `getByText('<href>')` (correct destination).

  Fixture note: `app/index.tsx` calls the public-schema `/api/v1/me/`; `role` is always
  `null` there (no tenant context). Both test fixtures must use `role: null`.

**Commit:** `[TASK] 2 add app/index.tsx routing entry point and test`

---

## Verification

```bash
# From frontend/
npm run build
npm run typecheck
npm run lint
npm test -- app/__tests__/index.test.tsx
npm test
```

Manual smoke test:
- Navigate to `/` — spinner appears during `useMe` fetch
- Platform staff user → lands on `/platform/tenants`
- Restaurant staff user → lands on `/(staff)/dashboard`, then subject to auth guard
- Unauthenticated → staff layout guard redirects to `/login`
