// palette.ts — color tokens for the LMS. Light-first enterprise palette with a
// warm paper background, an admin-selectable accent, and a dark variant.
// Ported from the prototype's theme.jsx (exports: palette, hexA, lighten).

import type { Palette, Tweaks } from '@/app/types';

const ACCENTS: Record<string, { light: string; dark: string }> = {
  grass: { light: '#3f9d5c', dark: '#5bbd78' },
  sky: { light: '#2f7fe0', dark: '#5b9bf0' },
  coral: { light: '#ec6238', dark: '#f4895f' },
  amber: { light: '#d98a12', dark: '#ecab3c' },
  grape: { light: '#8a52d6', dark: '#a87ce6' },
};

/** Lighten a hex toward white by `amt` (0..1) — derives a dark-mode-friendly
 *  variant for an admin-chosen custom accent. */
export function lighten(hex: string, amt: number): string {
  const h = String(hex).replace('#', '');
  if (h.length < 6) return hex;
  let r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  r = Math.round(r + (255 - r) * amt);
  g = Math.round(g + (255 - g) * amt);
  b = Math.round(b + (255 - b) * amt);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Hex → rgba() with the given alpha. */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function palette(dark: boolean, t: Partial<Tweaks> = {}): Palette {
  let accLight: string, accDark: string;
  if (t.accent === 'custom' && t.accentHex) {
    accLight = t.accentHex;
    accDark = lighten(t.accentHex, 0.28);
  } else {
    const acc = ACCENTS[(t.accent as string) || 'grass'] || ACCENTS.grass;
    accLight = acc.light;
    accDark = acc.dark;
  }
  const accent = dark ? accDark : accLight;
  const accentSoft = hexA(accent, dark ? 0.2 : 0.1);
  return dark
    ? {
        dark: true,
        bg: '#1a1813',
        surface: '#221f19',
        raise: '#2b2720',
        sink: '#1d1b15',
        ink: 'rgba(255,252,247,0.92)',
        sub: 'rgba(255,252,247,0.66)',
        faint: 'rgba(255,252,247,0.45)',
        line: '#38332b',
        lineSoft: '#28241e',
        accent,
        accentSoft,
        railBg: '#1c1915',
        activeBg: hexA(accent, 0.22),
        ok: '#52b56a',
        warn: '#e0a92e',
        danger: '#e26257',
        info: accent,
        glow: 'rgba(0,0,0,0.28)',
        shadow: '0 4px 12px rgba(0,0,0,.45), 0 12px 32px rgba(0,0,0,.35)',
      }
    : {
        dark: false,
        bg: '#f7f4ef',
        surface: '#fffdfa',
        raise: '#faf6f0',
        sink: '#efe9df',
        ink: 'rgba(31,24,16,0.90)',
        sub: 'rgba(31,24,16,0.60)',
        faint: 'rgba(31,24,16,0.42)',
        line: '#ece5d9',
        lineSoft: '#f3ede3',
        accent,
        accentSoft,
        railBg: '#fffdfa',
        activeBg: hexA(accent, 0.12),
        ok: '#3f9d5c',
        warn: '#d99413',
        danger: '#e0563f',
        info: accent,
        glow: 'rgba(120,82,44,0.10)',
        shadow: '0 2px 10px rgba(80,55,30,.05), 0 10px 30px rgba(80,55,30,.06)',
      };
}

export { ACCENTS };
