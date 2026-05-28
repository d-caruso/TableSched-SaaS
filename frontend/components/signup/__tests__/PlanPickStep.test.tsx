import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@saas/lib/api/plans', () => ({ usePlans: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${JSON.stringify(opts)}` : k }),
}));
jest.mock('@core/components/ui/AppButton', () => ({
  AppButton: ({ children, onPress, testID }: { children: React.ReactNode; onPress?: () => void; testID?: string }) =>
    require('react').createElement(require('react-native').TouchableOpacity, { onPress, testID }, children),
}));

import { usePlans } from '@saas/lib/api/plans';
import { PlanPickStep } from '../PlanPickStep';

const mockUsePlans = usePlans as jest.Mock;

const freePlan = { slug: 'free', display_name: 'Free', price_cents: 0, max_locations: 1, max_staff_per_location: 1, max_tables: 10, max_rooms: 2, max_bookings_per_month: 50, sms_daily_quota: null, feature_flags: {} };
const premiumPlan = { slug: 'premium', display_name: 'Premium', price_cents: 2900, max_locations: 3, max_staff_per_location: 3, max_tables: null, max_rooms: null, max_bookings_per_month: null, sms_daily_quota: 10, feature_flags: {} };
const enterprisePlan = { slug: 'enterprise', display_name: 'Enterprise', price_cents: 7900, max_locations: 8, max_staff_per_location: 10, max_tables: null, max_rooms: null, max_bookings_per_month: null, sms_daily_quota: 30, feature_flags: {} };

describe('PlanPickStep', () => {
  it('renders all plans including free when available', () => {
    mockUsePlans.mockReturnValue({ data: [freePlan, premiumPlan, enterprisePlan], isLoading: false });
    const { getByText, queryByText } = render(<PlanPickStep onSelect={jest.fn()} />);
    expect(getByText('Free')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Enterprise')).toBeTruthy();
    expect(queryByText(/saas:signup.trialBanner/)).toBeNull();
  });

  it('hides Free card and shows trial banner when free plan absent', () => {
    mockUsePlans.mockReturnValue({ data: [premiumPlan, enterprisePlan], isLoading: false });
    const { queryByText, getByText } = render(<PlanPickStep onSelect={jest.fn()} />);
    expect(queryByText('Free')).toBeNull();
    expect(getByText(/saas:signup.trialBanner/)).toBeTruthy();
  });

  it('calls onSelect with the correct slug when plan is chosen', () => {
    mockUsePlans.mockReturnValue({ data: [premiumPlan], isLoading: false });
    const onSelect = jest.fn();
    const { getByTestId } = render(<PlanPickStep onSelect={onSelect} />);
    fireEvent.press(getByTestId('plan-pick-premium'));
    expect(onSelect).toHaveBeenCalledWith('premium');
  });

  it('shows spinner while loading', () => {
    mockUsePlans.mockReturnValue({ data: undefined, isLoading: true });
    const { UNSAFE_getByType } = render(<PlanPickStep onSelect={jest.fn()} />);
    const { Spinner } = require('tamagui');
    expect(UNSAFE_getByType(Spinner)).toBeTruthy();
  });
});
