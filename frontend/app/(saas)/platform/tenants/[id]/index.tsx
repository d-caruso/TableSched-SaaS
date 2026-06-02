import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { FIELD_LABEL_STYLE } from '@core/constants/styles';
import { ConfirmDestructiveModal } from '@saas/components/platform/ConfirmDestructiveModal';
import { ImpersonateButton } from '@saas/components/platform/ImpersonateButton';
import {
  usePlatformTenant,
  usePlatformLifecycleEvents,
  useSuspendTenant,
  useReactivateTenant,
  useCancelTenant,
  useDeleteTenantSchema,
} from '@saas/lib/api/platform';
import { ApiKeysSummaryBlock } from '@saas/components/platform/ApiKeysSummaryBlock';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

type ModalAction = 'suspend' | 'cancel' | 'delete' | null;

const RECENT_EVENTS_LIMIT = 5;

export default function TenantDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = Number(id);
  const router = useRouter();
  const [modal, setModal] = useState<ModalAction>(null);

  const { data: tenant, isLoading } = usePlatformTenant(tenantId);
  const { data: lifecyclePages } = usePlatformLifecycleEvents(tenantId);
  const suspend = useSuspendTenant(tenantId);
  const reactivate = useReactivateTenant(tenantId);
  const cancel = useCancelTenant(tenantId);
  const deleteTenant = useDeleteTenantSchema(tenantId);

  if (isLoading || !tenant) {
    return <YStack flex={1} padding="$4"><Text>{t('saas:common.loading')}</Text></YStack>;
  }

  const sub = tenant.subscription;
  const status = sub.status;

  const recentEvents = (lifecyclePages?.pages[0]?.results ?? []).slice(0, RECENT_EVENTS_LIMIT);

  async function runAction(action: ModalAction) {
    setModal(null);
    try {
      if (action === 'suspend') {
        await suspend.mutateAsync();
        showToast(t('saas:platform.toasts.suspended'), TOAST_VARIANT.INFO);
      } else if (action === 'cancel') {
        await cancel.mutateAsync();
        showToast(t('saas:platform.toasts.cancelled'), TOAST_VARIANT.INFO);
      } else if (action === 'delete') {
        await deleteTenant.mutateAsync();
        showToast(t('saas:platform.toasts.deletionScheduled'), TOAST_VARIANT.INFO);
        router.push('/platform/tenants');
      }
    } catch {
      showToast(t('saas:platform.tenant.actionFailed'), TOAST_VARIANT.ERROR);
    }
  }

  return (
    <ScrollView testID="tenant-detail-scroll">
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$6" fontWeight="$7">{tenant.display_name}</Text>
            <Text color="$colorSubtle">{sub.plan.slug} · {status}</Text>
          </YStack>
          <XStack gap="$2">
            <ImpersonateButton
              tenantId={tenantId}
              tenantName={tenant.display_name}
              restaurantId={String(tenantId)}
            />
            <AppButton
              variant="secondary"
              skipWriteGate
              onPress={() => router.push(`/platform/tenants/${tenantId}/subscription`)}
              testID="edit-subscription-btn"
            >
              {t('saas:platform.tenant.editSubscription')}
            </AppButton>
          </XStack>
        </XStack>

        {/* Profile card */}
        <YStack gap="$1" testID="profile-card">
          <Text {...FIELD_LABEL_STYLE}>{t('saas:platform.tenant.profileTitle')}</Text>
          <Text>{t('saas:platform.tenant.slug')}: {tenant.slug}</Text>
          <Text>{t('saas:platform.tenant.owner')}: {tenant.owner_email}</Text>
          <Text>{t('saas:platform.tenant.created')}: {new Date(tenant.created_at).toLocaleDateString()}</Text>
        </YStack>

        {/* Subscription card */}
        <YStack gap="$1" testID="subscription-card">
          <Text {...FIELD_LABEL_STYLE}>{t('saas:platform.tenant.subscriptionTitle')}</Text>
          <Text>{t('saas:platform.tenant.plan')}: {sub.plan.slug}</Text>
          <Text>{t('saas:platform.tenant.status')}: {status}</Text>
          {sub.current_period_end && (
            <Text>{t('saas:platform.tenant.renews')}: {new Date(sub.current_period_end).toLocaleDateString()}</Text>
          )}
          {sub.trial_ends_at && (
            <Text>{t('saas:platform.tenant.trialEnds')}: {new Date(sub.trial_ends_at).toLocaleDateString()}</Text>
          )}
          {sub.location_limit_override != null && (
            <Text fontStyle="italic">{t('saas:platform.tenant.locationOverride')}: {sub.location_limit_override}</Text>
          )}
        </YStack>

        {/* Usage snapshot */}
        <YStack gap="$1" testID="usage-snapshot">
          <Text {...FIELD_LABEL_STYLE}>{t('saas:platform.tenant.usageTitle')}</Text>
          <Text>{t('saas:platform.tenant.locations')}: {sub.usage.locations}/{sub.effective_max_locations ?? '∞'}</Text>
          <Text>{t('saas:platform.tenant.staff')}: {sub.usage.staff}</Text>
          <Text>{t('saas:platform.tenant.tables')}: {sub.usage.tables}</Text>
          <Text>{t('saas:platform.tenant.rooms')}: {sub.usage.rooms}</Text>
          <Text>{t('saas:platform.tenant.bookingsThisMonth')}: {sub.usage.bookings_this_month}</Text>
          <Text>{t('saas:platform.tenant.smsToday')}: {sub.usage.sms_today}</Text>
        </YStack>

        {/* Lifecycle actions */}
        <YStack gap="$2" testID="lifecycle-actions">
          <Text {...FIELD_LABEL_STYLE}>{t('saas:platform.tenant.actionsTitle')}</Text>
          {status === 'active' && (
            <AppButton
              variant="danger"
              skipWriteGate
              onPress={() => setModal('suspend')}
              testID="suspend-btn"
            >
              {t('saas:platform.tenant.suspend')}
            </AppButton>
          )}
          {status === 'suspended' && (
            <AppButton
              variant="primary"
              skipWriteGate
              onPress={() => reactivate.mutateAsync().then(() =>
                showToast(t('saas:platform.toasts.reactivated'), TOAST_VARIANT.SUCCESS)
              )}
              testID="reactivate-btn"
            >
              {t('saas:platform.tenant.reactivate')}
            </AppButton>
          )}
          {(status === 'active' || status === 'suspended') && (
            <AppButton
              variant="danger"
              skipWriteGate
              onPress={() => setModal('cancel')}
              testID="cancel-btn"
            >
              {t('saas:platform.tenant.cancel')}
            </AppButton>
          )}
          {status === 'cancelled' && (
            <AppButton
              variant="danger"
              skipWriteGate
              onPress={() => setModal('delete')}
              testID="delete-btn"
            >
              {t('saas:platform.tenant.deleteSchema')}
            </AppButton>
          )}
        </YStack>

        {/* API keys summary (Enterprise only) */}
        <ApiKeysSummaryBlock tenantId={tenantId} tier={sub.plan.slug} />

        {/* Recent lifecycle events (last 5) */}
        {recentEvents.length > 0 && (
          <YStack gap="$1" testID="recent-lifecycle-events">
            <Text {...FIELD_LABEL_STYLE}>{t('saas:lifecycle.historyTitle')}</Text>
            {recentEvents.map((ev) => (
              <XStack key={ev.id} gap="$2" paddingVertical="$1">
                <Text fontSize="$2" color="$colorSubtle">
                  {new Date(ev.created_at).toLocaleDateString()}
                </Text>
                <Text fontSize="$2">{ev.from_status ?? '—'} → {ev.to_status}</Text>
              </XStack>
            ))}
          </YStack>
        )}

        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => router.push(`/platform/tenants/${tenantId}/lifecycle`)}
          testID="view-lifecycle-btn"
        >
          {t('saas:platform.tenant.viewLifecycleHistory')}
        </AppButton>
      </YStack>

      {/* Modals */}
      <ConfirmDestructiveModal
        visible={modal === 'suspend'}
        title={t('saas:platform.tenant.suspendConfirmTitle')}
        body={t('saas:platform.tenant.suspendConfirmBody')}
        onConfirm={() => runAction('suspend')}
        onCancel={() => setModal(null)}
      />
      <ConfirmDestructiveModal
        visible={modal === 'cancel'}
        title={t('saas:platform.tenant.cancelConfirmTitle')}
        body={t('saas:platform.tenant.cancelConfirmBody')}
        onConfirm={() => runAction('cancel')}
        onCancel={() => setModal(null)}
      />
      <ConfirmDestructiveModal
        visible={modal === 'delete'}
        title={t('saas:platform.tenant.deleteConfirmTitle')}
        body={t('saas:platform.tenant.deleteConfirmBody')}
        requireTypedSlug={tenant.slug}
        onConfirm={() => runAction('delete')}
        onCancel={() => setModal(null)}
      />
    </ScrollView>
  );
}
