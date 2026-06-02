import { YStack } from 'tamagui';

// Neutral track shared by every quota bar.
export const QUOTA_TRACK_COLOR = '$borderColor';

export type QuotaLevel = 'ok' | 'warning' | 'danger';

/**
 * Single source of truth for the quota escalation thresholds. `ratio` is the
 * uncapped used/cap value, so overage (ratio ≥ 1) reads as danger. Both the
 * bar fill (`quotaFillColor`) and any surrounding text colour derive from this,
 * so the bar and its labels never disagree.
 */
export function quotaLevel(ratio: number): QuotaLevel {
  if (ratio >= 1) return 'danger';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}

const FILL_COLOR: Record<QuotaLevel, string> = {
  ok: '$brand',
  warning: '$warning',
  danger: '$danger',
};

/** Bar fill colour for the given usage ratio (`$brand` → `$warning` → `$danger`). */
export function quotaFillColor(ratio: number): string {
  return FILL_COLOR[quotaLevel(ratio)];
}

/** Usage-text colour shared by every quota block, keyed off the same level. */
export const QUOTA_TEXT_COLOR: Record<QuotaLevel, string> = {
  ok:      '$colorSubtle',
  warning: '$warning',
  danger:  '$dangerText',
};

type Props = { ratio: number; testID?: string };

export function QuotaBar({ ratio, testID }: Props) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return (
    <YStack
      height={6}
      borderRadius="$2"
      backgroundColor={QUOTA_TRACK_COLOR}
      overflow="hidden"
      testID={testID}
    >
      <YStack
        height={6}
        borderRadius="$2"
        backgroundColor={quotaFillColor(ratio)}
        width={`${Math.round(clamped * 100)}%` as `${number}%`}
      />
    </YStack>
  );
}
