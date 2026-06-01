jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '@/test-utils/renderIntegration';
import { Text, YStack } from 'tamagui';
import { useSubscription, useStartCheckout } from '@saas/lib/api/billing';
import { fixtureSubscription } from '@/test-utils/msw/handlers';

function SubscriptionPanel() {
  const { data, status } = useSubscription();
  if (status === 'pending') return <Text testID="loading">Loading</Text>;
  if (!data) return null;
  return (
    <YStack>
      <Text testID="tier">{data.tier}</Text>
      <Text testID="status">{data.status}</Text>
    </YStack>
  );
}

function CheckoutPanel() {
  const checkout = useStartCheckout();
  return (
    <YStack>
      <YStack
        testID="checkout-btn"
        onPress={() => checkout.mutate({ plan: 'enterprise' })}
        accessibilityRole="button"
      >
        <Text>Upgrade</Text>
      </YStack>
      {checkout.data && (
        <Text testID="checkout-url">{checkout.data.url}</Text>
      )}
    </YStack>
  );
}

test('GET /api/v1/billing/subscription/ loads subscription tier from MSW', async () => {
  render(<SubscriptionPanel />);
  await waitFor(() => expect(screen.queryByTestId('tier')).toBeTruthy());
  expect(screen.getByTestId('tier').props.children).toBe(fixtureSubscription.tier);
  expect(screen.getByTestId('status').props.children).toBe(fixtureSubscription.status);
});

test('POST /api/v1/billing/checkout-session/ returns checkout URL from MSW', async () => {
  render(<CheckoutPanel />);
  fireEvent.press(screen.getByTestId('checkout-btn'));
  await waitFor(() => expect(screen.queryByTestId('checkout-url')).toBeTruthy());
  expect(screen.getByTestId('checkout-url').props.children).toBe('https://checkout.example.com');
});
