import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@core/lib/api/client';

export type PlanLimits = {
  max_locations: number | null;
  max_staff_per_location: number | null;
  max_tables: number | null;
  max_rooms: number | null;
  max_bookings_per_month: number | null;
  sms_daily_quota: number | null;
};

export type SubscriptionView = {
  tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'suspended';
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  limits: PlanLimits;
  usage: {
    bookings_this_month: number;
    sms_today: number;
    locations: number;
    staff: number;
    tables: number;
    rooms: number;
  };
};

const SUBSCRIPTION_KEY = ['subscription'] as const;

export function useSubscription() {
  const queryClient = useQueryClient();

  // Invalidate on app focus (web visibility change + native AppState)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
      }
    }, { once: false });
  }

  return useQuery<SubscriptionView>({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => apiRequest<SubscriptionView>('/api/v1/billing/subscription/'),
    staleTime: 30_000,
  });
}

export function useStartPortalSession() {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ url: string }>('/api/v1/billing/portal-session/', {
        method: 'POST',
      }),
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: ({ plan }: { plan: string }) =>
      apiRequest<{ url: string }>('/api/v1/billing/checkout-session/', {
        method: 'POST',
        body: { plan_slug: plan },
      }),
  });
}

export function invalidateSubscription(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
}
