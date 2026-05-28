import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { useSubscription } from '@saas/lib/api/billing';

export function SmsQuotaBlock() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useSubscription();

  if (!data) return null;

  // Free plan: no SMS entitlement
  if (data.limits.sms_daily_quota === null) {
    return (
      <YStack
        backgroundColor="$background"
        borderRadius="$3"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$3"
        gap="$2"
        testID="sms-quota-block"
      >
        <Text fontSize="$4" fontWeight="600">{t('saas:sms.quotaTitle')}</Text>
        <Text fontSize="$3" color="$color10">{t('saas:sms.notIncluded')}</Text>
        <AppButton
          variant="secondary"
          alignSelf="flex-start"
          onPress={() => router.push('/(saas)/billing/upgrade')}
        >
          {t('saas:sms.upgradeCta')}
        </AppButton>
      </YStack>
    );
  }

  const quota = data.limits.sms_daily_quota;
  const used = data.usage.sms_today;
  const overage = Math.max(0, used - quota);
  const pct = Math.min(used / quota, 1);

  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      padding="$3"
      gap="$2"
      testID="sms-quota-block"
    >
      <Text fontSize="$4" fontWeight="600">{t('saas:sms.quotaTitle')}</Text>

      <XStack justifyContent="space-between">
        <Text fontSize="$3" color="$color10">{t('saas:billing.smsToday')}</Text>
        <Text fontSize="$3">{used} / {quota}</Text>
      </XStack>

      <YStack height={6} borderRadius={3} backgroundColor="$blue5" overflow="hidden">
        <YStack
          height={6}
          borderRadius={3}
          backgroundColor={overage > 0 ? '$orange9' : '$blue9'}
          width={`${Math.round(pct * 100)}%` as `${number}%`}
        />
      </YStack>

      <Text fontSize="$2" color="$color10">{t('saas:sms.poolResetNote')}</Text>

      {overage > 0 && (
        <Text fontSize="$2" color="$orange10">
          {t('saas:sms.overageActive', { extra: overage })}
        </Text>
      )}
    </YStack>
  );
}
