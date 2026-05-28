import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSubscription } from '../api/billing';

jest.mock('@core/lib/api/client', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@core/lib/api/client';
const mockApiRequest = apiRequest as jest.Mock;

const mockSubscription = {
  tier: 'premium' as const,
  status: 'active' as const,
  trial_ends_at: null,
  current_period_end: '2026-06-28T00:00:00Z',
  cancelled_at: null,
  limits: {
    max_locations: 3,
    max_staff_per_location: 3,
    max_tables: null,
    max_rooms: null,
    max_bookings_per_month: null,
    sms_daily_quota: 10,
  },
  usage: {
    bookings_this_month: 12,
    sms_today: 3,
    locations: 1,
    staff: 2,
    tables: 5,
    rooms: 1,
  },
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useSubscription', () => {
  it('returns subscription data from the API', async () => {
    mockApiRequest.mockResolvedValueOnce(mockSubscription);

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSubscription);
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/billing/subscription/');
  });
});
