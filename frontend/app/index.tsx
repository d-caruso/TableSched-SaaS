import { Redirect } from 'expo-router';
import { Spinner, YStack } from 'tamagui';
import { useMe } from '@saas/lib/api/me';

export default function Index() {
  const { data, isLoading } = useMe();

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (data?.platformAdmin === true) {
    return <Redirect href="/platform/tenants" />;
  }

  return <Redirect href="/(staff)/dashboard" />;
}
