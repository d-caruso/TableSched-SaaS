import { useTranslation } from 'react-i18next';
import { YStack, Text } from 'tamagui';
import CoreFloorScreen from '@core/app/(staff)/dashboard/settings/floor';
import { AppButton } from '@saas/components/ui/AppButton';
import { useLimitState } from '@saas/lib/limits';
import { useRouter } from 'expo-router';

export default function FloorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { atLimit, cap } = useLimitState('tables');

  return (
    <YStack flex={1}>
      {atLimit && (
        <YStack
          backgroundColor="$dangerSubtle"
          borderRadius="$3"
          padding="$3"
          marginHorizontal="$4"
          marginTop="$3"
          gap="$2"
          testID="table-limit-banner"
        >
          <Text fontSize="$3" color="$warning">
            {t('saas:limits.tablesReached', { cap })}
          </Text>
          <AppButton
            variant="secondary"
            alignSelf="flex-start"
            skipWriteGate
            onPress={() => router.push('/(saas)/billing/upgrade')}
          >
            {t('saas:limits.upgradeLink')}
          </AppButton>
        </YStack>
      )}
      <CoreFloorScreen />
    </YStack>
  );
}
