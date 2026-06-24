'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';
import { routeToHref } from '@/app/configs/routes.config';
import { useLMS } from '@/app/store/store';
import { hydrateFor } from '@/app/lib/sync/hydrate';

export default function ScreenHost({
  Screen,
  routeKey,
  ctx,
}: {
  Screen: React.ComponentType<any>;
  routeKey?: string;
  ctx?: Record<string, string>;
}) {
  const router = useRouter();
  const { t, p, setTweak, resetTheme, defaults } = useLmsTheme();
  const auth = useLmsAuth();

  useLMS();
  React.useEffect(() => {
    hydrateFor(routeKey);
  }, [routeKey, auth.loggedIn]);

  const setRoute = React.useCallback((key: string) => router.push(routeToHref(key)), [router]);
  const go = React.useCallback(
    (key: string, patch?: Record<string, string>) => router.push(routeToHref(key, patch)),
    [router],
  );

  return (
    <Screen
      p={p}
      t={t}
      ctx={ctx || {}}
      route={routeKey}
      setRoute={setRoute}
      go={go}
      auth={auth}
      setTweak={setTweak}
      resetTheme={resetTheme}
      themeDefaults={defaults}
    />
  );
}
