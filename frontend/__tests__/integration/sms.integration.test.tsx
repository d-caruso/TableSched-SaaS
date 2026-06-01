jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { screen, waitFor } from '@testing-library/react-native';
import { render } from '@/test-utils/renderIntegration';
import { Text, YStack } from 'tamagui';
import {
  useSmsProviderHealth,
  useSmsDeliveryLog,
  useSmsRoutingTable,
} from '@saas/lib/api/sms';
import { fixtureSmsHealth, fixtureDeliveryLog, fixtureRoutingTable } from '@/test-utils/msw/handlers';

function SmsHealthPanel() {
  const { data, status } = useSmsProviderHealth();
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  if (!data) return null;
  return (
    <YStack>
      {data.map((p) => (
        <Text key={p.provider} testID={`provider-${p.provider}`}>{p.provider}</Text>
      ))}
    </YStack>
  );
}

function DeliveryLogPanel() {
  const { data, status } = useSmsDeliveryLog({});
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  const entries = data?.pages.flatMap((p) => p.results) ?? [];
  return (
    <YStack>
      {entries.map((e) => (
        <Text key={e.id} testID={`entry-${e.id}`}>{e.provider}</Text>
      ))}
    </YStack>
  );
}

function RoutingTablePanel() {
  const { data, status } = useSmsRoutingTable();
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  if (!data) return null;
  return (
    <YStack>
      {data.map((r) => (
        <Text key={r.prefix} testID={`route-${r.prefix}`}>{r.prefix}</Text>
      ))}
    </YStack>
  );
}

test('GET /api/v1/platform/sms/health/ loads provider list from MSW', async () => {
  render(<SmsHealthPanel />);
  await waitFor(() =>
    expect(screen.queryByTestId(`provider-${fixtureSmsHealth[0].provider}`)).toBeTruthy(),
  );
  expect(screen.getByTestId(`provider-${fixtureSmsHealth[0].provider}`).props.children).toBe(
    fixtureSmsHealth[0].provider,
  );
  expect(screen.getByTestId(`provider-${fixtureSmsHealth[1].provider}`)).toBeTruthy();
});

test('GET /api/v1/platform/sms/delivery-log/ loads entries from MSW', async () => {
  render(<DeliveryLogPanel />);
  const firstEntry = fixtureDeliveryLog.results[0];
  await waitFor(() =>
    expect(screen.queryByTestId(`entry-${firstEntry.id}`)).toBeTruthy(),
  );
  expect(screen.getByTestId(`entry-${firstEntry.id}`).props.children).toBe(firstEntry.provider);
});

test('GET /api/v1/platform/sms/routing/ loads routing table from MSW', async () => {
  render(<RoutingTablePanel />);
  const firstRoute = fixtureRoutingTable[0];
  await waitFor(() =>
    expect(screen.queryByTestId(`route-${firstRoute.prefix}`)).toBeTruthy(),
  );
  expect(screen.getByTestId(`route-${firstRoute.prefix}`).props.children).toBe(firstRoute.prefix);
});
