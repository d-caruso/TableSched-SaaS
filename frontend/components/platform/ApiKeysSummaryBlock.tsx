import { useTranslation } from 'react-i18next';
import { YStack, Text } from 'tamagui';
import { usePlatformApiKeysSummary } from '@saas/lib/api/platform';

type Props = { tenantId: number; tier: string };

export function ApiKeysSummaryBlock({ tenantId, tier }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = usePlatformApiKeysSummary(tenantId, tier);

  if (tier !== 'enterprise') return null;
  if (isLoading || !data) return null;

  return (
    <YStack gap="$1" testID="api-keys-summary-block">
      <Text fontWeight="600">{t('saas:platform.tenant.apiKeysSummaryTitle')}</Text>
      <Text>
        {t('saas:platform.tenant.apiKeysSummaryActiveCount', {
          count: data.active_count,
        })}
      </Text>
      {data.active_count === 0 ? (
        <Text color="$colorSubtle" testID="api-keys-summary-empty">
          {t('saas:platform.tenant.noActiveKeys')}
        </Text>
      ) : data.most_recent_key_name && data.most_recent_used_at ? (
        <Text testID="api-keys-summary-recent">
          {t('saas:platform.tenant.apiKeysSummaryRecent', {
            name: data.most_recent_key_name,
            date: new Date(data.most_recent_used_at).toLocaleDateString(),
          })}
        </Text>
      ) : null}
    </YStack>
  );
}
