import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@core/lib/api/endpoints', () => ({ publicApi: { createBooking: jest.fn() } }));
jest.mock('@core/components/ui/AppButton', () => ({
  AppButton: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@core/constants/styles', () => ({
  PRIMARY_ACTION_MIN_HEIGHT: 48,
  PRIMARY_ACTION_FONT_SIZE: 16,
}));

import { publicApi } from '@core/lib/api/endpoints';
import { ApiError } from '@core/lib/api/client';
import { StepDone } from '../steps/StepDone';

const mockCreateBooking = publicApi.createBooking as jest.Mock;

const draft = {
  date: '2026-06-01',
  time: '19:00',
  party_size: 2,
  name: 'Jane',
  phone: '+39 333 1234567',
  email: 'jane@example.com',
};

describe('StepDone (SaaS shadow)', () => {
  it('shows quota exceeded message on 409', async () => {
    mockCreateBooking.mockRejectedValueOnce(new ApiError(409, 'BOOKING_QUOTA_EXCEEDED'));
    const { getByText } = render(
      <StepDone tenant="rome" draft={draft} />
    );
    await waitFor(() => {
      expect(getByText('saas:limits.bookingsReachedCustomer')).toBeTruthy();
    });
  });

  it('shows generic error on non-409 failure', async () => {
    mockCreateBooking.mockRejectedValueOnce(new ApiError(500, 'SERVER_ERROR'));
    const { getByText } = render(
      <StepDone tenant="rome" draft={draft} />
    );
    await waitFor(() => {
      expect(getByText('common.error')).toBeTruthy();
    });
  });

  it('shows success state on successful booking', async () => {
    mockCreateBooking.mockResolvedValueOnce({ token: 'abc123' });
    const { getByText } = render(
      <StepDone tenant="rome" draft={draft} />
    );
    await waitFor(() => {
      expect(getByText('booking.page.bookingConfirmed')).toBeTruthy();
    });
  });
});
