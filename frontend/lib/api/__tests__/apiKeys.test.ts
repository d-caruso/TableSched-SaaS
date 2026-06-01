import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@core/lib/api/client', () => ({ apiRequest: jest.fn() }));

import { apiRequest } from '@core/lib/api/client';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRenameApiKey,
  ApiKeyView,
} from '../apiKeys';

const mockApi = apiRequest as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const keyFixture: ApiKeyView = {
  id: 'k1',
  name: 'PROD',
  key_prefix: 'tse_abc',
  last_used_at: null,
  expires_at: null,
  is_active: true,
};

beforeEach(() => jest.clearAllMocks());

describe('useApiKeys', () => {
  it('fetches the key list', async () => {
    mockApi.mockResolvedValue([keyFixture]);
    const { result } = renderHook(() => useApiKeys(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([keyFixture]));
    expect(mockApi).toHaveBeenCalledWith('/api/v1/platform/api-keys/');
  });
});

describe('useCreateApiKey', () => {
  it('posts to the create endpoint and returns raw_key in result', async () => {
    const created = { ...keyFixture, raw_key: 'tse_FULL_KEY' };
    mockApi.mockResolvedValueOnce(created);
    const { result } = renderHook(() => useCreateApiKey(), { wrapper });
    result.current.mutate({ name: 'PROD' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.raw_key).toBe('tse_FULL_KEY');
    expect(result.current.data?.name).toBe('PROD');
  });
});

describe('useRevokeApiKey', () => {
  it('calls delete endpoint with the correct id', async () => {
    mockApi.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useRevokeApiKey(), { wrapper });
    result.current.mutate('k1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith('/api/v1/platform/api-keys/k1/', { method: 'DELETE' });
  });
});

describe('useRenameApiKey', () => {
  it('patches the correct endpoint', async () => {
    mockApi.mockResolvedValueOnce({ ...keyFixture, name: 'Renamed' });
    const { result } = renderHook(() => useRenameApiKey(), { wrapper });
    result.current.mutate({ id: 'k1', name: 'Renamed' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith('/api/v1/platform/api-keys/k1/', {
      method: 'PATCH',
      body: { name: 'Renamed' },
    });
  });
});
