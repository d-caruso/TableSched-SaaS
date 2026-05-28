import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ useExchangeImpersonationToken: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

import { useExchangeImpersonationToken } from '@saas/lib/api/platform';
import { useLocalSearchParams } from 'expo-router';
import ImpersonateCallbackScreen from '../callback';

const mockExchange = useExchangeImpersonationToken as jest.Mock;
const mockParams = useLocalSearchParams as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockReplace.mockClear();
  mockPush.mockClear();
});

describe('ImpersonateCallbackScreen', () => {
  it('shows pending state and redirects to staff dashboard on success', async () => {
    mockExchange.mockReturnValue({ mutateAsync: jest.fn().mockResolvedValue(undefined) });
    mockParams.mockReturnValue({ token: 'tok123', restaurant_id: '1' });
    const { getByTestId } = render(<ImpersonateCallbackScreen />);
    expect(getByTestId('callback-pending')).toBeTruthy();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(staff)/dashboard');
    });
  });

  it('shows error state when exchange fails', async () => {
    mockExchange.mockReturnValue({ mutateAsync: jest.fn().mockRejectedValue(new Error('expired')) });
    mockParams.mockReturnValue({ token: 'bad', restaurant_id: '1' });
    const { findByTestId } = render(<ImpersonateCallbackScreen />);
    expect(await findByTestId('callback-error')).toBeTruthy();
  });

  it('shows error state when params are missing', async () => {
    mockExchange.mockReturnValue({ mutateAsync: jest.fn() });
    mockParams.mockReturnValue({ token: undefined, restaurant_id: undefined });
    const { findByTestId } = render(<ImpersonateCallbackScreen />);
    expect(await findByTestId('callback-error')).toBeTruthy();
  });
});
