import { YStack } from 'tamagui';

// Neutral track shared by every quota bar.
export const QUOTA_TRACK_COLOR = '$borderColor';

/**
 * Shared quota-progress treatment: a `$brand` fill that escalates to
 * `$warning` then `$danger` as usage approaches and passes the cap. `ratio`
 * is the uncapped used/cap value, so overage (ratio ≥ 1) reads as danger.
 */
export function quotaFillColor(ratio: number): string {
  if (ratio >= 1) return '$danger';
  if (ratio >= 0.8) return '$warning';
  return '$brand';
}

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
