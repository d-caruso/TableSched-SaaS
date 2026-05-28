import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

export type ApiKeyView = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export type ApiKeyCreated = ApiKeyView & { raw_key: string };

export type ApiKeyUsageMonth = {
  year: number;
  month: number;
  call_count: number;
};

const API_KEYS_KEY = ['api-keys'] as const;

export function useApiKeys() {
  return useQuery<ApiKeyView[]>({
    queryKey: API_KEYS_KEY,
    queryFn: () => apiRequest<ApiKeyView[]>('/api/v1/platform/api-keys/'),
    staleTime: 30_000,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      apiRequest<ApiKeyCreated>('/api/v1/platform/api-keys/', {
        method: 'POST',
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/v1/platform/api-keys/${id}/`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: API_KEYS_KEY });
      const previous = queryClient.getQueryData<ApiKeyView[]>(API_KEYS_KEY);
      queryClient.setQueryData<ApiKeyView[]>(
        API_KEYS_KEY,
        (old) => old?.filter((k) => k.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(API_KEYS_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}

export function useRenameApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRequest<ApiKeyView>(`/api/v1/platform/api-keys/${id}/`, {
        method: 'PATCH',
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}

export function useApiKeyUsage(id: string) {
  return useQuery<ApiKeyUsageMonth[]>({
    queryKey: ['api-key-usage', id],
    queryFn: () => apiRequest<ApiKeyUsageMonth[]>(`/api/v1/platform/api-keys/${id}/usage/`),
    staleTime: 60_000,
  });
}
