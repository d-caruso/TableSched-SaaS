import { useStaffRole, isManager } from '@core/lib/hooks/useStaffRole';
import { useAppConfig } from '@saas/lib/api/platform';

export function useIsManager(): boolean {
  const role = useStaffRole();
  return isManager(role);
}

export function useFeature(flag: string): boolean {
  const { data } = useAppConfig();
  return data?.features?.[flag] === true;
}
