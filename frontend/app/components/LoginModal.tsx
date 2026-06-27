'use client';
import React from 'react';
import type { Auth, Palette, Tweaks } from '@/app/types';
import { IconBtn, Field, Btn } from '@/app/components/ui';
import { lblClass } from '@/app/helpers/shared';
import { ForgotPasswordModal } from '@/app/components/ForgotPasswordModal';

export function LoginModal({ p, t, auth, onClose }: { p: Palette; t: Tweaks; auth: Auth; onClose: () => void }) {
  const [tab, setTab] = React.useState('login');
  const [forgot, setForgot] = React.useState(false);
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
  if (forgot) {
    return (
      <ForgotPasswordModal
        p={p}
        t={t}
        onClose={onClose}
        onBackToLogin={() => {
          setForgot(false);
          setTab('login');
        }}
      />
    );
  }
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
            <span onClick={() => setForgot(true)} className="cursor-pointer text-[12.5px] font-semibold text-lms-accent">Quên mật khẩu?</span>
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
