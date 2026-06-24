'use client';
import React from 'react';
import type { Auth, Palette, Tweaks } from '@/app/types';
import { Icon, IconBtn, Field, Btn } from '@/app/components/ui';
import { lblClass } from '@/app/helpers/shared';

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.97 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

export function LoginModal({ p, t, auth, onClose }: { p: Palette; t: Tweaks; auth: Auth; onClose: () => void }) {
  const [tab, setTab] = React.useState('login');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const reg = tab === 'register';
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      if (reg) {
        if (pw !== pw2) throw new Error('Mật khẩu nhập lại không khớp');
        await auth.register(name, email, pw);
      } else {
        await auth.login(email, pw);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  };
  const tabBtn = (id: string, label: string) => {
    const on = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className={`h-[38px] flex-1 cursor-pointer rounded-[9px] border-0 font-sans text-[13.5px] transition-all duration-150 ${
          on ? 'bg-lms-surface font-bold text-lms-ink shadow-[0_1px_3px_rgba(15,23,38,0.12)]' : 'bg-transparent font-medium text-lms-sub'
        }`}
      >
        {label}
      </button>
    );
  };
  const ggField = (
    <button
      onClick={submit}
      className="lms-btn flex h-12 w-full cursor-pointer items-center justify-center gap-[11px] rounded-[11px] border border-lms-line bg-lms-surface font-sans text-[14.5px] font-semibold text-lms-ink"
    >
      <GoogleMark size={19} /> {reg ? 'Đăng ký' : 'Đăng nhập'} với Google
    </button>
  );
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(10,12,16,0.5)] p-5 backdrop-blur-[3px]"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !busy) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-[18px] border border-lms-line bg-lms-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.3)]"
      >
        <div className="mb-[18px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-lms-accent font-lms-heading text-[19px] font-bold text-white">
              V
            </div>
            <div className="font-lms-heading text-base font-bold text-lms-ink">Vườn Văn</div>
          </div>
          <IconBtn name="x" p={p} size={32} onClick={onClose} />
        </div>

        <h2 className="m-0 mb-1 font-lms-heading text-[22px] font-extrabold tracking-[-0.4px] text-lms-ink">
          {reg ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
        </h2>
        <p className="m-0 mb-[18px] text-[13px] leading-normal text-lms-sub">
          {reg ? 'Đăng ký miễn phí để làm bài tập và lưu tiến độ học.' : 'Đăng nhập để làm bài tập và xem phiếu học tập.'}
        </p>

        <div className="mb-5 flex gap-1 rounded-[11px] border border-lms-line bg-lms-sink p-1">
          {tabBtn('login', 'Đăng nhập')}
          {tabBtn('register', 'Đăng ký')}
        </div>

        {ggField}
        <div className="my-4 flex items-center gap-2.5">
          <div className="h-px flex-1 bg-lms-line" />
          <span className="text-[11.5px] text-lms-faint">hoặc dùng email</span>
          <div className="h-px flex-1 bg-lms-line" />
        </div>

        {reg && (
          <>
            <label className={lblClass()}>HỌ VÀ TÊN</label>
            <Field p={p} value={name} onChange={setName} placeholder="Nguyễn Văn A" icon="users" className="mt-2 mb-3.5" />
          </>
        )}
        <label className={lblClass()}>EMAIL</label>
        <Field p={p} value={email} onChange={setEmail} placeholder="ban@email.com" icon="message" className="mt-2 mb-3.5" />
        <label className={lblClass()}>MẬT KHẨU</label>
        <Field p={p} value={pw} onChange={setPw} placeholder="••••••••" type="password" icon="target" className={`mt-2 ${reg ? 'mb-3.5' : 'mb-2'}`} />
        {reg && (
          <>
            <label className={lblClass()}>NHẬP LẠI MẬT KHẨU</label>
            <Field p={p} value={pw2} onChange={setPw2} placeholder="••••••••" type="password" icon="target" className="mt-2 mb-2" />
          </>
        )}
        {!reg && (
          <div className="mb-4 text-right">
            <span className="cursor-pointer text-[12.5px] font-semibold text-lms-accent">Quên mật khẩu?</span>
          </div>
        )}

        {err && (
          <div className="mb-2.5 text-center text-[12.5px] text-lms-danger">{err}</div>
        )}
        <Btn p={p} full size="lg" icon={reg ? 'check' : 'logout'} onClick={submit} className={reg ? 'mt-2' : ''}>
          {busy ? 'Đang xử lý…' : reg ? 'Tạo tài khoản' : 'Đăng nhập'}
        </Btn>

        <p className="m-0 mt-[18px] text-center text-[13px] text-lms-sub">
          {reg ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <span onClick={() => setTab(reg ? 'login' : 'register')} className="cursor-pointer font-bold text-lms-accent">
            {reg ? 'Đăng nhập' : 'Đăng ký miễn phí'}
          </span>
        </p>
        <p className="m-0 mt-3.5 text-center text-[11px] text-lms-faint">Đăng nhập qua API · cần backend đang chạy</p>
      </div>
    </div>
  );
}
