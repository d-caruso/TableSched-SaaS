import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/publicTenantStatus', () => ({ usePublicTenantStatus: jest.fn() }));
jest.mock('@core/components/booking/BookingFormFlow', () => ({
  BookingFormFlow: () => require('react').createElement(require('react-native').View, { testID: 'core-booking-form' }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { usePublicTenantStatus } from '@saas/lib/api/publicTenantStatus';
import { BookingFormFlow } from '../BookingFormFlow';

const mockUse = usePublicTenantStatus as jest.Mock;

const restaurant = { name: 'Test' };

describe('BookingFormFlow (SaaS shadow)', () => {
  it('renders core form when status is active', () => {
    mockUse.mockReturnValue({ data: { status: 'active' } });
    const { getByTestId } = render(
      <BookingFormFlow tenant="rome" restaurant={restaurant} />
    );
    expect(getByTestId('core-booking-form')).toBeTruthy();
  });

  it('shows cancelled banner when status is cancelled', () => {
    mockUse.mockReturnValue({ data: { status: 'cancelled' } });
    const { getByTestId, getByText } = render(
      <BookingFormFlow tenant="rome" restaurant={restaurant} />
    );
    expect(getByTestId('booking-cancelled-banner')).toBeTruthy();
    expect(getByText('saas:lifecycle.cancelledCustomerBanner')).toBeTruthy();
  });

  it('renders core form when status endpoint is unavailable', () => {
    mockUse.mockReturnValue({ data: undefined });
    const { getByTestId } = render(
      <BookingFormFlow tenant="rome" restaurant={restaurant} />
    );
    expect(getByTestId('core-booking-form')).toBeTruthy();
  });
});
