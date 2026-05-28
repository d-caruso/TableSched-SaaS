import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/lifecycle', () => ({ useLifecycleEvents: jest.fn() }));
const KNOWN_KEYS: Record<string, string> = {
  'saas:lifecycle.eventReasonInvoicePaymentFailed': 'Payment failed',
  'saas:lifecycle.eventReasonInvoicePaid': 'Payment received',
  'saas:lifecycle.eventReasonPlatformAdmin': 'Platform admin action',
  'saas:lifecycle.eventReasonOwnerCancelled': 'Cancelled by owner',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => KNOWN_KEYS[k] ?? k,
    i18n: { exists: (k: string) => k in KNOWN_KEYS },
  }),
}));

import { useLifecycleEvents } from '@saas/lib/api/lifecycle';
import { LifecycleHistoryTab } from '../LifecycleHistoryTab';

const mockUse = useLifecycleEvents as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('LifecycleHistoryTab', () => {
  it('renders events sorted descending by date', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: [
        { id: 1, event_type: 'suspended', reason: 'invoice_payment_failed', created_at: '2024-01-01T00:00:00Z' },
        { id: 2, event_type: 'active', reason: 'invoice_paid', created_at: '2024-02-01T00:00:00Z' },
      ],
    });
    const { getAllByText } = render(<LifecycleHistoryTab />);
    const types = getAllByText(/active|suspended/);
    expect(types[0].props.children).toBe('active');
    expect(types[1].props.children).toBe('suspended');
  });

  it('shows history title', () => {
    mockUse.mockReturnValue({ isLoading: false, data: [] });
    const { getByText } = render(<LifecycleHistoryTab />);
    expect(getByText('saas:lifecycle.historyTitle')).toBeTruthy();
  });

  it('uses localised reason label', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: [{ id: 1, event_type: 'suspended', reason: 'invoice_payment_failed', created_at: '2024-01-01T00:00:00Z' }],
    });
    const { getByText } = render(<LifecycleHistoryTab />);
    expect(getByText('Payment failed')).toBeTruthy();
  });

  it('falls back to raw reason when key missing', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: [{ id: 1, event_type: 'active', reason: 'unknown_reason', created_at: '2024-01-01T00:00:00Z' }],
    });
    const { getByText } = render(<LifecycleHistoryTab />);
    expect(getByText('unknown_reason')).toBeTruthy();
  });

  it('renders empty state when no events', () => {
    mockUse.mockReturnValue({ isLoading: false, data: [] });
    const { getByText } = render(<LifecycleHistoryTab />);
    expect(getByText('—')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUse.mockReturnValue({ isLoading: true, data: undefined });
    const { getByTestId } = render(<LifecycleHistoryTab />);
    expect(getByTestId).toBeTruthy();
  });
});
