'use client';
// AuthProvider — global auth state backed by the LMS backend API. Stores the JWT
// in localStorage, restores the session via /auth/me on load, and renders the
// LoginModal. Reads palette/tweaks from ThemeProvider, so must be nested inside it.
import React from 'react';
import type { Auth } from '@/app/types';
import { LoginModal } from '@/app/components/LoginModal';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { authApi, setToken, clearToken, getToken } from '@/app/lib/api';

const AuthContext = React.createContext<Auth | null>(null);

export function useLmsAuth(): Auth {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useLmsAuth must be used within <AuthProvider>');
  return ctx;
}

function initialsOf(name: string): string {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { p, t } = useLmsTheme();
  const [user, setUser] = React.useState<{ name: string } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  // Restore session from a stored token.
  React.useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    authApi
      .me()
      .then((u) => setUser({ name: u.name }))
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.accessToken);
    setUser({ name: res.user?.name ?? email });
    setOpen(false);
  }, []);

  const register = React.useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    setToken(res.accessToken);
    setUser({ name: res.user?.name ?? name });
    setOpen(false);
  }, []);

  const logout = React.useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const auth: Auth = {
    loggedIn: !!user,
    ready,
    name: user?.name ?? '',
    initials: user ? initialsOf(user.name) : '',
    open: () => setOpen(true),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
      {open && <LoginModal p={p} t={t} auth={auth} onClose={() => setOpen(false)} />}
    </AuthContext.Provider>
  );
}
