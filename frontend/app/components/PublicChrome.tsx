'use client';
// PublicChrome — the public website chrome (glass header · main · footer) used by
// the (site) route group layout. Reads theme + auth from context and derives the
// active nav item from the URL; navigation uses the Next router via the central
// routes map. Ported from the prop-based PublicSite.
import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { Icon, IconBtn } from '@/app/components/ui';
import { NAV_BY_ROLE } from '@/app/configs/nav.config';
import { ROUTES, routeToHref, resolvePath } from '@/app/configs/routes.config';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { useLmsAuth } from '@/app/contexts/AuthProvider';

function PublicFooter({ p, t, push }: { p: any; t: any; push: (href: string) => void }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const col = (title: string, links: Array<{ label: string; to?: string }>) => (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: p.ink, marginBottom: 12, letterSpacing: 0.2 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {links.map((l, i) => (
          <span
            key={i}
            onClick={l.to ? () => push(routeToHref(l.to!)) : undefined}
            className="lms-foot-link"
            style={{ fontSize: 13, color: p.sub, cursor: l.to ? 'pointer' : 'default' }}
          >
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <footer style={{ borderTop: `1px solid ${p.lineSoft}`, background: p.surface, marginTop: 8 }}>
      <div
        style={{ maxWidth: 1480, margin: '0 auto', padding: '44px 30px 28px', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 32 }}
        className="lms-foot-grid"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
            <div
              style={{ width: 34, height: 34, borderRadius: 10, background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}
            >
              V
            </div>
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: p.ink }}>Vườn Văn</div>
          </div>
          <p style={{ fontSize: 13, color: p.sub, lineHeight: 1.6, maxWidth: 300, margin: 0 }}>
            Học liệu Ngữ văn Tiểu học miễn phí — tài liệu, đề thi, bài giảng và bài tập cho các em học sinh, phụ huynh và thầy cô.
          </p>
          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
            {['globe', 'message', 'send'].map((ic) => (
              <div key={ic} className="lms-row" style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${p.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
        {col('Chủ đề', [
          { label: 'Giáo án', to: 's-docs' },
          { label: 'Tập đọc', to: 's-docs' },
          { label: 'Thơ', to: 's-docs' },
          { label: 'Đề thi', to: 's-docs' },
        ])}
        {col('Hỗ trợ', [{ label: 'Giới thiệu' }, { label: 'Hướng dẫn sử dụng' }, { label: 'Liên hệ' }, { label: 'Điều khoản' }])}
      </div>
      <div style={{ borderTop: `1px solid ${p.lineSoft}` }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '16px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: p.faint }}>© 2026 Vườn Văn · Học liệu Ngữ văn Tiểu học</span>
          <span style={{ fontSize: 12, color: p.faint, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="globe" size={13} stroke={p.faint} /> Truy cập tự do · Không cần đăng nhập
          </span>
        </div>
      </div>
    </footer>
  );
}

export function PublicChrome({ children }: { children: ReactNode }) {
  const { p, t, dark, setDark } = useLmsTheme();
  const auth = useLmsAuth();
  const router = useRouter();
  const pathname = usePathname();
  const push = React.useCallback((href: string) => router.push(href), [router]);

  const serif = FONTS.heading[t.headingFont] || FONTS.display;
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
        className="lms-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: block ? 44 : 36,
          width: block ? '100%' : 'auto',
          justifyContent: block ? 'flex-start' : 'center',
          padding: '0 14px',
          borderRadius: 9,
          cursor: 'pointer',
          border: 'none',
          textDecoration: 'none',
          background: on ? p.accentSoft : 'transparent',
          color: on ? p.accent : p.sub,
          fontFamily: FONTS.sans,
          fontSize: 14,
          fontWeight: on ? 600 : 500,
        }}
      >
        {block && <Icon name={it.icon} size={17} stroke={on ? p.accent : p.faint} />}
        {it.label}
      </Link>
    );
  };

  return (
    <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: p.bg, color: p.ink, fontFamily: FONTS.sans, overflow: 'hidden' }}>
      <header
        className="lms-glass"
        style={{ flexShrink: 0, borderBottom: `1px solid ${p.lineSoft}`, background: hexA(p.surface, 0.82), backdropFilter: 'saturate(1.4) blur(12px)', WebkitBackdropFilter: 'saturate(1.4) blur(12px)', zIndex: 30 }}
      >
        <div style={{ maxWidth: 1480, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', gap: 18, padding: '0 24px' }}>
          <div onClick={() => push(ROUTES.home)} style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
              V
            </div>
            <div>
              <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: p.ink, lineHeight: 1 }}>Vườn Văn</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: p.faint, marginTop: 2 }}>NGỮ VĂN TIỂU HỌC</div>
            </div>
          </div>
          <nav className="lms-hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 14 }}>
            {items.map((it) => navLink(it, false))}
          </nav>
          <div style={{ flex: 1 }} />
          <IconBtn name="search" p={p} onClick={() => push(ROUTES.library)} title="Tìm kiếm" />
          <IconBtn name={dark ? 'sun' : 'moon'} p={p} onClick={() => setDark(!dark)} title="Sáng/tối" />
          {auth && auth.loggedIn ? (
            <div className="lms-hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                title={auth.name}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, border: `1px solid ${p.line}`, background: p.surface }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: p.accentSoft, color: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontWeight: 700, fontSize: 12 }}>
                  {auth.initials}
                </div>
              </div>
              <IconBtn name="logout" p={p} onClick={() => auth.logout()} title="Đăng xuất" />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                auth && auth.open();
              }}
              className="lms-btn lms-hide-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9, cursor: 'pointer', border: 'none', background: p.accent, color: '#fff', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, boxShadow: `0 2px 0 ${p.glow}` }}
            >
              <Icon name="logout" size={15} stroke="#fff" /> Đăng nhập
            </button>
          )}
          <button
            onClick={() => push(ROUTES.dashboard)}
            className="lms-btn lms-hide-sm"
            title="Khu vực quản trị"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, cursor: 'pointer', border: `1px solid ${p.line}`, background: p.surface, color: p.sub }}
          >
            <Icon name="settings" size={16} stroke={p.sub} />
          </button>
          <button
            className="lms-hamburger lms-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9, cursor: 'pointer', border: `1px solid ${p.line}`, background: p.surface, flexShrink: 0 }}
          >
            <Icon name={menuOpen ? 'x' : 'list'} size={18} stroke={p.sub} />
          </button>
        </div>
        {menuOpen && (
          <div style={{ borderTop: `1px solid ${p.lineSoft}`, padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 4, background: p.surface }}>
            {items.map((it) => navLink(it, true))}
            <div style={{ height: 1, background: p.lineSoft, margin: '6px 0' }} />
            <button
              onClick={() => push(ROUTES.dashboard)}
              className="lms-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px', borderRadius: 9, border: 'none', background: 'transparent', color: p.sub, cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500 }}
            >
              <Icon name="settings" size={17} stroke={p.faint} /> Khu vực quản trị
            </button>
            {auth &&
              (auth.loggedIn ? (
                <button
                  onClick={() => auth.logout()}
                  className="lms-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px', borderRadius: 9, border: 'none', background: 'transparent', color: p.sub, cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500 }}
                >
                  <Icon name="logout" size={17} stroke={p.faint} /> Đăng xuất ({auth.name.split(' ').slice(-1)[0]})
                </button>
              ) : (
                <button
                  onClick={() => auth.open()}
                  className="lms-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, padding: '0 14px', borderRadius: 9, border: 'none', background: p.accent, color: '#fff', cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600 }}
                >
                  <Icon name="logout" size={17} stroke="#fff" /> Đăng nhập
                </button>
              ))}
          </div>
        )}
      </header>
      <div className="lms-scroll" ref={mainRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1 }}>{children}</main>
        <PublicFooter p={p} t={t} push={push} />
      </div>
    </div>
  );
}
