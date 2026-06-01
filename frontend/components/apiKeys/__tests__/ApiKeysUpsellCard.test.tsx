import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@core/constants/styles', () => ({ PRIMARY_ACTION_MIN_HEIGHT: 48 }));

import { useRouter } from 'expo-router';
import { ApiKeysUpsellCard } from '../ApiKeysUpsellCard';

const mockUseRouter = useRouter as jest.Mock;

describe('ApiKeysUpsellCard', () => {
  it('renders the upsell card', () => {
    mockUseRouter.mockReturnValue({ push: jest.fn() });
    const { getByTestId } = render(<ApiKeysUpsellCard />);
    expect(getByTestId('api-keys-upsell-card')).toBeTruthy();
    expect(getByTestId('upsell-upgrade-btn')).toBeTruthy();
  });

  it('pressing upgrade button navigates to billing upgrade', () => {
    const push = jest.fn();
    mockUseRouter.mockReturnValue({ push });
    const { getByTestId } = render(<ApiKeysUpsellCard />);
    fireEvent.press(getByTestId('upsell-upgrade-btn'));
    expect(push).toHaveBeenCalledWith('/(saas)/billing/upgrade');
  });
});
