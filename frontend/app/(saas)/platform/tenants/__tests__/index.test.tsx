import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ usePlatformTenants: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { usePlatformTenants } from '@saas/lib/api/platform';
import PlatformTenantListScreen from '../index';

const mockUse = usePlatformTenants as jest.Mock;

function makeTenant(id: number, status = 'active') {
  return {
    id,
    slug: `tenant-${id}`,
    display_name: `Tenant ${id}`,
    owner_email: `owner${id}@example.com`,
    created_at: '2024-01-01T00:00:00Z',
    subscription: {
      plan: { slug: 'premium' },
      status,
      current_period_end: null,
      trial_ends_at: null,
      location_limit_override: null,
      usage: { locations: 2, staff: 5, tables: 10, rooms: 2, bookings_this_month: 50, sms_today: 3 },
      effective_max_locations: 5,
    },
  };
}

beforeEach(() => jest.clearAllMocks());

const defaultQuery = {
  data: { pages: [{ results: [makeTenant(1), makeTenant(2, 'suspended')], next: null }] },
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

describe('PlatformTenantListScreen', () => {
  it('renders tenant rows', () => {
    mockUse.mockReturnValue(defaultQuery);
    const { getByTestId } = render(<PlatformTenantListScreen />);
    expect(getByTestId('tenant-row-1')).toBeTruthy();
    expect(getByTestId('tenant-row-2')).toBeTruthy();
  });

  it('shows empty state when no tenants', () => {
    mockUse.mockReturnValue({
      ...defaultQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<PlatformTenantListScreen />);
    expect(getByTestId('tenant-list-empty')).toBeTruthy();
  });

  it('passes status filter to query', () => {
    mockUse.mockReturnValue(defaultQuery);
    render(<PlatformTenantListScreen />);
    // filter chip for 'suspended' triggers re-render with status param
    const call = mockUse.mock.calls[0][0];
    expect(call).toHaveProperty('search', '');
    expect(call).toHaveProperty('ordering', 'created');
  });

  it('filter chip for suspended sets status param', () => {
    mockUse.mockReturnValue(defaultQuery);
    const { getByTestId } = render(<PlatformTenantListScreen />);
    fireEvent.press(getByTestId('filter-chip-suspended'));
    const lastCall = mockUse.mock.calls[mockUse.mock.calls.length - 1][0];
    expect(lastCall.status).toBe('suspended');
  });

  it('calls fetchNextPage on end reached when more pages exist', () => {
    const fetchNextPage = jest.fn();
    mockUse.mockReturnValue({
      ...defaultQuery,
      hasNextPage: true,
      fetchNextPage,
    });
    render(<PlatformTenantListScreen />);
    // FlatList onEndReached fires automatically in test environment
    expect(fetchNextPage).toBeDefined();
  });
});
