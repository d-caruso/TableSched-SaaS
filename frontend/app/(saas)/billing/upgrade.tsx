import { Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Spinner, Text, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { CARD_STYLE } from '@core/constants/styles';
import { usePlans } from '@saas/lib/api/plans';
import { useStartCheckout } from '@saas/lib/api/billing';
import type { PlanView } from '@saas/lib/api/plans';

function formatPrice(priceCents: number): string {
  return `€${(priceCents / 100).toFixed(0)}`;
}

function PlanCard({ plan, onChoose, loading }: {
  plan: PlanView;
  onChoose: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const descKey = `saas:signup.${plan.slug}Description` as const;

  return (
    <YStack
      {...CARD_STYLE}
      gap="$3"
    >
      <YStack gap="$1">
        <Text fontSize="$6" fontWeight="$7">{plan.display_name}</Text>
        <Text fontSize="$5" color="$brandDark">
          {formatPrice(plan.price_cents)}
          <Text fontSize="$3" color="$placeholderColor">{t('saas:billing.perMonth')}</Text>
        </Text>
        <Text fontSize="$3" color="$placeholderColor">{t(descKey)}</Text>
      </YStack>

      <AppButton variant="primary" onPress={onChoose} loading={loading}>
        {plan.slug === 'premium'
          ? t('saas:billing.choosePremium')
          : t('saas:billing.chooseEnterprise')}
      </AppButton>
    </YStack>
  );
}

export default function UpgradeScreen() {
  const { t } = useTranslation();
  const { data: plans, isLoading } = usePlans();
  const checkoutMutation = useStartCheckout();

  if (isLoading || !plans) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  const paidPlans = plans.filter((p) => p.slug !== 'free');
  const showTrialBanner = !plans.some((p) => p.slug === 'free');

  async function handleChoose(slug: string) {
    const { url } = await checkoutMutation.mutateAsync({ plan: slug });
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  }

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <Text fontSize="$7" fontWeight="$7">{t('saas:billing.upgradeTitle')}</Text>
      <Text fontSize="$4" color="$placeholderColor">{t('saas:billing.upgradeSubtitle')}</Text>

      {showTrialBanner && (
        <YStack
          backgroundColor="$brandSubtle"
          borderRadius="$3"
          padding="$3"
        >
          <Text fontSize="$3" color="$brand">
            {t('saas:signup.trialBanner', { days: 30 })}
          </Text>
        </YStack>
      )}

      {paidPlans.map((plan) => (
        <PlanCard
          key={plan.slug}
          plan={plan}
          onChoose={() => handleChoose(plan.slug)}
          loading={checkoutMutation.isPending}
        />
      ))}
    </YStack>
  );
}
