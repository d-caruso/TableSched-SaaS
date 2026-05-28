import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@core/lib/api/client';

type TenantStatus = {
  is_active: boolean;
  status: 'active' | 'suspended' | 'cancelled';
};

async function fetchTenantStatus(tenant: string): Promise<TenantStatus> {
  const res = await fetch(`/api/v1/public/${tenant}/status/`);
  if (!res.ok) throw new ApiError(res.status, 'TENANT_STATUS_ERROR');
  return res.json();
}

export function usePublicTenantStatus(tenant: string) {
  return useQuery<TenantStatus>({
    queryKey: ['public-tenant-status', tenant],
    queryFn: () => fetchTenantStatus(tenant),
    // Falls back gracefully — if endpoint missing, treat as active
    retry: false,
    staleTime: 60_000,
  });
}
