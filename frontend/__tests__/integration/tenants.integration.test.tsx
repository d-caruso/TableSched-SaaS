jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '@/test-utils/renderIntegration';
import { Text, YStack } from 'tamagui';
import {
  usePlatformTenants,
  usePlatformTenant,
  useOverrideSubscription,
} from '@saas/lib/api/platform';
import { fixtureTenant } from '@/test-utils/msw/handlers';

function TenantListPanel() {
  const { data, status } = usePlatformTenants({});
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  const tenants = data?.pages.flatMap((p) => p.results) ?? [];
  return (
    <YStack>
      {tenants.map((t) => (
        <Text key={t.id} testID={`tenant-${t.id}`}>{t.display_name}</Text>
      ))}
    </YStack>
  );
}

function TenantDetailPanel() {
  const { data, status } = usePlatformTenant(fixtureTenant.id);
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  if (!data) return null;
  return (
    <YStack>
      <Text testID="tenant-name">{data.display_name}</Text>
      <Text testID="tenant-plan">{data.subscription.plan.slug}</Text>
    </YStack>
  );
}

function SubscriptionOverridePanel() {
  const { data, status } = usePlatformTenant(fixtureTenant.id);
  const override = useOverrideSubscription(fixtureTenant.id);
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  if (!data) return null;
  return (
    <YStack>
      <Text testID="current-plan">{data.subscription.plan.slug}</Text>
      <YStack
        testID="override-btn"
        onPress={() => override.mutate({ plan: 'enterprise' })}
        accessibilityRole="button"
      >
        <Text>Override</Text>
      </YStack>
      {override.data && (
        <Text testID="override-result">override-ok</Text>
      )}
    </YStack>
  );
}

test('GET /api/v1/platform/tenants/ loads tenant list from MSW', async () => {
  render(<TenantListPanel />);
  await waitFor(() =>
    expect(screen.queryByTestId(`tenant-${fixtureTenant.id}`)).toBeTruthy(),
  );
  expect(screen.getByTestId(`tenant-${fixtureTenant.id}`).props.children).toBe(
    fixtureTenant.display_name,
  );
});

test('GET /api/v1/platform/tenants/:id/ loads tenant detail from MSW', async () => {
  render(<TenantDetailPanel />);
  await waitFor(() => expect(screen.queryByTestId('tenant-name')).toBeTruthy());
  expect(screen.getByTestId('tenant-name').props.children).toBe(fixtureTenant.display_name);
  expect(screen.getByTestId('tenant-plan').props.children).toBe(fixtureTenant.subscription.plan.slug);
});

test('PATCH /api/v1/platform/tenants/:id/subscription/ reflects updated plan', async () => {
  render(<SubscriptionOverridePanel />);
  await waitFor(() => expect(screen.queryByTestId('current-plan')).toBeTruthy());
  fireEvent.press(screen.getByTestId('override-btn'));
  await waitFor(() => expect(screen.queryByTestId('override-result')).toBeTruthy());
});
