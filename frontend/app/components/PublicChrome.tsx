'use client';
import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Popover } from 'antd';
import { Icon, IconBtn, Tag } from '@/app/components/ui';
import { NAV_BY_ROLE } from '@/app/configs/nav.config';
import { ROUTES, routeToHref, resolvePath } from '@/app/configs/routes.config';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';
import { DB, useLMS } from '@/app/store/store';

const ROLE_LABEL_VI: Record<string, string> = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học viên' };

function PublicFooter({ p, push, topics }: { p: any; push: (href: string) => void; topics: Array<{ label: string; to?: string }> }) {
  const col = (title: string, links: Array<{ label: string; to?: string }>) => (
    <div>
      <div className="mb-3 text-[12.5px] font-bold tracking-[0.2px] text-lms-ink">{title}</div>
      <div className="flex flex-col gap-[9px]">
        {links.map((l, i) =>
          l.to ? (
            <Link key={i} href={routeToHref(l.to)} className="lms-foot-link cursor-pointer text-[13px] text-lms-sub no-underline">
              {l.label}
            </Link>
          ) : (
            <span key={i} className="lms-foot-link cursor-default text-[13px] text-lms-sub">
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
          <div className="mb-3.5 flex items-center gap-[11px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-lms-accent font-lms-heading text-lg font-bold tracking-[-0.5px] text-white">
              V
            </div>
            <div className="font-lms-heading text-lg font-bold text-lms-ink">Vườn Văn</div>
          </div>
          <p className="m-0 max-w-[300px] text-[13px] leading-relaxed text-lms-sub">
            Học liệu Ngữ văn Tiểu học miễn phí — tài liệu, đề thi, bài giảng và bài tập cho các em học sinh, phụ huynh và thầy cô.
          </p>
          <div className="mt-4 flex gap-[9px]">
            {['globe', 'message', 'send'].map((ic) => (
              <div key={ic} className="lms-row flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-lms-line">
                <Icon name={ic} size={15} stroke={p.sub} />
              </div>
            ))}
          </div>
        </div>
        {col('Khám phá', [
          { label: 'Trang chủ', to: 'home' },
          { label: 'Kho tài liệu', to: 's-docs' },
          { label: 'Luyện tập', to: 's-tasks' },
          { label: 'Tự đánh giá', to: 's-selfcheck' },
          { label: 'Bài viết', to: 'blog' },
        ])}
        {topics.length > 0 && col('Chủ đề', topics)}
        {col('Hỗ trợ', [{ label: 'Giới thiệu' }, { label: 'Hướng dẫn sử dụng' }, { label: 'Liên hệ' }, { label: 'Điều khoản' }])}
      </div>
      <div className="border-t border-lms-line-soft">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-[30px] py-4">
          <span className="text-xs text-lms-faint">© 2026 Vườn Văn · Học liệu Ngữ văn Tiểu học</span>
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
  const router = useRouter();
  const pathname = usePathname();
  const push = React.useCallback((href: string) => router.push(href), [router]);
  useLMS(); // re-render when live data (e.g. real folder names) loads

  // Footer "Chủ đề" comes from the real library folders, not a hardcoded list.
  const topics = (DB.DOC_FOLDERS as string[])
    .filter((f) => f && f !== 'Tất cả')
    .slice(0, 5)
    .map((label) => ({ label, to: 's-docs' as const }));

  const items = (NAV_BY_ROLE.user[0] && NAV_BY_ROLE.user[0].items) || [];
  const activeKey = resolvePath(pathname).navKey;
  const [menuOpen, setMenuOpen] = React.useState(false);
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
        className={`lms-btn flex cursor-pointer items-center gap-2 rounded-[9px] border-0 no-underline px-3.5 font-sans text-sm ${
          block ? 'h-11 w-full justify-start' : 'h-9 justify-center'
        } ${on ? 'bg-lms-accent-soft font-semibold text-lms-accent' : 'bg-transparent font-medium text-lms-sub'}`}
      >
        {block && <Icon name={it.icon} size={17} stroke={on ? p.accent : p.faint} />}
        {it.label}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-lms-bg font-sans text-lms-ink">
      <header className="z-30 shrink-0 border-b border-lms-line-soft bg-(--lms-surface-glass) backdrop-blur-md backdrop-saturate-[1.4]">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-[18px] px-6">
          <Link href={ROUTES.home} className="flex shrink-0 cursor-pointer items-center gap-[11px] no-underline">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-lms-accent font-lms-heading text-lg font-bold tracking-[-0.5px] text-white">
              V
            </div>
            <div>
              <div className="font-lms-heading text-[17px] font-bold leading-none text-lms-ink">Vườn Văn</div>
              <div className="mt-0.5 font-mono text-[9px] tracking-wide text-lms-faint">NGỮ VĂN TIỂU HỌC</div>
            </div>
          </Link>
          <nav className="lms-hide-sm ml-3.5 flex items-center gap-1">
            {items.map((it) => navLink(it, false))}
          </nav>
          <div className="flex-1" />
          <IconBtn name="search" p={p} onClick={() => push(ROUTES.library)} title="Tìm kiếm" />
          <IconBtn name={dark ? 'sun' : 'moon'} p={p} onClick={() => setDark(!dark)} title="Sáng/tối" />
          {auth && auth.loggedIn ? (
            <Popover
              trigger="click"
              placement="bottomRight"
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
                      <Link href={ROUTES.dashboard} className="lms-row flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] text-lms-ink no-underline">
                        <Icon name="settings" size={16} stroke={p.sub} /> Khu vực quản trị
                      </Link>
                      <Link href={ROUTES.account} className="lms-row flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] text-lms-ink no-underline">
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
                className="lms-btn lms-hide-sm flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border border-lms-line bg-lms-surface"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lms-accent-soft font-lms-heading text-xs font-bold text-lms-accent">
                  {auth.initials}
                </div>
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
          )}
          {auth?.isStaff && (
            <button
              onClick={() => push(ROUTES.dashboard)}
              className="lms-btn lms-hide-sm inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border border-lms-line bg-lms-surface text-lms-sub"
              title="Khu vực quản trị"
            >
              <Icon name="settings" size={16} stroke={p.sub} />
            </button>
          )}
          <button
            className="lms-hamburger lms-btn hidden h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-lms-line bg-lms-surface"
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
      <div className="lms-scroll flex flex-1 flex-col overflow-y-auto" ref={mainRef}>
        <main className="flex-1">{children}</main>
        <PublicFooter p={p} push={push} topics={topics} />
      </div>
    </div>
  );
}
