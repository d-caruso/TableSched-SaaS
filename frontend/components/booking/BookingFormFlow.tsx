import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';
import type { ComponentProps } from 'react';
import { BookingFormFlow as CoreBookingFormFlow } from '@core/components/booking/BookingFormFlow';
import { usePublicTenantStatus } from '@saas/lib/api/publicTenantStatus';

// Re-export types core modules depend on from this shadow
export type { Draft, Step } from '@core/components/booking/BookingFormFlow';

type Props = ComponentProps<typeof CoreBookingFormFlow>;

export function BookingFormFlow(props: Props) {
  const { t } = useTranslation();
  const { data } = usePublicTenantStatus(props.tenant);

  const isCancelled = data?.status === 'cancelled';

  if (isCancelled) {
    return (
      <YStack
        backgroundColor="$dangerSubtle"
        borderRadius="$3"
        padding="$4"
        gap="$2"
        testID="booking-cancelled-banner"
      >
        <Text fontSize="$4" color="$dangerText" textAlign="center">
          {t('saas:lifecycle.cancelledCustomerBanner')}
        </Text>
      </YStack>
    );
  }

  return <CoreBookingFormFlow {...props} />;
}
