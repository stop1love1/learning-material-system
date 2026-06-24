'use client';
import React from 'react';
import type { Palette } from '@/app/types';

/** Uppercase mono label class used by forms (login, compose, editors). */
export function lblClass(): string {
  return 'block font-mono text-[10.5px] tracking-[0.5px] text-lms-faint';
}

/** Surface card utility classes (replaces inline sCard helper). */
export function cardClass(pad: 16 | 20 | 24 | 30 = 20): string {
  const pads: Record<number, string> = { 16: 'p-4', 20: 'p-5', 24: 'p-6', 30: 'p-[30px]' };
  return `bg-lms-surface border border-lms-line rounded-xl ${pads[pad] || 'p-5'}`;
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
    <div className="flex items-center justify-between rounded-xl border border-lms-line bg-lms-raise px-3.5 py-[11px]">
      <span className="text-[13.5px] text-lms-ink">{label}</span>
      <div
        onClick={() => setOn(!on)}
        className={`flex h-6 w-[42px] cursor-pointer rounded-xl p-0.5 transition-colors ${on ? 'bg-lms-accent justify-end' : 'bg-lms-sink justify-start'}`}
      >
        <div className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]" />
      </div>
    </div>
  );
}
