jest.mock('@core/lib/hooks/useStaffRole', () => ({ useStaffRole: jest.fn(), isManager: (r: string) => r === 'manager' }));
jest.mock('@saas/lib/api/platform', () => ({ useAppConfig: jest.fn() }));

import { useStaffRole } from '@core/lib/hooks/useStaffRole';
import { useAppConfig } from '@saas/lib/api/platform';
import { useIsManager, useFeature } from '../features';

const mockRole = useStaffRole as jest.Mock;
const mockConfig = useAppConfig as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useIsManager', () => {
  it('returns true for manager role', () => {
    mockRole.mockReturnValue('manager');
    expect(useIsManager()).toBe(true);
  });

  it('returns false for staff role', () => {
    mockRole.mockReturnValue('staff');
    expect(useIsManager()).toBe(false);
  });
});

describe('useFeature', () => {
  it('returns true when flag is enabled in config', () => {
    mockConfig.mockReturnValue({ data: { features: { apiAccess: true } } });
    expect(useFeature('apiAccess')).toBe(true);
  });

  it('returns false when flag is absent', () => {
    mockConfig.mockReturnValue({ data: { features: {} } });
    expect(useFeature('apiAccess')).toBe(false);
  });

  it('returns false when config not loaded', () => {
    mockConfig.mockReturnValue({ data: undefined });
    expect(useFeature('apiAccess')).toBe(false);
  });
});
