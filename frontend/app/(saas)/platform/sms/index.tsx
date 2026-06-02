import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { CARD_STYLE, STAFF_MAX_WIDTH } from '@core/constants/styles';
import { useSmsProviderHealth, ProviderHealth } from '@saas/lib/api/sms';

export function healthColor(rate: number): string {
  if (rate >= 0.9) return '$success';
  if (rate >= 0.7) return '$warning';
  return '$danger';
}

function ProviderCard({ item }: { item: ProviderHealth }) {
  const { t } = useTranslation();
  const color = healthColor(item.delivery_rate);
  const pct = Math.round(item.delivery_rate * 100);
  const label =
    item.status === 'healthy'
      ? t('saas:platform.sms.providerHealthy')
      : t('saas:platform.sms.providerDegraded');

  return (
    <YStack
      {...CARD_STYLE}
      gap="$2"
      testID={`provider-card-${item.provider}`}
    >
      <Text fontWeight="$7" fontSize="$4">
        {t(`saas:platform.sms.providerLabels.${item.provider}`, item.provider)}
      </Text>

      {/* Progress bar */}
      <XStack height={8} borderRadius="$2" backgroundColor="$borderColor" testID={`bar-track-${item.provider}`}>
        <XStack
          height={8}
          borderRadius="$2"
          backgroundColor={color}
          width={`${pct}%` as `${number}%`}
          testID={`bar-fill-${item.provider}`}
        />
      </XStack>

      <XStack gap="$3" alignItems="center">
        <Text fontSize="$3" fontWeight="$7" testID={`rate-${item.provider}`}>
          {t('saas:platform.sms.deliveryRate')}: {pct}%
        </Text>
        <XStack
          backgroundColor={color}
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
          testID={`badge-${item.provider}`}
        >
          <Text fontSize="$2" color="$background">{label}</Text>
        </XStack>
        <Text fontSize="$2" color="$colorSubtle" testID={`sent-${item.provider}`}>
          {t('saas:platform.sms.totalSent')}: {item.total_sent}
        </Text>
      </XStack>
    </YStack>
  );
}

export default function SmsHealthScreen() {
  const { t } = useTranslation();
  const { data } = useSmsProviderHealth();
  const providers = data ?? [];

  return (
    <ScrollView testID="sms-health-screen">
      <YStack alignItems="center" paddingVertical="$6" paddingHorizontal="$4">
        <YStack maxWidth={STAFF_MAX_WIDTH} width="100%" gap="$3">
          <Text fontSize="$6" fontWeight="$7">{t('saas:platform.sms.healthTitle')}</Text>
          <Text fontSize="$3" color="$colorSubtle">{t('saas:platform.sms.healthSubtitle')}</Text>

          {providers.length === 0 ? (
            <Text color="$colorSubtle" testID="health-empty">—</Text>
          ) : (
            providers.map((item) => (
              <ProviderCard key={item.provider} item={item} />
            ))
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}
