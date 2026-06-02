import { useTranslation } from 'react-i18next';
import { Spinner, Text, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { CARD_STYLE } from '@core/constants/styles';
import { usePlans } from '@saas/lib/api/plans';
import type { PlanView } from '@saas/lib/api/plans';

type Props = {
  onSelect: (planSlug: string) => void;
};

function PlanCard({ plan, onSelect }: { plan: PlanView; onSelect: () => void }) {
  const { t } = useTranslation();
  const descKey = `saas:signup.${plan.slug}Description` as const;
  const priceLabel =
    plan.price_cents === 0
      ? t('saas:billing.priceFree')
      : `€${(plan.price_cents / 100).toFixed(0)}${t('saas:billing.perMonth')}`;

  return (
    <YStack
      {...CARD_STYLE}
      gap="$2"
    >
      <Text fontSize="$6" fontWeight="$7">{plan.display_name}</Text>
      <Text fontSize="$5" color="$brandDark">{priceLabel}</Text>
      <Text fontSize="$3" color="$placeholderColor">{t(descKey)}</Text>
      <AppButton variant="primary" onPress={onSelect} testID={`plan-pick-${plan.slug}`}>
        {t('saas:signup.choosePlan')}
      </AppButton>
    </YStack>
  );
}

export function PlanPickStep({ onSelect }: Props) {
  const { t } = useTranslation();
  const { data: plans, isLoading } = usePlans();

  if (isLoading || !plans) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner />
      </YStack>
    );
  }

  const showTrialBanner = !plans.some((p) => p.slug === 'free');

  return (
    <YStack gap="$4" padding="$4" testID="plan-pick-step">
      <Text fontSize="$7" fontWeight="$7">{t('saas:signup.choosePlan')}</Text>

      {showTrialBanner && (
        <YStack backgroundColor="$brandSubtle" borderRadius="$3" padding="$3">
          <Text fontSize="$3" color="$brand">
            {t('saas:signup.trialBanner', { days: 30 })}
          </Text>
        </YStack>
      )}

      {plans.map((plan) => (
        <PlanCard
          key={plan.slug}
          plan={plan}
          onSelect={() => onSelect(plan.slug)}
        />
      ))}
    </YStack>
  );
}
