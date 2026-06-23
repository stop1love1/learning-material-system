'use client';
// helpers.tsx — cross-screen shared helpers, centralized from the prototype where
// they were duplicated/global: lblStyle (form-label style), ToggleRow (settings
// toggle), and tStripe/ACCENTS_REF (class accent-stripe colors).
import React from 'react';
import type { CSSProperties } from 'react';
import type { Palette } from '@/app/types';
import { FONTS } from '@/app/theme/fonts';

/** Uppercase mono label style used by forms (login, compose, editors). */
export function lblStyle(p: Palette): CSSProperties {
  return { fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint, display: 'block' };
}

/** Class accent-stripe hue map + resolver (used by teacher/admin/student cards). */
export const ACCENTS_REF: Record<string, { light: string; dark: string }> = {
  clay: { light: '#c2553e', dark: '#e0856b' },
  olive: { light: '#5f7e2e', dark: '#a3c266' },
  teal: { light: '#0d8276', dark: '#46c2b1' },
  indigo: { light: '#4f4fcf', dark: '#9090ef' },
  plum: { light: '#8a45c0', dark: '#bd8ae0' },
};

export function tStripe(p: Palette, hue: string): string {
  return (ACCENTS_REF[hue] || ACCENTS_REF.clay)[p.dark ? 'dark' : 'light'];
}

/** A labelled on/off row used across settings screens. */
export function ToggleRow({ p, label, def }: { p: Palette; label: React.ReactNode; def?: any }) {
  const [on, setOn] = React.useState(!!def);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 14px',
        borderRadius: 12,
        border: `1px solid ${p.line}`,
        background: p.raise,
      }}
    >
      <span style={{ fontSize: 13.5, color: p.ink }}>{label}</span>
      <div
        onClick={() => setOn(!on)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 12,
          cursor: 'pointer',
          padding: 2,
          background: on ? p.accent : p.sink,
          transition: 'background .15s',
          display: 'flex',
          justifyContent: on ? 'flex-end' : 'flex-start',
        }}
      >
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </div>
    </div>
  );
}
