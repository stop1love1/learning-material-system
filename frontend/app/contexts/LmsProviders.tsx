'use client';
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@/app/contexts/ThemeProvider';
import { AuthProvider } from '@/app/contexts/AuthProvider';
import { LmsTweaks } from '@/app/components/LmsTweaks';
import { ServerStatusBanner } from '@/app/components/ServerStatusBanner';

export function LmsProviders({ children }: { children: React.ReactNode }) {
  // GoogleOAuthProvider must sit ABOVE AuthProvider/LoginModal (the Google button lives
  // inside LoginModal and needs this context). Only mount it when a client id is configured
  // — the provider throws on an empty clientId.
  const gid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const tree = (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <LmsTweaks />
        <ServerStatusBanner />
      </AuthProvider>
    </ThemeProvider>
  );
  return gid ? <GoogleOAuthProvider clientId={gid}>{tree}</GoogleOAuthProvider> : tree;
}
