'use client';
// DashboardChrome — the admin app chrome (sidebar rail + top bar) used by the
// /dashboard route group layout. Reads theme from context, derives the active nav
// item + page title from the URL, and navigates via the Next router. Ported from
// the prop-based Shell.
import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { Icon, IconBtn, Btn } from '@/app/components/ui';
import { NAV_BY_ROLE, PAGE_TITLES, ROLE_META } from '@/app/configs/nav.config';
import { ROUTES, routeToHref, resolvePath } from '@/app/configs/routes.config';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';

function Rail({ p, t, activeKey, onNavigate }: { p: any; t: any; activeKey: string; onNavigate: () => void }) {
  const nav = NAV_BY_ROLE.admin;
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const compact = t.density === 'compact';
  return (
    <aside
      className="lms-rail"
      style={{ width: t.railWide ? 268 : 244, background: p.railBg, borderRight: `1px solid ${p.lineSoft}`, height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 2 }}
    >
      <div style={{ padding: compact ? '18px 20px 14px' : '22px 22px 18px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>V</div>
        <div>
          <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: p.ink, lineHeight: 1 }}>Vườn Văn</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1, color: p.faint, marginTop: 3 }}>NGỮ VĂN · TIỂU HỌC</div>
        </div>
      </div>
      <nav className="lms-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 14px' }}>
        {nav.map((g, gi) => (
          <div key={gi} style={{ marginBottom: compact ? 10 : 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.3, color: p.faint, padding: '0 12px 7px' }}>{g.group}</div>
            {g.items.map((it) => {
              const on = it.key === activeKey;
              return (
                <Link
                  key={it.key}
                  href={routeToHref(it.key)}
                  onClick={onNavigate}
                  className="lms-nav-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: compact ? '8px 12px' : '9px 12px', borderRadius: 10, marginBottom: 3, cursor: 'pointer', position: 'relative', textDecoration: 'none', backgroundColor: on ? p.activeBg : 'transparent', color: on ? p.accent : p.sub, fontWeight: on ? 600 : 450, fontSize: 13.5 }}
                >
                  <Icon name={it.icon} size={17} stroke={on ? p.accent : p.faint} sw={1.7} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.badge != null && (
                    <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, fontWeight: 600, color: on ? p.accent : p.faint, background: on ? p.accentSoft : p.sink, borderRadius: 20, padding: '1px 7px' }}>{it.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function RoleSwitcher({ p }: { p: any }) {
  const [open, setOpen] = React.useState(false);
  const auth = useLmsAuth();
  const m = ROLE_META.admin;
  // Show the real signed-in user (name + initials); fall back to the design's
  // placeholder identity only when there's no session.
  const displayName = auth.loggedIn && auth.name ? auth.name : m.sub;
  const initials = auth.loggedIn && auth.initials ? auth.initials : m.initials;
  const serif = FONTS.display;
  const targets: Array<{ key: string; href: string }> = [
    { key: 'admin', href: ROUTES.dashboard },
    { key: 'user', href: ROUTES.home },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="lms-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', padding: '5px 10px 5px 6px', borderRadius: 8, border: `1px solid ${p.line}`, background: p.surface }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: p.accentSoft, color: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontWeight: 600, fontSize: 15 }}>{initials}</div>
        <div className="lms-hide-xs" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: p.faint }}>{m.label}</div>
        </div>
        <Icon name="chevronDown" size={15} stroke={p.faint} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 240, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 8, boxShadow: `0 12px 40px ${hexA('#000', 0.16)}`, padding: 8, zIndex: 50 }}>
            <Link href={ROUTES.account} onClick={() => setOpen(false)} className="lms-nav-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', textDecoration: 'none' }}>
              <Icon name="user" size={16} stroke={p.sub} /><span style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>Hồ sơ cá nhân</span>
            </Link>
            <div style={{ height: 1, background: p.lineSoft, margin: '6px 4px' }} />
            <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1, color: p.faint, padding: '4px 10px 8px' }}>CHUYỂN VAI TRÒ</div>
            {targets.map(({ key, href }) => {
              const v = ROLE_META[key];
              const on = key === 'admin';
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="lms-nav-item"
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', textDecoration: 'none', backgroundColor: on ? p.activeBg : 'transparent' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: on ? p.accent : p.sink, color: on ? '#fff' : p.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontWeight: 600, fontSize: 13 }}>{on ? initials : v.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>{v.label}</div>
                    <div style={{ fontSize: 11, color: p.faint }}>{on ? displayName : v.sub}</div>
                  </div>
                  {on && <Icon name="check" size={16} stroke={p.accent} />}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardChrome({ children }: { children: ReactNode }) {
  const { p, t, dark, setDark } = useLmsTheme();
  const router = useRouter();
  const pathname = usePathname();
  const push = React.useCallback((href: string) => router.push(href), [router]);

  const { routeKey, navKey } = resolvePath(pathname);
  const [title, sub] = PAGE_TITLES[routeKey] || ['', ''];
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [navOpen, setNavOpen] = React.useState(false);
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Bảo mật UX: chưa đăng nhập → chặn khu quản trị + tự bật LoginModal.
  const auth = useLmsAuth();
  React.useEffect(() => {
    if (auth.ready && !auth.loggedIn) auth.open();
  }, [auth.ready, auth.loggedIn]);

  if (auth.ready && !auth.loggedIn) {
    return (
      <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: p.bg, color: p.ink, fontFamily: FONTS.sans, textAlign: 'center', padding: 30 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={26} stroke={p.accent} />
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, margin: 0, color: p.ink }}>Cần đăng nhập để vào trang quản trị</h2>
        <p style={{ fontSize: 14, color: p.sub, margin: 0, maxWidth: 380, lineHeight: 1.6 }}>Khu vực quản trị yêu cầu tài khoản giáo viên hoặc quản trị viên.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn p={p} icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Btn p={p} variant="ghost" onClick={() => push(ROUTES.home)}>Về trang chủ</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-shell" style={{ width: '100%', height: '100dvh', display: 'flex', background: p.bg, color: p.ink, fontFamily: FONTS.sans, overflow: 'hidden', position: 'relative' }}>
      <div className={'lms-rail-backdrop' + (navOpen ? ' is-open' : '')} onClick={() => setNavOpen(false)} />
      <div className={navOpen ? 'is-open-wrap' : ''} style={navOpen ? { position: 'fixed', inset: 0, zIndex: 70 } : undefined}>
        <Rail p={p} t={t} activeKey={navKey} onNavigate={() => setNavOpen(false)} />
      </div>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <header className="lms-header" style={{ height: 64, borderBottom: `1px solid ${p.lineSoft}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0, background: p.surface }}>
          <button
            className="lms-hamburger lms-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Menu"
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 8, cursor: 'pointer', border: `1px solid ${p.line}`, background: p.surface, flexShrink: 0 }}
          >
            <Icon name="list" size={18} stroke={p.sub} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: serif, fontSize: 21, fontWeight: 600, color: p.ink, margin: 0, letterSpacing: -0.2, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
            <div className="lms-hide-xs" style={{ fontSize: 12, color: p.faint, marginTop: 1 }}>{sub}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="lms-hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 9, width: 240, height: 32, border: `1px solid ${p.line}`, borderRadius: 8, padding: '0 11px', color: p.faint, background: p.surface }}>
            <Icon name="search" size={15} stroke={p.faint} />
            <span style={{ fontSize: 13 }}>Tìm kiếm…</span>
            <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 10.5, border: `1px solid ${p.line}`, borderRadius: 4, padding: '0 5px' }}>⌘K</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconBtn name={dark ? 'sun' : 'moon'} p={p} onClick={() => setDark(!dark)} title="Chế độ sáng/tối" />
            <IconBtn name="notify" p={p} badge={3} onClick={() => push(ROUTES.notifications)} />
          </div>
          <div className="lms-hide-sm" style={{ width: 1, height: 28, background: p.lineSoft }} />
          <RoleSwitcher p={p} />
        </header>
        <div className="lms-scroll" style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
