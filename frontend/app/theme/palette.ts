import type { Palette, Tweaks } from '@/app/types';

const ACCENTS: Record<string, { light: string; dark: string }> = {
  grass: { light: '#3f9d5c', dark: '#5bbd78' },
  sky: { light: '#2f7fe0', dark: '#5b9bf0' },
  coral: { light: '#ec6238', dark: '#f4895f' },
  amber: { light: '#d98a12', dark: '#ecab3c' },
  grape: { light: '#8a52d6', dark: '#a87ce6' },
};

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
  const contrast = dark
    ? { bg: '#2e2a22', text: 'rgba(255,252,247,0.92)', border: '#454038' }
    : { bg: '#1a1610', text: '#fffdfa', border: '#1a1610' };
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
        contrastBg: contrast.bg,
        contrastText: contrast.text,
        contrastBorder: contrast.border,
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
        contrastBg: contrast.bg,
        contrastText: contrast.text,
        contrastBorder: contrast.border,
      };
}

export function paletteCssVars(p: Palette, dark: boolean): Record<string, string> {
  const accentFade = hexA(p.accent, dark ? 0.35 : 0.18);
  const accentMid = hexA(p.accent, 0.55);
  return {
    '--lms-bg': p.bg,
    '--lms-surface': p.surface,
    '--lms-surface-glass': hexA(p.surface, 0.82),
    '--lms-raise': p.raise,
    '--lms-sink': p.sink,
    '--lms-ink': p.ink,
    '--lms-sub': p.sub,
    '--lms-faint': p.faint,
    '--lms-line': p.line,
    '--lms-line-soft': p.lineSoft,
    '--lms-accent': p.accent,
    '--lms-accent-soft': p.accentSoft,
    '--lms-active-bg': p.activeBg,
    '--lms-rail-bg': p.railBg,
    '--lms-ok': p.ok,
    '--lms-warn': p.warn,
    '--lms-danger': p.danger,
    '--lms-info': p.info,
    '--lms-glow': p.glow,
    '--lms-shadow': p.shadow,
    '--lms-contrast-bg': p.contrastBg,
    '--lms-contrast-text': p.contrastText,
    '--lms-contrast-border': p.contrastBorder,
    '--lms-danger-border': hexA(p.danger, 0.35),
    '--lms-hero-gradient': `radial-gradient(120% 120% at 100% 0%, ${accentFade} 0%, ${p.surface} 55%)`,
    '--lms-card-gradient': `linear-gradient(160deg, ${p.accentSoft}, ${p.surface} 80%)`,
    '--lms-feature-gradient': `linear-gradient(135deg, ${p.accent}, ${accentMid})`,
  };
}

export { ACCENTS };
