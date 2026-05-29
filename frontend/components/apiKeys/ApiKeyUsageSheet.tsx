import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { useApiKeyUsage, ApiKeyUsageMonth } from '@saas/lib/api/apiKeys';

const HOURLY_LIMIT = 100;
const DAILY_LIMIT = 1000;

type Props = { keyId: string; keyName: string; onClose: () => void };

export function ApiKeyUsageSheet({ keyId, keyName, onClose }: Props) {
  const { t } = useTranslation();
  const { data: months = [], isLoading } = useApiKeyUsage(keyId);

  const sorted = [...months].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      padding="$4"
      gap="$3"
      testID="usage-sheet"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="700">
          {t('saas:apiKeys.usageTitle')} — {keyName}
        </Text>
        <AppButton variant="ghost" skipWriteGate onPress={onClose} testID="usage-close-btn">
          {t('saas:common.close')}
        </AppButton>
      </XStack>

      {isLoading ? (
        <Text>{t('saas:common.loading')}</Text>
      ) : sorted.length === 0 ? (
        <Text color="$colorSubtle" testID="usage-empty">
          {t('saas:apiKeys.lastUsedNever')}
        </Text>
      ) : (
        <ScrollView testID="usage-list">
          {sorted.map((row: ApiKeyUsageMonth, i) => (
            <XStack
              key={`${row.year}-${row.month}`}
              paddingVertical="$2"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              justifyContent="space-between"
              testID={`usage-row-${row.year}-${row.month}`}
            >
              <Text>
                {i === 0
                  ? t('saas:apiKeys.usageThisMonth')
                  : `${row.year}-${String(row.month).padStart(2, '0')}`}
              </Text>
              <Text fontWeight="600">
                {t('saas:apiKeys.callCount', { count: row.call_count })}
              </Text>
            </XStack>
          ))}
        </ScrollView>
      )}

      <YStack gap="$1" marginTop="$2" testID="limits-block">
        <Text fontWeight="600">{t('saas:apiKeys.limitsTitle')}</Text>
        <Text>{t('saas:apiKeys.limitsDetail', { hourly: HOURLY_LIMIT, daily: DAILY_LIMIT })}</Text>
      </YStack>
    </YStack>
  );
}
