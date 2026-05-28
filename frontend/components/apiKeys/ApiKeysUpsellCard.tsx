import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';

export function ApiKeysUpsellCard() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <YStack
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      padding="$4"
      gap="$2"
      testID="api-keys-upsell-card"
    >
      <Text fontWeight="700">{t('saas:apiKeys.upsellTitle')}</Text>
      <Text color="$colorSubtle">{t('saas:apiKeys.upsellBody')}</Text>
      <AppButton
        variant="primary"
        skipWriteGate
        onPress={() => router.push('/(saas)/billing/upgrade')}
        testID="upsell-upgrade-btn"
      >
        {t('saas:apiKeys.upsellCta')}
      </AppButton>
    </YStack>
  );
}
