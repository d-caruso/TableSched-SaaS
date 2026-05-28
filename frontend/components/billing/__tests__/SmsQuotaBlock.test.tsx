import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/billing', () => ({ useSubscription: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${JSON.stringify(opts)}` : k }),
}));
jest.mock('@core/components/ui/AppButton', () => ({
  AppButton: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
    require('react').createElement(require('react-native').Text, { testID }, children),
}));

import { useSubscription } from '@saas/lib/api/billing';
import { SmsQuotaBlock } from '../SmsQuotaBlock';

const mockUse = useSubscription as jest.Mock;

function makeData(quota: number | null, usedToday: number) {
  return {
    data: {
      limits: { max_bookings_per_month: null, sms_daily_quota: quota, max_locations: 3, max_staff_per_location: 3, max_tables: null, max_rooms: null },
      usage: { bookings_this_month: 0, sms_today: usedToday, locations: 1, staff: 1, tables: 0, rooms: 0 },
      tier: quota === null ? 'free' : 'premium',
    },
  };
}

describe('SmsQuotaBlock', () => {
  it('shows upsell card on free plan (quota null)', () => {
    mockUse.mockReturnValue(makeData(null, 0));
    const { getByText } = render(<SmsQuotaBlock />);
    expect(getByText('saas:sms.notIncluded')).toBeTruthy();
    expect(getByText(/saas:sms.upgradeCta/)).toBeTruthy();
  });

  it('shows progress on premium plan within quota', () => {
    mockUse.mockReturnValue(makeData(10, 3));
    const { getByText, queryByText } = render(<SmsQuotaBlock />);
    expect(getByText('3 / 10')).toBeTruthy();
    expect(getByText('saas:sms.poolResetNote')).toBeTruthy();
    expect(queryByText(/saas:sms.overageActive/)).toBeNull();
  });

  it('shows overage message when used exceeds quota', () => {
    mockUse.mockReturnValue(makeData(10, 13));
    const { getByText } = render(<SmsQuotaBlock />);
    expect(getByText(/saas:sms.overageActive/)).toBeTruthy();
  });

  it('shows enterprise quota correctly', () => {
    mockUse.mockReturnValue(makeData(30, 5));
    const { getByText } = render(<SmsQuotaBlock />);
    expect(getByText('5 / 30')).toBeTruthy();
  });
});
