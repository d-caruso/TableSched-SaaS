# SaaS UX/UI Improvements — Phase 2: User-Facing Fixes

## Context

Depends on Phase 1 (`ux-ui-phase1-foundation.md`) being merged first. After Phase 1, all
SaaS colours, weights, radii, cards, and field labels conform to the core token system.

This document covers every user-visible gap identified in the SaaS UX/UI audit
(`docs/UX-critique-report.md`, sections 2.6–2.10 and 3): platform-admin layout, focus-ring
accessibility, page-shell max-width adoption, modal consolidation, quota-progress
standardisation, tab/sidebar alignment, i18n completeness, and the `AppButton` refactor.

No new feature work — only the documented gaps. **No new tokens or constants** are created;
SaaS continues to consume `@core`. The core *components* reused are `ResponsiveShell`, core
`AppButton`, and `BookingFormFlow` (imported from `@core/components/...`). Core `StatusBadge`
and `ConfirmDialog` are not reusable here (see §1b, §4), so the status pill and dialogs are
built locally on the Tamagui `Sheet` primitive with semantic tokens.

> Baseline reference: `docs/TAMAGUI_TOKENS.md` → `~/Projects/TableSched/docs/TAMAGUI_TOKENS.md`.

All work is in `frontend/`.

---

## 1. Platform admin — tenant list surface & status pills (audit §2.7, §3.1)

### 1a. Constrain and contain the tenant list — `app/(saas)/platform/tenants/index.tsx`

The list renders bare `XStack` rows inside an unconstrained `YStack flex={1} padding="$3"`.
On wide admin viewports it stretches edge-to-edge.

- Wrap the list region in `CARD_STYLE` (from `@core/constants/styles`) and constrain the
  screen content with a max-width (see §3 for the page-shell pattern).
- Keep the `FlatList` for virtualisation; the `CARD_STYLE` wrapper goes on the container
  around it, not per row.

### 1b. Render the subscription-status pill — `tenants/index.tsx`

Core `StatusBadge` is hardwired to `BookingStatus` and does not cover the SaaS subscription
statuses (`active`, `trialing`, `past_due`, `suspended`, `cancelled`), so render a thin local
`StatusBadge` pill that mirrors the core pill shape: solid semantic-token backgrounds
(`STATUS_PILL_BG` → `$success`/`$brand`/`$warning`/`$danger`/`$colorSubtle`) with `$background`
foreground text — no built-in ramps. The `STATUS_COLORS` map left over from Phase 1 is removed.

```tsx
const STATUS_PILL_BG = {
  active: '$success', trialing: '$brand', past_due: '$warning',
  suspended: '$danger', cancelled: '$colorSubtle',
};
// ...
<StatusBadge status={sub.status} label={t(`saas:platform.subscriptionStatus.${sub.status}`)} />
```

(The translated label comes from §7.)

### 1c. Anchor the filter/sort controls — `tenants/index.tsx`

The sort and status-filter ghost buttons float in a bare `XStack` above the list. Move
them into a labelled toolbar strip consistent with the core `FilterTabs` layer (white
`$background`, `1px $borderColor` bottom border), separating controls from content.

---

## 2. Focus rings on custom interactive elements (audit §2.9)

Only `AppButton` carries a focus ring today. Spread the core `FOCUS_STYLE` (2px `$brand`
outline) onto every keyboard-focusable custom element that has `onPress`/`role`.

```tsx
import { FOCUS_STYLE } from '@core/constants/styles';
// on each interactive Stack:
focusStyle={FOCUS_STYLE}
```

Apply to:

| File | Elements |
|------|----------|
| `components/floor/RoomTabs.tsx` | both `YStack`s (room tab `:26–43`, add-room `:54–68`) |
| `components/billing/PastDueBanner.tsx` | the `onPress` `Text` `:36` — see §5 (becomes an `AppButton`, which already has focus) |
| `app/(saas)/platform/tenants/index.tsx` | the tappable `TenantRow` (if the row itself is pressable) |
| modal overlays (`ConfirmDestructiveModal.tsx`, `api-keys.tsx`) | superseded by §4 — the dialog actions are `AppButton`s, which already carry the focus ring |

Also ensure tappable text meets the 44×44 minimum: where a bare `Text` is the touch
target, wrap it in core `IconButton` (icon-only actions) or give it adequate padding /
`minHeight`. `PastDueBanner` (§5) and the glyph rows (§7) are the main offenders.

---

## 3. Page-shell + max-width adoption (audit §3.4)

No SaaS screen imports a max-width constant; screens render full-bleed `flex={1}` with
`padding="$3"`, so content sprawls on wide web viewports.

Adopt the core page-shell pattern on SaaS screens:

```tsx
import { PAGE_MAX_WIDTH } from '@core/constants/styles'; // or STAFF_MAX_WIDTH

<ScrollView>
  <YStack alignItems="center" paddingVertical="$6" paddingHorizontal="$4">
    <YStack maxWidth={STAFF_MAX_WIDTH} width="100%" gap="$4">
      {/* screen content */}
    </YStack>
  </YStack>
</ScrollView>
```

| Screen | Constant |
|--------|----------|
| `app/(saas)/billing/index.tsx`, `billing/upgrade.tsx` | `PAGE_MAX_WIDTH` (520) |
| `app/(saas)/settings/api-keys.tsx` | `STAFF_MAX_WIDTH` (600) |
| `app/(saas)/platform/tenants/index.tsx`, `tenants/[id]/index.tsx`, `subscription.tsx`, `lifecycle.tsx` | `STAFF_MAX_WIDTH` (600) |
| `app/(saas)/platform/sms/{index,delivery-log,routing}.tsx`, `action-log/index.tsx` | `STAFF_MAX_WIDTH` (600) |

> Platform admin tables are dense; `STAFF_MAX_WIDTH` keeps columns scannable. Do not
> introduce a new width value — if 600 is too narrow for a wide table, raise a
> `PLATFORM_MAX_WIDTH` constant against **core**, not locally.

---

## 4. Modal consolidation → shared `Sheet` dialog (audit §2.6)

Two divergent modal mechanisms exist with two scrim alphas:
- `components/platform/ConfirmDestructiveModal.tsx` — RN `Modal` + `rgba(0,0,0,0.5)`.
- `app/(saas)/settings/api-keys.tsx:35–43,77–85` — `position:absolute` overlays + `rgba(0,0,0,0.6)`.

Core `ConfirmDialog` has no body slot for the custom content these modals carry (the
slug-typed confirmation in `ConfirmDestructiveModal`, the created-key reveal in `api-keys.tsx`),
so build both on the shared Tamagui `Sheet` dialog primitive instead — one dialog surface, not two.

- Single, consistent scrim via `Sheet.Overlay`; no hand-rolled `rgba(...)`.
- Modal content radius `$5` (already set in Phase 1 §7).
- `role="dialog"` + `modal` on the `Sheet`; the dialog's actions are `AppButton`s, which
  carry the §2 focus ring. (The `Sheet` primitive does not implement a JS focus-trap; that is
  not required by §2, which covers focus *rings* on interactive elements.)

---

## 5. Quota progress & past-due callout standardisation (audit §3.2)

### 5a. One progress treatment — `SmsQuotaBlock.tsx`, `BookingsQuotaChip.tsx`

Both bars currently use different palettes. Standardise: neutral track + `$brand` fill,
escalating to `$warning` then `$danger` as usage approaches the cap. Extract the shared
fill/track logic so both components use the same helper.

### 5b. `PastDueBanner.tsx` becomes a real alert

A past-due state is payment-blocking. Replace the soft text-link treatment with a proper
danger/warning callout and a real CTA:

```tsx
// Before: $orange* background + onPress Text link
// After: $dangerSubtle / $dangerBorder callout + AppButton CTA
<AppButton variant="primary" skipWriteGate onPress={handleUpdatePayment}>
  {t('saas:lifecycle.updatePayment')}
</AppButton>
```

`skipWriteGate` is required — the "update payment" action must stay live precisely when the
tenant is in a restricted state.

---

## 6. Tab & sidebar alignment (audit §2.7)

### 6a. `RoomTabs` — `components/floor/RoomTabs.tsx`

The pill-box tab treatment is a deliberate floor-plan affordance, so it keeps its visual
language rather than adopting core `FilterTabs`/`SegmentedControl`; the intentional divergence
is recorded in `docs/UX-critique-report.md`. The raw `minWidth`/`height` pixel values are
replaced with named constants (`ROOM_TAB_MIN_WIDTH`, `ADD_ROOM_MIN_WIDTH`, `ROOM_TAB_HEIGHT`),
and `FOCUS_STYLE` is spread on both interactive `YStack`s (§2).

### 6b. `PlatformSidebarShell` — `components/platform/PlatformSidebarShell.tsx:19`

The sidebar reuses core `ResponsiveShell` directly (260px), which also provides the
responsive narrow-screen collapse.

---

## 7. i18n completeness (audit §2.10)

| File | Line | Fix |
|------|------|-----|
| `app/(saas)/platform/tenants/index.tsx` | 27 | render `t('saas:platform.subscriptionStatus.<status>')`, not the raw `{status}` slug |
| `app/(saas)/platform/sms/index.tsx` | 30 | render a translated provider label, not the raw value via `textTransform="capitalize"` |
| `components/booking/steps/StepDone.tsx` | 100, 112 | remove inline English `defaultValue` strings; rely on the catalog keys |
| `components/booking/steps/StepDone.tsx` | 93 | replace literal `✓` glyph with an icon component |
| `app/(saas)/platform/action-log/index.tsx` | 40 | replace literal `→` glyph with an icon component |

### i18n key additions — `saas` namespace (en / it / de)

Add a `subscriptionStatus` map (active / trialing / past_due / suspended / cancelled) and a
provider-label map to all three SaaS locale files. Run the existing i18n parity tests
(`npm test -- <i18n parity test>`) to confirm no missing keys.

---

## 8. `AppButton` refactor — wrap core instead of copy (audit §2.7)

`components/ui/AppButton.tsx` is a full copy of `@core/components/ui/AppButton` plus a
`useCanWrite` write-gate. The copy will drift from core. Refactor it to a thin wrapper:

```tsx
import type { ComponentProps } from 'react';
import { AppButton as CoreAppButton } from '@core/components/ui/AppButton';
import { useCanWrite } from '@saas/lib/lifecycle';

type AppButtonProps = ComponentProps<typeof CoreAppButton> & { skipWriteGate?: boolean };

export function AppButton({ variant = 'primary', skipWriteGate = false, disabled, ...props }: AppButtonProps) {
  const canWrite = useCanWrite();
  const writeGated = !skipWriteGate && !canWrite && variant !== 'ghost';
  return <CoreAppButton variant={variant} disabled={disabled || writeGated} {...props} />;
}
```

- All variant/focus/sizing/hover behaviour is delegated to core — no duplicated bg/text/
  hover/focus logic.
- Preserve the existing write-gate semantics exactly: `ghost` is never gated;
  `skipWriteGate` opts out.
- Keep `docs/TAMAGUI_TOKENS.md`'s "SaaS-specific UX additions" section accurate after the
  refactor (remove the "currently duplicates core" caveat).

### Tests

Extend `components/ui/__tests__/AppButton.test.tsx`:
- gated when `canWrite=false` and `variant!=='ghost'` and `skipWriteGate=false`;
- not gated for `ghost`, or when `skipWriteGate`, or when `canWrite=true`;
- delegates `variant`/`onPress`/`loading` to core.

---

## Verification

Run per changed package, in order, one at a time:

1. `npm run build`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test -- <specific test file>` for each changed component; then `npm test` on the package

Visual checks (run dev server):

**Platform admin:**
- Tenant list is centred at `STAFF_MAX_WIDTH`, wrapped in a card; status shows as a
  coloured pill (semantic tokens), label translated.
- Filter/sort controls sit in a bordered toolbar strip.
- Keyboard focus shows a brand outline on rows/tabs.

**Modals:**
- Destructive-confirm and API-key modals render via the shared `Sheet` dialog (`role="dialog"`,
  single scrim, `$5` radius); dialog actions show the brand focus ring (no JS focus-trap).

**Billing:**
- Quota bars use one consistent brand→warning→danger treatment.
- Past-due state renders as a danger callout with a working "update payment" button (live
  even in restricted state).

**Floor / sidebar:**
- `RoomTabs` keeps its pill-box treatment (intentional divergence documented); focus ring on tabs.
- Platform sidebar uses `ResponsiveShell` (260px).

**Booking `StepDone`:**
- Success/error states use icon components (no literal glyphs); no English leaks under a
  non-English locale.

**Write-gate:**
- In a suspended/cancelled tenant, write `AppButton`s are disabled at `opacity 0.4`;
  `ghost` and `skipWriteGate` buttons remain interactive.
</content>
