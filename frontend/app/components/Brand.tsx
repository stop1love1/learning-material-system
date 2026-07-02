'use client';
import React from 'react';
import { settingsApi } from '@/app/lib/api';

// Org branding (logo + name) comes from Settings → org. Fetched once and cached
// at module level so header, footer and the admin rail all share one request;
// admin's save calls refreshOrgBrand() so the change shows without a full reload.
export interface OrgBrand {
  name: string;
  logoUrl: string | null;
}

const DEFAULT_BRAND: OrgBrand = { name: 'Vườn Văn', logoUrl: null };

let cache: OrgBrand | null = null;
let inflight: Promise<void> | null = null;
const subs = new Set<() => void>();

function load(): Promise<void> {
  inflight = settingsApi
    .get()
    .then((s: any) => {
      const o = s?.org || {};
      cache = { name: (o.name || '').trim() || DEFAULT_BRAND.name, logoUrl: o.logoUrl || null };
    })
    .catch(() => {
      cache = cache || DEFAULT_BRAND; // API down / logged out → keep default brand
    })
    .finally(() => {
      inflight = null;
      subs.forEach((fn) => fn());
    });
  return inflight;
}

/** Re-fetch org branding and notify all mounted consumers (call after admin saves). */
export function refreshOrgBrand(): void {
  void load();
}

export function useOrgBrand(): OrgBrand {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    subs.add(force);
    if (!cache && !inflight) void load();
    return () => {
      subs.delete(force);
    };
  }, []);
  return cache || DEFAULT_BRAND;
}

/** The square brand mark: the configured logo image, or a letter-tile fallback. */
export function BrandLogo({ className = '' }: { className?: string }) {
  const { name, logoUrl } = useOrgBrand();
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`h-[34px] w-[34px] shrink-0 rounded-[10px] object-cover ${className}`}
      />
    );
  }
  const initial = (name.trim()[0] || 'V').toUpperCase();
  return (
    <div
      className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-lms-accent font-lms-heading text-lg font-bold tracking-[-0.5px] text-white ${className}`}
    >
      {initial}
    </div>
  );
}
