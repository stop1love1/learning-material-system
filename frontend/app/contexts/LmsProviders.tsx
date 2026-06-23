'use client';
// LmsProviders — single client boundary that wraps the whole app (mounted in the
// root layout). Provides theme + auth context and renders the global Tweaks
// panel. Stays mounted across route navigations, so appearance/auth state and
// the open login modal persist.
import React from 'react';
import { ThemeProvider } from '@/app/contexts/ThemeProvider';
import { AuthProvider } from '@/app/contexts/AuthProvider';
import { LmsTweaks } from '@/app/components/LmsTweaks';

export function LmsProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <LmsTweaks />
      </AuthProvider>
    </ThemeProvider>
  );
}
