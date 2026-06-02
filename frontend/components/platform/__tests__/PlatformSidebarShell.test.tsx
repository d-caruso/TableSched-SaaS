import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@core/lib/auth/AuthContext', () => ({ useAuth: () => ({ organization: null, tenant: null }) }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useMedia } from 'tamagui';
import { PlatformSidebarShell } from '../PlatformSidebarShell';

// ResponsiveShell renders the sidebar only on wide viewports; simulate one.
beforeEach(() => {
  jest.clearAllMocks();
  (useMedia as jest.Mock).mockReturnValue({ gtMd: true });
});

describe('PlatformSidebarShell', () => {
  it('renders the SMS nav button', () => {
    const { getByTestId } = render(
      <PlatformSidebarShell><></></PlatformSidebarShell>
    );
    expect(getByTestId('sidebar-sms-nav')).toBeTruthy();
  });

  it('pressing SMS nav button routes to /platform/sms', () => {
    const { getByTestId } = render(
      <PlatformSidebarShell><></></PlatformSidebarShell>
    );
    fireEvent.press(getByTestId('sidebar-sms-nav'));
    expect(mockPush).toHaveBeenCalledWith('/platform/sms');
  });

  it('still renders Tenants and Action log entries', () => {
    const { getByText } = render(
      <PlatformSidebarShell><></></PlatformSidebarShell>
    );
    expect(getByText('saas:platform.tenants.title')).toBeTruthy();
    expect(getByText('saas:platform.actionLog.title')).toBeTruthy();
  });
});
