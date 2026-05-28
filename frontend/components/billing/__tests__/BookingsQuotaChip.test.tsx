import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/billing', () => ({ useSubscription: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${JSON.stringify(opts)}` : k }),
}));

import { useSubscription } from '@saas/lib/api/billing';
import { BookingsQuotaChip } from '../BookingsQuotaChip';

const mockUse = useSubscription as jest.Mock;

function makeData(used: number, cap: number | null) {
  return {
    data: {
      limits: { max_bookings_per_month: cap, sms_daily_quota: 10, max_locations: 3, max_staff_per_location: 3, max_tables: null, max_rooms: null },
      usage: { bookings_this_month: used, sms_today: 0, locations: 1, staff: 1, tables: 0, rooms: 0 },
    },
  };
}

describe('BookingsQuotaChip', () => {
  it('renders neutral chip below 80%', () => {
    mockUse.mockReturnValue(makeData(30, 50));
    const { getByTestId, toJSON } = render(<BookingsQuotaChip />);
    expect(getByTestId('bookings-quota-chip')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders warning chip at 80-99%', () => {
    mockUse.mockReturnValue(makeData(40, 50));
    const { toJSON } = render(<BookingsQuotaChip />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders error chip at 100%', () => {
    mockUse.mockReturnValue(makeData(50, 50));
    const { toJSON } = render(<BookingsQuotaChip />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders nothing when cap is null (unlimited)', () => {
    mockUse.mockReturnValue(makeData(999, null));
    const { toJSON } = render(<BookingsQuotaChip />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when no data', () => {
    mockUse.mockReturnValue({ data: undefined });
    const { toJSON } = render(<BookingsQuotaChip />);
    expect(toJSON()).toBeNull();
  });
});
