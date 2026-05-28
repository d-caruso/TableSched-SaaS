import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { ConfirmDestructiveModal } from '@saas/components/platform/ConfirmDestructiveModal';
import {
  usePlatformTenant,
  useSuspendTenant,
  useReactivateTenant,
  useCancelTenant,
  useDeleteTenantSchema,
} from '@saas/lib/api/platform';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

type ModalAction = 'suspend' | 'cancel' | 'delete' | null;

export default function TenantDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = Number(id);
  const router = useRouter();
  const [modal, setModal] = useState<ModalAction>(null);

  const { data: tenant, isLoading } = usePlatformTenant(tenantId);
  const suspend = useSuspendTenant(tenantId);
  const reactivate = useReactivateTenant(tenantId);
  const cancel = useCancelTenant(tenantId);
  const deleteTenant = useDeleteTenantSchema(tenantId);

  if (isLoading || !tenant) {
    return <YStack flex={1} padding="$4"><Text>Loading…</Text></YStack>;
  }

  const sub = tenant.subscription;
  const status = sub.status;

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
      showToast('Action failed', TOAST_VARIANT.ERROR);
    }
  }

  return (
    <ScrollView testID="tenant-detail-scroll">
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$6" fontWeight="700">{tenant.display_name}</Text>
            <Text color="$colorSubtle">{sub.plan.slug} · {status}</Text>
          </YStack>
          <AppButton
            variant="primary"
            skipWriteGate
            onPress={() => router.push(`/platform/tenants/${tenantId}/subscription`)}
            testID="edit-subscription-btn"
          >
            Edit subscription
          </AppButton>
        </XStack>

        {/* Profile card */}
        <YStack gap="$1" testID="profile-card">
          <Text fontWeight="600">Profile</Text>
          <Text>Slug: {tenant.slug}</Text>
          <Text>Owner: {tenant.owner_email}</Text>
          <Text>Created: {new Date(tenant.created_at).toLocaleDateString()}</Text>
        </YStack>

        {/* Subscription card */}
        <YStack gap="$1" testID="subscription-card">
          <Text fontWeight="600">Subscription</Text>
          <Text>Plan: {sub.plan.slug}</Text>
          <Text>Status: {status}</Text>
          {sub.current_period_end && <Text>Renews: {new Date(sub.current_period_end).toLocaleDateString()}</Text>}
          {sub.trial_ends_at && <Text>Trial ends: {new Date(sub.trial_ends_at).toLocaleDateString()}</Text>}
          {sub.location_limit_override != null && (
            <Text fontStyle="italic">Location override: {sub.location_limit_override}</Text>
          )}
        </YStack>

        {/* Usage snapshot */}
        <YStack gap="$1" testID="usage-snapshot">
          <Text fontWeight="600">Usage</Text>
          <Text>Locations: {sub.usage.locations}/{sub.effective_max_locations ?? '∞'}</Text>
          <Text>Staff: {sub.usage.staff}</Text>
          <Text>Tables: {sub.usage.tables}</Text>
          <Text>Rooms: {sub.usage.rooms}</Text>
          <Text>Bookings this month: {sub.usage.bookings_this_month}</Text>
          <Text>SMS today: {sub.usage.sms_today}</Text>
        </YStack>

        {/* Lifecycle actions */}
        <YStack gap="$2" testID="lifecycle-actions">
          <Text fontWeight="600">Actions</Text>
          {status === 'active' && (
            <AppButton
              variant="danger"
              skipWriteGate
              onPress={() => setModal('suspend')}
              testID="suspend-btn"
            >
              {t('saas:platform.tenant.suspendConfirmTitle').replace('?', '')}
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
              Reactivate
            </AppButton>
          )}
          {(status === 'active' || status === 'suspended') && (
            <AppButton
              variant="danger"
              skipWriteGate
              onPress={() => setModal('cancel')}
              testID="cancel-btn"
            >
              {t('saas:platform.tenant.cancelConfirmTitle').replace('?', '')}
            </AppButton>
          )}
          {status === 'cancelled' && (
            <AppButton
              variant="danger"
              skipWriteGate
              onPress={() => setModal('delete')}
              testID="delete-btn"
            >
              Delete schema
            </AppButton>
          )}
        </YStack>

        {/* Recent lifecycle events link */}
        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => router.push(`/platform/tenants/${tenantId}/lifecycle`)}
          testID="view-lifecycle-btn"
        >
          View lifecycle history →
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
