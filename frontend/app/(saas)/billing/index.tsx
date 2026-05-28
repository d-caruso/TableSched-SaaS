import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Platform } from 'react-native';
import { Separator, Spinner, Text, XStack, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { useSubscription, useStartPortalSession } from '@saas/lib/api/billing';

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" paddingVertical="$2">
      <Text color="$color10">{label}</Text>
      <Text fontWeight="600">{value}</Text>
    </XStack>
  );
}

function formatCap(value: number | null, t: (k: string) => string): string {
  return value === null ? t('saas:billing.unlimited') : String(value);
}

export default function BillingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useSubscription();
  const portalMutation = useStartPortalSession();

  if (isLoading || !data) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  const tierLabel = t(`saas:billing.tier${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}`);

  async function handleManageBilling() {
    const { url } = await portalMutation.mutateAsync();
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  }

  function handleUpgrade() {
    router.push('/(saas)/billing/upgrade');
  }

  return (
    <YStack flex={1} padding="$4" gap="$4">
      {/* Plan card */}
      <YStack
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$4"
        gap="$2"
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="700">{tierLabel}</Text>
          {data.tier !== 'free' && data.current_period_end && (
            <Text fontSize="$3" color="$color10">
              {t('saas:billing.renewsOn', {
                date: new Date(data.current_period_end).toLocaleDateString(),
              })}
            </Text>
          )}
        </XStack>

        {data.status === 'trialing' && data.trial_ends_at && (
          <Text fontSize="$3" color="$orange10">
            {t('saas:billing.trialEndsIn', {
              days: Math.ceil(
                (new Date(data.trial_ends_at).getTime() - Date.now()) / 86_400_000,
              ),
            })}
          </Text>
        )}
      </YStack>

      {/* Usage summary */}
      <YStack
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$4"
        gap="$1"
      >
        <Text fontSize="$5" fontWeight="600" marginBottom="$2">
          {t('saas:billing.usageTitle')}
        </Text>
        <UsageRow
          label={t('saas:billing.bookingsThisMonth')}
          value={
            data.limits.max_bookings_per_month === null
              ? `${data.usage.bookings_this_month} / ${t('saas:billing.bookingsUnlimited')}`
              : `${data.usage.bookings_this_month} / ${data.limits.max_bookings_per_month}`
          }
        />
        <Separator />
        <UsageRow
          label={t('saas:billing.smsToday')}
          value={
            data.limits.sms_daily_quota === null
              ? t('saas:billing.smsNotIncluded')
              : `${data.usage.sms_today} / ${data.limits.sms_daily_quota}`
          }
        />
        <Separator />
        <UsageRow
          label={t('saas:billing.locations')}
          value={`${data.usage.locations} / ${formatCap(data.limits.max_locations, t)}`}
        />
        <Separator />
        <UsageRow
          label={t('saas:billing.tables')}
          value={`${data.usage.tables} / ${formatCap(data.limits.max_tables, t)}`}
        />
        <Separator />
        <UsageRow
          label={t('saas:billing.rooms')}
          value={`${data.usage.rooms} / ${formatCap(data.limits.max_rooms, t)}`}
        />
      </YStack>

      {/* Actions */}
      <YStack gap="$3">
        {data.tier === 'free' ? (
          <AppButton variant="primary" onPress={handleUpgrade}>
            {t('saas:billing.upgrade')}
          </AppButton>
        ) : (
          <>
            <AppButton
              variant="primary"
              onPress={handleManageBilling}
              loading={portalMutation.isPending}
            >
              {t('saas:billing.managePayment')}
            </AppButton>
            <AppButton
              variant="ghost"
              onPress={handleManageBilling}
              loading={portalMutation.isPending}
            >
              {t('saas:billing.cancelSubscription')}
            </AppButton>
          </>
        )}
      </YStack>
    </YStack>
  );
}
