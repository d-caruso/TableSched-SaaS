import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { ResponsiveShell } from '@core/components/ui/ResponsiveShell';
import { AppButton } from '@saas/components/ui/AppButton';
import { useAuth } from '@core/lib/auth/AuthContext';

type Props = { children: React.ReactNode };

export function PlatformSidebarShell({ children }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { organization, tenant } = useAuth();

  const userDisplay = organization?.name ?? tenant ?? '';

  // Sidebar width/border and responsive narrow-screen collapse are provided
  // by the shared core ResponsiveShell (260px). This component only supplies
  // the platform nav content.
  const sidebar = (
    <YStack flex={1} padding="$3" gap="$2" testID="platform-sidebar">
      {/* Header strip */}
      <YStack marginBottom="$2">
        <Text fontWeight="$7">{t('saas:platform.title')}</Text>
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
  );

  return <ResponsiveShell sidebar={sidebar} content={children} />;
}
