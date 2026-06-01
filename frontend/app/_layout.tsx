// SaaS root layout — <Slot /> lives here so Expo Router resolves this file
// as the layout filename. Providers are imported from core individually so
// we don't nest <CoreLayout> (which would override the filename context).
import React, { useEffect } from 'react';

if (typeof window === 'undefined') {
  // Suppress useLayoutEffect SSR warning from Tamagui / Reanimated on server.
  (React as any).useLayoutEffect = React.useEffect;
}

import { initSentry } from '@core/lib/observability/sentry';
import { AppErrorBoundary } from '@core/components/errors/AppErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

initSentry();

import { Slot } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import { I18nProvider } from '@core/lib/i18n/I18nProvider';
import { ConsentProvider } from '@core/lib/consent/ConsentContext';
import { AuthProvider } from '@core/lib/auth/AuthContext';
import { tamaguiConfig } from '@/tamagui.config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('t-loaded');
    }
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <I18nProvider>
            <AuthProvider>
              <ConsentProvider>
                <Slot />
              </ConsentProvider>
            </AuthProvider>
          </I18nProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
