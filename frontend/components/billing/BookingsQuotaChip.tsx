import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { useSubscription } from '@saas/lib/api/billing';
import { QuotaBar } from './QuotaBar';

function getVariant(used: number, cap: number): 'neutral' | 'warning' | 'error' {
  const pct = used / cap;
  if (pct >= 1) return 'error';
  if (pct >= 0.8) return 'warning';
  return 'neutral';
}

// Text colour escalates with the quota state; the bar itself uses the shared
// QuotaBar treatment (brand → warning → danger).
const VARIANT_COLORS = {
  neutral: '$colorSubtle',
  warning: '$warning',
  error:   '$dangerText',
} as const;

export function BookingsQuotaChip() {
  const { t } = useTranslation();
  const { data } = useSubscription();

  if (!data) return null;
  if (data.limits.max_bookings_per_month === null) return null;

  const cap = data.limits.max_bookings_per_month;
  const used = data.usage.bookings_this_month;
  const variant = getVariant(used, cap);

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
      <QuotaBar ratio={used / cap} />
      {variant === 'error' && (
        <Text fontSize="$2" color="$dangerText">
          {t('saas:limits.bookingsReached', { cap })}
        </Text>
      )}
    </YStack>
  );
}
