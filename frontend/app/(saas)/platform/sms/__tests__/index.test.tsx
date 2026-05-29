import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/sms', () => ({ useSmsProviderHealth: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useSmsProviderHealth } from '@saas/lib/api/sms';
import SmsHealthScreen, { healthColor } from '../index';

const mockUse = useSmsProviderHealth as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('healthColor', () => {
  it('returns $green9 for rate >= 0.90', () => {
    expect(healthColor(0.9)).toBe('$green9');
    expect(healthColor(1.0)).toBe('$green9');
  });

  it('returns $orange9 for rate 0.70–0.89', () => {
    expect(healthColor(0.7)).toBe('$orange9');
    expect(healthColor(0.89)).toBe('$orange9');
  });

  it('returns $red9 for rate < 0.70', () => {
    expect(healthColor(0.69)).toBe('$red9');
    expect(healthColor(0.0)).toBe('$red9');
  });
});

describe('SmsHealthScreen', () => {
  it('renders a card for each provider', () => {
    mockUse.mockReturnValue({
      data: [
        { provider: 'twilio', delivery_rate: 0.92, total_sent: 234, status: 'healthy' as const },
        { provider: 'infobip', delivery_rate: 0.96, total_sent: 891, status: 'healthy' as const },
        { provider: 'smsapi', delivery_rate: 0.41, total_sent: 57, status: 'degraded' as const },
      ],
    });
    const { getByTestId } = render(<SmsHealthScreen />);
    expect(getByTestId('provider-card-twilio')).toBeTruthy();
    expect(getByTestId('provider-card-infobip')).toBeTruthy();
    expect(getByTestId('provider-card-smsapi')).toBeTruthy();
  });

  it('shows healthy badge for a healthy provider', () => {
    mockUse.mockReturnValue({
      data: [{ provider: 'twilio', delivery_rate: 0.92, total_sent: 234, status: 'healthy' as const }],
    });
    const { getByTestId, getByText } = render(<SmsHealthScreen />);
    expect(getByTestId('badge-twilio')).toBeTruthy();
    expect(getByText('saas:platform.sms.providerHealthy')).toBeTruthy();
  });

  it('shows degraded badge for a degraded provider', () => {
    mockUse.mockReturnValue({
      data: [{ provider: 'smsapi', delivery_rate: 0.41, total_sent: 57, status: 'degraded' as const }],
    });
    const { getByTestId, getByText } = render(<SmsHealthScreen />);
    expect(getByTestId('badge-smsapi')).toBeTruthy();
    expect(getByText('saas:platform.sms.providerDegraded')).toBeTruthy();
  });

  it('shows empty state when data is an empty array', () => {
    mockUse.mockReturnValue({ data: [] });
    const { getByTestId } = render(<SmsHealthScreen />);
    expect(getByTestId('health-empty')).toBeTruthy();
  });

  it('shows empty state when data is undefined', () => {
    mockUse.mockReturnValue({ data: undefined });
    const { getByTestId } = render(<SmsHealthScreen />);
    expect(getByTestId('health-empty')).toBeTruthy();
  });
});
