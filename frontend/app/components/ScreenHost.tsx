'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';
import { routeToHref } from '@/app/configs/routes.config';
import { useLMS } from '@/app/store/store';
import { hydrateFor, isFirstHydrating } from '@/app/lib/sync/hydrate';

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

  // First visit of a data-backed route: the DB is still empty, so show a
  // loading state instead of a blank screen while the API loaders run.
  if (isFirstHydrating(routeKey)) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3.5">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-lms-line border-t-lms-accent" />
          <span className="text-[13px] text-lms-sub">Đang tải dữ liệu…</span>
        </div>
      </div>
    );
  }

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
