import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { CARD_STYLE } from '@core/constants/styles';
import { useSubscription } from '@saas/lib/api/billing';
import { QuotaBar, quotaLevel, QUOTA_TEXT_COLOR } from './QuotaBar';

export function SmsQuotaBlock() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useSubscription();

  if (!data) return null;

  // Free plan: no SMS entitlement
  if (data.limits.sms_daily_quota === null) {
    return (
      <YStack
        {...CARD_STYLE}
        gap="$2"
        testID="sms-quota-block"
      >
        <Text fontSize="$4" fontWeight="$7">{t('saas:sms.quotaTitle')}</Text>
        <Text fontSize="$3" color="$placeholderColor">{t('saas:sms.notIncluded')}</Text>
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
  const level = quotaLevel(used / quota);

  return (
    <YStack
      {...CARD_STYLE}
      gap="$2"
      testID="sms-quota-block"
    >
      <Text fontSize="$4" fontWeight="$7">{t('saas:sms.quotaTitle')}</Text>

      <XStack justifyContent="space-between">
        <Text fontSize="$3" color={QUOTA_TEXT_COLOR[level]}>{t('saas:billing.smsToday')}</Text>
        <Text fontSize="$3" color={QUOTA_TEXT_COLOR[level]}>{used} / {quota}</Text>
      </XStack>

      <QuotaBar ratio={used / quota} />

      <Text fontSize="$2" color="$placeholderColor">{t('saas:sms.poolResetNote')}</Text>

      {overage > 0 && (
        <Text fontSize="$2" color="$warning">
          {t('saas:sms.overageActive', { extra: overage })}
        </Text>
      )}
    </YStack>
  );
}
