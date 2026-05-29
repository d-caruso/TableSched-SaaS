import { useState } from 'react';
import { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Input } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { useSmsDeliveryLog, SmsDeliveryLogEntry } from '@saas/lib/api/sms';

export function maskPhone(phone: string): string {
  if (!phone.startsWith('+') || phone.length < 6) return phone;
  return `${phone.slice(0, 3)}…${phone.slice(-4)}`;
}

function statusColor(status: SmsDeliveryLogEntry['status']): string {
  if (status === 'delivered') return '$green9';
  if (status === 'pending') return '$orange9';
  return '$red9';
}

const STATUS_OPTIONS = ['all', 'pending', 'delivered', 'failed'];
const PROVIDER_OPTIONS = ['all', 'twilio', 'infobip', 'smsapi'];

function DeliveryLogRow({ entry }: { entry: SmsDeliveryLogEntry }) {
  const { t } = useTranslation();
  const d = new Date(entry.sent_at);
  const date = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  const color = statusColor(entry.status);

  return (
    <XStack
      padding="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      gap="$3"
      flexWrap="wrap"
      testID={`log-row-${entry.id}`}
    >
      <Text fontSize="$2" color="$colorSubtle" testID={`row-date-${entry.id}`}>{date}</Text>
      <Text fontSize="$2" testID={`row-phone-${entry.id}`}>{maskPhone(entry.phone)}</Text>
      <Text fontSize="$2" testID={`row-provider-${entry.id}`}>{entry.provider}</Text>
      <XStack
        backgroundColor={color}
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$2"
        testID={`row-status-${entry.id}`}
      >
        <Text fontSize="$2" color="white">{t(`saas:platform.sms.status${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}`)}</Text>
      </XStack>
      {entry.error_code !== '' && (
        <Text fontSize="$2" color="$red9" testID={`row-error-${entry.id}`}>
          {t('saas:platform.sms.errorCode')}: {entry.error_code}
        </Text>
      )}
    </XStack>
  );
}

export default function SmsDeliveryLogScreen() {
  const { t } = useTranslation();
  const [provider, setProvider] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSmsDeliveryLog({
    provider: provider !== 'all' ? provider : undefined,
    status: status !== 'all' ? status : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const entries = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <YStack flex={1} padding="$3" gap="$3" testID="delivery-log-screen">
      <Text fontSize="$6" fontWeight="700">{t('saas:platform.sms.deliveryLogTitle')}</Text>

      <XStack gap="$2" flexWrap="wrap">
        <YStack gap="$1">
          <Text fontSize="$2">{t('saas:platform.sms.filterProvider')}</Text>
          <XStack gap="$1">
            {PROVIDER_OPTIONS.map((opt) => (
              <AppButton
                key={opt}
                variant={provider === opt ? 'primary' : 'ghost'}
                skipWriteGate
                onPress={() => setProvider(opt)}
                testID={`filter-provider-${opt}`}
              >
                {opt}
              </AppButton>
            ))}
          </XStack>
        </YStack>

        <YStack gap="$1">
          <Text fontSize="$2">{t('saas:platform.sms.filterStatus')}</Text>
          <XStack gap="$1">
            {STATUS_OPTIONS.map((opt) => (
              <AppButton
                key={opt}
                variant={status === opt ? 'primary' : 'ghost'}
                skipWriteGate
                onPress={() => setStatus(opt)}
                testID={`filter-status-${opt}`}
              >
                {opt}
              </AppButton>
            ))}
          </XStack>
        </YStack>

        <Input
          value={dateFrom}
          onChangeText={setDateFrom}
          placeholder={t('saas:platform.sms.filterDateFrom')}
          testID="filter-date-from"
        />
        <Input
          value={dateTo}
          onChangeText={setDateTo}
          placeholder={t('saas:platform.sms.filterDateTo')}
          testID="filter-date-to"
        />
      </XStack>

      {entries.length === 0 ? (
        <Text color="$colorSubtle" testID="delivery-log-empty">
          {t('saas:platform.sms.deliveryLogEmpty')}
        </Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DeliveryLogRow entry={item} />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          testID="delivery-log-list"
        />
      )}
    </YStack>
  );
}
