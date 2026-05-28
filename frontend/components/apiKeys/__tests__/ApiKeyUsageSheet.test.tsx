import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@saas/lib/api/apiKeys', () => ({ useApiKeyUsage: jest.fn() }));
jest.mock('@saas/lib/lifecycle', () => ({ useCanWrite: () => true }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useApiKeyUsage } from '@saas/lib/api/apiKeys';
import { ApiKeyUsageSheet } from '../ApiKeyUsageSheet';

const mockUse = useApiKeyUsage as jest.Mock;
const onClose = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('ApiKeyUsageSheet', () => {
  it('renders months descending, current month first', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: [
        { year: 2024, month: 1, call_count: 604 },
        { year: 2024, month: 3, call_count: 1118 },
        { year: 2024, month: 2, call_count: 942 },
      ],
    });
    const { getByTestId, getAllByTestId } = render(
      <ApiKeyUsageSheet keyId="k1" keyName="PROD" onClose={onClose} />
    );
    const rows = getAllByTestId(/^usage-row-/);
    expect(rows[0].props.testID).toBe('usage-row-2024-3');
    expect(rows[1].props.testID).toBe('usage-row-2024-2');
    expect(rows[2].props.testID).toBe('usage-row-2024-1');
    expect(getByTestId('limits-block')).toBeTruthy();
  });

  it('shows empty state when no usage data', () => {
    mockUse.mockReturnValue({ isLoading: false, data: [] });
    const { getByTestId } = render(
      <ApiKeyUsageSheet keyId="k1" keyName="PROD" onClose={onClose} />
    );
    expect(getByTestId('usage-empty')).toBeTruthy();
  });

  it('labels first row as this month', () => {
    mockUse.mockReturnValue({
      isLoading: false,
      data: [{ year: 2024, month: 5, call_count: 200 }],
    });
    const { getByText } = render(
      <ApiKeyUsageSheet keyId="k1" keyName="PROD" onClose={onClose} />
    );
    expect(getByText('saas:apiKeys.usageThisMonth')).toBeTruthy();
  });
});
