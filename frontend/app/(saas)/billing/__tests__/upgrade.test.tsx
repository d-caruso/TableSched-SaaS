import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@saas/lib/api/plans', () => ({ usePlans: jest.fn() }));
jest.mock('@saas/lib/api/billing', () => ({
  useStartCheckout: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => {
    if (opts) return `${k}:${JSON.stringify(opts)}`;
    return k;
  }}),
}));

import { usePlans } from '@saas/lib/api/plans';
import UpgradeScreen from '../upgrade';

const mockUsePlans = usePlans as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const premiumPlan = { slug: 'premium', display_name: 'Premium', price_cents: 2900, max_locations: 3, max_staff_per_location: 3, max_tables: null, max_rooms: null, max_bookings_per_month: null, sms_daily_quota: 10, feature_flags: {} };
const enterprisePlan = { slug: 'enterprise', display_name: 'Enterprise', price_cents: 7900, max_locations: 8, max_staff_per_location: 10, max_tables: null, max_rooms: null, max_bookings_per_month: null, sms_daily_quota: 30, feature_flags: {} };
const freePlan = { slug: 'free', display_name: 'Free', price_cents: 0, max_locations: 1, max_staff_per_location: 1, max_tables: 10, max_rooms: 2, max_bookings_per_month: 50, sms_daily_quota: null, feature_flags: {} };

describe('UpgradeScreen', () => {
  it('renders paid plan cards when free is available', () => {
    mockUsePlans.mockReturnValue({ data: [freePlan, premiumPlan, enterprisePlan], isLoading: false });
    const { getByText, queryByText } = render(<UpgradeScreen />, { wrapper });
    expect(getByText('saas:billing.choosePremium')).toBeTruthy();
    expect(getByText('saas:billing.chooseEnterprise')).toBeTruthy();
    // No trial banner when free is available
    expect(queryByText(/saas:signup.trialBanner/)).toBeNull();
  });

  it('shows trial banner when free plan is absent', () => {
    mockUsePlans.mockReturnValue({ data: [premiumPlan, enterprisePlan], isLoading: false });
    const { getByText } = render(<UpgradeScreen />, { wrapper });
    expect(getByText(/saas:signup.trialBanner/)).toBeTruthy();
  });

  it('shows spinner while loading', () => {
    mockUsePlans.mockReturnValue({ data: undefined, isLoading: true });
    const { UNSAFE_getByType } = render(<UpgradeScreen />, { wrapper });
    const { Spinner } = require('tamagui');
    expect(UNSAFE_getByType(Spinner)).toBeTruthy();
  });
});
