import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/billing', () => ({
  useSubscription: jest.fn(),
  useStartPortalSession: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Slot: () => require('react').createElement(require('react-native').View, { testID: 'slot' }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${JSON.stringify(opts)}` : k,
  }),
}));
jest.mock('@core/components/ui/AppButton', () => ({
  AppButton: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
    require('react').createElement(require('react-native').Text, { testID }, children),
}));

import { useSubscription } from '@saas/lib/api/billing';
import { SuspendedShell } from '../SuspendedShell';
import { CancelledShell } from '../CancelledShell';
import { RootShell } from '../RootShell';

const mockUse = useSubscription as jest.Mock;

describe('SuspendedShell', () => {
  it('renders suspended banner', () => {
    const { getByTestId, getByText } = render(<SuspendedShell />);
    expect(getByTestId('suspended-shell')).toBeTruthy();
    expect(getByText('saas:lifecycle.suspendedBanner')).toBeTruthy();
    expect(getByText('saas:lifecycle.restorePayment')).toBeTruthy();
  });
});

describe('CancelledShell', () => {
  it('shows correct days remaining for cancelledAt 30 days ago', () => {
    const cancelledAt = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { getByTestId, getByText } = render(<CancelledShell cancelledAt={cancelledAt} />);
    expect(getByTestId('cancelled-shell')).toBeTruthy();
    // 90 - 30 = 60 days remaining
    expect(getByText(/daysRemaining.*60/)).toBeTruthy();
  });

  it('shows 0 days when past retention window', () => {
    const cancelledAt = new Date(Date.now() - 95 * 86_400_000).toISOString();
    const { getByText } = render(<CancelledShell cancelledAt={cancelledAt} />);
    expect(getByText(/daysRemaining.*0/)).toBeTruthy();
  });
});

describe('RootShell', () => {
  it('renders Slot for active status', () => {
    mockUse.mockReturnValue({ data: { status: 'active', cancelled_at: null } });
    const { getByTestId } = render(<RootShell />);
    expect(getByTestId('slot')).toBeTruthy();
  });

  it('renders SuspendedShell for suspended status', () => {
    mockUse.mockReturnValue({ data: { status: 'suspended', cancelled_at: null } });
    const { getByTestId } = render(<RootShell />);
    expect(getByTestId('suspended-shell')).toBeTruthy();
  });

  it('renders CancelledShell for cancelled status', () => {
    const cancelledAt = new Date(Date.now() - 10 * 86_400_000).toISOString();
    mockUse.mockReturnValue({ data: { status: 'cancelled', cancelled_at: cancelledAt } });
    const { getByTestId } = render(<RootShell />);
    expect(getByTestId('cancelled-shell')).toBeTruthy();
  });

  it('renders Slot for past_due (not suspended)', () => {
    mockUse.mockReturnValue({ data: { status: 'past_due', cancelled_at: null } });
    const { getByTestId } = render(<RootShell />);
    expect(getByTestId('slot')).toBeTruthy();
  });
});
