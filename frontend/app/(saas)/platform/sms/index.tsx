import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSmsProviderHealth, ProviderHealth } from '@saas/lib/api/sms';

export function healthColor(rate: number): string {
  if (rate >= 0.9) return '$green9';
  if (rate >= 0.7) return '$orange9';
  return '$red9';
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
      padding="$3"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      gap="$2"
      testID={`provider-card-${item.provider}`}
    >
      <Text fontWeight="700" fontSize="$4" textTransform="capitalize">
        {item.provider}
      </Text>

      {/* Progress bar */}
      <XStack height={8} borderRadius="$2" backgroundColor="$color4" testID={`bar-track-${item.provider}`}>
        <XStack
          height={8}
          borderRadius="$2"
          backgroundColor={color}
          width={`${pct}%` as `${number}%`}
          testID={`bar-fill-${item.provider}`}
        />
      </XStack>

      <XStack gap="$3" alignItems="center">
        <Text fontSize="$3" fontWeight="600" testID={`rate-${item.provider}`}>
          {pct}%
        </Text>
        <Text
          fontSize="$2"
          color={color}
          testID={`badge-${item.provider}`}
        >
          {label}
        </Text>
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
      <YStack padding="$3" gap="$3">
        <Text fontSize="$6" fontWeight="700">{t('saas:platform.sms.healthTitle')}</Text>
        <Text fontSize="$3" color="$colorSubtle">{t('saas:platform.sms.healthSubtitle')}</Text>

        {providers.length === 0 ? (
          <Text color="$colorSubtle" testID="health-empty">—</Text>
        ) : (
          providers.map((item) => (
            <ProviderCard key={item.provider} item={item} />
          ))
        )}
      </YStack>
    </ScrollView>
  );
}
