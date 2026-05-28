import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Input } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import {
  usePlatformTenant,
  useOverrideSubscription,
  SubscriptionOverridePatch,
} from '@saas/lib/api/platform';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

const PLANS = ['free', 'premium', 'enterprise'] as const;
const STATUSES = ['active', 'trialing', 'past_due', 'suspended', 'cancelled'] as const;

type FormState = {
  plan: string;
  locationOverride: string;
  trialEndsAt: string;
  status: string;
  showStatusOverride: boolean;
};

function fieldsChanged(original: FormState, current: FormState): SubscriptionOverridePatch {
  const patch: SubscriptionOverridePatch = {};
  if (current.plan !== original.plan) {
    patch.plan = current.plan;
    patch.location_limit_override = null;
  }
  if (current.plan === original.plan && current.locationOverride !== original.locationOverride) {
    patch.location_limit_override =
      current.locationOverride === '' ? null : Number(current.locationOverride);
  }
  if (current.trialEndsAt !== original.trialEndsAt) {
    patch.trial_ends_at = current.trialEndsAt === '' ? null : current.trialEndsAt;
  }
  if (current.showStatusOverride && current.status !== original.status) {
    patch.status = current.status;
  }
  return patch;
}

export default function SubscriptionOverridesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = Number(id);
  const router = useRouter();

  const { data: tenant, isLoading } = usePlatformTenant(tenantId);
  const override = useOverrideSubscription(tenantId);

  const [form, setForm] = useState<FormState>({
    plan: '',
    locationOverride: '',
    trialEndsAt: '',
    status: '',
    showStatusOverride: false,
  });
  const [original, setOriginal] = useState<FormState>(form);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    const sub = tenant.subscription;
    const initial: FormState = {
      plan: sub.plan.slug,
      locationOverride: sub.location_limit_override != null ? String(sub.location_limit_override) : '',
      trialEndsAt: sub.trial_ends_at ?? '',
      status: sub.status,
      showStatusOverride: false,
    };
    setForm(initial);
    setOriginal(initial);
    setDirty(false);
  }, [tenant]);

  function update(key: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'plan' && value !== prev.plan) {
        next.locationOverride = '';
      }
      setDirty(true);
      return next;
    });
  }

  async function handleSave() {
    const patch = fieldsChanged(original, form);
    if (Object.keys(patch).length === 0) return;
    try {
      await override.mutateAsync(patch);
      showToast(t('saas:platform.toasts.subscriptionUpdated'), TOAST_VARIANT.SUCCESS);
      router.back();
    } catch {
      showToast(t('saas:platform.subscription.saveFailed'), TOAST_VARIANT.ERROR);
    }
  }

  function handleBack() {
    if (dirty) {
      Alert.alert(
        t('saas:platform.subscription.unsavedTitle'),
        t('saas:platform.subscription.unsavedBody'),
        [
          { text: t('saas:platform.subscription.unsavedStay'), style: 'cancel' },
          { text: t('saas:platform.subscription.unsavedDiscard'), onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }

  if (isLoading || !tenant) {
    return <YStack flex={1} padding="$4"><Text>{t('saas:common.loading')}</Text></YStack>;
  }

  return (
    <YStack flex={1} padding="$4" gap="$4" testID="subscription-overrides-screen">
      <Text fontSize="$6" fontWeight="700">{t('saas:platform.subscription.title')}</Text>

      {/* Plan */}
      <YStack gap="$1">
        <Text fontWeight="600">{t('saas:platform.subscription.planLabel')}</Text>
        <XStack gap="$2">
          {PLANS.map((p) => (
            <AppButton
              key={p}
              variant={form.plan === p ? 'primary' : 'ghost'}
              skipWriteGate
              onPress={() => update('plan', p)}
              testID={`plan-btn-${p}`}
            >
              {p}
            </AppButton>
          ))}
        </XStack>
      </YStack>

      {/* Location override */}
      <YStack gap="$1">
        <Text fontWeight="600">{t('saas:platform.subscription.locationOverrideLabel')}</Text>
        <XStack gap="$2" alignItems="center">
          <Input
            value={form.locationOverride}
            onChangeText={(v) => update('locationOverride', v)}
            keyboardType="numeric"
            placeholder="—"
            width={80}
            testID="location-override-input"
          />
          <AppButton
            variant="ghost"
            skipWriteGate
            onPress={() => update('locationOverride', '')}
            testID="clear-override-btn"
          >
            {t('saas:common.clear')}
          </AppButton>
        </XStack>
      </YStack>

      {/* Trial ends at */}
      <YStack gap="$1">
        <Text fontWeight="600">{t('saas:platform.subscription.trialEndsAtLabel')}</Text>
        <XStack gap="$2" alignItems="center">
          <Input
            value={form.trialEndsAt}
            onChangeText={(v) => update('trialEndsAt', v)}
            placeholder={t('saas:platform.subscription.trialEndsAtPlaceholder')}
            width={140}
            testID="trial-ends-input"
          />
          <AppButton
            variant="ghost"
            skipWriteGate
            onPress={() => update('trialEndsAt', '')}
            testID="clear-trial-btn"
          >
            {t('saas:common.clear')}
          </AppButton>
        </XStack>
      </YStack>

      {/* Status override — behind disclosure */}
      <YStack gap="$2">
        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => update('showStatusOverride', !form.showStatusOverride)}
          testID="status-disclosure-btn"
        >
          {t('saas:platform.subscription.statusOverrideDisclosure')}
        </AppButton>
        {form.showStatusOverride && (
          <XStack gap="$2" flexWrap="wrap" testID="status-override-panel">
            {STATUSES.map((s) => (
              <AppButton
                key={s}
                variant={form.status === s ? 'primary' : 'ghost'}
                skipWriteGate
                onPress={() => update('status', s)}
                testID={`status-btn-${s}`}
              >
                {s}
              </AppButton>
            ))}
          </XStack>
        )}
      </YStack>

      <XStack gap="$2" justifyContent="flex-end">
        <AppButton variant="ghost" skipWriteGate onPress={handleBack} testID="back-btn">
          {t('saas:common.back')}
        </AppButton>
        <AppButton
          variant="primary"
          skipWriteGate
          onPress={handleSave}
          disabled={!dirty}
          testID="save-btn"
        >
          {t('saas:common.save')}
        </AppButton>
      </XStack>
    </YStack>
  );
}
