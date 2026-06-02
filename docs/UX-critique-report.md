# TableSched SaaS — UX/UI Quality Report

**Date:** 2026-06-02  
**Scope:** `frontend/app` + `frontend/components` — SaaS extension module (Expo + React Native + Tamagui 2.0 RC)  
**Method:** Core design system extraction → SaaS code audit → craft critique  
**Baseline:** TableSched core design system — `~/Projects/TableSched/docs/TAMAGUI_TOKENS.md` and `frontend/.interface-design/system.md`

> The SaaS module reuses the core Tamagui config, palette, and `constants/styles.ts` via the `@core/*` path alias. It therefore inherits the same tokens and **must follow the same UX/UI rules**. This report measures the SaaS-only files against that baseline.

---

## Table of Contents

1. [Design System Inventory](#1-design-system-inventory)
2. [Code-Level Violations](#2-code-level-violations)
3. [Craft Findings](#3-craft-findings)
4. [Fix Priority Roadmap](#4-fix-priority-roadmap)

---

## 1. Design System Inventory

The SaaS module does **not** define its own tokens. `frontend/tamagui.config.ts` mirrors core's config (same `PALETTE`-derived brand/semantic tokens and light/dark themes). All shared style constants (`CARD_STYLE`, `FIELD_LABEL_STYLE`, `FOCUS_STYLE`, `PAGE_MAX_WIDTH`, …) come from `@core/constants/styles`. See `docs/TAMAGUI_TOKENS.md` for the SaaS pointer to the canonical reference.

### Color Tokens (inherited from core)

| Token | Value | Role |
|-------|-------|------|
| `$brand` | `#2D56CC` | Primary actions, links, focus |
| `$brandDark` | `#1B3FA0` | Hover on primary |
| `$brandSubtle` | `#eef4ff` | Hover on secondary, brand-tinted callouts |
| `$danger` | `#FE4040` | Destructive backgrounds, error borders |
| `$dangerText` | `#c0392b` | Error text on white (WCAG 4.5:1) |
| `$dangerSubtle` | `#fff4f4` | Error backgrounds |
| `$dangerBorder` | `#f8c6c0` | Error borders |
| `$success` | `#057a55` | Positive states |
| `$warning` / `$sectionLabel` | `#FAAB34` | Warnings, section labels |
| `$colorSubtle` / `$placeholderColor` | (Tamagui) | Secondary/muted text |
| `$gray2` | (Tamagui) | Page/editor background |

> **Rule (core):** Never use Tamagui's built-in ramps (`$red9`, `$orange9`, `$blue9`, `$green9`, `$gray9`, `$color10`, …). Use the semantic tokens above.

### Shared style constants (from `@core/constants/styles`)

`CARD_STYLE` · `FIELD_LABEL_STYLE` · `FOCUS_STYLE` / `FOCUS_STYLE_INSET` · `PRESS_STYLE` · `PRIMARY_ACTION_MIN_HEIGHT` (52) · `PAGE_MAX_WIDTH` (520) · `STAFF_MAX_WIDTH` (600) · `AUTH_MAX_WIDTH` (400) · `SETTINGS_TEXT_MAX_WIDTH` (760).

### Depth Strategy

**Borders-first.** Surface hierarchy = `$gray2` page → `$background` card + `1px $borderColor` + `$4` radius. Shadows are reserved for floating elements (core `ReminderToast`). No SaaS file introduces a shadow — this is the strongest area of the module.

### Component reuse

SaaS correctly reuses many core components (`ResponsiveShell`, onboarding steps, settings editors, `BookingFormFlow`, core `AppButton` in several places). It diverges where it should not (see §2.5–2.7): rebuilt cards, two custom modals, a bespoke status badge, a third tab pattern, and a forked `AppButton`.

---

## 2. Code-Level Violations

### Summary

| Category | Violations | Severity |
|----------|------------|----------|
| Color tokens (built-in ramps) | 13 files | High |
| Typography tokens (raw `fontWeight`) | 28 files | High |
| Pattern drift / non-reuse | 5 | Medium |
| Spacing / radius | 4 | Medium |
| Accessibility (focus, targets) | 2 | Medium |
| i18n / hardcoded strings | 4 | Medium |
| Spacing (padding/gap/margin px) | 0 | — |

---

### 2.1 Color — built-in ramps instead of semantic tokens (13 files)

The core rule forbids Tamagui built-in color ramps. SaaS uses them pervasively for status, progress, and callout colors. Two visually distinct shades end up communicating the same semantic meaning, and none of these adapt to theme.

| File | Lines | Found | Should be |
|------|-------|-------|-----------|
| `components/billing/BookingsQuotaChip.tsx` | 13–28, 66 | `$color10`, `$orange10`, `$red10`, `$green5/9`, `$orange5/9`, `$red5/9` | `$colorSubtle`/`$warning`/`$danger`; track/fill keyed to `$success`/`$warning`/`$danger` |
| `components/billing/SmsQuotaBlock.tsx` | 27, 57, 61, 65, 70, 73 | `$color10`, `$blue5`, `$blue9`, `$orange9`, `$orange10` | `$placeholderColor`; `$brand` fill / neutral track; `$warning` overage |
| `components/billing/PastDueBanner.tsx` | 24, 26, 33, 38 | `$orange3`/`$orange6`/`$orange11` | `$warning`-based / `$dangerSubtle` callout treatment |
| `components/platform/ImpersonationBanner.tsx` | 22, 28 | `$red9` bg, `color="white"` | `$danger` bg, `$background` text token |
| `components/lifecycle/SuspendedShell.tsx` | 24, 26, 32 | `$red3`/`$red6`/`$red11` | `$dangerSubtle` / `$dangerBorder` / `$dangerText` |
| `components/booking/BookingFormFlow.tsx` | 21, 27 | `$red2` bg, `$red11` text | `$dangerSubtle` + `$dangerText` |
| `components/signup/PlanPickStep.tsx` | 30, 57, 58 | `$color10`, `$blue2`, `$blue10` | `$placeholderColor`; `$brandSubtle` + `$brand` callout |
| `components/lifecycle/CancelledShell.tsx` | 43 | `$color10` | `$colorSubtle` / `$placeholderColor` |
| `app/(saas)/billing/index.tsx` | 11, 64, 73 | `$color10` (×2), `$orange10` | `$placeholderColor`; `$warning` |
| `app/(saas)/billing/upgrade.tsx` | 34, 36, 76, 80, 84 | `$color10` (×3), `$blue2`, `$blue10` | muted text; `$brandSubtle`/`$brand` |
| `app/(staff)/dashboard/settings/floor.tsx` | 17, 25 | `$orange2`, `$orange11` | `$warning` / `$dangerSubtle` callout |
| `app/(saas)/platform/sms/index.tsx` · `sms/delivery-log.tsx` | 7–9 · 14–16, 50 | `$green9`/`$orange9`/`$red9` | `$success`/`$warning`/`$danger` |
| `app/(saas)/platform/tenants/index.tsx` | 13–17, 23 | `$green9`/`$blue9`/`$orange9`/`$red9`/`$gray9` | `$success`/`$brand`/`$warning`/`$danger`/`$colorSubtle` (and render via core `StatusBadge`) |

**Accessibility note:** error text rendered in `$danger` (#FE4040) at small sizes (`$1`/`$2`) may miss WCAG 4.5:1. Core already ships `$dangerText` (#c0392b) for text-on-white — use it for error text, reserving `$danger` for borders/backgrounds.

### 2.2 Typography — raw `fontWeight` strings instead of weight tokens (28 files)

The body font weight map only wires `$7`→700 and `$8`→800. Raw numeric strings (`"600"`, `"700"`) are not guaranteed to resolve to a loaded Geist face and bypass the documented token.

- **`fontWeight="600"`** (no token equivalent — likely renders as 400): `SmsQuotaBlock.tsx:26,54`, `ApiKeyUsageSheet.tsx:60,69`, `ApiKeysSummaryBlock.tsx:16`, `LifecycleHistoryTab.tsx:22`, `api-keys.tsx:170`, `billing/index.tsx:12,92`, `platform/sms/index.tsx:46`, `sms/routing.tsx:20`, `tenants/index.tsx:24,45`, `tenants/[id]/index.tsx:94,102,118,129,180`, `subscription.tsx:126,144,167`, `lifecycle.tsx:32`. → **`fontWeight="$7"`**.
- **`fontWeight="700"`**: `PastDueBanner.tsx:39`, `PlanPickStep.tsx:28,54`, `ApiKeysUpsellCard.tsx:19`, `ApiKeyUsageSheet.tsx:30`, `ConfirmDestructiveModal.tsx:47`, `PlatformSidebarShell.tsx:28`, `CancelledShell.tsx:39`, `LifecycleHistoryTab.tsx:47`, `dashboard/_layout.tsx:34`, `api-keys.tsx:51,93,233`, `billing/index.tsx:62`, `billing/upgrade.tsx:31,75`, `action-log/index.tsx:37,64`, `platform/sms/index.tsx:30,74`, `sms/delivery-log.tsx:76`, `sms/routing.tsx:43`, `tenants/index.tsx:76`, `tenants/[id]/index.tsx:72`, `subscription.tsx:122`, `lifecycle.tsx:59`. → **`fontWeight="$7"`**.

### 2.3 Typography — meaningless weight tokens

`components/floor/RoomTabs.tsx:46,69` use `fontWeight={selected ? '$7' : '$6'}` and `fontWeight="$5"`. `$5`/`$6` weight tokens both resolve to **400** in the body font — they read as "bold" intent but are no-ops. Use `$7` for emphasis, `$4` (default) otherwise.

### 2.4 Typography — uppercase field labels not using `FIELD_LABEL_STYLE`

Info-row / section labels in `billing/index.tsx`, `tenants/[id]/index.tsx`, and `subscription.tsx` are hand-styled (`fontWeight="600"` + ad-hoc size, no transform) instead of spreading the shared `FIELD_LABEL_STYLE` (`$3`, `$7`, `$placeholderColor`, `letterSpacing:1`, uppercase). This is the same "hidden label component" anti-pattern flagged in core — reuse the constant.

### 2.5 Pattern — `CARD_STYLE` never reused; cards hand-rebuilt (7 places)

`SmsQuotaBlock.tsx:17–22,45–49`, `PlanPickStep.tsx:23–24`, `ApiKeysUpsellCard.tsx:12–13`, `billing/index.tsx:56–57,87–88`, `billing/upgrade.tsx:25–26`, `platform/sms/index.tsx:24–25` each reconstruct a card surface manually. They drift on padding (`$3` vs the canonical `$5`) and radius (`$3` vs `$4`). **Fix:** spread `...CARD_STYLE`.

### 2.6 Pattern — two divergent modals, neither uses core `ConfirmDialog`

- `components/platform/ConfirmDestructiveModal.tsx:35` — RN `Modal` + `rgba(0,0,0,0.5)` scrim, content `borderRadius="$3"`.
- `app/(saas)/settings/api-keys.tsx:39,81` — `position:absolute` overlays + `rgba(0,0,0,0.6)` scrim, content `borderRadius="$3"`.

Two modal mechanisms, two scrim alphas, and modal radius `$3` instead of the documented `$5`. **Fix:** reuse core `ConfirmDialog` (or a single shared modal) and tokenise the scrim.

### 2.7 Pattern — rebuilt primitives that core already ships

- `app/(saas)/platform/tenants/index.tsx:20–30` — local `StatusBadge` (bare colored text, forbidden ramps) instead of core `StatusBadge` pill.
- `components/floor/RoomTabs.tsx` — a third tab visual language (pill boxes, raw `minWidth/height` 106/54/126) that matches neither core `FilterTabs` nor `SegmentedControl` (active = `2px $brand` bottom border).
  - **Resolution (Phase 2 §6a): intentional divergence.** The pill-box treatment is kept as a deliberate floor-plan affordance — each tab reads as a tappable "room button," which the bottom-border tab languages do not convey, and the row also hosts an add-room affordance that `FilterTabs`/`SegmentedControl` (fixed option sets) cannot express. The raw pixel values were promoted to named constants (`ROOM_TAB_MIN_WIDTH`/`ADD_ROOM_MIN_WIDTH`/`ROOM_TAB_HEIGHT`) and `FOCUS_STYLE` was added to both interactive elements.
- `components/platform/PlatformSidebarShell.tsx:19` — fixed sidebar `width={200}` vs core `ResponsiveShell`'s `260`.
- `components/ui/AppButton.tsx` — a full copy of core `AppButton` plus a `useCanWrite` write-gate. Acceptable in intent, but it duplicates the entire implementation and will drift; prefer wrapping core `AppButton`.

### 2.8 Spacing / radius — raw pixels off the token scale

| File | Line | Found | Should be |
|------|------|-------|-----------|
| `components/billing/BookingsQuotaChip.tsx` | 54, 60 | `borderRadius={3}` | `$2` (5px) |
| `components/billing/SmsQuotaBlock.tsx` | 19, 61, 64 | card `borderRadius="$3"`; bar `borderRadius={3}` | card `$4`; bar `$2` |
| `components/booking/steps/StepDone.tsx` | 88, 93 | `borderRadius={36}`, `fontSize={36}` | `borderRadius={99}` (round convention); a named constant for the glyph size |
| `ConfirmDestructiveModal.tsx` · `api-keys.tsx` | 41 · 46, 88 | modal `borderRadius="$3"` | `$5` (modal radius) |

### 2.9 Accessibility — focus ring missing on custom interactive elements

Only `AppButton` carries `FOCUS_STYLE`. Custom tappables have `pressStyle` but no `focusStyle`: `RoomTabs.tsx:26–43,54–68` (role="tab"), `PastDueBanner.tsx:36–41` (onPress `Text`), `tenants/index.tsx` rows, and the modal overlay elements. Core requires a visible brand outline on **all** interactive elements — spread `FOCUS_STYLE`.

Tappable text (`PastDueBanner.tsx:36`, glyph rows) is also below the 44×44 WCAG target and bypasses `IconButton`.

### 2.10 i18n — hardcoded / untranslated user-facing strings

- `app/(saas)/platform/tenants/index.tsx:27` — renders raw `{status}` enum slug as badge text.
- `app/(saas)/platform/sms/index.tsx:30` — raw provider value via `textTransform="capitalize"`.
- `components/booking/steps/StepDone.tsx:100,112` — inline English `defaultValue` fallbacks (`Thank you, ${name}!`, `Make another booking`).
- `StepDone.tsx:93` / `action-log/index.tsx:40` — literal glyphs `✓` / `→` outside the icon system.

---

## 3. Craft Findings

Beyond token violations — decisions that were defaulted, not made.

### 3.1 Platform admin (tenant management)

#### The tenant list is a raw table with no surface

`tenants/index.tsx` renders rows as bare `XStack`s with bottom borders inside an unconstrained `YStack flex={1} padding="$3"`. There is no card, no `maxWidth`, no header/zebra treatment. On a wide admin screen the columns stretch edge-to-edge and become hard to scan. Wrap the list in `CARD_STYLE` and constrain width.

#### Status is communicated by text color alone

The bespoke `StatusBadge` is colored text, not a pill. Color-only status fails for color-blind users and reads as "weakly emphasised text" rather than a state chip. Use core `StatusBadge` (bg + fg pair, pill shape).

#### Filter/sort controls are untethered ghost buttons

The sort and status filters are rows of ghost `AppButton`s floating above the list with no toolbar container or active-affordance beyond `variant`. They need to live in a labeled control strip consistent with core `FilterTabs`.

### 3.2 Billing & quotas

#### Progress bars invent their own color language

`SmsQuotaBlock` (blue fill) and `BookingsQuotaChip` (green/orange/red ramps) use different, non-semantic palettes for the same "usage toward a cap" concept. Standardise on a single progress treatment: neutral track + `$brand` fill, escalating to `$warning`/`$danger` as the cap approaches.

#### `PastDueBanner` reads as decoration, not an alert

Soft `$orange3` background with `$orange11` text is low-contrast and off-palette. A past-due state is a payment-blocking alert — it should use the danger/warning callout treatment and a real CTA button, not an `onPress` text link (`:36`).

### 3.3 Public booking — `StepDone`

#### Success checkmark is a hand-built glyph

The `✓` is a raw `fontSize={36}` text in a `borderRadius={36}` circle. It bypasses the icon system and the round-element convention (`borderRadius={99}`). Use an icon component; if the glyph stays, name the size constant.

#### English leaks through `defaultValue`

`Thank you, ${draft.name}!` and `Make another booking` are baked into source as fallbacks. If a key is missing, non-English users see English. Remove inline defaults and rely on the catalog.

### 3.4 Cross-cutting

#### No screen uses a max-width constant

Not one SaaS screen imports `PAGE_MAX_WIDTH` / `STAFF_MAX_WIDTH` / `AUTH_MAX_WIDTH`. Screens render full-bleed at `flex={1}` with `padding="$3"`, so on wide web viewports content sprawls. Adopt the core page-shell pattern (centered `YStack` with a max-width constant).

#### Focus is invisible everywhere except buttons

The keyboard-focus story is incomplete: custom tabs, rows, banners, and modal overlays have no focus ring. For an admin/back-office product that is heavily keyboard-driven, this is a real operability gap.

---

## 4. Fix Priority Roadmap

Ordered by impact-to-effort ratio.

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Replace all built-in ramps (`$red9`/`$orange*`/`$blue*`/`$green*`/`$gray9`/`$color10`) with semantic tokens (§2.1) | Low | High — fixes 13 files, restores theming |
| 2 | Replace raw `fontWeight="600"/"700"` with `$7` across 28 files (§2.2) | Low | High — fixes weight rendering consistency |
| 3 | Use core `$dangerText` for error text; keep `$danger` for borders/bg | Low | High — WCAG contrast |
| 4 | Add i18n keys for raw status/provider slugs and remove inline English `defaultValue`s (§2.10) | Low | High — explicit rule violations |
| 5 | Spread `...CARD_STYLE` in the 7 hand-built cards (§2.5) | Low | High — consistency, fixes padding/radius drift |
| 6 | Replace local `StatusBadge` with core `StatusBadge`; render pills (§2.7) | Low | Medium |
| 7 | Spread `FOCUS_STYLE` on all custom interactive elements (§2.9) | Low | High — keyboard a11y |
| 8 | Adopt page-shell + max-width constant on SaaS screens (§3.4) | Medium | Medium — wide-viewport layout |
| 9 | Consolidate the two modals onto core `ConfirmDialog`; modal radius `$5`; tokenise scrim (§2.6) | Medium | Medium |
| 10 | Fix off-scale radii (`{3}`, `{36}`, modal `$3`) to tokens / `99` (§2.8) | Low | Medium |
| 11 | Standardise quota progress bars on one semantic treatment (§3.2) | Low | Medium |
| 12 | Fix `RoomTabs` weight no-ops (`$5`/`$6` → `$4`/`$7`); align to `FilterTabs` pattern (§2.3, §2.7) | Low | Medium |
| 13 | Reuse `FIELD_LABEL_STYLE` for uppercase labels (§2.4) | Low | Medium |
| 14 | Align `PlatformSidebarShell` width to core (`260`) or reuse `ResponsiveShell` (§2.7) | Low | Low |
| 15 | Refactor SaaS `AppButton` to wrap core `AppButton` rather than copy it (§2.7) | Medium | Low — drift prevention |

---

*Baseline: `~/Projects/TableSched/docs/TAMAGUI_TOKENS.md` and `frontend/.interface-design/system.md`. SaaS token pointer: `docs/TAMAGUI_TOKENS.md`.*
</content>
</invoke>
