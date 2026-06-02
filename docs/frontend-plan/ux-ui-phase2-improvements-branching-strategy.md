# Branching Strategy — SaaS UX/UI Phase 2: User-Facing Fixes

## Overview

All work is in `frontend/`. This phase depends on `feature/ux-ui-phase1-foundation` being
merged into `feature/ux-ui-improvements` first — all SaaS colours, weights, radii, cards, and
field labels must already conform to the core token system. This phase covers user-facing / craft / a11y /
i18n fixes. No new tokens/constants are created; SaaS consumes `@core` (components included:
`StatusBadge`, `ConfirmDialog`, `IconButton`, `FilterTabs`, `ResponsiveShell`, core `AppButton`).

Planning doc: `ux-ui-phase2-improvements.md` (concern-organized rulebook).

**This branching doc is the file-centric execution view.** Cross-cutting concerns (focus
rings §2, max-width §3, modal consolidation §4) are folded into the domain task that owns
the files rather than split into separate tasks, keeping every file in exactly one task.
Each task lists the planning §s it implements; the **coverage matrix** below proves the
transpose is lossless and the **global grep gates** prove completeness.

**Shared integration branch:** `feature/ux-ui-improvements` — the umbrella branch for both
phases (created in Phase 1, branched from `develop`). This phase merges here; only
`feature/ux-ui-improvements` is merged into `develop` at the very end.

**Git worktree (reuse the Phase 1 worktree):** work in the existing git worktree created in
Phase 1 on `feature/ux-ui-improvements` (e.g. `../tablesched-saas-ux-ui`). Do not create a new
one — all Phase 2 task branches are created and worked inside that same worktree.

**Feature branch:** `feature/ux-ui-phase2-improvements` — branched from
`feature/ux-ui-improvements` after `feature/ux-ui-phase1-foundation` merges into it

---

## Quality Gates

- **During task implementation**: run `npm test -- <specific-test-file>` for the files
  currently being worked on only. Do not run the full suite mid-task.
- **Never run build, typecheck, lint, or tests in parallel**: wait for the current run to
  finish before triggering the next.
- **Full test suite**: run `npm test` on the full package only before merging
  `feature/ux-ui-phase2-improvements` into `feature/ux-ui-improvements`.
- **Before merging into `feature/ux-ui-improvements`**: all of `npm run build`,
  `npm run typecheck`, `npm run lint`, and `npm test` must pass with no errors.
- **Global concern gates (completeness proof)** — run on the full feature branch before
  merge; each must return zero matches:
  - No raw modal scrims outside the shared dialog:
    `grep -rnE 'rgba?\(' frontend/app frontend/components` → zero
  - No untranslated status/provider literals or English `defaultValue` leaks:
    `grep -rn 'defaultValue:' frontend/components/booking` → zero;
    manual check that `tenants/index.tsx` and `platform/sms/index.tsx` render via `t(...)`
  - i18n parity: existing parity test green — no key in EN missing from IT/DE

---

## Coverage matrix (lossless transpose from the planning doc)

Every `(planning §, file)` cell from `ux-ui-phase2-improvements.md` is assigned to exactly
one task.

| File | §1 list | §2 focus | §3 width | §4 modal | §5 quota | §6 tabs/sidebar | §7 i18n | §8 button | Task |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `lib/i18n/locales/{en,it,de}.json` (saas ns) | | | | | | | ✓ | | 1 |
| `components/ui/AppButton.tsx` (+test) | | | | | | | | ✓ | 2 |
| `app/(saas)/platform/tenants/index.tsx` | ✓ | ✓ | ✓ | | | | ✓ | | 3 |
| `app/(saas)/platform/tenants/[id]/index.tsx` | | | ✓ | | | | | | 3 |
| `app/(saas)/platform/tenants/[id]/subscription.tsx` | | | ✓ | | | | | | 3 |
| `app/(saas)/platform/tenants/[id]/lifecycle.tsx` | | | ✓ | | | | | | 3 |
| `app/(saas)/platform/sms/index.tsx` | | | ✓ | | | | ✓ | | 3 |
| `app/(saas)/platform/sms/delivery-log.tsx` | | | ✓ | | | | | | 3 |
| `app/(saas)/platform/sms/routing.tsx` | | | ✓ | | | | | | 3 |
| `app/(saas)/platform/action-log/index.tsx` | | | ✓ | | | | ✓ | | 3 |
| `app/(saas)/settings/api-keys.tsx` | | ✓ | ✓ | ✓ | | | | | 3 |
| `components/platform/ConfirmDestructiveModal.tsx` | | ✓ | | ✓ | | | | | 3 |
| `app/(saas)/billing/index.tsx` | | | ✓ | | | | | | 4 |
| `app/(saas)/billing/upgrade.tsx` | | | ✓ | | | | | | 4 |
| `components/billing/SmsQuotaBlock.tsx` | | | | | ✓ | | | | 4 |
| `components/billing/BookingsQuotaChip.tsx` | | | | | ✓ | | | | 4 |
| `components/billing/PastDueBanner.tsx` | | ✓ | | | ✓ | | | | 4 |
| `components/floor/RoomTabs.tsx` | | ✓ | | | | ✓ | | | 5 |
| `components/platform/PlatformSidebarShell.tsx` | | | | | | ✓ | | | 5 |
| `components/booking/steps/StepDone.tsx` | | | | | | | ✓ | | 6 |

---

## `feature/ux-ui-phase2-improvements`

### Task 1 — `task/ux-ui-phase2-Task1-i18n`

Branched from `feature/ux-ui-phase2-improvements`.

**Scope** (planning §7, key additions): add to the SaaS `saas` namespace in all three locale
files (`lib/i18n/locales/en.json`, `it.json`, `de.json`):
- `subscriptionStatus`: `active`, `trialing`, `past_due`, `suspended`, `cancelled`
- a provider-label map for the SMS providers rendered in `platform/sms/index.tsx`

Consumed by Task 3 (`tenants/index.tsx` status pill, `sms/index.tsx` provider label).
**Must merge before Task 3 branches.**

**Verification:**
- `npm run lint` passes
- i18n parity test green — no key in EN missing from IT/DE
- `grep -rn 'subscriptionStatus' frontend/lib/i18n` returns entries in all three files

**Merges to:** `feature/ux-ui-phase2-improvements`

---

### Task 2 — `task/ux-ui-phase2-Task2-appbutton-refactor`

Branched from `feature/ux-ui-phase2-improvements`. File-isolated.

**Scope** (planning §8) — `components/ui/AppButton.tsx`:
- Rewrite as a thin wrapper around `@core/components/ui/AppButton`, layering the
  `useCanWrite` / `skipWriteGate` write-gate on top; delegate variant/focus/sizing/hover to
  core (remove the duplicated bg/text/hover/focus logic).
- Preserve write-gate semantics exactly: `ghost` never gated; `skipWriteGate` opts out;
  gated when `!canWrite && variant !== 'ghost' && !skipWriteGate`.
- Update `docs/TAMAGUI_TOKENS.md` "SaaS-specific UX additions" to drop the "currently
  duplicates core" caveat.

**Verification:**
- `npm run typecheck` passes
- `npm test -- components/ui/AppButton` — gated when `canWrite=false`, `variant!=='ghost'`,
  `skipWriteGate=false`; not gated for `ghost` / `skipWriteGate` / `canWrite=true`;
  delegates `variant`/`onPress`/`loading` to core
- Visual: in a suspended tenant, write buttons disabled at `opacity 0.4`; ghost/`skipWriteGate`
  stay interactive

**Merges to:** `feature/ux-ui-phase2-improvements`

---

### Task 3 — `task/ux-ui-phase2-Task3-platform-admin`

Branched from `feature/ux-ui-phase2-improvements` **after Task 1 merges** (consumes
`subscriptionStatus` + provider labels). Implements planning **§1, §2, §3, §4, §7** for the
platform/settings file set:
- `app/(saas)/platform/tenants/index.tsx` — §1 (wrap list in `CARD_STYLE` + max-width;
  replace local `StatusBadge` :20–30 with core `StatusBadge` pill; anchor filter/sort
  controls in a toolbar strip); §2 (`FOCUS_STYLE` on tappable rows); §3 (`STAFF_MAX_WIDTH`
  page shell); §7 (`t('saas:platform.subscriptionStatus.<status>')` for the badge label,
  remove leftover `STATUS_COLORS`)
- `app/(saas)/platform/tenants/[id]/{index,subscription,lifecycle}.tsx` — §3 (`STAFF_MAX_WIDTH`)
- `app/(saas)/platform/sms/index.tsx` — §3 (`STAFF_MAX_WIDTH`); §7 (translated provider label :30)
- `app/(saas)/platform/sms/{delivery-log,routing}.tsx` — §3 (`STAFF_MAX_WIDTH`)
- `app/(saas)/platform/action-log/index.tsx` — §3 (`STAFF_MAX_WIDTH`); §7 (`→` glyph :40 → icon)
- `app/(saas)/settings/api-keys.tsx` — §4 (migrate the two overlay modals onto core
  `ConfirmDialog` / shared dialog; single scrim); §2 (focus via dialog); §3 (`STAFF_MAX_WIDTH`)
- `components/platform/ConfirmDestructiveModal.tsx` — §4 (migrate onto core `ConfirmDialog`,
  pass slug-confirm body as children; single scrim); §2 (focus via dialog)

Use core page-shell pattern from `ux-ui-phase2-improvements.md` §3; import `CARD_STYLE`,
`FOCUS_STYLE`, `STAFF_MAX_WIDTH` from `@core/constants/styles`; `StatusBadge`/`ConfirmDialog`/
`IconButton` from `@core/components/...`.

**Verification:**
- `npm run typecheck` passes
- `npm test -- app/(saas)/platform` and `app/(saas)/settings/api-keys`
- `grep -rnE 'rgba?\(' app/(saas)/platform app/(saas)/settings/api-keys.tsx components/platform/ConfirmDestructiveModal.tsx` → zero
- Visual: tenant list centred + carded, status as translated pill, controls in toolbar,
  keyboard focus outline on rows; modals via shared dialog single scrim `$5` radius

**Merges to:** `feature/ux-ui-phase2-improvements`

---

### Task 4 — `task/ux-ui-phase2-Task4-billing-quota`

Branched from `feature/ux-ui-phase2-improvements`. Implements planning **§2, §3, §5** for the
billing file set:
- `components/billing/SmsQuotaBlock.tsx`, `components/billing/BookingsQuotaChip.tsx` — §5
  (one shared progress treatment: neutral track + `$brand` fill escalating to
  `$warning`/`$danger`; extract a shared fill/track helper)
- `components/billing/PastDueBanner.tsx` — §5 (rebuild as a danger/warning callout with an
  `AppButton` CTA, `skipWriteGate`); §2 (focus comes from `AppButton`)
- `app/(saas)/billing/index.tsx`, `app/(saas)/billing/upgrade.tsx` — §3 (`PAGE_MAX_WIDTH`
  page shell)

**Verification:**
- `npm run typecheck` passes
- `npm test -- components/billing`
- Visual: both quota bars use one brand→warning→danger treatment; past-due is a danger
  callout with a working "update payment" button (live even in restricted state); billing
  screens centred at `PAGE_MAX_WIDTH`

**Merges to:** `feature/ux-ui-phase2-improvements`

---

### Task 5 — `task/ux-ui-phase2-Task5-floor-sidebar`

Branched from `feature/ux-ui-phase2-improvements`. Implements planning **§2, §6** for:
- `components/floor/RoomTabs.tsx` — §6 (align tab visuals to core `FilterTabs`/
  `SegmentedControl` active-state, or document the divergence in `docs/UX-critique-report.md`;
  replace raw `minWidth`/`height` pixels with tokens/named constants); §2 (`FOCUS_STYLE` on
  both interactive YStacks)
- `components/platform/PlatformSidebarShell.tsx` — §6 (sidebar `width={200}` → `260` or reuse
  core `ResponsiveShell`)

**Verification:**
- `npm run typecheck` passes
- `npm test -- components/floor/RoomTabs components/platform/PlatformSidebarShell`
- Visual: RoomTabs match core tab treatment (or divergence documented); keyboard focus
  outline on tabs; platform sidebar 260px / uses `ResponsiveShell`

**Merges to:** `feature/ux-ui-phase2-improvements`

---

### Task 6 — `task/ux-ui-phase2-Task6-booking-icons`

Branched from `feature/ux-ui-phase2-improvements`. Implements planning **§7** for:
- `components/booking/steps/StepDone.tsx` — replace literal `✓` glyph :93 with an icon
  component; remove inline English `defaultValue` strings :100,112 (rely on the catalog)

**Verification:**
- `npm run typecheck` passes
- `npm test -- components/booking/steps/StepDone`
- `grep -n 'defaultValue:' components/booking/steps/StepDone.tsx` → zero
- Visual: success state uses an icon (no literal glyph); no English leaks under it/de locale

**Merges to:** `feature/ux-ui-phase2-improvements`

---

## Merge chain

```
task/ux-ui-phase2-Task1-i18n                  → feature/ux-ui-phase2-improvements
task/ux-ui-phase2-Task2-appbutton-refactor    → feature/ux-ui-phase2-improvements
task/ux-ui-phase2-Task3-platform-admin        → feature/ux-ui-phase2-improvements   (after Task 1)
task/ux-ui-phase2-Task4-billing-quota         → feature/ux-ui-phase2-improvements
task/ux-ui-phase2-Task5-floor-sidebar         → feature/ux-ui-phase2-improvements
task/ux-ui-phase2-Task6-booking-icons         → feature/ux-ui-phase2-improvements

feature/ux-ui-phase2-improvements → feature/ux-ui-improvements

feature/ux-ui-improvements → develop        # final integration, after Phase 1 + Phase 2
```

Task 1 must merge before Task 3 branches (Task 3 consumes the new i18n keys). Tasks 2, 4, 5,
and 6 are file-disjoint from each other and from Task 1/3 — they may be worked in parallel
immediately after the feature branch is cut. Before merging into `feature/ux-ui-improvements`,
run the **global concern gates** (Quality Gates) to prove no raw scrims or English leaks remain.

Once both phases are merged into `feature/ux-ui-improvements` and the full suite passes there,
`feature/ux-ui-improvements` is merged into `develop` as the single integration point.
