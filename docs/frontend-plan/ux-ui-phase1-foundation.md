# SaaS UX/UI Improvements — Phase 1: Token & System Conformance

## Context

The SaaS UX/UI audit (`docs/UX-critique-report.md`) identified systematic deviations from
the core TableSched design system: Tamagui built-in colour ramps bypassing the semantic
palette (13 files), raw `fontWeight="600"/"700"` strings instead of the `$7` weight token
(28 files), hand-rebuilt card surfaces and field labels instead of the shared
`CARD_STYLE` / `FIELD_LABEL_STYLE` constants, and a handful of off-scale radii.

This document covers **Phase 1 only** — mechanical conformance. No behavioural changes,
no user-visible UX restructuring. Every change here is either invisible to the user or a
near-pixel-identical substitution (the only visible shifts are colour values moving onto
the correct semantic token, and bold weights actually rendering bold).

Phase 2 (`ux-ui-phase2-improvements.md`) covers the UX-visible corrections (a11y, layout,
i18n, component consolidation) and depends on this phase landing first.

**No new tokens or constants are created in this phase.** Unlike core's Phase 1 (which
created `$dangerText`, `FIELD_LABEL_STYLE`, `PAGE_MAX_WIDTH`, and the status palette), the
SaaS module already inherits all of these from `@core/constants/styles` and
`@core/constants/palette` via the `@core/*` path alias. Phase 1 is purely about
*consuming* those existing tokens/constants where SaaS code currently improvises.

> Baseline reference: `docs/TAMAGUI_TOKENS.md` → `~/Projects/TableSched/docs/TAMAGUI_TOKENS.md`.
> If a value is not in the core reference, it does not belong in SaaS code.

All work is in `frontend/`.

---

## 1. No token / constant additions

This phase adds nothing to `tamagui.config.ts`, no palette entries, and no new style
constants. Every replacement below references a token or constant that **already exists**
in core and is already importable from SaaS:

- Colour tokens: `$brand`, `$brandSubtle`, `$danger`, `$dangerText`, `$dangerSubtle`,
  `$dangerBorder`, `$success`, `$warning`, `$colorSubtle`, `$placeholderColor`, `$background`.
- Style constants (from `@core/constants/styles`): `CARD_STYLE`, `FIELD_LABEL_STYLE`.

If a needed value is missing from core, **stop** — do not define it locally; raise it
against core first.

---

## 2. Built-in colour ramps → semantic tokens (audit §2.1)

The core rule forbids Tamagui built-in ramps (`$red9`, `$orange9`, `$blue9`, `$green9`,
`$gray9`, `$color10`, …). Replace every occurrence with the semantic equivalent. The
mapping is uniform across the module:

| Found (built-in) | Replace with (semantic) | Context |
|------------------|-------------------------|---------|
| `$red9` (background) | `$danger` | banner/badge backgrounds |
| `$red2`/`$red3` (background) | `$dangerSubtle` | error/alert backgrounds |
| `$red6` (border) | `$dangerBorder` | error/alert borders |
| `$red9`/`$red10`/`$red11` (text) | `$dangerText` | error/status text on white |
| `$orange2`/`$orange3` (background) | `$dangerSubtle` (or `$warning` bg) | warning callout bg |
| `$orange6` (border) | `$dangerBorder` | warning callout border |
| `$orange9`/`$orange10`/`$orange11` | `$warning` | warning text / fills |
| `$blue2` (background) | `$brandSubtle` | info/brand callout bg |
| `$blue5`/`$blue9` | `$brand` | progress track/fill, info text |
| `$blue10` (text) | `$brand` | info text |
| `$green5`/`$green9` | `$success` | positive track/fill |
| `$gray9` | `$colorSubtle` | neutral status |
| `$color10` | `$colorSubtle` / `$placeholderColor` | secondary/muted text |
| `color="white"` | `color="$background"` | text on coloured fill |

### Files and lines

| File | Lines | Notes |
|------|-------|-------|
| `components/billing/BookingsQuotaChip.tsx` | 13–28, 66 | `VARIANT_COLORS`/`TRACK_COLORS`/`FILL_COLORS` maps → `$colorSubtle`/`$warning`/`$danger` (text), `$success`/`$warning`/`$danger` (track+fill); error text at `:66` → `$dangerText` |
| `components/billing/SmsQuotaBlock.tsx` | 27, 57, 61, 65, 70, 73 | muted text `$color10`→`$placeholderColor`; progress `$blue5`→neutral/`$brand` track, `$blue9`→`$brand` fill; overage `$orange9`/`$orange10`→`$warning` |
| `components/billing/PastDueBanner.tsx` | 24, 26, 33, 38 | `$orange3`/`$orange6`/`$orange11` → `$dangerSubtle`/`$dangerBorder`/`$warning` (callout restructure happens in Phase 2 §5) |
| `components/platform/ImpersonationBanner.tsx` | 22, 28 | `$red9`→`$danger`; `color="white"`→`$background` |
| `components/lifecycle/SuspendedShell.tsx` | 24, 26, 32 | `$red3`/`$red6`/`$red11` → `$dangerSubtle`/`$dangerBorder`/`$dangerText` |
| `components/booking/BookingFormFlow.tsx` | 21, 27 | `$red2`→`$dangerSubtle`; `$red11`→`$dangerText` |
| `components/signup/PlanPickStep.tsx` | 30, 57, 58 | `$color10`→`$placeholderColor`; `$blue2`→`$brandSubtle`; `$blue10`→`$brand` |
| `components/lifecycle/CancelledShell.tsx` | 43 | `$color10`→`$colorSubtle` |
| `app/(saas)/billing/index.tsx` | 11, 64, 73 | `$color10`→`$placeholderColor` (×2); `$orange10`→`$warning` |
| `app/(saas)/billing/upgrade.tsx` | 34, 36, 76, 80, 84 | `$color10`→`$placeholderColor` (×3); `$blue2`→`$brandSubtle`; `$blue10`→`$brand` |
| `app/(staff)/dashboard/settings/floor.tsx` | 17, 25 | `$orange2`→`$dangerSubtle`; `$orange11`→`$warning` |
| `app/(saas)/platform/sms/index.tsx` | 7–9 | rate colour helper `$green9`/`$orange9`/`$red9` → `$success`/`$warning`/`$danger` |
| `app/(saas)/platform/sms/delivery-log.tsx` | 14–16, 50 | status colour helper → `$success`/`$warning`/`$danger`; row error `$red9`→`$dangerText` |
| `app/(saas)/platform/tenants/index.tsx` | 13–17, 23 | `STATUS_COLORS` map → `$success`/`$brand`/`$warning`/`$danger`/`$colorSubtle`; fallback `$gray9`→`$colorSubtle` (badge → pill in Phase 2 §1) |

### Example — `components/billing/BookingsQuotaChip.tsx`

```tsx
// Before
const VARIANT_COLORS = { neutral: '$color10', warning: '$orange10', error: '$red10' } as const;
const TRACK_COLORS   = { neutral: '$green5',  warning: '$orange5',  error: '$red5'  } as const;
const FILL_COLORS    = { neutral: '$green9',  warning: '$orange9',  error: '$red9'  } as const;
// ...
<Text fontSize="$2" color="$red10">{t('saas:limits.locationsReached', { cap })}</Text>

// After
const VARIANT_COLORS = { neutral: '$colorSubtle', warning: '$warning', error: '$dangerText' } as const;
const TRACK_COLORS   = { neutral: '$success',     warning: '$warning', error: '$danger'     } as const;
const FILL_COLORS    = { neutral: '$success',     warning: '$warning', error: '$danger'     } as const;
// ...
<Text fontSize="$2" color="$dangerText">{t('saas:limits.locationsReached', { cap })}</Text>
```

**Accessibility note:** use `$dangerText` (#c0392b) for error *text* — it meets WCAG
4.5:1 at small sizes (`$1`/`$2`). Reserve `$danger` (#FE4040) for borders and destructive
backgrounds. This matches core Phase 1 §6.

---

## 3. Raw `fontWeight` → `$7` (audit §2.2)

The body font weight map only wires `$7`→700 and `$8`→800. Raw numeric strings are not
guaranteed to resolve to a loaded Geist face. Replace **all** bold-intent weights with the
token. Single rule:

```tsx
fontWeight="600"  →  fontWeight="$7"
fontWeight="700"  →  fontWeight="$7"
```

### `fontWeight="600"` occurrences

`components/billing/SmsQuotaBlock.tsx:26,54` · `components/apiKeys/ApiKeyUsageSheet.tsx:60,69`
· `components/platform/ApiKeysSummaryBlock.tsx:16` · `components/lifecycle/LifecycleHistoryTab.tsx:22`
· `app/(saas)/settings/api-keys.tsx:170` · `app/(saas)/billing/index.tsx:12,92`
· `app/(saas)/platform/sms/index.tsx:46` · `app/(saas)/platform/sms/routing.tsx:20`
· `app/(saas)/platform/tenants/index.tsx:24,45`
· `app/(saas)/platform/tenants/[id]/index.tsx:94,102,118,129,180`
· `app/(saas)/platform/tenants/[id]/subscription.tsx:126,144,167`
· `app/(saas)/platform/tenants/[id]/lifecycle.tsx:32`

### `fontWeight="700"` occurrences

`components/billing/PastDueBanner.tsx:39` · `components/signup/PlanPickStep.tsx:28,54`
· `components/apiKeys/ApiKeysUpsellCard.tsx:19` · `components/apiKeys/ApiKeyUsageSheet.tsx:30`
· `components/platform/ConfirmDestructiveModal.tsx:47` · `components/platform/PlatformSidebarShell.tsx:28`
· `components/lifecycle/CancelledShell.tsx:39` · `components/lifecycle/LifecycleHistoryTab.tsx:47`
· `app/(staff)/dashboard/_layout.tsx:34` · `app/(saas)/settings/api-keys.tsx:51,93,233`
· `app/(saas)/billing/index.tsx:62` · `app/(saas)/billing/upgrade.tsx:31,75`
· `app/(saas)/platform/action-log/index.tsx:37,64` · `app/(saas)/platform/sms/index.tsx:30,74`
· `app/(saas)/platform/sms/delivery-log.tsx:76` · `app/(saas)/platform/sms/routing.tsx:43`
· `app/(saas)/platform/tenants/index.tsx:76` · `app/(saas)/platform/tenants/[id]/index.tsx:72`
· `app/(saas)/platform/tenants/[id]/subscription.tsx:122` · `app/(saas)/platform/tenants/[id]/lifecycle.tsx:59`

> For genuine extra-bold (page headings rendered via `H1`/`H2`), prefer the core
> `H1_STYLE`/`H2_STYLE` spreads. Plain bold body text uses `$7`.

---

## 4. Weight no-ops in `RoomTabs` (audit §2.3)

`components/floor/RoomTabs.tsx` uses weight tokens that resolve to 400 (`$5`/`$6`), so the
"bold" intent is silently lost.

```tsx
// :46 — selected tab label
fontWeight={selected ? '$7' : '$6'}  →  fontWeight={selected ? '$7' : '$4'}

// :69 — add-room label
fontWeight="$5"  →  fontWeight="$4"
```

`$7` is the only bold token; `$4` is the default body weight.

---

## 5. Spread `CARD_STYLE` (audit §2.5)

`CARD_STYLE` (`$background`, `$4` radius, `1px $borderColor`, `$5` padding) is never
imported in SaaS — cards are hand-rebuilt and drift on padding (`$3` vs `$5`) and radius
(`$3` vs `$4`). Import and spread it; keep only genuinely per-instance props (`gap`,
`testID`, `width`).

```tsx
import { CARD_STYLE } from '@core/constants/styles';

// Before
<YStack backgroundColor="$background" borderRadius="$3" borderWidth={1}
        borderColor="$borderColor" padding="$3" gap="$2">

// After
<YStack {...CARD_STYLE} gap="$2">
```

| File | Lines |
|------|-------|
| `components/billing/SmsQuotaBlock.tsx` | 17–22, 45–49 |
| `components/signup/PlanPickStep.tsx` | 23–24 |
| `components/apiKeys/ApiKeysUpsellCard.tsx` | 12–13 |
| `app/(saas)/billing/index.tsx` | 56–57, 87–88 |
| `app/(saas)/billing/upgrade.tsx` | 25–26 |
| `app/(saas)/platform/sms/index.tsx` | 24–25 |

> Where a card intentionally needs a different padding (e.g. a dense list row), keep
> `CARD_STYLE` and override the single prop after the spread rather than rebuilding it.

---

## 6. Spread `FIELD_LABEL_STYLE` (audit §2.4)

Uppercase info-row / section labels are hand-styled with ad-hoc `fontWeight` and sizing.
Replace with the shared constant (`$3`, `$7`, `$placeholderColor`, `letterSpacing: 1`,
uppercase).

```tsx
import { FIELD_LABEL_STYLE } from '@core/constants/styles';

// Before
<Text fontWeight="600">{t('saas:platform.tenant.profileTitle')}</Text>

// After
<Text {...FIELD_LABEL_STYLE}>{t('saas:platform.tenant.profileTitle')}</Text>
```

Apply to the info-row/section labels in:
- `app/(saas)/billing/index.tsx` (the `:12` label-row pattern)
- `app/(saas)/platform/tenants/[id]/index.tsx:94,102,118,129,180`
- `app/(saas)/platform/tenants/[id]/subscription.tsx:126,144,167`

> Only migrate labels that are genuinely uppercase field/section labels. A bold value
> (e.g. a tenant display name) stays `fontWeight="$7"` from §3 — it is not a field label.

---

## 7. Off-scale radii → tokens (audit §2.8)

| File | Line | Found | Replace with |
|------|------|-------|--------------|
| `components/billing/BookingsQuotaChip.tsx` | 54, 60 | `borderRadius={3}` | `borderRadius="$2"` |
| `components/billing/SmsQuotaBlock.tsx` | 19 | card `borderRadius="$3"` | (covered by `CARD_STYLE`, §5) |
| `components/billing/SmsQuotaBlock.tsx` | 61, 64 | bar `borderRadius={3}` | `borderRadius="$2"` |
| `components/platform/ConfirmDestructiveModal.tsx` | 41 | modal `borderRadius="$3"` | `borderRadius="$5"` |
| `app/(saas)/settings/api-keys.tsx` | 46, 88 | modal `borderRadius="$3"` | `borderRadius="$5"` |
| `components/booking/steps/StepDone.tsx` | 88 | round circle `borderRadius={36}` | `borderRadius={99}` |

> `StepDone.tsx:93` `fontSize={36}` (the `✓` glyph) is **not** changed here — the glyph is
> replaced with an icon component in Phase 2 §7. Modal radius is set to `$5` now even
> though the modals are consolidated in Phase 2 §4, so the interim state is still correct.

---

## Verification

Run per changed package, in order, one at a time (per repo rules):

1. `npm run build` — no new errors
2. `npm run typecheck` — all replaced tokens resolve as valid props; no `any` introduced
3. `npm run lint` — no unused imports (especially after adding `CARD_STYLE`/`FIELD_LABEL_STYLE`)
4. `npm test -- <changed test file>` for each touched component, then `npm test` on the package

Visual sanity (run the dev server):
- **Billing / quotas:** `BookingsQuotaChip` and `SmsQuotaBlock` render with brand/success/
  warning/danger colours (no blue/orange/green ramps); cards have consistent `$5` padding,
  `$4` radius.
- **Platform tenant list:** status text uses semantic colours; bold cells render bold.
- **Lifecycle shells (`SuspendedShell`, `CancelledShell`):** error/danger callout colours
  use `$dangerSubtle`/`$dangerBorder`/`$dangerText` — a shade darker than before; confirm
  contrast is acceptable.
- **`StepDone` success circle:** still a clean circle (radius `99`); checkmark unchanged.
- **No layout shifts** anywhere — this phase changes colour/weight/radius only.
</content>
