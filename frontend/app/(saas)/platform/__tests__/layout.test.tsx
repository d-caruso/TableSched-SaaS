import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ useAppConfig: jest.fn() }));
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

import { useMedia } from 'tamagui';
import { useAppConfig } from '@saas/lib/api/platform';
import PlatformLayout from '../_layout';

const mockUseAppConfig = useAppConfig as jest.Mock;

// ResponsiveShell renders the sidebar only on wide viewports; simulate one.
beforeEach(() => {
  jest.clearAllMocks();
  (useMedia as jest.Mock).mockReturnValue({ gtMd: true });
});

describe('PlatformLayout', () => {
  it('renders nothing while config is loading', () => {
    mockUseAppConfig.mockReturnValue({ data: undefined, isLoading: true });
    const { toJSON } = render(<PlatformLayout />);
    expect(toJSON()).toBeNull();
  });

  it('redirects to / when not platform staff', () => {
    mockUseAppConfig.mockReturnValue({ data: { features: { platformAdmin: false } }, isLoading: false });
    const { getByTestId } = render(<PlatformLayout />);
    expect(getByTestId('redirect')).toBeTruthy();
  });

  it('renders sidebar shell with slot when platform staff', () => {
    mockUseAppConfig.mockReturnValue({ data: { features: { platformAdmin: true } }, isLoading: false });
    const { getByTestId } = render(<PlatformLayout />);
    expect(getByTestId('platform-sidebar')).toBeTruthy();
    expect(getByTestId('slot')).toBeTruthy();
  });
});
