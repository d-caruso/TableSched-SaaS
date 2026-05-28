import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/billing', () => ({ useSubscription: jest.fn() }));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { INFO: 'info', SUCCESS: 'success', ERROR: 'error' },
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useSubscription } from '@saas/lib/api/billing';
import { showToast } from '@saas/lib/toast';
import { ReactivationToast } from '../ReactivationToast';

const mockUse = useSubscription as jest.Mock;
const mockShowToast = showToast as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('ReactivationToast', () => {
  it('fires toast on suspended → active transition', () => {
    mockUse.mockReturnValue({ data: { status: 'suspended' } });
    const { rerender } = render(<ReactivationToast />);
    expect(mockShowToast).not.toHaveBeenCalled();

    mockUse.mockReturnValue({ data: { status: 'active' } });
    rerender(<ReactivationToast />);

    expect(mockShowToast).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(
      'saas:lifecycle.reactivatedToast',
      'success',
    );
  });

  it('does not fire toast when staying on active', () => {
    mockUse.mockReturnValue({ data: { status: 'active' } });
    const { rerender } = render(<ReactivationToast />);
    rerender(<ReactivationToast />);
    rerender(<ReactivationToast />);
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('does not fire toast on past_due → active transition', () => {
    mockUse.mockReturnValue({ data: { status: 'past_due' } });
    const { rerender } = render(<ReactivationToast />);
    mockUse.mockReturnValue({ data: { status: 'active' } });
    rerender(<ReactivationToast />);
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('renders null', () => {
    mockUse.mockReturnValue({ data: { status: 'active' } });
    const { toJSON } = render(<ReactivationToast />);
    expect(toJSON()).toBeNull();
  });
});
