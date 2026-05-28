import { useSubscription } from '@saas/lib/api/billing';

type LimitResource = 'tables' | 'rooms' | 'staff' | 'locations';

type LimitState = {
  atLimit: boolean;
  used: number;
  cap: number | null;
};

export function useLimitState(resource: LimitResource): LimitState {
  const { data } = useSubscription();

  if (!data) {
    return { atLimit: false, used: 0, cap: null };
  }

  const capKey = `max_${resource}` as keyof typeof data.limits;
  const cap = data.limits[capKey] as number | null;
  const used = data.usage[resource as keyof typeof data.usage] as number;

  return {
    atLimit: cap !== null && used >= cap,
    used,
    cap,
  };
}
