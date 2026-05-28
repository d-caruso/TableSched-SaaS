import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ useIsPlatformStaff: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@core/lib/auth/AuthContext', () => ({ useAuth: () => ({ organization: { name: 'Test Org' }, tenant: 'test' }) }));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { View, Text } = require('react-native');
    return require('react').createElement(View, { testID: 'redirect' },
      require('react').createElement(Text, null, href));
  },
  Slot: () => {
    const { View } = require('react-native');
    return require('react').createElement(View, { testID: 'slot' });
  },
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useIsPlatformStaff } from '@saas/lib/api/platform';
import PlatformLayout from '../_layout';

const mockAllowed = useIsPlatformStaff as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('PlatformLayout', () => {
  it('redirects to / when not platform staff', () => {
    mockAllowed.mockReturnValue(false);
    const { getByTestId } = render(<PlatformLayout />);
    expect(getByTestId('redirect')).toBeTruthy();
  });

  it('renders sidebar shell with slot when platform staff', () => {
    mockAllowed.mockReturnValue(true);
    const { getByTestId } = render(<PlatformLayout />);
    expect(getByTestId('platform-sidebar')).toBeTruthy();
    expect(getByTestId('slot')).toBeTruthy();
  });
});
