'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { Auth, Role } from '@/app/types';
import { LoginModal } from '@/app/components/LoginModal';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { ROUTES } from '@/app/configs/routes.config';
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

type SessionUser = { name: string; role: Role | ''; email: string };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { p, t } = useLmsTheme();
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  // After an explicit login (not session-restore), staff go straight to the admin area.
  const redirectByRole = React.useCallback((role?: Role | '') => {
    if (role === 'admin' || role === 'teacher') router.push(ROUTES.dashboard);
  }, [router]);

  React.useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    authApi
      .me()
      .then((u) => setUser({ name: u.name, role: u.role ?? '', email: u.email ?? '' }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // client.ts clears token on 401; drop user and prompt re-login.
  React.useEffect(() => {
    const onUnauthorized = () => {
      setUser((u) => {
        if (u) setOpen(true);
        return null;
      });
    };
    window.addEventListener('lms:unauthorized', onUnauthorized);
    return () => window.removeEventListener('lms:unauthorized', onUnauthorized);
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = (await authApi.login(email, password)) as {
      accessToken?: string;
      user?: { name?: string; role?: Role | ''; email?: string };
      needs2fa?: boolean;
      email?: string;
      devOtp?: string;
    };
    if (res.needs2fa) {
      return { needs2fa: true, email: res.email, devOtp: res.devOtp };
    }
    setToken(res.accessToken!);
    setUser({ name: res.user?.name ?? email, role: res.user?.role ?? '', email: res.user?.email ?? email });
    setOpen(false);
    redirectByRole(res.user?.role ?? '');
    return {};
  }, [redirectByRole]);

  const verify2fa = React.useCallback(async (email: string, code: string) => {
    const res = await authApi.verify2fa(email, code);
    setToken(res.accessToken);
    setUser({ name: res.user?.name ?? '', role: res.user?.role ?? '', email: res.user?.email ?? email });
    setOpen(false);
    redirectByRole(res.user?.role ?? '');
  }, [redirectByRole]);

  const register = React.useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    return { needsVerification: res.needsVerification, devVerifyLink: res.devVerifyLink };
  }, []);

  const googleLogin = React.useCallback(async (idToken: string) => {
    const res = await authApi.google(idToken);
    setToken(res.accessToken);
    setUser({ name: res.user?.name ?? '', role: res.user?.role ?? '', email: res.user?.email ?? '' });
    setOpen(false);
    redirectByRole(res.user?.role ?? '');
  }, [redirectByRole]);

  const logout = React.useCallback(() => {
    authApi.logout().catch(() => {});
    clearToken();
    setUser(null);
  }, []);

  const role = user?.role ?? '';
  const auth: Auth = {
    loggedIn: !!user,
    ready,
    name: user?.name ?? '',
    email: user?.email ?? '',
    initials: user ? initialsOf(user.name) : '',
    role,
    isStaff: role === 'teacher' || role === 'admin',
    open: () => setOpen(true),
    login,
    verify2fa,
    register,
    googleLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
      {open && <LoginModal p={p} t={t} auth={auth} onClose={() => setOpen(false)} />}
    </AuthContext.Provider>
  );
}
