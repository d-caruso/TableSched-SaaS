import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/me', () => ({ useMe: jest.fn() }));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { View, Text } = require('react-native');
    return require('react').createElement(View, { testID: 'redirect' },
      require('react').createElement(Text, null, href));
  },
}));

import { useMe } from '@saas/lib/api/me';
import { Spinner } from 'tamagui';
import Index from '../index';

const mockUseMe = useMe as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('Index', () => {
  it('shows a spinner while loading', () => {
    mockUseMe.mockReturnValue({ data: undefined, isLoading: true });
    const { UNSAFE_getByType } = render(<Index />);
    expect(UNSAFE_getByType(Spinner)).toBeTruthy();
  });

  it('redirects platform staff to /platform/tenants', () => {
    mockUseMe.mockReturnValue({
      data: { email: 'admin@example.com', platformAdmin: true, role: null },
      isLoading: false,
    });
    const { getByTestId, getByText } = render(<Index />);
    expect(getByTestId('redirect')).toBeTruthy();
    expect(getByText('/platform/tenants')).toBeTruthy();
  });

  it('redirects restaurant staff to /(staff)/dashboard', () => {
    mockUseMe.mockReturnValue({
      data: { email: 'staff@example.com', platformAdmin: false, role: 'manager' },
      isLoading: false,
    });
    const { getByTestId, getByText } = render(<Index />);
    expect(getByTestId('redirect')).toBeTruthy();
    expect(getByText('/(staff)/dashboard')).toBeTruthy();
  });
});
