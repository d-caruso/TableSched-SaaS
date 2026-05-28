import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { useSubscription } from '@saas/lib/api/billing';

function getVariant(used: number, cap: number): 'neutral' | 'warning' | 'error' {
  const pct = used / cap;
  if (pct >= 1) return 'error';
  if (pct >= 0.8) return 'warning';
  return 'neutral';
}

const VARIANT_COLORS = {
  neutral: '$color10',
  warning: '$orange10',
  error:   '$red10',
} as const;

const TRACK_COLORS = {
  neutral: '$green5',
  warning: '$orange5',
  error:   '$red5',
} as const;

const FILL_COLORS = {
  neutral: '$green9',
  warning: '$orange9',
  error:   '$red9',
} as const;

export function BookingsQuotaChip() {
  const { t } = useTranslation();
  const { data } = useSubscription();

  if (!data) return null;
  if (data.limits.max_bookings_per_month === null) return null;

  const cap = data.limits.max_bookings_per_month;
  const used = data.usage.bookings_this_month;
  const variant = getVariant(used, cap);
  const pct = Math.min(used / cap, 1);

  return (
    <YStack gap="$1" testID="bookings-quota-chip">
      <XStack justifyContent="space-between">
        <Text fontSize="$3" color={VARIANT_COLORS[variant]}>
          {t('saas:billing.bookingsThisMonth')}
        </Text>
        <Text fontSize="$3" color={VARIANT_COLORS[variant]}>
          {used} / {cap}
        </Text>
      </XStack>
      <YStack
        height={6}
        borderRadius={3}
        backgroundColor={TRACK_COLORS[variant]}
        overflow="hidden"
      >
        <YStack
          height={6}
          borderRadius={3}
          backgroundColor={FILL_COLORS[variant]}
          width={`${Math.round(pct * 100)}%` as `${number}%`}
        />
      </YStack>
      {variant === 'error' && (
        <Text fontSize="$2" color="$red10">
          {t('saas:limits.locationsReached', { cap })}
        </Text>
      )}
    </YStack>
  );
}
