import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@saas/lib/api/apiKeys', () => ({
  useApiKeys: jest.fn(),
  useCreateApiKey: jest.fn(),
  useRevokeApiKey: jest.fn(),
  useRenameApiKey: jest.fn(),
}));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('@saas/lib/toast', () => ({
  showToast: jest.fn(),
  TOAST_VARIANT: { INFO: 'info', SUCCESS: 'success', ERROR: 'error' },
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRenameApiKey,
} from '@saas/lib/api/apiKeys';
import { showToast } from '@saas/lib/toast';
import ApiKeysScreen from '../api-keys';

const mockKeys = useApiKeys as jest.Mock;
const mockCreate = useCreateApiKey as jest.Mock;
const mockRevoke = useRevokeApiKey as jest.Mock;
const mockRename = useRenameApiKey as jest.Mock;

const keyFixture = {
  id: 'k1', name: 'PROD', key_prefix: 'tse_abc',
  last_used_at: null, expires_at: null, is_active: true,
};

function setup(keys = [keyFixture]) {
  const mutateAsync = jest.fn();
  mockKeys.mockReturnValue({ data: keys });
  mockCreate.mockReturnValue({ mutateAsync });
  mockRevoke.mockReturnValue({ mutateAsync: jest.fn().mockResolvedValue(undefined) });
  mockRename.mockReturnValue({ mutate: jest.fn() });
  return { mutateAsync };
}

beforeEach(() => jest.clearAllMocks());

describe('ApiKeysScreen', () => {
  it('renders key rows', () => {
    setup();
    const { getByTestId } = render(<ApiKeysScreen />);
    expect(getByTestId('key-row-k1')).toBeTruthy();
    expect(getByTestId('key-prefix-k1')).toBeTruthy();
  });

  it('shows empty state when no keys', () => {
    setup([]);
    const { getByTestId } = render(<ApiKeysScreen />);
    expect(getByTestId('keys-empty')).toBeTruthy();
  });

  it('disables create button when at limit', () => {
    const fiveKeys = Array.from({ length: 5 }, (_, i) => ({
      ...keyFixture, id: `k${i}`,
    }));
    setup(fiveKeys);
    const { getByTestId } = render(<ApiKeysScreen />);
    fireEvent.press(getByTestId('create-key-btn'));
    expect(mockCreate().mutateAsync).not.toHaveBeenCalled();
  });

  it('shows create modal and submits name', async () => {
    const { mutateAsync } = setup();
    mutateAsync.mockResolvedValue({ ...keyFixture, raw_key: 'tse_FULL' });
    const { getByTestId } = render(<ApiKeysScreen />);
    fireEvent.press(getByTestId('create-key-btn'));
    fireEvent.changeText(getByTestId('key-name-input'), 'MyKey');
    fireEvent.press(getByTestId('create-submit-btn'));
    await waitFor(() => {
      expect(getByTestId('raw-key-modal')).toBeTruthy();
      expect(getByTestId('raw-key-value')).toBeTruthy();
    });
  });

  it('raw key modal dismissed and state cleared on Done', async () => {
    const { mutateAsync } = setup();
    mutateAsync.mockResolvedValue({ ...keyFixture, raw_key: 'tse_FULL' });
    const { getByTestId, queryByTestId } = render(<ApiKeysScreen />);
    fireEvent.press(getByTestId('create-key-btn'));
    fireEvent.changeText(getByTestId('key-name-input'), 'MyKey');
    fireEvent.press(getByTestId('create-submit-btn'));
    await waitFor(() => expect(getByTestId('raw-key-modal')).toBeTruthy());
    fireEvent.press(getByTestId('done-btn'));
    await waitFor(() => expect(queryByTestId('raw-key-modal')).toBeNull());
  });

  it('revoke confirmation modal calls revoke mutation', async () => {
    const revokeAsync = jest.fn().mockResolvedValue(undefined);
    mockKeys.mockReturnValue({ data: [keyFixture] });
    mockCreate.mockReturnValue({ mutateAsync: jest.fn() });
    mockRevoke.mockReturnValue({ mutateAsync: revokeAsync });
    mockRename.mockReturnValue({ mutate: jest.fn() });

    const { getByTestId } = render(<ApiKeysScreen />);
    fireEvent.press(getByTestId('revoke-btn-k1'));
    fireEvent.press(getByTestId('modal-confirm-btn'));
    await waitFor(() => {
      expect(revokeAsync).toHaveBeenCalledWith('k1');
    });
  });

  it('copy button fires showToast', async () => {
    const { mutateAsync } = setup();
    mutateAsync.mockResolvedValue({ ...keyFixture, raw_key: 'tse_FULL' });
    const { getByTestId } = render(<ApiKeysScreen />);
    fireEvent.press(getByTestId('create-key-btn'));
    fireEvent.changeText(getByTestId('key-name-input'), 'MyKey');
    fireEvent.press(getByTestId('create-submit-btn'));
    await waitFor(() => expect(getByTestId('raw-key-modal')).toBeTruthy());
    fireEvent.press(getByTestId('copy-btn'));
    expect(showToast).toHaveBeenCalledWith('saas:apiKeys.copyToast', 'success');
  });
});
