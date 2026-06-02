import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text } from 'tamagui';
import { useLifecycleEvents } from '@saas/lib/api/lifecycle';

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function useReasonLabel(reason: string | null): string {
  const { t, i18n } = useTranslation();
  if (!reason) return '—';
  const key = `saas:lifecycle.eventReason${snakeToCamel(reason).replace(/^./, (c: string) => c.toUpperCase())}`;
  return i18n.exists(key) ? t(key) : reason;
}

function EventRow({ eventType, reason, createdAt }: { eventType: string; reason: string | null; createdAt: string }) {
  const { t } = useTranslation();
  const reasonLabel = useReasonLabel(reason);
  const date = new Date(createdAt).toLocaleDateString();
  return (
    <XStack paddingVertical="$2" borderBottomWidth={1} borderBottomColor="$borderColor" gap="$3">
      <Text flex={1} fontWeight="$7">{eventType}</Text>
      <Text flex={2} color="$colorSubtle">{reasonLabel}</Text>
      <Text color="$colorSubtle">{date}</Text>
    </XStack>
  );
}

export function LifecycleHistoryTab() {
  const { t } = useTranslation();
  const { data: events, isLoading } = useLifecycleEvents();

  if (isLoading) {
    return (
      <YStack padding="$4">
        <Text>{t('saas:lifecycle.historyTitle')}</Text>
      </YStack>
    );
  }

  const sorted = [...(events ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <YStack padding="$4" gap="$2" testID="lifecycle-history-tab">
      <Text fontSize="$5" fontWeight="$7" marginBottom="$2">
        {t('saas:lifecycle.historyTitle')}
      </Text>
      {sorted.length === 0 ? (
        <Text color="$colorSubtle">—</Text>
      ) : (
        sorted.map((ev) => (
          <EventRow
            key={ev.id}
            eventType={ev.event_type}
            reason={ev.reason}
            createdAt={ev.created_at}
          />
        ))
      )}
    </YStack>
  );
}
