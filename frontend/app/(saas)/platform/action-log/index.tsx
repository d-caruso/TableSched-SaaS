import { useState } from 'react';
import { FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Input } from 'tamagui';
import { STAFF_MAX_WIDTH } from '@core/constants/styles';
import { PALETTE } from '@core/constants/palette';
import { AppButton } from '@saas/components/ui/AppButton';
import { usePlatformActionLog, PlatformActionLogEntry } from '@saas/lib/api/platform';

function DetailBlock({ detail }: { detail: Record<string, unknown> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <YStack>
      <AppButton variant="ghost" skipWriteGate onPress={() => setOpen((v) => !v)} testID="detail-toggle">
        {open ? t('saas:platform.actionLog.hideDetail') : t('saas:platform.actionLog.showDetail')}
      </AppButton>
      {open && (
        <Text fontFamily="monospace" fontSize="$1" testID="detail-json">
          {JSON.stringify(detail, null, 2)}
        </Text>
      )}
    </YStack>
  );
}

function ActionLogRow({ entry }: { entry: PlatformActionLogEntry }) {
  const date = new Date(entry.created_at).toLocaleString();
  return (
    <YStack
      padding="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      gap="$1"
      testID={`action-log-row-${entry.id}`}
    >
      <XStack gap="$3">
        <Text fontSize="$2" color="$colorSubtle">{date}</Text>
        <Text fontWeight="$7">{entry.action}</Text>
        <Text>{entry.actor_email}</Text>
        {entry.target_tenant_slug && (
          <XStack gap="$1" alignItems="center">
            <Ionicons
              name="arrow-forward"
              size={14}
              color={PALETTE.statusNeutralFg}
              testID={`action-log-arrow-${entry.id}`}
            />
            <Text color="$colorSubtle">{entry.target_tenant_slug}</Text>
          </XStack>
        )}
      </XStack>
      <DetailBlock detail={entry.detail} />
    </YStack>
  );
}

export default function ActionLogScreen() {
  const { t } = useTranslation();
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [tenant, setTenant] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePlatformActionLog({
    actor: actor || undefined,
    action: action || undefined,
    tenant: tenant || undefined,
  });

  const entries = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <YStack
      flex={1}
      alignItems="center"
      paddingVertical="$6"
      paddingHorizontal="$4"
      testID="action-log-screen"
    >
      <YStack maxWidth={STAFF_MAX_WIDTH} width="100%" flex={1} gap="$3">
        <Text fontSize="$6" fontWeight="$7">{t('saas:platform.actionLog.title')}</Text>

        <XStack gap="$2" flexWrap="wrap">
          <Input
            value={actor}
            onChangeText={setActor}
            placeholder={t('saas:platform.actionLog.filterActorPlaceholder')}
            flex={1}
            testID="filter-actor"
          />
          <Input
            value={action}
            onChangeText={setAction}
            placeholder={t('saas:platform.actionLog.filterActionPlaceholder')}
            flex={1}
            testID="filter-action"
          />
          <Input
            value={tenant}
            onChangeText={setTenant}
            placeholder={t('saas:platform.actionLog.filterTenantPlaceholder')}
            flex={1}
            testID="filter-tenant"
          />
        </XStack>

        {entries.length === 0 ? (
          <Text color="$colorSubtle" testID="action-log-empty">{t('saas:platform.actionLog.empty')}</Text>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ActionLogRow entry={item} />}
            onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.3}
            testID="action-log-list"
          />
        )}
      </YStack>
    </YStack>
  );
}
