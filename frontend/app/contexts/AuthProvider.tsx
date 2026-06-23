'use client';
// AuthProvider — global (demo) auth state for the LMS: login modal open/closed
// and a fake logged-in user. Renders the LoginModal itself so it is available on
// every route. Reads palette/tweaks from ThemeProvider, so it must be nested
// inside <ThemeProvider>.
import React from 'react';
import type { Auth } from '@/app/types';
import { LoginModal } from '@/app/components/LoginModal';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';

const AuthContext = React.createContext<Auth | null>(null);

export function useLmsAuth(): Auth {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useLmsAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { p, t } = useLmsTheme();
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const auth: Auth = {
    loggedIn,
    name: 'Nguyễn Thu Hà',
    initials: 'TH',
    open: () => setOpen(true),
    login: () => {
      setLoggedIn(true);
      setOpen(false);
    },
    logout: () => setLoggedIn(false),
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
      {open && <LoginModal p={p} t={t} auth={auth} onClose={() => setOpen(false)} />}
    </AuthContext.Provider>
  );
}
