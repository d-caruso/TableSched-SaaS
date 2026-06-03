# Branching Strategy — SaaS UX/UI Phase 1: Token & System Conformance

## Overview

All work is in `frontend/`. This phase has no backend dependency and no user-visible
restructuring — every commit is a mechanical token/style conformance change (colour onto
the correct semantic token, raw weights onto `$7`, shared-constant spreads, off-scale radii
onto tokens). No new tokens or constants are created; SaaS consumes `@core`.

Planning doc: `ux-ui-phase1-foundation.md` (concern-organized rulebook).

**This branching doc is the file-centric execution view.** Tasks are grouped by file-area
so each file is touched by exactly one task — the SaaS concern-fixes overlap the same files,
so file-grouping keeps tasks conflict-free and parallel-safe. Each task lists the planning §s
it implements for its files; the **coverage matrix** below proves the transpose is lossless,
and the **global grep gates** in Quality Gates prove every concern is fully discharged
regardless of slicing.

**Shared integration branch:** `feature/ux-ui-improvements` — the umbrella branch for both
phases, branched from `develop`. Both phase branches merge here; only `feature/ux-ui-improvements`
is merged into `develop` at the very end (after Phase 2).

**Git worktree (create here, in Phase 1):** create a dedicated git worktree on the shared
branch so both phases are implemented in an isolated checkout:

```bash
git branch feature/ux-ui-improvements develop          # if it does not exist yet
git worktree add ../tablesched-saas-ux-ui feature/ux-ui-improvements
```

All Phase 1 (and later Phase 2) task branches are created and worked **inside this worktree**.
Phase 2 reuses the same worktree (see its branching doc).

**Feature branch:** `feature/ux-ui-phase1-foundation` — branched from `feature/ux-ui-improvements`

---

## Quality Gates

- **During task implementation**: run `npm test -- <specific-test-file>` for the files
  currently being worked on only. Do not run the full suite mid-task.
- **Never run build, typecheck, lint, or tests in parallel**: wait for the current run to
  finish before triggering the next.
- **Full test suite**: run `npm test` on the full package only before merging
  `feature/ux-ui-phase1-foundation` into `feature/ux-ui-improvements`.
- **Before merging into `feature/ux-ui-improvements`**: all of `npm run build`,
  `npm run typecheck`, `npm run lint`, and `npm test` must pass with no errors.
- **Global concern gates (completeness proof)** — run on the full feature branch before
  merge into `feature/ux-ui-improvements`; each must return zero matches:
  - Built-in colour ramps: `grep -rnE '\$(red|orange|blue|green|gray)[0-9]+|\$color[0-9]' frontend/app frontend/components` → zero
  - Raw font weights: `grep -rnE 'fontWeight="(600|700)"' frontend/app frontend/components` → zero
  - Off-scale radius: `grep -rn 'borderRadius={3}' frontend/app frontend/components` → zero
  - Raw `color="white"`: `grep -rn 'color="white"' frontend/app frontend/components` → zero

  These gates are independent of how tasks were split, so nothing dropped in the
  concern→file transpose can pass unnoticed.

---

## Coverage matrix (lossless transpose from the planning doc)

Every `(planning §, file)` cell from `ux-ui-phase1-foundation.md` is assigned to exactly
one task. The union of the three tasks equals the planning doc's full file set.

| File | §2 colour | §3 weight | §4 RoomTabs | §5 CARD_STYLE | §6 FIELD_LABEL | §7 radii | Task |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `components/billing/BookingsQuotaChip.tsx` | ✓ | | | | | ✓ | 1 |
| `components/billing/SmsQuotaBlock.tsx` | ✓ | ✓ | | ✓ | | ✓ | 1 |
| `components/billing/PastDueBanner.tsx` | ✓ | ✓ | | | | | 1 |
| `components/signup/PlanPickStep.tsx` | ✓ | ✓ | | ✓ | | | 1 |
| `components/apiKeys/ApiKeysUpsellCard.tsx` | | ✓ | | ✓ | | | 1 |
| `app/(saas)/billing/index.tsx` | ✓ | ✓ | | ✓ | ✓ | | 1 |
| `app/(saas)/billing/upgrade.tsx` | ✓ | ✓ | | ✓ | | | 1 |
| `app/(saas)/platform/tenants/index.tsx` | ✓ | ✓ | | | | | 2 |
| `app/(saas)/platform/tenants/[id]/index.tsx` | | ✓ | | | ✓ | | 2 |
| `app/(saas)/platform/tenants/[id]/subscription.tsx` | | ✓ | | | ✓ | | 2 |
| `app/(saas)/platform/tenants/[id]/lifecycle.tsx` | | ✓ | | | | | 2 |
| `app/(saas)/platform/sms/index.tsx` | ✓ | ✓ | | ✓ | | | 2 |
| `app/(saas)/platform/sms/delivery-log.tsx` | ✓ | ✓ | | | | | 2 |
| `app/(saas)/platform/sms/routing.tsx` | | ✓ | | | | | 2 |
| `app/(saas)/platform/action-log/index.tsx` | | ✓ | | | | | 2 |
| `app/(saas)/settings/api-keys.tsx` | | ✓ | | | | ✓ | 2 |
| `components/apiKeys/ApiKeyUsageSheet.tsx` | | ✓ | | | | | 2 |
| `components/platform/ApiKeysSummaryBlock.tsx` | | ✓ | | | | | 2 |
| `components/platform/ConfirmDestructiveModal.tsx` | | ✓ | | | | ✓ | 2 |
| `components/platform/PlatformSidebarShell.tsx` | | ✓ | | | | | 2 |
| `components/lifecycle/SuspendedShell.tsx` | ✓ | | | | | | 3 |
| `components/lifecycle/CancelledShell.tsx` | ✓ | ✓ | | | | | 3 |
| `components/lifecycle/LifecycleHistoryTab.tsx` | | ✓ | | | | | 3 |
| `components/platform/ImpersonationBanner.tsx` | ✓ | | | | | | 3 |
| `components/booking/BookingFormFlow.tsx` | ✓ | | | | | | 3 |
| `components/booking/steps/StepDone.tsx` | | | | | | ✓ | 3 |
| `components/floor/RoomTabs.tsx` | | | ✓ | | | | 3 |
| `app/(staff)/dashboard/settings/floor.tsx` | ✓ | | | | | | 3 |
| `app/(staff)/dashboard/_layout.tsx` | | ✓ | | | | | 3 |

All three tasks are **file-disjoint** → may be worked fully in parallel off the feature branch.

---

## `feature/ux-ui-phase1-foundation`

### Task 1 — `task/ux-ui-phase1-Task1-billing-quota`

Branched from `feature/ux-ui-phase1-foundation`.

**Scope** — billing & quota components. Implements planning **§2, §3, §5, §6, §7** for:
- `components/billing/BookingsQuotaChip.tsx` — §2 (`VARIANT/TRACK/FILL_COLORS` ramps →
  `$colorSubtle`/`$warning`/`$danger` & `$success`/`$warning`/`$danger`; error text :66 →
  `$dangerText`); §7 (`borderRadius={3}` :54,60 → `"$2"`)
- `components/billing/SmsQuotaBlock.tsx` — §2 (`$color10`→`$placeholderColor`,
  `$blue5`→track, `$blue9`→`$brand`, `$orange*`→`$warning`); §3 (`fontWeight="600"`
  :26,54 → `"$7"`); §5 (spread `{...CARD_STYLE}` on the two card YStacks); §7 (bar
  `borderRadius={3}` :61,64 → `"$2"`)
- `components/billing/PastDueBanner.tsx` — §2 (`$orange*`→`$dangerSubtle`/`$dangerBorder`/`$warning`);
  §3 (`fontWeight="700"` :39 → `"$7"`)
- `components/signup/PlanPickStep.tsx` — §2 (`$color10`→`$placeholderColor`,
  `$blue2`→`$brandSubtle`, `$blue10`→`$brand`); §3 (:28,54 → `"$7"`); §5 (`{...CARD_STYLE}`)
- `components/apiKeys/ApiKeysUpsellCard.tsx` — §3 (:19 → `"$7"`); §5 (`{...CARD_STYLE}`)
- `app/(saas)/billing/index.tsx` — §2 (`$color10`×2→`$placeholderColor`, `$orange10`→`$warning`);
  §3 (:12,62,92 → `"$7"`); §5 (`{...CARD_STYLE}` :56,87); §6 (info-row labels → `{...FIELD_LABEL_STYLE}`)
- `app/(saas)/billing/upgrade.tsx` — §2 (`$color10`×3→`$placeholderColor`, `$blue2`→`$brandSubtle`,
  `$blue10`→`$brand`); §3 (:31,75 → `"$7"`); §5 (`{...CARD_STYLE}`)

Add imports `CARD_STYLE`, `FIELD_LABEL_STYLE` from `@core/constants/styles` where used.

**Verification:**
- `npm run typecheck` passes
- `npm test -- components/billing` then any touched billing screen tests
- Scoped greps return zero within these files:
  `grep -nE '\$(orange|blue|green|gray)[0-9]+|\$color[0-9]' <files>`,
  `grep -nE 'fontWeight="(600|700)"' <files>`, `grep -n 'borderRadius={3}' <files>`
- Visual: quota chip/SMS block render brand/warning/danger (no blue/orange/green); cards
  have `$5` padding + `$4` radius; bold text renders bold

**Merges to:** `feature/ux-ui-phase1-foundation`

---

### Task 2 — `task/ux-ui-phase1-Task2-platform-admin`

Branched from `feature/ux-ui-phase1-foundation`.

**Scope** — platform admin / API-keys / settings files. Implements planning **§2, §3, §6, §7** for:
- `app/(saas)/platform/tenants/index.tsx` — §2 (`STATUS_COLORS` ramps :13–17 → semantic;
  fallback :23 → `$colorSubtle`); §3 (:24,45,76 → `"$7"`)
- `app/(saas)/platform/tenants/[id]/index.tsx` — §3 (:72) and §6 (section labels
  :94,102,118,129,180 → `{...FIELD_LABEL_STYLE}`)
- `app/(saas)/platform/tenants/[id]/subscription.tsx` — §3 (:122); §6 (:126,144,167)
- `app/(saas)/platform/tenants/[id]/lifecycle.tsx` — §3 (:32,59 → `"$7"`)
- `app/(saas)/platform/sms/index.tsx` — §2 (rate helper :7–9 → `$success`/`$warning`/`$danger`);
  §3 (:30,46,74 → `"$7"`); §5 (`{...CARD_STYLE}` :24)
- `app/(saas)/platform/sms/delivery-log.tsx` — §2 (status helper :14–16, row error :50 →
  `$dangerText`); §3 (:76)
- `app/(saas)/platform/sms/routing.tsx` — §3 (:20,43 → `"$7"`)
- `app/(saas)/platform/action-log/index.tsx` — §3 (:37,64 → `"$7"`)
- `app/(saas)/settings/api-keys.tsx` — §3 (:51,93,170,233 → `"$7"`); §7 (modal
  `borderRadius="$3"` :46,88 → `"$5"`)
- `components/apiKeys/ApiKeyUsageSheet.tsx` — §3 (:30,60,69 → `"$7"`)
- `components/platform/ApiKeysSummaryBlock.tsx` — §3 (:16 → `"$7"`)
- `components/platform/ConfirmDestructiveModal.tsx` — §3 (:47); §7 (modal `"$3"` :41 → `"$5"`)
- `components/platform/PlatformSidebarShell.tsx` — §3 (:28 → `"$7"`)

> Note: §5 `platform/sms/index.tsx` `{...CARD_STYLE}` lives in this task (it owns the file),
> even though §5 is primarily exercised in Task 1.

**Verification:**
- `npm run typecheck` passes
- `npm test -- app/(saas)/platform` and touched component tests
- Scoped greps (ramps / weights / `borderRadius={3}`) return zero within these files
- Visual: tenant-list status colours semantic; section labels gray uppercase; modals render
  at `$5` radius; bold cells bold

**Merges to:** `feature/ux-ui-phase1-foundation`

---

### Task 3 — `task/ux-ui-phase1-Task3-lifecycle-booking-floor`

Branched from `feature/ux-ui-phase1-foundation`.

**Scope** — lifecycle / booking / floor / misc. Implements planning **§2, §3, §4, §7** for:
- `components/lifecycle/SuspendedShell.tsx` — §2 (`$red3`/`$red6`/`$red11` :24,26,32 →
  `$dangerSubtle`/`$dangerBorder`/`$dangerText`)
- `components/lifecycle/CancelledShell.tsx` — §2 (`$color10` :43 → `$colorSubtle`); §3 (:39 → `"$7"`)
- `components/lifecycle/LifecycleHistoryTab.tsx` — §3 (:22,47 → `"$7"`)
- `components/platform/ImpersonationBanner.tsx` — §2 (`$red9` :22 → `$danger`;
  `color="white"` :28 → `$background`)
- `components/booking/BookingFormFlow.tsx` — §2 (`$red2` :21 → `$dangerSubtle`;
  `$red11` :27 → `$dangerText`)
- `components/booking/steps/StepDone.tsx` — §7 (success circle `borderRadius={36}` :88 → `99`)
- `components/floor/RoomTabs.tsx` — §4 (`fontWeight` :46 `$5/$6`→`$7/$4`, :69 `$5`→`$4`)
- `app/(staff)/dashboard/settings/floor.tsx` — §2 (`$orange2`/`$orange11` :17,25 →
  `$dangerSubtle`/`$warning`)
- `app/(staff)/dashboard/_layout.tsx` — §3 (:34 → `"$7"`)

**Verification:**
- `npm run typecheck` passes
- `npm test -- components/lifecycle` and touched booking/floor tests
- Scoped greps (ramps / weights / `borderRadius={3}` / `color="white"`) return zero within
  these files
- Visual: lifecycle shells use danger callout tokens (a shade darker — confirm contrast);
  impersonation banner is `$danger`; `StepDone` circle still round; RoomTabs labels bold
  when selected

**Merges to:** `feature/ux-ui-phase1-foundation`

---

## Merge chain

```
task/ux-ui-phase1-Task1-billing-quota              → feature/ux-ui-phase1-foundation
task/ux-ui-phase1-Task2-platform-admin             → feature/ux-ui-phase1-foundation
task/ux-ui-phase1-Task3-lifecycle-booking-floor    → feature/ux-ui-phase1-foundation

feature/ux-ui-phase1-foundation → feature/ux-ui-improvements
```

Tasks 1, 2, and 3 are file-disjoint (see coverage matrix) and may be worked **fully in
parallel** — there is no inter-task ordering constraint. Before merging the feature branch
into `feature/ux-ui-improvements`, run the **global concern gates** (Quality Gates) to prove
every concern §2–§7 is fully discharged across the module.

`feature/ux-ui-phase2-improvements` branches from `feature/ux-ui-improvements` only after
`feature/ux-ui-phase1-foundation` is merged into `feature/ux-ui-improvements`.
`feature/ux-ui-improvements` is merged into `develop` only at the end, after Phase 2.
