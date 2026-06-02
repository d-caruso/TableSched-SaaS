# Implementation Plan — SaaS Frontend: app/index.tsx Routing Entry Point

References:
- Identity endpoint design: [`../me-endpoint-analysis.md`](../me-endpoint-analysis.md)
- Platform-staff check: `TableSched-SaaS/backend/apps/platform/permissions.py` (`IsPlatformStaff`)
- Tenant role model: `TableSched/backend/apps/memberships/models.py` (`StaffMembership`)
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
must be answerable **before any restaurant slug is chosen**. This is served by a new
`GET /api/v1/me/` endpoint mounted on the **public schema** (see `me-endpoint-analysis.md`
for the full rationale, including the chicken-and-egg problem and schema-split design).

`/api/v1/me/` does not exist yet, and neither does the SaaS `config/urls_public.py`
required to mount public-schema routes. Both are prerequisites for the frontend to work.

The existing `useAppConfig()` hook (calling `/api/v1/config/`) is a separate concern and
is left untouched. A new `useMe()` hook calls the correct endpoint.

---

## Branch

`feature/saas-app-index-routing`

---

## Task Summary

Backend tasks (1–3) are tracked on `feature/saas-me-endpoint` — not on this branch.
Frontend tasks (4–5) are on `feature/saas-app-index-routing`, renumbered 1–2 in the
branching strategy doc.

| Task | Title | Branch | Files |
|---|---|---|---|
| 1 | SaaS public-schema URL routing | `feature/saas-me-endpoint` | `backend/config/urls_public.py`, `backend/config/settings.py` |
| 2 | `MeView` backend endpoint | `feature/saas-me-endpoint` | `backend/apps/platform/views.py`, `backend/apps/platform/urls_public.py`, `backend/apps/platform/urls.py` |
| 3 | `MeView` backend tests | `feature/saas-me-endpoint` | `backend/apps/platform/tests/test_me_view.py` |
| 4 (→ FE Task 1) | `useMe` frontend hook | `feature/saas-app-index-routing` | `frontend/lib/api/me.ts` |
| 5 (→ FE Task 2) | `app/index.tsx` + test | `feature/saas-app-index-routing` | `frontend/app/index.tsx`, `frontend/app/__tests__/index.test.tsx` |

---

## Task 1 — SaaS public-schema URL routing

SaaS currently has no `config/urls_public.py`. Without it, `PUBLIC_SCHEMA_URLCONF` falls
through to core's `urls_public.py`, causing any SaaS public-schema route to 404. This
task adds the file and registers it in settings.

**Files:**

- `backend/config/urls_public.py` — new:

```python
from django.urls import path, include

urlpatterns = [
    path("api/v1/", include("apps.platform.urls_public")),
]
```

- `backend/config/settings.py` (or settings base file) — add:

```python
PUBLIC_SCHEMA_URLCONF = "config.urls_public"
```

**Commit:** `[TASK] 1 add SaaS public-schema URL routing`

---

## Task 2 — `MeView` backend endpoint

A single `MeView` mounted in both urlconfs. In the public schema, `StaffMembership`
returns no rows (no tenant context) so `role` is `null`. In a tenant schema, it returns
the membership role for the active tenant. Same view, two mounts — schema boundary is
handled transparently by `django-tenants`.

`/me/` requires `IsAuthenticated` only (not `IsPlatformStaff`) — restaurant staff also
call it and must receive `platformAdmin: false` rather than a 403.

**Files:**

- `backend/apps/platform/views.py` — add `MeView`:

```python
from apps.memberships.models import StaffMembership

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        platform_admin = request.user.groups.filter(name="platform_staff").exists()
        membership = StaffMembership.objects.filter(user=request.user).first()
        return Response({
            "email": request.user.email,
            "platformAdmin": platform_admin,
            "role": membership.role if membership else None,
        })
```

- `backend/apps/platform/urls_public.py` — new (public-schema mount):

```python
from django.urls import path
from .views import MeView

urlpatterns = [
    path("me/", MeView.as_view(), name="me-public"),
]
```

- `backend/apps/platform/urls.py` — add tenant-schema mount:

```python
path("me/", MeView.as_view(), name="me-tenant"),
```

**Commit:** `[TASK] 2 add MeView GET /api/v1/me/ endpoint`

---

## Task 3 — `MeView` backend tests

`apps/platform/tests/test_me_view.py` covering all cases for the public-schema mount:

| Scenario | Expected |
|---|---|
| Unauthenticated | 401 |
| Authenticated, not platform staff, no membership | `{ platformAdmin: false, role: null }` |
| Authenticated, in `platform_staff` group | `{ platformAdmin: true, role: null }` |
| Authenticated, with `StaffMembership` (tenant schema) | correct `role` value |

**Files:**
- `backend/apps/platform/tests/test_me_view.py` — new.

**Commit:** `[TASK] 3 add MeView tests`

---

## Task 4 — `useMe` frontend hook

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

## Task 5 — `app/index.tsx` + test

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
  const { data, isLoading } = useMe();

  if (isLoading) {
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

- `frontend/app/__tests__/index.test.tsx` — new. Three cases:
  - `isLoading: true` → `Spinner` is rendered
  - `platformAdmin: true` → `Redirect` to `/platform/tenants`
  - `platformAdmin: false` → `Redirect` to `/(staff)/dashboard`

  Mocks: `expo-router` (`Redirect` as a View with `testID`, rendering the `href` as
  text content); `@saas/lib/api/me` (`useMe` as `jest.fn()`). Pattern mirrors
  `app/(saas)/platform/__tests__/layout.test.tsx`.

  Redirect destination verified with both `getByTestId('redirect')` (presence) and
  `getByText('<href>')` (correct destination).

  Note: verify `Spinner` is exported from `__mocks__/tamagui.ts` before writing the
  loading-state assertion (`UNSAFE_getByType`).

**Commit:** `[TASK] 2 add app/index.tsx routing entry point and test`

---

## Verification

```bash
# Backend (from backend/)
pytest apps/platform/tests/test_me_view.py

# Frontend (from frontend/)
npm run build
npm run typecheck
npm run lint
npm test -- app/__tests__/index.test.tsx
npm test
```

Manual smoke test:
- Navigate to `/` — spinner appears during `useMe` fetch
- Platform staff user (in `platform_staff` group) → lands on `/platform/tenants`
- Restaurant staff user → lands on `/(staff)/dashboard`, then subject to auth guard
- Unauthenticated → staff layout guard redirects to `/login`
