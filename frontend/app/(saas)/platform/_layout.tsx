import { Redirect, Slot } from 'expo-router';
import { useIsPlatformStaff } from '@saas/lib/api/platform';
import { PlatformSidebarShell } from '@saas/components/platform/PlatformSidebarShell';

export default function PlatformLayout() {
  const allowed = useIsPlatformStaff();
  if (!allowed) return <Redirect href="/" />;
  return (
    <PlatformSidebarShell>
      <Slot />
    </PlatformSidebarShell>
  );
}
