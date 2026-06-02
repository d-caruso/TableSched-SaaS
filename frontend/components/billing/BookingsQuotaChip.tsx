import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { useSubscription } from '@saas/lib/api/billing';
import { QuotaBar, quotaLevel, type QuotaLevel } from './QuotaBar';

// Text colour escalates with the quota state, keyed off the same `quotaLevel`
// thresholds the bar fill uses, so text and bar never disagree.
const TEXT_COLORS: Record<QuotaLevel, string> = {
  ok:      '$colorSubtle',
  warning: '$warning',
  danger:  '$dangerText',
};

export function BookingsQuotaChip() {
  const { t } = useTranslation();
  const { data } = useSubscription();

  if (!data) return null;
  if (data.limits.max_bookings_per_month === null) return null;

  const cap = data.limits.max_bookings_per_month;
  const used = data.usage.bookings_this_month;
  const level = quotaLevel(used / cap);

  return (
    <YStack gap="$1" testID="bookings-quota-chip">
      <XStack justifyContent="space-between">
        <Text fontSize="$3" color={TEXT_COLORS[level]}>
          {t('saas:billing.bookingsThisMonth')}
        </Text>
        <Text fontSize="$3" color={TEXT_COLORS[level]}>
          {used} / {cap}
        </Text>
      </XStack>
      <QuotaBar ratio={used / cap} />
      {level === 'danger' && (
        <Text fontSize="$2" color="$dangerText">
          {t('saas:limits.bookingsReached', { cap })}
        </Text>
      )}
    </YStack>
  );
}
