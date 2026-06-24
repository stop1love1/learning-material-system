'use client';
import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, IconBtn, Btn } from '@/app/components/ui';
import { NAV_BY_ROLE, PAGE_TITLES, ROLE_META } from '@/app/configs/nav.config';
import { ROUTES, routeToHref, resolvePath } from '@/app/configs/routes.config';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';

function Rail({ p, t, activeKey, onNavigate }: { p: any; t: any; activeKey: string; onNavigate: () => void }) {
  const nav = NAV_BY_ROLE.admin;
  const compact = t.density === 'compact';
  return (
    <aside
      className="lms-rail relative z-2 flex h-full shrink-0 flex-col border-r border-lms-line-soft bg-lms-rail-bg"
      style={{ width: t.railWide ? 268 : 244 }}
    >
      <div className={`flex items-center gap-[11px] ${compact ? 'px-5 pt-[18px] pb-3.5' : 'p-[22px_22px_18px]'}`}>
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-lms-accent font-lms-heading text-lg font-bold tracking-[-0.5px] text-white">V</div>
        <div>
          <div className="font-lms-heading text-lg font-semibold leading-none text-lms-ink">Vườn Văn</div>
          <div className="mt-[3px] font-mono text-[9.5px] tracking-wide text-lms-faint">NGỮ VĂN · TIỂU HỌC</div>
        </div>
      </div>
      <nav className="lms-scroll flex-1 overflow-y-auto px-3.5 pt-1">
        {nav.map((g, gi) => (
          <div key={gi} className={compact ? 'mb-2.5' : 'mb-3.5'}>
            <div className="px-3 pb-[7px] font-mono text-[9.5px] tracking-[1.3px] text-lms-faint">{g.group}</div>
            {g.items.map((it) => {
              const on = it.key === activeKey;
              return (
                <Link
                  key={it.key}
                  href={routeToHref(it.key)}
                  onClick={onNavigate}
                  className={`lms-nav-item relative mb-[3px] flex cursor-pointer items-center gap-[11px] rounded-[10px] no-underline text-[13.5px] ${
                    compact ? 'px-3 py-2' : 'px-3 py-[9px]'
                  } ${on ? 'bg-lms-active-bg font-semibold text-lms-accent' : 'bg-transparent font-[450] text-lms-sub'}`}
                >
                  <Icon name={it.icon} size={17} stroke={on ? p.accent : p.faint} sw={1.7} />
                  <span className="flex-1">{it.label}</span>
                  {it.badge != null && (
                    <span className={`rounded-[20px] px-[7px] py-px font-mono text-[10.5px] font-semibold ${on ? 'bg-lms-accent-soft text-lms-accent' : 'bg-lms-sink text-lms-faint'}`}>{it.badge}</span>
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
  const displayName = auth.loggedIn && auth.name ? auth.name : m.sub;
  const initials = auth.loggedIn && auth.initials ? auth.initials : m.initials;
  const targets: Array<{ key: string; href: string }> = [
    { key: 'admin', href: ROUTES.dashboard },
    { key: 'user', href: ROUTES.home },
  ];
  return (
    <div className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className="lms-btn flex cursor-pointer items-center gap-[11px] rounded-lg border border-lms-line bg-lms-surface py-[5px] pr-2.5 pl-1.5"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-lms-accent-soft font-lms-heading text-[15px] font-semibold text-lms-accent">{initials}</div>
        <div className="lms-hide-xs min-w-0">
          <div className="text-[13px] font-semibold whitespace-nowrap text-lms-ink">{displayName}</div>
          <div className="text-[11px] text-lms-faint">{m.label}</div>
        </div>
        <Icon name="chevronDown" size={15} stroke={p.faint} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" />
          <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-lg border border-lms-line bg-lms-surface p-2 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
            <Link href={ROUTES.account} onClick={() => setOpen(false)} className="lms-nav-item flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-[9px] no-underline">
              <Icon name="user" size={16} stroke={p.sub} /><span className="text-[13px] font-semibold text-lms-ink">Hồ sơ cá nhân</span>
            </Link>
            <div className="mx-1 my-1.5 h-px bg-lms-line-soft" />
            <div className="px-2.5 pt-1 pb-2 font-mono text-[9.5px] tracking-wide text-lms-faint">CHUYỂN VAI TRÒ</div>
            {targets.map(({ key, href }) => {
              const v = ROLE_META[key];
              const on = key === 'admin';
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`lms-nav-item flex cursor-pointer items-center gap-[11px] rounded-[9px] px-2.5 py-[9px] no-underline ${on ? 'bg-lms-active-bg' : 'bg-transparent'}`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-[9px] font-lms-heading text-[13px] font-semibold ${on ? 'bg-lms-accent text-white' : 'bg-lms-sink text-lms-sub'}`}>{on ? initials : v.initials}</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-lms-ink">{v.label}</div>
                    <div className="text-[11px] text-lms-faint">{on ? displayName : v.sub}</div>
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
  const [navOpen, setNavOpen] = React.useState(false);
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const auth = useLmsAuth();
  React.useEffect(() => {
    if (auth.ready && !auth.loggedIn) auth.open();
  }, [auth.ready, auth.loggedIn]);

  if (auth.ready && !auth.loggedIn) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-lms-bg p-[30px] text-center font-sans text-lms-ink">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-lms-accent-soft">
          <Icon name="settings" size={26} stroke={p.accent} />
        </div>
        <h2 className="m-0 font-lms-heading text-[22px] font-bold text-lms-ink">Cần đăng nhập để vào trang quản trị</h2>
        <p className="m-0 max-w-[380px] text-sm leading-relaxed text-lms-sub">Khu vực quản trị yêu cầu tài khoản giáo viên hoặc quản trị viên.</p>
        <div className="flex gap-2.5">
          <Btn p={p} icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Btn p={p} variant="ghost" onClick={() => push(ROUTES.home)}>Về trang chủ</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-shell relative flex h-dvh w-full overflow-hidden bg-lms-bg font-sans text-lms-ink">
      <div className={'lms-rail-backdrop' + (navOpen ? ' is-open' : '')} onClick={() => setNavOpen(false)} />
      <div className={navOpen ? 'is-open-wrap fixed inset-0 z-70' : ''}>
        <Rail p={p} t={t} activeKey={navKey} onNavigate={() => setNavOpen(false)} />
      </div>
      <main className="relative z-1 flex min-w-0 flex-1 flex-col">
        <header className="lms-header flex h-16 shrink-0 items-center gap-4 border-b border-lms-line-soft bg-lms-surface px-7">
          <button
            className="lms-hamburger lms-btn hidden h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-lms-line bg-lms-surface"
            onClick={() => setNavOpen(true)}
            aria-label="Menu"
          >
            <Icon name="list" size={18} stroke={p.sub} />
          </button>
          <div className="min-w-0">
            <h1 className="m-0 overflow-hidden font-lms-heading text-[21px] leading-[1.15] font-semibold tracking-[-0.2px] text-ellipsis whitespace-nowrap text-lms-ink">{title}</h1>
            <div className="lms-hide-xs mt-px text-xs text-lms-faint">{sub}</div>
          </div>
          <div className="flex-1" />
          <div className="lms-hide-sm flex h-8 w-60 items-center gap-[9px] rounded-lg border border-lms-line bg-lms-surface px-[11px] text-lms-faint">
            <Icon name="search" size={15} stroke={p.faint} />
            <span className="text-[13px]">Tìm kiếm…</span>
            <span className="ml-auto rounded border border-lms-line px-[5px] font-mono text-[10.5px]">⌘K</span>
          </div>
          <div className="flex gap-2">
            <IconBtn name={dark ? 'sun' : 'moon'} p={p} onClick={() => setDark(!dark)} title="Chế độ sáng/tối" />
            <IconBtn name="notify" p={p} badge={3} onClick={() => push(ROUTES.notifications)} />
          </div>
          <div className="lms-hide-sm h-7 w-px bg-lms-line-soft" />
          <RoleSwitcher p={p} />
        </header>
        <div className="lms-scroll flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
