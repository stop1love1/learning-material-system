'use client';
import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Popover } from 'antd';
import { Icon, IconBtn, Tag } from '@/app/components/ui';
import { BrandLogo, useOrgBrand } from '@/app/components/Brand';
import { NAV_BY_ROLE } from '@/app/configs/nav.config';
import { ROUTES, routeToHref, resolvePath } from '@/app/configs/routes.config';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';
import { DB, useLMS } from '@/app/store/store';

const ROLE_LABEL_VI: Record<string, string> = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học viên' };

function PublicFooter({ p, topics }: { p: any; topics: Array<{ label: string; href?: string }> }) {
  const brand = useOrgBrand();
  const col = (title: string, links: Array<{ label: string; href?: string }>) => (
    <div>
      <div className="mb-3 text-[12.5px] font-bold tracking-[0.2px] text-lms-ink">{title}</div>
      <div className="flex flex-col gap-[9px]">
        {links.map((l, i) =>
          l.href ? (
            <Link key={i} href={l.href} className="lms-foot-link text-[13px] text-lms-sub no-underline transition-colors hover:text-lms-accent">
              {l.label}
            </Link>
          ) : (
            <span key={i} className="text-[13px] text-lms-sub">
              {l.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
  return (
    <footer className="mt-2 border-t border-lms-line-soft bg-lms-surface">
      <div className="lms-foot-grid mx-auto grid max-w-[1480px] grid-cols-[1.6fr_1fr_1fr_1fr] gap-8 px-[30px] pt-11 pb-7">
        <div>
          <Link href={ROUTES.home} className="mb-3.5 flex w-fit items-center gap-[11px] no-underline">
            <BrandLogo />
            <div className="font-lms-heading text-lg font-bold text-lms-ink">{brand.name}</div>
          </Link>
          <p className="m-0 max-w-[300px] text-[13px] leading-relaxed text-lms-sub">
            Kho học liệu mở miễn phí — tài liệu và bài tập cho học sinh, phụ huynh và thầy cô.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-[13px] text-lms-sub">
            <div className="flex items-center gap-2">
              <Icon name="users" size={14} stroke={p.faint} />
              <span>
                Tác giả: <span className="font-semibold text-lms-ink">Trần Phương Thanh</span>
              </span>
            </div>
            <a
              href="tel:0972421266"
              className="lms-foot-link flex w-fit items-center gap-2 no-underline transition-colors hover:text-lms-accent"
            >
              <Icon name="phone" size={14} stroke={p.faint} /> 0972 421 266
            </a>
            <a
              href="mailto:tpthanh@daihocthudo.edu.vn"
              className="lms-foot-link flex w-fit items-center gap-2 break-all no-underline transition-colors hover:text-lms-accent"
            >
              <Icon name="mail" size={14} stroke={p.faint} /> tpthanh@daihocthudo.edu.vn
            </a>
          </div>
        </div>
        {col('Khám phá', [
          { label: 'Trang chủ', href: ROUTES.home },
          { label: 'Kho học liệu', href: ROUTES.library },
          { label: 'Luyện tập', href: ROUTES.practice },
          { label: 'Tự đánh giá', href: ROUTES.selfCheck },
          { label: 'Bài viết', href: ROUTES.blog },
        ])}
        {topics.length > 0 && col('Chủ đề', topics)}
        {col('Hỗ trợ', [
          { label: 'Giới thiệu', href: ROUTES.about },
          { label: 'Hướng dẫn sử dụng', href: ROUTES.guide },
          { label: 'Liên hệ', href: ROUTES.contact },
          { label: 'Điều khoản', href: ROUTES.terms },
        ])}
      </div>
      <div className="border-t border-lms-line-soft">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-[30px] py-4">
          <span className="text-xs text-lms-faint">© 2026 {brand.name} · Nền tảng học liệu</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-lms-faint">
            <Icon name="globe" size={13} stroke={p.faint} /> Truy cập tự do · Không cần đăng nhập
          </span>
        </div>
      </div>
    </footer>
  );
}

export function PublicChrome({ children }: { children: ReactNode }) {
  const { p, dark, setDark } = useLmsTheme();
  const auth = useLmsAuth();
  const brand = useOrgBrand();
  const router = useRouter();
  const pathname = usePathname();
  const push = React.useCallback((href: string) => router.push(href), [router]);
  useLMS();

  const topics = (DB.DOC_FOLDERS as string[])
    .filter((f) => f && f !== 'Tất cả')
    .slice(0, 5)
    .map((label) => ({ label, href: ROUTES.library }));

  const items = (NAV_BY_ROLE.user[0] && NAV_BY_ROLE.user[0].items) || [];
  const activeKey = resolvePath(pathname).navKey;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [acctOpen, setAcctOpen] = React.useState(false);
  const mainRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    setMenuOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [pathname]);

  const navLink = (it: { key: string; icon: string; label: string }, block: boolean) => {
    const on = it.key === activeKey;
    return (
      <Link
        key={it.key}
        href={routeToHref(it.key)}
        aria-current={on ? 'page' : undefined}
        style={{ color: on ? p.accent : p.sub, background: on ? p.accentSoft : undefined }}
        className={`lms-btn lms-row flex cursor-pointer items-center gap-2 rounded-[10px] border-0 no-underline px-3.5 font-sans text-sm transition-colors ${
          block ? 'h-11 w-full justify-start' : 'h-9 justify-center'
        } ${on ? 'font-semibold' : 'font-medium'}`}
      >
        {block && <Icon name={it.icon} size={17} stroke={on ? p.accent : p.faint} />}
        {it.label}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-lms-bg font-sans text-lms-ink">
      <header
        className={`z-30 shrink-0 border-b bg-(--lms-surface-glass) backdrop-blur-md backdrop-saturate-[1.4] transition-[box-shadow,border-color] duration-200 ${
          scrolled ? 'border-lms-line shadow-[0_6px_24px_-8px_rgba(80,55,30,0.14)]' : 'border-lms-line-soft'
        }`}
      >
        <div className="lms-stagger mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-6">
          <Link href={ROUTES.home} className="flex shrink-0 cursor-pointer items-center gap-[11px] no-underline transition-opacity hover:opacity-80" aria-label={brand.name}>
            <BrandLogo className="h-[38px]! w-[38px]!" />
            <div className="lms-hide-sm">
              <div className="font-lms-heading text-[17px] font-bold leading-none text-lms-ink">{brand.name}</div>
              <div className="mt-0.5 font-mono text-[9px] tracking-wide text-lms-faint">NỀN TẢNG HỌC LIỆU</div>
            </div>
          </Link>
          <nav className="lms-hide-sm flex items-center gap-0.5">
            {items.map((it) => navLink(it, false))}
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <IconBtn name={dark ? 'sun' : 'moon'} p={p} variant="filled" size={36} onClick={() => setDark(!dark)} title="Sáng/tối" />
          {auth?.ready && (auth.loggedIn ? (
            <Popover
              trigger="click"
              placement="bottomRight"
              onOpenChange={setAcctOpen}
              content={
                <div className="w-[244px]">
                  <div className="flex items-center gap-3 px-1 pb-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lms-accent-soft font-lms-heading text-base font-bold text-lms-accent">
                      {auth.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-lms-ink">{auth.name}</div>
                      {auth.email && <div className="truncate text-[12px] text-lms-sub">{auth.email}</div>}
                      <div className="mt-1.5">
                        <Tag p={p} color={auth.role === 'admin' ? p.warn : p.accent}>
                          {ROLE_LABEL_VI[auth.role] || 'Người dùng'}
                        </Tag>
                      </div>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-lms-line-soft" />
                  {auth.isStaff && (
                    <>
                      <Link href={ROUTES.dashboard} className="lms-row lms-mutelink flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] no-underline">
                        <Icon name="settings" size={16} stroke={p.sub} /> Khu vực quản trị
                      </Link>
                      <Link href={ROUTES.account} className="lms-row lms-mutelink flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] no-underline">
                        <Icon name="users" size={16} stroke={p.sub} /> Tài khoản & hồ sơ
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => auth.logout()}
                    className="lms-row flex h-9 w-full items-center gap-2.5 rounded-lg border-0 bg-transparent px-2 text-left text-[13px] text-lms-danger"
                  >
                    <Icon name="logout" size={16} stroke={p.danger} /> Đăng xuất
                  </button>
                </div>
              }
            >
              <button
                title={auth.name}
                aria-label="Tài khoản"
                className="lms-btn lms-hide-sm group flex h-10 cursor-pointer items-center gap-2 rounded-full border border-lms-line bg-lms-surface py-1 pl-1 pr-3 text-left transition-shadow hover:shadow-[0_2px_10px_-3px_rgba(80,55,30,0.18)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lms-accent font-lms-heading text-[11px] font-bold text-white shadow-[0_1px_4px_-1px_rgba(63,157,92,0.6)] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
                  {auth.initials}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="max-w-[160px] truncate text-[12.5px] font-semibold leading-tight text-lms-ink">{auth.name}</span>
                  <span className="max-w-[160px] truncate text-[11px] leading-tight text-lms-sub">{ROLE_LABEL_VI[auth.role] || 'Người dùng'}</span>
                </span>
                <Icon name="chevronDown" size={15} stroke={p.faint} className={`transition-transform duration-200 motion-reduce:transition-none ${acctOpen ? 'rotate-180' : ''}`} />
              </button>
            </Popover>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                auth && auth.open();
              }}
              className="lms-btn lms-hide-sm inline-flex h-9 cursor-pointer items-center gap-[7px] rounded-[9px] border-0 bg-lms-accent px-4 font-sans text-[13px] font-semibold text-white shadow-[0_2px_0_var(--lms-glow)]"
            >
              <Icon name="logout" size={15} stroke="#fff" /> Đăng nhập
            </button>
          ))}
          </div>
          <button
            className="lms-hamburger lms-btn lms-row hidden h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-0 bg-lms-sink"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <Icon name={menuOpen ? 'x' : 'list'} size={18} stroke={p.sub} />
          </button>
        </div>
        {menuOpen && (
          <div className="flex flex-col gap-1 border-t border-lms-line-soft bg-lms-surface px-4 pt-2.5 pb-3.5">
            {items.map((it) => navLink(it, true))}
            <div className="my-1.5 h-px bg-lms-line-soft" />
            {auth?.isStaff && (
              <button
                onClick={() => push(ROUTES.dashboard)}
                className="lms-btn flex h-11 cursor-pointer items-center gap-2 rounded-[9px] border-0 bg-transparent px-3.5 font-sans text-sm font-medium text-lms-sub"
              >
                <Icon name="settings" size={17} stroke={p.faint} /> Khu vực quản trị
              </button>
            )}
            {auth &&
              (auth.loggedIn ? (
                <button
                  onClick={() => auth.logout()}
                  className="lms-btn flex h-11 cursor-pointer items-center gap-2 rounded-[9px] border-0 bg-transparent px-3.5 font-sans text-sm font-medium text-lms-sub"
                >
                  <Icon name="logout" size={17} stroke={p.faint} /> Đăng xuất ({auth.name.split(' ').slice(-1)[0]})
                </button>
              ) : (
                <button
                  onClick={() => auth.open()}
                  className="lms-btn flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[9px] border-0 bg-lms-accent px-3.5 font-sans text-sm font-semibold text-white"
                >
                  <Icon name="logout" size={17} stroke="#fff" /> Đăng nhập
                </button>
              ))}
          </div>
        )}
      </header>
      <div
        className="lms-scroll lms-page-scroll flex flex-1 flex-col overflow-y-auto"
        ref={mainRef}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        <main className="flex-1">{children}</main>
        <PublicFooter p={p} topics={topics} />
      </div>
    </div>
  );
}
