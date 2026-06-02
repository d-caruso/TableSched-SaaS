import { Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Slot } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { useStartPortalSession } from '@saas/lib/api/billing';

export function SuspendedShell() {
  const { t } = useTranslation();
  const portalMutation = useStartPortalSession();

  async function handleRestore() {
    const { url } = await portalMutation.mutateAsync();
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  }

  return (
    <YStack flex={1} testID="suspended-shell">
      <XStack
        backgroundColor="$dangerSubtle"
        borderBottomWidth={1}
        borderColor="$dangerBorder"
        padding="$3"
        gap="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontSize="$3" color="$dangerText" flex={1}>
          {t('saas:lifecycle.suspendedBanner')}
        </Text>
        <AppButton
          variant="danger"
          size="$2"
          onPress={handleRestore}
          loading={portalMutation.isPending}
        >
          {t('saas:lifecycle.restorePayment')}
        </AppButton>
      </XStack>
      <Slot />
    </YStack>
  );
}
