import { YStack } from 'tamagui';
import { NotificationTemplatesSection as CoreSection } from '@core/components/settings/NotificationTemplatesSection';
import { SmsQuotaBlock } from '@saas/components/billing/SmsQuotaBlock';

export function NotificationTemplatesSection() {
  return (
    <YStack gap="$4">
      <SmsQuotaBlock />
      <CoreSection />
    </YStack>
  );
}
