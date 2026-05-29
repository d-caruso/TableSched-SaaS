import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/sms', () => ({ useSmsRoutingTable: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useSmsRoutingTable } from '@saas/lib/api/sms';
import SmsRoutingScreen from '../routing';

const mockUse = useSmsRoutingTable as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('SmsRoutingScreen', () => {
  it('renders a row for each routing entry', () => {
    mockUse.mockReturnValue({
      data: [
        { prefix: '+39', providers: ['smsapi', 'infobip', 'twilio'] },
        { prefix: '+44', providers: ['infobip', 'twilio'] },
        { prefix: 'default', providers: ['twilio'] },
      ],
    });
    const { getByTestId } = render(<SmsRoutingScreen />);
    expect(getByTestId('routing-row-+39')).toBeTruthy();
    expect(getByTestId('routing-row-+44')).toBeTruthy();
    expect(getByTestId('routing-row-default')).toBeTruthy();
  });

  it('renders arrow-joined provider chain', () => {
    mockUse.mockReturnValue({
      data: [{ prefix: '+39', providers: ['smsapi', 'infobip', 'twilio'] }],
    });
    const { getByTestId } = render(<SmsRoutingScreen />);
    expect(getByTestId('routing-chain-+39').props.children).toBe('smsapi → infobip → twilio');
  });

  it('renders default row last even when it is first in the API response', () => {
    mockUse.mockReturnValue({
      data: [
        { prefix: 'default', providers: ['twilio'] },
        { prefix: '+39', providers: ['smsapi'] },
        { prefix: '+44', providers: ['infobip'] },
      ],
    });
    const { getAllByTestId } = render(<SmsRoutingScreen />);
    const rows = getAllByTestId(/^routing-row-/);
    expect(rows[rows.length - 1].props.testID).toBe('routing-row-default');
  });

  it('uses the routingDefault i18n key for the default prefix label', () => {
    mockUse.mockReturnValue({
      data: [{ prefix: 'default', providers: ['twilio'] }],
    });
    const { getByTestId } = render(<SmsRoutingScreen />);
    expect(getByTestId('routing-prefix-default').props.children).toBe(
      'saas:platform.sms.routingDefault'
    );
  });

  it('shows empty state when data is an empty array', () => {
    mockUse.mockReturnValue({ data: [] });
    const { getByTestId } = render(<SmsRoutingScreen />);
    expect(getByTestId('routing-empty')).toBeTruthy();
  });

  it('shows empty state when data is undefined', () => {
    mockUse.mockReturnValue({ data: undefined });
    const { getByTestId } = render(<SmsRoutingScreen />);
    expect(getByTestId('routing-empty')).toBeTruthy();
  });

  it('has no edit controls', () => {
    mockUse.mockReturnValue({
      data: [{ prefix: '+39', providers: ['twilio'] }],
    });
    const { queryByTestId } = render(<SmsRoutingScreen />);
    expect(queryByTestId('edit-button')).toBeNull();
    expect(queryByTestId('save-button')).toBeNull();
    expect(queryByTestId('delete-button')).toBeNull();
  });
});
