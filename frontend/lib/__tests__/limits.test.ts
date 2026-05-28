import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLimitState } from '../limits';

jest.mock('@saas/lib/api/billing', () => ({
  useSubscription: jest.fn(),
}));

import { useSubscription } from '@saas/lib/api/billing';
const mockUseSubscription = useSubscription as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useLimitState', () => {
  it('returns atLimit true when usage equals cap', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        limits: { max_tables: 10, max_rooms: 2, max_staff_per_location: 3, max_locations: 1 },
        usage: { tables: 10, rooms: 1, staff: 2, locations: 1 },
      },
    });

    const { result } = renderHook(() => useLimitState('tables'), { wrapper });

    expect(result.current.atLimit).toBe(true);
    expect(result.current.used).toBe(10);
    expect(result.current.cap).toBe(10);
  });

  it('returns atLimit false when cap is null (unlimited)', () => {
    mockUseSubscription.mockReturnValue({
      data: {
        limits: { max_tables: null, max_rooms: null, max_staff_per_location: null, max_locations: null },
        usage: { tables: 999, rooms: 50, staff: 100, locations: 5 },
      },
    });

    const { result } = renderHook(() => useLimitState('tables'), { wrapper });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.cap).toBeNull();
  });

  it('returns default state when subscription is not loaded', () => {
    mockUseSubscription.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useLimitState('rooms'), { wrapper });

    expect(result.current.atLimit).toBe(false);
    expect(result.current.used).toBe(0);
    expect(result.current.cap).toBeNull();
  });
});
