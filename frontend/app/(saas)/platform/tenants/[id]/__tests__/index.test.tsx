import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({
  usePlatformTenant: jest.fn(),
  useSuspendTenant: jest.fn(),
  useReactivateTenant: jest.fn(),
  useCancelTenant: jest.fn(),
  useDeleteTenantSchema: jest.fn(),
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { INFO: 'info', SUCCESS: 'success', ERROR: 'error' },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import {
  usePlatformTenant,
  useSuspendTenant,
  useReactivateTenant,
  useCancelTenant,
  useDeleteTenantSchema,
} from '@saas/lib/api/platform';
import TenantDetailScreen from '../index';

const mockTenant = usePlatformTenant as jest.Mock;
const mockSuspend = useSuspendTenant as jest.Mock;
const mockReactivate = useReactivateTenant as jest.Mock;
const mockCancel = useCancelTenant as jest.Mock;
const mockDelete = useDeleteTenantSchema as jest.Mock;

const noopMutation = { mutateAsync: jest.fn().mockResolvedValue(undefined) };

function makeTenantData(status: string) {
  return {
    isLoading: false,
    data: {
      id: 1,
      slug: 'my-tenant',
      display_name: 'My Tenant',
      owner_email: 'owner@example.com',
      created_at: '2024-01-01T00:00:00Z',
      subscription: {
        plan: { slug: 'premium' },
        status,
        current_period_end: null,
        trial_ends_at: null,
        location_limit_override: null,
        usage: { locations: 2, staff: 5, tables: 10, rooms: 2, bookings_this_month: 50, sms_today: 3 },
        effective_max_locations: 5,
      },
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSuspend.mockReturnValue(noopMutation);
  mockReactivate.mockReturnValue(noopMutation);
  mockCancel.mockReturnValue(noopMutation);
  mockDelete.mockReturnValue(noopMutation);
});

describe('TenantDetailScreen', () => {
  it('shows Suspend button only when active', () => {
    mockTenant.mockReturnValue(makeTenantData('active'));
    const { getByTestId, queryByTestId } = render(<TenantDetailScreen />);
    expect(getByTestId('suspend-btn')).toBeTruthy();
    expect(queryByTestId('reactivate-btn')).toBeNull();
    expect(queryByTestId('delete-btn')).toBeNull();
  });

  it('shows Reactivate button only when suspended', () => {
    mockTenant.mockReturnValue(makeTenantData('suspended'));
    const { getByTestId, queryByTestId } = render(<TenantDetailScreen />);
    expect(getByTestId('reactivate-btn')).toBeTruthy();
    expect(queryByTestId('suspend-btn')).toBeNull();
    expect(queryByTestId('delete-btn')).toBeNull();
  });

  it('shows Delete button only when cancelled', () => {
    mockTenant.mockReturnValue(makeTenantData('cancelled'));
    const { getByTestId, queryByTestId } = render(<TenantDetailScreen />);
    expect(getByTestId('delete-btn')).toBeTruthy();
    expect(queryByTestId('suspend-btn')).toBeNull();
    expect(queryByTestId('reactivate-btn')).toBeNull();
    expect(queryByTestId('cancel-btn')).toBeNull();
  });

  it('Delete modal confirm does not call mutation until slug matches', async () => {
    mockTenant.mockReturnValue(makeTenantData('cancelled'));
    const { getByTestId } = render(<TenantDetailScreen />);
    fireEvent.press(getByTestId('delete-btn'));
    // press confirm before typing — onPress is undefined so mutateAsync not called
    fireEvent.press(getByTestId('modal-confirm-btn'));
    expect(noopMutation.mutateAsync).not.toHaveBeenCalled();
    // type the correct slug then confirm
    fireEvent.changeText(getByTestId('slug-confirm-input'), 'my-tenant');
    fireEvent.press(getByTestId('modal-confirm-btn'));
    await waitFor(() => {
      expect(noopMutation.mutateAsync).toHaveBeenCalled();
    });
  });

  it('Suspend modal calls suspend mutation on confirm', async () => {
    mockTenant.mockReturnValue(makeTenantData('active'));
    const { getByTestId } = render(<TenantDetailScreen />);
    fireEvent.press(getByTestId('suspend-btn'));
    fireEvent.press(getByTestId('modal-confirm-btn'));
    await waitFor(() => {
      expect(noopMutation.mutateAsync).toHaveBeenCalled();
    });
  });
});
