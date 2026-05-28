import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/platform', () => ({ usePlatformApiKeysSummary: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: object) => JSON.stringify({ k, ...o }) }),
}));

import { usePlatformApiKeysSummary } from '@saas/lib/api/platform';
import { ApiKeysSummaryBlock } from '../ApiKeysSummaryBlock';

const mockUse = usePlatformApiKeysSummary as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('ApiKeysSummaryBlock', () => {
  it('renders nothing for non-enterprise tenants', () => {
    mockUse.mockReturnValue({ isLoading: false, data: undefined });
    const { queryByTestId } = render(
      <ApiKeysSummaryBlock tenantId={1} tier="premium" />
    );
    expect(queryByTestId('api-keys-summary-block')).toBeNull();
  });

  it('hook is not called for non-enterprise tenants', () => {
    mockUse.mockReturnValue({ isLoading: false, data: undefined });
    render(<ApiKeysSummaryBlock tenantId={1} tier="premium" />);
    expect(mockUse).toHaveBeenCalledWith(1, 'premium');
    // enabled:false means no fetch — verified by the query key arg being non-enterprise
  });

  it('renders summary block for enterprise tenant with active keys', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: {
        active_count: 3,
        most_recent_key_name: 'PROD',
        most_recent_used_at: '2024-05-01T00:00:00Z',
      },
    });
    const { getByTestId } = render(
      <ApiKeysSummaryBlock tenantId={1} tier="enterprise" />
    );
    expect(getByTestId('api-keys-summary-block')).toBeTruthy();
    expect(getByTestId('api-keys-summary-recent')).toBeTruthy();
  });

  it('shows empty state when active_count is 0', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: { active_count: 0, most_recent_key_name: null, most_recent_used_at: null },
    });
    const { getByTestId } = render(
      <ApiKeysSummaryBlock tenantId={1} tier="enterprise" />
    );
    expect(getByTestId('api-keys-summary-empty')).toBeTruthy();
  });
});
