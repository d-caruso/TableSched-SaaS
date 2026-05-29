import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useSmsProviderHealth,
  useSmsDeliveryLog,
  useSmsRoutingTable,
} from '../api/sms';

jest.mock('@core/lib/api/client', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@core/lib/api/client';
const mockApiRequest = apiRequest as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useSmsProviderHealth', () => {
  it('fetches provider health from the correct endpoint', async () => {
    const mockData = [
      { provider: 'twilio', delivery_rate: 0.92, total_sent: 234, status: 'healthy' as const },
      { provider: 'infobip', delivery_rate: 0.96, total_sent: 891, status: 'healthy' as const },
      { provider: 'smsapi', delivery_rate: 0.41, total_sent: 57, status: 'degraded' as const },
    ];
    mockApiRequest.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useSmsProviderHealth(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/platform/sms/health/');
  });
});

describe('useSmsDeliveryLog', () => {
  it('fetches the first page without filters', async () => {
    const mockPage = {
      results: [
        {
          id: 'abc123',
          sent_at: '2026-05-29T14:02:00Z',
          phone: '+39123456789',
          provider: 'twilio',
          status: 'delivered' as const,
          error_code: '',
        },
      ],
      next: null,
    };
    mockApiRequest.mockResolvedValueOnce(mockPage);

    const { result } = renderHook(() => useSmsDeliveryLog({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0]).toEqual(mockPage);
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/platform/sms/delivery-log/?');
  });

  it('appends filter query params', async () => {
    const mockPage = { results: [], next: null };
    mockApiRequest.mockResolvedValueOnce(mockPage);

    const { result } = renderHook(
      () => useSmsDeliveryLog({ provider: 'infobip', status: 'failed', date_from: '2026-05-01', date_to: '2026-05-29' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/platform/sms/delivery-log/?provider=infobip&status=failed&date_from=2026-05-01&date_to=2026-05-29'
    );
  });

  it('uses getNextPageParam from last page cursor', async () => {
    const page1 = {
      results: [
        { id: '1', sent_at: '', phone: '', provider: 'twilio', status: 'delivered' as const, error_code: '' },
      ],
      next: 'cursor-abc',
    };
    const page2 = { results: [], next: null };
    mockApiRequest.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const { result } = renderHook(() => useSmsDeliveryLog({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/platform/sms/delivery-log/?cursor=cursor-abc');
  });
});

describe('useSmsRoutingTable', () => {
  it('fetches routing table from the correct endpoint', async () => {
    const mockData = [
      { prefix: '+39', providers: ['smsapi', 'infobip', 'twilio'] },
      { prefix: '+44', providers: ['infobip', 'twilio'] },
      { prefix: 'default', providers: ['twilio'] },
    ];
    mockApiRequest.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useSmsRoutingTable(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/platform/sms/routing/');
  });
});
