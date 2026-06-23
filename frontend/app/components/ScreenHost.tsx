'use client';
// ScreenHost — the adapter between Next's file-based routing and the ported
// prototype screens (which expect p/t/ctx/setRoute/go/auth props). Each route's
// server page.tsx renders <ScreenHost Screen={SomeScreen} routeKey="..." ctx={{…}} />.
// ScreenHost pulls theme + auth from context and translates the screen's internal
// setRoute()/go() calls into router.push() via the central routes map.
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

  // Re-render this screen whenever the store changes (incl. after hydration).
  useLMS();
  // Pull live backend data for this route into DB on mount (best-effort).
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
