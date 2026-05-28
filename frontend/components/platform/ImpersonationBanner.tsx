import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { XStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { useIsImpersonating, useEndImpersonation } from '@saas/lib/api/platform';

export function ImpersonationBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const isImpersonating = useIsImpersonating();
  const end = useEndImpersonation();

  if (!isImpersonating) return null;

  async function handleEnd() {
    await end.mutateAsync();
    router.push('/platform/tenants');
  }

  return (
    <XStack
      backgroundColor="$red9"
      padding="$2"
      justifyContent="space-between"
      alignItems="center"
      testID="impersonation-banner"
    >
      <Text color="white">{t('saas:platform.impersonate.banner', { tenant: '' }).trim()}</Text>
      <AppButton
        variant="ghost"
        skipWriteGate
        onPress={handleEnd}
        testID="end-session-btn"
      >
        {t('saas:platform.impersonate.endSession')}
      </AppButton>
    </XStack>
  );
}
