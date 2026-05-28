import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

export type PlanView = {
  slug: 'free' | 'premium' | 'enterprise';
  display_name: string;
  price_cents: number;
  max_locations: number | null;
  max_staff_per_location: number | null;
  max_tables: number | null;
  max_rooms: number | null;
  max_bookings_per_month: number | null;
  sms_daily_quota: number | null;
  feature_flags: Record<string, boolean>;
};

export function usePlans() {
  return useQuery<PlanView[]>({
    queryKey: ['billing-plans'],
    queryFn: () => apiRequest<PlanView[]>('/api/v1/billing/plans/'),
    staleTime: 5 * 60_000,
  });
}
