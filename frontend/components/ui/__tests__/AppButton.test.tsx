import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: jest.fn() }));
jest.mock('@core/constants/styles', () => ({ PRIMARY_ACTION_MIN_HEIGHT: 48 }));

import { useCanWrite } from '@saas/lib/lifecycle';
import { AppButton } from '../AppButton';

const mockUseCanWrite = useCanWrite as jest.Mock;

describe('AppButton (SaaS shadow)', () => {
  it('is enabled when canWrite is true', () => {
    mockUseCanWrite.mockReturnValue(true);
    const { UNSAFE_getByType } = render(
      <AppButton variant="primary">Save</AppButton>
    );
    const { Button } = require('tamagui');
    const btn = UNSAFE_getByType(Button);
    expect(btn.props.disabled).toBe(false);
    expect(btn.props.opacity).toBe(1);
  });

  it('is disabled when canWrite is false', () => {
    mockUseCanWrite.mockReturnValue(false);
    const { UNSAFE_getByType } = render(
      <AppButton variant="primary">Save</AppButton>
    );
    const { Button } = require('tamagui');
    const btn = UNSAFE_getByType(Button);
    expect(btn.props.disabled).toBe(true);
    expect(btn.props.opacity).toBe(0.4);
  });

  it('ghost variant is not write-gated', () => {
    mockUseCanWrite.mockReturnValue(false);
    const { UNSAFE_getByType } = render(
      <AppButton variant="ghost">Cancel</AppButton>
    );
    const { Button } = require('tamagui');
    const btn = UNSAFE_getByType(Button);
    expect(btn.props.disabled).toBe(false);
  });

  it('skipWriteGate bypasses the check', () => {
    mockUseCanWrite.mockReturnValue(false);
    const { UNSAFE_getByType } = render(
      <AppButton variant="primary" skipWriteGate>Always on</AppButton>
    );
    const { Button } = require('tamagui');
    const btn = UNSAFE_getByType(Button);
    expect(btn.props.disabled).toBe(false);
  });
});
