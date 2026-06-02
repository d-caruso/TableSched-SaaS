import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@saas/lib/limits', () => ({ useLimitState: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${JSON.stringify(opts)}` : k }),
}));
jest.mock('@core/constants/styles', () => ({ PRESS_STYLE: {}, FOCUS_STYLE: {} }));

import { useLimitState } from '@saas/lib/limits';
import { RoomTabs } from '../RoomTabs';

const mockUseLimitState = useLimitState as jest.Mock;

const rooms = [{ id: '1', name: 'Main', capacity: 20 }];

describe('RoomTabs (SaaS shadow)', () => {
  it('calls onAddRoom when not at limit', () => {
    mockUseLimitState.mockReturnValue({ atLimit: false, used: 1, cap: 2 });
    const onAddRoom = jest.fn();
    const { getByText } = render(
      <RoomTabs rooms={rooms} activeId="1" onSelect={jest.fn()} onAddRoom={onAddRoom} />
    );
    fireEvent.press(getByText('staff.floor.addRoom'));
    expect(onAddRoom).toHaveBeenCalled();
  });

  it('shows limit message and does not call onAddRoom when at limit', () => {
    mockUseLimitState.mockReturnValue({ atLimit: true, used: 2, cap: 2 });
    const onAddRoom = jest.fn();
    const { getByText } = render(
      <RoomTabs rooms={rooms} activeId="1" onSelect={jest.fn()} onAddRoom={onAddRoom} />
    );
    expect(getByText(/saas:limits.roomsReached/)).toBeTruthy();
  });
});
