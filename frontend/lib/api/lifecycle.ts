import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

export type LifecycleEvent = {
  id: number;
  event_type: string;
  reason: string | null;
  created_at: string;
};

export function useLifecycleEvents() {
  return useQuery<LifecycleEvent[]>({
    queryKey: ['lifecycle-events'],
    queryFn: () => apiRequest<LifecycleEvent[]>('/api/v1/billing/lifecycle-events/'),
    staleTime: 60_000,
  });
}
