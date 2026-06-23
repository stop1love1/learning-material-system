'use client';
// LoginModal.tsx — login / register modal with Google + email tabs. Ported from
// shell.jsx (GoogleMark, LoginModal); the Motion fade-in is dropped.
import React from 'react';
import type { Auth, Palette, Tweaks } from '@/app/types';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { Icon, IconBtn, Field, Btn } from '@/app/components/ui';
import { lblStyle } from '@/app/helpers/shared';

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.97 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

export function LoginModal({ p, t, auth, onClose }: { p: Palette; t: Tweaks; auth: Auth; onClose: () => void }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [tab, setTab] = React.useState('login');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const reg = tab === 'register';
  const tabBtn = (id: string, label: string) => {
    const on = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          flex: 1,
          height: 38,
          borderRadius: 9,
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONTS.sans,
          fontSize: 13.5,
          fontWeight: on ? 700 : 500,
          background: on ? p.surface : 'transparent',
          color: on ? p.ink : p.sub,
          boxShadow: on ? `0 1px 3px ${hexA('#0f1726', 0.12)}` : 'none',
          transition: 'all .15s',
        }}
      >
        {label}
      </button>
    );
  };
  const ggField = (
    <button
      onClick={() => auth.login()}
      className="lms-btn"
      style={{
        width: '100%',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 11,
        borderRadius: 11,
        border: `1px solid ${p.line}`,
        background: p.surface,
        color: p.ink,
        cursor: 'pointer',
        fontFamily: FONTS.sans,
        fontSize: 14.5,
        fontWeight: 600,
      }}
    >
      <GoogleMark size={19} /> {reg ? 'Đăng ký' : 'Đăng nhập'} với Google
    </button>
  );
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(10,12,16,.5)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: p.surface,
          border: `1px solid ${p.line}`,
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 24px 70px rgba(0,0,0,.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: p.accent,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: serif,
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              V
            </div>
            <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: p.ink }}>Vườn Văn</div>
          </div>
          <IconBtn name="x" p={p} size={32} onClick={onClose} />
        </div>

        <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: p.ink, letterSpacing: -0.4 }}>
          {reg ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
        </h2>
        <p style={{ fontSize: 13, color: p.sub, margin: '0 0 18px', lineHeight: 1.5 }}>
          {reg ? 'Đăng ký miễn phí để làm bài tập và lưu tiến độ học.' : 'Đăng nhập để làm bài tập và xem phiếu học tập.'}
        </p>

        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 11, background: p.sink, border: `1px solid ${p.line}`, marginBottom: 20 }}>
          {tabBtn('login', 'Đăng nhập')}
          {tabBtn('register', 'Đăng ký')}
        </div>

        {ggField}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: p.line }} />
          <span style={{ fontSize: 11.5, color: p.faint }}>hoặc dùng email</span>
          <div style={{ flex: 1, height: 1, background: p.line }} />
        </div>

        {reg && (
          <>
            <label style={lblStyle(p)}>HỌ VÀ TÊN</label>
            <Field p={p} value={name} onChange={setName} placeholder="Nguyễn Văn A" icon="users" style={{ marginTop: 8, marginBottom: 14 }} />
          </>
        )}
        <label style={lblStyle(p)}>EMAIL</label>
        <Field p={p} value={email} onChange={setEmail} placeholder="ban@email.com" icon="message" style={{ marginTop: 8, marginBottom: 14 }} />
        <label style={lblStyle(p)}>MẬT KHẨU</label>
        <Field p={p} value={pw} onChange={setPw} placeholder="••••••••" type="password" icon="target" style={{ marginTop: 8, marginBottom: reg ? 14 : 8 }} />
        {reg && (
          <>
            <label style={lblStyle(p)}>NHẬP LẠI MẬT KHẨU</label>
            <Field p={p} value={pw2} onChange={setPw2} placeholder="••••••••" type="password" icon="target" style={{ marginTop: 8, marginBottom: 8 }} />
          </>
        )}
        {!reg && (
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <span style={{ fontSize: 12.5, color: p.accent, cursor: 'pointer', fontWeight: 600 }}>Quên mật khẩu?</span>
          </div>
        )}

        <Btn p={p} full size="lg" icon={reg ? 'check' : 'logout'} onClick={() => auth.login()} style={{ marginTop: reg ? 8 : 0 }}>
          {reg ? 'Tạo tài khoản' : 'Đăng nhập'}
        </Btn>

        <p style={{ fontSize: 13, color: p.sub, textAlign: 'center', margin: '18px 0 0' }}>
          {reg ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <span onClick={() => setTab(reg ? 'login' : 'register')} style={{ color: p.accent, cursor: 'pointer', fontWeight: 700 }}>
            {reg ? 'Đăng nhập' : 'Đăng ký miễn phí'}
          </span>
        </p>
        <p style={{ fontSize: 11, color: p.faint, textAlign: 'center', margin: '14px 0 0' }}>Demo · mọi nút đều đưa bạn vào trải nghiệm</p>
      </div>
    </div>
  );
}
