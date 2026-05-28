import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@saas/lib/api/billing';
import { showToast, TOAST_VARIANT } from '@saas/lib/toast';

/**
 * Mounts inside the SaaS root slot. Watches subscription status and fires a
 * success toast exactly once when the transition suspended → active occurs.
 * Renders nothing — side-effect only.
 */
export function ReactivationToast() {
  const { t } = useTranslation();
  const { data } = useSubscription();
  const prevStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const current = data?.status;
    const prev = prevStatusRef.current;

    if (prev === 'suspended' && current === 'active') {
      showToast(t('saas:lifecycle.reactivatedToast'), TOAST_VARIANT.SUCCESS);
    }

    prevStatusRef.current = current;
  }, [data?.status, t]);

  return null;
}
