import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native/pure';
import { type ReactElement, useState } from 'react';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '@/tamagui.config';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function IntegrationWrapper({ children }: { children: ReactElement }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        {children}
      </TamaguiProvider>
    </QueryClientProvider>
  );
}

function renderIntegration(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: IntegrationWrapper, ...options });
}

export * from '@testing-library/react-native/pure';
export { renderIntegration as render };
