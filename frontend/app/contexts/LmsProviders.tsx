'use client';
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@/app/contexts/ThemeProvider';
import { AntdThemeBridge } from '@/app/components/AntdThemeBridge';
import { AuthProvider } from '@/app/contexts/AuthProvider';
import { LmsTweaks } from '@/app/components/LmsTweaks';
import { ServerStatusBanner } from '@/app/components/ServerStatusBanner';

export function LmsProviders({ children }: { children: React.ReactNode }) {
  // GoogleOAuthProvider throws on empty clientId; must wrap LoginModal.
  const gid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const tree = (
    <ThemeProvider>
      <AntdThemeBridge>
        <AuthProvider>
          {children}
          <LmsTweaks />
          <ServerStatusBanner />
        </AuthProvider>
      </AntdThemeBridge>
    </ThemeProvider>
  );
  return gid ? <GoogleOAuthProvider clientId={gid}>{tree}</GoogleOAuthProvider> : tree;
}
