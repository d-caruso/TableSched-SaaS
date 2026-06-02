import { Slot, useRouter, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, Theme, XStack, YStack, useMedia } from 'tamagui';
import { PRESS_STYLE } from '@core/constants/styles';
import { ResponsiveShell } from '@core/components/ui/ResponsiveShell';
import { useIsOrgAdmin } from '@core/lib/auth/hooks';
import { BookingsQuotaChip } from '@saas/components/billing/BookingsQuotaChip';

const NAV_ITEMS = [
  { href: '/dashboard',                   labelKey: 'staff.dashboard.tabs.bookings'        },
  { href: '/dashboard/walkins',           labelKey: 'staff.dashboard.tabs.walkins'         },
  { href: '/dashboard/settings',          labelKey: 'staff.dashboard.tabs.settings'        },
  { href: '/dashboard/erasure-requests',  labelKey: 'staff.dashboard.tabs.erasureRequests' },
] as const;

function usePath() {
  const segments = useSegments();
  return `/${segments.slice(1).join('/')}`;
}

function OrgAdminBadge() {
  const { t } = useTranslation();
  const isOrgAdmin = useIsOrgAdmin();
  if (!isOrgAdmin) return null;
  return (
    <XStack
      backgroundColor="$brandSubtle"
      borderRadius="$10"
      paddingHorizontal="$2"
      paddingVertical="$1"
      alignSelf="flex-start"
      marginBottom="$2"
    >
      <Text fontSize="$1" color="$brand" fontWeight="$7">
        {t('staff.role.orgAdmin')}
      </Text>
    </XStack>
  );
}

function DashboardSidebar() {
  const { t }  = useTranslation();
  const router = useRouter();
  const path   = usePath();

  return (
    <YStack padding="$4" gap="$1">
      <OrgAdminBadge />
      {NAV_ITEMS.map(item => {
        const isActive = path === item.href;
        return (
          <YStack
            key={item.href}
            role="button"
            onPress={() => router.push(item.href)}
            pressStyle={PRESS_STYLE}
            borderRadius="$4"
          >
            <YStack
              padding="$3"
              borderRadius="$4"
              backgroundColor={isActive ? '$brandSubtle' : 'transparent'}
            >
              <Text
                fontWeight={isActive ? '$7' : '$4'}
                color={isActive ? '$brand' : '$color'}
              >
                {t(item.labelKey)}
              </Text>
            </YStack>
          </YStack>
        );
      })}
      {/* SaaS: bookings quota chip below nav items */}
      <YStack marginTop="$3">
        <BookingsQuotaChip />
      </YStack>
    </YStack>
  );
}

function BottomTabBar() {
  const { t }  = useTranslation();
  const router = useRouter();
  const path   = usePath();

  return (
    <XStack
      role="tablist"
      backgroundColor="$background"
      borderTopWidth={1}
      borderColor="$borderColor"
      height={60}
    >
      {NAV_ITEMS.map(item => {
        const isActive = path === item.href;
        return (
          <YStack
            key={item.href}
            role="tab"
            aria-label={t(item.labelKey)}
            aria-selected={isActive}
            flex={1}
            alignItems="center"
            justifyContent="center"
            onPress={() => router.push(item.href)}
            pressStyle={PRESS_STYLE}
            cursor="pointer"
            borderTopWidth={isActive ? 2 : 0}
            borderColor={isActive ? '$brand' : 'transparent'}
          >
            <Text
              fontSize="$3"
              fontWeight={isActive ? '$7' : '$4'}
              color={isActive ? '$brand' : '$placeholderColor'}
            >
              {t(item.labelKey)}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}

export default function DashboardLayout() {
  const media = useMedia();

  if (media.gtMd) {
    return (
      <Theme name="light">
        <ResponsiveShell sidebar={<DashboardSidebar />} content={<Slot />} />
      </Theme>
    );
  }

  return (
    <Theme name="light">
      <YStack flex={1}>
        <XStack paddingHorizontal="$4" paddingTop="$2">
          <OrgAdminBadge />
        </XStack>
        {/* SaaS: quota chip above content on mobile */}
        <YStack paddingHorizontal="$4">
          <BookingsQuotaChip />
        </YStack>
        <YStack flex={1}>
          <Slot />
        </YStack>
        <BottomTabBar />
      </YStack>
    </Theme>
  );
}
