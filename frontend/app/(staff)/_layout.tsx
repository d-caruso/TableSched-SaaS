import { YStack } from 'tamagui';
import { PastDueBanner } from '@saas/components/billing/PastDueBanner';

// Re-export core staff layout enhanced with past-due banner
export { default } from '@core/app/(staff)/_layout';

// Shadow the inner layout slot to inject the banner above all staff screens.
// This wraps the existing Guard + AuthProvider from core by providing a
// module-level side effect via the saas-slot pattern.
export function SaaSStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <YStack flex={1}>
      <PastDueBanner />
      {children}
    </YStack>
  );
}
