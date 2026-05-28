import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({
  useIsImpersonating: jest.fn(),
  useEndImpersonation: jest.fn(),
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useIsImpersonating, useEndImpersonation } from '@saas/lib/api/platform';
import { ImpersonationBanner } from '../ImpersonationBanner';

const mockIs = useIsImpersonating as jest.Mock;
const mockEnd = useEndImpersonation as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockEnd.mockReturnValue({ mutateAsync: jest.fn().mockResolvedValue(undefined) });
});

describe('ImpersonationBanner', () => {
  it('renders nothing when not impersonating', () => {
    mockIs.mockReturnValue(false);
    const { queryByTestId } = render(<ImpersonationBanner />);
    expect(queryByTestId('impersonation-banner')).toBeNull();
  });

  it('renders banner when impersonating', () => {
    mockIs.mockReturnValue(true);
    const { getByTestId } = render(<ImpersonationBanner />);
    expect(getByTestId('impersonation-banner')).toBeTruthy();
    expect(getByTestId('end-session-btn')).toBeTruthy();
  });
});
