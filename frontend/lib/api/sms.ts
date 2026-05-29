import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProviderHealth = {
  provider: string;
  delivery_rate: number;
  total_sent: number;
  status: 'healthy' | 'degraded';
};

export type SmsDeliveryLogEntry = {
  id: string;
  sent_at: string;
  phone: string;
  provider: string;
  status: 'pending' | 'delivered' | 'failed';
  error_code: string;
};

export type SmsDeliveryLogFilters = {
  provider?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
};

export type RoutingEntry = {
  prefix: string;
  providers: string[];
};

type PaginatedDeliveryLog = {
  results: SmsDeliveryLogEntry[];
  next: string | null;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSmsProviderHealth(): UseQueryResult<ProviderHealth[]> {
  return useQuery<ProviderHealth[]>({
    queryKey: ['sms-provider-health'],
    queryFn: () => apiRequest<ProviderHealth[]>('/api/v1/platform/sms/health/'),
    refetchInterval: 60_000,
  });
}

export function useSmsDeliveryLog(filters: SmsDeliveryLogFilters) {
  return useInfiniteQuery<PaginatedDeliveryLog>({
    queryKey: ['sms-delivery-log', filters],
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (filters.provider) qs.set('provider', filters.provider);
      if (filters.status) qs.set('status', filters.status);
      if (filters.date_from) qs.set('date_from', filters.date_from);
      if (filters.date_to) qs.set('date_to', filters.date_to);
      if (pageParam) qs.set('cursor', pageParam as string);
      return apiRequest<PaginatedDeliveryLog>(`/api/v1/platform/sms/delivery-log/?${qs.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    initialPageParam: undefined,
  });
}

export function useSmsRoutingTable(): UseQueryResult<RoutingEntry[]> {
  return useQuery<RoutingEntry[]>({
    queryKey: ['sms-routing-table'],
    queryFn: () => apiRequest<RoutingEntry[]>('/api/v1/platform/sms/routing/'),
  });
}
