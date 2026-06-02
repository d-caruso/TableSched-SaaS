import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/billing', () => ({
  useSubscription: jest.fn(),
  useStartPortalSession: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useSubscription } from '@saas/lib/api/billing';
import { PastDueBanner } from '../PastDueBanner';

const mockUse = useSubscription as jest.Mock;

describe('PastDueBanner', () => {
  it('renders banner when status is past_due', () => {
    mockUse.mockReturnValue({ data: { status: 'past_due' } });
    const { getByTestId, getByText } = render(<PastDueBanner />);
    expect(getByTestId('past-due-banner')).toBeTruthy();
    expect(getByText('saas:lifecycle.pastDueBanner')).toBeTruthy();
    expect(getByText('saas:lifecycle.updatePayment')).toBeTruthy();
  });

  it('renders nothing when status is active', () => {
    mockUse.mockReturnValue({ data: { status: 'active' } });
    const { toJSON } = render(<PastDueBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when no data', () => {
    mockUse.mockReturnValue({ data: undefined });
    const { toJSON } = render(<PastDueBanner />);
    expect(toJSON()).toBeNull();
  });
});
