import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { useSubscription } from '@saas/lib/api/billing';
import { QuotaBar, quotaLevel, QUOTA_TEXT_COLOR } from './QuotaBar';

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
        <Text fontSize="$3" color={QUOTA_TEXT_COLOR[level]}>
          {t('saas:billing.bookingsThisMonth')}
        </Text>
        <Text fontSize="$3" color={QUOTA_TEXT_COLOR[level]}>
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
