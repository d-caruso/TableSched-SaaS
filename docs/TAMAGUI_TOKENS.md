# TableSched SaaS — Tamagui Token Reference

The SaaS module **does not define its own design tokens.** It reuses the core
TableSched Tamagui config, palette, and style constants via the `@core/*` path
alias (resolving to `node_modules/tablesched-frontend`).

## Canonical reference

All color, typography, spacing, radius, layout, and palette tokens are defined
and documented in core. **Read the canonical reference — it is authoritative:**

- **`~/Projects/TableSched/docs/TAMAGUI_TOKENS.md`** — full token reference
- `~/Projects/TableSched/frontend/.interface-design/system.md` — machine-readable design system

Everything in that reference applies unchanged to this module:

- Color tokens (`$brand`, `$danger`, `$dangerText`, `$success`, `$warning`, …)
- The rule: **never use Tamagui built-in ramps** (`$red9`, `$orange9`, `$blue9`, `$green9`, `$gray9`, `$color10`, …) — use semantic tokens.
- Typography scale and weight tokens (`fontWeight="$7"` for bold, `$8` extra-bold — never raw `"600"`/`"700"`).
- Spacing / border-radius `$` scale; pills use `borderRadius={99}`.
- Shared style constants from `@core/constants/styles`: `CARD_STYLE`, `FIELD_LABEL_STYLE`, `FOCUS_STYLE`, `PRESS_STYLE`, `PRIMARY_ACTION_MIN_HEIGHT`, `PAGE_MAX_WIDTH`, `STAFF_MAX_WIDTH`, `AUTH_MAX_WIDTH`, `SETTINGS_TEXT_MAX_WIDTH`.
- Borders-first depth strategy; shadows reserved for floating elements.

## How tokens are wired in SaaS

`frontend/tamagui.config.ts` re-creates the Tamagui config from
`@core/constants/palette`, registering the same custom color tokens and the same
light/dark theme objects as core. There are **no SaaS-specific tokens, themes, or
style constants.** If a value isn't in the core reference, it should not be in
SaaS code.

---

## SaaS-specific UX/UI additions

The SaaS module introduces no new *tokens*, but it adds the following
*behavioural* UX rules on top of the core components. These are the only
sanctioned deviations.

### Write-gated `AppButton`

`frontend/components/ui/AppButton.tsx` extends the core `AppButton` API with a
write-gate driven by tenant lifecycle state (`useCanWrite`):

| Prop | Default | Effect |
|------|---------|--------|
| `skipWriteGate` | `false` | When `false`, the button is auto-disabled (rendered at `opacity 0.4`) if the tenant is read-only — **except** `variant="ghost"`, which is always interactive (used for read-only/navigation actions). Set `true` to opt out (e.g. cancel, navigation, platform-admin actions). |

All other visual props, variants, focus ring, and sizing are identical to core
`AppButton`. Use `skipWriteGate` for any control that must stay live in a
read-only (suspended/cancelled/past-due) tenant.

> **Note:** this component is a thin wrapper around core `AppButton` — it
> delegates all variant/focus/sizing/loading behaviour to core and only layers
> the write-gate on top, so token and variant behaviour stay in lockstep
> automatically.

### Lifecycle shell surfaces

`components/lifecycle/*` (`SuspendedShell`, `CancelledShell`, `RootShell`,
`ReactivationToast`) gate the whole app on tenant lifecycle state. They must use
the core **danger/warning callout tokens** (`$dangerSubtle` / `$dangerBorder` /
`$dangerText`, or `$warning`) — never built-in red/orange ramps.

### Quota / usage indicators

Billing components (`BookingsQuotaChip`, `SmsQuotaBlock`, `PastDueBanner`) display
usage toward plan limits. Standard treatment: neutral track + `$brand` fill,
escalating to `$warning` then `$danger` as the cap is approached. Do not invent
per-component color ramps.

---

*For the current gap list between SaaS implementation and this baseline, see
`docs/UX-critique-report.md`.*
</content>
