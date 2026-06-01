import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@saas/lib/api/platform', () => ({
  useCreateImpersonationToken: jest.fn(),
}));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { ERROR: 'error' },
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@core/constants/styles', () => ({ PRIMARY_ACTION_MIN_HEIGHT: 48 }));

import { useCreateImpersonationToken } from '@saas/lib/api/platform';
import { showToast } from '@saas/lib/toast';
import { ImpersonateButton } from '../ImpersonateButton';

const mockUseCreate = useCreateImpersonationToken as jest.Mock;
const mockShowToast = showToast as jest.Mock;

const defaultProps = { tenantId: 1, tenantName: 'Test Tenant', restaurantId: 'rest-001' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ImpersonateButton', () => {
  it('renders the impersonate button', () => {
    mockUseCreate.mockReturnValue({ mutateAsync: jest.fn() });
    const { getByTestId } = render(<ImpersonateButton {...defaultProps} />);
    expect(getByTestId('impersonate-btn')).toBeTruthy();
  });

  it('pressing the button shows the confirmation modal', () => {
    mockUseCreate.mockReturnValue({ mutateAsync: jest.fn() });
    const { getByTestId } = render(<ImpersonateButton {...defaultProps} />);
    fireEvent.press(getByTestId('impersonate-btn'));
    expect(getByTestId('confirm-modal-content')).toBeTruthy();
  });

  it('pressing cancel closes the modal', () => {
    mockUseCreate.mockReturnValue({ mutateAsync: jest.fn() });
    const { getByTestId, queryByTestId } = render(<ImpersonateButton {...defaultProps} />);
    fireEvent.press(getByTestId('impersonate-btn'));
    fireEvent.press(getByTestId('modal-cancel-btn'));
    expect(queryByTestId('confirm-modal-content')).toBeNull();
  });

  it('confirming calls mutateAsync and Linking.openURL', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ token: 'tok-123' });
    mockUseCreate.mockReturnValue({ mutateAsync });
    const { getByTestId } = render(<ImpersonateButton {...defaultProps} />);
    fireEvent.press(getByTestId('impersonate-btn'));
    fireEvent.press(getByTestId('modal-confirm-btn'));
    await waitFor(() => expect(Linking.openURL).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('tok-123'),
    );
  });

  it('shows error toast when mutateAsync rejects', async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error('fail'));
    mockUseCreate.mockReturnValue({ mutateAsync });
    const { getByTestId } = render(<ImpersonateButton {...defaultProps} />);
    fireEvent.press(getByTestId('impersonate-btn'));
    fireEvent.press(getByTestId('modal-confirm-btn'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledTimes(1));
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
