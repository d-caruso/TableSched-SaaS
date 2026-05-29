import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSmsRoutingTable, RoutingEntry } from '@saas/lib/api/sms';

function RoutingRow({ entry }: { entry: RoutingEntry }) {
  const { t } = useTranslation();
  const prefixLabel =
    entry.prefix === 'default' ? t('saas:platform.sms.routingDefault') : entry.prefix;
  const chain = entry.providers.join(' → ');

  return (
    <XStack
      padding="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      gap="$4"
      testID={`routing-row-${entry.prefix}`}
    >
      <Text fontSize="$3" fontWeight="600" minWidth={80} testID={`routing-prefix-${entry.prefix}`}>
        {prefixLabel}
      </Text>
      <Text fontSize="$3" testID={`routing-chain-${entry.prefix}`}>
        {chain}
      </Text>
    </XStack>
  );
}

export default function SmsRoutingScreen() {
  const { t } = useTranslation();
  const { data } = useSmsRoutingTable();

  const entries = data ?? [];
  const sorted = [
    ...entries.filter((e) => e.prefix !== 'default'),
    ...entries.filter((e) => e.prefix === 'default'),
  ];

  return (
    <ScrollView testID="sms-routing-screen">
      <YStack padding="$3" gap="$3">
        <Text fontSize="$6" fontWeight="700">{t('saas:platform.sms.routingTitle')}</Text>

        {sorted.length === 0 ? (
          <Text color="$colorSubtle" testID="routing-empty">
            {t('saas:platform.sms.routingEmpty')}
          </Text>
        ) : (
          sorted.map((entry) => <RoutingRow key={entry.prefix} entry={entry} />)
        )}
      </YStack>
    </ScrollView>
  );
}
