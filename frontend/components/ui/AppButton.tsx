import type { ComponentProps } from 'react';
import type { FontSizeTokens } from 'tamagui';
import { Button, SizableText, Spinner, XStack } from 'tamagui';
import { PRIMARY_ACTION_MIN_HEIGHT } from '@core/constants/styles';
import { useCanWrite } from '@saas/lib/lifecycle';

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type AppButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'col'> & {
  variant?: AppButtonVariant;
  loading?: boolean;
  color?: string;
  fontSize?: FontSizeTokens | number;
  /** When true, skips the write-gate check (e.g. read-only actions like cancel). */
  skipWriteGate?: boolean;
};

const PRIMARY_HOVER_STYLE   = { backgroundColor: '$brandDark'   } as const;
const SECONDARY_HOVER_STYLE = { backgroundColor: '$brandSubtle' } as const;
const DANGER_HOVER_STYLE    = { opacity: 0.85 } as const;

const FOCUS_STYLE = {
  outlineWidth: 2,
  outlineColor: '$brand',
  outlineStyle: 'solid',
  outlineOffset: 2,
} as const;

function bgColor(variant: AppButtonVariant): string {
  if (variant === 'primary')   return '$brand';
  if (variant === 'secondary') return '$background';
  if (variant === 'danger')    return '$danger';
  return 'transparent';
}

function textColor(variant: AppButtonVariant): string {
  if (variant === 'secondary') return '$brand';
  if (variant === 'ghost')     return '$brand';
  return '$background';
}

function hoverStyle(variant: AppButtonVariant) {
  if (variant === 'secondary') return SECONDARY_HOVER_STYLE;
  if (variant === 'danger')    return DANGER_HOVER_STYLE;
  return PRIMARY_HOVER_STYLE;
}

export function AppButton({
  variant = 'primary',
  loading,
  children,
  color,
  fontSize,
  skipWriteGate = false,
  ...props
}: AppButtonProps) {
  const canWrite = useCanWrite();
  const writeGated = !skipWriteGate && !canWrite && variant !== 'ghost';
  const disabled = loading || props.disabled || writeGated;
  const isSecondary = variant === 'secondary';
  const isPrimary   = variant === 'primary';
  const fg = color ?? textColor(variant);

  return (
    <Button
      backgroundColor={bgColor(variant)}
      borderColor={isSecondary ? '$brand' : undefined}
      borderWidth={isSecondary ? 1 : undefined}
      minHeight={(isPrimary || isSecondary) ? PRIMARY_ACTION_MIN_HEIGHT : undefined}
      {...props}
      hoverStyle={props.hoverStyle ?? hoverStyle(variant)}
      focusStyle={props.focusStyle ?? FOCUS_STYLE}
      disabled={disabled}
      opacity={disabled ? 0.4 : 1}
      borderRadius="$4"
    >
      {loading ? (
        <XStack gap="$2" alignItems="center">
          <Spinner size="small" color={fg} />
          <SizableText col={fg} fontWeight="$6" fontSize={fontSize}>{children}</SizableText>
        </XStack>
      ) : (
        <SizableText col={fg} fontWeight="$6" fontSize={fontSize}>{children}</SizableText>
      )}
    </Button>
  );
}
