// SaaS shadow of app/(staff)/dashboard/settings/index.tsx
// Adds manager-only "Lifecycle history" and "API keys" tabs to the settings screen.

import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Spinner, Text, Theme, XStack, YStack, useMedia } from 'tamagui';
import { EDITOR_SURFACE_BG, PRIMARY_ACTION_FONT_SIZE, PRIMARY_ACTION_MIN_HEIGHT } from '@core/constants/styles';
import { CancellationPolicyEditor } from '@core/components/settings/CancellationPolicyEditor';
import { BillingAccountRow } from '@core/components/settings/BillingAccountRow';
import { DepositPolicyEditor } from '@core/components/settings/DepositPolicyEditor';
import { OpeningHoursEditor } from '@core/components/settings/OpeningHoursEditor';
import { PublicProfileFields, settingsToProfileDraft, profileDraftToPatch, profileDraftIsValid } from '@core/components/settings/PublicProfileFields';
import { CoverImageUploader } from '@core/components/settings/CoverImageUploader';
import { RemindersSection } from '@core/components/settings/RemindersSection';
import { StaffMembersSection } from '@core/components/settings/StaffMembersSection';
import { NotificationTemplatesSection } from '@core/components/settings/NotificationTemplatesSection';
import { TableCombinationsSection } from '@core/components/settings/TableCombinationsSection';
import { RefundPoliciesSection } from '@core/components/settings/RefundPoliciesSection';
import { SettingsTabBar } from '@core/components/settings/SettingsTabBar';
import { useStaffRole, canWrite } from '@core/lib/hooks/useStaffRole';
import type { ProfileDraft } from '@core/components/settings/PublicProfileFields';
import { AppButton } from '@core/components/ui/AppButton';
import { ErrorMessage } from '@core/components/ui/ErrorMessage';
import { useAuth } from '@core/lib/auth/AuthContext';
import { staffApi } from '@core/lib/api/endpoints';
import type { DepositPolicy, OpeningWindow, RestaurantSettings } from '@core/lib/api/types';
import FloorScreen from './floor';
import { LifecycleHistoryTab } from '@saas/components/lifecycle/LifecycleHistoryTab';
import ApiKeysScreen from '@saas/app/(saas)/settings/api-keys';
import { useFeature } from '@saas/lib/features';

const TAB_HOURS           = 'hours'           as const;
const TAB_DEPOSIT         = 'deposit'         as const;
const TAB_CANCELLATION    = 'cancellation'    as const;
const TAB_FLOOR           = 'floor'           as const;
const TAB_PROFILE         = 'profile'         as const;
const TAB_REMINDERS       = 'reminders'       as const;
const TAB_STAFF           = 'staff'           as const;
const TAB_TEMPLATES       = 'templates'       as const;
const TAB_COMBINATIONS    = 'combinations'    as const;
const TAB_REFUND_POLICIES = 'refundPolicies'  as const;
const TAB_LIFECYCLE       = 'lifecycle'       as const;  // SaaS-only
const TAB_API_KEYS        = 'apiKeys'         as const;  // SaaS-only (Enterprise)

type SettingsTab =
  | typeof TAB_HOURS
  | typeof TAB_DEPOSIT
  | typeof TAB_CANCELLATION
  | typeof TAB_FLOOR
  | typeof TAB_PROFILE
  | typeof TAB_REMINDERS
  | typeof TAB_STAFF
  | typeof TAB_TEMPLATES
  | typeof TAB_COMBINATIONS
  | typeof TAB_REFUND_POLICIES
  | typeof TAB_LIFECYCLE
  | typeof TAB_API_KEYS;

const NO_SAVE_BAR_TABS = new Set<SettingsTab>([
  TAB_FLOOR, TAB_REMINDERS, TAB_STAFF, TAB_TEMPLATES,
  TAB_COMBINATIONS, TAB_REFUND_POLICIES, TAB_LIFECYCLE, TAB_API_KEYS,
]);

type TabSaveMutation = { isSuccess: boolean; isPending: boolean; error: Error | null; mutate: () => void; reset: () => void };
type TabSaveEntry    = { mutation: TabSaveMutation; hasChanges: boolean; label: string };

function settingsToDepositPolicy(s: RestaurantSettings): DepositPolicy {
  return {
    mode: s.deposit_policy,
    deposit_amount_cents: s.deposit_amount_cents,
    deposit_party_threshold: s.deposit_party_threshold,
  };
}

function depositPolicyToPatch(p: DepositPolicy): Partial<RestaurantSettings> {
  return {
    deposit_policy: p.mode,
    deposit_amount_cents: p.mode === 'never' ? 0 : (p.deposit_amount_cents ?? null),
    deposit_party_threshold: p.deposit_party_threshold ?? null,
  };
}

export default function SettingsScreen() {
  const { t }                   = useTranslation();
  const media                   = useMedia();
  const { accessToken, tenant } = useAuth();
  const queryClient             = useQueryClient();
  const role                    = useStaffRole();
  const writeAllowed            = canWrite(role);
  const isManager               = role === 'manager';
  const hasApiAccess            = useFeature('apiAccess');
  const [activeTab, setActiveTab] = useState<SettingsTab>(TAB_HOURS);

  const { data, isPending, error } = useQuery({
    queryKey: ['restaurant-settings', tenant],
    queryFn:  () => staffApi.getRestaurantSettings(tenant!, accessToken!),
    enabled:  Boolean(accessToken && tenant),
  });

  const { data: openingWindows, isPending: windowsPending } = useQuery({
    queryKey: ['opening-windows', tenant],
    queryFn:  () => staffApi.listOpeningWindows(tenant!, accessToken!),
    enabled:  Boolean(accessToken && tenant),
  });

  const [hoursDraft,        setHoursDraft]        = useState<OpeningWindow[] | null>(null);
  const [depositDraft,      setDepositDraft]      = useState<DepositPolicy | null>(null);
  const [cancellationDraft, setCancellationDraft] = useState<number | null>(null);
  const [profileDraft,      setProfileDraft]      = useState<ProfileDraft | null>(null);
  const [hoursValid,        setHoursValid]        = useState(true);

  const saveHours = useMutation({
    mutationFn: () => staffApi.saveOpeningWindows(tenant!, accessToken!, hoursDraft!),
    onSuccess: (saved) => {
      queryClient.setQueryData(['opening-windows', tenant], saved);
      setHoursDraft(null);
    },
  });

  const saveDeposit = useMutation({
    mutationFn: () =>
      staffApi.updateRestaurantSettings(tenant!, accessToken!, depositPolicyToPatch(depositDraft!)),
    onSuccess: () => {
      queryClient.setQueryData(
        ['restaurant-settings', tenant],
        (old: RestaurantSettings | undefined) =>
          old ? { ...old, ...depositPolicyToPatch(depositDraft!) } : old,
      );
      setDepositDraft(null);
    },
  });

  const saveCancellation = useMutation({
    mutationFn: () =>
      staffApi.updateRestaurantSettings(tenant!, accessToken!, {
        cancellation_cutoff_hours: cancellationDraft!,
      }),
    onSuccess: () => {
      queryClient.setQueryData(
        ['restaurant-settings', tenant],
        (old: RestaurantSettings | undefined) =>
          old ? { ...old, cancellation_cutoff_hours: cancellationDraft! } : old,
      );
      setCancellationDraft(null);
    },
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      staffApi.updateRestaurantSettings(tenant!, accessToken!, profileDraftToPatch(profileDraft!)),
    onSuccess: (saved) => {
      queryClient.setQueryData(['restaurant-settings', tenant], saved);
      setProfileDraft(null);
    },
  });

  const TAB_SAVE_CONFIG = useMemo<Partial<Record<SettingsTab, TabSaveEntry>>>(() => ({
    [TAB_HOURS]:        { mutation: saveHours,        hasChanges: hoursDraft !== null && hoursValid,                          label: t('staff.settings.saveHours')                 },
    [TAB_DEPOSIT]:      { mutation: saveDeposit,      hasChanges: depositDraft !== null,                                      label: t('staff.settings.saveDeposit')               },
    [TAB_CANCELLATION]: { mutation: saveCancellation, hasChanges: cancellationDraft !== null,                                  label: t('staff.settings.saveCancellation')          },
    [TAB_PROFILE]:      { mutation: saveProfile,      hasChanges: profileDraft !== null && profileDraftIsValid(profileDraft), label: t('staff.settings.publicProfile.saveProfile') },
  }), [saveHours, saveDeposit, saveCancellation, saveProfile, hoursDraft, hoursValid, depositDraft, cancellationDraft, profileDraft, t]);

  const activeConfig = TAB_SAVE_CONFIG[activeTab];

  useEffect(() => {
    if (!saveHours.isSuccess) return;
    const timer = setTimeout(() => saveHours.reset(), 3000);
    return () => clearTimeout(timer);
  }, [saveHours.isSuccess]);

  useEffect(() => {
    if (!saveDeposit.isSuccess) return;
    const timer = setTimeout(() => saveDeposit.reset(), 3000);
    return () => clearTimeout(timer);
  }, [saveDeposit.isSuccess]);

  useEffect(() => {
    if (!saveCancellation.isSuccess) return;
    const timer = setTimeout(() => saveCancellation.reset(), 3000);
    return () => clearTimeout(timer);
  }, [saveCancellation.isSuccess]);

  useEffect(() => {
    if (!saveProfile.isSuccess) return;
    const timer = setTimeout(() => saveProfile.reset(), 3000);
    return () => clearTimeout(timer);
  }, [saveProfile.isSuccess]);

  const handleTabChange = (key: string) => {
    const currentHasChanges = TAB_SAVE_CONFIG[activeTab as SettingsTab]?.hasChanges ?? false;

    const doSwitch = () => {
      setActiveTab(key as SettingsTab);
      setHoursDraft(null);
      setDepositDraft(null);
      setCancellationDraft(null);
    };

    if (currentHasChanges) {
      Alert.alert(
        t('staff.settings.unsavedChanges'),
        t('staff.settings.unsavedChangesMessage'),
        [
          { text: t('staff.settings.discardChanges'), style: 'destructive', onPress: doSwitch },
          { text: t('staff.settings.keepEditing'),    style: 'cancel' },
        ],
      );
      return;
    }
    doSwitch();
  };

  const TABS = [
    { key: TAB_HOURS,        label: t('staff.settings.tabs.hours')        },
    { key: TAB_DEPOSIT,      label: t('staff.settings.tabs.deposit')      },
    { key: TAB_CANCELLATION, label: t('staff.settings.tabs.cancellation') },
    { key: TAB_FLOOR,        label: t('staff.settings.tabs.floor')        },
    { key: TAB_PROFILE,      label: t('staff.settings.tabs.profile')      },
    { key: TAB_REMINDERS,    label: t('staff.settings.tabs.reminders')    },
    { key: TAB_STAFF,        label: t('staff.settings.tabs.staff')        },
    ...(isManager ? [{ key: TAB_TEMPLATES,      label: t('staff.settings.tabs.templates')      }] : []),
    ...(isManager ? [{ key: TAB_COMBINATIONS,   label: t('staff.settings.tabs.combinations')   }] : []),
    ...(isManager ? [{ key: TAB_REFUND_POLICIES, label: t('staff.settings.tabs.refundPolicies') }] : []),
    // SaaS-only: lifecycle history (manager-only)
    ...(isManager ? [{ key: TAB_LIFECYCLE, label: t('saas:lifecycle.historyTitle') }] : []),
    // SaaS-only: API keys (manager + Enterprise only)
    ...(isManager && hasApiAccess ? [{ key: TAB_API_KEYS, label: t('saas:apiKeys.title') }] : []),
  ];

  if (isPending || windowsPending || !data) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={EDITOR_SURFACE_BG}>
        <Spinner size="large" />
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} padding="$4" backgroundColor={EDITOR_SURFACE_BG}>
        <ErrorMessage error={error} />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={EDITOR_SURFACE_BG}>
      <Theme name="light">
        <YStack
          backgroundColor="$background"
          borderBottomWidth={1} borderColor="$borderColor"
          paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2"
        >
          <Text fontSize="$6" fontWeight="$7">{t('staff.settings.title')}</Text>
          {data.billing_account ? (
            <YStack marginTop="$2">
              <BillingAccountRow billingAccount={data.billing_account} />
            </YStack>
          ) : null}
        </YStack>
      </Theme>

      <YStack flex={1}>
        <Theme name="light">
          <YStack backgroundColor="$background" borderBottomWidth={1} borderColor="$borderColor">
            <SettingsTabBar tabs={TABS} activeKey={activeTab} onSelect={handleTabChange} />
          </YStack>
        </Theme>

        <ScrollView backgroundColor={EDITOR_SURFACE_BG}>
          <YStack
            padding={media.xs ? '$3' : '$5'}
            gap="$4"
            backgroundColor={EDITOR_SURFACE_BG}
            minHeight="100%"
          >
            {activeTab === TAB_HOURS && (
              <OpeningHoursEditor
                hours={hoursDraft ?? openingWindows ?? []}
                onChange={(hours: OpeningWindow[]) => setHoursDraft(hours)}
                onValidChange={setHoursValid}
              />
            )}
            {activeTab === TAB_DEPOSIT && (
              <DepositPolicyEditor
                policy={depositDraft ?? settingsToDepositPolicy(data)}
                onChange={policy => setDepositDraft(policy)}
              />
            )}
            {activeTab === TAB_CANCELLATION && (
              <CancellationPolicyEditor
                value={cancellationDraft ?? data.cancellation_cutoff_hours}
                onChange={v => setCancellationDraft(v)}
              />
            )}
            {activeTab === TAB_FLOOR        && <FloorScreen />}
            {activeTab === TAB_REMINDERS    && <RemindersSection />}
            {activeTab === TAB_STAFF        && <StaffMembersSection />}
            {activeTab === TAB_TEMPLATES    && isManager && <NotificationTemplatesSection />}
            {activeTab === TAB_COMBINATIONS && isManager && <TableCombinationsSection />}
            {activeTab === TAB_REFUND_POLICIES && isManager && <RefundPoliciesSection />}
            {/* SaaS-only */}
            {activeTab === TAB_LIFECYCLE && isManager && <LifecycleHistoryTab />}
            {activeTab === TAB_API_KEYS  && isManager && hasApiAccess && <ApiKeysScreen />}
            {activeTab === TAB_PROFILE && (
              <>
                <CoverImageUploader
                  currentUrl={data.cover_image_url}
                  onUpload={async (file) => {
                    const { cover_image_url } = await staffApi.uploadRestaurantCoverImage(tenant!, accessToken!, file);
                    queryClient.setQueryData(
                      ['restaurant-settings', tenant],
                      (old: RestaurantSettings | undefined) =>
                        old ? { ...old, cover_image_url } : old,
                    );
                    return cover_image_url;
                  }}
                  onRemove={() =>
                    setProfileDraft(d =>
                      d
                        ? { ...d, coverImageUrl: undefined }
                        : { ...settingsToProfileDraft({ ...data, cover_image_url: undefined }) },
                    )
                  }
                />
                <PublicProfileFields
                  draft={profileDraft ?? settingsToProfileDraft(data)}
                  onChange={setProfileDraft}
                />
              </>
            )}
          </YStack>
        </ScrollView>

        {!NO_SAVE_BAR_TABS.has(activeTab) && activeConfig && (
          <Theme name="light">
            <YStack
              backgroundColor="$background"
              borderTopWidth={1} borderColor="$borderColor"
              padding="$4"
            >
              {activeConfig.mutation.error != null && <ErrorMessage error={activeConfig.mutation.error} />}
              <XStack alignItems="center" gap="$4">
                <AppButton
                  variant="primary"
                  flex={1}
                  minHeight={PRIMARY_ACTION_MIN_HEIGHT}
                  fontSize={PRIMARY_ACTION_FONT_SIZE}
                  onPress={() => activeConfig.mutation.mutate()}
                  loading={activeConfig.mutation.isPending}
                  disabled={!activeConfig.hasChanges || !writeAllowed}
                >
                  {activeConfig.label}
                </AppButton>
                {activeConfig.mutation.isSuccess && (
                  <Text fontSize="$5" color="$success" fontWeight="$6">
                    {t('staff.settings.saved')}
                  </Text>
                )}
              </XStack>
            </YStack>
          </Theme>
        )}
      </YStack>
    </YStack>
  );
}
