import { Redirect, Slot } from 'expo-router';
import { useAppConfig } from '@saas/lib/api/platform';
import { PlatformSidebarShell } from '@saas/components/platform/PlatformSidebarShell';

export default function PlatformLayout() {
  const { data, isLoading } = useAppConfig();

  // Don't redirect while the config is still loading — doing so during SSR
  // (or before the first query resolves) would produce a premature redirect
  // to "/" because data is undefined until the fetch completes.
  if (isLoading) return null;

  if (!data?.features?.platformAdmin) return <Redirect href="/" />;

  return (
    <PlatformSidebarShell>
      <Slot />
    </PlatformSidebarShell>
  );
}
