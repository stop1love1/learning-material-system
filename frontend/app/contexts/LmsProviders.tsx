'use client';
import React from 'react';
import { ThemeProvider } from '@/app/contexts/ThemeProvider';
import { AuthProvider } from '@/app/contexts/AuthProvider';
import { LmsTweaks } from '@/app/components/LmsTweaks';
import { ServerStatusBanner } from '@/app/components/ServerStatusBanner';

export function LmsProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <LmsTweaks />
        <ServerStatusBanner />
      </AuthProvider>
    </ThemeProvider>
  );
}
