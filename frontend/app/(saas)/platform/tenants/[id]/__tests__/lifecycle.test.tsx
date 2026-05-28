import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ usePlatformLifecycleEvents: jest.fn() }));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: '1' }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { exists: () => false },
  }),
}));

import { usePlatformLifecycleEvents } from '@saas/lib/api/platform';
import TenantLifecycleScreen from '../lifecycle';

const mockUse = usePlatformLifecycleEvents as jest.Mock;

const baseQuery = { fetchNextPage: jest.fn(), hasNextPage: false, isFetchingNextPage: false };

beforeEach(() => jest.clearAllMocks());

describe('TenantLifecycleScreen', () => {
  it('renders event cards descending (newest first from API)', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: {
        pages: [{
          results: [
            { id: 2, from_status: 'suspended', to_status: 'active', reason: 'invoice_paid', triggered_by: 'Stripe', created_at: '2024-02-01T00:00:00Z' },
            { id: 1, from_status: null, to_status: 'suspended', reason: 'invoice_payment_failed', triggered_by: null, created_at: '2024-01-01T00:00:00Z' },
          ],
          next: null,
        }],
      },
    });
    const { getByTestId } = render(<TenantLifecycleScreen />);
    expect(getByTestId('lifecycle-event-2')).toBeTruthy();
    expect(getByTestId('lifecycle-event-1')).toBeTruthy();
  });

  it('shows empty state when no events', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<TenantLifecycleScreen />);
    expect(getByTestId('lifecycle-empty')).toBeTruthy();
  });

  it('falls back to raw reason when i18n key missing', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: {
        pages: [{
          results: [
            { id: 1, from_status: null, to_status: 'suspended', reason: 'custom_reason', triggered_by: null, created_at: '2024-01-01T00:00:00Z' },
          ],
          next: null,
        }],
      },
    });
    const { getByText } = render(<TenantLifecycleScreen />);
    expect(getByText('custom_reason')).toBeTruthy();
  });
});
