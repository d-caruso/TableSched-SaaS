import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@saas/lib/api/billing', () => ({
  useSubscription: jest.fn(),
  useStartPortalSession: jest.fn(),
}));

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => {
    if (opts) return `${k}:${JSON.stringify(opts)}`;
    return k;
  }}),
}));

import { useSubscription, useStartPortalSession } from '@saas/lib/api/billing';
import BillingScreen from '../index';

const mockUseSubscription = useSubscription as jest.Mock;
const mockUsePortal = useStartPortalSession as jest.Mock;

const mockMutateAsync = jest.fn().mockResolvedValue({ url: 'https://stripe.com/portal' });

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const baseSubscription = {
  tier: 'premium' as const,
  status: 'active' as const,
  trial_ends_at: null,
  current_period_end: '2026-06-28T00:00:00Z',
  cancelled_at: null,
  limits: { max_locations: 3, max_staff_per_location: 3, max_tables: null, max_rooms: null, max_bookings_per_month: null, sms_daily_quota: 10 },
  usage: { bookings_this_month: 12, sms_today: 3, locations: 1, staff: 2, tables: 5, rooms: 1 },
};

beforeEach(() => {
  mockUsePortal.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
});

describe('BillingScreen', () => {
  it('renders plan card and usage for premium', () => {
    mockUseSubscription.mockReturnValue({ data: baseSubscription, isLoading: false });
    const { getByText } = render(<BillingScreen />, { wrapper });
    expect(getByText('saas:billing.tierPremium')).toBeTruthy();
    expect(getByText('saas:billing.managePayment')).toBeTruthy();
  });

  it('renders upgrade button for free tier', () => {
    mockUseSubscription.mockReturnValue({
      data: { ...baseSubscription, tier: 'free' },
      isLoading: false,
    });
    const { getByText } = render(<BillingScreen />, { wrapper });
    expect(getByText('saas:billing.upgrade')).toBeTruthy();
  });

  it('shows trial banner when status is trialing', () => {
    mockUseSubscription.mockReturnValue({
      data: { ...baseSubscription, status: 'trialing', trial_ends_at: new Date(Date.now() + 5 * 86_400_000).toISOString() },
      isLoading: false,
    });
    const { getByText } = render(<BillingScreen />, { wrapper });
    expect(getByText(/saas:billing.trialEndsIn/)).toBeTruthy();
  });

  it('shows spinner while loading', () => {
    mockUseSubscription.mockReturnValue({ data: undefined, isLoading: true });
    const { UNSAFE_getByType } = render(<BillingScreen />, { wrapper });
    const { Spinner } = require('tamagui');
    expect(UNSAFE_getByType(Spinner)).toBeTruthy();
  });
});
