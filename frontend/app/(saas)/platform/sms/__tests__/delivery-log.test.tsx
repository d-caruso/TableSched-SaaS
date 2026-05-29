import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@saas/lib/api/sms', () => ({ useSmsDeliveryLog: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useSmsDeliveryLog } from '@saas/lib/api/sms';
import SmsDeliveryLogScreen, { maskPhone } from '../delivery-log';

const mockUse = useSmsDeliveryLog as jest.Mock;
const baseQuery = { fetchNextPage: jest.fn(), hasNextPage: false, isFetchingNextPage: false };

function makeEntry(id: string, overrides: Partial<{ provider: string; status: 'pending' | 'delivered' | 'failed'; error_code: string; phone: string }> = {}) {
  return {
    id,
    sent_at: '2026-05-29T14:02:00Z',
    phone: '+39123456789',
    provider: 'twilio',
    status: 'delivered' as const,
    error_code: '',
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('maskPhone', () => {
  it('masks E.164 numbers to first 3 chars + … + last 4', () => {
    expect(maskPhone('+39123456789')).toBe('+39…6789');
    expect(maskPhone('+44987654321')).toBe('+44…4321');
    expect(maskPhone('+38012345678')).toBe('+38…5678');
  });

  it('returns the original string if too short or no leading +', () => {
    expect(maskPhone('invalid')).toBe('invalid');
    expect(maskPhone('+123')).toBe('+123');
  });
});

describe('SmsDeliveryLogScreen', () => {
  it('renders rows from mocked data', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [makeEntry('a1'), makeEntry('a2')], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    expect(getByTestId('log-row-a1')).toBeTruthy();
    expect(getByTestId('log-row-a2')).toBeTruthy();
  });

  it('masks phone numbers in each row', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [makeEntry('p1', { phone: '+39123456789' })], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    expect(getByTestId('row-phone-p1').props.children).toBe('+39…6789');
  });

  it('shows empty state when there are no entries', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    expect(getByTestId('delivery-log-empty')).toBeTruthy();
  });

  it('does not show error_code when it is empty', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [makeEntry('e1', { error_code: '' })], next: null }] },
    });
    const { queryByTestId } = render(<SmsDeliveryLogScreen />);
    expect(queryByTestId('row-error-e1')).toBeNull();
  });

  it('shows error_code when it is non-empty', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [makeEntry('e2', { error_code: 'ERR_102', status: 'failed' })], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    expect(getByTestId('row-error-e2')).toBeTruthy();
  });

  it('pressing a provider filter passes it to the hook', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    fireEvent.press(getByTestId('filter-provider-infobip'));
    const lastCall = mockUse.mock.calls[mockUse.mock.calls.length - 1][0];
    expect(lastCall.provider).toBe('infobip');
  });

  it('pressing a status filter passes it to the hook', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    fireEvent.press(getByTestId('filter-status-failed'));
    const lastCall = mockUse.mock.calls[mockUse.mock.calls.length - 1][0];
    expect(lastCall.status).toBe('failed');
  });

  it('"all" provider filter sends undefined to the hook', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<SmsDeliveryLogScreen />);
    fireEvent.press(getByTestId('filter-provider-twilio'));
    fireEvent.press(getByTestId('filter-provider-all'));
    const lastCall = mockUse.mock.calls[mockUse.mock.calls.length - 1][0];
    expect(lastCall.provider).toBeUndefined();
  });
});
