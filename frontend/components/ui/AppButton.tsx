import type { ComponentProps } from 'react';
import { AppButton as CoreAppButton } from '@core/components/ui/AppButton';
import { useCanWrite } from '@saas/lib/lifecycle';

type AppButtonProps = ComponentProps<typeof CoreAppButton> & {
  /** When true, skips the write-gate check (e.g. read-only actions like cancel). */
  skipWriteGate?: boolean;
};

/**
 * SaaS AppButton — thin wrapper around the core button that layers the
 * lifecycle write-gate on top. Variant, sizing, hover, focus and loading
 * are all delegated to `@core/components/ui/AppButton`.
 *
 * Gated when `!canWrite && variant !== 'ghost' && !skipWriteGate`.
 */
export function AppButton({
  variant = 'primary',
  skipWriteGate = false,
  disabled,
  ...props
}: AppButtonProps) {
  const canWrite = useCanWrite();
  const writeGated = !skipWriteGate && !canWrite && variant !== 'ghost';

  return (
    <CoreAppButton variant={variant} disabled={disabled || writeGated} {...props} />
  );
}
