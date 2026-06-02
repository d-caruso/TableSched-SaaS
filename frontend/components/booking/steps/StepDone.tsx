import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Text, YStack } from 'tamagui';
import { AppButton } from '@core/components/ui/AppButton';
import { PRIMARY_ACTION_MIN_HEIGHT, PRIMARY_ACTION_FONT_SIZE } from '@core/constants/styles';
import { publicApi } from '@core/lib/api/endpoints';
import { ApiError } from '@core/lib/api/client';
import type { Draft } from '@core/components/booking/BookingFormFlow';

type StepDoneProps = {
  tenant: string;
  draft: Draft;
  onDone?: () => void;
  onNewBooking?: () => void;
};

export function StepDone({ tenant, draft, onDone, onNewBooking }: StepDoneProps) {
  const { t } = useTranslation();
  const fired = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    void (async () => {
      try {
        const starts_at = `${draft.date ?? ''}T${draft.time ?? '00:00'}:00`;
        await publicApi.createBooking(tenant, {
          starts_at,
          party_size: draft.party_size ?? 1,
          name: draft.name ?? '',
          phone: draft.phone ?? '',
          email: draft.email || undefined,
          locale: draft.locale || undefined,
          notes: draft.notes || undefined,
        });
        setIsSuccess(true);
        onDone?.();
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setIsQuotaExceeded(true);
        } else {
          setError(t('common.error'));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [draft, onDone, t, tenant]);

  if (isLoading) {
    return (
      <YStack testID="step-done" alignItems="center" justifyContent="center" padding="$6" gap="$4">
        <Spinner size="large" color="$brand" />
        <Text fontSize="$4" color="$placeholderColor">{t('common.loading')}</Text>
      </YStack>
    );
  }

  if (isQuotaExceeded) {
    return (
      <YStack testID="step-done" alignItems="center" padding="$6" gap="$3">
        <Text fontSize="$6" color="$danger" textAlign="center">
          {t('saas:limits.bookingsReachedCustomer')}
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack testID="step-done" alignItems="center" padding="$6" gap="$3">
        <Text fontSize="$6" color="$danger">{error}</Text>
      </YStack>
    );
  }

  if (isSuccess) {
    return (
      <YStack testID="step-done" alignItems="center" padding="$6" gap="$4">
        <YStack
          width={72}
          height={72}
          borderRadius={99}
          backgroundColor="$brand"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={36} color="$background">✓</Text>
        </YStack>
        <YStack alignItems="center" gap="$2">
          <Text fontSize="$7" fontWeight="$8" color="$brand">
            {t('booking.page.bookingConfirmed')}
          </Text>
          <Text fontSize="$4" color="$placeholderColor" textAlign="center">
            {draft.name ? t('booking.page.booking_confirmed_subtitle', { name: draft.name, defaultValue: `Thank you, ${draft.name}!` }) : ''}
          </Text>
        </YStack>
        {onNewBooking ? (
          <AppButton
            variant="secondary"
            borderRadius="$5"
            paddingHorizontal="$6"
            minHeight={PRIMARY_ACTION_MIN_HEIGHT}
            fontSize={PRIMARY_ACTION_FONT_SIZE}
            onPress={onNewBooking}
          >
            {t('booking.page.new_booking', { defaultValue: 'Make another booking' })}
          </AppButton>
        ) : null}
      </YStack>
    );
  }

  return <YStack testID="step-done" />;
}
