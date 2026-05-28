import { Slot } from 'expo-router';
import { useSubscription } from '@saas/lib/api/billing';
import { SuspendedShell } from '@saas/components/lifecycle/SuspendedShell';
import { CancelledShell } from '@saas/components/lifecycle/CancelledShell';

export function RootShell() {
  const { data } = useSubscription();

  if (data?.status === 'suspended') {
    return <SuspendedShell />;
  }

  if (data?.status === 'cancelled' && data.cancelled_at) {
    return <CancelledShell cancelledAt={data.cancelled_at} />;
  }

  return <Slot />;
}
