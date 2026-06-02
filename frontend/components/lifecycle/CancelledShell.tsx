import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';

const RETENTION_DAYS = 90;

function daysRemaining(cancelledAt: string): number {
  const deadline = new Date(cancelledAt).getTime() + RETENTION_DAYS * 86_400_000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 86_400_000));
}

function formatDate(cancelledAt: string): string {
  const deadline = new Date(
    new Date(cancelledAt).getTime() + RETENTION_DAYS * 86_400_000,
  );
  return deadline.toLocaleDateString();
}

type Props = {
  cancelledAt: string;
};

export function CancelledShell({ cancelledAt }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const days = daysRemaining(cancelledAt);
  const date = formatDate(cancelledAt);

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$6"
      gap="$4"
      testID="cancelled-shell"
    >
      <Text fontSize="$7" fontWeight="$7" textAlign="center">
        {t('saas:lifecycle.cancelledTitle')}
      </Text>

      <Text fontSize="$4" color="$colorSubtle" textAlign="center">
        {t('saas:lifecycle.cancelledBody', { date, daysRemaining: days })}
      </Text>

      <AppButton
        variant="primary"
        onPress={() => router.replace('/(staff)/onboarding')}
      >
        {t('saas:lifecycle.reactivateOnboard')}
      </AppButton>

      <AppButton variant="ghost" onPress={() => {}}>
        {t('saas:lifecycle.exportData')}
      </AppButton>

      <Text fontSize="$3" color="$colorSubtle" marginTop="$2">
        {t('saas:lifecycle.needHelp')} contact@tablesched.com
      </Text>
    </YStack>
  );
}
