'use client';
import React from 'react';
import { FONTS } from '@/app/theme/fonts';
import { palette, paletteCssVars } from '@/app/theme/palette';
import { settingsApi } from '@/app/lib/api';
import type { Palette, Tweaks } from '@/app/types';

export const TWEAK_DEFAULTS: Tweaks = {
  accent: 'grass',
  accentHex: '#3f9d5c',
  headingFont: 'baloo',
  density: 'regular',
  railWide: false,
  dark: false,
  assignFlow: 'wizard',
  rubricStyle: 'matrix',
};

// Giao diện là cấu hình DÙNG CHUNG toàn hệ thống: lưu ở backend settings.appearance,
// GET /settings (public) trả về cho mọi người, chỉ admin PATCH được. Đây là các field
// khớp giữa Tweaks và settings.appearance (accentHex chỉ dùng cho accent 'custom' — không
// nằm trong panel nên không đồng bộ về server).
const APPEARANCE_KEYS = [
  'accent',
  'headingFont',
  'density',
  'railWide',
  'dark',
  'assignFlow',
  'rubricStyle',
] as const;

function pickAppearance(a: any): Partial<Tweaks> {
  if (!a || typeof a !== 'object') return {};
  const out: Partial<Tweaks> = {};
  for (const k of APPEARANCE_KEYS) if (a[k] != null) (out as any)[k] = a[k];
  return out;
}

type SetTweak = (key: string | Partial<Tweaks>, value?: unknown) => void;

interface ThemeContextValue {
  t: Tweaks;
  p: Palette;
  dark: boolean;
  setTweak: SetTweak;
  setDark: (v: boolean) => void;
  resetTheme: () => void;
  defaults: Tweaks;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useLmsTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useLmsTheme must be used within <ThemeProvider>');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = React.useState<Tweaks>(TWEAK_DEFAULTS);

  // Nạp giao diện dùng chung từ backend, áp cho MỌI người (kể cả khách chưa đăng nhập).
  React.useEffect(() => {
    settingsApi
      .get()
      .then((s) => {
        const a = pickAppearance(s?.appearance);
        if (Object.keys(a).length) setT((prev) => ({ ...prev, ...a }));
      })
      .catch(() => {});
  }, []);

  // Ghi giao diện về backend → áp cho toàn hệ thống. PATCH /settings gated admin, nên
  // với người dùng thường (không có panel Tweaks) lệnh này không xảy ra; nếu có cũng bị
  // backend từ chối và nuốt lỗi ở đây.
  const persist = React.useCallback((edits: Partial<Tweaks>) => {
    const appearance: Record<string, any> = {};
    for (const k of APPEARANCE_KEYS) if (k in edits) appearance[k] = (edits as any)[k];
    if (Object.keys(appearance).length) settingsApi.update({ appearance }).catch(() => {});
  }, []);

  const setTweak = React.useCallback<SetTweak>(
    (key, value) => {
      const edits = (typeof key === 'object' && key !== null ? key : { [key as string]: value }) as Partial<Tweaks>;
      setT((prev) => ({ ...prev, ...edits }));
      persist(edits);
    },
    [persist],
  );

  const resetTheme = React.useCallback(() => {
    setT({ ...TWEAK_DEFAULTS });
    persist(TWEAK_DEFAULTS);
  }, [persist]);

  const setDark = React.useCallback((v: boolean) => setTweak('dark', v), [setTweak]);

  const dark = !!t.dark;
  const p = palette(dark, t);

  React.useEffect(() => {
    const root = document.documentElement;
    const vars = {
      ...paletteCssVars(p, dark),
      '--lms-heading-font': FONTS.heading[t.headingFont] || FONTS.display,
    };
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  }, [dark, t.accent, t.accentHex, t.headingFont]);

  const value: ThemeContextValue = { t, p, dark, setTweak, setDark, resetTheme, defaults: TWEAK_DEFAULTS };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
