import { Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';
import { useSubscription, useStartPortalSession } from '@saas/lib/api/billing';

export function PastDueBanner() {
  const { t } = useTranslation();
  const { data } = useSubscription();
  const portalMutation = useStartPortalSession();

  if (!data || data.status !== 'past_due') return null;

  async function handleUpdatePayment() {
    const { url } = await portalMutation.mutateAsync();
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
  }

  return (
    <XStack
      backgroundColor="$orange3"
      borderBottomWidth={1}
      borderColor="$orange6"
      padding="$3"
      gap="$3"
      alignItems="center"
      justifyContent="space-between"
      testID="past-due-banner"
    >
      <Text fontSize="$3" color="$orange11" flex={1}>
        {t('saas:lifecycle.pastDueBanner')}
      </Text>
      <Text
        fontSize="$3"
        color="$orange11"
        fontWeight="700"
        onPress={handleUpdatePayment}
        cursor="pointer"
      >
        {t('saas:lifecycle.updatePayment')}
      </Text>
    </XStack>
  );
}
