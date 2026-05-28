import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@saas/lib/api/billing';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

const WRITE_ALLOWED_STATUSES = ['active', 'trialing', 'past_due'] as const;

export function useCanWrite(): boolean {
  const { data } = useSubscription();
  if (!data) return true;
  return (WRITE_ALLOWED_STATUSES as readonly string[]).includes(data.status);
}

const SUSPENDED_DETAIL = 'Account suspended.';

export function installSuspensionErrorHandler(
  queryClient: ReturnType<typeof useQueryClient>,
  t: (key: string) => string,
): void {
  queryClient.setDefaultOptions({
    mutations: {
      onError: (err: unknown) => {
        const apiErr = err as { status?: number; body?: { detail?: string } };
        if (
          apiErr?.status === 403 &&
          apiErr?.body?.detail === SUSPENDED_DETAIL
        ) {
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
          showToast(t('saas:lifecycle.writeBlockedToast'), TOAST_VARIANT.ERROR);
        }
        if (
          apiErr?.status === 429 &&
          typeof apiErr?.body?.detail === 'string' &&
          apiErr.body.detail.includes('API key')
        ) {
          showToast(t('saas:apiKeys.rateLimitedToast'), TOAST_VARIANT.ERROR);
        }
      },
    },
  });
}
