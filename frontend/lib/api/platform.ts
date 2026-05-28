import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type PlatformTenantView = {
  id: number;
  slug: string;
  display_name: string;
  owner_email: string;
  created_at: string;
  subscription: {
    plan: { slug: string };
    status: 'active' | 'trialing' | 'past_due' | 'suspended' | 'cancelled';
    current_period_end: string | null;
    trial_ends_at: string | null;
    location_limit_override: number | null;
    usage: {
      locations: number;
      staff: number;
      tables: number;
      rooms: number;
      bookings_this_month: number;
      sms_today: number;
    };
    effective_max_locations: number | null;
  };
};

export type PlatformLifecycleEvent = {
  id: number;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  triggered_by: string | null;
  created_at: string;
};

export type PlatformActionLogEntry = {
  id: number;
  actor_email: string;
  action: string;
  target_tenant_slug: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Config — platform staff feature flag
// ---------------------------------------------------------------------------

type AppConfig = {
  features: Record<string, boolean>;
};

export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: ['app-config'],
    queryFn: () => apiRequest<AppConfig>('/api/v1/config/'),
    staleTime: 5 * 60_000,
  });
}

export function useIsPlatformStaff(): boolean {
  const { data } = useAppConfig();
  return data?.features?.platformAdmin === true;
}

// ---------------------------------------------------------------------------
// Tenant list — paginated
// ---------------------------------------------------------------------------

export type TenantListParams = {
  search?: string;
  status?: string;
  ordering?: string;
  cursor?: string;
};

type PaginatedTenants = {
  results: PlatformTenantView[];
  next: string | null;
};

export function usePlatformTenants(params: TenantListParams) {
  return useInfiniteQuery<PaginatedTenants>({
    queryKey: ['platform-tenants', params],
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.status) qs.set('status', params.status);
      if (params.ordering) qs.set('ordering', params.ordering);
      if (pageParam) qs.set('cursor', pageParam as string);
      return apiRequest<PaginatedTenants>(`/api/v1/platform/tenants/?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.next ?? undefined,
    initialPageParam: undefined,
  });
}
