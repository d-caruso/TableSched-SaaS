jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { screen, waitFor } from '@testing-library/react-native';
import { render } from '@/test-utils/renderIntegration';
import { Text, YStack } from 'tamagui';
import { useApiKeys, useApiKeyUsage } from '@saas/lib/api/apiKeys';
import { fixtureApiKeys } from '@/test-utils/msw/handlers';

function ApiKeysPanel() {
  const { data, status } = useApiKeys();
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  if (!data) return null;
  return (
    <YStack>
      {data.map((k) => (
        <Text key={k.id} testID={`key-${k.id}`}>{k.name}</Text>
      ))}
    </YStack>
  );
}

function ApiKeyUsagePanel({ keyId }: { keyId: string }) {
  const { data, status } = useApiKeyUsage(keyId);
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  return <Text testID="usage-count">{data?.length ?? 0}</Text>;
}

test('GET /api/v1/platform/api-keys/ loads key list from MSW', async () => {
  render(<ApiKeysPanel />);
  const firstKey = fixtureApiKeys[0];
  await waitFor(() => expect(screen.queryByTestId(`key-${firstKey.id}`)).toBeTruthy());
  expect(screen.getByTestId(`key-${firstKey.id}`).props.children).toBe(firstKey.name);
});

test('GET /api/v1/platform/api-keys/:id/usage/ loads usage data from MSW', async () => {
  render(<ApiKeyUsagePanel keyId={fixtureApiKeys[0].id} />);
  await waitFor(() => expect(screen.queryByTestId('usage-count')).toBeTruthy());
  expect(screen.getByTestId('usage-count').props.children).toBe(0);
});
