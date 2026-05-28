import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({
  usePlatformTenant: jest.fn(),
  useOverrideSubscription: jest.fn(),
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { INFO: 'info', SUCCESS: 'success', ERROR: 'error' },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('react-native/Libraries/Alert/Alert', () => ({ alert: jest.fn() }));

import { usePlatformTenant, useOverrideSubscription } from '@saas/lib/api/platform';
import SubscriptionOverridesScreen from '../subscription';

const mockTenant = usePlatformTenant as jest.Mock;
const mockOverride = useOverrideSubscription as jest.Mock;

const mutateAsync = jest.fn().mockResolvedValue(undefined);

function tenantData(extras: object = {}) {
  return {
    isLoading: false,
    data: {
      id: 1,
      slug: 'my-tenant',
      display_name: 'My Tenant',
      owner_email: 'owner@example.com',
      created_at: '2024-01-01T00:00:00Z',
      subscription: {
        plan: { slug: 'premium' },
        status: 'active',
        current_period_end: null,
        trial_ends_at: null,
        location_limit_override: null,
        usage: { locations: 2, staff: 5, tables: 10, rooms: 2, bookings_this_month: 50, sms_today: 3 },
        effective_max_locations: 5,
        ...extras,
      },
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOverride.mockReturnValue({ mutateAsync });
});

describe('SubscriptionOverridesScreen', () => {
  it('changing only location_limit_override sends only that field', async () => {
    mockTenant.mockReturnValue(tenantData());
    const { getByTestId } = render(<SubscriptionOverridesScreen />);
    fireEvent.changeText(getByTestId('location-override-input'), '3');
    fireEvent.press(getByTestId('save-btn'));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ location_limit_override: 3 });
    });
  });

  it('switching plan resets location_limit_override to null in payload', async () => {
    mockTenant.mockReturnValue(tenantData({ location_limit_override: 2 }));
    const { getByTestId } = render(<SubscriptionOverridesScreen />);
    fireEvent.press(getByTestId('plan-btn-enterprise'));
    fireEvent.press(getByTestId('save-btn'));
    await waitFor(() => {
      const patch = mutateAsync.mock.calls[0][0];
      expect(patch.plan).toBe('enterprise');
      expect(patch.location_limit_override).toBeNull();
    });
  });

  it('status override panel is hidden by default', () => {
    mockTenant.mockReturnValue(tenantData());
    const { queryByTestId } = render(<SubscriptionOverridesScreen />);
    expect(queryByTestId('status-override-panel')).toBeNull();
  });

  it('status override panel shows after pressing disclosure', () => {
    mockTenant.mockReturnValue(tenantData());
    const { getByTestId } = render(<SubscriptionOverridesScreen />);
    fireEvent.press(getByTestId('status-disclosure-btn'));
    expect(getByTestId('status-override-panel')).toBeTruthy();
  });
});
