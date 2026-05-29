import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { AppButton } from '@saas/components/ui/AppButton';
import { useAuth } from '@core/lib/auth/AuthContext';

type Props = { children: React.ReactNode };

export function PlatformSidebarShell({ children }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { organization, tenant } = useAuth();

  const userDisplay = organization?.name ?? tenant ?? '';

  return (
    <XStack flex={1}>
      <YStack
        width={200}
        borderRightWidth={1}
        borderRightColor="$borderColor"
        padding="$3"
        gap="$2"
        testID="platform-sidebar"
      >
        {/* Header strip */}
        <YStack marginBottom="$2">
          <Text fontWeight="700">{t('saas:platform.title')}</Text>
          {userDisplay ? (
            <Text fontSize="$2" color="$colorSubtle" testID="platform-sidebar-user">
              {userDisplay}
            </Text>
          ) : null}
        </YStack>

        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => router.push('/platform/tenants')}
        >
          {t('saas:platform.tenants.title')}
        </AppButton>
        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => router.push('/platform/action-log')}
        >
          {t('saas:platform.actionLog.title')}
        </AppButton>
        <AppButton
          variant="ghost"
          skipWriteGate
          onPress={() => router.push('/platform/sms')}
          testID="sidebar-sms-nav"
        >
          {t('saas:platform.sms.navLabel')}
        </AppButton>
        <AppButton
          variant="ghost"
          skipWriteGate
          marginTop="auto"
          onPress={() => router.push('/')}
        >
          {t('saas:platform.returnToRestaurant')}
        </AppButton>
      </YStack>
      <YStack flex={1}>{children}</YStack>
    </XStack>
  );
}
