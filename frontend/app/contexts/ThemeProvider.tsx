'use client';
import React from 'react';
import { FONTS } from '@/app/theme/fonts';
import { palette, paletteCssVars } from '@/app/theme/palette';
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

const THEME_KEY = 'lms-theme-v1';
function loadTheme(): Partial<Tweaks> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(THEME_KEY) || 'null') || {};
  } catch {
    return {};
  }
}
function saveTheme(edits: Partial<Tweaks>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify({ ...loadTheme(), ...edits }));
  } catch {}
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

  React.useEffect(() => {
    const saved = loadTheme();
    if (Object.keys(saved).length) setT((prev) => ({ ...prev, ...saved }));
  }, []);

  const setTweak = React.useCallback<SetTweak>((key, value) => {
    const edits = (typeof key === 'object' && key !== null ? key : { [key as string]: value }) as Partial<Tweaks>;
    setT((prev) => ({ ...prev, ...edits }));
    saveTheme(edits);
  }, []);

  const resetTheme = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(THEME_KEY);
      } catch {}
    }
    setT({ ...TWEAK_DEFAULTS });
  }, []);

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
