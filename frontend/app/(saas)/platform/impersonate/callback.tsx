import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { useExchangeImpersonationToken } from '@saas/lib/api/platform';

type Status = 'pending' | 'error';

export default function ImpersonateCallbackScreen() {
  const { t } = useTranslation();
  const { token, restaurant_id } = useLocalSearchParams<{ token: string; restaurant_id: string }>();
  const router = useRouter();
  const exchange = useExchangeImpersonationToken();
  const [status, setStatus] = useState<Status>('pending');

  useEffect(() => {
    if (!token || !restaurant_id) {
      setStatus('error');
      return;
    }
    exchange.mutateAsync({ token, restaurant_id })
      .then(() => {
        router.replace('/(staff)/dashboard');
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  if (status === 'error') {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4" testID="callback-error">
        <Text>{t('saas:platform.impersonate.callbackError')}</Text>
        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => router.push('/platform/tenants')}
          testID="back-to-admin-btn"
        >
          {t('saas:platform.impersonate.backToAdmin')}
        </AppButton>
      </YStack>
    );
  }

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" testID="callback-pending">
      <Text>{t('saas:platform.impersonate.callbackInProgress')}</Text>
    </YStack>
  );
}
