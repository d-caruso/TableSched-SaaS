import { config as v3Config } from '@tamagui/config/v3';
import { createTamagui } from 'tamagui';
import { PALETTE } from '@/constants/palette';

// ── Extended colour tokens ────────────────────────────────────────────────────
// Tokens are static resolved values — they're available everywhere as e.g.
// `$brand`, `$danger`. Registering them here makes them type-safe via the
// TamaguiCustomConfig module augmentation below.

const extendedColors = {
  ...v3Config.tokens.color,
  brand:        PALETTE.brand,
  brandDark:    PALETTE.brandDark,
  brandLight:   PALETTE.brandLight,
  brandSubtle:  PALETTE.brandSubtle,
  secondary:    PALETTE.secondary,
  danger:       PALETTE.danger,
  dangerSubtle: PALETTE.dangerSubtle,
  dangerBorder: PALETTE.dangerBorder,
  warning:      PALETTE.warning,
  success:      PALETTE.success,
  sectionLabel: PALETTE.sectionLabel,
  inputBorder:  PALETTE.inputBorder,
  removeButton: PALETTE.removeButton,
};

// ── Theme objects ─────────────────────────────────────────────────────────────
// FIX: wire brand tokens into a Theme so components using $brand / $danger /
// $success respond correctly to theme switching. Without this, the tokens are
// static values that don't update when the active theme changes — meaning any
// future dark mode will leave $brand as the same blue in both modes.

const lightTheme = {
  ...v3Config.themes.light,
  brand:        PALETTE.brand,
  brandDark:    PALETTE.brandDark,
  brandLight:   PALETTE.brandLight,
  brandSubtle:  PALETTE.brandSubtle,
  danger:       PALETTE.danger,
  dangerSubtle: PALETTE.dangerSubtle,
  dangerBorder: PALETTE.dangerBorder,
  success:      PALETTE.success,
  warning:      PALETTE.warning,
  sectionLabel: PALETTE.sectionLabel,
};

const darkTheme = {
  ...v3Config.themes.dark,
  brand:        PALETTE.brandLight,
  brandDark:    PALETTE.brand,
  brandLight:   PALETTE.brandLight,
  brandSubtle:  PALETTE.brandDark,
  danger:       PALETTE.danger,
  dangerSubtle: PALETTE.dangerSubtle,
  dangerBorder: PALETTE.dangerBorder,
  success:      PALETTE.success,
  warning:      PALETTE.warning,
  sectionLabel: PALETTE.sectionLabel,
};

// ── Config ────────────────────────────────────────────────────────────────────

export const config = createTamagui({
  ...v3Config,
  tokens: {
    ...v3Config.tokens,
    color: extendedColors,
  },
  themes: {
    light: lightTheme,
    dark:  darkTheme,
  },
});

// ── Module augmentation ───────────────────────────────────────────────────────
// Gives TypeScript autocomplete for all custom tokens and theme values.

export const tamaguiConfig = config;

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
