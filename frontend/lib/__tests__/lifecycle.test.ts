import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@saas/lib/api/billing', () => ({ useSubscription: jest.fn() }));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { INFO: 'info', SUCCESS: 'success', ERROR: 'error' },
}));

import { useSubscription } from '@saas/lib/api/billing';
import { showToast } from '@saas/lib/toast';
import { useCanWrite, installSuspensionErrorHandler } from '../lifecycle';

const mockUseSubscription = useSubscription as jest.Mock;
const mockShowToast = showToast as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCanWrite', () => {
  it.each(['active', 'trialing', 'past_due'])('returns true for %s', (status) => {
    mockUseSubscription.mockReturnValue({ data: { status } });
    const { result } = renderHook(() => useCanWrite(), { wrapper });
    expect(result.current).toBe(true);
  });

  it.each(['suspended', 'cancelled'])('returns false for %s', (status) => {
    mockUseSubscription.mockReturnValue({ data: { status } });
    const { result } = renderHook(() => useCanWrite(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('returns true when no subscription data', () => {
    mockUseSubscription.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useCanWrite(), { wrapper });
    expect(result.current).toBe(true);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('installSuspensionErrorHandler', () => {
  it('invalidates subscription and shows toast on 403 suspended error', async () => {
    const qc = new QueryClient();
    const invalidate = jest.spyOn(qc, 'invalidateQueries');
    const t = (k: string) => k;

    installSuspensionErrorHandler(qc, t);

    const mutationOptions = qc.getDefaultOptions().mutations;
    await (mutationOptions?.onError as Function)(
      { status: 403, body: { detail: 'Account suspended.' } },
      undefined,
      undefined,
    );

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['subscription'] });
    expect(mockShowToast).toHaveBeenCalledWith(
      'saas:lifecycle.writeBlockedToast',
      'error',
    );
  });

  it('does not react to non-suspension 403 errors', async () => {
    const qc = new QueryClient();
    const invalidate = jest.spyOn(qc, 'invalidateQueries');
    const t = (k: string) => k;

    installSuspensionErrorHandler(qc, t);

    const mutationOptions = qc.getDefaultOptions().mutations;
    await (mutationOptions?.onError as Function)(
      { status: 403, body: { detail: 'Forbidden.' } },
      undefined,
      undefined,
    );

    expect(invalidate).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
