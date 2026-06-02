import { useState } from 'react';
import { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input } from 'tamagui';
import { CARD_STYLE, FOCUS_STYLE, STAFF_MAX_WIDTH } from '@core/constants/styles';
import { AppButton } from '@saas/components/ui/AppButton';
import { usePlatformTenants, PlatformTenantView } from '@saas/lib/api/platform';

const STATUS_FILTERS = ['', 'active', 'past_due', 'suspended', 'cancelled'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

// Subscription-status pill — reuses the core StatusBadge pill shape with
// semantic tokens (no built-in ramps). Core StatusBadge is hardwired to
// BookingStatus, so a thin local pill covers the SaaS subscription statuses.
const STATUS_PILL_BG: Record<string, string> = {
  active: '$success',
  trialing: '$brand',
  past_due: '$warning',
  suspended: '$danger',
  cancelled: '$colorSubtle',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <XStack
      role="status"
      aria-label={label}
      backgroundColor={STATUS_PILL_BG[status] ?? '$colorSubtle'}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
      alignSelf="flex-start"
      testID={`status-badge-${status}`}
    >
      <Text color="$background" fontSize="$2" fontWeight="$7">{label}</Text>
    </XStack>
  );
}

function TenantRow({ tenant, onOpen }: { tenant: PlatformTenantView; onOpen: () => void }) {
  const { t } = useTranslation();
  const sub = tenant.subscription;
  return (
    <XStack
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      gap="$3"
      alignItems="center"
      testID={`tenant-row-${tenant.id}`}
    >
      <Text flex={2} fontWeight="$7">{tenant.display_name}</Text>
      <Text flex={1}>{sub.plan.slug}</Text>
      <StatusBadge
        status={sub.status}
        label={t(`saas:platform.subscriptionStatus.${sub.status}`)}
      />
      <Text flex={1} textAlign="right">
        {sub.usage.locations}/{sub.effective_max_locations ?? '∞'}
      </Text>
      <Text flex={1} textAlign="right">{sub.usage.bookings_this_month}</Text>
      <AppButton variant="ghost" skipWriteGate onPress={onOpen} focusStyle={FOCUS_STYLE}>
        {t('saas:platform.tenants.open')}
      </AppButton>
    </XStack>
  );
}

export default function PlatformTenantListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [ordering, setOrdering] = useState('created');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePlatformTenants({
    search,
    status: status || undefined,
    ordering,
  });

  const rows = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <YStack
      flex={1}
      alignItems="center"
      paddingVertical="$6"
      paddingHorizontal="$4"
      testID="platform-tenant-list"
    >
      <YStack maxWidth={STAFF_MAX_WIDTH} width="100%" flex={1} gap="$4">
        <Text fontSize="$6" fontWeight="$7">{t('saas:platform.tenants.title')}</Text>

        <YStack
          backgroundColor="$background"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          paddingBottom="$3"
          gap="$3"
          testID="tenant-toolbar"
        >
          <XStack gap="$2" alignItems="center">
            <Input
              flex={1}
              placeholder={t('saas:platform.tenants.search')}
              value={search}
              onChangeText={setSearch}
              testID="tenant-search-input"
            />
            <Text>{t('saas:platform.tenants.sortBy')}:</Text>
            {(['created', 'display_name', 'bookings_this_month'] as const).map((ord) => (
              <AppButton
                key={ord}
                variant={ordering === ord ? 'primary' : 'ghost'}
                skipWriteGate
                onPress={() => setOrdering(ord)}
              >
                {ord === 'created'
                  ? t('saas:platform.tenants.sortCreated')
                  : ord === 'display_name'
                  ? t('saas:platform.tenants.sortName')
                  : t('saas:platform.tenants.sortBookings')}
              </AppButton>
            ))}
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            {STATUS_FILTERS.map((s) => (
              <AppButton
                key={s || 'all'}
                variant={status === s ? 'primary' : 'ghost'}
                skipWriteGate
                onPress={() => setStatus(s)}
                testID={`filter-chip-${s || 'all'}`}
              >
                {s === '' ? t('saas:platform.tenants.filterAll')
                  : s === 'active' ? t('saas:platform.tenants.filterActive')
                  : s === 'past_due' ? t('saas:platform.tenants.filterPastDue')
                  : s === 'suspended' ? t('saas:platform.tenants.filterSuspended')
                  : t('saas:platform.tenants.filterCancelled')}
              </AppButton>
            ))}
          </XStack>
        </YStack>

        {rows.length === 0 ? (
          <Text color="$colorSubtle" testID="tenant-list-empty">{t('saas:platform.tenants.empty')}</Text>
        ) : (
          <YStack {...CARD_STYLE} flex={1} padding="$0" overflow="hidden">
            <FlatList
              data={rows}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TenantRow
                  tenant={item}
                  onOpen={() => router.push(`/platform/tenants/${item.id}`)}
                />
              )}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.3}
              testID="tenant-list"
            />
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
