# SaaS UX/UI Improvements — Phase 2: User-Facing Fixes

## Context

Depends on Phase 1 (`ux-ui-phase1-foundation.md`) being merged first. After Phase 1, all
SaaS colours, weights, radii, cards, and field labels conform to the core token system.

This document covers every user-visible gap identified in the SaaS UX/UI audit
(`docs/UX-critique-report.md`, sections 2.6–2.10 and 3): platform-admin layout, focus-ring
accessibility, page-shell max-width adoption, modal consolidation, quota-progress
standardisation, tab/sidebar alignment, i18n completeness, and the `AppButton` refactor.

No new feature work — only the documented gaps. **No new tokens or constants** are created;
SaaS continues to consume `@core`. Where this phase reuses a core *component* (`StatusBadge`,
`ConfirmDialog`, `IconButton`, `FilterTabs`, `ResponsiveShell`, core `AppButton`), import it
from `@core/components/...` rather than rebuilding.

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

### 1b. Replace the local `StatusBadge` with the core pill — `tenants/index.tsx:20–30`

The local `StatusBadge` (lines 20–30) is bare coloured text. Replace it with core
`StatusBadge` (a bg+fg pill). If the core `StatusBadge` status union does not include the
SaaS subscription statuses (`active`, `trialing`, `past_due`, `suspended`, `cancelled`),
render a thin local pill that **reuses the core pill shape and semantic tokens**
(`$success`/`$brand`/`$warning`/`$danger`/`$colorSubtle` backgrounds at subtle opacity),
not the built-in ramps. Remove the `STATUS_COLORS` map left over from Phase 1.

```tsx
import { StatusBadge } from '@core/components/ui/StatusBadge';
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
| modal overlays (`ConfirmDestructiveModal.tsx`, `api-keys.tsx`) | superseded by §4 (`ConfirmDialog` supplies focus) |

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

## 4. Modal consolidation → core `ConfirmDialog` (audit §2.6)

Two divergent modal mechanisms exist with two scrim alphas:
- `components/platform/ConfirmDestructiveModal.tsx` — RN `Modal` + `rgba(0,0,0,0.5)`.
- `app/(saas)/settings/api-keys.tsx:35–43,77–85` — `position:absolute` overlays + `rgba(0,0,0,0.6)`.

Migrate both onto the core `ConfirmDialog` (per the core component inventory). Where a
modal carries custom body content (the slug-typed confirmation in `ConfirmDestructiveModal`,
the created-key reveal in `api-keys.tsx`), pass it as children/body to the shared dialog
rather than rebuilding the surface.

- Single, consistent scrim (use whatever `ConfirmDialog` provides; do not hand-roll
  `rgba(...)`).
- Modal content radius `$5` (already set in Phase 1 §7 for the interim state).
- `ConfirmDialog` supplies focus handling, satisfying §2 for these surfaces.

If `ConfirmDialog` cannot host the API-key reveal (read-only display + copy action), keep a
single SaaS modal component built on the same dialog primitive — do not keep two.

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

Align the bespoke tab visuals to the core tab language. Either:
- adopt the core `FilterTabs` / `SegmentedControl` active-state treatment
  (`2px $brand` bottom border, `$brand` active label), **or**
- if the pill-box treatment is a deliberate floor-plan affordance, add a one-line note in
  `docs/UX-critique-report.md` recording the intentional divergence.

Replace the raw `minWidth`/`height` pixel values (106/54/126) with token-based sizing or a
named constant if they remain.

### 6b. `PlatformSidebarShell` — `components/platform/PlatformSidebarShell.tsx:19`

Sidebar `width={200}` diverges from core `ResponsiveShell`'s `260`. Either set it to `260`
or reuse `ResponsiveShell` directly (preferred — it also gives the responsive narrow-screen
collapse for free).

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
import { AppButton as CoreAppButton } from '@core/components/ui/AppButton';
import { useCanWrite } from '@saas/lib/lifecycle';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof CoreAppButton> & { skipWriteGate?: boolean };

export function AppButton({ skipWriteGate = false, variant = 'primary', ...props }: Props) {
  const canWrite = useCanWrite();
  const writeGated = !skipWriteGate && !canWrite && variant !== 'ghost';
  return <CoreAppButton variant={variant} {...props} disabled={props.disabled || props.loading || writeGated} />;
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
- Destructive-confirm and API-key modals render via the shared dialog, single scrim,
  `$5` radius; focus is trapped.

**Billing:**
- Quota bars use one consistent brand→warning→danger treatment.
- Past-due state renders as a danger callout with a working "update payment" button (live
  even in restricted state).

**Floor / sidebar:**
- `RoomTabs` matches the core tab treatment (or the divergence is documented).
- Platform sidebar is 260px / uses `ResponsiveShell`.

**Booking `StepDone`:**
- Success/error states use icon components (no literal glyphs); no English leaks under a
  non-English locale.

**Write-gate:**
- In a suspended/cancelled tenant, write `AppButton`s are disabled at `opacity 0.4`;
  `ghost` and `skipWriteGate` buttons remain interactive.
</content>
