import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// ---------------------------------------------------------------------------
// Tenant detail
// ---------------------------------------------------------------------------

export function usePlatformTenant(id: number) {
  return useQuery<PlatformTenantView>({
    queryKey: ['platform-tenant', id],
    queryFn: () => apiRequest<PlatformTenantView>(`/api/v1/platform/tenants/${id}/`),
    staleTime: 30_000,
  });
}

function useTenantMutation(id: number, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest(`/api/v1/platform/tenants/${id}/${path}/`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    },
  });
}

export function useSuspendTenant(id: number) { return useTenantMutation(id, 'suspend'); }
export function useReactivateTenant(id: number) { return useTenantMutation(id, 'reactivate'); }
export function useCancelTenant(id: number) { return useTenantMutation(id, 'cancel'); }

export function useDeleteTenantSchema(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest(`/api/v1/platform/tenants/${id}/delete/`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Lifecycle events (per-tenant)
// ---------------------------------------------------------------------------

type PaginatedLifecycleEvents = {
  results: PlatformLifecycleEvent[];
  next: string | null;
};

export function usePlatformLifecycleEvents(tenantId: number) {
  return useInfiniteQuery<PaginatedLifecycleEvents>({
    queryKey: ['platform-lifecycle-events', tenantId],
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      return apiRequest<PaginatedLifecycleEvents>(
        `/api/v1/platform/tenants/${tenantId}/lifecycle-events/${qs}`,
      );
    },
    getNextPageParam: (last) => last.next ?? undefined,
    initialPageParam: undefined,
  });
}

// ---------------------------------------------------------------------------
// Action log (global)
// ---------------------------------------------------------------------------

export type ActionLogFilters = {
  actor?: string;
  action?: string;
  tenant?: string;
};

type PaginatedActionLog = {
  results: PlatformActionLogEntry[];
  next: string | null;
};

export function usePlatformActionLog(filters: ActionLogFilters) {
  return useInfiniteQuery<PaginatedActionLog>({
    queryKey: ['platform-action-log', filters],
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (filters.actor) qs.set('actor', filters.actor);
      if (filters.action) qs.set('action', filters.action);
      if (filters.tenant) qs.set('tenant', filters.tenant);
      if (pageParam) qs.set('cursor', pageParam as string);
      return apiRequest<PaginatedActionLog>(`/api/v1/platform/action-log/?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.next ?? undefined,
    initialPageParam: undefined,
  });
}

export type SubscriptionOverridePatch = {
  plan?: string;
  location_limit_override?: number | null;
  trial_ends_at?: string | null;
  status?: string;
};

export function useOverrideSubscription(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: SubscriptionOverridePatch) =>
      apiRequest(`/api/v1/platform/tenants/${id}/subscription/`, {
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    },
  });
}
