import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ usePlatformActionLog: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { usePlatformActionLog } from '@saas/lib/api/platform';
import ActionLogScreen from '../index';

const mockUse = usePlatformActionLog as jest.Mock;
const baseQuery = { fetchNextPage: jest.fn(), hasNextPage: false, isFetchingNextPage: false };

function makeEntry(id: number, action = 'suspend_tenant') {
  return {
    id,
    actor_email: 'admin@platform.com',
    action,
    target_tenant_slug: 'my-tenant',
    detail: { note: 'test' },
    created_at: '2024-01-01T00:00:00Z',
  };
}

beforeEach(() => jest.clearAllMocks());

describe('ActionLogScreen', () => {
  it('renders action log rows', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [makeEntry(1), makeEntry(2, 'override_limit')], next: null }] },
    });
    const { getByTestId } = render(<ActionLogScreen />);
    expect(getByTestId('action-log-row-1')).toBeTruthy();
    expect(getByTestId('action-log-row-2')).toBeTruthy();
  });

  it('shows empty state when no entries', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<ActionLogScreen />);
    expect(getByTestId('action-log-empty')).toBeTruthy();
  });

  it('filter inputs narrow query params', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [], next: null }] },
    });
    const { getByTestId } = render(<ActionLogScreen />);
    fireEvent.changeText(getByTestId('filter-action'), 'impersonate');
    const lastCall = mockUse.mock.calls[mockUse.mock.calls.length - 1][0];
    expect(lastCall.action).toBe('impersonate');
  });

  it('detail JSON is hidden by default and shown after toggle', () => {
    mockUse.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ results: [makeEntry(1)], next: null }] },
    });
    const { queryByTestId, getByTestId } = render(<ActionLogScreen />);
    expect(queryByTestId('detail-json')).toBeNull();
    fireEvent.press(getByTestId('detail-toggle'));
    expect(getByTestId('detail-json')).toBeTruthy();
  });
});
