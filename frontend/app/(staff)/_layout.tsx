// Wraps core staff layout so Expo Router assigns this file's path as the
// layout filename (same reason as app/_layout.tsx).
import { YStack } from 'tamagui';
import { PastDueBanner } from '@saas/components/billing/PastDueBanner';
import CoreStaffLayout from '@core/app/(staff)/_layout';

export default function StaffLayout() {
  return <CoreStaffLayout />;
}

// Injects PastDueBanner above all staff screens via the saas-slot pattern.
export function SaaSStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <YStack flex={1}>
      <PastDueBanner />
      {children}
    </YStack>
  );
}
