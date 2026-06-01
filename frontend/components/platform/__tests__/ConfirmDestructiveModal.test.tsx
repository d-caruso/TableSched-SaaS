import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@core/constants/styles', () => ({ PRIMARY_ACTION_MIN_HEIGHT: 48 }));

import { ConfirmDestructiveModal } from '../ConfirmDestructiveModal';

const baseProps = {
  visible: true,
  title: 'Delete tenant',
  body: 'This is irreversible.',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ConfirmDestructiveModal', () => {
  it('renders title and body when visible', () => {
    const { getByTestId } = render(<ConfirmDestructiveModal {...baseProps} />);
    expect(getByTestId('confirm-modal-content')).toBeTruthy();
    expect(getByTestId('modal-confirm-btn')).toBeTruthy();
    expect(getByTestId('modal-cancel-btn')).toBeTruthy();
  });

  it('calls onCancel when cancel is pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(<ConfirmDestructiveModal {...baseProps} onCancel={onCancel} />);
    fireEvent.press(getByTestId('modal-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm is pressed and no slug is required', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(<ConfirmDestructiveModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.press(getByTestId('modal-confirm-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('confirm button has no onPress when slug does not match', () => {
    const { getByTestId } = render(
      <ConfirmDestructiveModal {...baseProps} requireTypedSlug="my-tenant" />,
    );
    expect(getByTestId('modal-confirm-btn').props.onPress).toBeUndefined();
  });

  it('confirm button fires onConfirm when correct slug is typed', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <ConfirmDestructiveModal
        {...baseProps}
        onConfirm={onConfirm}
        requireTypedSlug="my-tenant"
      />,
    );
    fireEvent.changeText(getByTestId('slug-confirm-input'), 'my-tenant');
    fireEvent.press(getByTestId('modal-confirm-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
