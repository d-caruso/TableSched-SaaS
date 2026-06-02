import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { STAFF_MAX_WIDTH } from '@core/constants/styles';
import { usePlatformLifecycleEvents, PlatformLifecycleEvent } from '@saas/lib/api/platform';

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function ReasonLabel({ reason }: { reason: string | null }) {
  const { t, i18n } = useTranslation();
  if (!reason) return <Text color="$colorSubtle">—</Text>;
  const key = `saas:lifecycle.eventReason${snakeToCamel(reason).replace(/^./, (c) => c.toUpperCase())}`;
  const label = i18n.exists(key) ? t(key) : reason;
  return <Text color="$colorSubtle">{label}</Text>;
}

function EventCard({ event }: { event: PlatformLifecycleEvent }) {
  const { t } = useTranslation();
  const date = new Date(event.created_at).toLocaleString();
  return (
    <YStack
      padding="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      gap="$1"
      testID={`lifecycle-event-${event.id}`}
    >
      <Text fontSize="$2" color="$colorSubtle">{date}</Text>
      <XStack gap="$2">
        <Text fontWeight="$7">
          {event.from_status ?? '—'} → {event.to_status}
        </Text>
      </XStack>
      <XStack gap="$2">
        <Text>{t('saas:platform.tenant.reason')}: </Text>
        <ReasonLabel reason={event.reason} />
      </XStack>
      {event.triggered_by && (
        <Text fontSize="$2" color="$colorSubtle">{t('saas:platform.tenant.triggeredBy')}: {event.triggered_by}</Text>
      )}
    </YStack>
  );
}

export default function TenantLifecycleScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = Number(id);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePlatformLifecycleEvents(tenantId);

  const events = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <YStack
      flex={1}
      alignItems="center"
      paddingVertical="$6"
      paddingHorizontal="$4"
      testID="tenant-lifecycle-screen"
    >
      <YStack maxWidth={STAFF_MAX_WIDTH} width="100%" flex={1} gap="$3">
        <Text fontSize="$5" fontWeight="$7">{t('saas:lifecycle.historyTitle')}</Text>
        {events.length === 0 ? (
          <Text color="$colorSubtle" testID="lifecycle-empty">—</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <EventCard event={item} />}
            onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.3}
            testID="lifecycle-list"
          />
        )}
      </YStack>
    </YStack>
  );
}
